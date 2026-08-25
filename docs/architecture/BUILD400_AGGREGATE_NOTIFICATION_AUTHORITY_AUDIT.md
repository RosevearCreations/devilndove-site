# Build 400 — Aggregate Schema and Notification Authority Audit

## Aggregate retrieval correction

A contents-file read of `database_full_schema.sql` initially returned an empty content field. That was a retrieval/large-file artifact, **not** an empty repository file.

The GitHub contents response exposes the real aggregate content, beginning with the Build 246/244/243/current-pass notes and the complete Core Auth section. Commit history also shows the 2026-08-23 repair:

```text
Repair fresh-install D1 schema parity
Restore 33 current application tables to the canonical full schema...
```

Build 279 validation had already proven the aggregate executes and has zero foreign-key violations at that checkpoint. Build 400 therefore does not replace the canonical aggregate with a guessed concatenation.

## Current Accounting authority correction

`functions/api/_lib/fullSchemaRequirements.js` and the current Build 342 close-workflow reader already recognize current Accounting tables including:

```text
accounting_order_records
accounting_payment_applications
accounting_hst_gst_reviews
accounting_period_closures
accountant_export_packages
accounting_evidence_attachments
```

The old Build 339 evidence checker was the stale part. Build 399 aligns it to `accounting_hst_gst_reviews` and `accountant_export_packages` rather than creating obsolete `hst_gst_review_records` / `accountant_export_manifests` tables.

## Singular vs plural notification dispatch ledgers

These names are **not aliases** and must not be collapsed mechanically.

### `notification_dispatch_log` — singular

Current `functions/api/_lib/notificationOutbox.js` uses the singular table as an **outbox-delivery ledger**. Its shape is tied to:

```text
notification_outbox_id
notification_kind
destination
status
provider_message_id
error_text
created_at
```

### `notification_dispatch_logs` — plural

`database_growth_analytics_seo_extension.sql` defines the plural table as an older **notification-job attempt ledger**, tied to:

```text
notification_job_id
status
error_text
attempted_at
```

The two ledgers represent different workflows. Build 400 records the distinction; Build 403 remains the planned shared-notification reconciliation boundary.

## Shared `notification_outbox` warning

Multiple historical writers have assumed different `notification_outbox` column/check shapes. Current outbox runtime also supports `suppressed` status and adds `related_product_id` / `metadata_json` compatibility columns.

Do not extract Gift Card provider-send or payment notification mutations until Build 403 defines one shared notification schema authority and verifies every current consumer.

## Build 400 decision

- canonical full aggregate remains retained;
- Build 399 current Accounting table names are authoritative;
- singular/plural dispatch ledgers remain distinct pending deliberate reconciliation;
- no runtime mutation is changed in Build 400;
- Build 401 will measure current runtime table creators against committed SQL authorities automatically;
- Build 402 will execute a clean local fresh-install smoke with the current parity overlays before the retained aggregate and keep Production data copy fail-closed.
