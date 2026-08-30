# Devil n Dove — AI Handoff

## Current authority

**Accepted Development release:** Release 460 — Secure OAuth Lifecycle & Encrypted Token Authority.

**Active candidate:** Release 461 — Runtime Schema Authority and Development D1 Acceptance.

Release 461 is source-implemented and source-gated, but it is **not yet the accepted D1 release**. `development-release.json` must remain Release 460 until the combined Release 461 Development D1 acceptance is deliberately completed and reviewed.

Development boundary:

- source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- D1 binding/database: `DB` → `devilndove-dev`
- D1 UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- CAIP private R2: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- separate live Production: `main` / `devilndove-site` — **do not mutate**
- never add `account_id` to `wrangler.toml`

A new chat, workstation, deploy, or source commit is **not** a migration event. Never replay historical migrations because the session changed.

## Release 461 governing rule

A request is a business operation, never a migration trigger.

Release 461 removes request-time:

- `CREATE TABLE`
- `ALTER TABLE`
- `CREATE INDEX`
- implicit schema repair
- implicit default/policy seeding
- equivalent hidden migration/backfill behavior

Runtime may inspect schema read-only. If required schema is unavailable or structurally stale, runtime fails closed instead of repairing D1.

## Release 461 source status

The current Release 461 aggregate source authority covers the identified public/customer, shared, notification, community, Content Automation/publication, payment/auth, and accounting runtime-schema slices.

The combined acceptance manifest currently validates:

- **15 Release 461 Development migrations**
- **62 required tables**
- **76 required named indexes**

The manifest is generated from `migrations/dev/*release461*.sql` and rejects:

- Release 461 `ALTER TABLE`
- destructive `DROP` authority
- conflicting duplicate table/index definitions
- migration-order definitions that cannot converge a missing table

Key package files:

- `scripts/release461_aggregate_source_gate.py`
- `scripts/release461_d1_acceptance_manifest.py`
- `scripts/release461_d1_acceptance_package_gate.py`
- `.github/workflows/development-d1-release461-acceptance.yml`
- `docs/operations/RELEASE_461_PUBLIC_RUNTIME_SCHEMA_AUTHORITY.md`

## Release 461 accounting closure

The accounting scan expanded beyond the original statement-import helper and now has explicit migration ownership for the currently identified runtime schema authorities covering:

- GIFI review notes
- accounting attachments
- fixed assets
- period closures
- reconciliation reviews
- statement imports and rows
- reconciliation exceptions
- vendors
- expenses
- write-offs
- recurring expense rules
- General Ledger
- journal entries/lines
- payment applications
- HST/GST reviews
- accountant export packages
- accounting evidence attachments
- overhead allocations
- overhead-to-product allocations
- statement-provider profiles

Current accounting migration files include:

- `migrations/dev/20260829_release461_accounting_support_schema_authority.sql`
- `migrations/dev/20260830_release461_accounting_statement_import_schema_authority.sql`
- `migrations/dev/20260830_release461_accounting_expense_runtime_schema_authority.sql`
- `migrations/dev/20260830_release461_accounting_general_ledger_schema_authority.sql`
- `migrations/dev/20260830_release461_accounting_journal_schema_authority.sql`
- `migrations/dev/20260830_release461_accounting_close_workflow_schema_authority.sql`
- `migrations/dev/20260830_release461_accounting_overhead_provider_schema_authority.sql`

Important preserved business behavior:

- `apply_starter_gifi_mappings` remains a deliberate audited General Ledger action; it is not an automatic migration/runtime seed.
- statement-provider defaults remain available in memory and are materialized only by the explicit audited `seed_defaults` action.
- CSV statement import no longer creates provider-profile schema or seeds provider defaults before every import.
- overhead-to-product writes/deletes now respect the accounting period lock.
- the journal write-off aggregation no longer queries nonexistent write-off ledger columns; it uses ledger `6900` / `Write-Off Expense`.
- HST/GST reminder queueing delegates to notification authority; the close workflow does not recreate notification schema.

## Broad source scan status

After the accounting cleanup, candidate discovery was widened across current runtime schema signatures including `CREATE TABLE`, `ALTER TABLE`, index creation, `DROP TABLE`, seed/default patterns, backfills, and mutation-bearing `ensure*` helpers.

Historical/default-branch search results are **candidate discovery only**. A file is an offender only after its exact `dev` version is fetched and verified.

Exact-current candidates verified already migration-owned/read-only include:

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

The widened scan produced no additional confirmed current runtime DDL owner after the statement-import/provider cleanup. Do not reopen these files merely because an old code-search result mentions schema DDL.

## Combined Release 461 Development D1 workflow

`.github/workflows/development-d1-release461-acceptance.yml` is **manual-dispatch only**.

It has two modes:

### `preflight` — default, read-only

The operator supplies the exact reviewed `dev` SHA. The workflow:

1. refuses a moved/different source SHA
2. re-runs the complete Release 461 source gate
3. regenerates the Release 461 manifest
4. verifies exact Development Pages/D1 configuration
5. verifies D1 name and UUID through Cloudflare
6. reads `sqlite_master` only
7. compares existing tables/indexes against the Release 461 structural contract
8. reports whether D1 is safe, already converged, or how many objects an apply would create
9. performs **no D1 mutation**

Interpretation:

- missing Release 461 object → safe candidate for explicit forward creation
- existing compatible object → safe
- existing object missing required structure → **STOP**
- conflicting named index → **STOP**
- required pre-existing target table absent → **STOP**

Any STOP requires a new forward repair migration. Historical replay and runtime repair remain forbidden.

### `apply` — deliberate only

Apply requires the same clean preflight plus the exact confirmation phrase:

`APPLY-RELEASE-461-TO-DEVELOPMENT`

The workflow then applies only the Release 461 migration set in deterministic order and requires:

- full manifest convergence
- zero `pragma_foreign_key_check` violations

The workflow does **not** update `development-release.json` or touch separate live Production.

## Release 461 D1 status

**Pending.**

No combined Release 461 D1 apply has been performed as part of the current source cleanup. The package is assembled and source-validated; Cloudflare preflight/apply remains manual-only.

Do not call Release 461 complete until all of the following are true:

1. exact-current Release 461 Source Gate is green
2. exact-current System Gate is green
3. combined workflow passes `preflight` against that exact SHA
4. any discovered D1 structural drift is repaired through a new forward migration
5. a deliberate `apply` run is authorized and succeeds
6. post-apply structural/FK proof is green
7. `development-release.json` is deliberately promoted to Release 461
8. Development deploy/runtime acceptance agrees with the promoted SHA

## Release 460 security authority carried forward

Release 460 remains the accepted security/provider authority beneath Release 461:

- OAuth state is random, SHA-256 stored, expiring, and single-use.
- PKCE S256 and encrypted verifier storage are used where required/supported.
- `OAUTH_TOKEN_ENCRYPTION_KEY_V1` protects OAuth token material using versioned AES-GCM envelopes.
- plaintext OAuth token columns are forbidden.
- intended-account identity is verified before newly exchanged/refreshed token persistence.
- administrator OAuth start is Development-gated.
- provider execution/publication remains closed.
- retained legacy publish/probe HTTP actions remain blocked.
- `OAUTH_PROVIDER_AUTHORIZATION_MODE` remains unset/closed unless deliberately changed later.

Do **not** reopen provider authorization because Release 461 schema source is green.

## Provider/manual acceptance later

The following remain separate manual/provider evidence work and do not block Release 461 source cleanup:

- authenticated Development runtime evidence
- CAIP private-media browser proof
- Stripe test transaction/webhook/reconciliation
- PayPal sandbox transaction/webhook/reconciliation
- Etsy authorization/draft acceptance
- Pinterest/Meta/X/TikTok/YouTube authorization and controlled acceptance

Provider live authorization, execution/publication, and separate live Production remain closed.

## Restart point

At a new chat/session:

1. read `development-release.json` and remember that Release 460 remains accepted until Release 461 D1 acceptance is complete
2. verify exact `dev` head
3. verify Release 461 Source Gate and System Gate on that exact SHA
4. verify Development D1/R2 identities read-only
5. do not replay historical migrations
6. do not redo closed Release 461 accounting/runtime slices without exact-current regression evidence
7. if source remains green, the next database step is the combined Release 461 workflow in **`preflight`** mode using that exact reviewed SHA
8. if preflight reports drift, stop and create a dedicated forward repair migration
9. only after clean preflight should a separate deliberate `apply` be considered

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
5. `docs/operations/RELEASE_461_PUBLIC_RUNTIME_SCHEMA_AUTHORITY.md`
6. `docs/operations/RELEASE_460_SECURE_OAUTH_LIFECYCLE_AUTHORITY.md`

Older Markdown is historical/supporting material, not current release authority.
