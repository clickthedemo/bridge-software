import assert from "node:assert/strict";
import test from "node:test";
import { resolveEffectiveAudiences } from "./audiences.ts";
import {
  composePostModeMessage,
  emptyPostModeValues,
  getPostMode,
  isPostModeValid,
  postModeProtectedDetail,
  resolvePostModeReach,
  todayIsoDate,
  validatePostMode,
  validatePostModeField,
} from "./post-modes.ts";

const today = "2026-09-03";

test("required fields and length caps are enforced per mode", () => {
  assert.deepEqual(
    validatePostMode("deal", emptyPostModeValues("deal"), today).map((issue) => issue.field),
    ["offer", "terms", "validUntil"],
  );

  const offer = getPostMode("deal").fields[0];
  assert.equal(validatePostModeField(offer, "30% off every pre-roll", today), null);
  assert.match(validatePostModeField(offer, "x".repeat(81), today) ?? "", /80 characters or fewer/);

  /* A mode with no extra fields is complete as soon as it is chosen. */
  assert.equal(isPostModeValid("update", emptyPostModeValues("update"), today), true);
});

test("a valid-until date cannot be in the past, but an availability date can", () => {
  const validUntil = getPostMode("deal").fields[3];
  assert.match(validatePostModeField(validUntil, "2026-09-02", today) ?? "", /cannot be in the past/);
  assert.equal(validatePostModeField(validUntil, today, today), null);
  assert.match(validatePostModeField(validUntil, "2026-09", today) ?? "", /needs a full date/);

  const availableFrom = getPostMode("drop").fields[1];
  assert.equal(validatePostModeField(availableFrom, "2020-04-20", today), null);
});

test("a select field only accepts a listed option", () => {
  const employmentType = getPostMode("hiring").fields[1];
  assert.equal(validatePostModeField(employmentType, "Seasonal", today), null);
  assert.match(validatePostModeField(employmentType, "Whatever", today) ?? "", /Choose an option/);
});

test("modes narrow reach to B2B and never widen it", () => {
  const publicDrop = { ...emptyPostModeValues("drop"), productName: "Rosin", availableFrom: today };
  const privateDrop = { ...publicDrop, b2bOnly: true };

  assert.equal(resolvePostModeReach("drop", publicDrop, "everyone"), "everyone");
  assert.equal(resolvePostModeReach("drop", privateDrop, "everyone"), "b2b");
  assert.equal(resolvePostModeReach("listing", emptyPostModeValues("listing"), "world"), "b2b");

  assert.equal(postModeProtectedDetail("drop", publicDrop, false), false);
  assert.equal(postModeProtectedDetail("drop", privateDrop, false), true);
  /* An author who already ticked protected detail keeps it on any mode. */
  assert.equal(postModeProtectedDetail("update", emptyPostModeValues("update"), true), true);
});

test("a B2B mode drops Adults 21+ through the existing audience rules", () => {
  const listingProtected = postModeProtectedDetail("listing", emptyPostModeValues("listing"), false);
  assert.deepEqual(resolveEffectiveAudiences(["adults", "retailers"], listingProtected), ["retailers"]);
});

test("mode detail is folded into the single Phase 3 message", () => {
  const values = { ...emptyPostModeValues("deal"), offer: "BOGO carts", terms: "In store only.", validUntil: "2026-12-31" };
  assert.equal(
    composePostModeMessage("deal", values, "Holiday hours are up."),
    "Holiday hours are up.\n\nThe offer: BOGO carts\nFine print: In store only.\nValid until: 2026-12-31",
  );
  assert.equal(composePostModeMessage("update", emptyPostModeValues("update"), " Just news. "), "Just news.");
});

test("today is read from the local calendar, not UTC", () => {
  assert.equal(todayIsoDate(new Date(2026, 0, 4, 23, 30)), "2026-01-04");
});
