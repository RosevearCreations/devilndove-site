# Devil n Dove — Build 244

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

## Build 244 schema

Back up D1 and confirm `build241_caip_large_media_intake`, then apply one of:

- `database_build244_inventory_authority_fractional_usage.sql`; or
- byte-identical `database_upgrade_current_pass.sql`.

Do not apply both. Build 244 moves normal tool/supply runtime authority to D1, database-side populates missing operational inventory, adds editable classification and fractional/log-only/reusable material usage. Build 243 lower-case/resilience controls and Build 241 CAIP remain retained prerequisites/foundations.

## Local validation

Run at minimum:

```text
python3 scripts/build243_inventory_resilience_regression.py
python3 scripts/build244_inventory_authority_fractional_usage_regression.py
python3 scripts/build244_database_case_audit.py
python3 scripts/build244_public_page_audit.py
python3 scripts/build244_asset_reference_audit.py
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
python3 scripts/final_deployment_blocker_check.py
```

Live Cloudflare resource behavior, authentication, payment/email providers, CAIP multipart interruption/recovery and physical packaging/laser work still require deployed evidence.
