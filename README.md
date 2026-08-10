# Devil n Dove — Build 246

Devil n Dove is a Southern Ontario mixed-media artisan/workshop platform covering storefront/catalog, D1 inventory and fractional material usage, Creative Projects, CAIP media/evidence, Content Studio, labels/packaging, orders/payments, launch readiness and operations.

## Start here

- Architecture/deployment: `AI_HANDOFF.md`
- Current status/roadmap: `PROJECT_STATUS_AND_ROADMAP.md`
- Markdown map: `MARKDOWN_INDEX.md`
- Production verification after migration: `BUILD246_D1_VERIFICATION.sql`

## Build 246 focus

Build 246 repairs Product Editor update identity and SEO/social-image persistence; distinguishes empty generated Content Studio/CAIP product shells from meaningful history during product deletion; adds audited Creative Project deletion with unreversed raw-inventory return; adds idempotent Finished Product Production Release with material/ingredient snapshots; strengthens same-project CAIP media duplicate protection; and moves soap packaging toward the approved `soap_reference_v2` with INCI-backed ingredient facts plus review-required French drafts. Build 245 admin 5xx/degraded-auth and inventory/media resilience remain retained foundations.

### Current D1 migration

Back up D1, confirm Build 245 is already applied, then apply **one** of:

- `database_build246_product_project_production_packaging.sql`; or
- byte-identical `database_upgrade_current_pass.sql`.

Do not apply both. Confirm `build246_product_project_production_packaging`, then run `BUILD246_D1_VERIFICATION.sql` before deploying matching code. Service-worker shell is v23.

## Local validation

```text
python3 scripts/build243_inventory_resilience_regression.py
python3 scripts/build244_inventory_authority_fractional_usage_regression.py
python3 scripts/build245_admin_media_resilience_regression.py
python3 scripts/build246_product_project_packaging_regression.py
python3 scripts/build245_database_case_audit.py
python3 scripts/build246_public_page_audit.py
python3 scripts/build246_asset_reference_audit.py
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
python3 scripts/dark_theme_regression_check.py
python3 scripts/final_deployment_blocker_check.py
```

Live Cloudflare resource behavior/auth, remote R2 image reachability, payments/email, CAIP multipart interruption/recovery and physical packaging/laser work still require deployed evidence.
