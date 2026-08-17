# Build 267 Validation — CAIP Registration Reconciliation & Duplicate Cleanup

## Purpose
Build 267 hardens Project 23/private-media recovery after Build 266: registration retry is metadata-only and idempotent, successful R2 storage is never downgraded by later metadata errors, duplicate recovery rows can be audited/archived safely, and physical R2 duplicate deletion requires verified checksum equality plus no downstream references.

## Focused validation
- Build 267 CAIP reconciliation regression: PASS
  - existing private R2 object can be registered without re-uploading;
  - canonical registration still succeeds when optional technical-observation and processing-plan tables are absent;
  - existing creative asset can be relinked to an intake row;
  - probable duplicate groups are detected by project + stored intake fingerprint + size;
  - linked CAIP asset wins canonical ranking;
  - duplicate D1 rows can be archived;
  - redundant R2 deletion requires same verified content checksum and no linked CAIP/downstream references;
  - canonical R2 original remains untouched.
- Build 265 CAIP upload diagnostics regression: PASS.
- Build 266 CAIP dedupe/refund compatibility regression: PASS.

## Retained regressions
- Build 264 content/project/merchandising: 70/70 PASS.
- Build 253 inventory linked-item/reset: 18/18 PASS.
- Build 250 product media/use-batch: 14/14 PASS.
- Build 249 kit/component inventory: 25/25 PASS.
- Public page audit: 36/36 PASS, 0 warnings/failures.
- Asset-reference audit: 151/151 present.

## Syntax / schema checks
- `functions/api/_lib/caipMediaIntake.js`: JavaScript syntax PASS.
- `functions/api/admin/caip-media-intake.js`: JavaScript syntax PASS.
- `functions/api/admin/caip-media-upload-direct.js`: JavaScript syntax PASS.
- `public/js/admin-caip-media-intake.js`: JavaScript syntax PASS.
- `database_schema.sql`, `database_full_schema.sql`, and `database_store_schema.sql`: execute with zero foreign-key violations.
- `BUILD267_CAIP_PROJECT23_AUDIT.sql`: SELECT-only audit script parses/executes against the aggregate schema.

## Deployment boundary
Build 267 is code-only. It adds no D1 schema migration. Keep the already-applied Build 264 feature migration and the one-time Build 266 live `payment_refunds` compatibility repair where required.

## Live acceptance test
1. Open `/admin/creative-assets/?creative_project_id=23` after a hard refresh and confirm `admin-caip-media-intake.js?v=267` loads.
2. On a row already at 100% / Uploaded with no CAIP asset, press **Retry CAIP registration**. The binary must not upload again.
3. A missing bucket/object/size mismatch should return a visible pending diagnostic rather than an opaque HTTP 400 retry loop.
4. Open **CAIP media audit & duplicate cleanup**. Start with **Archive redundant rows** so private R2 objects are retained.
5. Only use **Archive + delete safe R2 duplicates** when the UI offers it; the server rechecks verified checksum equality and downstream references before deletion.
