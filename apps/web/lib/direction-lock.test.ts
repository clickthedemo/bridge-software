import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { CONNECTED_REVIEW_LABEL, DEFAULT_THEME, isUnifiedReviewHost, visualTheme } from "./direction-lock.ts";

test("default review direction is Modern Network", () => {
  assert.equal(DEFAULT_THEME, "network");
});

test("connected-signal host always resolves to the purple Network theme", () => {
  assert.equal(isUnifiedReviewHost("bridge-connected-signal.netlify.app"), true);
  assert.equal(visualTheme("bridge-connected-signal.netlify.app"), "network");
  assert.equal(visualTheme("bridge-connected-signal.netlify.app:443"), "network");
});

test("Trusted Current preview host is not treated as the unified review URL", () => {
  assert.equal(isUnifiedReviewHost("bridge-preview-current.netlify.app"), false);
  assert.equal(isUnifiedReviewHost("bridge-preview-network.netlify.app"), false);
});

test("Connected review label stays on the Modern Network direction", () => {
  assert.match(CONNECTED_REVIEW_LABEL, /Connected/);
  assert.match(CONNECTED_REVIEW_LABEL, /Modern Network/);
});

test("Phase 2 legacy Studio, Business, and Signal redirects stay instituted", () => {
  const redirects = readFileSync(join(import.meta.dirname, "..", "public", "_redirects"), "utf8");
  assert.match(redirects, /^\/studio \/create 301$/m);
  assert.match(redirects, /^\/business \/my-profile 301$/m);
  assert.match(redirects, /^\/signal \/explore 301$/m);
});
