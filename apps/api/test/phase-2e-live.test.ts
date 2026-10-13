import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const live = process.env.RUN_PHASE_2E_LIVE === "1";
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
