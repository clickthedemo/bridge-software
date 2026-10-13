import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { putBusinessContactSchema } from "../src/schemas/businesses.js";

const migration = readFileSync(new URL("../../../packages/database/supabase/migrations/20261013131000_phase_2e_private_business_contact.sql", import.meta.url), "utf8").replace(/\s+/g, " ").toLowerCase();

test("private business contact is validated, tenant-admin scoped, and audited", () => {
    assert.equal(putBusinessContactSchema.safeParse({ email: "private@example.com", phone: "+1 503 555 0100" }).success, true);
    assert.equal(putBusinessContactSchema.safeParse({ email: "bad", phone: "1" }).success, false);
    assert.match(migration, /public\.is_organization_admin\(p_organization_id\)/);
    assert.match(migration, /'business_contact'/);
});

test("submission readiness uses private business contact rather than public profile contact", () => {
    assert.match(migration, /business\.contact_phone/);
    assert.match(migration, /business\.contact_email/);
    const readiness = migration.slice(migration.indexOf("get_directory_profile_submission_missing_fields"));
    assert.doesNotMatch(readiness, /profile\.public_(?:email|phone)/);
});
