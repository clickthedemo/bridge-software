import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { presentNotification } from "../src/services/notification-content.js";

const id = "078a0f42-ba31-4b36-9189-52181e1dbdb3";
const base = { title: "Legacy title", body: "Legacy body", resourceType: "directory_profile", resourceId: id };
const profile = { displayName: "Evergreen Brand", organizationName: "Evergreen Group", recordType: "Directory profile", slug: "evergreen-brand" };

test("profile notifications include safe identity and contextual destinations", () => {
    const submitted = presentNotification({ ...base, type: "profile_submitted" }, profile);
    assert.equal(submitted.body, "Evergreen Brand submitted its Directory profile for review.");
    assert.equal(submitted.action?.label, "Review profile");
    assert.match(submitted.action?.href ?? "", /^\/admin\/directory-profiles\?profileId=/);
    const approved = presentNotification({ ...base, type: "profile_approved" }, profile);
    assert.deepEqual(approved.action, { label: "View public profile", href: "/profile/evergreen-brand" });
});

test("resubmission and correction notifications include permitted reasons", () => {
    const context = { ...profile, reason: "Clarify the licence region" };
    assert.match(presentNotification({ ...base, type: "profile_resubmitted" }, context).body, /Clarify the licence region/);
    const correction = presentNotification({ ...base, type: "profile_correction_requested" }, context);
    assert.match(correction.body, /requested corrections for Evergreen Brand/);
    assert.equal(correction.action?.label, "Edit profile");
});

test("contact notification uses requester identity and exact request destination", () => {
    const item = presentNotification({ ...base, type: "contact_request_received", resourceType: "contact_request" }, { displayName: "John Smith", organizationName: "Evergreen Brand" });
    assert.equal(item.body, "John Smith sent a contact request regarding Evergreen Brand.");
    assert.match(item.action?.href ?? "", new RegExp(`requestId=${id}`));
});

test("verification notification identifies business without exposing protected values", () => {
    const item = presentNotification({ ...base, type: "verification_ready", resourceType: "verification_item" }, { displayName: "Evergreen Brand", organizationName: "Evergreen Group", recordType: "EIN" });
    assert.equal(item.action?.label, "Review verification");
    assert.doesNotMatch(JSON.stringify(item), /email|licence_number|evidence|provider/i);
});

test("removed or inaccessible and missing-metadata records have no broken action", () => {
    for (const context of [null, { organizationName: "Hidden tenant" }]) {
        const item = presentNotification({ ...base, type: "profile_submitted" }, context);
        assert.equal(item.body, "This record is no longer available");
        assert.equal(item.action, null);
    }
});

test("notification enrichment is bounded by recipient-authorized resource IDs", () => {
    const service = readFileSync(new URL("../src/services/notifications.ts", import.meta.url), "utf8");
    assert.match(service, /createUserScopedSupabaseClient\(token\).*from\("notifications"\)/s);
    assert.match(service, /\.in\("id", profileIds\)/);
    assert.doesNotMatch(service, /select\([^)]*(ein_last_four|work_email|phone_number|evidence|provider_response)/);
});
