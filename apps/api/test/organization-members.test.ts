import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://test-project.supabase.co";
process.env.SUPABASE_ANON_KEY = "test-anon-key";
process.env.CORS_ORIGINS = "http://localhost:3000";

const { assignOrganizationMemberSchema } = await import("../src/schemas/organization-members.js");
const { hasPermission } = await import("../src/middleware/authorization.js");
const migration = readFileSync(new URL("../../../packages/database/supabase/migrations/20261012130000_phase_2c_membership_and_submission_readiness.sql", import.meta.url), "utf8").replace(/\s+/g, " ").toLowerCase();
const conflictFixMigration = readFileSync(new URL("../../../packages/database/supabase/migrations/20261012131000_fix_membership_assignment_conflict_target.sql", import.meta.url), "utf8").replace(/\s+/g, " ").toLowerCase();
const organizationId = "33673a42-3cde-4a54-83d4-fe1e686ee69b";
const identity = (role: "owner" | "admin" | "page_manager" | "member", platformAdmin = false) => ({ userId: "11111111-1111-4111-8111-111111111111", email: "user@example.com", accountType: "standard" as const, platformRoles: platformAdmin ? ["admin" as const] : [], profile: null, memberships: [{ organizationId, organizationName: "Example", organizationType: "brand" as const, role, status: "active" as const }] });

test("member assignment accepts supported tenant roles and rejects owner escalation", () => {
    for (const role of ["admin", "page_manager", "member"] as const) assert.equal(assignOrganizationMemberSchema.safeParse({ email: "person@example.com", role }).success, true);
    for (const role of ["owner", "reviewer", "platform_admin"]) assert.equal(assignOrganizationMemberSchema.safeParse({ email: "person@example.com", role }).success, false);
});

test("only organization owner/admin can manage membership", () => {
    assert.equal(hasPermission(identity("owner"), "organization:members_manage", organizationId), true);
    assert.equal(hasPermission(identity("admin"), "organization:members_manage", organizationId), true);
    assert.equal(hasPermission(identity("page_manager"), "organization:members_manage", organizationId), false);
    assert.equal(hasPermission({ ...identity("member", true), memberships: [] }, "organization:members_manage", organizationId), false);
});

test("membership RPCs recheck tenant authority, protect the final owner, and audit mutations", () => {
    assert.match(migration, /auth\.uid\(\) is null or not public\.has_organization_role/);
    assert.match(migration, /p_role not in \( 'admin'.*'page_manager'.*'member'/);
    assert.match(migration, /active_owner_count <= 1/);
    assert.match(migration, /final organization owner cannot be removed/);
    assert.match(migration, /insert into public\.audit_logs/);
    assert.match(migration, /'organization_membership'/);
    assert.match(migration, /revoke all on function public\.assign_organization_member/);
    assert.match(conflictFixMigration, /on conflict on constraint organization_members_organization_user_unique/);
});

test("Directory submission validates the complete business record", () => {
    for (const field of ["legal_business_name", "dba_name", "ein_verification", "business_address", "phone", "email", "website_url", "organization_type", "license_information"]) assert.match(migration, new RegExp(`'${field}'`));
    assert.match(migration, /missing_fields := public\.get_directory_profile_submission_missing_fields/);
    assert.match(migration, /cardinality\(missing_fields\) > 0/);
    assert.match(migration, /raise check_violation/);
});
