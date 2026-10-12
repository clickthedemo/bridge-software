import test from "node:test";
import assert from "node:assert/strict";
import { DirectoryRequestsClient, parseDirectoryRequest, parseRequestPage, validateRequestInput } from "./directory-requests.ts";

const id = "11111111-1111-4111-8111-111111111111";
const input = { profileId: id, kind: "contact" as const, message: "Hello", shareEmail: false, idempotencyKey: "22222222-2222-4222-8222-222222222222" };
const request = { id, profileId: id, kind: "contact", message: "Hello", replyEmail: null, status: "pending", createdAt: "2026-09-12T00:00:00Z", updatedAt: "2026-09-12T00:00:00Z", canReview: false, emailDelivery: "not_configured" };
test("request boundaries reject forged authority and misleading receipts", () => {
  assert.deepEqual(validateRequestInput(input), input);
  assert.throws(() => validateRequestInput({ ...input, senderId: id } as never));
  assert.throws(() => validateRequestInput({ ...input, message: " " }));
  assert.equal(parseDirectoryRequest({ ...request, emailDelivery: "sent" }).emailDelivery, "sent");
  assert.throws(() => parseDirectoryRequest({ ...request, emailDelivery: "delivered" }));
  assert.throws(() => parseDirectoryRequest({ ...request, canReview: "true" }));
  assert.deepEqual(parseDirectoryRequest({ ...request, senderId: id }), request);
  assert.throws(() => parseRequestPage({ requests: [request], pagination: { page: 1, pageSize: 20, total: -1, totalPages: 0 } }));
});
test("request retries preserve idempotency and cookie transport", async () => {
  const original = globalThis.fetch; const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); if (calls.length === 1) throw new Error("Disconnected after save"); return Response.json({ request }); };
  try {
    const client = new DirectoryRequestsClient("https://bridge.test/");
    await assert.rejects(client.create(input));
    assert.deepEqual((await client.create(input)).request, request);
    assert.equal(calls[0].init?.body, calls[1].init?.body);
    assert.equal(calls[1].init?.credentials, "include");
    assert.equal(calls[1].url, "https://bridge.test/api/v1/directory-requests");
    await client.review(id, "resolved");
    assert.equal(calls[2].init?.method, "PATCH");
  } finally { globalThis.fetch = original; }
});
