/* Visual check of Tori's notes against the running build.
   node scripts/shot-review.mjs [baseUrl] */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:3210';
const out = 'review-shots';
mkdirSync(out, { recursive: true });

const SHOTS = [
  ['home',            '/',          { width: 1440, height: 1000 }, 0],
  ['home-league',     '/',          { width: 1440, height: 1000 }, 2400],
  ['home-suite',      '/',          { width: 1440, height: 1000 }, 3600],
  ['community',       '/community', { width: 1440, height: 1000 }, 0],
  ['community-feed',  '/community', { width: 1440, height: 1000 }, 900],
  ['verified',        '/verified',  { width: 1440, height: 1000 }, 700],
  ['explore',         '/explore',   { width: 1440, height: 1000 }, 0],
  ['home-mobile',     '/',          { width: 390,  height: 844  }, 0],
  ['community-mobile','/community', { width: 390,  height: 844  }, 700],
];

const browser = await chromium.launch();
const report = [];

for (const [name, path, vp, scrollY] of SHOTS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
  page.on('requestfailed', r => errs.push('failed: ' + r.url().replace(base, '')));

  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
  // The home route opens with a full-screen intro film. Skip it, the same way
  // a visitor would, so the shots show the page rather than the curtain.
  const skip = page.locator('.bi-skip');
  if (await skip.count()) { await skip.first().click(); await page.waitForTimeout(900); }
  // Age gate, same as any visitor. It stores its answer per browser context,
  // and each shot gets a fresh context, so it has to be cleared every time.
  const gate = page.getByRole('button', { name: /21 or older/i });
  if (await gate.count()) { await gate.first().click(); await page.waitForTimeout(800); }
  if (scrollY) { await page.evaluate(y => scrollTo(0, y), scrollY); await page.waitForTimeout(700); }
  await page.waitForTimeout(600);

  // horizontal overflow is an explicit repo standard
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);

  await page.screenshot({ path: `${out}/${name}.png` });
  report.push({ name, vp: `${vp.width}x${vp.height}`, overflowPx: overflow, errors: errs.slice(0, 4) });
  await ctx.close();
}

// did the purple actually come off?
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto(base + '/community', { waitUntil: 'networkidle' });
const filters = await page.evaluate(() => {
  const pick = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).filter : 'no element'; };
  const after = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el, '::after').mixBlendMode : 'no element'; };
  return {
    newsImg: pick('.news-image img'),
    thumb: pick('.category-thumb'),
    newsAfterBlend: after('.news-image'),
  };
});
await ctx.close();

console.log(JSON.stringify({ shots: report, photoTreatment: filters }, null, 2));
await browser.close();
