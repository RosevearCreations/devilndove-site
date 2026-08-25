# Builds 393–402 Validation — Modularity + Fresh-Install Parity

## Status — CONSOLIDATED LOCAL PASS / DEVELOPMENT D1 + CUSTOMER DOCUMENTS BROWSER GATE REQUIRED

```text
393  Today Tasks action schema ownership
394  Membership assignment mutation authority + consumer migration
395  Membership policy schema/write authority + consumer migration
396  Customer Documents startup-read audit
397  Customer Documents owned read/runtime boundary
398  Customer Documents mutation audit + parity authority
399  Accounting runtime/fresh-install parity overlay
400  Aggregate/notification authority audit
401  Active runtime table parity audit
402  Fresh-install parity smoke / Production-data-copy fail-closed gate
```

## Consolidated local gate — PASS

The 2026-08-25 Development RC run completed:

```text
BUILD 401 ACTIVE RUNTIME TABLE PARITY AUDIT: PASS
BUILD 402 FRESH INSTALL PARITY SMOKE: PASS
BUILDS 393-402 MODULARITY + PARITY BATCH: PASS
No Cloudflare resource was contacted.
```

Build 402 intentionally keeps the Production business-data-copy gate closed. Its local in-memory smoke proves the retained aggregate plus current parity overlays can compose a clean current schema; it does not prove live Production-vs-Development row/data parity.

## Build 401 local result — PASS

The 2026-08-25 Development local audit reported:

```text
Runtime CREATE TABLE names: 347
Covered by database*.sql authority: 335
Runtime-only table names: 12
Critical Build 393–399 migration authorities: PASS
BUILD 401 ACTIVE RUNTIME TABLE PARITY AUDIT: PASS
```

The 12 runtime-only names are the next explicit migration/retirement backlog:

```text
candle_soap_recall_customer_matches
comments
creations
inventory_items
inventory_usage
member_sessions
members
product_qa_blocker_history
project_updates
public_proof_candidate_events
site_links
store_products
```

Their current source locations are concentrated in:

```text
functions/api/admin/bootstrap.js
functions/api/admin/migrate.js
functions/api/admin/candle-soap-recalls.js
functions/api/admin/product-qa-history.js
functions/api/admin/public-proof-candidates.js
```

Do not automatically migrate every legacy bootstrap table merely because a CREATE remains. Each name must be classified as current authority, compatibility-only bootstrap, or retireable legacy schema before adding a new migration.

## Build 402 fresh-install result — PASS

The first Build 402 run exposed a real clean-install dependency defect:

```text
database_gift_card_runtime_parity.sql failed fresh-install execution:
no such table: main.users
```

Cause: the old smoke applied current overlays before `database_full_schema.sql`. Gift Card tables can be declared before the `users` parent exists, but the migration-owned delivery-template seed forces SQLite foreign-key resolution and therefore requires Core parents such as `users` to exist first.

The corrected smoke uses this Development-local/in-memory composition:

1. Execute retained `database_full_schema.sql` first to establish Core/prerequisite parents (`users`, `orders`, `payments`, `products`, etc.).
2. With foreign-key enforcement temporarily disabled, drop only tables owned by current parity overlays. This in-memory database contains no business data.
3. Re-enable foreign keys.
4. Apply current overlays in dependency/build order so their table shapes and seeds replace stale aggregate copies:

```text
database_gift_card_runtime_parity.sql
database_today_task_actions_runtime_parity.sql
database_membership_tier_policy_runtime_parity.sql
database_customer_documents_runtime_parity.sql
database_accounting_runtime_parity.sql
database_notification_runtime_parity.sql
```

5. Verify current required columns, Gift Card templates, membership tier seeds, notification cooldown/automation seeds and `PRAGMA foreign_key_check`.

The passing smoke reported:

```text
Applied retained aggregate prerequisites: database_full_schema.sql
Removed stale aggregate copies for 25 overlay-owned tables.
Fresh-install table count: 512
Current overlay-owned table count: 25
Current parity overlays: PASS
Foreign-key check: PASS
BUILD 402 FRESH INSTALL PARITY SMOKE: PASS
PRODUCTION DATA COPY GATE: CLOSED — live Production read-only parity/data mapping is still required.
```

This drop/recreate technique is **fresh-install smoke only**. It must never be used against live Development/Production data. Existing Development D1 continues to use `scripts/build410_apply_development_parity_overlays.py`, which performs incremental/idempotent migration work rather than table replacement.

## Build 399 Accounting authority validation rule

The current Accounting evidence reader uses only these active authorities:

```text
accounting_hst_gst_reviews
accountant_export_packages
```

The historical names below may remain in explicit retirement metadata only:

```text
hst_gst_review_records
accountant_export_manifests
```

Their presence in `legacy_authorities_retired` is evidence that the migration is understood; it is not an active dependency. Local regression therefore rejects those names from the active readiness/query section while requiring them in retirement metadata. Do not remove correct retirement evidence merely to satisfy a string-absence test.

## Browser gate — Customer Documents only

After Development deploys, open:

```text
/admin/customer-documents/
```

The proof is read-only. Do not issue, void, delete, archive, send, or mutate a customer document.

Expected runtime/read boundary:

```text
contract                       operations-customer-documents-read
contract build                 397
owner                          operations
request-time schema mutation   false
mutation ownership moved       false
application module             commerce-operations
runtime build                  >=397
runtime state                  active
current domain                 operations
last pathname                  /admin/customer-documents/
required services              ["operations-customer-documents-read"]
page proven                    true
network transport              false
customer-documents mutation    false
contracts/services             true
```

If schema readiness is false, preserve exact missing tables/columns as parity evidence. Do not add DDL to GET.

## Development D1 gate

Gift Card parity has already been applied/proven against Development D1. The remaining Build 393/395/397/399/403 overlays now require the explicit Development-only applicator:

```bash
python scripts/build410_apply_development_parity_overlays.py
```

The local RC gate is complete; this D1 parity application is now the next release gate.

## Production gate

Production/main remains frozen. Production business-data copy remains blocked until live read-only schema/data mapping is completed and reconciled against the clean Development schema.
