import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { controlStudioFrames, studioClick, settleStudio, captureElement } from "./studio-browser.mjs";
import { installStudioProbe } from "./studio-probe.mjs";

const APP = process.argv[2] || "http://localhost:3000";
const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args });
const errors = [], results = [];
mkdirSync("parity/checks", { recursive: true });
function watch(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
}
function pass(name, evidence = undefined) { results.push({ name, pass: true, evidence }); console.log(`PASS ${name}`); }
async function image(page, name) {
  const filename = `parity/checks/${name}.png`;
  await captureElement(page, ".stage", filename);
  return PNG.sync.read(readFileSync(filename));
}
function difference(a, b, threshold = 0.1) {
  assert.equal(a.width, b.width); assert.equal(a.height, b.height);
  return pixelmatch(a.data, b.data, null, a.width, a.height, { threshold });
}
async function probe(page) { return page.evaluate(() => window.studioProbe()); }

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await controlStudioFrames(context);
  await context.addInitScript(installStudioProbe);
  const page = await context.newPage();
  watch(page);
  await page.goto(APP + "/studio", { waitUntil: "domcontentloaded" });
  await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator(".stage canvas").count(), 1);
  assert.equal(await page.locator(".stage button").count(), 13);
  assert.ok(await page.locator(".stage button").evaluateAll((buttons) => buttons.every((button) => button.type === "button" && button.hasAttribute("aria-pressed") && (button.textContent.trim() || button.getAttribute("aria-label")))));
  assert.equal(await page.locator('.stage [data-a]').getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('.stage [data-b="suv"]').getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('.stage [data-c="#b3422e"]').getAttribute("aria-pressed"), "true");
  pass("One renderer, thirteen named controls, SUV/red defaults, auto-rotate enabled");

  const views = [];
  for (const name of ["3/4", "Side", "Front", "Rear"]) {
    await studioClick(page, `[data-v="${name}"]`);
    await settleStudio(page);
    assert.equal(await page.locator('.stage [data-a]').getAttribute("aria-pressed"), "false");
    assert.equal(await page.locator(`.stage [data-v="${name}"]`).getAttribute("aria-pressed"), "true");
    const current = await image(page, `view-${name.replace("/", "-")}`);
    for (const previous of views) assert.ok(difference(previous, current) > 1000);
    views.push(current);
  }
  pass("Four presets render distinct views and stop auto-rotate");

  await studioClick(page, '[data-v="Side"]');
  await settleStudio(page);
  const before = await image(page, "stopped-before");
  await settleStudio(page, 30);
  assert.equal(difference(before, await image(page, "stopped-after")), 0);
  await studioClick(page, "[data-a]");
  await settleStudio(page, 30);
  assert.ok(difference(before, await image(page, "rotating")) > 1000);
  await studioClick(page, "[data-a]");
  await settleStudio(page);
  const paused = await image(page, "paused");
  await settleStudio(page, 30);
  assert.equal(difference(paused, await image(page, "paused-after")), 0);
  pass("Auto-rotate moves the model and stays still when stopped");

  await page.locator(".stage").evaluate((element) => element.scrollIntoView({ block: "center" }));
  const box = await page.locator(".stage canvas").boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 90, y + 35, { steps: 8 }); await page.mouse.up();
  await settleStudio(page);
  assert.ok(difference(paused, await image(page, "dragged")) > 1000);
  await studioClick(page, '[data-v="Side"]'); await settleStudio(page);
  await studioClick(page, "[data-a]"); await settleStudio(page, 5);
  await page.mouse.move(x, y); await page.mouse.down(); await settleStudio(page);
  const held = await image(page, "pointer-held");
  await settleStudio(page, 30);
  assert.equal(difference(held, await image(page, "pointer-held-after")), 0);
  await page.mouse.up(); await settleStudio(page, 30);
  assert.ok(difference(held, await image(page, "pointer-released")) > 1000);
  pass("Pointer drag orbits; auto-rotate pauses while held and resumes after release");

  await studioClick(page, '[data-v="Side"]'); await settleStudio(page);
  let previous = await image(page, "paint-red");
  for (const color of ["#c8ccd2", "#2d4a63", "#1f6f4a", "#16191e", "#b3422e"]) {
    await studioClick(page, `[data-c="${color}"]`); await settleStudio(page, 1);
    assert.equal(await page.locator(`.stage [data-c="${color}"]`).getAttribute("aria-pressed"), "true");
    const current = await image(page, `paint-${color.slice(1)}`);
    assert.ok(difference(previous, current, 0.01) > 1000); previous = current;
  }
  pass("All five swatches visibly recolor the paint and expose their selected state");

  const baseline = await probe(page);
  const session = baseline.session;
  const bodies = [];
  for (const body of ["hatch", "mpv", "suv"]) {
    await studioClick(page, `[data-b="${body}"]`); await settleStudio(page, 1);
    assert.equal(await page.locator(`.stage [data-b="${body}"]`).getAttribute("aria-pressed"), "true");
    const current = await image(page, `body-${body}`);
    for (const old of bodies) assert.ok(difference(old, current) > 100);
    bodies.push(current);
  }
  for (let i = 0; i < 15; i++) {
    await studioClick(page, `[data-b="${["hatch", "mpv", "suv"][i % 3]}"]`); await settleStudio(page, 1);
  }
  const after = await probe(page);
  assert.equal(after.contexts.length, 1);
  for (const kind of ["Buffer", "Texture", "Program", "Framebuffer", "Renderbuffer", "VertexArray"]) {
    if (baseline.contexts[0].resources[kind]) assert.equal(after.contexts[0].resources[kind].live, baseline.contexts[0].resources[kind].live, `${kind} allocations grew after body switches`);
  }
  pass("HATCH/SUV/MPV render distinctly; eighteen replacements keep live GPU allocations bounded", after.contexts[0].resources);

  for (const [label, ratio] of [["Save battery", 1], ["High detail", 2.5], ["Automatic", 2]]) {
    await page.locator(".stage canvas").evaluate((element) => { window.previousStudioCanvas = element; });
    await page.getByRole("button", { name: label, exact: true }).evaluate((element) => element.click());
    await page.waitForFunction(() => {
      const canvas = document.querySelector(".stage canvas");
      return canvas && canvas !== window.previousStudioCanvas && document.querySelector(".stage .ctl");
    }, undefined, { polling: 50 });
    await settleStudio(page, 1);
    const size = await page.locator(".stage canvas").evaluate((canvas) => ({ width: canvas.width, height: canvas.height, cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight }));
    assert.equal(size.width, Math.floor(size.cssWidth * ratio)); assert.equal(size.height, Math.floor(size.cssHeight * ratio));
    const state = await probe(page);
    assert.equal(state.session, session);
    assert.equal(state.contexts.filter((entry) => !entry.lost).length, 1);
    assert.ok(state.contexts.slice(0, -1).every((entry) => entry.lostRequests === 1 && !entry.connected));
  }
  pass("Quality remounts exactly one renderer, releases old contexts, and applies 1/2/2.5 pixel-ratio caps");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const stage = document.querySelector(".stage"), canvas = stage.querySelector("canvas");
    return canvas.width === Math.floor(stage.clientWidth * 2) && canvas.height === Math.floor(stage.clientHeight * 2);
  }, undefined, { polling: 50 });
  assert.equal(await page.locator(".stage").evaluate((element) => getComputedStyle(element).touchAction), "pan-y");
  await page.locator('.stage [data-v="Front"]').focus(); await page.keyboard.press("Space"); await settleStudio(page);
  assert.equal(await page.locator('.stage [data-v="Front"]').getAttribute("aria-pressed"), "true");
  pass("ResizeObserver resizes the drawing buffer; touch pan-y and keyboard controls work");

  await page.evaluate(() => window.history.pushState(null, "", "/studio?viewer=0"));
  await page.waitForFunction(() => !document.querySelector(".stage"), undefined, { polling: 50 });
  await settleStudio(page, 1);
  const cleaned = await probe(page);
  assert.equal(cleaned.session, session, "Cleanup must happen without a document reload");
  assert.equal(cleaned.contexts.length, 4);
  assert.equal(cleaned.pendingFrames, 0); assert.equal(cleaned.stageObservers, 0);
  assert.ok(cleaned.contexts.every((entry) => entry.lost && entry.lostRequests === 1 && !entry.connected));
  pass("Client-side query navigation unmounts the viewer, cancels animation, disconnects observers, and releases all four contexts", cleaned);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.history.pushState(null, "", "/studio"));
    await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" });
    assert.equal((await probe(page)).contexts.filter((entry) => !entry.lost).length, 1);
    await page.evaluate(() => window.history.pushState(null, "", "/studio?viewer=0"));
    await page.waitForFunction(() => !document.querySelector(".stage"), undefined, { polling: 50 });
    await settleStudio(page, 1);
    assert.equal((await probe(page)).contexts.filter((entry) => !entry.lost).length, 0);
    assert.equal((await probe(page)).session, session);
  }
  pass("Repeated client-side navigation keeps active WebGL contexts at zero or one");
  await page.evaluate(() => window.history.pushState(null, "", "/studio"));
  await page.locator('.stage [data-v="Side"]').waitFor({ state: "attached" });
  const mounted = await probe(page);
  await page.locator("header .logo").evaluate((element) => element.click());
  await page.waitForURL(APP + "/");
  await page.waitForFunction((count) => window.studioProbe().contexts.length === count + 1, mounted.contexts.length, { polling: 50 });
  const navigated = await probe(page);
  assert.equal(navigated.session, session, "The page transition must use the client router");
  assert.ok(navigated.contexts.slice(0, -1).every((entry) => entry.lost && !entry.connected && entry.lostRequests === 1));
  assert.equal(navigated.contexts.filter((entry) => !entry.lost).length, 1);
  pass("A real Next.js page transition disposes the old viewer before mounting Home, in the same document", navigated);
  await context.close();

  const fixed = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const fixedPage = await fixed.newPage(); watch(fixedPage);
  await fixedPage.goto(APP + "/studio?body=hatch&pick=0&color=%232d4a63", { waitUntil: "domcontentloaded" });
  await fixedPage.locator(".stage .ctl").waitFor();
  assert.equal(await fixedPage.locator(".stage [data-b]").count(), 0);
  assert.equal(await fixedPage.locator('.stage [data-c="#2d4a63"]').getAttribute("aria-pressed"), "true");
  assert.equal(await fixedPage.locator('meta[name="robots"]').getAttribute("content"), "noindex, nofollow");
  pass("Scratch route supports vehicle-style fixed bodies and is excluded from indexing");
  await fixedPage.locator('[data-v="Side"]').click();
  await fixedPage.locator(".stage").evaluate((element) => element.scrollIntoView({ block: "center" }));
  const touchBox = await fixedPage.locator(".stage canvas").boundingBox();
  const touchStart = await fixedPage.evaluate(() => window.scrollY);
  const cdp = await fixed.newCDPSession(fixedPage);
  const touchX = touchBox.x + touchBox.width / 2, touchY = touchBox.y + touchBox.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: touchX, y: touchY }] });
  for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: touchX, y: touchY - i * 15 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await fixedPage.waitForFunction((start) => window.scrollY > start + 40, touchStart);
  await cdp.detach();
  await fixed.close(); pass("A real vertical touch gesture over the canvas scrolls the mobile page");

  const interrupted = await browser.newContext();
  await controlStudioFrames(interrupted);
  await interrupted.addInitScript(installStudioProbe);
  await interrupted.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      if (kind === "2d") return null;
      return native.call(this, kind, ...rest);
    };
  });
  const interruptedPage = await interrupted.newPage(); watch(interruptedPage);
  await interruptedPage.goto(APP + "/studio", { waitUntil: "domcontentloaded" });
  await interruptedPage.locator(".stage svg").waitFor();
  const interruptedState = await probe(interruptedPage);
  assert.equal(interruptedState.contexts.length, 1);
  assert.ok(interruptedState.contexts[0].lost && interruptedState.contexts[0].lostRequests === 1);
  assert.equal(interruptedState.stageObservers, 0);
  assert.equal(interruptedState.pendingFrames, 0);
  await interrupted.close(); pass("An initialization failure after WebGL creation releases the partial renderer before fallback");

  const fallbackBrowser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--disable-webgl"] });
  try {
    const fallbackPage = await fallbackBrowser.newPage({ viewport: { width: 390, height: 844 } }); watch(fallbackPage);
    await fallbackPage.goto(APP + "/studio", { waitUntil: "domcontentloaded" });
    await fallbackPage.locator(".stage svg").waitFor();
    assert.equal(await fallbackPage.locator(".stage canvas").count(), 0);
    assert.match(await fallbackPage.locator(".stage").getAttribute("aria-label"), /Illustrative suv silhouette.*unavailable/);
    await fallbackPage.getByRole("button", { name: "High detail", exact: true }).click();
    await fallbackPage.locator(".stage svg").waitFor();
    await fallbackPage.evaluate(() => window.scrollTo(0, 0));
    await fallbackPage.screenshot({ path: "parity/checks/webgl-off.png", fullPage: true });
    pass("WebGL-disabled Chromium shows a silhouette and remains usable after quality changes");
  } finally { await fallbackBrowser.close(); }
  assert.deepEqual(errors, [], "Unexpected browser console/runtime errors");
  pass("No unexpected console errors or runtime exceptions");
} catch (error) {
  results.push({ name: "Studio verification", pass: false, reason: error.message });
  throw error;
} finally {
  writeFileSync("parity/studio-checks.json", JSON.stringify({ results, errors }, null, 2) + "\n");
  await browser.close();
}
