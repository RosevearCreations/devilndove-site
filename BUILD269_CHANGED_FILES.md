# Build 269 Changed Files — CAIP Standalone/Social Media Pass

## Scope

Build 269 is intentionally CAIP-focused. It advances productless/social Creative Projects, prevents duplicate raw-media transfer, fixes multipart completion integrity, adds clean recovery lineage, and updates CAIP operating documentation. It does not redesign unrelated storefront, packaging, accounting, or product workflows.

## Runtime / UI

- `functions/api/_lib/caipMediaIntake.js`
  - Build 269 content-sample fingerprint model;
  - duplicate classification and reuse/recovery rules;
  - batched part-plan persistence;
  - fail-closed multipart completion guard;
  - exact post-complete R2 HEAD-size verification;
  - strong-fingerprint attachment/backfill;
  - standalone/social project stage summary;
  - content-fingerprint-aware duplicate audit/cleanup grouping.
- `functions/api/admin/caip-media-intake.js`
  - new fingerprint attachment/backfill actions and diagnostics.
- `public/js/admin-caip-media-intake.js`
  - bounded local content fingerprinting before binary transfer;
  - duplicate-safe intake summary;
  - integrity-failed files show clean re-upload rather than resume;
  - fingerprint verification when reselecting/resuming local media;
  - existing-R2 fingerprint backfill action;
  - standalone/social CAIP stage panel.
- `admin/creative-assets/index.html`
  - Build 269 cache/version and CAIP safety wording.
- `_lib/caipMediaIntake.js`
  - synchronized helper copy for non-Functions/shared import parity.

## D1 / schema

- `database_build269_caip_social_project_dedupe_integrity.sql` — additive focused migration.
- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`
- `functions/api/_lib/fullSchemaRequirements.js`
- `BUILD269_D1_VERIFICATION.sql`

New `caip_media_upload_files` fields:

- `content_fingerprint`
- `content_fingerprint_version`
- `recovery_of_file_id`

New indexes:

- `idx_caip_media_files_content_fingerprint`
- `idx_caip_media_files_recovery`

## Tests

- `scripts/build269_caip_social_dedupe_integrity_test.mjs` — new Build 269 regression.
- `scripts/build241_caip_large_media_intake_test.mjs` — retained foundation updated for the current >90 MiB multipart threshold.
- `scripts/build265_caip_upload_diagnostics_test.mjs` — current wording compatibility.
- `scripts/build266_caip_dedup_refund_compat_test.mjs` — current archive-aware dedupe query compatibility.
- `scripts/build268_full_schema_caip_compat_test.mjs` — accepts Build 269 cache version.

## CAIP Markdown / handoff

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- `docs/creative-asset-intelligence-platform/README.md`
- `docs/creative-asset-intelligence-platform/04_Project_Ingestion_Pipeline.md`
- `docs/creative-asset-intelligence-platform/09_Operations_Reliability_and_Observability.md`
- `docs/creative-asset-intelligence-platform/10_Delivery_Roadmap.md`
- `docs/creative-asset-intelligence-platform/12_Testing_and_Acceptance.md`
- `docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md`
- `docs/creative-asset-intelligence-platform/17_Standalone_Social_Project_Workflow.md` — new.
- `BUILD269_VALIDATION.md`

## Deliberately unchanged

`database_upgrade_current_pass.sql` remains the retained broad Build 264 migration boundary. Production should apply Build 269's focused CAIP migration **after** that boundary rather than pretending the small Build 269 ALTER migration is a full replacement for all earlier feature migrations.

## Production D1 parity sync added after live maintenance verification

- `database_schema.sql`, `database_full_schema.sql`, and `database_store_schema.sql` now retain the 2026-08-17 `members_legacy` / `member_sessions_legacy` + blog foreign-key compatibility graph while keeping `users` / `sessions` as auth authority.
- Fresh `sessions` DDL is aligned to the verified live FK shape (`REFERENCES users(user_id)` without introducing a new cascade not present in production).
- `database_auth_legacy_to_current_repair.sql` and `database_auth_legacy_to_current_repair_d1_console.sql` are corrected safety stubs: the migration is already applied and the legacy tables must not be dropped while blog FKs depend on them.
- `DATABASE_SCHEMA_REFERENCE.md`, `RELEASE_NOTES.md`, `AI_HANDOFF.md`, and `PROJECT_STATUS_AND_ROADMAP.md` document the production-parity rule.
- `BUILD269_D1_VERIFICATION.sql` includes read-only auth/legacy/blog checks.
- `database_upgrade_current_pass.sql` remains deliberately unchanged as the retained Build 264 broad migration boundary; Build 269 is applied after it.
