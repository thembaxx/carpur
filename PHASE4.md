# Phase 4 — Vehicle, Affordability and Compare

Implemented on 16 October 2026 on `codex/phase-4-ownership`. The owner's requested merge first published the complete, verified Phases 1–3 foundation to GitHub `main` as [`6f0ef68`](https://github.com/thembaxx/carpur/commit/6f0ef68ba75cdc39f9a2c11738fda407bc7a2106). The remote was empty, so this established its initial main branch without overwriting remote history.

## Result

- `/vehicles/[id]` supports all 44 Toyota catalogue records, with static generation, real manufacturer name/price, the supplied illustrative 3D body, 1/3/5-year cost card, Save/Compare/Adjust budget actions and the original disclaimer. Unknown IDs return HTTP 404. Featured aliases also resolve.
- Saves use the existing `cp.s` preferences and update in place without scroll jumps or renderer replacement. New saves use canonical catalogue IDs. Removing a saved car also clears legacy aliases/duplicate representations of the same car.
- `/affordability?id=...` supports the full catalogue. The five specified sliders retain the exact ranges, steps and defaults, update on input, and drive the monthly amount, component rows, bar and ownership totals. Changing the selected car retains the current sliders, matching the reference.
- `/compare?a=...&b=...` has two labelled selects, all 44 options, canonical URL updates, Back/Forward/reload restoration, and the reference table. Lower monetary values receive `.w` plus an accessible lower-cost label. Ties remain unhighlighted. Body-style text uses the sourced catalogue rather than the illustrative mesh category.
- Numeric calculations reuse `fin`, `run`, `sum`, `total` and `R`. The original CSS, four fixtures, cost functions, renderer/model, preferences and reference HTML are unchanged in this phase. Three.js and its types remain pinned to `0.128.0`.

Server pages resolve the snapshot and pass only fields needed by client controls. Calculations and sliders use local React state; comparison uses Next's supported native History integration with `useSearchParams`. There are no new APIs, databases, financial-input submissions or auth/listing changes.

## Assumptions and deliberate differences

The original app's Sources page, financial implementation and input defaults were reviewed at the catalogue's pinned source commit. Its 12%/72-month defaults, vehicle-specific energy, monthly insurance/maintenance allowances, debt/resale and budget-headroom calculations differ from the handoff. The requested redesign uses the supplied 12.5%/60-month, 6.5 L/100 km, 5% insurance and 1.5% maintenance model. Those defaults remain illustrative; they have not been verified as current offers or real driver costs.

[COST-ASSUMPTIONS.md](COST-ASSUMPTIONS.md) records the full comparison, equations' meaning, exclusions and the launch decision. Phase 4 preserves numeric parity with the explicit handoff rather than silently substituting a different model. The totals represent cash paid over the horizon and exclude remaining debt and resale, unlike the original app's net ownership-cost measure.

Compared with the four-petrol-car demo, Phase 4 adds a visible warning when a diesel/hybrid is selected: the energy estimate uses an illustrative petrol model and needs a separate energy budget. Comparison body labels reflect real metadata (including Sedan/Coupe). Names/capitalization and options use all 44 sourced records. Accessible labels/pressed states/heading announcements add semantics without changing the visual layout.

## Verification

**Story:** a shopper follows a catalogue card to its vehicle, saves it, adjusts the selected car's budget, and compares it with another vehicle; sourced prices flow through the supplied cost functions into displayed estimates and the local garage preference.

| Boundary | Result and evidence |
| --- | --- |
| Catalogue → Vehicle | Pass: all 44 routes return HTTP 200, render the expected sourced name and match the artifact's three totals. Unknown IDs return HTTP 404. |
| Vehicle → Saved preference | Pass: canonical saves survive reload, legacy/canonical duplicate removal works, and toggles preserve scroll position. |
| Vehicle → Calculator/Compare | Pass: actions preselect the correct car and retain the same document identity. The old WebGL context is released, with zero pending frames and stage observations. |
| Inputs → Calculations | Pass: every catalogue price, all ten slider endpoint changes, keyboard changes, fractional inputs and short loan terms match the original reference functions, including currency rounding. Bar percentages match and sum to 100%. |
| Compare → URL → UI | Pass: both selections write canonical IDs; Back/Forward/reload restore them. Defaults, legacy/invalid IDs, lower-value highlights, equal values and real body labels work. |
| Browser → Server | Pass: no financial-input mutation requests. Snapshot reads are server-rendered; local controls require no new API. |
| Responsive/accessibility | Pass: all three pages fit 320, 390, 768, 899, 900, 1024 and 1440px. Sliders have real labels and keyboard input; selects and saved/highlight states are named. |
| Browser/server errors | Pass: final browser run reports zero unexpected console/runtime/HTTP errors. Production server output has no application errors. |
| Build/lint/TypeScript | Pass: production build prerenders all 44 vehicle paths; lint and type checking pass. |
| Reference layout | Pass: 40 full-page comparisons, 390×844 and 1440×900 in light/dark, zero differing pixels at pixelmatch threshold 0.1 with antialiasing excluded. |

Default Starlet results match the artifact: monthly **R9 364**, 1-year **R139 744**, 3-year **R364 491**, 5-year **R589 238**.

### Visual-check scope

`parity --ownership` covers hatch/MPV/SUV vehicle pages, missing vehicle, default and preselected affordability, changed sliders on a hybrid, default/reversed comparison and an equal-car hybrid comparison. Its QA helper aligns the reference's in-memory fixtures with the same catalogue, fixes the comparison's default to the intended Starlet/Corolla Cross pair, and supplies actual body-style labels and the disclosed non-petrol warning. It does not edit the reference file, production UI, formulas, CSS or model. Controls and 3D frames use the existing deterministic capture harness.

This verifies layout with matching content, not a claim that a 44-car catalogue and added warning are identical to the original four-car fixture content. These additions and assumptions are described above. Earlier phases' reports retain their original scope; full-route Phase 6 acceptance remains outstanding.

Reports/screenshots are generated in the ignored `parity/` directory: `ownership-checks.json`, `ownership-results.json`, `checks/`, `ref/`, `app/` and `diff/`.

```sh
npm run build
npm run lint
npm run typecheck
npm run start
# In a second terminal:
CHROMIUM_PATH=/usr/bin/chromium npm run check:ownership
CHROMIUM_PATH=/usr/bin/chromium npm run parity:ownership
```

The local workspace's inherited proxy setup is unchanged from Phase 3 and remains outside product code. Reference captures require CDN access. No deployment was performed.

Phase 5 remains: Garage, real Sell/Sign-in flows, Sources and Privacy. The real flows still need a backend/auth choice or import because this repository began empty. Source assumptions must be resolved before launch.
