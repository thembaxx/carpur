// Verify the complete Phase 4 flow using the original artifact as the numeric oracle.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { referenceCars } from "./catalogue-reference.mjs";
import { energyNote, setRange } from "./ownership-reference.mjs";
import { controlStudioFrames, studioClick, settleStudio } from "./studio-browser.mjs";
import { installStudioProbe } from "./studio-probe.mjs";

const APP = process.argv[2] || "http://localhost:3000";
const server = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(readFileSync(new URL("../reference/carpur-artifact.html", import.meta.url)));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, proxy: proxy ? { server: proxy, bypass: "localhost,127.0.0.1" } : undefined, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await controlStudioFrames(context);
await context.addInitScript(installStudioProbe);
const page = await context.newPage(), reference = await context.newPage();
const checks = [], errors = [], mutationRequests = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") {
    const evidence = `${message.text()} @ ${message.location().url} (page: ${page.url()}, after: ${checks.at(-1)?.name || "startup"})`;
    errors.push(evidence);
    console.log(`BROWSER ERROR ${evidence}`);
  }
});
page.on("response", (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
page.on("request", (request) => { if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) mutationRequests.push(request.url()); });
mkdirSync("parity/checks", { recursive: true });
const passed = (name, evidence) => { checks.push({ name, pass: true, evidence }); console.log(`PASS ${name}`); };
const goto = async (route) => {
  await page.goto(APP + route, { waitUntil: "domcontentloaded" });
  await page.locator("footer .fc.on").first().waitFor();
};
const click = (selector) => page.locator(selector).evaluate((element) => element.click());
const select = (selector, value) => page.locator(selector).evaluate((element, value) => {
  element.value = value;
  element.dispatchEvent(new Event("change", { bubbles: true }));
}, value);
async function expected(price, options = {}) {
  return reference.evaluate(({ price, options }) => window.eval(`(p,o)=>{
    const {dep=10,n=60,rate=12.5,km=1500,fp=24}=o,r=run(p,km,6.5,fp);
    const parts=[fin(p,dep,n,rate),r.fuel,r.ins,r.mnt],monthly=parts.reduce((a,b)=>a+b,0);
    return {monthly:R(monthly),parts:parts.map(R),widths:parts.map(v=>v/monthly*100),totals:[1,3,5].map(y=>R(total(p,y,o)))};
  }`)(price, options), { price, options });
}
async function actualOptions() {
  return page.locator("#af input").evaluateAll((inputs) => Object.fromEntries(inputs.map((input) => [input.id, Number(input.value)])));
}
async function assertCosts(price) {
  const result = await expected(price, await actualOptions());
  await page.waitForFunction((text) => document.querySelector("#res h2")?.textContent === text, result.monthly, { polling: 50 });
  assert.deepEqual(await page.locator("#res .ln b").allTextContents(), [...result.parts, ...result.totals]);
  const widths = await page.locator("#res .bar i").evaluateAll((parts) => parts.map((part) => parseFloat(part.style.width)));
  widths.forEach((width, index) => assert.ok(Math.abs(width - result.widths[index]) < 0.001));
  assert.ok(Math.abs(widths.reduce((a, b) => a + b, 0) - 100) < 0.001);
  return result;
}
async function saved(value) {
  await page.waitForFunction((value) => document.querySelector("[data-save]")?.getAttribute("aria-pressed") === String(value), value, { polling: 50 });
}
const probe = () => page.evaluate(() => window.studioProbe());

try {
  await reference.goto(`http://127.0.0.1:${server.address().port}/#/afford`, { waitUntil: "domcontentloaded" });
  await goto("/affordability");
  const responses = await Promise.all(referenceCars.map(async (car) => {
    const response = await context.request.get(`${APP}/vehicles/${car.id}`);
    assert.equal(response.status(), 200);
    return { car, html: await response.text(), totals: (await expected(car.p)).totals };
  }));
  const rendered = await page.evaluate((responses) => responses.map(({ car, html, totals }) => {
    const document = new DOMParser().parseFromString(html, "text/html");
    return { id: car.id, name: document.querySelector("main h2")?.textContent, totals: [...document.querySelectorAll("main .card .ln b")].map((element) => element.textContent), expectedName: car.n, expectedTotals: totals };
  }), responses);
  for (const row of rendered) { assert.equal(row.name, row.expectedName); assert.deepEqual(row.totals, row.expectedTotals); }
  passed("All 44 vehicle routes render the sourced name and the reference 1/3/5-year estimates", { routes: rendered.length });

  assert.equal(await page.locator("#p option").count(), 44);
  assert.equal(await page.locator("#p").inputValue(), "catalogue-toyota-1616");
  const baseline = await assertCosts(273700);
  const ranges = [["dep", 0, 50, 5], ["n", 12, 72, 12], ["rate", 6, 20, 0.5], ["km", 200, 4000, 100], ["fp", 18, 32, 0.5]];
  for (const [key, min, max, step] of ranges) {
    const input = page.locator(`#${key}`);
    for (const [attribute, value] of [["min", min], ["max", max], ["step", step]]) assert.equal(await input.getAttribute(attribute), String(value));
    assert.ok(await input.evaluate((element) => element.labels.length === 1));
    for (const value of [min, max]) { await setRange(page, key, value); await assertCosts(273700); }
  }
  await page.locator("#dep").focus();
  await page.keyboard.press("ArrowLeft");
  await page.waitForFunction(() => document.querySelector("#odep").textContent === "45", null, { polling: 50 });
  await assertCosts(273700);
  passed("Five labelled sliders update live costs, segment widths and totals at all endpoints; keyboard works", baseline);

  // A 12-month loan must stop its finance payments after year one.
  await setRange(page, "n", 12);
  const capped = await assertCosts(273700);
  const values = await actualOptions();
  const running = 273700 * 0.065 / 12 + values.km * 6.5 / 100 * values.fp;
  const numeric = (value) => Number(value.replace(/\D/g, ""));
  assert.ok(Math.abs(numeric(capped.totals[2]) - numeric(capped.totals[0]) - 48 * running) <= 1);
  for (const car of referenceCars) {
    await select("#p", car.id);
    await assertCosts(car.p);
    assert.equal(await page.getByText(energyNote, { exact: true }).count(), car.f !== "Petrol" ? 1 : 0);
  }
  assert.deepEqual(mutationRequests, []);
  passed("Every catalogue car calculates correctly; short terms cap finance; non-petrol assumptions are disclosed; inputs stay local");

  for (const [id, expectedId] of [["catalogue-toyota-1919", "catalogue-toyota-1919"], ["urban", "catalogue-toyota-1611"], ["missing", "catalogue-toyota-1616"]]) {
    await goto(`/affordability?id=${id}`);
    assert.equal(await page.locator("#p").inputValue(), expectedId);
    await assertCosts(referenceCars.find((car) => car.id === expectedId).p);
  }
  await goto("/affordability?id=catalogue-toyota-1919&id=urban");
  assert.equal(await page.locator("#p").inputValue(), "catalogue-toyota-1919");
  passed("Canonical, legacy alias, missing and repeated affordability preselection is safe");

  await goto("/vehicles/catalogue-toyota-1616");
  await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" });
  await studioClick(page, '[data-v="Side"]'); await settleStudio(page);
  assert.equal(await page.locator(".stage [data-b]").count(), 0);
  await page.evaluate(() => localStorage.setItem("cp.s", JSON.stringify(["starlet", "catalogue-toyota-1616"])));
  await page.reload({ waitUntil: "domcontentloaded" });
  await saved(true);
  await page.evaluate(() => scrollTo(0, 350));
  const position = await page.evaluate(() => scrollY);
  await click("[data-save]"); await saved(false);
  assert.equal(await page.evaluate(() => scrollY), position);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("cp.s"))), []);
  await click("[data-save]"); await saved(true);
  assert.equal(await page.evaluate(() => scrollY), position);
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("cp.s"))), ["catalogue-toyota-1616"]);
  await page.reload({ waitUntil: "domcontentloaded" }); await saved(true);
  passed("Save/remove persists without scroll jumps, accepts legacy IDs, removes duplicates and writes canonical IDs");

  await page.locator(".stage canvas").waitFor({ state: "attached" });
  const before = await probe();
  await click('a[href^="/affordability?id="]');
  await page.locator("#p").waitFor({ state: "attached" });
  assert.equal(await page.locator("#p").inputValue(), "catalogue-toyota-1616");
  const after = await probe();
  assert.equal(after.session, before.session);
  assert.ok(after.contexts.every((item) => item.lost));
  assert.equal(after.pendingFrames, 0);
  assert.equal(after.stageObservers, 0);
  await goto("/vehicles/catalogue-toyota-1743");
  await page.locator(".stage canvas").waitFor({ state: "attached" });
  const vehicleSession = (await probe()).session;
  await click('a[href^="/compare?a="]');
  await page.locator("#ca").waitFor({ state: "attached" });
  assert.equal(await page.locator("#ca").inputValue(), "catalogue-toyota-1743");
  assert.equal((await probe()).session, vehicleSession);
  assert.ok((await probe()).contexts.every((item) => item.lost));
  passed("Vehicle actions select the correct car; client navigation disposes the viewer without a full reload", after);

  await goto("/compare");
  assert.equal(await page.locator("#ca option").count(), 44);
  assert.equal(await page.locator("#cb option").count(), 44);
  assert.equal(await page.locator("#ca").inputValue(), "catalogue-toyota-1616");
  assert.equal(await page.locator("#cb").inputValue(), "catalogue-toyota-1919");
  assert.equal(await page.locator("td.w").count(), 3);
  assert.ok((await page.locator("td.w").evaluateAll((cells) => cells.map((cell) => cell.getAttribute("aria-label")))).every((value) => value.includes("lower cost")));
  await select("#ca", "catalogue-toyota-1919");
  await page.waitForFunction(() => new URLSearchParams(location.search).get("a") === "catalogue-toyota-1919", null, { polling: 50 });
  await page.waitForFunction(() => document.querySelectorAll("td.w").length === 0, null, { polling: 50 });
  await select("#cb", "catalogue-toyota-1616");
  await page.waitForFunction(() => document.querySelectorAll("td.w").length === 3, null, { polling: 50 });
  assert.equal(new URL(page.url()).searchParams.get("b"), "catalogue-toyota-1616");
  assert.ok(await page.locator("td.w").evaluateAll((cells) => cells.every((cell) => cell.cellIndex === 2)));
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("#cb").inputValue(), "catalogue-toyota-1616");
  await page.goBack({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#cb").value === "catalogue-toyota-1919", null, { polling: 50 });
  await page.goForward({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#cb").value === "catalogue-toyota-1616", null, { polling: 50 });
  const sedan = referenceCars.find((car) => car.bodyStyle === "Sedan");
  await select("#ca", sedan.id);
  await page.waitForFunction((name) => document.querySelector("tbody tr:last-child td:nth-child(2)").textContent === name, "Sedan", { polling: 50 });
  assert.equal(await page.getByText(energyNote, { exact: true }).count(), 1);
  await goto("/compare?a=missing&b=missing");
  assert.equal(await page.locator("#ca").inputValue(), "catalogue-toyota-1616");
  assert.equal(await page.locator("#cb").inputValue(), "catalogue-toyota-1919");
  await goto("/compare?a=urban&b=rumion");
  assert.equal(await page.locator("#ca").inputValue(), "catalogue-toyota-1611");
  assert.equal(await page.locator("#cb").inputValue(), "catalogue-toyota-1743");
  passed("Comparison URLs/history, defaults, aliases, ties, lower-cost highlights and sourced body labels work");

  for (const route of ["/affordability", "/compare", "/vehicles/catalogue-toyota-1743"]) {
    await goto(route);
    for (const width of [320, 390, 768, 899, 900, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${route} at ${width}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    if (route.startsWith("/vehicles")) { await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" }); await studioClick(page, '[data-v="Side"]'); await settleStudio(page); }
    await page.screenshot({ path: `parity/checks/ownership-${route.split("/")[1]}-390.png`, fullPage: true });
  }
  const missing = await context.request.get(APP + "/vehicles/missing");
  assert.equal(missing.status(), 404);
  assert.match(await missing.text(), /Page not found/);
  passed("Three Phase 4 routes fit seven widths including the 900px breakpoint; missing vehicles return HTTP 404");
  assert.deepEqual(errors, []);
  assert.deepEqual(mutationRequests, []);
  passed("No unexpected console/runtime errors or financial-input submissions");
} catch (error) {
  checks.push({ name: error.message, pass: false });
  throw error;
} finally {
  writeFileSync("parity/ownership-checks.json", JSON.stringify({ checks, errors, mutationRequests }, null, 2) + "\n");
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
