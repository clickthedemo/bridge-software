import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { developmentBootstrapSchema } from "../src/schemas/development-bootstrap.js";

const migration = readFileSync(
    new URL(
        "../../../packages/database/supabase/migrations/20261012120000_phase_2b_data_api_grants.sql",
        import.meta.url
    ),
    "utf8"
)
    .replace(/\s+/g, " ")
    .toLowerCase();

const bootstrapRoute = readFileSync(
    new URL("../src/routes/v1/development-bootstrap.ts", import.meta.url),
    "utf8"
).replace(/\s+/g, " ");

const bootstrapService = readFileSync(
    new URL("../src/services/development-bootstrap.ts", import.meta.url),
    "utf8"
).replace(/\s+/g, " ");

test("Phase 2B grants expose only RLS-scoped account and tenant operations", () => {
    assert.match(
        migration,
        /grant select on table public\.user_profiles to authenticated/
    );
    assert.match(
        migration,
        /grant update \(display_name, phone\) on table public\.user_profiles to authenticated/
    );
    assert.match(
        migration,
        /grant select on table public\.organizations to authenticated/
    );
    assert.match(
        migration,
        /grant update \(name, organization_type\) on table public\.organizations to authenticated/
    );
    assert.match(
        migration,
        /grant select on table public\.organization_members to authenticated/
    );
    assert.match(
        migration,
        /grant select on table public\.user_platform_roles to authenticated/
    );
    assert.match(
        migration,
        /grant select, insert, update on table public\.businesses to authenticated/
    );

    assert.doesNotMatch(migration, /\bgrant\s+[^;]+\bto\s+anon\b/);
    assert.doesNotMatch(
        migration,
        /grant insert[^;]+public\.(organizations|organization_members|user_platform_roles)[^;]+to authenticated/
    );
});

test("Phase 2B grants keep trusted backend access resource-scoped", () => {
    assert.match(
        migration,
        /grant select, update on table public\.user_profiles to service_role/
    );
    assert.match(
        migration,
        /grant select, insert, update on table public\.user_platform_roles to service_role/
    );
    assert.match(
        migration,
        /grant select, insert on table public\.audit_logs to service_role/
    );
    assert.doesNotMatch(migration, /on all tables/);
    assert.doesNotMatch(migration, /alter default privileges/);
    assert.doesNotMatch(migration, /\bgrant\s+[^;]*truncate/);
});

test("development bootstrap accepts distinct runtime-generated credentials", () => {
    const password = () => `${randomBytes(18).toString("base64url")}!Aa1`;
    assert.equal(
        developmentBootstrapSchema.safeParse({
            administrator: {
                email: "phase2b-admin@example.com",
                password: password(),
                displayName: "Phase 2B Administrator"
            },
            member: {
                email: "phase2b-member@example.com",
                password: password(),
                displayName: "Phase 2B Member"
            }
        }).success,
        true
    );
});

test("development bootstrap is opt-in, loopback-only, bounded, and rollback-safe", () => {
    assert.match(bootstrapRoute, /isDevelopmentBootstrapEnabled\(\)/);
    assert.match(bootstrapRoute, /isLoopback\(req\.ip\)/);
    assert.match(bootstrapService, /env\.NODE_ENV === "development"/);
    assert.match(bootstrapService, /users\.users\.length/);
    assert.match(bootstrapService, /client\.auth\.admin\.createUser/);
    assert.match(bootstrapService, /client\.auth\.admin\.updateUserById/);
    assert.match(bootstrapService, /!administrator/);
    assert.match(bootstrapService, /!member/);
    assert.match(bootstrapService, /!administratorHasRole/);
    assert.match(bootstrapService, /email_confirm: true/);
    assert.match(bootstrapService, /Promise\.allSettled/);
    assert.match(bootstrapService, /client\.auth\.admin\.deleteUser/);
});

test("administrator invitation diagnostics never log provider messages", () => {
    const adminUsersService = readFileSync(
        new URL("../src/services/admin-users.ts", import.meta.url),
        "utf8"
    ).replace(/\s+/g, " ");
    assert.match(adminUsersService, /providerCode: invitationError\.code/);
    assert.match(adminUsersService, /status: invitationError\.status/);
    assert.doesNotMatch(
        adminUsersService,
        /Supabase administrator invitation failed[^;]+invitationError\.message/
    );
    assert.match(adminUsersService, /client\.auth\.admin\.generateLink/);
    assert.match(adminUsersService, /type: "invite"/);
    assert.match(adminUsersService, /invitationSent: !developmentLinkOnly/);
    assert.match(adminUsersService, /const authUserExists = async/);
    assert.match(adminUsersService, /await authUserExists\(client, input\.email\)/);
    assert.match(
        adminUsersService,
        /throw new AdminUserServiceError\("ADMIN_USER_ALREADY_EXISTS"\)/
    );
});
