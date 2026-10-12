import assert from "node:assert/strict";
import test from "node:test";
import { safeNextPath } from "./safe-next.ts";

test("login destination retains local query and fragment", () => {
  assert.equal(safeNextPath("/create?tab=event#form"), "/create?tab=event#form");
  assert.equal(safeNextPath("/admin/dashboard"), "/admin/dashboard");
});

test("login destination rejects external URLs, parser tricks and login loops", () => {
  for (const value of [null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "/\t/evil.example", "/%5cevil.example", "/%2fevil.example", "/login", "/login?next=/create", "/auth/login", "/a/../login", "/%6cogin", "/%zz"]) {
    assert.equal(safeNextPath(value), null, String(value));
  }
});
