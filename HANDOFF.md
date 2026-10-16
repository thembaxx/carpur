# Carpur redesign — handoff for Codex

## 1. Goal
Re-implement the **UI layer** of the existing Carpur app (https://nou2.vercel.app, Next.js on Vercel) so it **looks, feels and behaves exactly like `reference/carpur-artifact.html`**.

- `reference/carpur-artifact.html` is the **source of truth** for visuals, copy, spacing, motion and interaction. Open it in a browser (needs internet for three.js + Google Fonts) and keep it open while you work. Where this document and the reference disagree, the reference wins.
- Keep the app's **existing backend, data layer, auth and API routes**. Only the presentation changes.
- The artifact is a single-file demo: Sell, Sign in, listings and the 44-variant catalogue are stubbed. Wire the same UI to the app's real logic.

## 2. Non-negotiables (what "exactly" means)
1. **Pin `three@0.128.0` and `@types/three@0.128.0`.** The 3D look (tone mapping, sRGB output, PMREM reflections, clearcoat) was tuned on r128. Newer versions change colour management and the cars will look different.
2. **Use `src/app/globals.css` as-is.** It is the artifact's CSS extracted verbatim (only font stacks changed to `var(--font-sora)`). Do not rewrite it as utility classes. If the repo uses Tailwind, keep it installed but disable preflight or load `globals.css` after it, and don't restyle these components with utilities.
3. **Same class names and DOM structure** as the reference (`.hero`, `.sec`, `.stage`, `.card`, `.k`, `.fc`, `.chip`, `.sw`, `.bar`, `.ln`, `.empty`, `.rv` ...). The CSS depends on them.
4. **Copy every string verbatim** from the reference view functions. Don't paraphrase headings, labels or disclaimers.
5. Keep the three honesty rules from the original site: reference prices, seller asking prices and cost estimates are labelled differently; illustrative 3D vehicles are labelled as illustrative; estimates are never presented as finance or insurance offers.

## 3. Stack and setup
- Next.js App Router, TypeScript. Path alias `@/` -> `src/` (adjust imports if the repo has no `src/`).
- Dependencies to add: `three@0.128.0`, `@types/three@0.128.0`. Optional dev: `playwright` (for `scripts/parity.mjs`).
- Font: Sora 400/600/700 via `next/font/google` with `variable: "--font-sora"`; put `sora.variable` on `<html>`.
- `next.config`: allow `assets.cdntoyota.co.za` in `images.remotePatterns` (real car photos).
- Files in this package to drop in: `src/app/globals.css`, `src/lib/{car-model,data,silhouette}.ts`, `src/lib/prefs.tsx`, `src/components/CarStudio.tsx`, `public/favicon.svg`, `scripts/parity.mjs`.

## 4. Route map (artifact hash routes -> real Next routes)
Keep the original site's URLs and query params.

| Artifact | Next route | Notes |
|---|---|---|
| `#/` | `/` | Home |
| `#/cars` (New) | `/marketplace` | default = new cars |
| `#/cars?c=used` | `/marketplace?inventory=sellers&condition=USED` | Used cars |
| `...&f=Petrol` etc. | `?fuel=Petrol` (values: Petrol, Hybrid, Electric, Plug-in Hybrid) | `All` = param omitted |
| `...&s=a|d` | sort param (price asc/desc) | use the app's existing sort param if there is one |
| `#/car/:id` | `/vehicles/[id]` | e.g. `/vehicles/catalogue-toyota-1611` |
| `#/afford?id=` | `/affordability?id=` | preselects the car |
| `#/compare?a=&b=` | `/compare?a=&b=` | selects write the query string |
| `#/garage` | `/garage` | |
| `#/sell` | `/sell` | |
| `#/sign-in` | `/sign-in` | |
| (not in artifact) | `/sources`, `/privacy` | Keep their existing content; restyle with the same shell (`.sec`, `.k`, `h2`, `.card`) |

Nav highlight: a pill is active when the current route (+ query) equals its link; `/marketplace` with no query = New Cars; vehicle pages highlight nothing. Route changes scroll to top; save/remove/quality/theme changes do **not**.

## 5. Design tokens
Defined in `globals.css`. Theme is 3-state: `auto` (follows `prefers-color-scheme`), `light`, `dark` via `:root[data-theme]`.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f3f1ec` | `#090b0e` |
| `--fg` | `#14161a` | `#f2f0ea` |
| `--mut` | `#666b73` | `#8b9098` |
| `--card` | `#ffffff` | `#12151a` |
| `--ln` | `rgba(0,0,0,.1)` | `rgba(255,255,255,.1)` |
| `--ac` (accent) | `#e8502a` | `#ff6a3d` |
| `--hd` (header) | `rgba(243,241,236,.86)` | `rgba(9,11,14,.86)` |

- **Stage (3D panel)** is always dark in both themes: `radial-gradient(120% 90% at 50% 100%, #2b3342, #0b0d11)`, radius 28.
- **Cost bar colours:** Finance `var(--ac)`, Fuel `#4aa3ff`, Insurance `#f2b84b`, Maintenance `#7bd88f`.
- **Type:** Sora. h1 `clamp(42px,9vw,92px)` / lh .98 / ls -.045em. h2 `clamp(28px,4.5vw,46px)` / lh 1.05 / ls -.03em. Eyebrow `.k`: 12px, .14em tracking, uppercase, accent, 600. Body 16/1.5.
- **Radii:** cards 22, stage 28, pills 99, inputs 12. **Layout:** max-width 1180, 20px gutters, `.grid` = `repeat(auto-fill,minmax(250px,1fr))` gap 16, `.hero` splits `1fr 1.3fr` from 900px.
- **Motion:** `.rv` reveal (opacity + 18px rise, 0.7s) triggered once by IntersectionObserver threshold .1; disabled under `prefers-reduced-motion`. `a.card:hover` lifts 4px and turns the border accent. 3D auto-rotate.
- **Safe areas:** `:root` has `padding-top/bottom: env(safe-area-inset-*)`; header is sticky at `top: env(safe-area-inset-top)`; `body::before` paints the header colour under the notch. Keep `viewport-fit=cover` in the viewport meta (`export const viewport = { viewportFit: "cover", width: "device-width", initialScale: 1 }`).
- **No-flash theme script** in `<head>` of `app/layout.tsx`:
  `<script dangerouslySetInnerHTML={{__html:"try{var t=JSON.parse(localStorage.getItem('cp.t'));if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}"}}/>`

## 6. Shell and components
Wrap the app in `<PrefsProvider>` (`src/lib/prefs.tsx`).

- **Header** (sticky, blurred): logo `Carpur` + accent `.`; nav pills (New Cars, Used Cars, Affordability, Compare, My Garage) that wrap to their own scrollable row under 900px; `Sign in` (`.btn.o`) and `Sell` (`.btn.ac`).
- **Footer:** wordmark line, **Appearance** chips (Device / Light / Dark -> theme), **3D quality** chips (Automatic / Save battery / High detail -> quality), disclaimer paragraph. Active chip = `.fc.on`.
- **CarCard** (`a.card.rv`): silhouette or real photo, eyebrow `New · {transmission}`, name, "Manufacturer reference price", price in 22px bold.
  - In the real app use the **real Toyota photo** (`Car.image`, `next/image`) and fall back to `silhouette()`. The artifact used silhouettes only because published pages can't load remote images.
  - Cards on `/marketplace` and `/garage` render **without** `.rv` (no reveal); cards on Home use `.rv`.
- **CarStudio** (`src/components/CarStudio.tsx`): the 3D stage. Home hero: SUV body, colour `#b3422e`, `pick` on (shows HATCH/SUV/MPV). Vehicle page: that car's body and colour, `pick` off.
- **Filter chips** (`.fc`, links), **EmptyState** (`.empty`), **Cost card + `.bar`**, **comparison table**, **form fields** (`label` above `input`), `.btn` variants (`.ac`, `.o`).
- **Reveal:** one `useReveal` hook or `<Reveal>` wrapper using a single IntersectionObserver; add `.in` once, then unobserve.

## 7. Pages (order of sections; text lives in the reference)
**Home `/`** — hero (eyebrow "South Africa · Made for your next move", h1 "Find your next car.", blurb, `Shop new cars` / `Shop second hand`, CarStudio) -> 01 "Discover new cars." (4 CarCards; copy says "Featured from 44 manufacturer-published Toyota variants. Prices observed 13 October 2026.") -> 02 "Second hand. First choice." (empty state "Seller inventory is coming" + `List a car`) -> 03 "Explore the technology." (4 tiles linking to `/marketplace?fuel=...`) -> 04 "A car you love. A budget that works." (split: copy + `Check my budget` / `Compare two cars`, and a "Before you buy" checklist card) -> seller CTA `.empty` "Find your next buyer."

**Marketplace `/marketplace`** — eyebrow "Marketplace", h2 "New cars"/"Used cars"; filter row: New/Used, fuel chips (All, Petrol, Hybrid, Electric, Plug-in Hybrid), price sort toggle; grid of CarCards or empty state ("Seller inventory is coming" for used; "No variants listed yet" for fuels with no stock).

**Vehicle `/vehicles/[id]`** — `.hero`: CarStudio left; right: eyebrow `New · {t} · {fuel}`, h2 name, "Manufacturer reference price", price (h1 style, `clamp(34px,6vw,56px)`), "Cost of ownership (estimate)" card (1/3/5-year totals, footnote "10% deposit, 60 months at 12.5%, 1 500 km a month."), actions (Save to garage / Saved to garage ✓ toggle, Compare -> `/compare?a=`, Adjust budget -> `/affordability?id=`), footnote that the 3D model is an illustrative body style, not the exact variant.

**Affordability `/affordability`** — two columns (`.hero` with `align-items:start`): left card with car select + 5 range sliders; right card with live results. Sliders (min / max / step / default): Deposit % 0/50/5/10; Term months 12/72/12/60; Interest % 6/20/0.5/12.5; Distance km per month 200/4000/100/1500; Petrol price R/L 18/32/0.5/24. Label shows the live value in bold. Results update on input: monthly total (h2), 4-segment `.bar`, per-component rows, "Ownership total" for 1/3/5 years, assumptions footnote.

**Compare `/compare`** — two selects (default Starlet vs Corolla Cross), table rows: Reference price, Est. monthly cost, Est. 5-year cost, Transmission, Fuel, Body style. The lower of the three cost rows is highlighted (`.w`). Changing a select updates the query string.

**Garage `/garage`** — saved cars (ids in `cp.s`) as cards plus "Remove {model}" chips, or empty state "Your garage is empty".

**Sell `/sell`** — split layout: copy left; form card right (Make, Model, Year, Mileage, Asking price, Description, `Preview listing`). The artifact only previews; connect to the app's real listing flow and keep this layout.

**Sign in `/sign-in`** — centred 420px column, email + password + `Sign in`. The artifact is a stub; use the app's existing auth.

**Not found** — `.empty` with h2 "Page not found" and `Back home`.

## 8. 3D studio spec (all implemented in `src/lib/car-model.ts`)
- **Model (procedural, not scanned):** side profile extruded with bevels (body), second extrusion for the glasshouse, roof panel, underbody, B-pillars, mirrors, door lines, handles, emissive head/tail lamps, grille + chrome bar, five-spoke wheels (torus tyre, chrome rim, gunmetal spokes), black wheel-arch discs, canvas radial contact shadow. Roof height: hatch 1.42, SUV 1.58, MPV 1.62. About 4.3 m long, 1.64 m wide, wheelbase 2.6 (x = ±1.3), wheel radius 0.35.
- **Materials:** paint = `MeshPhysicalMaterial` (metalness .55, roughness .3, clearcoat 1, clearcoatRoughness .04, envMapIntensity 1.2); glass = physical (roughness .05, clearcoat 1, env 1.6); recolour by setting `group.userData.p.color`.
- **Lighting/env:** generated 1024x512 equirect gradient (`#3a4558` -> `#161a22` -> `#050607`) with four white soft-box rectangles, through `PMREMGenerator`; one directional light 0.7 at (3,5,4).
- **Renderer:** ACESFilmic, exposure 1.15, `outputEncoding = sRGBEncoding`, alpha on. Pixel ratio cap: Save battery 1, Automatic 2, High detail 2.5.
- **Camera:** fov 32, near .1, far 60; distance `max(6.4, 9.2 / aspect)`; position y = `.55 + d*sin(elevation)`; looks at (0, .45, 0).
- **Controls:** pointer drag orbits (horizontal 0.008 rad/px, vertical 0.004, elevation clamp .02-.6); `touch-action: pan-y` so vertical swipes still scroll the page; auto-rotate 0.004 rad/frame (on by default, pauses while dragging, turns off when a view preset is chosen); easing factor 0.1. Presets (azimuth, elevation): `3/4` (.8,.15), `Side` (0,.04), `Front` (π/2,.1), `Rear` (-π/2,.1), taking the shortest way round. Five swatches: `#c8ccd2 #b3422e #2d4a63 #1f6f4a #16191e`.
- **Lifecycle:** one renderer per stage; `createStudio` returns a dispose function; ResizeObserver handles layout; falls back to the SVG silhouette when WebGL is unavailable.
- **One deliberate fix vs. v1 of the artifact:** wheel-arch discs on the far side are rotated so they face outward (the artifact now has the same fix).
- **Original site's extra models** (Ferrari 458, BMW M3 E30 and Corolla Cross GLBs): if the repo has them, keep them as additional picks inside the same control bar. Keep the BMW M3 credit line: "3D: Martin Trafas / TinoD2 · Model Source (Sketchfab) · CC Attribution".
- **Fidelity upgrade path (optional, later):** model each body in Blender, export Draco-compressed GLB, load with `GLTFLoader` (`three/examples/jsm/loaders/GLTFLoader` exists in r128), name the body material `paint`, and keep the same studio, camera, env and controls.

## 9. Cost model and data caveats
Formulas are in `src/lib/data.ts` and must match the reference:
- Instalment = standard annuity: `P = price*(1-dep/100)`, `r = rate/1200`, `pmt = P*r / (1-(1+r)^-n)`.
- Monthly fuel = `km * 6.5 / 100 * petrolPrice`; insurance = `price*0.05/12`; maintenance = `price*0.015/12`.
- Total after y years = deposit + `pmt * min(12y, n)` + `(fuel+ins+maint) * 12y`.
- **Placeholders to confirm:** 6.5 L/100 km, 5% insurance, 1.5% maintenance, 12.5% default rate and R24/L petrol were chosen for the artifact, not sourced from the original app. Reconcile them with the app's `/sources` ("Data & assumptions") page before launch.
- `body`, `fuel` and paint colour in `CARS` are artifact choices; verify `fuel`/`body` against the real catalogue. Real prices/IDs/images come from the live site (Starlet R273 700 `catalogue-toyota-1616`, Rumion R314 100 `-1743`, Urban Cruiser R342 700 `-1611`, Corolla Cross R429 100 `-1919`).

## 10. State and persistence
`localStorage` keys (always in try/catch; render correctly when empty): `cp.t` theme, `cp.q` 3D quality, `cp.s` saved car ids. If the app already has accounts, you may sync the garage server-side, but keep the same UI and optimistic toggle. Save/Remove re-renders in place with no scroll jump. Changing 3D quality re-mounts the studio.

## 11. Accessibility and performance
Swatches have `aria-label`; the stage has `role="group"` and a label; every control is a real `<button>`/`<a>`; reduced-motion disables reveals; auto-rotate is user-stoppable; dispose the renderer on unmount; load `CarStudio` client-side only (it already is) and consider `next/dynamic` if bundle size matters.

## 12. Known gaps vs the live app (decide with the owner)
Real listings and used inventory, the full 44-variant catalogue, real Sell and Sign-in flows, `/sources` and `/privacy` content, SEO/OG metadata (keep the existing `metadata`, including `theme-color #090b0e` and the OG image), analytics.

## 13. Acceptance checklist
- [ ] Every route in section 4 renders and matches the reference at 390x844 and 1440x900, light and dark (`node scripts/parity.mjs`).
- [ ] Theme: Device/Light/Dark persists, no flash on reload.
- [ ] 3D: drag orbits, presets and swatches work, auto-rotate toggles, HATCH/SUV/MPV switch on Home, quality setting re-mounts, WebGL-off fallback shows the silhouette, no console errors, no leaks when navigating between pages.
- [ ] Affordability numbers equal the reference for the same inputs (e.g. Starlet, defaults -> same monthly total and 1/3/5-year totals).
- [ ] Compare highlights the lower cost; garage save/remove persists across reloads.
- [ ] Copy matches the reference word for word; no layout shift at the 900px breakpoint.
- [ ] `three` is exactly 0.128.0; `npm run build` and lint pass.
