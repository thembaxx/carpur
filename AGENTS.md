# AGENTS.md — Carpur UI redesign

Read `HANDOFF.md` in full before changing code. The visual and behavioural source of truth is `reference/carpur-artifact.html`.

## Rules
- Change the presentation layer only. Do not modify the existing data layer, auth, API routes or database code.
- Match the reference exactly: same copy, class names, DOM structure, spacing, motion and interactions.
- Use `src/app/globals.css` as the design system. Do not convert it to Tailwind utilities or restyle it.
- Pin `three@0.128.0` and `@types/three@0.128.0`. Never upgrade three.
- Reuse `src/lib/car-model.ts`, `src/lib/data.ts`, `src/lib/silhouette.ts`, `src/lib/prefs.tsx`, `src/components/CarStudio.tsx` instead of rewriting them. Fix bugs in place and note them in the PR.
- Keep the real routes from HANDOFF.md section 4 and the existing query params.
- Keep reference prices, seller asking prices and estimates visibly distinct; keep illustrative-model labels and the footer disclaimer.
- Client-only code (`three`, localStorage) goes in `"use client"` components; wrap every localStorage access in try/catch.

## Definition of done
`npm run build` and lint pass; `node scripts/parity.mjs` screenshots match the reference for every route at 390x844 and 1440x900 in light and dark; the acceptance checklist in HANDOFF.md section 13 is ticked. Summarise any deviation from the reference.
