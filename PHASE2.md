# Phase 2 — 3D studio

Implemented locally in `/workspace/carpur` on 16 October 2026. Home now renders the reference hero and interactive studio. `/studio` is an unlinked, noindex scratch preview with validated URL options for body, paint, body-selector visibility, and mounting/unmounting.

## Changes

- Reused the supplied procedural car and studio, with Three.js and its types still pinned to `0.128.0`.
- Added explicit disposal of replaced models, shared geometry/materials, shadow textures, reflection targets, renderer resources, and WebGL contexts. Disposal also cancels animation, disconnects the resize observer, and clears pointer handlers.
- Released the temporary environment texture and PMREM generator after creating the reflection target. Initialization errors release partial resources before showing the original silhouette.
- Loaded the studio module only after client mount, with cancellation when navigation or preference changes interrupt loading.
- Kept visible control copy and styling; added button types and pressed states for assistive technology. The fallback label identifies an illustrative silhouette and unavailable 3D preview.
- Disabled prefetching for the shell's unbuilt destinations to avoid background 404 console errors while retaining their intended URLs.

The complete `buildCar()` geometry/material function is byte-for-byte unchanged from the zip. Camera, lighting, environment, exposure, quality caps, orbit sensitivity, presets, and easing numbers are unchanged. The CSS, fixture/cost data, and reference HTML are also unchanged.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Build, lint, TypeScript | Pass | `npm run build`, `npm run lint`, `npm run typecheck`. |
| Pinned versions | Pass | `npm ls three @types/three`: both `0.128.0`. |
| Studio and hero parity | Pass | 44 comparisons at 390×844 and 1440×900 in light/dark; zero differing pixels at pixelmatch threshold 0.1, antialiasing excluded. |
| Shell regression | Pass | All 20 shell comparisons pass; shell behavior checks also pass with the studio mounted. |
| Controls | Pass | Four distinct presets stop auto-rotate; all five swatches change paint; HATCH/SUV/MPV render distinctly; drag changes the view; rotation pauses during a held pointer and resumes after release. |
| Keyboard and touch | Pass | Keyboard activation selects a preset; a real vertical touch gesture over the canvas scrolls the mobile page. |
| Quality and resizing | Pass | Each quality change replaces the canvas and releases the previous context. At device pixel ratio 3, buffers match caps 1, 2, 2.5. ResizeObserver follows viewport changes. |
| Replaced-model resources | Pass | After 18 body replacements, live allocations equal baseline: 202 buffers, 4 textures, 4 programs, 1 framebuffer, 51 vertex arrays, 0 live shaders/renderbuffers. |
| Client unmount | Pass | Same document identity throughout; all 4 created contexts released, 0 pending animation frames, 0 stage resize observations. |
| Repeated navigation | Pass | Three mount/unmount cycles retain the same document and leave zero active contexts after each unmount. |
| Real page transition | Pass | Next.js navigation from `/studio` to Home retains document identity: 8 old contexts released and one new Home viewer active. |
| WebGL-off fallback | Pass | Chromium launched with `--disable-webgl` displays the silhouette, identifies it accessibly, and handles quality changes. |
| Partial-initialization cleanup | Pass | Denying the environment's 2D canvas after creating WebGL releases the partial renderer/context before fallback. |
| Browser console/runtime errors | Pass | All 16 studio checks pass; zero console errors or runtime exceptions, with HTTP errors included. |

The lifecycle checks use native WebGL allocation/deletion calls and actual context-loss state. A retained random document identity prevents a full page reload from being mistaken for React cleanup. The visual harness advances 150 identical easing steps on each side, omits intermediate GPU draws, and waits for the final real WebGL frame to be presented before capture. All instrumentation lives in development scripts.

Results and images are written to the ignored `parity/` directory: `studio-results.json`, `studio-checks.json`, `shell-results.json`, and matching `ref/`, `app/`, `diff/`, `checks/` PNGs. Browser verification uses installed Chromium and SwiftShader, with a device pixel ratio of 3 for the quality-cap checks.

```sh
npm run build
npm run lint
npm run typecheck
npm run start
# In a second terminal; omit CHROMIUM_PATH when using Playwright's installed browser:
CHROMIUM_PATH=/usr/bin/chromium node scripts/check-studio.mjs http://127.0.0.1:3000
CHROMIUM_PATH=/usr/bin/chromium node scripts/parity.mjs http://127.0.0.1:3000 --studio
```

Phase 2 covers the studio and hero. Full Home sections, Marketplace, catalogue integration, vehicle and budget pages, auth/listing flows, and full-route acceptance remain for later phases. Next is Phase 3: Home and Marketplace.
