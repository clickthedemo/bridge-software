/*
 * WCAG AA contrast check for the surfaces touched on 2026-09-21: the four
 * suite-card previews Tori asked for, and the category vocab notes.
 *
 * Colour tokens are read out of app/globals.css rather than restated here, so
 * a measured ratio cannot drift from the value that actually ships. That is the
 * same rule the earlier Bridge contrast check used, and the reason it caught
 * form error text at 2.22:1. Literal #fff / #e4d7f2 in the pair table are the
 * card's own colours, which the suite cards declare inline rather than through
 * a token; they are quoted from the same stylesheet.
 *
 *   node scripts/check-contrast-suite-peek.mjs
 *
 * Exit 1 if any pair fails its threshold.
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/* Tokens straight from the :root block. */
const root = css.slice(css.indexOf(":root,"), css.indexOf("}", css.indexOf(":root,")));
const tokens = Object.fromEntries(
  [...root.matchAll(/(--[a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)].map((m) => [m[1], m[2]]),
);

function hex(value) {
  const t = value.startsWith("--") ? tokens[value] : value;
  if (!t) throw new Error(`no value for ${value}`);
  let h = t.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const lum = (c) =>
  0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
const ch = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const ratio = (a, b) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* mix(a, b, pct) — the CSS color-mix(in srgb, a pct%, b) the stylesheet uses. */
const mix = (a, b, pct) => {
  const [x, y] = [hex(a), hex(b)];
  const p = pct / 100;
  return (
    "#" +
    x
      .map((v, i) => Math.round(v * p + y[i] * (1 - p)).toString(16).padStart(2, "0"))
      .join("")
  );
};

/* Card backgrounds. The suite cards use gradients; each is measured against its
   LIGHTEST stop, which is the worst case for the light text sitting on it. */
const CARD_1_4 = tokens["--surface"];          // glass over --surface
const CARD_2 = "#2a0b3f";                       // lightest stop of card 2
const CARD_3 = "#230a35";                       // lightest stop of card 3

const pairs = [
  // --- suite-peek: Create card (card 2) ---
  ["suite-peek-label on card 2", "#ffffff", CARD_2, 4.5],
  ["suite-peek-mode on card 2", "#ffffff", CARD_2, 4.5],
  ["suite-peek-mode.is-on label on --brand", "--on-brand", "--brand", 4.5],
  ["suite-peek-reposts on card 2", "#e4d7f2", CARD_2, 4.5],
  // --- suite-peek: My Profile card (card 3) ---
  ["suite-peek-avatar initials on --brand", "--on-brand", "--brand", 4.5],
  ["suite-peek-name on card 3", "#ffffff", CARD_3, 4.5],
  ["suite-peek-verified on --accent-soft", "--accent", "--accent-soft", 4.5],
  ["suite-peek-meta on card 3", "#e4d7f2", CARD_3, 4.5],
  ["suite-peek-about on card 3", "#e4d7f2", CARD_3, 4.5],
  // --- suite-peek: Explore card (card 4, --surface) ---
  ["suite-peek-explore-label on --canvas", "--text", "--canvas", 4.5],
  // --- suite-peek: Community News card (card 1) has image tiles only, no text ---
  // --- category vocab notes Tori asked for ---
  ["category-note on --surface", "--accent", "--surface", 4.5],
  ["visual-category name on --surface", "--muted", "--surface", 4.5],
  ["visual-category pressed name on --surface", "--text", "--surface", 4.5],
  // --- non-text: tile borders against their card, 3:1 ---
  ["suite-peek-tile border on --surface", mix("--accent", CARD_1_4, 65), CARD_1_4, 3],
  ["suite-peek-mode border on card 2", mix("--accent", CARD_2, 65), CARD_2, 3],
  ["suite-peek-explore-tile border on --surface", mix("--accent", CARD_1_4, 65), CARD_1_4, 3],
];

let failed = 0;
console.log("WCAG AA, tokens read from app/globals.css\n");
for (const [name, fg, bg, need] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) failed += 1;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (needs ${need}:1)  ${name}`,
  );
}
console.log(`\n${pairs.length - failed}/${pairs.length} pass`);
process.exit(failed ? 1 : 0);
