# Build 269 Validation — CAIP Standalone/Social Media Pass

## Validation status

Build 269 was validated against the exact application ZIP supplied for this pass (`devilndove-site-main(20260817-204808).zip`). Validation is local/in-memory and does not substitute for the post-deploy production R2/D1 acceptance checks below.

## Automated checks completed

### JavaScript syntax

`node --check` passed for the changed runtime entry points and shared helpers, including:

- `functions/api/_lib/caipMediaIntake.js`
- `_lib/caipMediaIntake.js`
- `functions/api/_lib/fullSchemaRequirements.js`
- `functions/api/admin/caip-media-intake.js`
- `public/js/admin-caip-media-intake.js`

### D1 schema / migration

- The pristine Build 268 `database_full_schema.sql` from the supplied ZIP was loaded into an in-memory SQLite database.
- `database_build269_caip_social_project_dedupe_integrity.sql` was then applied once.
- The migration successfully added:
  - `content_fingerprint`
  - `content_fingerprint_version`
  - `recovery_of_file_id`
  - `idx_caip_media_files_content_fingerprint`
  - `idx_caip_media_files_recovery`
  - the Build 269 migration-ledger row.
- The updated Build 269 `database_full_schema.sql` also builds successfully from an empty database.

### CAIP regression suite

The following targeted regression tests pass:

- Build 241 CAIP private media / schema / processing / promotion boundary — PASS
- Build 265 CAIP upload diagnostics and productless-project routing — PASS
- Build 266 CAIP dedupe/idempotence and refund compatibility — PASS
- Build 267 CAIP registration reconciliation and conservative duplicate cleanup — PASS
- Build 268 full-schema audit and CAIP compatibility/recovery — PASS
- Build 269 standalone/social dedupe and multipart integrity — PASS

The Build 269 test specifically recreates the dangerous completion condition: a file expects three multipart rows but only two uploaded rows exist. The helper refuses completion, marks the file failed with actual counters, and the fake R2 bucket records **zero** multipart `complete()` calls. The test then creates a clean recovery attempt, uploads all expected parts, verifies exact stored size, registers the Creative Asset, and validates the productless/social stage summary.

## Build 269 acceptance guarantees exercised

- A strong sampled content fingerprint is filename-independent and bounded for large browser files.
- Same-project duplicate selection can reuse/skip an existing canonical upload before binary transfer.
- Two same-content files selected in the same browser batch collapse to one physical upload plan and do not inflate session byte/file totals.
- An already-stored binary with missing Creative Asset metadata follows the registration-only path and retries CAIP registration without binary transfer.
- Renamed copies can be recognized once strong content fingerprints exist.
- Legacy metadata fingerprints remain a transition fallback for existing rows.
- Known finalized/incomplete integrity failures are not resumed as if their old multipart upload were still usable.
- Clean recovery attempts receive a new upload row/object key while preserving recovery lineage.
- Multipart completion requires the exact expected part count, contiguous part range, ETags, and exact uploaded-byte total before R2 finalize is allowed.
- The completed R2 object must then pass an exact HEAD-size check before the file is promoted to `uploaded` and registered as a Creative Asset.
- Duplicate cleanup remains conservative: Build 269 does not automatically delete historical R2 binaries or D1 upload rows.
- Standalone/social projects remain valid without manufacturing a physical Product; inventory/cost authority stays with Creative Process and CAIP owns raw media/evidence/story progression. Superseded historical attempts do not falsely keep the stage summary active once a canonical recovery succeeds.

## Production deployment order

1. Back up the production D1 database.
2. Apply `database_build269_caip_social_project_dedupe_integrity.sql` **once** after the retained Build 264/current broad migration boundary.
3. Deploy the Build 269 application files.
4. Hard-refresh the CAIP admin page so `admin-caip-media-intake.js?v=269` is loaded.
5. Open the standalone/social Creative Project and use **Strengthen existing fingerprints** in bounded batches until the uploaded canonical media you want to protect has strong fingerprints.
6. Re-select `EDSS9755.MOV`. The old finalized/truncated attempts must not resume. CAIP should create/use a clean recovery attempt with a new object key.
7. Upload `EDSS9755.MOV` and confirm the completion path reaches 121/121 parts and 4,045,838,240 bytes before Creative Asset registration.
8. Select a folder/batch containing media already present in the project plus new media. Existing strong matches should be skipped/reused; only genuinely new or explicitly recoverable media should transfer.
9. Run `BUILD269_D1_VERIFICATION.sql` in the production D1 console and review all returned sections.
10. Only after canonical objects are verified should historical stale/duplicate attempts be archived or considered for physical R2 reclamation.
11. Once raw intake is clean, continue the project through evidence review, story structure, and Content Studio/social-package handoff as described in `docs/creative-asset-intelligence-platform/17_Standalone_Social_Project_Workflow.md`.

## Production checks still required

This pass did **not** execute against the live Devil n Dove R2 bucket or mutate the live production D1 database. After deployment, verify actual browser/R2 behavior for:

- strong-fingerprint backfill ranged reads;
- duplicate skip/reuse responses;
- clean failed-upload recovery;
- exact multipart completion and R2 HEAD-size confirmation;
- Creative Asset registration;
- Project 23 stale-attempt cleanup decisions.

Keep the two repaired `EDSS9755.MOV` forensic rows and their existing truncated R2 objects until the new recovery upload has been independently verified.

## Production D1 maintenance parity verification

After the live 2026-08-17 table-maintenance review, the aggregate schemas were re-synchronized so they no longer contradict production auth history. `users` / `sessions` remain current authority; `members_legacy` / `member_sessions_legacy` and the historical blog foreign keys are retained as compatibility/preservation structures. The retired auth repair files now refuse to imply that legacy tables are absent.

Validation additionally loads each updated aggregate schema from empty SQLite, verifies the auth/blog foreign-key graph, and confirms `PRAGMA foreign_key_check` returns zero rows. This sync does not rerun or reverse the already-completed production auth migration and does not add an auth mutation to Build 269.

### Final sync validation results

- `database_full_schema.sql` fresh-build: PASS; auth/blog compatibility objects present; `PRAGMA foreign_key_check` = 0 rows.
- `database_schema.sql` fresh-build: PASS; auth/blog compatibility objects present; `PRAGMA foreign_key_check` = 0 rows.
- `database_store_schema.sql` fresh-build: PASS; retained auth/blog compatibility objects present; `PRAGMA foreign_key_check` = 0 rows.
- Fresh `sessions.user_id` FK action matches the verified live production shape (`NO ACTION`, not an invented cascade).
- `blog_posts.author_member_id` targets `members_legacy.member_id`.
- `blog_comments.member_id` targets `members_legacy.member_id` with `ON DELETE SET NULL`.
- `member_sessions_legacy.member_id` targets `members_legacy.member_id` with `ON DELETE CASCADE`.
- Exact supplied pre-Build-269 full schema + Build 269 focused migration: PASS; new columns/indexes/ledger row present and `PRAGMA foreign_key_check` = 0 rows.
- CAIP regression suite Builds 241/265/266/267/268/269: PASS after the production-parity sync.
