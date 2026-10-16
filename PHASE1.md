# Phase 1 verification — 16 October 2026

Prepared in `/workspace/carpur`, local branch `codex/phase-1-foundation`.

The repository was empty. The owner explicitly selected a fresh Phase 1 foundation, so no original backend or auth code was imported. The handoff package has been unpacked and the original reference is preserved.

| Check | Result | Evidence |
|---|---|---|
| Production build | Pass | `npm run build`; Home and the shared not-found screen prerender successfully. |
| Lint | Pass | `npm run lint` with zero warnings allowed. |
| TypeScript | Pass | `npm run typecheck`. The supplied 3D/data modules compile. |
| Three.js version | Pass | `npm ls three @types/three` reports `0.128.0` for both. |
| Shell visual parity | Pass | 20 comparisons, zero differing pixels at threshold 0.1 excluding antialiasing. Phone 390×844 and desktop 1440×900, light and dark. |
| Persisted theme through hydration/reload | Pass | Saved Light/Dark override the device scheme; instrumented root attribute changes never clear the saved theme. |
| Device appearance | Pass | Background follows a live OS scheme change; choosing Device removes the explicit override. |
| Quality and scroll | Pass | Quality persists across reloads; preference changes preserve scroll position. |
| Storage resilience | Pass | Invalid JSON, invalid enum values, invalid saved-car data, and denied storage are handled. In-memory controls continue working. |
| Cross-tab preferences | Pass | Theme changes and cleared storage synchronize between tabs. |
| Navigation | Pass | Exact path/query active states, reordered query keys, filtered routes, and vehicle paths checked. |
| Responsive and keyboard | Pass | No page overflow at 320, 390, 768, 899, 900, 1024, 1440px; correct nav breakpoint, native visible keyboard focus, viewport-fit=cover. |
| Browser runtime exceptions | Pass | None during the shell behavior checks. |

The shell comparisons cover the Home header, an isolated Home footer, and the complete shared not-found screen plus its header/footer. Only the Home footer capture hides `<main>` on both sides; this isolates it from Home sections scheduled for later phases. These results do **not** claim full-page Home or full-route parity. Images, diffs, and machine-readable results are in the ignored `parity/` directory.

Browser commands used with the running production server:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/check-shell.mjs http://127.0.0.1:3000
CHROMIUM_PATH=/usr/bin/chromium node scripts/parity.mjs http://127.0.0.1:3000 --shell
```

The supplied CSS, 3D model module, data/cost module, and reference HTML are byte-for-byte unchanged from the zip. The changes to the supplied preferences provider and studio wrapper are explained in [README.md](README.md).

Next is Phase 2: mount the studio and verify controls, quality remounting, WebGL fallback, and full GPU-resource cleanup. Subsequent pages, the real 44-variant catalogue, backend/auth integration, cost-assumption reconciliation, Sources/Privacy, and production metadata remain pending. The full handoff acceptance checklist is therefore still open.
