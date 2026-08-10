# Build 245 Validation

Local/static validation status: **PASS**.

## Core regressions

- `python3 scripts/build243_inventory_resilience_regression.py` — PASS.
- `python3 scripts/build244_inventory_authority_fractional_usage_regression.py` — PASS; 897 legacy master rows (399 tools + 498 supplies), 897 clean-schema D1 catalog/inventory rows, no TEMP/DROP operations.
- `python3 scripts/build245_admin_media_resilience_regression.py` — PASS; degraded-auth retention, admin startup staggering, inventory bootstrap/pagination, linked-media recovery and repeat-migration idempotency.
- `node scripts/build241_caip_large_media_intake_test.mjs` — PASS.
- Modified JavaScript `node --check` — PASS.
- `python3 scripts/dark_theme_regression_check.py` — PASS.

## Schema/migration

- `database_build245_admin_media_resilience.sql` and `database_upgrade_current_pass.sql` — byte-identical.
- Build 245 current migration contains 0 TEMP-table operations and 0 DROP TABLE operations.
- `database_full_schema.sql`, `database_schema.sql` and `database_store_schema.sql` execute successfully in SQLite synthetic checks.
- Current migration applies twice without duplicating the Build 245 ledger key.
- Direct synthetic upgrade from the user-supplied live aggregate to Build 245 — PASS.
- Post-upgrade synthetic counts: 897 D1 tool/supply catalog rows, 897 active D1 tool/supply inventory rows, one Build 244 ledger key and one Build 245 ledger key.
- Product-media recovery regression created three linked media references with no `product_images`; Build 245 recovered all three, filled only the blank featured field, and did not duplicate them on repeat.

## Database case policy

`python3 scripts/build245_database_case_audit.py` — PASS:

- database object identifiers checked: 2,509;
- mixed-case database object identifiers: 0;
- controlled classification defaults: lower-case;
- display names, URLs, Amazon ASIN/SKU values, order numbers and currencies: intentionally case-preserving.

## Public SEO/assets

`python3 scripts/build245_public_page_audit.py`:

- indexable public pages audited: 36;
- passed: 36;
- warnings: 0;
- failed: 0;
- multiple-H1 failures: 0.

`python3 scripts/build245_asset_reference_audit.py`:

- local `/assets/...` references: 120;
- missing: 0.

`python3 scripts/predeploy_sanity_check.py`:

- pages checked: 109;
- issues: 0;
- status: PASS.

## Important production evidence still required

Static/local checks cannot prove the live Cloudflare resource state. After migration/deployment, verify a real admin refresh, inspect any residual 503/1102 by Ray ID, reopen known products that previously had multiple supporting images and confirm the remote R2 images load, run `BUILD245_D1_VERIFICATION.sql`, and complete the remaining Startup provider/payment/email/CAIP/physical proof gates. No fresh deployed phone/desktop screenshot browser pass is claimed by this validation file.

## Final release gates

- `python3 scripts/deployment_preflight_static_check.py` — **READY**, 0 blockers, 0 warnings.
- `python3 scripts/final_deployment_blocker_check.py` — **PASS**.
- `python3 scripts/dark_theme_regression_check.py` — **PASS**.
- CSS brace balance — PASS.
- Current release manifest generator now labels the package **Build 245**.
