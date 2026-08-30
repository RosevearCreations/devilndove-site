# Devil n Dove — Project Status & Roadmap

## Current Development state

**Accepted release:** Release 460 — Secure OAuth Lifecycle & Encrypted Token Authority.

**Active candidate:** Release 461 — Runtime Schema Authority and Development D1 Acceptance.

Release 461 source work is now the active Development priority. `development-release.json` remains Release 460 until Release 461 D1 preflight, deliberate apply, post-apply proof, and source promotion are complete.

Development boundary:

- branch `dev`
- Pages project `devilndove-site-dev`
- URL `https://devilndove-site-dev.pages.dev`
- D1 `DB` → `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- R2 `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- R2 `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Separate live Production `main` / `devilndove-site` remains closed. Provider publication, provider execution, and live provider authorization remain closed. `OAUTH_PROVIDER_AUTHORIZATION_MODE` remains unset.

## Release 461 objective

Release 461 makes D1 schema ownership explicit. Runtime/customer/admin traffic must never create, alter, repair, index, or implicitly seed its own schema.

Current source authority is enforced by focused Release 461 gates plus `scripts/release461_aggregate_source_gate.py`.

The combined Release 461 acceptance manifest currently validates:

- **15 Development migrations**
- **62 required tables**
- **76 required named indexes**

The manifest rejects destructive/non-forward migration behavior and Release 461 migration definitions that cannot converge deterministically.

## Release 461 source work completed

### Public/shared runtime

Current source cleanup covers the identified Release 461 public/customer and shared contracts for:

- checkout recovery
- custom requests and commerce support
- product interest/product offers
- member runtime
- telemetry
- community content
- public auth
- payment-webhook schema contracts
- notifications
- Content Automation Studio/publication

These paths now use migration-owned schema plus read-only readiness rather than request-time DDL.

### Accounting

The exact-current accounting scan was expanded through the currently identified runtime-schema owners. Explicit Release 461 migrations now cover:

- GIFI review notes
- accounting attachments
- fixed assets
- period closures
- reconciliation reviews
- statement imports/rows
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

Additional correctness/authority fixes made during this pass:

- journal write-offs use `6900 / Write-Off Expense` instead of nonexistent write-off ledger columns
- General Ledger starter GIFI mappings remain explicit audited admin behavior, not implicit schema seeding
- statement-provider defaults remain in-memory unless the explicit `seed_defaults` action is used
- CSV statement import no longer creates/seeds provider-profile authority
- overhead-to-product changes respect accounting period locks
- accounting close no longer duplicates notification schema ownership

### Broad exact-current scan

After the accounting pass, candidate discovery was widened across runtime `CREATE TABLE`, `ALTER TABLE`, index creation, destructive DDL, seed/default, backfill, and mutation-bearing ensure helpers.

Historical search results were treated only as candidates and then verified against exact `dev`. No additional confirmed current runtime DDL owner remained after the statement-import/provider cleanup.

Future source changes must continue to pass the aggregate gate, so this scan can be repeated if new runtime code appears.

## Release 461 combined D1 acceptance package

New canonical package:

- `scripts/release461_d1_acceptance_manifest.py`
- `scripts/release461_d1_acceptance_package_gate.py`
- `.github/workflows/development-d1-release461-acceptance.yml`
- `docs/operations/RELEASE_461_PUBLIC_RUNTIME_SCHEMA_AUTHORITY.md`

The package is source-gated and manual-only.

### Preflight mode — next database step

The workflow defaults to **`preflight`**, which is read-only. It requires an exact reviewed `dev` SHA and:

1. reruns the aggregate Release 461 source authority
2. regenerates the migration manifest
3. verifies exact Development D1 identity
4. reads `sqlite_master`
5. compares current D1 schema to the Release 461 contract
6. reports structural safety/convergence/missing objects
7. performs no D1 mutation

A missing Release 461-owned object is safe to create later. An existing structurally incompatible object is a hard stop requiring a new forward repair migration.

### Apply mode — later and deliberate

Apply requires a clean preflight plus the exact typed confirmation:

`APPLY-RELEASE-461-TO-DEVELOPMENT`

It applies only Release 461 migrations in deterministic order, then requires full manifest convergence and zero foreign-key violations.

The workflow does not update `development-release.json` and does not touch separate live Production.

## Release 461 completion checklist

Release 461 is **not complete yet**. Remaining sequence:

1. keep exact-current Release 461 Source Gate green
2. keep exact-current System Gate green
3. run the combined Development D1 workflow in `preflight` mode against the exact reviewed SHA
4. if preflight reports structural drift, create a dedicated forward repair migration and repeat source gates/preflight
5. after a clean preflight, deliberately authorize `apply`
6. prove post-apply structural convergence and clean foreign keys
7. deliberately promote `development-release.json` to Release 461
8. deploy/verify the exact promoted Development SHA
9. complete applicable authenticated Development runtime evidence

Historical migrations must not be replayed at any point in this sequence.

## Release 460 authority carried forward

Release 460 remains the accepted security/provider baseline while Release 461 is pending. Its proven model includes:

- AES-GCM encrypted OAuth token/verifier authority
- hashed/single-use OAuth state
- PKCE S256 where applicable
- intended-account verification before token persistence/replacement
- no plaintext OAuth token columns
- redacted diagnostics
- Development-gated OAuth start/callback execution
- provider execution/publication closed
- retained legacy provider publish/probe actions blocked

Release 461 schema progress does not authorize live provider work.

## Other automated work after Release 461 D1 convergence

Once Release 461 Development D1 is accepted and the promoted Development build is green, resume the broader automated roadmap without reopening closed migration work:

1. Development authenticated runtime acceptance for Release 461-sensitive admin/public paths.
2. Stripe/PayPal automated contract, replay, webhook, and reconciliation preparation at the current release number.
3. Development-to-Production parity, transition, rollback, and promotion tooling.
4. Technical-debt removal of retained unreachable legacy social provider emitters while preserving the closed provider boundary.
5. Continue Storefront / Creators / Socials (CAIP) / Finance-Accounting / I.T. module evolution under current authority and SEO rules.

## Manual/provider acceptance — later

Separate manual evidence remains:

- authenticated Development browser acceptance
- CAIP private-media browser evidence
- Stripe test transaction/webhook/reconciliation
- PayPal sandbox transaction/webhook/reconciliation
- Etsy authorization/draft acceptance
- Pinterest/Meta/X/TikTok/YouTube authorization and controlled acceptance

Provider live authorization, execution/publication, and separate live Production remain closed until deliberately opened by a later reviewed release.

## Promotion rule

A feature or release is not complete because code exists. It must have aligned authority, safe failure behavior, source/regression gates, exact Development deployment evidence, database convergence where applicable, and authenticated/provider evidence where applicable.

Promotion to separate live Production remains a deliberate final operation, never an automatic consequence of Development success.
