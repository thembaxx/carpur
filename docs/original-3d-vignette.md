# Original carpur showroom GLB

Asset: `public/models/original/carpur-gallery-platform.glb`. Procedural geometry generated during this ChatGPT session; **not authored or rendered in Blender**, and not a photograph or scan of a real car. No paid services, user data, API keys or external model licensing used.

- Existing interactive vehicle geometries, paint materials, screenshots, filters, camera controls, attribution and inventory claims remain untouched.
- The new GLB loads only when Gallery lights is explicitly enabled; missing/offline GLBs preserve existing procedural showroom geometry.
- The car and its licensed model remain visually separate from the illustrative platform.
- Check via `npm run assets:check` / `pnpm assets:check` and existing test, build, lint and format scripts. The assets are original, self-contained glTF 2.0 with per-vertex colours, and remain under 8 MiB. Real iPhone and desktop browser verification is still required.
- GitHub Actions capacity or Vercel billing failures are expected external blockers, not successful test results; do not claim a full build was verified.
