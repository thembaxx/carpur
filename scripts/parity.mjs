// Screenshot the reference artifact and the running Next app side by side.
// Usage: npm i -D playwright && npx playwright install chromium
//        npm run dev   (in another terminal)
//        node scripts/parity.mjs [http://localhost:3000]
//        --marketplace [--only=home] captures Phase 3; --compare-only rechecks existing PNGs.
// Output: parity/ref/*.png and parity/app/*.png — compare pairs with the same filename.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { createServer } from "node:http";
import { controlStudioFrames, studioClick, settleStudio, captureElement } from "./studio-browser.mjs";
import { alignReferenceCatalogue } from "./catalogue-reference.mjs";
import { alignOwnershipReference, adjustedInputs, setRange } from "./ownership-reference.mjs";

const shellOnly = process.argv.includes("--shell");
const studioOnly = process.argv.includes("--studio");
const marketplaceOnly = process.argv.includes("--marketplace");
const ownershipOnly = process.argv.includes("--ownership");
const onlyName = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const compareOnly = process.argv.includes("--compare-only");
if (compareOnly && !marketplaceOnly && !ownershipOnly) throw new Error("--compare-only requires --marketplace or --ownership");
const APP = process.argv.slice(2).find((arg) => !arg.startsWith("--")) || "http://localhost:3000";
const referenceFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../reference/carpur-artifact.html");
// Serve the unchanged artifact over HTTP; managed browsers may block file:// navigation.
const referenceServer = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(readFileSync(referenceFile));
});
await new Promise((resolve) => referenceServer.listen(0, "127.0.0.1", resolve));
const REF = `http://127.0.0.1:${referenceServer.address().port}/carpur-artifact.html`;

// [name, reference hash route, app path]
const PAIRS = [
  ["home", "#/", "/"],
  ["new-cars", "#/cars", "/marketplace"],
  ["used-cars", "#/cars?c=used", "/marketplace?inventory=sellers&condition=USED"],
  ["vehicle", "#/car/urban", "/vehicles/catalogue-toyota-1611"],
  ["affordability", "#/afford", "/affordability"],
  ["compare", "#/compare", "/compare"],
  ["garage", "#/garage", "/garage"],
  ["sell", "#/sell", "/sell"],
  ["sign-in", "#/sign-in", "/sign-in"],
];
const VIEWPORTS = [{ w: 390, h: 844 }, { w: 1440, h: 900 }];
const SCHEMES = ["light", "dark"];

const proxyServer = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, proxy: proxyServer ? { server: proxyServer, bypass: "localhost,127.0.0.1" } : undefined, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const side of ["ref", "app"]) mkdirSync(`parity/${side}`, { recursive: true });
mkdirSync("parity/diff", { recursive: true });
const marketplacePairs = [
  PAIRS[0], PAIRS[1],
  ["new-price-high", "#/cars?s=d", "/marketplace?sort=price-high"],
  ...["Petrol", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"].map((fuel) => [`fuel-${fuel.toLowerCase().replaceAll(" ", "-")}`, `#/cars?f=${encodeURIComponent(fuel)}`, `/marketplace?fuel=${encodeURIComponent(fuel)}`]),
  PAIRS[2],
  ["used-hybrid", "#/cars?c=used&f=Hybrid", "/marketplace?inventory=sellers&condition=USED&fuel=Hybrid"],
];
const ownershipPairs = [
  ...[["starlet", "1616"], ["rumion", "1743"], ["urban", "1611"]].map(([name, id]) => [`vehicle-${name}`, `#/car/catalogue-toyota-${id}`, `/vehicles/catalogue-toyota-${id}`]),
  ["vehicle-missing", "#/car/missing", "/vehicles/missing"],
  ["affordability", "#/afford", "/affordability"],
  ["affordability-cross", "#/afford?id=catalogue-toyota-1919", "/affordability?id=catalogue-toyota-1919"],
  ["affordability-adjusted", "#/afford?id=catalogue-toyota-1914", "/affordability?id=catalogue-toyota-1914"],
  ["compare", "#/compare", "/compare"],
  ["compare-reversed", "#/compare?a=catalogue-toyota-1919&b=catalogue-toyota-1616", "/compare?a=catalogue-toyota-1919&b=catalogue-toyota-1616"],
  ["compare-equal", "#/compare?a=catalogue-toyota-1914&b=catalogue-toyota-1914", "/compare?a=catalogue-toyota-1914&b=catalogue-toyota-1914"],
];
const mode = ownershipOnly ? "ownership" : marketplaceOnly ? "marketplace" : studioOnly ? "studio" : "shell";
const pairs = (ownershipOnly ? ownershipPairs : marketplaceOnly ? marketplacePairs : studioOnly ? [PAIRS[0]] : shellOnly ? [PAIRS[0], ["not-found", "#/phase-1-shell", "/phase-1-shell"]] : PAIRS).filter(([name]) => !onlyName || name === onlyName);
const filenames = new Set();

try {
if (!pairs.length) throw new Error(`Unknown comparison case: ${onlyName}`);
for (const vp of VIEWPORTS) for (const scheme of SCHEMES) {
  if (compareOnly) {
    for (const [name] of pairs) filenames.add(`${mode}-${name}-${vp.w}-${scheme}.png`);
    continue;
  }
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, colorScheme: scheme, reducedMotion: "reduce" });
  if (studioOnly || marketplaceOnly || ownershipOnly) await controlStudioFrames(ctx);
  // Layout comparisons use the supplied silhouette fallback on both sides.
  // Healthy manufacturer photos are verified separately by check-marketplace.
  if (marketplaceOnly) await ctx.route("**/_next/image?*", (route) => route.fulfill({ status: 200, contentType: "image/png", body: "intentional invalid image for fallback parity" }));
  for (const [name, hash, route] of pairs) for (const side of ["ref", "app"]) {
    const page = await ctx.newPage();
    await page.goto(side === "ref" ? REF + hash : APP + route, { waitUntil: "domcontentloaded" });
    await page.locator("footer .fc.on").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (ownershipOnly) {
      const adjusted = name === "affordability-adjusted";
      if (side === "ref") await alignOwnershipReference(page, adjusted);
      else if (adjusted) for (const [key, value] of Object.entries(adjustedInputs)) await setRange(page, key, value);
      if (name.startsWith("vehicle-") && name !== "vehicle-missing") {
        await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" });
        await studioClick(page, '[data-v="Side"]');
        await settleStudio(page);
      }
      if (side === "app" && ["/affordability", "/compare"].includes(route)) await page.locator('nav a[aria-current="page"]').waitFor();
      await page.evaluate(async () => { scrollTo(0, 0); await window.presentStudioFrame(); });
      const filename = `ownership-${name}-${vp.w}-${scheme}.png`;
      await page.screenshot({ path: `parity/${side}/${filename}`, fullPage: true });
      filenames.add(filename);
      console.log(`Captured ${filename} (${side})`);
      await page.close();
      continue;
    }
    if (marketplaceOnly) {
      if (side === "ref") await alignReferenceCatalogue(page, name === "home");
      else {
        await page.evaluate(() => document.querySelectorAll("a.card img").forEach((image) => { image.loading = "eager"; }));
        await page.waitForFunction(() => !document.querySelector("a.card img"), null, { polling: 50 });
        if (route === "/marketplace") await page.locator('nav a[aria-current="page"]').waitFor();
      }
      if (name === "home") {
        await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" });
        await studioClick(page, '[data-v="Side"]');
        await settleStudio(page);
      }
      await page.evaluate(async () => {
        document.querySelectorAll(".rv").forEach((element) => element.classList.add("in"));
        scrollTo(0, 0);
        await window.presentStudioFrame();
      });
      const filename = `marketplace-${name}-${vp.w}-${scheme}.png`;
      await page.screenshot({ path: `parity/${side}/${filename}`, fullPage: true });
      filenames.add(filename);
      console.log(`Captured ${filename} (${side})`);
      await page.close();
      continue;
    }
    if (studioOnly) {
      await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" });
      const states = [
        ...["3/4", "Side", "Front", "Rear"].map((view) => ({ name: `suv-${view.replace("/", "-").toLowerCase()}`, view })),
        { name: "hatch-side", body: "hatch", view: "Side" },
        { name: "mpv-side", body: "mpv" },
        { name: "silver", body: "suv", color: "#c8ccd2" },
        { name: "blue", color: "#2d4a63" },
        { name: "green", color: "#1f6f4a" },
        { name: "black", color: "#16191e" },
      ];
      for (const state of states) {
        if (state.body) await studioClick(page, `[data-b="${state.body}"]`);
        if (state.color) await studioClick(page, `[data-c="${state.color}"]`);
        if (state.view) await studioClick(page, `[data-v="${state.view}"]`);
        await settleStudio(page);
        const filename = `studio-${state.name}-${vp.w}-${scheme}.png`;
        await captureElement(page, ".stage", `parity/${side}/${filename}`);
        filenames.add(filename);
        if (state.name === "suv-side") {
          const hero = `hero-${vp.w}-${scheme}.png`;
          await captureElement(page, ".hero", `parity/${side}/${hero}`);
          filenames.add(hero);
        }
      }
      console.log(`Captured studio ${side}: ${vp.w}px ${scheme}`);
      await page.close();
      continue;
    }
    // Freeze the 3D view on the Side preset so both renders are comparable
    const side3d = page.locator('.stage .chip[data-v="Side"]');
    if (!shellOnly && await side3d.count()) { await side3d.click(); await page.waitForTimeout(1500); }
    await page.evaluate(() => document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")));
    const prefix = `${name}-${vp.w}-${scheme}`;
    if (shellOnly) {
      for (const selector of ["header", "footer"]) {
        const filename = `${prefix}-${selector}.png`;
        // Isolate the Home footer: its position depends on sections built in later phases.
        // Both sides hide only <main>; shell styles and the source artifact are untouched.
        if (selector === "footer" && name === "home") await page.locator("main").evaluate((element) => { element.style.display = "none"; });
        try {
          await page.locator(selector).screenshot({ path: `parity/${side}/${filename}` });
        } catch (error) {
          // The streamed Header can replace its identical Suspense fallback during capture.
          if (!error.message.includes("not attached")) throw error;
          await page.locator(selector).screenshot({ path: `parity/${side}/${filename}` });
        }
        filenames.add(filename);
      }
      if (name === "not-found") {
        const filename = `${prefix}.png`;
        await page.screenshot({ path: `parity/${side}/${filename}`, fullPage: true });
        filenames.add(filename);
      }
    } else {
      await page.screenshot({ path: `parity/${side}/${prefix}.png`, fullPage: true });
    }
    await page.close();
  }
  await ctx.close();
}
} finally {
  await browser.close();
  await new Promise((resolve) => referenceServer.close(resolve));
}

if (shellOnly || studioOnly || marketplaceOnly || ownershipOnly) {
  const results = [...filenames].map((filename) => {
    const ref = PNG.sync.read(readFileSync(`parity/ref/${filename}`));
    const app = PNG.sync.read(readFileSync(`parity/app/${filename}`));
    if (ref.width !== app.width || ref.height !== app.height) {
      return { filename, pass: false, reason: `Dimensions differ: ${ref.width}x${ref.height} vs ${app.width}x${app.height}` };
    }
    const diff = new PNG({ width: ref.width, height: ref.height });
    const pixels = pixelmatch(ref.data, app.data, diff.data, ref.width, ref.height, { threshold: 0.1 });
    writeFileSync(`parity/diff/${filename}`, PNG.sync.write(diff));
    return { filename, pass: pixels === 0, pixels, percent: +(pixels / (ref.width * ref.height) * 100).toFixed(4) };
  });
  writeFileSync(`parity/${mode}${onlyName ? `-${onlyName}` : ""}-results.json`, JSON.stringify(results, null, 2) + "\n");
  for (const result of results) console.log(`${result.pass ? "PASS" : "FAIL"} ${result.filename}: ${result.reason || `${result.pixels} differing pixels (${result.percent}%)`}`);
  if (results.some((result) => !result.pass)) process.exitCode = 1;
} else {
  console.log("Done. Compare parity/ref vs parity/app (same filenames). Later-phase screens are intentionally incomplete during the phased implementation.");
}
