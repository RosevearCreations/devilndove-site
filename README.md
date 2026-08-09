# Devil n Dove — Build 243

Devil n Dove is a Southern Ontario mixed-media artisan/workshop platform covering storefront/catalog, inventory, creative projects, CAIP media/evidence, Content Studio, labels/packaging, orders/payments, launch readiness and operations.

## Start here

- Architecture/deployment: `AI_HANDOFF.md`
- Current status/roadmap: `PROJECT_STATUS_AND_ROADMAP.md`
- Markdown map: `MARKDOWN_INDEX.md`

## Current admin authorities

- Creative Automation: `/admin/creative-automation/`
- CAIP: `/admin/creative-assets/`
- Labeling & Packaging: `/admin/packaging-studio/`
- Operational Continuity: `/admin/operational-continuity/`
- Startup Readiness: `/admin/startup-readiness/` — 46 gates
- Visual Image Manifest: `/admin/image-manifest/`

## Build 243 schema

Back up D1 and confirm `build241_caip_large_media_intake`, then apply one of:

- `database_build243_inventory_resilience_case_normalization.sql`; or
- byte-identical `database_upgrade_current_pass.sql`.

Do not apply both. Build 243 normalizes controlled inventory/catalog classifications to lower case, non-destructively combines active inventory identities that differ only by source-type capitalization, and adds the indexes used by the lighter Inventory Operations paths. Build 241 CAIP remains a prerequisite.

## Local validation

Run at minimum:

```text
python3 scripts/build243_inventory_resilience_regression.py
python3 scripts/build243_database_case_audit.py
python3 scripts/build243_public_page_audit.py
python3 scripts/build243_asset_reference_audit.py
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
python3 scripts/final_deployment_blocker_check.py
```

Live Cloudflare resource behavior, authentication, payment/email providers, CAIP multipart interruption/recovery and physical packaging/laser work still require deployed evidence.
