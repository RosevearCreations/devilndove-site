# Devil n Dove — Build 240 Entry Point

Devil n Dove is a Cloudflare Pages/D1 application for catalog, inventory, orders, accounting, packaging, creative/content evidence, visual governance, local SEO operations and controlled launch readiness.

## Read first

1. `AI_HANDOFF.md` — architecture, data authority, safety and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — twenty completed Build 240 foundations, risks and the next twenty actions.
3. `MARKDOWN_INDEX.md` — specialist guides and archive policy.
4. `OPERATIONAL_CONTINUITY_BUILD240.md` — new D1-backed evidence and execution centre.

## Current operating centres

- Startup Readiness: `/admin/startup-readiness/` — 45 gates.
- Operational Continuity: `/admin/operational-continuity/` — twenty execution/evidence workstreams.
- Creative Automation Studio: `/admin/creative-automation/`.
- Labeling & Packaging: `/admin/packaging-studio/`.
- Image Manifest: `/admin/image-manifest/`.
- Product, inventory, order and accounting authorities remain in their existing admin centres.

## Current schema boundary

Back up D1, then apply exactly one:

- `database_build240_operational_evidence_continuity.sql`; or
- identical `database_upgrade_current_pass.sql`.

The aggregate schema files are synchronized through Build 240. Service-worker cache is `devilndove-shell-v18`.

## Local validation

```bash
node scripts/build240_operational_continuity_test.mjs
python3 scripts/build240_public_page_audit.py
python3 scripts/predeploy_sanity_check.py
python3 scripts/deployment_preflight_static_check.py
```

Local validation cannot prove production authentication, payment/provider delivery, D1/R2 restore, live indexing/ranking or physical packaging/laser-print results.
