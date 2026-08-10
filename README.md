# Devil n Dove — Build 245

Devil n Dove is a Southern Ontario mixed-media artisan/workshop platform covering storefront/catalog, D1 inventory and fractional material usage, Creative Projects, CAIP media/evidence, Content Studio, labels/packaging, orders/payments, launch readiness and operations.

## Start here

- Architecture/deployment: `AI_HANDOFF.md`
- Current status/roadmap: `PROJECT_STATUS_AND_ROADMAP.md`
- Markdown map: `MARKDOWN_INDEX.md`
- Production verification after migration: `BUILD245_D1_VERIFICATION.sql`

## Build 245 focus

Build 245 fixes false admin logout during temporary Cloudflare 5xx, staggers nonessential admin startup reads, adds lightweight paginated Inventory Operations with inline category/unit/usage editing, restores Product Editor supporting images from existing D1-linked media/history without deleting current gallery rows, and makes Product Readiness task drill-down/fallback usable. Build 244 D1 tool/supply authority and fractional/log-only/reusable consumption are included in the current migration.

## Current schema

Back up D1 and apply **one** of:

- `database_build245_admin_media_resilience.sql`; or
- byte-identical `database_upgrade_current_pass.sql`.

Do not apply both. Do not separately apply Build 244 immediately beforehand if production has not received it; Build 245 includes that transition. Confirm both Build 244 and Build 245 ledger keys, then run the read-only verification file.

## Local validation

```text
python3 scripts/build243_inventory_resilience_regression.py
python3 scripts/build244_inventory_authority_fractional_usage_regression.py
python3 scripts/build245_admin_media_resilience_regression.py
python3 scripts/build245_database_case_audit.py
python3 scripts/build245_public_page_audit.py
python3 scripts/build245_asset_reference_audit.py
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
python3 scripts/dark_theme_regression_check.py
python3 scripts/final_deployment_blocker_check.py
```

Live Cloudflare resource behavior/auth, remote R2 image reachability, payments/email, CAIP multipart interruption/recovery and physical packaging/laser work still require deployed evidence.
