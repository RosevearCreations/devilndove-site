# Devil n Dove — Build 241

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

## Build 241 schema

Back up D1 and confirm `build240_operational_evidence_continuity`, then apply one of:

- `database_build241_caip_large_media_intake.sql`; or
- byte-identical `database_upgrade_current_pass.sql`.

Do not apply both.

Build 241 adds CAIP private raw-media sessions/files/parts, planned processors, governed public-promotion requests, the 21st workstream and 46th Startup gate. The binary-upload feature additionally requires a private Cloudflare R2 binding named `CAIP_PRIVATE_MEDIA_BUCKET`.

## Local validation

Run at minimum:

```text
node scripts/build241_caip_large_media_intake_test.mjs
python3 scripts/build241_public_page_audit.py
python3 scripts/build241_asset_reference_audit.py
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
python3 scripts/final_deployment_blocker_check.py
```

Live Cloudflare bindings, authentication, payment/email providers, multipart interruption/recovery, and physical packaging/laser work still require deployed evidence.
