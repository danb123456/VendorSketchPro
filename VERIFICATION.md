# Verification — 4 November 2026

## Automated

Production build, strict TypeScript and unused imports/parameters checks passed. All 22 tests passed, covering history, collision/boundary checks, migration, import validation, queue geometry and both horizontal directions, starter setup, tap placement, anchored pinch zoom, map coordinate transforms, independent DXF parsing, scaled SVG and raster memory limits.

## Browser checks

Codex in-app browser: equipment tray → choose Oven → tap placement → quick rotation → Details; review shows no issues for the sample. Existing saved pitch dimensions remain intact. Right-to-left queue starts at x=5.4 m and moves to x=0.6 m on the first lane of a 6 m frontage, with subsequent lanes progressing towards the stand. Capacity remains 41 people for a 28.8 m route at 0.7 m spacing.

A real downloaded report PNG was inspected: 2400 × 2616 pixels. PDF was downloaded and identified as a one-page PDF. Transparent map PNG was downloaded (2400 × 4000 pixels); DXF was downloaded, opened with the independent dxf-parser package, and checked for metre units, separate layers and preserved right-to-left queue coordinates. The persistent Save file link was exercised successfully for PDF, overlay and DXF.

Responsive iframe checks at 320 and 390 px portrait widths, plus 844 × 390 landscape. At 320 px, body width and scroll width both equal 320 px. Mobile review and export generation completed. The browser automation could not retrieve a saved file from the embedded phone preview, so mobile OS-level download/save behavior is not independently confirmed. PNG pre-generation, a persistent download link and Web Share where supported provide alternative save paths.

## Scope and limits

Static, browser-local application; no accounts or backend. Downloading does not upload or submit a plan. Platform-specific CAD/OnePlan integration is deferred until a receiving tool is chosen. Mapping exports use local stand coordinates and require placement/rotation in the master event map.

Physical iPhone/Android devices, Safari, true multi-touch input, full accessibility audit, storage quota exhaustion and external onboarding integration have not been tested. Pinch math has automated coverage. Existing prior-version checks covered drag/undo, checkpoint restore and reload persistence.
