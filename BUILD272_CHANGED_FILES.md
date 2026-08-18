# Build 272 — CAIP Intake Readiness Diagnostics

CAIP-only hotfix following an HTTP 400 from `POST /api/admin/caip-media-intake` when choosing new media.

## Changed
- `functions/api/_lib/caipMediaIntake.js`
- `_lib/caipMediaIntake.js`
  - adds `getCaipMediaIntakeReadiness()`;
  - reports base-table readiness, Build 269 duplicate-safe columns, private R2 readiness, and the exact required migration.
- `functions/api/admin/caip-media-intake.js`
  - GET now includes `readiness`;
  - create-session POST fails with an explicit missing-column diagnostic before attempting a new intake session.
- `public/js/admin-caip-media-intake.js`
  - shows prerequisite readiness before upload;
  - disables Select and Upload if production D1 or private R2 is not ready;
  - names missing D1 columns and the exact Build 269 migration instead of surfacing only a generic HTTP 400.
- `admin/creative-assets/index.html`
  - bumps CAIP intake browser asset to `v=272`.
- `scripts/build272_caip_intake_readiness_test.mjs`
  - regression coverage for prerequisite diagnostics.
- `BUILD272_D1_PREREQUISITE_CHECK.sql`
  - read-only production D1 check.

## D1
Build 272 adds no schema. It continues to require the additive Build 269 CAIP migration already shipped with the application.
