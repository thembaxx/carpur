/**
 * Carpur 3D studio — typed port of buildCar() and studio() from reference/carpur-artifact.html.
 *
 * IMPORTANT: pin `three@0.128.0` and `@types/three@0.128.0`. The look (colour management, tone mapping,
 * PMREM) was tuned on r128. Newer three versions change colour handling and the cars will look different.
 *
 * Axes: car length on X (front = +X), width on Z, height on Y. Wheelbase x = ±1.3, wheel radius 0.35.
 */
import * as THREE from "three";

export type Body = "hatch" | "suv" | "mpv";
export type Quality = "auto" | "save" | "high";

export const SWATCHES = ["#c8ccd2", "#b3422e", "#2d4a63", "#1f6f4a", "#16191e"];
const ROOF: Record<Body, number> = { hatch: 1.42, suv: 1.58, mpv: 1.62 };

export function buildCar(col: string, b: Body): THREE.Group {
  const g = new THREE.Group();
  const H = ROOF[b] ?? 1.5;

  const paint = new THREE.MeshPhysicalMaterial({ color: col, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a1119, metalness: 0.3, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.6 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.75 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdde1e6, metalness: 1, roughness: 0.2 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.9 });
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x2b2f36, metalness: 0.8, roughness: 0.35 });

  const ex = (s: THREE.Shape, d: number, bt: number, bs: number) => {
    const m = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 6, curveSegments: 24 });
    m.translate(0, 0, -d / 2);
    return m;
  };
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  const lamp = (x: number, y: number, z: number, w: number, h: number, d: number, c: number) =>
    add(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.5 }), x, y, z);

  // Lower body: side profile extruded across the width with rounded bevels
  const s = new THREE.Shape();
  s.moveTo(-2.05, 0.34); s.lineTo(2, 0.34); s.quadraticCurveTo(2.17, 0.36, 2.17, 0.58); s.lineTo(2.15, 0.8);
  s.quadraticCurveTo(2.12, 0.93, 1.85, 0.97); s.bezierCurveTo(1.2, 1.02, 0.85, 1.06, 0.6, 1.1); s.lineTo(-1.6, 1.1);
  s.quadraticCurveTo(-2.1, 1.08, -2.14, 0.85); s.lineTo(-2.15, 0.58); s.quadraticCurveTo(-2.15, 0.34, -2.05, 0.34);
  add(ex(s, 1.4, 0.12, 0.07), paint, 0, 0, 0);

  // Glasshouse + roof panel + underbody
  const c = new THREE.Shape();
  c.moveTo(-1.75, 1.08); c.bezierCurveTo(-1.65, H - 0.04, -1.35, H, -0.95, H); c.lineTo(0.1, H);
  c.bezierCurveTo(0.42, H - 0.02, 0.55, 1.3, 0.88, 1.08); c.lineTo(-1.75, 1.08);
  add(ex(c, 1.1, 0.1, 0.06), glass, 0, 0, 0);
  add(new THREE.BoxGeometry(1.1, 0.05, 1.22), paint, -0.42, H + 0.03, 0);
  add(new THREE.BoxGeometry(4.1, 0.2, 1.4), dark, 0, 0.3, 0);

  // Per-side details (k = +1 / -1)
  [1, -1].forEach((k) => {
    add(new THREE.BoxGeometry(0.08, H - 1.08, 0.05), paint, -0.55, (H + 1.08) / 2, k * 0.66); // B-pillar
    add(new THREE.BoxGeometry(0.12, 0.08, 0.17), paint, 0.58, 1.14, k * 0.9); // mirror
    [0.35, -0.6].forEach((x) => add(new THREE.BoxGeometry(0.012, 0.5, 0.01), dark, x, 0.72, k * 0.826)); // door lines
    add(new THREE.BoxGeometry(0.16, 0.025, 0.02), chrome, -0.15, 0.93, k * 0.828); // handle
    lamp(2.17, 0.84, k * 0.55, 0.05, 0.07, 0.36, 0xffffff); // headlight
    lamp(-2.16, 0.86, k * 0.6, 0.05, 0.08, 0.3, 0xff2020); // taillight

    // Wheel-arch shadow discs (rotated on the far side so they face outward)
    const arch = new THREE.Mesh(new THREE.CircleGeometry(0.43, 40), new THREE.MeshBasicMaterial({ color: 0x050506 }));
    arch.position.set(1.3, 0.35, k * 0.823);
    if (k < 0) arch.rotation.y = Math.PI;
    g.add(arch);
    const a2 = arch.clone();
    a2.position.x = -1.3;
    g.add(a2);

    [1.3, -1.3].forEach((x) => {
      const w = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.1, 16, 40), tireMat);
      tire.scale.z = 1.4;
      w.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 32), chrome);
      rim.rotation.x = Math.PI / 2;
      w.add(rim);
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.06), spokeMat);
        sp.rotation.z = i * 1.2566;
        sp.position.z = 0.11;
        w.add(sp);
      }
      w.position.set(x, 0.35, k * 0.74);
      if (k < 0) w.rotation.y = Math.PI;
      g.add(w);
    });
  });

  // Front grille + chrome bar
  add(new THREE.BoxGeometry(0.05, 0.14, 0.8), dark, 2.19, 0.6, 0);
  add(new THREE.BoxGeometry(0.05, 0.05, 1.1), chrome, 2.19, 0.72, 0);

  g.userData.p = paint; // body paint material, used for live recolouring
  return g;
}

export interface StudioOptions {
  body: Body;
  color: string;
  /** Show the HATCH / SUV / MPV body switcher (used on the home hero). */
  pick?: boolean;
  quality?: Quality;
}

/** Free shared geometry/materials once (wheel arches share resources through clone()). */
function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of childMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

/** Mounts the orbit studio (canvas + controls) into `el`. Throws if WebGL is unavailable. Returns a dispose fn. */
export function createStudio(el: HTMLElement, o: StudioOptions): () => void {
  const quality = o.quality ?? "auto";
  // Use r128's exact context defaults, checking availability before its noisy constructor.
  const canvas = document.createElement("canvas");
  const attributes: WebGLContextAttributes = {
    alpha: true, depth: true, stencil: true, antialias: true, premultipliedAlpha: true,
    preserveDrawingBuffer: false, powerPreference: "default", failIfMajorPerformanceCaveat: false,
  };
  const context = canvas.getContext("webgl2", attributes) || canvas.getContext("webgl", attributes) || (canvas.getContext("experimental-webgl", attributes) as WebGLRenderingContext | null);
  if (!context) throw new Error("WebGL is unavailable");

  let r: THREE.WebGLRenderer;
  try {
    r = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  } catch (error) {
    context.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
  const sc = new THREE.Scene();
  let ro: ResizeObserver | undefined;
  let environment: THREE.WebGLRenderTarget | undefined;
  let pm: THREE.PMREMGenerator | undefined;
  let et: THREE.CanvasTexture | undefined;
  let disposed = false;
  let raf = 0;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    ro?.disconnect();
    canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = null;
    disposeObject(sc);
    sc.clear();
    sc.environment = null;
    environment?.dispose();
    et?.dispose();
    pm?.dispose();
    r.dispose();
    r.forceContextLoss();
    el.replaceChildren();
  };

  try {
    r.setPixelRatio(Math.min(window.devicePixelRatio, quality === "save" ? 1 : quality === "high" ? 2.5 : 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.15;
    r.outputEncoding = THREE.sRGBEncoding;
    el.appendChild(r.domElement);

    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

    // Environment: generated equirect gradient with soft-box strips -> PMREM
    const e = document.createElement("canvas");
    e.width = 1024; e.height = 512;
    const x = e.getContext("2d")!;
    const gr = x.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, "#3a4558"); gr.addColorStop(0.5, "#161a22"); gr.addColorStop(1, "#050607");
    x.fillStyle = gr; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = "#fff";
    ([[80, 60, 260, 40], [420, 30, 200, 30], [700, 70, 280, 44], [0, 200, 1024, 6]] as const).forEach((a) => x.fillRect(a[0], a[1], a[2], a[3]));
    et = new THREE.CanvasTexture(e);
    et.mapping = THREE.EquirectangularReflectionMapping;
    et.encoding = THREE.sRGBEncoding;
    pm = new THREE.PMREMGenerator(r);
    environment = pm.fromEquirectangular(et);
    sc.environment = environment.texture;
    // Only the generated target is needed during rendering.
    et.dispose();
    et = undefined;
    pm.dispose();
    pm = undefined;
    const dl = new THREE.DirectionalLight(0xffffff, 0.7);
    dl.position.set(3, 5, 4);
    sc.add(dl);

    // Contact shadow
    const sh = document.createElement("canvas");
    sh.width = sh.height = 256;
    const sx = sh.getContext("2d")!;
    const sg = sx.createRadialGradient(128, 128, 10, 128, 128, 128);
    sg.addColorStop(0, "rgba(0,0,0,.8)"); sg.addColorStop(1, "rgba(0,0,0,0)");
    sx.fillStyle = sg; sx.fillRect(0, 0, 256, 256);
    const gp = new THREE.Mesh(
      new THREE.PlaneGeometry(6.6, 3.6),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false })
    );
    gp.rotation.x = -Math.PI / 2;
    gp.position.y = 0.004;
    sc.add(gp);

    let C: THREE.Group | undefined;
    let bt: Body = o.body;
    let cc = o.color;
    const mk = () => {
      if (C) {
        sc.remove(C);
        disposeObject(C);
      }
      C = buildCar(cc, bt);
      sc.add(C);
    };
    mk();

    // Orbit state
    let az = 0.8, el_ = 0.15, tz = az, te = el_, auto = true, drag = false, lx = 0, ly = 0;
    let preset: string | undefined;
    const V: Record<string, [number, number]> = { "3/4": [0.8, 0.15], Side: [0, 0.04], Front: [Math.PI / 2, 0.1], Rear: [-Math.PI / 2, 0.1] };

    const cv = r.domElement;
    cv.onpointerdown = (ev) => { drag = true; preset = undefined; syncControls(); lx = ev.clientX; ly = ev.clientY; cv.setPointerCapture(ev.pointerId); };
    cv.onpointermove = (ev) => {
      if (!drag) return;
      tz -= (ev.clientX - lx) * 0.008;
      te = Math.min(0.6, Math.max(0.02, te + (ev.clientY - ly) * 0.004));
      lx = ev.clientX; ly = ev.clientY;
    };
    cv.onpointerup = cv.onpointercancel = cv.onlostpointercapture = () => { drag = false; };

    // Controls (same DOM + classes as the artifact; styled by globals.css)
    const ui = document.createElement("div");
    ui.className = "ctl";
    ui.innerHTML =
      Object.keys(V).map((k) => `<button type="button" class="chip" data-v="${k}">${k}</button>`).join("") +
      `<button type="button" class="chip on" data-a="1">Auto-rotate</button>` +
      SWATCHES.map((c) => `<button type="button" class="sw" data-c="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join("") +
      (o.pick ? (["hatch", "suv", "mpv"] as Body[]).map((k) => `<button type="button" class="chip" data-b="${k}">${k.toUpperCase()}</button>`).join("") : "");
    function syncControls() {
      ui.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        const d = button.dataset;
        const pressed = d.a ? auto : d.v ? d.v === preset : d.c ? d.c === cc : d.b === bt;
        button.setAttribute("aria-pressed", String(pressed));
      });
    }
    syncControls();
    ui.onclick = (ev) => {
      const t = (ev.target as HTMLElement).closest("button") as HTMLButtonElement | null;
      if (!t) return;
      const d = t.dataset;
      if (d.v) {
        const a = V[d.v];
        tz = a[0] + Math.round((tz - a[0]) / (2 * Math.PI)) * 2 * Math.PI; // shortest way round
        te = a[1];
        auto = false;
        preset = d.v;
        ui.querySelector("[data-a]")?.classList.remove("on");
      } else if (d.a) {
        auto = !auto;
        preset = undefined;
        t.classList.toggle("on", auto);
      } else if (d.c) {
        cc = d.c;
        (C!.userData.p as THREE.MeshPhysicalMaterial).color.set(cc);
      } else if (d.b) {
        bt = d.b as Body;
        mk();
      }
      syncControls();
    };
    el.insertAdjacentHTML("beforeend", '<span class="hint">Drag to orbit</span>');
    el.appendChild(ui);

    const rs = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      r.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    ro = new ResizeObserver(rs);
    ro.observe(el);
    rs();

    const tick = () => {
      if (disposed) return;
      if (!el.isConnected) { dispose(); return; }
      raf = requestAnimationFrame(tick);
      if (auto && !drag) tz += 0.004;
      az += (tz - az) * 0.1;
      el_ += (te - el_) * 0.1;
      const d = Math.max(6.4, 9.2 / cam.aspect);
      cam.position.set(d * Math.sin(az) * Math.cos(el_), 0.55 + d * Math.sin(el_), d * Math.cos(az) * Math.cos(el_));
      cam.lookAt(0, 0.45, 0);
      r.render(sc, cam);
    };
    tick();

    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
