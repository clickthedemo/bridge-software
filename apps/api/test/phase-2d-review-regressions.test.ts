import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL(
    "../../../packages/database/supabase/migrations/20261013122000_fix_directory_review_profile_id_ambiguity.sql",
    import.meta.url
), "utf8").replace(/\s+/g, " ").toLowerCase();

test("directory approval resolves the profile_id output-column collision", () => {
    assert.match(migration, /pg_get_functiondef/);
    assert.match(migration, /where versions\.profile_id = target_profile\.id/);
    assert.match(migration, /expected directory review function fragment was not found/);
});
