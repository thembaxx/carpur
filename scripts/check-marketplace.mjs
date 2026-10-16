// Phase 3 end-to-end checks against the running app and the original source snapshot.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { snapshot, featuredIds } from "./catalogue-reference.mjs";

const APP = process.argv[2] || "http://localhost:3000";
const proxyServer = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  proxy: proxyServer ? { server: proxyServer, bypass: "localhost,127.0.0.1" } : undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const errors = [], checks = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
mkdirSync("parity/checks", { recursive: true });
const passed = (name) => { checks.push({ name, pass: true }); console.log(`PASS ${name}`); };
const goto = async (route) => {
  await page.goto(APP + route, { waitUntil: "domcontentloaded" });
  await page.locator("footer .fc.on").first().waitFor();
};
const cards = () => page.locator('a.card[href^="/vehicles/"]');
const cardIds = () => cards().evaluateAll((items) => items.map((item) => item.getAttribute("href").split("/").pop()));
const sourceIds = (rows) => rows.map((row) => `catalogue-toyota-${row.id}`);
const ordered = [...snapshot].sort((a, b) => Number(a.price) - Number(b.price));
const chip = (label) => page.locator("main .row").getByRole("link", { name: label, exact: true });
async function waitForCards(count) { await page.waitForFunction((n) => document.querySelectorAll('a.card[href^="/vehicles/"]').length === n, count); }

try {
  assert.equal(snapshot.length, 44);
  assert.equal(new Set(snapshot.map((row) => row.id)).size, 44);
  assert.equal(new Set(snapshot.map((row) => row.rangeName.replace(/^Toyota\s+/i, ""))).size, 10);
  await goto("/marketplace");
  assert.deepEqual(await cardIds(), sourceIds(ordered));
  const content = await cards().evaluateAll((items) => items.map((item) => ({
    name: item.querySelector("b").textContent,
    price: item.querySelector("b:last-child").textContent,
    label: item.querySelector(".k").textContent,
    basis: item.querySelector(".mut").textContent,
    revealed: item.classList.contains("rv"),
  })));
  for (const [index, row] of ordered.entries()) {
    assert.ok(content[index].name.startsWith("Toyota ") && content[index].name.includes(row.name));
    assert.equal(Number(content[index].price.replace(/\D/g, "")), Number(row.price));
    assert.equal(content[index].label, `New · ${/manual/i.test(row.transmission) ? "Manual" : "Automatic"}`);
    assert.equal(content[index].basis, "Manufacturer reference price");
    assert.equal(content[index].revealed, false);
  }
  assert.equal(await page.locator('nav a[aria-current="page"]').textContent(), "New Cars");
  passed("All 44 unique source IDs, names, prices, transmissions and price labels; Marketplace cards render without reveal");

  for (const [fuel, rows] of [
    ["Petrol", snapshot.filter((row) => /^Petrol/i.test(row.fuelType) && !/hybrid/i.test(row.fuelType))],
    ["Diesel", snapshot.filter((row) => /diesel/i.test(row.fuelType))],
    ["Hybrid", snapshot.filter((row) => /hybrid/i.test(row.fuelType) && !/plug-in/i.test(row.fuelType))],
    ["Plug-in Hybrid", snapshot.filter((row) => /plug-in/i.test(row.fuelType))],
    ["Electric", []],
  ]) {
    await chip(fuel).click();
    await waitForCards(rows.length);
    assert.equal(new URL(page.url()).searchParams.get("fuel"), fuel);
    assert.deepEqual(await cardIds(), sourceIds(rows.sort((a, b) => Number(a.price) - Number(b.price))));
    assert.equal(await chip(fuel).getAttribute("aria-current"), "true");
    assert.equal(await page.locator('nav a[aria-current="page"]').count(), 0);
  }
  await page.getByRole("link", { name: "Show all new cars", exact: true }).click();
  await waitForCards(44);
  assert.equal(new URL(page.url()).search, "");
  passed("URL fuel filters return 20 petrol, 16 diesel, 7 hybrid, 1 plug-in hybrid, 0 electric; empty-state recovery works");

  await chip("Price low → high").click();
  await page.waitForURL("**/marketplace?sort=price-high");
  assert.deepEqual(await cardIds(), sourceIds([...ordered].sort((a, b) => Number(b.price) - Number(a.price))));
  await chip("Hybrid").click();
  await waitForCards(7);
  assert.equal(new URL(page.url()).searchParams.get("sort"), "price-high");
  await page.reload({ waitUntil: "domcontentloaded" });
  await chip("Price high → low").waitFor();
  assert.equal(await chip("Hybrid").getAttribute("aria-current"), "true");
  await chip("Used").click();
  await waitForCards(0);
  assert.equal(new URL(page.url()).searchParams.get("inventory"), "sellers");
  assert.equal(new URL(page.url()).searchParams.get("condition"), "USED");
  assert.equal(new URL(page.url()).searchParams.get("fuel"), "Hybrid");
  assert.match(await page.locator("main .empty").textContent(), /Seller inventory is coming/);
  assert.equal(await page.locator("main .empty a").getAttribute("href"), "/sell");
  await page.goBack();
  await waitForCards(7);
  await page.goForward();
  await waitForCards(0);
  await chip("New").click();
  await waitForCards(7);
  assert.equal(new URL(page.url()).searchParams.has("condition"), false);
  assert.equal(new URL(page.url()).searchParams.has("inventory"), false);
  await chip("All").click();
  await waitForCards(44);
  assert.equal(new URL(page.url()).searchParams.has("fuel"), false);
  passed("Sorting, mode changes and All preserve relevant URL state; reload, Back and Forward restore it");

  await goto("/marketplace?body=MPV&q=Rumion&sort=price-high");
  assert.equal(await cards().count(), 5);
  await chip("Petrol").click();
  await page.waitForURL((url) => url.searchParams.get("fuel") === "Petrol");
  assert.equal(new URL(page.url()).searchParams.get("body"), "MPV");
  assert.equal(new URL(page.url()).searchParams.get("q"), "Rumion");
  await goto("/marketplace?inventory=sellers&condition=USED");
  assert.equal(await page.locator('nav a[aria-current="page"]').textContent(), "Used Cars");
  for (const query of ["fuel=Unknown", "body=Unknown", "q=unlisted-vehicle", "inventory=examples", "condition=INVALID"]) {
    await goto(`/marketplace?${query}`);
    assert.equal(await cards().count(), 0);
    assert.match(await page.locator("main .empty").textContent(), /No variants listed yet/);
  }
  await goto("/marketplace?fuel=Diesel&fuel=Hybrid&sort=invalid");
  assert.equal(await cards().count(), 16);
  assert.equal(await chip("Diesel").getAttribute("aria-current"), "true");
  await chip("Hybrid").focus();
  assert.ok(await chip("Hybrid").evaluate((element) => element.matches(":focus-visible")));
  await page.keyboard.press("Enter");
  await waitForCards(7);
  passed("Existing search/body queries survive chip navigation; invalid/repeated values are safe; keyboard activation works");

  await goto("/");
  assert.deepEqual(await cardIds(), featuredIds.map((id) => `catalogue-toyota-${id}`));
  assert.equal(await page.locator('a.card.rv[href^="/vehicles/"]').count(), 4);
  assert.deepEqual(await page.locator("main h2").allTextContents(), ["Discover new cars.", "Second hand. First choice.", "Explore the technology.", "A car you love. A budget that works.", "Find your next buyer."]);
  assert.equal(await page.locator(".ln.mut").count(), 5);
  for (const [label, href] of [["Shop new cars", "/marketplace"], ["Shop second hand", "/marketplace?inventory=sellers&condition=USED"], ["Check my budget", "/affordability"], ["Compare two cars", "/compare"], ["Sell on Carpur", "/sell"]]) {
    assert.equal(await page.getByRole("link", { name: label, exact: true }).getAttribute("href"), href);
  }
  assert.deepEqual(await page.locator("main .grid").nth(1).locator("a").evaluateAll((items) => items.map((item) => new URL(item.href).searchParams.get("fuel"))), ["Petrol", "Hybrid", "Electric", "Plug-in Hybrid"]);
  await page.evaluate(() => document.querySelectorAll('a.card img').forEach((image) => { image.loading = "eager"; }));
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll('a.card[href^="/vehicles/"] img')];
    return images.length === 4 && images.every((image) => image.complete && image.naturalWidth > 0);
  }, null, { timeout: 30000 });
  const images = await page.locator('a.card[href^="/vehicles/"] img').evaluateAll((items) => items.map((image) => image.currentSrc));
  assert.ok(images.every((src) => new URL(src).pathname === "/_next/image" && new URL(src).searchParams.get("url").startsWith("https://assets.cdntoyota.co.za/")));
  for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Home overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.stage [data-v="Side"]').click();
  await page.screenshot({ path: "parity/checks/home-photos-390.png", fullPage: true });
  passed("Home section order, copy, checklist, actions and four real featured photos; responsive layout at seven widths");

  for (const fuel of ["Diesel", "Hybrid"]) {
    await goto(`/marketplace?fuel=${fuel}`);
    await page.waitForFunction(() => {
      const image = document.querySelector('a.card img');
      return image?.complete && image.naturalWidth > 0;
    }, null, { timeout: 30000 });
  }
  await goto("/marketplace");
  for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Marketplace overflow at ${width}px`);
  }
  await page.waitForFunction(() => document.querySelector('a.card img')?.naturalWidth > 0);
  const healthyBox = await cards().first().boundingBox();
  await page.screenshot({ path: "parity/checks/marketplace-photos-1440.png" });
  await context.route("**/_next/image?*", (route) => route.fulfill({ status: 200, contentType: "image/png", body: "intentional decode failure" }));
  await goto("/marketplace");
  await page.waitForFunction(() => !!document.querySelector("a.card svg"));
  const fallbackBox = await cards().first().boundingBox();
  assert.deepEqual(fallbackBox, healthyBox, "Image failure must preserve the card's dimensions");
  assert.equal(await cards().first().locator("svg").getAttribute("aria-hidden"), "true");
  assert.match(await cards().first().textContent(), /Toyota Starlet/);
  assert.equal(await cards().first().getAttribute("href"), "/vehicles/catalogue-toyota-1616");
  passed("Healthy photos use next/image, diesel/hybrid photos load, image failure preserves card size and accessible vehicle link");
  assert.deepEqual(errors, [], "Unexpected browser console, HTTP or runtime errors");
  passed("No unexpected browser console, HTTP or runtime errors");

  const revealContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await revealContext.addInitScript(() => {
    window.revealObservers = [];
    const NativeObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        super(callback, options);
        this.record = { threshold: options?.threshold, observed: 0, unobserved: 0 };
        window.revealObservers.push(this.record);
      }
      observe(element) { this.record.observed++; return super.observe(element); }
      unobserve(element) { this.record.unobserved++; return super.unobserve(element); }
    };
  });
  const revealPage = await revealContext.newPage();
  await revealPage.goto(APP, { waitUntil: "domcontentloaded" });
  await revealPage.locator("footer .fc.on").first().waitFor();
  const lastReveal = revealPage.locator("main > section.empty.rv");
  await lastReveal.scrollIntoViewIfNeeded();
  await revealPage.waitForFunction(() => document.querySelector("main > section.empty.rv")?.classList.contains("in"));
  const records = await revealPage.evaluate(() => window.revealObservers.filter((record) => record.threshold === 0.1));
  assert.equal(records.length, 1);
  assert.ok(records[0].observed >= 20 && records[0].unobserved > 0);
  await revealPage.evaluate(() => scrollTo(0, 0));
  assert.ok(await lastReveal.evaluate((element) => element.classList.contains("in")));
  await revealPage.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await lastReveal.evaluate((element) => getComputedStyle(element).transitionDuration), "0s");
  assert.equal(await lastReveal.evaluate((element) => getComputedStyle(element).opacity), "1");
  await revealContext.close();
  passed("One shared threshold-0.1 reveal observer; revealed elements stay visible; reduced motion disables transitions");
} catch (error) {
  checks.push({ name: error.message, pass: false });
  throw error;
} finally {
  writeFileSync("parity/marketplace-checks.json", JSON.stringify({ checks, errors }, null, 2) + "\n");
  await browser.close();
}
