# Verification — 4 November 2026

## Automated

- Production build and strict TypeScript check passed (`npm run build`).
- Unused imports/parameters check passed (`npx tsc --noEmit --noUnusedLocals --noUnusedParameters`).
- 14 regression tests passed (`npm test`), covering gesture history, redo branching, rotated collision detection, touching edges, rotated boundaries, structures containing equipment, free placement, queue geometry/capacity, invalid imports, legacy migration, counters and queue limits.

## Browser checks

Verified in the Codex in-app browser, at approximately 824 px and 1280 px viewport widths:

- New vendor details → pitch confirmation → drawing workspace.
- Adding equipment and access markers, responsive property panels, exact coordinate editing.
- Moving an item from (0.2, 0.2) to (2.2, 1.2), then Undo restoring (0.2, 0.2).
- Serpentine queue: 28.8 m route, 0.7 m/person spacing → 41 estimated people against a 35-person target.
- Save checkpoint → clear equipment and queue while keeping pitch → restore prior checkpoint, recovering six items and queue.
- Reload retained the six-item plan, vendor reference, 6 × 4 m pitch and 41-person queue estimate.
- Branded export preview, PNG generation and PDF generation completed with download-started status.

## Scope and limits

This is a static, browser-local application. There is no account, backend, transmission of plans or simulated submission/approval. The existing onboarding form remains the submission destination after the vendor downloads a PNG. Its optional HTTPS link can be configured in `.env.example`.

The production GitHub/Vercel project has not been changed or deployed. Browser downloads were triggered and image/PDF generation completed; OS-level saved-file retrieval was not independently inspected. A physical phone, every browser engine, a full accessibility audit, storage-quota exhaustion and the optional external onboarding link were not tested. Import validation and migration have automated coverage; native file-picker import was not exercised in the browser.

## Queue template update

Left-to-right horizontal serpentine added alongside the existing templates. Automated coverage checks horizontal direction, progress towards the stand, lane boundaries, non-crossing geometry, backup round-trip and route-point limits. Production build and all 14 tests passed.
