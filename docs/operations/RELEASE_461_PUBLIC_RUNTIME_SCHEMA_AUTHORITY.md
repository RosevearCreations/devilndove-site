# Release 461 Candidate — Runtime Schema Authority

## Scope

Release 461 candidate work is removing request-time D1 schema creation, repair, index creation, and policy seeding from public/customer and shared/admin runtime paths. A request is a business operation, never a migration trigger.

The first public/customer migration-owned slice covers:

- `/api/checkout-recovery-lead`
- `/api/custom-request-consent`
- `/api/custom-request`
- `/api/custom-request-reference-upload`
- `/api/product-interest`

The broader public/customer audit also covers the focused Release 461 product-offer, member, telemetry, community, auth, custom-request-commerce, and payment-webhook contracts now collected by `scripts/release461_aggregate_source_gate.py`.

## Public/customer authority change

`migrations/dev/20260829_release461_public_runtime_schema_authority.sql` owns the current schema used by:

- `checkout_recovery_leads`
- `custom_request_fulfillment_prompts`
- `custom_requests`
- `custom_candle_soap_product_specs`
- `custom_request_reference_uploads`
- `media_consent_records`
- `product_interest_requests`

The public handlers perform business reads/writes only after read-only schema-readiness checks. They do not create tables, add columns, or create indexes.

When required schema is unavailable, the handler fails closed with HTTP 503. Customer traffic is never allowed to repair D1.

## Shared/admin notification authority

The notification outbox helper was a confirmed shared-runtime offender. It previously created notification support tables, repaired missing `notification_outbox` columns, and inserted default cooldown policy rows while normal queue/dispatch traffic was running.

Release 461 now moves that ownership to:

`migrations/dev/20260829_release461_notification_runtime_schema_authority.sql`

That additive Development migration owns the required shape for:

- `notification_outbox`
- `notification_dispatch_log`
- `notification_exclusions`
- `notification_cooldown_rules`
- `customer_engagement_runs`
- notification outbox/dispatch/exclusion/engagement indexes
- default cooldown rows for checkout recovery, review requests, back-in-stock notices, and gift-card delivery notices

`functions/api/_lib/notificationOutbox.js` now verifies those tables and required columns read-only through `sqlite_master` and `PRAGMA table_info`. Queueing, suppression, retries, dispatch logging, and notification delivery remain business operations. If the schema is unavailable, the helper raises `notification_schema_unavailable` instead of mutating schema.

Focused source authority is enforced by `scripts/release461_notification_runtime_schema_gate.py`, which is part of the aggregate Release 461 source gate.

A dedicated manual-only workflow, `.github/workflows/development-d1-release461-notification.yml`, exists for eventual Development acceptance. It verifies the exact Development D1 identity, runs read-only structural drift checks, refuses partial existing table shapes, and only then may apply the additive notification authority migration. It is not an automatic migration trigger and must not be dispatched merely because source changed or a new chat started.

## Shared community authority

`functions/api/_communityContent.js` previously retained schema self-healing even though the public community route had already been made read-only. Release 461 now makes the shared/admin helper read-only as well.

The existing additive authority remains:

`migrations/dev/20260829_release461_public_community_authority.sql`

It owns:

- `community_events`
- `pickup_profiles`
- `event_vendor_applications`
- recurrence/application support columns
- the active/sort/application indexes used by public and admin callers

The helper preserves its compatibility `ensure*` exports, but those functions now perform structural `PRAGMA table_info` / `PRAGMA index_list` checks only. They do not create or alter schema. `scripts/release461_public_community_schema_gate.py` now protects both the public and shared/admin paths.

## Content Automation Studio and publication authority

The Content Automation Studio shared helper and content-publication helper were another confirmed hidden runtime schema owner. Runtime calls previously created the five Content Automation Studio workflow tables, the two publication tables, and their indexes.

Release 461 now owns that schema explicitly in:

`migrations/dev/20260829_release461_content_automation_publication_authority.sql`

The additive Development authority covers:

- `content_projects`
- `content_project_media`
- `content_project_deliverables`
- `content_render_jobs`
- `content_project_events`
- `content_publications`
- `content_publication_events`
- all corresponding project/media/deliverable/render/event/publication indexes

`functions/api/_lib/contentAutomationSchemaReadiness.js` is now the shared read-only structural authority. It verifies required columns and indexes through `PRAGMA table_info` and `PRAGMA index_list`.

`functions/api/_lib/contentAutomationStudio.js` and `functions/api/_lib/contentPublications.js` retain their existing compatibility `ensure*Schema` function names for callers, but those functions now delegate to read-only readiness. Legitimate business writes—project creation, media archiving, deliverable updates, render-job creation, publication preparation, approval, publishing state, metrics, and event records—remain intact. Request traffic no longer creates or repairs the supporting tables.

Focused source authority is enforced by `scripts/release461_content_automation_schema_gate.py`, now included in `scripts/release461_aggregate_source_gate.py`.

The Content Automation/Publication migration is source authority only at this checkpoint. It has not been applied to Development D1 and no provider publishing execution has been opened.

## Accounting support authority

The exact-current shared/admin accounting audit first found the GIFI review-note helper and accounting-attachment helper, then expanded to fixed assets, period closures, reconciliation reviews, statement imports, statement rows, and reconciliation exceptions. Before Release 461, those runtime paths could create support tables and indexes; the attachment, reconciliation, and statement-import helpers also repaired older tables with request-time `ALTER TABLE` statements.

Release 461 now owns those structures explicitly in:

- `migrations/dev/20260829_release461_accounting_support_schema_authority.sql`
- `migrations/dev/20260830_release461_accounting_statement_import_schema_authority.sql`

The additive Development authority covers:

- `accounting_gifi_review_notes`
- `idx_accounting_gifi_review_notes_year`
- `accounting_attachments`
- attachment classification, scope, provider, statement-total, statement-period, and statement-detail columns
- `idx_accounting_attachments_expense`
- `idx_accounting_attachments_vendor`
- `idx_accounting_attachments_period`
- `idx_accounting_attachments_scope`
- `accounting_fixed_assets`
- `accounting_period_closures`
- `idx_accounting_period_closures_period`
- `accounting_reconciliation_reviews`
- reconciliation statement/detail/rate/unresolved-item columns
- `idx_accounting_reconciliation_reviews_type_period`
- `accounting_statement_imports`
- `accounting_statement_import_rows`
- `accounting_reconciliation_exceptions`
- reconciliation-exception assignment, accountant-review, resolution, and reopen columns
- `idx_accounting_statement_imports_period`
- `idx_accounting_statement_import_rows_import`
- `idx_accounting_statement_import_rows_provider_ref`
- `idx_accounting_reconciliation_exceptions_period`
- `idx_accounting_reconciliation_exceptions_queue`

`functions/api/admin/_accountingGifi.js`, `functions/api/admin/_accountingAttachments.js`, `functions/api/admin/accounting-fixed-assets.js`, `functions/api/admin/_accountingPeriods.js`, `functions/api/admin/_accountingReconciliation.js`, and `functions/api/admin/_accountingStatementImports.js` now verify required columns and indexes read-only through `PRAGMA table_info` and, where applicable, `PRAGMA index_list`. Compatibility `ensure*` names remain for callers, but they no longer execute DDL.

Business behavior remains intact when schema is ready: GIFI review-note reads/writes continue; accounting attachment upload still writes the R2 object plus the accounting row; fixed-asset creation still inserts the asset record; period locking/reopening still writes the closure state; reconciliation review reads/writes remain available; and CSV statement imports still create statement/import rows, run reconciliation auto-match, update review state, and create or update reconciliation exceptions. If Development schema is structurally stale, these paths surface schema-not-ready errors instead of silently repairing D1 during traffic.

Focused source authority is enforced by `scripts/release461_accounting_support_schema_gate.py`, already included in `scripts/release461_aggregate_source_gate.py`. It protects both accounting migrations and the statement-import runtime helper against reintroduction of request-time DDL. Both accounting migrations remain source authority only and have not been applied to Development D1 as part of this source cleanup.

The statement-import source checkpoint is `8d2a584424f6d7221651c7f9bdec5461c7974377`. Release 461 Source Gate `33312655653` and System Gate `33312655628` both passed on that exact SHA.

## Drift and migration rule

Release 461 Development D1 workflows are manual-dispatch-only. Before any write they verify the exact Development project/database identity and probe existing table shapes read-only.

If an existing table is structurally older than the Release 461 contract, the workflow stops. That condition requires a deliberate new forward repair migration. Historical migrations must not be replayed and runtime code must not self-repair the table.

If a table is absent, or if structurally compatible tables only need explicitly owned additive indexes/default rows, the current Release 461 migration may be applied after the read-only preflight.

## Current phase status

- Public/customer runtime-schema source audit: closed for the currently identified Release 461 public slices and protected by focused gates.
- Shared/admin notification runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Shared community runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Content Automation Studio/publication runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Accounting GIFI/attachment/fixed-asset/period/reconciliation/statement-import/exception support runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Development D1 Release 461 acceptance: pending manual execution; not claimed complete.
- Provider-specific Stripe/PayPal acceptance: still closed/pending credentials and does not block unrelated source cleanup.
- Remaining shared/admin audit: perform a fresh exact-current `functions/api/**` and shared-helper scan for the next hidden runtime schema mutation, request-time seed, or backfill owner.

## Boundaries

- Development branch/project only.
- Separate live Production remains untouched.
- Provider authorization remains closed.
- Provider execution/publication remains closed.
- No historical D1 replay.
- No automatic D1 migration trigger.
- Release 461 D1 migrations remain unapplied until explicit Development acceptance.

## Current checkpoint

The public/customer, notification, shared community, Content Automation/publication, and accounting slices listed above are now source-owned by explicit migrations and protected against request-time schema mutation.

A restart is never a reason to replay migrations. Re-verify the exact `dev` head and Development D1/R2 identities read-only first, then continue from a fresh broad runtime-DDL scan. `_accountingStatementImports.js` is no longer a restart target; its bounded source slice is closed.

Provider credentials are not required to continue this audit. Stripe/PayPal live or sandbox execution remains a separate acceptance boundary and should stay parked until the intended credentials are available.

## Continuing audit

Continue through `functions/api/**` and shared helpers searching for `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, mutation-bearing `ensure*Schema`, request-time policy seeds, and equivalent hidden backfills. Move discovered schema authority into explicit forward migrations plus read-only readiness services before calling a slice closed.

The community, content-publication/content-automation, notification, and current accounting targets are source-clean. Select the next target from the exact-current broad admin/shared scan rather than from historical helper names or earlier restart notes.

## Current-release metadata

`development-release.json` remains on Release 460 until Release 461 Development D1 authority is explicitly accepted. This prevents source-only progress from being misreported as an applied schema release.