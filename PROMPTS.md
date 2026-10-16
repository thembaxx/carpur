# Codex prompts

## Setup (once)
1. Copy this package into the root of your Carpur repo (merge folders; adjust the `@/` alias if you don't use `src/`).
2. `npm i three@0.128.0 && npm i -D @types/three@0.128.0 playwright && npx playwright install chromium`
3. Open `reference/carpur-artifact.html` in a browser to see the target.
4. Paste the **Master prompt**, then run the **Phase prompts** one at a time. Review each phase with `node scripts/parity.mjs` before moving on.

---

## Master prompt (paste first)
You are redesigning the UI of the existing Carpur Next.js app so it looks, feels and works exactly like `reference/carpur-artifact.html`.

Before writing any code, read `AGENTS.md` and `HANDOFF.md` completely, open `reference/carpur-artifact.html`, and read `src/app/globals.css`, `src/lib/car-model.ts`, `src/lib/data.ts`, `src/lib/prefs.tsx` and `src/components/CarStudio.tsx`.

Rules:
- Presentation only. Keep the app's existing data layer, auth and API routes; wire the new UI to them.
- Reuse the provided CSS, 3D module and components. Copy all copy, class names and DOM structure from the reference.
- Pin three@0.128.0. Keep the real routes and query params from HANDOFF.md section 4.
- Work in phases. After each phase run build + lint and `node scripts/parity.mjs`, fix visual differences, then stop and summarise what changed and what is left.

Start with Phase 1 only.

---

## Phase 1 — Shell, tokens, theme
Set up `app/layout.tsx`: Sora via next/font (`--font-sora` on `<html>`), import `globals.css`, viewport meta with `viewportFit: "cover"`, the no-flash theme script, `<PrefsProvider>`. Build `Header` (logo, nav pills with exact active-state rules, Sign in, Sell) and `Footer` (Appearance + 3D quality chips wired to `usePrefs`, disclaimer). Add the `useReveal` hook / `<Reveal>` wrapper. Configure `images.remotePatterns` for `assets.cdntoyota.co.za`. Done when header/footer match the reference at 390 and 1440 widths in light and dark, and the theme persists with no flash.

## Phase 2 — 3D studio
Wire `CarStudio` into a scratch page and verify against the reference: drag orbit, the four presets, swatches, auto-rotate toggle, HATCH/SUV/MPV switch (`pick`), quality re-mount, WebGL-off fallback, no console errors, renderer disposed on route change. Do not change the camera, materials or lighting numbers. If anything looks different from the reference, check the three version first.

## Phase 3 — Home and marketplace
Build `CarCard` (real Toyota photo via next/image with `silhouette()` fallback), `FilterChips`, `EmptyState`. Implement Home (`/`) and Marketplace (`/marketplace`) with the existing catalogue data mapped to the `Car` shape in `src/lib/data.ts`. Map filters to the real query params (`inventory`, `condition`, `fuel`, sort). Cards on Home use `.rv`; marketplace cards do not.

## Phase 4 — Vehicle, affordability, compare
Implement `/vehicles/[id]` (CarStudio + cost card + Save/Compare/Adjust budget), `/affordability` (five sliders, live results, `.bar`, 1/3/5-year totals, `?id=` preselect) and `/compare` (two selects write the query string, lower-cost highlight). Use `fin`, `run`, `total` from `src/lib/data.ts`. Verify numbers against the reference for identical inputs.

## Phase 5 — Garage, sell, sign-in, static pages
Implement `/garage` (saved ids from prefs, remove chips, empty state), `/sell` and `/sign-in` using the reference layouts wired to the app's real flows, and restyle `/sources`, `/privacy` and the 404 page with the same shell and primitives.

## Phase 6 — QA and polish
Run the full parity script for every route, both viewports and both themes. Fix every visible difference. Check keyboard focus, reduced motion, WebGL-off fallback, build and lint. Walk through the acceptance checklist in HANDOFF.md section 13 and report each item as pass or fail with a reason.

---

## Follow-up prompts

**Match a screenshot difference**
Compare `parity/ref/{name}.png` with `parity/app/{name}.png`. List every visible difference (spacing, type, colour, radius, motion), fix them in the app without editing the reference, and re-run the parity script.

**Add the original site's real-car GLB models**
Keep the procedural cars as the default. Add the existing GLB models as extra picks in the studio control bar using `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader` (r128). Reuse the same camera, environment, presets and swatch logic (find the body material by name and recolour it). Keep the BMW M3 CC-BY credit line visible when that model is selected.

**Upgrade the 3D cars with Blender**
Model hatch, SUV and MPV bodies in Blender with the same proportions as `buildCar()` (wheelbase 2.6, wheel radius 0.35, roof heights 1.42 / 1.58 / 1.62), name the body material `paint`, export Draco GLB, and load them in place of `buildCar()` behind the same `createStudio` API. Keep the procedural version as the fallback.

**Sync the garage to the account**
Keep the `cp.s` local behaviour for signed-out users. For signed-in users, store saved car ids on the server using the existing auth, merge local ids on sign-in, and keep the toggle optimistic with no scroll jump.
