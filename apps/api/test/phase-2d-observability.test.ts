import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL(
    "../../../packages/database/supabase/migrations/20261013123000_service_role_phase_2d_read_grants.sql",
    import.meta.url
), "utf8").replace(/\s+/g, " ").toLowerCase();

test("Phase 2D internal workflow evidence is readable only by the service role", () => {
    for (const table of ["organization_locations", "verification_items", "directory_profile_history", "notifications", "transactional_email_outbox"]) {
        assert.match(migration, new RegExp(`grant select on table public\\.${table} to service_role`));
    }
    assert.doesNotMatch(migration, /grant [^;]+ to (?:anon|authenticated)/);
});
