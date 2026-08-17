# Build 267 Changed Files

- `functions/api/_lib/caipMediaIntake.js`
  - Build 267 registration retry/relink logic.
  - optional downstream-table tolerance.
  - archived recovery-row filtering.
  - duplicate audit and safe duplicate cleanup.
  - physical R2 deletion requires verified checksum equality and no downstream references.
- `functions/api/admin/caip-media-intake.js`
  - duplicate-audit/cleanup actions.
  - successful action no longer becomes 400 because later screen refresh fails.
  - refresh warnings returned separately.
- `functions/api/admin/caip-media-upload-direct.js`
  - verified R2 binary success preserved even when later metadata registration fails.
  - already-present correct-size R2 object reused without another PUT.
- `public/js/admin-caip-media-intake.js`
  - CAIP Media Audit & Duplicate Cleanup UI.
  - registration retry messaging and refresh-warning handling.
- `admin/creative-assets/index.html`
  - cache-bust to Build 267.
- `css/styles.css`
  - duplicate-audit/reconciliation presentation.
- `scripts/build267_caip_reconciliation_test.mjs`
  - focused Build 267 regression.
- `scripts/build266_caip_dedup_refund_compat_test.mjs`
  - historical compatibility accepts later CAIP bundle versions.
- `BUILD267_CAIP_PROJECT23_AUDIT.sql`
  - read-only Project 23 CAIP audit queries.
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `BUILD267_VALIDATION.md`
- `BUILD267_CHANGED_FILES.md`

No new D1 migration is introduced by Build 267.
