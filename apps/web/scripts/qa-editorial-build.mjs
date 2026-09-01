import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dependencyRoot = process.env.CODEX_WORKSPACE_NODE_MODULES;
if (!dependencyRoot) throw new Error("CODEX_WORKSPACE_NODE_MODULES is required");
const { chromium } = await import(pathToFileURL(path.join(dependencyRoot, "playwright", "index.mjs")).href);

const baseUrl = process.env.BRIDGE_QA_URL ?? "http://127.0.0.1:3100";
const outputDirectory = process.env.BRIDGE_QA_OUTPUT ?? path.join(os.tmpdir(), "bridge-editorial-qa");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const checks = [];

function check(condition, label, detail = "") {
  checks.push({ label, passed: Boolean(condition), detail });
  if (!condition) errors.push(`${label}${detail ? `: ${detail}` : ""}`);
}

function editorialPath(src) {
  const value = decodeURIComponent(src ?? "");
  const match = value.match(/\/bridge-editorial\/[a-z0-9-]+\.webp/);
  return match?.[0] ?? value;
}

async function loadLazyImages(page) {
  await page.evaluate(async () => {
    const distance = Math.max(320, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.body.scrollHeight; y += distance) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 8000 });
  await page.evaluate(() => window.scrollTo(0, 0));
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("bridge-age-confirmed-v1", "confirmed"));
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  for (const route of ["/", "/community", "/explore", "/create", "/my-profile"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await loadLazyImages(page);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${viewport.name} ${route} has no horizontal overflow`);
    check(await page.locator("img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)), `${viewport.name} ${route} images load`);

    if (route === "/community") {
      const stateOptions = await page.locator("#community-state option").count();
      check(stateOptions === 52, `${viewport.name} Community exposes nationwide options`, `found ${stateOptions}`);
      const categoryBackgrounds = await page.locator(".category-thumb").evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).backgroundImage));
      check(new Set(categoryBackgrounds).size === categoryBackgrounds.length && categoryBackgrounds.length === 9, `${viewport.name} Community category art is unique`, `found ${new Set(categoryBackgrounds).size}/${categoryBackgrounds.length}`);
      const articleImages = (await page.locator(".news-card img").evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""))).map(editorialPath);
      check(new Set(articleImages).size === articleImages.length && articleImages.length === 20, `${viewport.name} Community post art is unique`, `found ${new Set(articleImages).size}/${articleImages.length}`);
      const postTypes = await page.locator(".news-card .status-chip").allTextContents();
      for (const requiredType of ["Product introduction", "Vendor announcement", "Promotion", "Event"]) {
        check(postTypes.includes(requiredType), `${viewport.name} Community includes ${requiredType} samples`);
      }
      check(await page.getByText("20 illustrative stories shown · 12 sample markets · 52 nationwide filter options").isVisible(), `${viewport.name} Community labels sample-feed depth`);
      await page.locator("#community-state").selectOption("Alabama");
      check(await page.getByRole("heading", { name: "No sample posts for Alabama" }).isVisible(), `${viewport.name} Community distinguishes nationwide scope from sample coverage`);
      await page.locator("#community-state").selectOption("All states");
    }

    if (route === "/explore") {
      const stateOptions = await page.locator("#explore-state option").count();
      check(stateOptions === 52, `${viewport.name} Explore exposes nationwide options`, `found ${stateOptions}`);
      const categoryImages = (await page.locator(".explore-category-tile img").evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""))).map(editorialPath);
      check(new Set(categoryImages).size === categoryImages.length && categoryImages.length === 5, `${viewport.name} Explore category art is unique`, `found ${new Set(categoryImages).size}/${categoryImages.length}`);
      const profileImages = (await page.locator(".profile-card img").evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""))).map(editorialPath);
      check(new Set(profileImages).size === profileImages.length && profileImages.length === 18, `${viewport.name} Explore profile art is unique`, `found ${new Set(profileImages).size}/${profileImages.length}`);
      await page.locator("#explore-state").selectOption("Alabama");
      check(await page.getByRole("heading", { name: "No sample records for Alabama" }).isVisible(), `${viewport.name} Explore distinguishes nationwide scope from sample coverage`);
      await page.locator("#explore-state").selectOption("All states");
    }

    if ((viewport.name === "desktop" && ["/", "/community", "/explore", "/create", "/my-profile"].includes(route)) || (viewport.name === "mobile" && ["/community", "/explore"].includes(route))) {
      const slug = route === "/" ? "home" : route.slice(1);
      await page.screenshot({ path: path.join(outputDirectory, `${viewport.name}-${slug}.png`), fullPage: true });
    }
  }

  await page.goto(`${baseUrl}/create`, { waitUntil: "networkidle" });
  const reducedMotion = await page.locator(".grain-image img").first().evaluate((image) => getComputedStyle(image).animationName);
  check(reducedMotion === "none", `${viewport.name} reduced motion disables editorial image drift`, reducedMotion);
  await page.keyboard.press("Tab");
  check(await page.evaluate(() => document.activeElement !== document.body), `${viewport.name} keyboard focus enters the page`);
  check(consoleErrors.length === 0, `${viewport.name} browser console is clean`, consoleErrors.join(" | "));
  await context.close();
}

await browser.close();
const report = { passed: errors.length === 0, baseUrl, outputDirectory, checks, errors };
await writeFile(path.join(outputDirectory, "qa-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
