/*
 * Reproducible before/after probe for the font-weight defect fixed in PR #24.
 *
 * WHY THIS EXISTS
 * The PR claims globals.css declares ~45 selectors at weights 650-900 that the
 * browser could not render, because layout.tsx pinned Inter to 400/500/600 and
 * Montserrat to 600/700. The numbers backing that claim were originally taken
 * by hand. This script takes them again, from scratch, so the claim rests on a
 * command anyone can rerun rather than on a transcript.
 *
 *   node scripts/probe-font-weights.mjs
 *
 * WHAT IT DOES
 * Builds the app TWICE and measures each build in a real browser:
 *   run 1  BEFORE  layout.tsx patched back to the pre-fix static weight lists
 *   run 2  AFTER   layout.tsx restored to HEAD (no `weight` key, variable axis)
 *
 * Two independent measurements per run:
 *   1. document.fonts  - which FontFace weights the document actually holds.
 *   2. canvas measureText width at 400..900. This is the one that matters. A
 *      real face per weight gives a different width per weight. When a weight
 *      was never loaded the browser snaps to the nearest face it has, so the
 *      widths come out IDENTICAL - that collapse is the defect, made visible.
 *
 * Note: document.fonts.check() is NOT used. It returns true for a font that
 * does not exist at all, so it cannot detect this defect.
 *
 * SAFETY
 * The only file written is app/layout.tsx, and it is restored with
 * `git checkout -- app/layout.tsx` in a finally block. HEAD is the source of
 * truth for the restore, so an interrupted run is recovered by rerunning that
 * one command. The script REFUSES TO START if layout.tsx already has uncommitted
 * changes, so it can never destroy someone's work in progress. The run order
 * leaves .next holding the AFTER build, matching HEAD.
 *
 * Requires: playwright.
 */
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { chromium } from "playwright";

const REPO = resolve(import.meta.dirname, "..");
const LAYOUT = join(REPO, "app", "layout.tsx");
const WEIGHTS = [400, 600, 650, 700, 750, 800, 850, 900];
const SAMPLE = "Bridge Handoff 2026";
const FAMILIES = ["Inter", "Montserrat", "Poppins", "Caveat"];

/* The pre-fix font configuration, quoted from layout.tsx as it stood before the
   fix. Reapplying these three `weight` keys reproduces the defect exactly. */
const PRE_FIX_WEIGHTS = {
  Montserrat: '["600", "700"]',
  Inter: '["400", "500", "600"]',
  Caveat: '["700"]',
};

const git = (...args) =>
  execFileSync("git", args, { cwd: REPO, encoding: "utf8", stdio: "pipe" }).trim();

const log = (...a) => console.log(...a);

/* --- refuse to run over uncommitted work ---------------------------------- */
const layoutDirty = git("status", "--porcelain", "--", "app/layout.tsx");
if (layoutDirty) {
  console.error(
    "app/layout.tsx has uncommitted changes. This probe overwrites and then\n" +
      "restores that file from HEAD, which would destroy them. Commit or stash first.",
  );
  process.exit(2);
}

const HEAD = git("rev-parse", "HEAD");
log(`repo   ${REPO}`);
log(`HEAD   ${HEAD}`);
log(`probe  patches app/layout.tsx in place, restores it from HEAD when done\n`);

/* --- what the build itself emitted, read straight off disk ----------------- */
function collectEmittedFontFaces() {
  const found = new Set();
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        walk(p);
      } else if (e.name.endsWith(".css")) {
        const css = readFileSync(p, "utf8");
        for (const m of css.matchAll(/@font-face\{([^}]*)\}/g)) {
          const fam = /font-family:\s*([^;]+)/.exec(m[1]);
          const wt = /font-weight:\s*([^;]+)/.exec(m[1]);
          if (!fam || !wt) continue;
          const name = fam[1].replace(/["']/g, "").trim();
          if (name.includes("Fallback")) continue;
          found.add(`${name} ${wt[1].trim()}`);
        }
      }
    }
  };
  walk(join(REPO, ".next", "static"));
  return [...found].sort().join("\n");
}

/* --- measurement ---------------------------------------------------------- */
async function measure(port) {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  /* next/font emits one FontFace per unicode-range subset, so the same weight
     appears many times. Dedupe, or the table reads as noise. */
  const faces = await page.evaluate(() => {
    const out = {};
    document.fonts.forEach((f) => {
      if (f.family.includes("Fallback")) return;
      (out[f.family] ||= new Set()).add(f.weight);
    });
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
  });

  const widths = await page.evaluate(
    ({ FAMILIES, WEIGHTS, SAMPLE }) => {
      const c = document.createElement("canvas").getContext("2d");
      const r = {};
      for (const fam of FAMILIES) {
        r[fam] = {};
        for (const w of WEIGHTS) {
          c.font = `${w} 64px "${fam}"`;
          r[fam][w] = +c.measureText(SAMPLE).width.toFixed(2);
        }
      }
      return r;
    },
    { FAMILIES, WEIGHTS, SAMPLE },
  );

  await browser.close();
  return { faces, widths };
}

async function buildAndMeasure(label, port) {
  log(`\n${"=".repeat(76)}\n${label}\n${"=".repeat(76)}`);
  log("  building...");
  try {
    execFileSync("npx", ["next", "build"], { cwd: REPO, stdio: "pipe", shell: true });
  } catch (e) {
    console.error("  build failed:\n" + String(e.stderr || e.stdout || e.message));
    throw e;
  }

  /* record what the built CSS actually declares, independent of the browser */
  const emitted = collectEmittedFontFaces();

  const srv = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: REPO,
    stdio: "ignore",
    shell: true,
  });

  try {
    for (let i = 0; i < 80; i += 1) {
      try {
        if ((await fetch(`http://127.0.0.1:${port}/`)).ok) break;
      } catch {
        /* not up yet */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    const m = await measure(port);
    return { ...m, emitted };
  } finally {
    try {
      execFileSync("taskkill", ["/F", "/T", "/PID", String(srv.pid)], { stdio: "ignore" });
    } catch {
      srv.kill();
    }
  }
}

function report(label, { faces, widths, emitted }) {
  log(`\n-- ${label}: @font-face weights emitted into the build --`);
  for (const line of emitted.split("\n").filter(Boolean)) log(`   ${line}`);
  log(`\n-- ${label}: FontFace weights present in the loaded document --`);
  for (const fam of FAMILIES) {
    log(`   ${fam.padEnd(12)} ${(faces[fam] || ["(absent)"]).join(", ")}`);
  }
  log(`\n-- ${label}: canvas measureText width, 64px, "${SAMPLE}" --`);
  log(
    `   ${"family".padEnd(12)}${WEIGHTS.map((w) => String(w).padStart(8)).join("")}   distinct`,
  );
  for (const fam of FAMILIES) {
    const row = WEIGHTS.map((w) => String(widths[fam][w]).padStart(8)).join("");
    const distinct = new Set(WEIGHTS.map((w) => widths[fam][w])).size;
    log(`   ${fam.padEnd(12)}${row}   ${distinct}/${WEIGHTS.length}`);
  }
}

/* --- run ------------------------------------------------------------------ */
let before;
let after;
try {
  /* BEFORE first, so the final .next left on disk is the AFTER build. */
  let src = readFileSync(LAYOUT, "utf8");
  for (const [fam, weight] of Object.entries(PRE_FIX_WEIGHTS)) {
    const re = new RegExp(`(${fam}\\(\\{[^}]*?variable: "[^"]+",)`, "s");
    if (!re.test(src)) throw new Error(`could not locate ${fam}({...}) in app/layout.tsx`);
    src = src.replace(re, `$1\n  weight: ${weight},`);
  }
  writeFileSync(LAYOUT, src);
  log("patched app/layout.tsx back to the pre-fix weight arrays:");
  for (const [f, w] of Object.entries(PRE_FIX_WEIGHTS)) log(`   ${f}: ${w}`);

  before = await buildAndMeasure("RUN 1  BEFORE  pre-fix font config (the defect)", 3391);

  git("checkout", "--", "app/layout.tsx");
  log("\nrestored app/layout.tsx from HEAD");

  after = await buildAndMeasure("RUN 2  AFTER  HEAD as committed (the fix)", 3392);
} finally {
  git("checkout", "--", "app/layout.tsx");
}

report("BEFORE", before);
report("AFTER", after);

/* --- verdict -------------------------------------------------------------- */
log(`\n${"=".repeat(76)}\nVERDICT\n${"=".repeat(76)}`);
let regressions = 0;
for (const fam of FAMILIES) {
  const b = new Set(WEIGHTS.map((w) => before.widths[fam][w])).size;
  const a = new Set(WEIGHTS.map((w) => after.widths[fam][w])).size;
  if (a < b) regressions += 1;
  const note =
    a > b
      ? `FIXED      ${b}/${WEIGHTS.length} -> ${a}/${WEIGHTS.length} distinct widths`
      : a === b
        ? `unchanged  ${a}/${WEIGHTS.length}`
        : `REGRESSED  ${b}/${WEIGHTS.length} -> ${a}/${WEIGHTS.length}`;
  log(`   ${fam.padEnd(12)} ${note}`);
}
log("\n   Poppins is expected to stay low: it has no variable axis on Google Fonts,");
log("   so its weights stay enumerated. 800 is the only one globals.css asks for.");
log("   Caveat's variable axis stops at 700, the only weight it uses.");

const finalDirty = git("status", "--porcelain");
log(`\n   working tree after probe: ${finalDirty ? "not clean" : "clean"}`);
if (finalDirty) log(finalDirty.split("\n").map((l) => `     ${l}`).join("\n"));

process.exit(regressions ? 1 : 0);
