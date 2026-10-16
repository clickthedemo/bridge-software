import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { putPrimaryOrganizationLocationSchema } from "../src/schemas/organization-locations.js";

const migration = readFileSync(new URL(
    "../../../packages/database/supabase/migrations/20261013120000_phase_2d_primary_organization_location.sql",
    import.meta.url
), "utf8").replace(/\s+/g, " ").toLowerCase();

test("primary address validation requires the address, city, and country", () => {
    assert.equal(putPrimaryOrganizationLocationSchema.safeParse({
        addressLine1: "1 Bridge Way", city: "Portland", country: "US"
    }).success, true);
    assert.equal(putPrimaryOrganizationLocationSchema.safeParse({
        addressLine1: "", city: "Portland", country: "US"
    }).success, false);
});

test("primary address mutation is tenant-authorized, singular, and audited", () => {
    assert.match(migration, /has_organization_role\( p_organization_id, array\['owner'/);
    assert.match(migration, /organization_locations_one_primary_idx.*where is_primary/);
    assert.match(migration, /insert into public\.audit_logs/);
    assert.match(migration, /'organization_location'/);
    assert.match(migration, /grant execute on function public\.put_primary_organization_location.*to authenticated/);
});
