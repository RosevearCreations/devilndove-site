# Release 461 Candidate — Runtime Schema and D1 Acceptance Authority

## Purpose

Release 461 removes request-time D1 schema creation, repair, index creation, implicit policy/default seeding, and equivalent hidden migration behavior from public/customer, shared, and admin runtime paths.

The governing rule is simple:

> A request is a business operation, never a migration trigger.

Runtime code may inspect schema read-only and may perform legitimate business reads/writes when the required contract is ready. If the contract is missing or structurally stale, runtime must fail closed instead of repairing D1.

## Environment boundary

Release 461 work is Development-only:

- source branch: `dev`
- Cloudflare Pages project: `devilndove-site-dev`
- Development D1 database: `devilndove-dev`
- exact Development D1 UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- separate live Production: untouched
- provider live authorization/execution/publication: closed
- historical migration replay: forbidden
- automatic D1 migration trigger: forbidden

`development-release.json` intentionally remains at accepted **Release 460** until Release 461 Development D1 authority is explicitly accepted. Source cleanup alone is not a database release.

## Release 461 migration inventory

The combined acceptance manifest currently validates **15** Development Release 461 migrations. Together they describe **62 required tables** and **76 named indexes**.

Current migration authority:

1. `migrations/dev/20260829_release461_accounting_support_schema_authority.sql`
2. `migrations/dev/20260829_release461_content_automation_publication_authority.sql`
3. `migrations/dev/20260829_release461_custom_request_commerce_authority.sql`
4. `migrations/dev/20260829_release461_member_runtime_schema_authority.sql`
5. `migrations/dev/20260829_release461_notification_runtime_schema_authority.sql`
6. `migrations/dev/20260829_release461_public_community_authority.sql`
7. `migrations/dev/20260829_release461_public_product_offer_authority.sql`
8. `migrations/dev/20260829_release461_public_runtime_schema_authority.sql`
9. `migrations/dev/20260829_release461_public_telemetry_authority.sql`
10. `migrations/dev/20260830_release461_accounting_close_workflow_schema_authority.sql`
11. `migrations/dev/20260830_release461_accounting_expense_runtime_schema_authority.sql`
12. `migrations/dev/20260830_release461_accounting_general_ledger_schema_authority.sql`
13. `migrations/dev/20260830_release461_accounting_journal_schema_authority.sql`
14. `migrations/dev/20260830_release461_accounting_overhead_provider_schema_authority.sql`
15. `migrations/dev/20260830_release461_accounting_statement_import_schema_authority.sql`

The acceptance manifest rejects Release 461 migrations containing `ALTER TABLE` or destructive `DROP` operations. It also rejects conflicting duplicate table/index definitions and migration-order shapes that could not converge through forward/additive `CREATE ... IF NOT EXISTS` authority.

## Public/customer source authority

The Release 461 public/customer audit has closed the currently identified runtime-schema owners covering:

- checkout recovery leads
- custom-request consent, request records, fulfillment prompts, product specifications, reference uploads, and commerce support
- product-interest/product-offer contracts
- member runtime contracts
- public telemetry contracts
- community events, pickup profiles, and vendor applications
- public auth schema contracts
- payment-webhook schema contracts

Focused gates remain authoritative for each public slice and are all collected by `scripts/release461_aggregate_source_gate.py`.

When a required public schema contract is unavailable, the corresponding handler fails closed rather than creating or altering D1.

## Notification authority

`functions/api/_lib/notificationOutbox.js` no longer creates notification tables, repairs columns, creates indexes, or silently seeds policy rows during normal queue/dispatch traffic.

`migrations/dev/20260829_release461_notification_runtime_schema_authority.sql` owns:

- `notification_outbox`
- `notification_dispatch_log`
- `notification_exclusions`
- `notification_cooldown_rules`
- `customer_engagement_runs`
- notification indexes
- explicitly migration-owned default cooldown policy rows

The notification helper now performs read-only readiness checks. Queueing, suppression, retries, dispatch logging, and delivery remain normal business operations.

The accounting close workflow does **not** duplicate notification schema authority. HST/GST reminder queueing delegates to the notification service and therefore inherits the notification readiness contract.

## Shared community authority

`functions/api/_communityContent.js` and its public/admin callers now treat community schema as migration-owned.

`migrations/dev/20260829_release461_public_community_authority.sql` owns the community event, pickup profile, vendor-application, recurrence/application columns, and associated indexes required by current runtime callers.

Compatibility `ensure*` functions may retain their historical names, but they now inspect schema read-only.

## Content Automation Studio/publication authority

Release 461 moved Content Automation Studio and publication table/index ownership out of shared runtime helpers into:

`migrations/dev/20260829_release461_content_automation_publication_authority.sql`

This includes current project, media, deliverable, render-job, event, publication, and publication-event authorities.

`functions/api/_lib/contentAutomationSchemaReadiness.js` is the shared structural readiness authority. Project/media/publication business writes remain available only after the schema is ready.

## Accounting source authority

The accounting scan was expanded until the exact-current admin/shared candidate set stopped producing new runtime DDL owners.

### Accounting support and reconciliation

`migrations/dev/20260829_release461_accounting_support_schema_authority.sql` and `migrations/dev/20260830_release461_accounting_statement_import_schema_authority.sql` now own the structures used by:

- GIFI review notes
- accounting attachments and statement metadata
- fixed assets
- period closures
- reconciliation reviews
- statement imports
- statement import rows
- reconciliation exceptions
- their required indexes

The corresponding helpers use `PRAGMA table_info` / `PRAGMA index_list` read-only readiness and never perform request-time repair.

### Vendors, expenses, write-offs, and recurring expenses

`migrations/dev/20260830_release461_accounting_expense_runtime_schema_authority.sql` owns:

- `accounting_vendors`
- `accounting_expenses`
- `accounting_writeoffs`
- `accounting_recurring_expense_rules`
- their required indexes

The vendor, expense, write-off, and recurring-expense write routes now fail when the required schema is stale rather than creating or altering it.

### General Ledger

`migrations/dev/20260830_release461_accounting_general_ledger_schema_authority.sql` owns `general_ledger_accounts` and its indexes.

The deliberate audited admin action `apply_starter_gifi_mappings` remains a legitimate business action. Those mappings are **not** silently seeded by the migration or normal runtime traffic.

### Journal

`migrations/dev/20260830_release461_accounting_journal_schema_authority.sql` owns journal entries, journal lines, and their indexes.

During this cleanup an independent correctness issue was also closed: the journal had attempted to group write-offs by nonexistent `accounting_writeoffs.ledger_code` / `ledger_name` fields. Current journal aggregation explicitly uses the existing write-off fallback authority:

- ledger code `6900`
- ledger name `Write-Off Expense`

The focused journal source gate protects both the schema boundary and that corrected aggregation contract.

### Month-end close workflow

`migrations/dev/20260830_release461_accounting_close_workflow_schema_authority.sql` owns:

- `accounting_payment_applications`
- `accounting_hst_gst_reviews`
- `accountant_export_packages`
- `accounting_evidence_attachments`
- close-workflow indexes and HST/GST evidence/reminder columns

`accounting_period_closures` remains owned by the accounting support authority. Notification schema remains owned by notification authority.

The close route performs read-only structural checks before payment application, HST/GST review, close-checklist, reminder, or export-manifest business actions.

### Overhead and statement-provider profiles

`migrations/dev/20260830_release461_accounting_overhead_provider_schema_authority.sql` owns:

- `accounting_overhead_allocations`
- `accounting_overhead_product_allocations`
- `accounting_statement_provider_profiles`
- their required indexes

Both overhead write routes now perform read-only readiness checks, and overhead-to-product writes/deletes respect the accounting period lock.

Statement-provider defaults remain available in memory through the read service. Database materialization occurs only through the explicit audited `seed_defaults` admin action. Normal profile saves do not seed unrelated defaults.

`functions/api/admin/accounting-statement-imports.js` was also corrected: CSV import no longer recreates `accounting_statement_provider_profiles` or materializes provider defaults before every import. Statement import now depends only on statement-import schema readiness and its actual business import logic.

## Broad exact-current source scan

After closing the accounting slices, the candidate scan was widened across runtime signatures including:

- `CREATE TABLE`
- `ALTER TABLE`
- `CREATE INDEX` / `CREATE UNIQUE INDEX`
- `DROP TABLE`
- `INSERT OR IGNORE` default-seed patterns
- `seed*`
- `backfill*`
- mutation-bearing `ensureTable` / `ensureSchema` patterns

Historical/default-branch search results were treated only as candidate discovery. A file was considered an offender only after its exact `dev` version was fetched and verified.

Exact-current candidates verified clean include, among others:

- `accounting-year-end-close.js`
- `accounting-gifi-summary.js`
- `product-costs.js`
- `tier-policies.js`
- `update-order-status.js`
- `delete-product.js`
- `mobile-create-product.js`
- `gift-card-actions.js`
- `gift-card-balance.js`
- `product-production-release.js`

The widened search produced no additional confirmed current runtime DDL owner after the statement-import/provider cleanup. Source scanning should still be repeated after future code changes, but the current Release 461 candidate set is ready for combined D1 preflight.

## Combined Development D1 acceptance package

Release 461 now has one combined acceptance package:

- manifest/drift engine: `scripts/release461_d1_acceptance_manifest.py`
- package source gate: `scripts/release461_d1_acceptance_package_gate.py`
- manual workflow: `.github/workflows/development-d1-release461-acceptance.yml`

The package source gate is part of `scripts/release461_aggregate_source_gate.py`.

### Manifest safety

The manifest is generated directly from every `migrations/dev/*release461*.sql` file. It:

- inventories the exact migration set in deterministic order
- forbids Release 461 `ALTER TABLE` and destructive `DROP` authority
- derives required table columns, primary keys, UNIQUE constraints, foreign-key relationships, and named-index signatures
- detects conflicting duplicate table/index definitions
- detects migration-order definitions that could not converge a missing table
- compares a read-only `sqlite_master` snapshot against the Release 461 contract

Preflight interpretation:

- missing Release 461-owned object: safe candidate for explicit forward creation
- existing compatible object: safe/no repair required
- existing table missing a Release 461-required structure: **hard stop**
- existing named index with a conflicting signature: **hard stop**
- target table missing when Release 461 does not create it: **hard stop**

A hard stop requires a new deliberate forward repair migration. Historical replay and runtime self-repair remain forbidden.

### Manual workflow modes

The combined workflow is `workflow_dispatch` only and defaults to **`preflight`**.

`preflight` mode:

1. pins an exact reviewed `dev` SHA supplied by the operator
2. re-runs the full Release 461 aggregate source gate
3. regenerates the 15-migration manifest
4. verifies the exact Development project/database configuration
5. verifies D1 name and UUID through Cloudflare
6. retrieves a read-only `sqlite_master` schema snapshot
7. reports structural safety, convergence, and the number of objects an apply would create
8. performs **no D1 mutation**

`apply` mode additionally requires the exact phrase:

`APPLY-RELEASE-461-TO-DEVELOPMENT`

Only after the same read-only preflight passes does it apply the Release 461 migration files in deterministic forward order. It then requires full structural convergence plus zero `pragma_foreign_key_check` violations.

The workflow does **not** promote `development-release.json`. A successful D1 apply must be reviewed first; source metadata promotion to Release 461 is a separate deliberate commit.

## Current source evidence

The combined D1 package source checkpoint validated:

- Release 461 aggregate source authority: PASS
- Release 461 migration manifest: PASS
- migration count: **15**
- required table count: **62**
- required named-index count: **76**
- automatic Development D1 mutation: CLOSED
- provider execution/authorization/publication: CLOSED
- separate live Production mutation: NONE

The previously completed statement-import/provider checkpoint `29977505699e1ace18fac4f8db3924307a7a994f` passed Release 461 Source Gate `33317962579` and System Gate `33317962559` on that exact SHA.

The combined acceptance package was then added and gated in source. Always use the current exact `dev` SHA when running the manual preflight rather than copying an older checkpoint SHA from this document.

## D1 acceptance status

Release 461 Development D1 acceptance is **pending**.

No Release 461 migration was applied to Development D1 during the source cleanup described here. The combined workflow has been assembled and source-validated, but its Cloudflare preflight/apply path is manual-only.

Do not call Release 461 complete until:

1. exact-current Source Gate is green
2. exact-current System Gate is green
3. combined Development D1 workflow completes in `preflight` mode against the exact reviewed SHA
4. any structural drift is resolved by new forward migrations
5. a deliberate `apply` run is authorized and completes successfully
6. post-apply structural and foreign-key evidence is green
7. `development-release.json` is deliberately promoted to Release 461 in source
8. the Development deployment and required authenticated runtime acceptance agree with that exact promoted SHA

## Restart protocol

A new chat or new day is never a migration trigger.

At restart:

1. verify the exact `dev` head and confirm it descends from the current Release 461 source chain
2. verify Release 461 Source Gate and System Gate on that exact SHA
3. re-confirm Development D1/R2 identities read-only
4. do **not** replay historical migrations
5. do **not** re-open already closed accounting/runtime slices unless exact-current evidence shows regression
6. if source remains green, the next database step is the combined Release 461 workflow in **`preflight`** mode using that exact reviewed SHA
7. if preflight reports structural drift, stop and create a dedicated forward repair migration
8. only after a clean preflight should a separate deliberate `apply` run be considered

## Closed boundaries

- Development source only unless the manual D1 workflow is explicitly run.
- Separate live Production remains untouched.
- Stripe/PayPal/provider credentials are not required for Release 461 source cleanup.
- Provider live authorization/execution/publication remains closed.
- No historical D1 replay.
- No request-time schema mutation.
- No automatic Release 461 D1 apply.
- Release 460 remains the accepted source/database marker until explicit Release 461 D1 acceptance and promotion.
