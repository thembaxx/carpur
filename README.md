# Carpur

A South African automotive UI with a sourced Toyota catalogue, vehicle detail pages, comparison and an affordability calculator.

[Browse the source](https://github.com/thembaxx/carpur)

## Engineering highlights

URL-based filtering and selections, interactive 3D presentation and focused verification scripts. Garage, account and other later-phase pages remain unimplemented.

## Technology

Declared in [package.json](package.json): Next.js `16.4.2` · React `19.3.1` · TypeScript `^5` · Three.js `0.128.0`.

**Quality tooling:** `lint`, `typecheck` scripts are available. See the setup guide below for prerequisites; this documentation pass does not assert that those checks were run.

---

## Project guide

A fresh Next.js App Router foundation for the supplied Carpur redesign. The owner selected a fresh Phase 1 implementation after confirming `thembaxx/carpur` was empty. No backend, catalogue service, auth system, API routes, or database were present to migrate.

## Run locally

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Home contains the full reference layout and interactive 3D studio. `/marketplace` shows the sourced 44-variant Toyota catalogue with URL filters and sorting. Every catalogue vehicle has a `/vehicles/[id]` page, `/affordability` provides the five-slider calculator, and `/compare` supports URL-based selections. The unlinked `/studio` route provides a scratch preview. Garage, listing, account and static pages are scheduled for later phases and currently show the shared 404 page.

Vercel uses the checked-in `vercel.json` commands (`npm ci`, then `npm run build`) so deployments use the repository's npm lockfile even when project settings contain an older package-manager override.

## Phase 1 scope

- Sora through `next/font`, the original design tokens/CSS, safe-area viewport settings, and the no-flash theme script.
- Responsive Header with exact pathname/query active states and route-change scrolling.
- Footer with persistent Device/Light/Dark and Automatic/Save battery/High detail controls. Theme follows OS changes in Device mode. Preference changes do not navigate or reset scroll.
- Validated, hydration-safe preferences using the original `cp.t`, `cp.q`, and `cp.s` keys; blocked storage falls back to memory.
- Shared single-observer `useReveal` hook, ready for Home sections in Phase 3.
- Toyota image host configuration, favicon, and shared not-found screen.
- Supplied 3D, fixture data, and cost modules staged for subsequent phases. Both Three.js packages are pinned to `0.128.0`.

`src/app/globals.css` and the reference HTML are unchanged from the zip. The supplied `data.ts` fixtures and cost functions are unchanged; its `Car.f` type now includes Diesel for the real catalogue. `prefs.tsx` was hardened to prevent the initial default theme from clearing the inline script's persisted theme and to handle invalid storage safely. The studio's model geometry and visual settings remain unchanged; its lifecycle fixes are described below.

## Phase 2 scope

- Home renders the reference hero with the procedural SUV, red paint, four view presets, five swatches, auto-rotate, and HATCH/SUV/MPV controls.
- `CarStudio` loads Three.js only after mounting in the browser and cancels a pending mount if the viewer unmounts. Quality changes recreate the renderer.
- Replaced models release geometry and shared materials. Unmounting releases the scene, shadow texture, reflection target, renderer and WebGL context, and cancels animation and resize observation. Initialization failures clean up partial resources before fallback.
- WebGL-unavailable browsers render the original SVG silhouette with an appropriate accessible label. All studio controls are buttons with selected states exposed to assistive technology.
- The model, camera, environment, exposure, materials, pixel-ratio caps, drag sensitivity, and easing numbers remain those supplied for r128.
- Links to later-phase destinations keep their real URLs but do not prefetch those unbuilt pages, preventing background 404 errors during studio use.

The noindex `/studio` scratch page accepts `body=hatch|suv|mpv`, a URL-encoded swatch `color`, `pick=0` to hide the body selector, and `viewer=0` to unmount the viewer. These query options also exercise live prop updates and cleanup through client-side navigation. The scratch page is not linked from the site navigation.

## Phase 3 scope

- Full Home sections, featured cards, technology links, buyer checklist and seller CTA, using the reference copy, CSS and reveal behavior.
- Marketplace with New/Used, six fuel filters, ascending/descending price sorting and the reference empty states. Links preserve `inventory`, `condition`, `fuel`, `body` and `q`; sorting uses `sort=price-low|price-high` (default low when omitted). State survives sharing, reload and browser history.
- The original app's unchanged 13 October 2026 Toyota snapshot: 44 variants across 10 ranges, with manufacturer IDs, prices, names, transmissions, fuels and image URLs. Provenance is recorded in [data/catalogue-source.json](data/catalogue-source.json); [src/lib/catalogue.ts](src/lib/catalogue.ts) adapts the snapshot to the supplied `Car` interface and retains source metadata.
- Real manufacturer photos via `next/image`, with the supplied silhouette on load failure and matching image dimensions to avoid a layout jump. Home cards reveal once; Marketplace cards are immediately visible.
- Diesel is an added chip in the existing reference style because the source catalogue contains 16 diesel variants. The source's accidental comma separators between Marketplace cards are omitted. Original OEM model naming/capitalization is preserved.

The catalogue is a dated manufacturer reference, not live seller stock. Used inventory remains the reference's honest empty state. No auth, listings service, API or database has been imported. The three procedural body shapes and paint remain illustrative; sourced body styles and consumption are retained separately for subsequent pages.

## Phase 4 scope

- All 44 vehicle pages are prerendered with their sourced name/price, matching illustrative studio, 1/3/5-year estimates, saved-car toggle and links to Compare/Adjust budget. Unknown vehicle IDs return HTTP 404. New saves use canonical catalogue IDs; existing artifact aliases remain readable/removable.
- `/affordability?id=...` preselects any catalogue car or featured alias. Five labelled sliders update the monthly total, four-segment bar, component costs and 1/3/5-year totals immediately. Selecting another car retains the slider settings, matching the reference. Financial inputs remain local to the page.
- `/compare?a=...&b=...` accepts canonical IDs and featured aliases. Both selects write canonical IDs to the query string; reload and browser history restore selection. The three monetary rows highlight the lower value and expose it to assistive technology. Equal values have no highlight. Body styles use actual catalogue metadata.
- Reused the supplied `fin`, `run` and `total` without changing their formulas or defaults. A warning identifies the petrol planning model whenever a diesel/hybrid is selected. [COST-ASSUMPTIONS.md](COST-ASSUMPTIONS.md) records the differences from the original site's financial model and what must be decided before launch; the handoff's assumptions have not been validated as current quotations.
- Save changes keep scroll position. Navigating from a vehicle to its calculator/comparison disposes the old renderer, releases the WebGL context and stops animation/resize observation in the same document.

## Check the foundation

```sh
npm run build
npm run lint
npm run typecheck
npx playwright install chromium
npm run start
```

With the server running, use a second terminal:

```sh
npm run check:shell
node scripts/parity.mjs --shell
npm run check:studio
node scripts/parity.mjs --studio
npm run check:marketplace
node scripts/parity.mjs --marketplace
npm run check:ownership
node scripts/parity.mjs --ownership
```

If using an existing Chromium installation, prefix browser commands with `CHROMIUM_PATH=/path/to/chromium`.

`check:shell` checks persisted themes through hydration/reload, OS color-scheme changes, quality settings, scroll preservation, cross-tab updates, malformed/blocked storage, keyboard focus, and navigation highlighting. It checks layout widths from 320 to 1440px, including both sides of the 900px breakpoint.

The shell parity mode captures Header and Footer from Home and the not-found screen at 390×844 and 1440×900 in light and dark. For the Home footer capture only, it hides `<main>` on both sides to isolate the shared shell from unfinished Home sections. It also compares the complete not-found screen without altering its layout. It writes reference/app/diff images and `parity/shell-results.json`, and exits unsuccessfully if dimensions or pixels differ (antialiasing excluded; pixelmatch threshold 0.1). The supplied reference remains unchanged and is served by a temporary local HTTP server during capture.

`check:studio` checks visible model changes, rotation, drag, touch scrolling, keyboard controls, quality caps, actual GPU allocations, same-document cleanup, and WebGL-off/partial-initialization fallback. `parity --studio` captures four presets, all body styles, all swatches, and the hero at both viewports in light/dark, producing 44 comparisons in `parity/studio-results.json`. Its test harness runs 150 identical easing steps on each side, skips intermediate GPU draws, and presents the final real WebGL frame before capturing. Production rendering and the reference file are unchanged by the harness.

`check:marketplace` verifies all 44 source records, fuel counts, filtering/sorting URLs, history, search/body query preservation, keyboard use, seven responsive widths, Home content, real optimized photos, image failure without layout shift, reveals and reduced motion. Results are written to `parity/marketplace-checks.json` and `parity/checks/`.

`parity --marketplace` compares Home and nine Marketplace states at both viewports/themes (40 comparisons). To compare layout with the actual inventory, its QA helper replaces only the reference's in-memory four-car fixtures with sourced rows, adds the Diesel chip, and removes its accidental comma text nodes. The app is unchanged; its photo requests intentionally receive invalid image bytes so both sides render the supplied silhouettes. Real-photo rendering is checked separately. This is data-aligned fallback/layout parity, not a claim that OEM photos match demo silhouettes. The HTML reference on disk is never edited.

For a targeted recapture, add `--only=home` (or another case name from the script); this writes a separate case report. `--marketplace --compare-only` compares the existing 40 PNG pairs without refreshing them, useful after retaking a failed capture against the same app build.

`check:ownership` verifies all 44 vehicle routes and all calculator prices against the original artifact's numeric functions, slider endpoints/keyboard use, finance term caps, preselection, save persistence/aliases, URL history and comparison ties, same-document viewer cleanup, seven responsive widths, and unexpected console/HTTP errors. Reports and screenshots go to `parity/ownership-checks.json` and `parity/checks/`.

`parity --ownership` compares ten vehicle/calculator/comparison states at both sizes/themes (40 comparisons). Its reference runtime uses the same catalogue rows, actual body-style text and disclosed energy-model warning as the app. Production code, the supplied formulas/CSS and the reference file are unchanged by QA. This aligns content for layout comparison; the additions and source-model differences are documented in [PHASE4.md](PHASE4.md). Targeted `--only=...` and existing-image `--compare-only` checks also work in this mode.

```sh
node scripts/parity.mjs [http://localhost:3000]
```

The original full-route capture mode remains available for later phases. Browser reference captures require access to Google Fonts and the r128 CDN. Manufacturer image optimization requires server-side access to `assets.cdntoyota.co.za`; proxy-only execution environments must configure their HTTP agents to use the inherited proxy and CA trust. No workspace-specific proxy settings are part of the app.

## Continue the redesign

The completed checks and their scope are recorded in [PHASE1.md](PHASE1.md), [PHASE2.md](PHASE2.md), [PHASE3.md](PHASE3.md) and [PHASE4.md](PHASE4.md).

Read [AGENTS.md](AGENTS.md), [HANDOFF.md](HANDOFF.md), and [PROMPTS.md](PROMPTS.md). The visual source of truth is [reference/carpur-artifact.html](reference/carpur-artifact.html).

1. Phase 5: implement Garage, real Sell and Sign-in flows, Sources, and Privacy. A backend/auth choice or import is required for the real flows.
2. Phase 6: complete full-route parity and the acceptance checklist. Production OG metadata and analytics also remain to be supplied. Decide the launch financial model using [COST-ASSUMPTIONS.md](COST-ASSUMPTIONS.md).

The completed Phases 1–3 foundation was published to GitHub `main` at `6f0ef68`; Phase 4 continues on a separate branch. Deployment remains separate from these implementation phases.
