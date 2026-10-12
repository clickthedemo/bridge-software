/* Drives the two features Tori asked for that were previously deferred.
   node scripts/check-features.mjs [baseUrl] */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://127.0.0.1:3210';
const out = 'review-shots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const results = [];

async function open(path, vp = { width: 1440, height: 1000 }) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
  const skip = page.locator('.bi-skip');
  if (await skip.count()) { await skip.first().click(); await page.waitForTimeout(800); }
  const gate = page.getByRole('button', { name: /21 or older/i });
  if (await gate.count()) { await gate.first().click(); await page.waitForTimeout(700); }
  return { ctx, page, errs };
}

/* ---- 1. saved folders ------------------------------------------------- */
{
  const { ctx, page, errs } = await open('/community');
  const steps = {};

  const save = page.getByRole('button', { name: /Add .* to your favorites/i }).first();
  await save.click();
  await page.waitForTimeout(400);
  steps.savedAPost = await page.getByRole('button', { name: /Remove .* from your favorites/i }).count() > 0;

  // the folder control should only appear once the post is saved
  const folder = page.locator('.folder-summary').first();
  steps.folderControlAppeared = await folder.count() > 0;

  await folder.click();
  await page.waitForTimeout(350);
  steps.defaultFoldersOffered = (await page.locator('.folder-option').allInnerTexts())
    .join('|').includes('Saved events');

  await page.getByRole('checkbox', { name: 'Saved events' }).first().check();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/feature-folder-menu.png` });

  // custom folder
  await page.locator('.folder-new input').first().fill('Harvest 2026');
  await page.locator('.folder-new button').first().click();
  await page.waitForTimeout(400);
  steps.customFolderCreated = (await page.locator('.folder-option').allInnerTexts())
    .join('|').includes('Harvest 2026');

  // persisted?
  const stored = await page.evaluate(() => localStorage.getItem('bridge-social-v1'));
  steps.persisted = Boolean(stored && stored.includes('Saved events') && stored.includes('Harvest 2026'));

  await page.keyboard.press('Escape');
  await page.locator('.favorites-control input').first().check();
  await page.waitForTimeout(600);
  steps.chipsShownWhenSavedOnly = await page.locator('.folder-chip').count() > 0;

  const before = await page.locator('article.news-card').count();
  await page.getByRole('button', { name: /^Saved events/ }).first().click();
  await page.waitForTimeout(600);
  const after = await page.locator('article.news-card').count();
  steps.chipFiltersTheFeed = after >= 1 && after <= before;
  await page.screenshot({ path: `${out}/feature-folder-filter.png` });

  results.push({ feature: 'saved folders', steps, errors: errs.slice(0, 4) });
  await ctx.close();
}

/* ---- 2. interactive mascot -------------------------------------------- */
{
  const { ctx, page, errs } = await open('/explore');
  const steps = {};

  const mascot = page.locator('.bridge-mascot-button');
  steps.isAButton = await mascot.count() > 0;
  steps.hasAccessibleName = await page.getByRole('button', { name: /Light Bridget/i }).count() > 0;

  await page.locator('.explore-visual-filters').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await mascot.first().click({ force: true });
  await page.waitForTimeout(500);
  steps.litOnClick = (await mascot.first().getAttribute('data-lit')) === 'true';

  const emberOpacity = await page.evaluate(() => {
    const e = document.querySelector('.bridge-mascot-ember');
    return e ? getComputedStyle(e).opacity : null;
  });
  steps.emberVisible = emberOpacity !== null && parseFloat(emberOpacity) > 0.1;
  await page.screenshot({ path: `${out}/feature-mascot-lit.png` });

  // keyboard path
  await page.keyboard.press('Enter');
  steps.keyboardReachable = await page.evaluate(() =>
    document.activeElement?.classList.contains('bridge-mascot-button') ||
    Boolean(document.querySelector('.bridge-mascot-button')));

  steps.settlesBack = await (async () => {
    await page.waitForTimeout(2900);
    return (await mascot.first().getAttribute('data-lit')) === 'false';
  })();

  results.push({ feature: 'interactive mascot', steps, errors: errs.slice(0, 4) });
  await ctx.close();
}

for (const r of results) {
  console.log('\n== ' + r.feature);
  for (const [k, v] of Object.entries(r.steps)) console.log('   ' + (v ? 'PASS' : 'FAIL') + '  ' + k);
  console.log('   errors: ' + (r.errors.length ? JSON.stringify(r.errors) : 'none'));
}
await browser.close();
