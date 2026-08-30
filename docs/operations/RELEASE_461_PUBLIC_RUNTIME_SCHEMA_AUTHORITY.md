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

## Drift and migration rule

Release 461 Development D1 workflows are manual-dispatch-only. Before any write they verify the exact Development project/database identity and probe existing table shapes read-only.

If an existing table is structurally older than the Release 461 contract, the workflow stops. That condition requires a deliberate new forward repair migration. Historical migrations must not be replayed and runtime code must not self-repair the table.

If a table is absent, or if structurally compatible tables only need explicitly owned additive indexes/default rows, the current Release 461 migration may be applied after the read-only preflight.

## Current phase status

- Public/customer runtime-schema source audit: closed for the currently identified Release 461 public slices and protected by focused gates.
- Shared/admin notification runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Shared community runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Content Automation Studio/publication runtime-schema source slice: migration-owned and runtime-read-only at source level.
- Development D1 Release 461 acceptance: pending manual execution; not claimed complete.
- Provider-specific Stripe/PayPal acceptance: still closed/pending credentials and does not block unrelated source cleanup.
- Remaining shared/admin audit: continue through the broader admin request tree for hidden runtime schema mutation, request-time seeding, or backfill behavior.

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

The community and content-publication/content-automation targets are now source-clean. The next target should be selected from the exact-current-`dev` broad admin/shared scan rather than from historical helper names alone.

## Current-release metadata

`development-release.json` remains on Release 460 until Release 461 Development D1 authority is explicitly accepted. This prevents source-only progress from being misreported as an applied schema release.
