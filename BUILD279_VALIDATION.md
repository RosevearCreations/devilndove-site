# Build 279 — Validation

## Dedicated Build 279 regression

`scripts/build279_worker_efficiency_go_live_test.py`

**62/62 checks passed.** It verifies:

- no request-time analytics `sqlite_master` / `PRAGMA` / `ALTER TABLE`;
- no public analytics IP hashing;
- admin/bot exclusion and 15-minute page-view throttling;
- visitor/session UPSERTs and fail-open behavior;
- checkout-recovery throttling and retry-amplification protection;
- no Live Activity polling;
- opt-in smoke/release dashboard reads;
- scoped dashboard summary APIs;
- removal/caching of public schema probes;
- CAIP per-part/request reductions;
- unchanged exact multipart integrity gates and R2 HEAD verification;
- Workers Logs configuration;
- Build 279 cache busting;
- fresh full-schema analytics UTM authority;
- all aggregate schema files execute with zero foreign-key violations;
- no Build 279 production D1 migration.

## Regression chain

Passed after Build 279 changes:

- Build 268 full-schema/CAIP compatibility
- Build 269 CAIP duplicate + multipart integrity
- Build 270 CAIP recovery presentation
- Build 271 CAIP operator clarity
- Build 272 CAIP intake readiness
- Build 273 CAIP / Creative Process / Content Studio bridge
- Build 274 Creative Process lifecycle/corrections
- Build 275 Packaging label regression — **72/72**
- Build 276 Packaging Inventory/INCI regression — **53/53**
- Build 277 bilingual ingredient/claim-spacing regression — **35/35**
- Build 278 Media edit/image-plan regression — **30/30**

## JavaScript syntax

23 modified runtime/API JavaScript files were checked with `node --check`: **23/23 passed**.

## Schema

- `database_full_schema.sql` executes: PASS; `PRAGMA foreign_key_check`: 0 rows.
- `database_schema.sql` executes: PASS; `PRAGMA foreign_key_check`: 0 rows.
- `database_store_schema.sql` executes: PASS; `PRAGMA foreign_key_check`: 0 rows.
- `fullSchemaRequirements.js` regenerated as schema Build 279 and includes the explicit analytics UTM columns.

## Public/SEO/assets

- Existing public-page audit: **36/36 passed**, 0 warnings, 0 failures.
- Asset-reference audit: **151 references checked, 0 missing**.
- Additional non-admin HTML H1 scan: **55/55 pages have exactly one H1**.

## Deployment status

Code package is ready for production deployment after the read-only `BUILD279_D1_VERIFICATION.sql` returns the expected production columns and no foreign-key violations.

Build 279 requires no production D1 mutation, so Build 278 remains a straightforward application rollback point.

## Package integrity

`devilndove-site-main-Build279-Worker-Efficiency-Go-Live-Hardening-20260820.zip` was tested with `unzip -t`: **no compressed-data errors**.
