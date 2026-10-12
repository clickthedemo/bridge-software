import assert from "node:assert/strict";
import test from "node:test";
import { submitContactRequest, validateContactRequest, type ContactRequestInput } from "./contact.ts";

const input: ContactRequestInput = { profileSlug: "cascade-canna", reason: "Distribution", note: "Discuss retail distribution." };

test("shared validation rejects invalid profile, reason, blank and oversized notes", async () => {
  for (const invalid of [
    { ...input, profileSlug: "../profile" },
    { ...input, reason: "Unknown" } as ContactRequestInput,
    { ...input, note: "   " },
    { ...input, note: "a".repeat(501) },
  ]) {
    assert.ok(validateContactRequest(invalid));
    await assert.rejects(submitContactRequest(invalid));
  }
  assert.equal(validateContactRequest({ ...input, note: "a".repeat(500) }), null);
});

test("simulated contact returns only an explicit preview receipt and failure stays a failure", async () => {
  assert.deepEqual(await submitContactRequest(input), { status: "preview", sent: false, stored: false });
  await assert.rejects(submitContactRequest(input, { simulateFailure: true }), /Simulated network failure/);
});
