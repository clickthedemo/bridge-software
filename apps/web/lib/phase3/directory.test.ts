import test from "node:test";
import assert from "node:assert/strict";
import { DirectoryClient, directoryQuery, parseDirectoryPage, parseDirectoryProfile, validateDirectoryInput } from "./directory.ts";
const profile = { id: "f286c113-2331-499d-a1cf-eabc44662738", slug: "test-brand", role: "brand", name: "Test", companyName: "Test Co", description: "", location: "Pittsburgh", state: "PA", serviceTerritories: ["PA"], products: [], categories: [], logoUrl: null, visibility: "public", verified: false, verificationStatus: "pending", createdAt: "2026-09-12T00:00:00Z", updatedAt: "2026-09-12T00:00:00Z" };
test("directory schema accepts contract and rejects corrupted trust fields", () => {
  assert.deepEqual(parseDirectoryProfile(profile), profile);
  for (const patch of [{ verified: "true" }, { verificationStatus: "verified" }, { role: "admin" }, { categories: [null] }, { logoUrl: "javascript:alert(1)" }, { id: "fake" }, { updatedAt: "no" }]) assert.throws(() => parseDirectoryProfile({ ...profile, ...patch }));
  assert.equal(parseDirectoryPage({ profiles: [profile], pagination: { page: 1, pageSize: 24, total: 1, totalPages: 1 } }).profiles.length, 1);
  assert.throws(() => parseDirectoryPage({ profiles: [], pagination: { page: -1, pageSize: 24, total: 0, totalPages: 0 } }));
});
test("write contract prohibits server authority fields and encodes filters", () => {
  assert.deepEqual(validateDirectoryInput({ slug: "test", name: "Test" }), { slug: "test", name: "Test" });
  assert.throws(() => validateDirectoryInput({ slug: "../test", name: "Test" }));
  assert.throws(() => validateDirectoryInput({ slug: "mine", name: "Test" }));
  assert.throws(() => validateDirectoryInput({ serviceTerritories: ["Pennsylvania"] }, true));
  assert.throws(() => validateDirectoryInput({ verified: true } as never, true));
  assert.throws(() => validateDirectoryInput({ organizationId: profile.id }, true));
  assert.equal(new URLSearchParams(directoryQuery({ query: "A&B", verified: false, page: 2 })).get("query"), "A&B");
  assert.equal(new URLSearchParams(directoryQuery({ verified: false })).get("verified"), "false");
});
test("directory transport uses cookie auth, exact paths, and surfaces API failure", async () => {
  const original = globalThis.fetch; const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return Response.json({ profile }); };
  try {
    const client = new DirectoryClient("https://bridge.test/");
    await client.save(null, { slug: "test", name: "Test", organizationId: profile.id });
    assert.equal(calls[0].url, "https://bridge.test/api/v1/directory"); assert.equal(calls[0].init?.credentials, "include"); assert.equal(calls[0].init?.method, "POST");
    await client.save(profile.id, { visibility: "private" }); assert.equal(calls[1].init?.method, "PATCH");
    await client.get("test brand"); assert.ok(calls[2].url.endsWith("test%20brand"));
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(client.list(), { code: "unavailable" });
  } finally { globalThis.fetch = original; }
});
