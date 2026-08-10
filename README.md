# Devil n Dove — Build 247

Devil n Dove is a Southern Ontario mixed-media artisan/workshop platform covering storefront/catalog, D1 inventory and fractional material usage, Creative Projects, CAIP media/evidence, Content Studio, labels/packaging, orders/payments, launch readiness and operations.

## Start here

- Architecture/deployment: `AI_HANDOFF.md`
- Current status/roadmap: `PROJECT_STATUS_AND_ROADMAP.md`
- Markdown map: `MARKDOWN_INDEX.md`
- Production verification after migration: `BUILD247_D1_VERIFICATION.sql`

## Build 247 focus

Build 247 retains the Build 246 Product Editor, deletion, finished-production, CAIP duplicate and INCI/French-review foundations, and completes the current Packaging Studio repair: Truth-reference ingredient zones, full botanical rose palette/custom colour, rose-path decoupling, reusable layout gallery, persistent formula/content libraries and exact-key label deletion.

### Current D1 migration

Back up D1, confirm Build 246 is already applied, then apply **one** of:

- `database_build247_packaging_library_truth_layout_rose_palette.sql`; or
- byte-identical `database_upgrade_current_pass.sql`.

Do not apply both. Confirm `build247_packaging_library_truth_layout_rose_palette`, then run `BUILD247_D1_VERIFICATION.sql` before deploying matching code. Build 246 is the prerequisite; service-worker shell remains v23.

## Local validation

```text
python3 scripts/build243_inventory_resilience_regression.py
python3 scripts/build244_inventory_authority_fractional_usage_regression.py
python3 scripts/build245_admin_media_resilience_regression.py
python3 scripts/build246_product_project_packaging_regression.py
python3 scripts/build247_packaging_studio_regression.py
python3 scripts/build245_database_case_audit.py
python3 scripts/build246_public_page_audit.py
python3 scripts/build246_asset_reference_audit.py
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
python3 scripts/dark_theme_regression_check.py
python3 scripts/final_deployment_blocker_check.py
```

Live Cloudflare resource behavior/auth, remote R2 image reachability, payments/email, CAIP multipart interruption/recovery and physical packaging/laser work still require deployed evidence.
