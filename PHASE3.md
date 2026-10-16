# Phase 3 — Home and Marketplace

Implemented locally in `/workspace/carpur` on 16 October 2026. Home now has every reference section, and `/marketplace` uses the original app's 44-variant Toyota catalogue with real manufacturer photos, URL filters, sorting and empty states.

## Source and scope

The owner chose a fresh foundation because `thembaxx/carpur` was empty. To recover the real catalogue, this phase imported the unchanged public snapshot from [`thembaxx/nou2` at commit `3a1c777242f6536cf4b53de6a259d70d2bb5fc8b`](https://github.com/thembaxx/nou2/blob/3a1c777242f6536cf4b53de6a259d70d2bb5fc8b/data/toyota-2026-10-13.json). `data/catalogue-source.json` records the provenance. No auth system, listing service, API or database was imported or changed.

The snapshot contains 44 unique variants across 10 model ranges. Fuel counts are 20 petrol, 16 diesel, seven hybrid and one plug-in hybrid; there are no electric records. Prices are manufacturer references observed 13 October 2026, ranging from R273 700 to R1 543 700. These are neither current seller offers nor confirmed stock.

`src/lib/catalogue.ts` preserves manufacturer IDs, names/capitalization, prices and image URLs, normalizes transmission/fuel for the UI, and retains the original source URL, body style, fuel/transmission description, consumption and seating. The four featured cars retain their artifact aliases as well as their real route IDs. Subsequent pages should use `getCatalogueCar()` for the complete catalogue; `getCar()` remains the original four-car fixture lookup.

## Changes

- Home: four featured cards, second-hand empty state, four technology tiles, budget introduction, five-item buyer checklist and seller CTA. All reference section copy, class names and structure are preserved.
- Reusable `CarCard`, `CarImage`, `FilterChips`, `EmptyState` and `Reveal` components. Reveal uses the existing shared observer and adds no extra DOM wrapper. Home cards reveal once; Marketplace cards have no `.rv` class.
- `next/image` manufacturer photos with reserved 5:2 space and the supplied silhouette on missing/failed images. The fallback preserves the card size and vehicle link.
- Marketplace supports the real `inventory`, `condition`, `fuel`, `body` and `q` query parameters. Links preserve applicable filters. With no pre-existing URL sort in the original implementation, this phase uses `sort=price-low|price-high`, defaulting to ascending price when omitted. Reload, sharing, Back and Forward restore state.
- Used inventory and absent fuels use the exact reference empty-state copy and actions. Illustrative example listings are not presented as real seller stock.
- The renderer, geometry, materials, theme/preferences, original CSS and reference HTML are unchanged. The supplied `data.ts` changed only to add Diesel to `Car.f`; its four fixtures and cost functions remain unchanged.

## Deliberate differences from the demo

- The catalogue contains 44 sourced records rather than the artifact's four illustrative fixtures. OEM names and capitalization take precedence over the demo's shortened names.
- A Diesel chip uses the existing `.fc` style, making the 16 sourced diesel variants filterable. The original four Home technology tiles keep their exact copy and destinations.
- Production uses the real manufacturer photos, as required by the handoff. The supplied silhouettes remain the fallback; procedural body shapes and paint remain illustrative. Exact source body styles are retained separately, including sedan and coupe.
- The artifact interpolates a card array without joining it, inserting visible comma text nodes and extra grid items. React's mapped children correctly omit those separators.

Visual verification also caught and fixed an overly broad paint lookup: a Corolla sedan must not inherit Corolla Cross paint merely because their names share a prefix. Paint now matches the exact source model range. Single text nodes preserve the reference font shaping for the sort label and catalogue introduction.

## Verification

Build, lint and TypeScript pass. `three` and `@types/three` remain exactly `0.128.0`.

`check:marketplace` passes all eight grouped browser checks:

1. Every source record's ID, name, price, transmission and manufacturer-price label; all Marketplace cards visible without reveal.
2. Correct fuel counts and empty-state recovery.
3. URL sorting, New/Used/All state preservation, reload, Back and Forward.
4. Existing body/search queries, safe invalid/repeated parameters and keyboard filter activation.
5. Home copy, section order, checklist/actions, four real featured photos and responsive layout at 320, 390, 768, 899, 900, 1024 and 1440px.
6. Healthy optimized photos including diesel/hybrid examples, plus failed-image fallback with identical card dimensions.
7. Zero unexpected browser console errors, HTTP failures or runtime exceptions.
8. One shared reveal observer at threshold 0.1, one-time reveal and reduced-motion behavior.

All 20 shell visual comparisons pass with zero differing pixels at pixelmatch threshold 0.1 (antialiasing excluded). All seven grouped shell behavior checks also pass: persisted/OS themes, quality and scroll preservation, cross-tab preferences, exact query-aware nav highlights, responsive keyboard access, malformed/blocked storage, and runtime errors.

All 40 data-aligned Home/Marketplace comparisons pass with zero differing pixels at the same threshold. Home captures were retaken against the same production build after fixing the QA harness to deliver initial ResizeObserver notifications before its controlled draw; r128's `setSize()` otherwise cleared the first reference canvas before capture. This changes only capture timing, with 150 easing steps and all production rendering settings preserved.

### Visual-check scope

`parity --marketplace` compares Home and nine Marketplace states at 390×844 and 1440×900, light/dark: 40 full-page comparisons. The reference HTML is served unchanged. The QA helper replaces only its in-memory four-car fixtures with the sourced rows (four featured rows on Home), adds Diesel and removes accidental comma text nodes. On Home, it uses the original card renderer while keeping the original hero and WebGL context mounted. The app receives intentional image decode failures to exercise its original silhouette fallback, allowing like-for-like layout comparison. Real-photo loading and appearance are verified separately.

This is data-aligned fallback/layout parity, not a claim that production photos equal the artifact's silhouettes. The original unmodified reference, original full-route capture mode and the Phase 1/2 parity modes remain available.

Generated reports and screenshots are in the ignored `parity/` directory: `marketplace-checks.json`, `marketplace-results.json`, `shell-results.json`, `checks/`, `ref/`, `app/` and `diff/`.

```sh
npm run build
npm run lint
npm run typecheck
npm run start
# Second terminal; omit CHROMIUM_PATH with Playwright's installed Chromium:
CHROMIUM_PATH=/usr/bin/chromium node scripts/check-marketplace.mjs http://127.0.0.1:3000
CHROMIUM_PATH=/usr/bin/chromium node scripts/parity.mjs http://127.0.0.1:3000 --marketplace
```

This workspace requires an inherited HTTP proxy for outbound requests. Next's image optimizer creates explicit HTTP agents, which do not inherit Node's global proxy option. Local verification used a workspace-only Node bootstrap outside the repository to pass `proxyEnv: process.env` to those agents, preserving their other options, CA trust and TLS verification. No proxy URLs, TLS bypasses or environment-specific networking code were added to the app. Ordinary direct-network hosting uses the standard optimizer.

## Remaining work

Phase 4 is next: Vehicle, Affordability and Compare with all catalogue records. The handoff's ownership-cost assumptions remain placeholders and must be reconciled with the original app's Sources content. Phase 5 covers Garage, real Sell/Sign-in flows and static pages. Those destinations retain their intended URLs and currently show the shared 404 screen. Full-route acceptance remains for Phase 6; this phase does not claim completion of later routes or deployment.
