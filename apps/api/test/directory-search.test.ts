import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://test-project.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.EMAIL_VERIFICATION_REDIRECT_URL =
    "https://frontend.example.test/login?verified=true";
process.env.PASSWORD_RESET_REDIRECT_URL = "http://localhost:5173/reset-password";

const { publicDirectoryProfilesQuerySchema } = await import(
    "../src/schemas/directory-profiles.js"
);
const {
    DirectoryProfileServiceError,
    decodeDirectoryCursor,
    projectPublicDirectoryProfilesPage
} = await import("../src/services/directory-profiles.js");
const { createListPublicDirectoryProfilesHandler } = await import(
    "../src/routes/v1/directory-profiles.js"
);

const migration = readFileSync(
    new URL(
        "../../../packages/database/supabase/migrations/20261013130000_phase_2e_public_directory_search.sql",
        import.meta.url
    ),
    "utf8"
).replace(/\s+/g, " ").toLowerCase();

const approvedOnlyMigration = readFileSync(
    new URL(
        "../../../packages/database/supabase/migrations/20261013132000_phase_2e_approved_only_public_visibility.sql",
        import.meta.url
    ),
    "utf8"
).replace(/\s+/g, " ").toLowerCase();

const row = (name: string, slug: string) => ({
    slug,
    display_name: name,
    summary: `${name} summary`,
    story: null, business_type: "brand", categories: ["Cultivation"],
    city: "Portland", state: "Oregon", region: null, public_email: null, public_phone: null,
    license_type: null, license_number: null,
    links: [{ type: "website", label: "Website", url: `https://${slug}.example.com`, sortOrder: 0 }],
    legal_name: `${name} LLC`, dba_name: `${name} DBA`,
    business_name: `${name} DBA`,
    verified: true,
    has_logo: false,
    cursor_name: name.toLowerCase()
});

test("public list query has stable defaults and trims search", () => {
    assert.deepEqual(publicDirectoryProfilesQuerySchema.parse({}), {
        sort: "name_asc",
        limit: 20
    });
    assert.equal(
        publicDirectoryProfilesQuerySchema.parse({ q: "  Green Co  " }).q,
        "Green Co"
    );
});

test("public list handler returns the service pagination contract", async () => {
    const expected = {
        profiles: [{
            slug: "alpha",
            displayName: "Alpha",
            summary: null,
            websiteUrl: null,
            businessName: "Alpha LLC",
            verified: true as const,
            logoUrl: null
        }],
        pageInfo: { nextCursor: null, hasMore: false }
    };
    let received: unknown;
    let statusCode = 0;
    let responseBody: unknown;
    const handler = createListPublicDirectoryProfilesHandler(async (query) => {
        received = query;
        return expected;
    });
    const response = {
        locals: {
            validatedQuery: { sort: "name_asc", limit: 20, q: "alpha" }
        },
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(body: unknown) {
            responseBody = body;
            return this;
        }
    };

    await handler({} as never, response as never, (() => undefined) as never);
    assert.deepEqual(received, response.locals.validatedQuery);
    assert.equal(statusCode, 200);
    assert.deepEqual(responseBody, expected);
});

test("query validation bounds search, limit, cursor, sort, and filter", () => {
    assert.equal(
        publicDirectoryProfilesQuerySchema.safeParse({ limit: "0" }).success,
        false
    );
    assert.equal(
        publicDirectoryProfilesQuerySchema.safeParse({ limit: "51" }).success,
        false
    );
    assert.equal(
        publicDirectoryProfilesQuerySchema.safeParse({ sort: "newest" }).success,
        false
    );
    assert.equal(
        publicDirectoryProfilesQuerySchema.safeParse({ organizationType: "b2b" })
            .success,
        false
    );
    assert.equal(publicDirectoryProfilesQuerySchema.safeParse({ category: "flower" }).success, true);
    assert.equal(publicDirectoryProfilesQuerySchema.safeParse({ page: "0" }).success, false);
    assert.equal(publicDirectoryProfilesQuerySchema.safeParse({ page: "-1" }).success, false);
    assert.equal(publicDirectoryProfilesQuerySchema.safeParse({ q: "" }).success, true);
    assert.equal(publicDirectoryProfilesQuerySchema.safeParse({ q: "%' OR 1=1 --" }).success, true);
    assert.equal(
        publicDirectoryProfilesQuerySchema.safeParse({ q: "x".repeat(101) })
            .success,
        false
    );
});

test("first page returns an opaque cursor without leaking cursor fields", () => {
    const result = projectPublicDirectoryProfilesPage(
        [row("Alpha", "alpha"), row("Beta", "beta"), row("Gamma", "gamma")],
        { sort: "name_asc", limit: 2 }
    );

    assert.equal(result.pageInfo.hasMore, true);
    assert.ok(result.pageInfo.nextCursor);
    assert.deepEqual(result.profiles.map((profile) => profile.slug), [
        "alpha",
        "beta"
    ]);
    assert.equal(result.profiles[0]?.categories[0], "Cultivation");

    const cursor = decodeDirectoryCursor(
        result.pageInfo.nextCursor ?? undefined,
        "name_asc"
    );
    assert.deepEqual(cursor, { sort: "name_asc", name: "beta", slug: "beta" });
});

test("subsequent and final pages contain no prior row and no next cursor", () => {
    const result = projectPublicDirectoryProfilesPage(
        [row("Gamma", "gamma")],
        { sort: "name_asc", limit: 2 }
    );
    assert.deepEqual(result.profiles.map((profile) => profile.slug), ["gamma"]);
    assert.equal(result.pageInfo.hasMore, false);
    assert.equal(result.pageInfo.nextCursor, null);
});

test("cursor rejects malformed payloads and a different selected sort", () => {
    assert.throws(
        () => decodeDirectoryCursor("not-json", "name_asc"),
        (error) => error instanceof DirectoryProfileServiceError
            && error.code === "DIRECTORY_PROFILE_INVALID_CURSOR"
    );
    const cursor = projectPublicDirectoryProfilesPage(
        [row("Alpha", "alpha"), row("Beta", "beta")],
        { sort: "name_asc", limit: 1 }
    ).pageInfo.nextCursor;
    assert.throws(
        () => decodeDirectoryCursor(cursor ?? undefined, "name_desc"),
        (error) => error instanceof DirectoryProfileServiceError
            && error.code === "DIRECTORY_PROFILE_INVALID_CURSOR"
    );
});

test("database list reads only the current immutable published snapshot", () => {
    assert.match(migration, /join public\.directory_profile_versions v on v\.id = p\.published_version_id/);
    assert.match(migration, /v\.profile_id = p\.id and v\.is_published/);
    assert.doesNotMatch(migration, /select p\.display_name/);
});

test("eligibility excludes suspended, inactive, and no-longer-verified profiles", () => {
    assert.match(migration, /p\.status <> 'suspended'/);
    assert.match(migration, /o\.status = 'active'/);
    assert.match(migration, /b\.status = 'active'/);
    assert.match(migration, /public\.is_business_ein_verified\(b\.id\)/);
});

test("list and slug lookup require the current profile state to be approved", () => {
    assert.match(
        approvedOnlyMigration,
        /p\.status = ''approved''::public\.directory_profile_status/
    );
    assert.match(
        approvedOnlyMigration,
        /and p\.status = 'approved'::public\.directory_profile_status/
    );
    assert.doesNotMatch(
        approvedOnlyMigration,
        /where v\.slug = lower\(btrim\(p_slug\)\)\s+and p\.status <>/
    );
});

test("search covers published display/summary and legal/DBA names case-insensitively", () => {
    assert.match(migration, /v\.display_name ilike/);
    assert.match(migration, /coalesce\(v\.summary, ''\) ilike/);
    assert.match(migration, /v\.legal_name ilike/);
    assert.match(migration, /coalesce\(v\.dba_name, ''\) ilike/);
    assert.match(migration, /replace\(replace\(replace\(normalized/);
});

test("business type, category, and normalized location filters are supported", () => {
    assert.match(migration, /v\.business_type = p_organization_type/);
    assert.match(migration, /lower\(c\.category\) = lower\(normalized_category\)/);
    assert.match(migration, /lower\(v\.state\) = lower\(normalized_state\)/);
    assert.match(migration, /lower\(v\.city\) = lower\(normalized_city\)/);
    assert.match(migration, /lower\(v\.region\) = lower\(normalized_region\)/);
});

test("search covers summary, story, category, location, and business names", () => {
    for (const field of ["display_name", "summary", "story", "legal_name", "dba_name", "city", "state"]) {
        assert.match(migration, new RegExp(`v\\.${field}`));
    }
    assert.match(migration, /c\.category ilike/);
    assert.match(migration, /replace\(replace\(replace\(normalized/);
});

test("ascending and descending sorts use normalized name plus slug", () => {
    assert.match(migration, /p_sort = 'name_asc'/);
    assert.match(migration, /p_sort = 'name_desc'/);
    assert.match(migration, /lower\(v\.display_name\), lower\(v\.slug\)/);
    assert.match(migration, /unsupported directory sort/);
});

test("keyset predicates and bounded over-fetch support infinite scrolling", () => {
    assert.match(migration, /> \(p_cursor_name, p_cursor_slug\)/);
    assert.match(migration, /< \(p_cursor_name, p_cursor_slug\)/);
    assert.match(migration, /p_limit < 1 or p_limit > 51/);
    assert.match(migration, /length\(normalized\) > 100/);
    assert.match(migration, /limit p_limit/);
    assert.doesNotMatch(migration, /\boffset\b/);
});

test("RPC projection contains no workflow, EIN, evidence, or audit columns", () => {
    const returnsClause = migration.slice(
        migration.indexOf("returns table"),
        migration.indexOf("language plpgsql")
    );
    assert.doesNotMatch(
        returnsClause,
        /status|reason|ein|evidence|audit|organization_id|business_id|profile_id/
    );
});

test("published-name cursor index supports deterministic list ordering", () => {
    assert.match(
        migration,
        /directory_profile_versions_published_name_cursor_idx on public\.directory_profile_versions\(lower\(display_name\), lower\(slug\)\) where is_published/
    );
});
