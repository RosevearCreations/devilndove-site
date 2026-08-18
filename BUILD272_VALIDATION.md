# Build 272 Validation — CAIP Intake Readiness

## Purpose
Prevent a misleading HTTP 400 after **Select and Upload** when production is missing a required CAIP duplicate-safe schema prerequisite.

## Expected operator behavior
Before upload, the CAIP screen now reports whether:
1. the Build 241 media tables exist;
2. `content_fingerprint`, `content_fingerprint_version`, and `recovery_of_file_id` exist;
3. `CAIP_PRIVATE_MEDIA_BUCKET` is available.

The upload button is disabled when any required prerequisite is missing. No binary transfer begins.

## Migration
No new Build 272 migration exists. If the readiness card reports missing Build 269 columns, back up D1 and apply `database_build269_caip_social_project_dedupe_integrity.sql` once.

## Regression
Run `node scripts/build272_caip_intake_readiness_test.mjs` plus the existing CAIP regression chain.

## Validation results
- JavaScript syntax checks: PASS.
- `_lib/caipMediaIntake.js` mirror matches `functions/api/_lib/caipMediaIntake.js`: PASS.
- Aggregate `database_full_schema.sql` reports all three Build 269 prerequisite columns present: PASS.
- Build 269 migration-ledger row exists in aggregate schema: PASS.
- CAIP regression tests Build 241 / 265 / 266 / 267 / 268 / 269 / 270 / 271 / 272: PASS.
