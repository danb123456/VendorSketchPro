# VendorSketch Pro — Savour

An open, account-free stand planner. React + TypeScript + Vite; deploys as a static app on Vercel. No database, Firebase account, API key, server or subscription is required.

## Run

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. For verification:

```sh
npm test
npm run build
```

## Deploy to your existing Vercel project

Replace your repository's app files with this folder's contents, commit and push to the GitHub repository linked to **vendor-sketch-pro.vercel.app**. Keep the existing Vercel project/domain so that users retain access to browser-local sketches.

Vercel settings: framework **Vite**, build command `npm run build`, output directory `dist`. `vercel.json` includes the SPA fallback. No environment variables are required. The previous unused Gemini environment variable and browser-side key injection were removed.

Optionally copy `.env.example` to `.env.local` and set `VITE_ONBOARDING_URL` to your vendor onboarding form's HTTPS URL. Set the same variable in Vercel and rebuild for production. This only adds an “Open vendor onboarding” link after download; it never uploads a plan automatically.

## What changed

- Three-step Setup → Build your stand → Finish flow, starter setups, Savour branding and a full-size drawing area.
- Bottom equipment tray with tap-to-place and quick Rotate, Duplicate and Remove actions. Detailed fields stay available through Details.
- New pitches default to 7 m frontage × 5 m depth. Different pitch sizes require written organiser approval. Existing saved pitch dimensions are preserved.
- Positive dimension validation; editing pitch size preserves equipment.
- Searchable equipment library with symbols, estimated dimensions, food-trader utilities and custom items. Pagoda is renamed to Pergola, including existing saved items (custom names are preserved).
- Item names, notes, coordinates, 90° rotation, drag/resize/rotation, keyboard and clickable movement, locking and optional clearance guides.
- Snapping, alignment guides, zoom/pan, two-finger pinch zoom, grid toggle and fit controls.
- Whole-gesture Undo/Redo with dimension and queue changes included. Field editing respects normal text shortcuts.
- Rotated rectangle collision checks, meaningful issue lists, structures that can contain equipment, and boundary checks.
- Straight, front-to-back serpentine, left-to-right serpentine and right-to-left serpentine queue templates, editable route points, queue zone and lane dimensions, direction and configurable capacity assumptions.
- Local autosave with failure reporting; automatic/manual checkpoints, reversible clearing, editable JSON import/export and migration of original browser sketches.
- Pre-generated PNG with a persistent Save file link and device sharing where supported; SVG and multipage PDF reports with vendor details, revision, equipment schedule and notes.
- Optional transparent PNG overlays, physically scaled SVG, metre-based DXF layers and structured JSON for later event mapping. CAD coordinates start at the front-left of the pitch; queue coordinates have negative y. Position/rotation in a whole-event map and platform-specific integration remain future work.

## Saving and migration

The current plan is stored at `vendorsketch-v2-plan`. Up to 20 checkpoints are stored at `vendorsketch-v2-versions`. Active-session Undo/Redo keeps up to 80 actions. Versions are browser-local, not a cloud backup. An automatic checkpoint is made on a change after two minutes since the last checkpoint. If another tab saves a different plan, autosave pauses and offers a choice to load that plan or keep the current tab. Before clearing, importing, starting another plan or restoring, the app saves a recovery checkpoint and stops the action if recovery cannot be saved.

The app reads the original `vendor-sketch-pro-vendor` and `vendor-sketch-{Vendor ID}-*` keys on the same origin. Existing objects and pitch dimensions migrate without deleting the original keys. A returning vendor can enter their previous Vendor ID to reopen an original sketch. Browser data cannot be read across different origins: localhost and Vercel do not share storage. Download editable JSON backups to transfer plans across devices. A PNG is a finished drawing, not an editable backup.

## Onboarding integration

The final workflow is **review → download PNG → upload in your existing onboarding flow**. There is no simulated submission, receipt or approval status, and no plan is sent to an organiser by this app. A direct upload integration can be added once the onboarding platform/API is specified.

## Checks and limits

Queue capacity estimates use route length / spacing and do not assess crowd dynamics. Proposed queue space is subject to organiser confirmation. Clearance values are entered by the trader. Automated checks are drafting aids, not an approval or compliance assessment. Real equipment dimensions and access routes must be reviewed by the trader and organiser.

The planner supports up to 400 items and 200 route points. Import files are validated and limited to 2 MB. JSON backups contain trading details and notes; treat them like your onboarding documents. Savour styling follows the supplied introduction sheet: ivory #f8f5ef, charcoal #1d211e, orange #df702a / #e47b32, square panels and Arial/system typography. No external font requests are required. The app does not install an offline service worker.
