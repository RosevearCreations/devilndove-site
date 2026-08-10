# Build 246 Validation

Local/static/synthetic validation status: **PASS**. Final ZIP integrity/hash are recorded at packaging time.

## Product/project/production/packaging regression

`python3 scripts/build246_product_project_packaging_regression.py` — PASS:

- Product edit identity + defensive Update Product ID recovery present.
- SEO/social image selection and server persistence present.
- Generated empty product-shell cleanup + meaningful-history blockers present.
- Creative Project delete/inventory-return audit present, including per-post reversal evidence and retry-safe unreversed-post handling.
- Finished-production material/ingredient snapshot and idempotency present.
- CAIP same-project duplicate skip present.
- Approved soap renderer + curated French draft/review present; no invented default marketing claims or unverified default net quantity in the soap renderer.
- Current migration contains 0 TEMP-table operations and 0 destructive table-removal operations.

## Retained regressions

- Build 243 inventory resilience — PASS.
- Build 244 D1 inventory authority/fractional usage — PASS; 897 legacy master rows retained in the D1 transition foundation.
- Build 245 admin/media resilience — PASS.
- Build 241 CAIP private large-media foundation — PASS.
- Modified JavaScript `node --check` — PASS.

## Schema/migration

- `database_build246_product_project_production_packaging.sql` and `database_upgrade_current_pass.sql` are byte-identical.
- `database_full_schema.sql` executes successfully in SQLite synthetic validation.
- Build 246 migration applies repeatedly without duplicating its migration-ledger key.
- `BUILD246_D1_VERIFICATION.sql` parses/executes read-only against the full synthetic aggregate and retains Build 245 media-integrity/SEO-role diagnostics.
- Lower-case database-object audit: 2,547 object identifiers checked; 0 mixed-case identifiers.

## Public SEO/assets

- Build 246 public audit: 36 indexable pages, 36 passed, 0 warnings, 0 failed, 0 multiple-H1 failures.
- Build 246 local `/assets/...` audit: 120 references, 0 missing.
- `python3 scripts/predeploy_sanity_check.py`: 109 pages, 0 issues, PASS.
- `python3 scripts/dark_theme_regression_check.py`: PASS.

## Production evidence still required

Local/synthetic checks cannot prove production D1 historical shapes, remote R2 reachability, real Cloudflare Worker limits, provider/payment/email delivery, phone/desktop deployed rendering or physical soap-label wrap/print quality. After deployment, run the Build 246 smoke sequence and retain any Cloudflare Ray ID for residual 5xx/1102.
