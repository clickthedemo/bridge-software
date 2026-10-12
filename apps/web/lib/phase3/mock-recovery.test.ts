import assert from "node:assert/strict";
import test from "node:test";
import { MockPhase3Client } from "./mock-client.ts";
import { Phase3Error } from "./types.ts";

test("preview recovery cannot report sent email or a changed password", async () => {
  const client = new MockPhase3Client();
  await client.logout();
  for (const method of ["forgotPassword", "resendVerification", "resetPassword", "establishRecoverySession"] as const) {
    await assert.rejects(client[method](), (error: unknown) => error instanceof Phase3Error && error.code === "unavailable");
  }
  await assert.rejects(client.getCurrentUser(), (error: unknown) => error instanceof Phase3Error && error.code === "unauthenticated");
});
