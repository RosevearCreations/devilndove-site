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

The notification outbox helper was the next confirmed shared-runtime offender. It previously created notification support tables, repaired missing `notification_outbox` columns, and inserted default cooldown policy rows while normal queue/dispatch traffic was running.

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

## Drift and migration rule

Release 461 Development D1 workflows are manual-dispatch-only. Before any write they verify the exact Development project/database identity and probe existing table shapes read-only.

If an existing table is structurally older than the Release 461 contract, the workflow stops. That condition requires a deliberate new forward repair migration. Historical migrations must not be replayed and runtime code must not self-repair the table.

If a table is absent, or if structurally compatible tables only need explicitly owned additive indexes/default rows, the current Release 461 migration may be applied after the read-only preflight.

## Current phase status

- Public/customer runtime-schema source audit: closed for the currently identified Release 461 public slices and protected by focused gates.
- Shared/admin notification runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Development D1 notification acceptance: pending manual execution; not claimed complete.
- Provider-specific Stripe/PayPal acceptance: still closed/pending credentials and does not block unrelated source cleanup.
- Remaining shared/admin audit: continue through community/content-publication/content-automation helpers and then the broader admin request tree for hidden runtime schema mutation, seeding, or backfill behavior.

## Boundaries

- Development branch/project only.
- Separate live Production remains untouched.
- Provider authorization remains closed.
- Provider execution/publication remains closed.
- No historical D1 replay.
- No automatic D1 migration trigger.
- Release 461 D1 migrations remain unapplied until explicit Development acceptance.

## Continuing audit

Continue through `functions/api/**` and shared helpers searching for `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, mutation-bearing `ensure*Schema`, request-time policy seeds, and equivalent hidden backfills. Move discovered schema authority into explicit forward migrations plus read-only readiness services before calling a slice closed.

The next shared/admin targets are `_communityContent.js`, `contentPublications.js`, and `contentAutomationStudio.js`, subject to exact-current-`dev` inspection before classification.

## Current-release metadata

`development-release.json` remains on Release 460 until Release 461 Development D1 authority is explicitly accepted. This prevents source-only progress from being misreported as an applied schema release.
