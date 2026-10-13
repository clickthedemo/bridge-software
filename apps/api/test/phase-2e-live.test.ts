import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const live = process.env.RUN_PHASE_2E_LIVE === "1";
const phase2fLive = process.env.RUN_PHASE_2F_LIVE === "1";
const projectRef = "vevfiwophiawyawmajeq";
const ownerEmail = "bridge.phase2b.member.20261012@example.com";
const adminEmail = "bridge.phase2b.admin.20261012@example.com";
const apiBase = "http://127.0.0.1:4000/api/v1";

type Json = Record<string, unknown>;
type ProfileFixture = {
    organizationName: string;
    organizationType: "retailer" | "dispensary";
    businessLegalName: string;
    slug: string;
    displayName: string;
    summary: string;
    story: string;
    category: string;
    city: string;
    state: string;
    region: string;
    publicEmail: string | null;
    publicPhone: string | null;
    ein: string;
};

const fixtures: ProfileFixture[] = [
    {
        organizationName: "Phase 2E Aurora Retail Organization", organizationType: "retailer",
        businessLegalName: "Aurora Retail Market LLC", slug: "phase-2e-aurora-retail",
        displayName: "Aurora Retail Market", summary: "Independent retail sourcing for craft producers.",
        story: "Aurora connects neighborhood shelves with regional makers.", category: "Retail",
        city: "Bend", state: "OR", region: "Central Oregon", publicEmail: null, publicPhone: null,
        ein: "000000011"
    },
    {
        organizationName: "Phase 2E Cedar Dispensary Organization", organizationType: "dispensary",
        businessLegalName: "Cedar Dispensary LLC", slug: "phase-2e-cedar-dispensary",
        displayName: "Cedar Dispensary", summary: "Wellness-focused dispensary serving Eugene.",
        story: "Cedar provides careful education and a welcoming local experience.", category: "Wellness",
        city: "Eugene", state: "OR", region: "Willamette Valley",
        publicEmail: "directory.public@example.com", publicPhone: "+1 541 555 0142",
        ein: "000000012"
    }
];

const asObject = (value: unknown): Json => value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const request = async (path: string, token?: string, method = "GET", body?: unknown) => {
    const response = await fetch(`${apiBase}${path}`, {
        method,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    return { response, body: text ? asObject(JSON.parse(text)) : {} };
};

test("Phase 2E live public Directory contract", { skip: !live, timeout: 120_000 }, async () => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.ok(url && anonKey && serviceKey);
    assert.equal(new URL(url).hostname.split(".")[0], projectRef);
    assert.equal(process.env.ENABLE_DEVELOPMENT_BOOTSTRAP, "false");

    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userPage, error: usersError } = await service.auth.admin.listUsers({ page: 1, perPage: 100 });
    assert.equal(usersError, null);
    const users = new Map(userPage.users.map((user) => [user.email, user]));
    const authenticate = async (email: string) => {
        const user = users.get(email); assert.ok(user);
        const password = `B2E!${randomBytes(24).toString("base64url")}aA1`;
        const updated = await service.auth.admin.updateUserById(user.id, { password, email_confirm: true });
        assert.equal(updated.error, null);
        const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const signedIn = await client.auth.signInWithPassword({ email, password });
        assert.equal(signedIn.error, null); assert.ok(signedIn.data.session);
        return signedIn.data.session.access_token;
    };
    const ownerToken = await authenticate(ownerEmail);
    const adminToken = await authenticate(adminEmail);

    const organizationsResult = await request("/organizations", ownerToken);
    assert.equal(organizationsResult.response.status, 200);
    const knownOrganizations = Array.isArray(organizationsResult.body.organizations) ? organizationsResult.body.organizations.map(asObject) : [];

    for (const fixture of fixtures) {
        let organization = knownOrganizations.find((candidate) => candidate.name === fixture.organizationName);
        if (!organization) {
            const created = await request("/organizations", ownerToken, "POST", { name: fixture.organizationName, organizationType: fixture.organizationType });
            assert.equal(created.response.status, 201); organization = asObject(created.body.organization);
        }
        const organizationId = String(organization.id);
        const businessesResult = await request(`/organizations/${organizationId}/businesses`, ownerToken);
        assert.equal(businessesResult.response.status, 200);
        let business = (Array.isArray(businessesResult.body.businesses) ? businessesResult.body.businesses.map(asObject) : []).find((candidate) => candidate.legalName === fixture.businessLegalName);
        if (!business) {
            const created = await request(`/organizations/${organizationId}/businesses`, ownerToken, "POST", { legalName: fixture.businessLegalName, dbaName: fixture.displayName });
            assert.equal(created.response.status, 201); business = asObject(created.body.business);
        }
        const businessId = String(business.id);
        assert.equal((await request(`/organizations/${organizationId}/primary-location`, ownerToken, "PUT", { addressLine1: "100 Development Way", city: fixture.city, state: fixture.state, postalCode: "97000", country: "US" })).response.status, 200);
        assert.equal((await request(`/organizations/${organizationId}/businesses/${businessId}/contact`, ownerToken, "PUT", { email: `private.${fixture.slug}@example.com`, phone: "+1 503 555 0100" })).response.status, 200);

        const existingProfile = await request(`/organizations/${organizationId}/directory-profile`, ownerToken);
        if (existingProfile.response.status !== 200 || asObject(existingProfile.body.profile).status !== "approved") {
            assert.equal((await request(`/organizations/${organizationId}/businesses/${businessId}/ein`, ownerToken, "PUT", { ein: fixture.ein })).response.status, 200);
            const verificationQueue = await request(`/admin/verification-queue?organizationId=${organizationId}&itemType=ein`, adminToken);
            assert.equal(verificationQueue.response.status, 200);
            const item = (Array.isArray(verificationQueue.body.entries) ? verificationQueue.body.entries.map(asObject) : []).find((entry) => entry.businessId === businessId && entry.status !== "verified");
            if (item) assert.equal((await request(`/admin/verification-items/${item.verificationItemId}/review`, adminToken, "POST", { decision: "verified" })).response.status, 200);
            const saved = await request(`/organizations/${organizationId}/directory-profile`, ownerToken, "PUT", {
                businessId, slug: fixture.slug, displayName: fixture.displayName, summary: fixture.summary,
                story: fixture.story, businessType: fixture.organizationType, categories: [fixture.category],
                city: fixture.city, state: fixture.state, region: fixture.region,
                publicEmail: fixture.publicEmail, publicPhone: fixture.publicPhone,
                licenseType: "State retail licence", licenseNumber: `DEV-${fixture.slug}`,
                links: [{ type: "website", label: "Website", url: `https://example.com/${fixture.slug}`, sortOrder: 0 }]
            });
            assert.equal(saved.response.status, 200);
            const readiness = await request(`/organizations/${organizationId}/directory-profile/submission-readiness`, ownerToken);
            assert.equal(readiness.response.status, 200); assert.equal(readiness.body.ready, true);
            const submitted = await request(`/organizations/${organizationId}/directory-profile/submit`, ownerToken, "POST");
            assert.equal(submitted.response.status, 200);
            const profileId = String(asObject(submitted.body.profile).id);
            assert.equal((await request(`/admin/directory-profiles/${profileId}/approve`, adminToken, "POST")).response.status, 200);
        }
    }

    const list = async (query = "") => request(`/directory/profiles${query ? `?${query}` : ""}`);
    for (const query of [
        "q=Aurora+Retail+Market", "q=aurora", "q=AURORA", "q=++Aurora++",
        "q=craft+producers", "q=regional+makers", "q=Wellness",
        "organizationType=retailer", "category=wellness", "city=Eugene", "state=or", "region=central+oregon",
        "q=retail&organizationType=retailer&category=Retail&city=Bend&state=OR&region=Central+Oregon"
    ]) {
        const result = await list(query); assert.equal(result.response.status, 200, query); assert.ok(Array.isArray(result.body.profiles) && result.body.profiles.length > 0, query);
    }
    for (const query of ["q=no-such-profile", "category=Unknown", "city=Nowhere", "q=%25", "q='OR+1%3D1+--"]) {
        const result = await list(query); assert.equal(result.response.status, 200, query); assert.deepEqual(result.body.profiles, [], query);
    }
    for (const query of ["organizationType=invalid", "limit=0", "limit=51", `q=${"x".repeat(101)}`, "page=0", "page=-1", "cursor=invalid"]) {
        assert.equal((await list(query)).response.status, 400, query);
    }

    const first = await list("limit=1&sort=name_asc");
    assert.equal(first.response.status, 200); const firstProfiles = first.body.profiles as Json[];
    const firstInfo = asObject(first.body.pageInfo); assert.equal(firstProfiles.length, 1); assert.equal(firstInfo.hasMore, true); assert.equal(typeof firstInfo.nextCursor, "string");
    const second = await list(`limit=1&sort=name_asc&cursor=${encodeURIComponent(String(firstInfo.nextCursor))}`);
    assert.equal(second.response.status, 200); const secondProfiles = second.body.profiles as Json[];
    assert.notEqual(firstProfiles[0]?.slug, secondProfiles[0]?.slug);

    const approved = await request("/directory/profiles/phase-2c-bridge-brand");
    assert.equal(approved.response.status, 200);
    const rejected = await request("/directory/profiles/phase-2d-rejection-profile");
    assert.equal(rejected.response.status, 404);
    const privateNames = /ein|cipher|provider|document|user_id|organization_id|business_id|membership|reason|audit|notification|outbox|submitted|reviewed|status|address_line/i;
    assert.doesNotMatch(JSON.stringify(approved.body), privateNames);

    const privateContact = await request("/directory/profiles/phase-2e-aurora-retail");
    assert.equal(privateContact.response.status, 200);
    assert.deepEqual(asObject(asObject(privateContact.body.profile).publicContact), { email: null, phone: null });
    const publicContact = await request("/directory/profiles/phase-2e-cedar-dispensary");
    assert.equal(publicContact.response.status, 200);
    assert.equal(asObject(asObject(publicContact.body.profile).publicContact).email, "directory.public@example.com");
});

test("Phase 2F live media, contact, notification, preference, and outbox contract", { skip: !phase2fLive, timeout: 120_000 }, async () => {
    const url = process.env.SUPABASE_URL; const anonKey = process.env.SUPABASE_ANON_KEY; const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.ok(url && anonKey && serviceKey); assert.equal(new URL(url).hostname.split(".")[0], projectRef); assert.equal(process.env.ENABLE_DEVELOPMENT_BOOTSTRAP, "false");
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const users = await service.auth.admin.listUsers({ page: 1, perPage: 100 }); assert.equal(users.error, null);
    const byEmail = new Map(users.data.users.map((user) => [user.email, user]));
    const authenticate = async (email: string) => {
        const user = byEmail.get(email); assert.ok(user); const password = `B2F!${randomBytes(24).toString("base64url")}aA1`;
        assert.equal((await service.auth.admin.updateUserById(user.id, { password, email_confirm: true })).error, null);
        const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const result = await client.auth.signInWithPassword({ email, password }); assert.equal(result.error, null); assert.ok(result.data.session); return result.data.session.access_token;
    };
    const ownerToken = await authenticate(ownerEmail); const adminToken = await authenticate(adminEmail);
    const organizations = await request("/organizations", ownerToken); assert.equal(organizations.response.status, 200);
    const items = (organizations.body.organizations as Json[]).map(asObject);
    const auroraId = String(items.find((item) => item.name === fixtures[0].organizationName)?.id);
    const cedarId = String(items.find((item) => item.name === fixtures[1].organizationName)?.id);
    assert.match(auroraId, /^[0-9a-f-]{36}$/); assert.match(cedarId, /^[0-9a-f-]{36}$/);

    const beforeLogo = await request("/directory/profiles/phase-2e-aurora-retail"); assert.equal(beforeLogo.response.status, 200);
    if (!asObject(beforeLogo.body.profile).logoUrl) {
    const uploadBytes: Record<string, Uint8Array> = {
        "image/png": new Uint8Array([137,80,78,71,13,10,26,10,0]),
        "image/jpeg": new Uint8Array([255,216,255,217]),
        "image/webp": new Uint8Array([82,73,70,70,4,0,0,0,87,69,66,80])
    };
    assert.equal((await request(`/organizations/${auroraId}/directory-profile/logo/upload`, ownerToken, "POST", { contentType: "image/svg+xml", fileSize: 10 })).response.status, 400);
    assert.equal((await request(`/organizations/${auroraId}/directory-profile/logo/upload`, ownerToken, "POST", { contentType: "image/png", fileSize: 0 })).response.status, 400);
    assert.equal((await request(`/organizations/${auroraId}/directory-profile/logo/upload`, ownerToken, "POST", { contentType: "image/png", fileSize: 2097153 })).response.status, 400);
    assert.equal((await request(`/organizations/${auroraId}/directory-profile/logo/upload`, ownerToken, "POST", { contentType: "image/png", fileSize: 10, filename: "chosen.png" })).response.status, 400);

    const invalid = await request(`/organizations/${auroraId}/directory-profile/logo/upload`, ownerToken, "POST", { contentType: "image/png", fileSize: 4 });
    assert.equal(invalid.response.status, 201, String(invalid.body.error)); const invalidUpload = asObject(invalid.body.upload);
    assert.equal((await fetch(String(invalidUpload.signedUrl), { method: "PUT", headers: invalidUpload.requiredHeaders as Record<string, string>, body: new Uint8Array([1,2,3,4]) })).ok, true);
    assert.equal((await request(`/organizations/${auroraId}/directory-profile/logo/complete`, ownerToken, "POST", { uploadId: invalidUpload.uploadId })).response.status, 422);

    let finalUploadId = "";
    for (const [contentType, bytes] of Object.entries(uploadBytes)) {
        const contract = await request(`/organizations/${auroraId}/directory-profile/logo/upload`, ownerToken, "POST", { contentType, fileSize: bytes.byteLength });
        assert.equal(contract.response.status, 201); const upload = asObject(contract.body.upload); finalUploadId = String(upload.uploadId);
        assert.equal((await fetch(String(upload.signedUrl), { method: "PUT", headers: upload.requiredHeaders as Record<string, string>, body: bytes })).ok, true);
        assert.equal((await request(`/organizations/${auroraId}/directory-profile/logo/complete`, ownerToken, "POST", { uploadId: finalUploadId })).response.status, 200);
    }
    assert.equal((await request(`/organizations/${auroraId}/directory-profile/logo/complete`, ownerToken, "POST", { uploadId: finalUploadId })).response.status, 409);
    const duringDraft = await request("/directory/profiles/phase-2e-aurora-retail"); assert.equal(duringDraft.response.status, 200);
    assert.deepEqual(asObject(duringDraft.body.profile).logoUrl, asObject(beforeLogo.body.profile).logoUrl);
    assert.equal((await request(`/organizations/${auroraId}/directory-profile/submit`, ownerToken, "POST")).response.status, 200);
    const protectedProfile = await request(`/organizations/${auroraId}/directory-profile`, ownerToken); const profileId = String(asObject(protectedProfile.body.profile).id);
    assert.equal((await request(`/admin/directory-profiles/${profileId}/approve`, adminToken, "POST")).response.status, 200);
    const afterLogo = await request("/directory/profiles/phase-2e-aurora-retail"); const publicLogoUrl = String(asObject(afterLogo.body.profile).logoUrl);
    assert.equal(publicLogoUrl, "/api/v1/directory/profiles/phase-2e-aurora-retail/logo"); assert.doesNotMatch(JSON.stringify(afterLogo.body), /token|signature|directory-media/i);
    }

    assert.equal((await request(`/organizations/${cedarId}/members`, ownerToken, "POST", { email: adminEmail, role: "member" })).response.status, 200);
    const preferences = { profile: { inApp: true, email: true }, contact: { inApp: true, email: true }, verification: { inApp: true, email: true } };
    assert.equal((await request("/notification-preferences", ownerToken, "PUT", preferences)).response.status, 200);
    assert.equal((await request("/notification-preferences", adminToken, "PUT", preferences)).response.status, 200);
    const idempotencyKey = randomUUID(); const contactBody = { idempotencyKey, firstName: "Phase", workEmail: "phase2f@example.com", phoneNumber: "+1 503 555 0199", yearsOfService: 5, contactPreference: "email", subject: "Phase 2F connection", message: "Please connect our development businesses." };
    const created = await request("/directory/profiles/phase-2e-aurora-retail/contact-requests", adminToken, "POST", contactBody); assert.equal(created.response.status, 201);
    const duplicate = await request("/directory/profiles/phase-2e-aurora-retail/contact-requests", adminToken, "POST", contactBody); assert.equal(duplicate.response.status, 201);
    const requestId = String(asObject(created.body.request).id); assert.equal(asObject(duplicate.body.request).id, requestId);
    assert.equal((await request("/directory/profiles/phase-2d-rejection-profile/contact-requests", adminToken, "POST", { ...contactBody, idempotencyKey: randomUUID() })).response.status, 404);
    assert.equal((await request("/directory/profiles/phase-2e-aurora-retail/contact-requests", undefined, "POST", { ...contactBody, idempotencyKey: randomUUID() })).response.status, 401);
    const inbox = await request(`/organizations/${auroraId}/contact-requests`, ownerToken); assert.equal(inbox.response.status, 200);
    const inboxItem = (inbox.body.requests as Json[]).map(asObject).find((item) => item.id === requestId); assert.equal(inboxItem?.subject, contactBody.subject); assert.equal("recipientUserId" in (inboxItem ?? {}), false);
    assert.equal((await request(`/organizations/${cedarId}/contact-requests`, adminToken)).response.status, 403);
    const sent = await request("/contact-requests/sent", adminToken); assert.equal(sent.response.status, 200);
    assert.ok((sent.body.requests as Json[]).some((item) => asObject(item).id === requestId));
    assert.equal((await request(`/organizations/${auroraId}/contact-requests/${requestId}/status`, ownerToken, "POST", { status: "viewed" })).response.status, 200);
    assert.equal((await request(`/organizations/${auroraId}/contact-requests/${requestId}/status`, ownerToken, "POST", { status: "responded" })).response.status, 200);
    assert.equal((await request(`/organizations/${auroraId}/contact-requests/${requestId}/status`, ownerToken, "POST", { status: "viewed" })).response.status, 409);
    assert.equal((await request(`/organizations/${auroraId}/contact-requests/${requestId}/status`, ownerToken, "POST", { status: "closed" })).response.status, 200);

    const ownerNotifications = await request("/notifications?limit=50&offset=0&unreadOnly=false", ownerToken); assert.equal(ownerNotifications.response.status, 200);
    const routed = (ownerNotifications.body.notifications as Json[]).map(asObject).find((item) => item.resourceId === requestId); assert.ok(routed); assert.doesNotMatch(JSON.stringify(routed), /email|phone|ein|evidence|outbox|recipient/i);
    assert.equal((await request(`/notifications/${routed.id}/read`, ownerToken, "POST")).response.status, 200);
    assert.equal((await request(`/notifications/${routed.id}/read`, adminToken, "POST")).response.status, 404);
    assert.equal((await request("/notifications/read-all", ownerToken, "POST")).response.status, 200);
    assert.equal((await request("/notifications?limit=1&offset=0&unreadOnly=true", ownerToken)).response.status, 200);
    assert.equal((await request("/notification-preferences", ownerToken)).response.status, 200);
    assert.equal((await request("/notification-preferences", ownerToken, "PUT", { ...preferences, unknown: true })).response.status, 400);

    const ownerUser = byEmail.get(ownerEmail); assert.ok(ownerUser);
    const beforeSuppressedNotifications = await service.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_user_id", ownerUser.id);
    const beforeSuppressedOutbox = await service.from("transactional_email_outbox").select("id", { count: "exact", head: true }).eq("recipient_user_id", ownerUser.id);
    assert.equal(beforeSuppressedNotifications.error, null); assert.equal(beforeSuppressedOutbox.error, null);
    const disabled = { ...preferences, contact: { inApp: false, email: false } };
    assert.equal((await request("/notification-preferences", ownerToken, "PUT", disabled)).response.status, 200);
    const suppressed = await request("/directory/profiles/phase-2e-aurora-retail/contact-requests", adminToken, "POST", { ...contactBody, idempotencyKey: randomUUID(), subject: "Suppressed preference check" });
    assert.equal(suppressed.response.status, 201);
    const afterSuppressedNotifications = await service.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_user_id", ownerUser.id);
    const afterSuppressedOutbox = await service.from("transactional_email_outbox").select("id", { count: "exact", head: true }).eq("recipient_user_id", ownerUser.id);
    assert.equal(afterSuppressedNotifications.count, beforeSuppressedNotifications.count);
    assert.equal(afterSuppressedOutbox.count, beforeSuppressedOutbox.count);
    assert.equal((await request("/notification-preferences", ownerToken, "PUT", preferences)).response.status, 200);

    const history = await service.from("contact_request_history").select("id").eq("contact_request_id", requestId);
    assert.equal(history.error, null); const eventIds = (history.data ?? []).map((row) => row.id);
    const { data: outbox, error: outboxError } = await service.from("transactional_email_outbox").select("template_key,template_variables,source_event_id,status,attempt_count,next_attempt_at").in("source_event_id", eventIds);
    assert.equal(outboxError, null); assert.ok((outbox ?? []).length >= 1); assert.doesNotMatch(JSON.stringify(outbox), /ein|evidence|password|phone/i);
});
