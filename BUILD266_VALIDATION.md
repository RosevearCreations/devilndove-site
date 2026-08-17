# Build 266 Validation

Build 266 addresses two live-production issues:

1. Older production `payment_refunds` uses `payment_refund_id`, while newer customer-document/payment code expects `refund_id`.
2. CAIP private-media recovery created duplicate rows when a file had not reached fully registered `uploaded + creative_asset_id` state, and a downstream CAIP registration failure could cause a successful R2 binary upload to be reported as HTTP 400.

## Refund compatibility

`database_build266_live_payment_refund_compatibility.sql` is intentionally for the confirmed older live schema only. It:

- preserves `payment_refund_id`;
- backs up and recreates `customer_documents` while repairing the parent key;
- adds `payment_refunds.refund_id`;
- backfills it from `payment_refund_id`;
- creates a unique parent-key index;
- installs insert/update synchronization triggers;
- restores all `customer_documents` rows;
- recreates its indexes.

Validated against an SQLite fixture with an existing refund document. `PRAGMA foreign_key_check` returned zero rows after repair.

## CAIP upload/recovery

- Same-project file fingerprint + size now reuses an existing waiting/uploading/paused/failed/uploaded row instead of creating another upload-file record.
- Recovery output collapses historical duplicate rows non-destructively.
- Direct upload HEAD-checks the expected private R2 object before re-uploading. If the same-size object already exists, it finalizes/reconciles that existing object.
- Binary verification is separated from downstream `creative_assets` registration. A verified R2 object remains `upload_status='uploaded'` even when CAIP registration has schema/runtime drift.
- An uploaded row without a `creative_asset_id` now exposes **Retry CAIP registration**. This retries only D1/CAIP metadata against the existing R2 object and never re-uploads the binary.
- CAIP audit logging failure no longer converts an otherwise successful intake action into a 400 response.
- Build 265 direct-upload diagnostic behavior remains retained.

## Regression results

- Build 266 CAIP dedupe/idempotence + refund compatibility: PASS
- Build 265 CAIP diagnostics compatibility: PASS
- Build 264 content/project/merchandising regression: 70/70 PASS
- Build 246 product/project/packaging regression: PASS
- JavaScript syntax checks for changed CAIP files: PASS
- Live-schema refund fixture with existing customer document: PASS; zero FK violations

## Deployment notes

The Build 266 refund SQL is a **live compatibility repair**, not a fresh-schema migration. Fresh aggregate schemas already define `payment_refunds.refund_id` as the primary key.

For the confirmed live database, run the Build 266 live refund compatibility SQL first. Then deploy the Build 266 application package. Do not re-run the old broken `CREATE UNIQUE INDEX ... payment_refunds(refund_id)` script before the compatibility column has been added.
