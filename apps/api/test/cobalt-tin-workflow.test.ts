import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
    new URL("../../../packages/database/supabase/migrations/20261014120000_cobalt_tin_verification.sql", import.meta.url),
    "utf8"
).replace(/\s+/g, " ").toLowerCase();
const route = readFileSync(new URL("../src/routes/v1/ein.ts", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/services/ein.ts", import.meta.url), "utf8");

test("TIN checks are platform-admin-only and retain self-review protection", () => {
    assert.match(route, /requirePermission\("admin:verification_review"\)/);
    assert.doesNotMatch(route, /requireAnyOrganizationPermission/);
    assert.match(migration, /role = 'admin'::public\.platform_role/);
    assert.match(migration, /administrators cannot review their own organization submission/);
});

test("rapid duplicates are reused and live attempts are rate limited", () => {
    assert.match(migration, /ein_verifications_active_fingerprint_idx/);
    assert.match(migration, /request_fingerprint = p_request_fingerprint/);
    assert.match(migration, /false, prior_attempt\.provider_reference/);
    assert.match(migration, /interval '5 minutes'/);
    assert.match(migration, /raise sqlstate 'p0004'/);
});

test("unapplied workflow migration names mock mode and retains guarded live mode", () => {
    assert.match(migration, /provider_mode in \('mock', 'live'\)/);
    assert.doesNotMatch(migration, /provider_mode in \('test', 'live'\)/);
});

test("identity changes require a new check and approval requires a current match", () => {
    assert.match(migration, /businesses_invalidate_ein_check/);
    assert.match(migration, /new\.legal_name is distinct from old\.legal_name/);
    assert.match(migration, /new\.ein_last_four is distinct from old\.ein_last_four/);
    assert.match(migration, /a current ein match is required before approval/);
    assert.match(migration, /ev\.completed_at >= b\.ein_identity_updated_at/);
});

test("audit storage excludes raw payload and plaintext EIN", () => {
    assert.doesNotMatch(migration, /(add column|insert into)[^;]*provider_response/);
    assert.doesNotMatch(migration, /drop column/);
    assert.doesNotMatch(migration, /jsonb_build_object\([^)]*ein_last_four/);
    assert.match(service, /createHmac/);
    assert.doesNotMatch(service, /rawResponse/);
});

test("manual review remains explicit and provider match never auto-approves", () => {
    assert.match(service, /result\.status === "name_mismatch"/);
    assert.match(service, /: "in_review"/);
    assert.doesNotMatch(service, /p_item_status: result\.status/);
    assert.match(migration, /p_item_status not in \('in_review', 'correction_required'\)/);
});
