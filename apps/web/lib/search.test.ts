import assert from "node:assert/strict";
import test from "node:test";
import { profiles } from "./data.ts";
import { matchesQuery, matchesServiceState } from "./search.ts";

test("search ANDs reordered tokens, matches state abbreviations and product prefixes", () => {
  const sample = { ...profiles[0], products: ["Terpene cartridges"] };
  assert.equal(matchesQuery(sample, "OR cascade"), true);
  assert.equal(matchesQuery(sample, "cartr terp"), true);
  assert.equal(matchesQuery(sample, "cartr-missing"), false);
  assert.equal(matchesQuery(sample, "  "), true);
});

test("search does not match Erie inside experiences or short tokens inside words", () => {
  const sample = { ...profiles[0], description: "Small-batch retail experiences" };
  assert.equal(matchesQuery(sample, "erie"), false);
  assert.equal(matchesQuery(sample, "ed"), false);
  assert.equal(matchesQuery(sample, "small-batch"), true);
});

test("service state includes home, explicit territory and nationwide, without guessing broad regions", () => {
  const sample = profiles[0];
  assert.equal(matchesServiceState(sample, "Oregon"), true);
  assert.equal(matchesServiceState(sample, "Washington"), true);
  assert.equal(matchesServiceState(sample, "WA"), true);
  assert.equal(matchesServiceState(sample, "California"), false);
  assert.equal(matchesServiceState({ ...sample, serving: "Across the West" }, "California"), false);
  assert.equal(matchesServiceState({ ...sample, serving: "Seven legal markets" }, "Ohio"), false);
  assert.equal(matchesServiceState({ ...sample, serving: "Markets nationwide" }, "Ohio"), true);
  assert.equal(matchesServiceState({ ...sample, serving: "New Mexico" }, "New York"), false);
  assert.equal(matchesServiceState(sample, "All states"), true);
});
