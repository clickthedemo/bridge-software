import assert from "node:assert/strict";
import test from "node:test";
import { accountPathForRole, joinRoles, parseMemberRole } from "./roles.ts";

test("the approved onboarding list contains 12 unique roles", () => {
  assert.equal(joinRoles.length, 12);
  assert.equal(new Set(joinRoles.map((role) => role.name)).size, 12);
});

test("role parsing accepts only an approved role", () => {
  assert.equal(parseMemberRole("Dispensary"), "Dispensary");
  assert.equal(parseMemberRole("admin"), null);
  assert.equal(parseMemberRole(null), null);
});

test("the account path safely encodes the selected role", () => {
  assert.equal(accountPathForRole("Sales rep"), "/join/account?role=Sales%20rep");
});
