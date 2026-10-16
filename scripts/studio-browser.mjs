// Test-only frame control: run identical orbit easing steps before comparing renders.
// Production code and the reference file are not modified.
export async function controlStudioFrames(context) {
  await context.addInitScript(() => {
    const callbacks = new Map();
    let id = 0, frame = 0;
    let drawFrame = true;
    const nativeFrame = window.requestAnimationFrame.bind(window);
    window.presentStudioFrame = () => new Promise((resolve) => nativeFrame(() => nativeFrame(resolve)));
    const contexts = new WeakSet();
    const nativeContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const gl = nativeContext.apply(this, args);
      if (!gl || !["webgl", "webgl2", "experimental-webgl"].includes(args[0]) || contexts.has(gl)) return gl;
      contexts.add(gl);
      for (const method of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const nativeDraw = gl[method];
        if (nativeDraw) gl[method] = function (...values) { if (drawFrame) return nativeDraw.apply(this, values); };
      }
      return gl;
    };
    window.requestAnimationFrame = (callback) => { callbacks.set(++id, callback); return id; };
    window.cancelAnimationFrame = (handle) => { callbacks.delete(handle); };
    window.pendingStudioFrames = () => callbacks.size;
    window.advanceStudioFrames = (count) => {
      try {
        for (let i = 0; i < count; i++) {
          frame++;
          // Easing runs every step; only the final frame needs actual GPU draws for capture.
          drawFrame = i === count - 1;
          const current = [...callbacks.values()];
          callbacks.clear();
          current.forEach((callback) => callback(frame * 1000 / 60));
        }
      } finally { drawFrame = true; }
    };
  });
}

export async function studioClick(page, selector) {
  await page.locator(`.stage ${selector}`).evaluate((element) => element.click());
}

export async function settleStudio(page, frames = 150) {
  await page.evaluate(async (count) => {
    // Deliver the initial ResizeObserver before drawing the controlled frame.
    // r128 setSize clears the canvas, even when the CSS size is unchanged.
    await window.presentStudioFrame();
    window.advanceStudioFrames(count);
    await window.presentStudioFrame();
  }, frames);
}

export async function captureElement(page, selector, filename) {
  const element = page.locator(selector).first();
  if (selector === ".hero") await page.evaluate(() => window.scrollTo(0, 0));
  else await element.evaluate((target) => target.scrollIntoView({ block: "center" }));
  await page.evaluate(() => window.presentStudioFrame());
  const clip = await element.boundingBox();
  if (!clip) throw new Error(`Missing capture target: ${selector}`);
  await page.screenshot({ path: filename, clip });
}
