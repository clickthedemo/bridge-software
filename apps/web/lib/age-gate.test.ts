import assert from "node:assert/strict";
import test from "node:test";
import {
  AGE_GATE_CONFIRMED_VALUE,
  isAgeGateConfirmed,
} from "./age-gate.ts";

test("the age gate opens only for an explicit confirmation", () => {
  assert.equal(isAgeGateConfirmed(AGE_GATE_CONFIRMED_VALUE), true);
  assert.equal(isAgeGateConfirmed(null), false);
  assert.equal(isAgeGateConfirmed("denied"), false);
  assert.equal(isAgeGateConfirmed("true"), false);
});
