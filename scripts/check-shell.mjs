// Phase 1 browser checks against a running production or development server.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const APP = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errors = [];
async function open(options = {}, seed = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 520 }, ...options });
  await context.addInitScript((values) => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    window.themeActions = [];
    const set = Element.prototype.setAttribute, remove = Element.prototype.removeAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (this === document.documentElement && name === "data-theme") window.themeActions.push(value);
      return set.call(this, name, value);
    };
    Element.prototype.removeAttribute = function (name) {
      if (this === document.documentElement && name === "data-theme") window.themeActions.push(null);
      return remove.call(this, name);
    };
  }, seed);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(APP, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Device", exact: true }).waitFor();
  return { context, page };
}
async function selected(page, name) {
  await page.waitForFunction((label) => [...document.querySelectorAll("footer button")].some((button) => button.textContent === label && button.getAttribute("aria-pressed") === "true"), name);
}

try {
  for (const theme of ["light", "dark"]) {
    const { context, page } = await open({ colorScheme: theme === "light" ? "dark" : "light" }, { "cp.t": JSON.stringify(theme), "cp.q": '"high"' });
    await selected(page, theme === "light" ? "Light" : "Dark");
    assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
    assert.ok((await page.evaluate(() => window.themeActions)).every((value) => value === theme), "Saved theme must remain applied throughout hydration");
    await selected(page, "High detail");
    await page.reload({ waitUntil: "domcontentloaded" });
    await selected(page, theme === "light" ? "Light" : "Dark");
    assert.ok((await page.evaluate(() => window.themeActions)).every((value) => value === theme));
    await context.close();
  }
  console.log("PASS saved light/dark override device settings and survive reload without a theme reset");

  const { context, page } = await open({ colorScheme: "light" });
  assert.equal(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor), "rgb(243, 241, 236)");
  await page.emulateMedia({ colorScheme: "dark" });
  assert.equal(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor), "rgb(9, 11, 14)");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await selected(page, "Light");
  await page.locator("footer").scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await selected(page, "Dark");
  assert.equal(await page.evaluate(() => window.scrollY), scroll);
  await page.getByRole("button", { name: "Save battery", exact: true }).click();
  await selected(page, "Save battery");
  assert.equal(await page.evaluate(() => window.scrollY), scroll);
  assert.equal(await page.evaluate(() => localStorage.getItem("cp.q")), '"save"');
  await page.reload({ waitUntil: "domcontentloaded" });
  await selected(page, "Save battery");
  await page.getByRole("button", { name: "Device", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), null);
  console.log("PASS Device tracks the OS; theme and quality changes persist without moving the page");

  const second = await context.newPage();
  await second.goto(APP, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await selected(second, "Light");
  await second.evaluate(() => localStorage.clear());
  await selected(page, "Device");
  await selected(page, "Automatic");
  await second.close();
  console.log("PASS preferences synchronize across tabs, including cleared storage");

  const routes = [
    ["/", null],
    ["/marketplace", "New Cars"],
    ["/marketplace?condition=USED&inventory=sellers", "Used Cars"],
    ["/marketplace?inventory=sellers&condition=USED&fuel=Petrol", null],
    ["/marketplace?fuel=Hybrid", null],
    ["/affordability", "Affordability"],
    ["/affordability?id=starlet", null],
    ["/compare", "Compare"],
    ["/compare?a=starlet", null],
    ["/garage", "My Garage"],
    ["/vehicles/catalogue-toyota-1611", null],
  ];
  for (const [route, label] of routes) {
    await page.evaluate((url) => window.history.pushState(null, "", url), route);
    await page.waitForFunction((expected) => {
      const active = [...document.querySelectorAll("nav a[aria-current=page]")];
      return expected === null ? active.length === 0 : active.length === 1 && active[0].textContent === expected;
    }, label);
  }
  console.log("PASS exact pathname/query navigation highlights, including reordered query parameters");

  await page.goto(APP, { waitUntil: "domcontentloaded" });
  for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      navOrder: getComputedStyle(document.querySelector("nav")).order,
      font: getComputedStyle(document.body).fontFamily,
      viewport: document.querySelector('meta[name="viewport"]').content,
    }));
    assert.equal(dimensions.overflow, false, `Horizontal page overflow at ${width}px`);
    assert.equal(dimensions.navOrder, width < 900 ? "3" : "0");
    assert.match(dimensions.font, /Sora/);
    assert.match(dimensions.viewport, /viewport-fit=cover/);
  }
  for (const label of ["Carpur.", "New Cars", "Used Cars", "Affordability", "Compare", "My Garage", "Sign in", "Sell"]) {
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").textContent(), label);
    assert.ok(await page.locator(":focus").evaluate((element) => element.matches(":focus-visible")));
  }
  await context.close();
  console.log("PASS responsive shell at seven widths, 900px breakpoint, safe-area viewport, and keyboard focus");

  for (const seed of [
    { "cp.t": "invalid json", "cp.q": '"unknown"', "cp.s": '{"invalid":true}' },
    { "cp.t": '"unknown"', "cp.q": "true", "cp.s": "null" },
  ]) {
    const test = await open({}, seed);
    await selected(test.page, "Device");
    await selected(test.page, "Automatic");
    await test.page.getByRole("button", { name: "Dark", exact: true }).click();
    await selected(test.page, "Dark");
    await test.context.close();
  }
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException("Storage blocked", "SecurityError"); };
  });
  const blockedPage = await blocked.newPage();
  blockedPage.on("pageerror", (error) => errors.push(error.message));
  await blockedPage.goto(APP, { waitUntil: "domcontentloaded" });
  await blockedPage.getByRole("button", { name: "Dark", exact: true }).click();
  await selected(blockedPage, "Dark");
  await blockedPage.getByRole("button", { name: "High detail", exact: true }).click();
  await selected(blockedPage, "High detail");
  await blocked.close();
  console.log("PASS malformed/blocked localStorage falls back safely; settings still work in memory");
  assert.deepEqual(errors, [], "Unexpected browser runtime errors");
  console.log("PASS no browser runtime errors");
} finally {
  await browser.close();
}
