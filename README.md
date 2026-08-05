# Devil n Dove — Build 235 Entry Point

Devil n Dove is a Cloudflare Pages/D1 application for catalog, inventory, orders, accounting, packaging, creative-process evidence, content preparation, local SEO operations and controlled launch readiness.

## Read first

1. `AI_HANDOFF.md` — architecture, data authority, safety and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed work, current risks and ordered next steps.
3. `MARKDOWN_INDEX.md` — specialist guides and historical archive policy.

## Current operating centres

- Startup Readiness: `/admin/startup-readiness/`
- Creative Automation Studio: `/admin/creative-automation/`
- Labeling & Packaging: `/admin/packaging-studio/`
- Image Manifest: `/admin/image-manifest/`
- Product, inventory, order and accounting authorities remain in their existing admin centres.

## Build 235 summary

Build 235 makes Creative Automation more operational without creating a second source of truth. The server computes readiness for seven stages from existing specialist records, the browser surfaces blocked/overdue/due-soon/unassigned work, and an authenticated project can be exported as JSON or accessible print-ready HTML evidence. Publication counting now uses `content_status`. The layout is responsive, the admin page remains noindex with one H1, and shell v16 refreshes the changed assets.

Build 235 is code-only. `database_build234_packaging_templates_creative_cleanup.sql` and the byte-identical `database_upgrade_current_pass.sql` remain the current D1 boundary. Do not apply both.

Historical Build Markdown is under `docs/archive/build-history/`; it is traceability evidence, not current direction.

## Local validation

```bash
node scripts/build235_creative_readiness_test.mjs
node scripts/build234_packaging_creative_test.mjs
python3 scripts/deployment_preflight_static_check.py
python3 scripts/predeploy_sanity_check.py .
python3 scripts/final_deployment_blocker_check.py
```

Production, provider, physical print/laser, payment/refund, concurrency, email and restore outcomes must still be proven through the Startup/Prelaunch procedures. Local checks cannot manufacture that evidence.
