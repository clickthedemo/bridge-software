import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL(
    "../../../packages/database/supabase/migrations/20261013121000_phase_2d_submission_notifications.sql",
    import.meta.url
), "utf8").replace(/\s+/g, " ").toLowerCase();

test("submission and resubmission notify platform administrators through the durable outbox", () => {
    assert.match(migration, /profile_submitted/);
    assert.match(migration, /profile_resubmitted/);
    assert.match(migration, /new\.action in \('submitted', 'resubmitted'\)/);
    assert.match(migration, /from public\.user_platform_roles/);
    assert.match(migration, /perform public\.enqueue_user_notification/);
    assert.match(migration, /directory_profile_history/);
});
