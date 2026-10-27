# Carpur showroom lighting milestone

The procedural automotive studio keeps its current hatch/SUV/MPV geometry, swatches and camera presets. A new **Gallery lights** control switches on subtle concentric accent rings and studio pillars without modifying vehicle specifications, pricing or stock listings. It is off by default, so the legacy comparison/parity view remains unchanged.

The auto-rotation control now starts **off** when the browser requests reduced motion. Visitors can enable it explicitly. Gallery props use original procedural Three.js geometry and small materials, not licensed Blender or manufacturer meshes.

**QA checklist:** existing studio parity/visual tests; car body/swatch switching, pointer gestures, photo/SVG fallback, Gallery toggle, reduced-motion auto-rotate default and disposal when the viewer unmounts. Existing GitHub Actions/preview deployment quota failures are expected and are *not* evidence of successful browser QA.

**Blender:** optional models can be authored with the repository's Blender asset gate and manually reviewed later; this PR doesn't claim Blender itself ran or that paid APIs were invoked.
