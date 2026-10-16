// Browser-only instrumentation for resource ownership, with no production diagnostics added.
export function installStudioProbe() {
  const session = crypto.randomUUID();
  const contexts = new Map();
  const extensionObjects = new WeakSet();
  const nativeGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...args) {
    const gl = nativeGetContext.apply(this, args);
    if (!gl || !["webgl", "webgl2", "experimental-webgl"].includes(args[0]) || contexts.has(gl)) return gl;
    const record = { gl, canvas: this, resources: {}, lostRequests: 0 };
    contexts.set(gl, record);
    for (const kind of ["Buffer", "Texture", "Program", "Shader", "Framebuffer", "Renderbuffer", "VertexArray"]) {
      const create = gl[`create${kind}`], remove = gl[`delete${kind}`];
      if (!create || !remove) continue;
      const live = new Set();
      const counts = record.resources[kind] = { live, created: 0, deleted: 0 };
      gl[`create${kind}`] = function (...values) {
        const resource = create.apply(this, values);
        if (resource) { live.add(resource); counts.created++; }
        return resource;
      };
      gl[`delete${kind}`] = function (resource) {
        if (live.delete(resource)) counts.deleted++;
        return remove.call(this, resource);
      };
    }
    const getExtension = gl.getExtension;
    gl.getExtension = function (name) {
      const extension = getExtension.call(this, name);
      if (name === "WEBGL_lose_context" && extension && !extensionObjects.has(extension)) {
        extensionObjects.add(extension);
        const lose = extension.loseContext;
        extension.loseContext = function () { record.lostRequests++; return lose.call(this); };
      }
      return extension;
    };
    return gl;
  };

  const observers = new Map();
  const NativeObserver = window.ResizeObserver;
  window.ResizeObserver = class extends NativeObserver {
    constructor(callback) { super(callback); observers.set(this, new Set()); }
    observe(element, options) { observers.get(this).add(element); return super.observe(element, options); }
    unobserve(element) { observers.get(this).delete(element); return super.unobserve(element); }
    disconnect() { observers.get(this).clear(); return super.disconnect(); }
  };
  window.studioProbe = () => ({
    session,
    pendingFrames: window.pendingStudioFrames(),
    stageObservers: [...observers.values()].reduce((count, elements) => count + [...elements].filter((element) => element.classList.contains("stage")).length, 0),
    contexts: [...contexts.values()].map((record) => ({
      lost: record.gl.isContextLost(), connected: record.canvas.isConnected, lostRequests: record.lostRequests,
      resources: Object.fromEntries(Object.entries(record.resources).map(([kind, counts]) => [kind, { live: counts.live.size, created: counts.created, deleted: counts.deleted }])),
    })),
  });
}
