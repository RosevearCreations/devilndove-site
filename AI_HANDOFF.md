# Devil n Dove AI Handoff — Build 194

Read this first in a new chat. Then read `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, `BUILD194_TESTING_GUIDE.md`, and `LIVE_TESTING_GUIDE.md`.

## Current build

Build 194 improves customer-facing store discovery and buyer-question clarity without bypassing existing consent, product QA, or release-control workflows.

New public routes:

- `/workshop-journal/`
- `/workshop-journal/polymer-clay-earring-care/`
- `/workshop-journal/coin-and-spoon-ring-care/`
- `/workshop-journal/handmade-vintage-sourced-guide/`

New APIs:

- `/api/featured-products`
- `/api/admin/product-listing-profiles`
- `/api/admin/product-media-score`

New D1 migration:

```text
database_build194_storefront_discovery_product_facts_media_roles.sql
```

Public rules:

- Only listing profiles with `profile_status` `approved` or `published` render as public Quick Facts.
- Only explicitly assigned media roles replace public placeholders.
- Product video must be HTTPS and suitable for public viewing.
- Customer media remains private until consent/public-use approval exists.
- Recently viewed data is browser-local only; do not turn it into cross-device tracking without a future privacy review.

## Primary routes

- `/admin/command-center/` — daily operations, live readiness, cost/fee, SEO, media, and consolidation evidence.
- `/admin/catalog-media/` — product image health, listing facts, and Build 194 media-role scoring.
- `/admin/mobile-product/` — phone product draft capture and resumable large-photo uploader.
- `/admin/products/` — desktop product editor.
- `/admin/local-seo-review/` — Search Console and local SEO review.
- `/admin/marketplace-exports/` — channel exports with margin gates.
- `/admin/visual-enrichment-studio/` — visual/media governance.
- `/admin/deployment-preflight/` — static and release checks.

## Important APIs

- `/api/auth/login` — must return JSON; root `_routes.json` must include `/api/*`.
- `/api/featured-products` — public approved active featured product cards; safe empty fallback.
- `/api/product-detail` — returns approved listing profile only.
- `/api/admin/product-listing-profiles` — admin listing facts workflow.
- `/api/admin/product-media-score` — admin image-role assignment and score workflow.
- `/api/admin/value-ops` — integrated command-center operations.
- `/api/admin/live-readiness-playbook` — detailed live test cases/runs/evidence.
- `/api/admin/mobile-resumable-upload` — R2 multipart mobile upload.
- `/api/before-after-gallery` — public approved/consented gallery proof only.
- `/api/admin/marketplace-export-preview` — marketplace CSV with margin enforcement.

## D1 migration order

Run only missing migrations. Do not blindly rerun older non-idempotent migrations.

```text
database_build171_ledger_repair.sql only if Build 171 schema exists but the marker is missing
database_build173_deployment_preflight.sql
database_build174_deployment_preflight_detail.sql
database_build175_release_control.sql
database_build176_release_safety_controls.sql
database_build177_deploy_score_and_controls.sql
database_build178_promote_live_controls.sql
database_build179_promotion_control.sql
database_build180_go_live_execution.sql
database_build181_live_ops_followthrough.sql
database_build182_mobile_visual_polish.sql
database_build183_visual_enrichment_studio.sql
database_build184_sanity_check_and_value_roadmap.sql
database_build185_admin_command_center_value_dashboards.sql
database_build186_markdown_consolidation_visual_placeholders.sql
database_build189_value_ops_live_counts.sql
database_build190_integrated_value_operations.sql
database_build191_value_operations_followthrough.sql
database_build192_operational_data_connection.sql
database_build193_live_readiness_playbook.sql
database_build194_storefront_discovery_product_facts_media_roles.sql
```

Builds 187 and 188 were routing/environment hotfixes without D1 migrations.

## Key business rules

- One H1 maximum per exposed page.
- Never promise first-page or local-pack placement.
- Fee/cost defaults are not financial truth until owner-reviewed.
- Marketplace exports stay blocked for unhealthy/unknown margin unless a current reviewed override exists.
- Review eligibility is not permission to contact.
- Customer stories, gallery proof, and customer photographs require consent/public-use approval.
- Placeholders are layout scaffolding, not proof.
- Mobile recovery stores fields; user must reselect image files after browser reload.
- Resumable image uploads require an R2 binding and an already-saved product draft.
- Environment views must never reveal secret values.
- Do not merge customer duplicates automatically.

## Build 194 owner test order

1. Apply `database_build194_storefront_discovery_product_facts_media_roles.sql` after Build 193.
2. Confirm `/api/auth/login` returns JSON.
3. Confirm `DB` and `PRODUCT_MEDIA_BUCKET` bindings in Cloudflare Pages.
4. Open `/admin/catalog-media/` and create one draft listing profile for a test product.
5. Confirm draft Quick Facts do not appear publicly; approve only correct facts.
6. Assign media roles for a well-photographed test product and confirm public proof slots change safely.
7. Test homepage Featured Creations, Shop quick filters, recently viewed items, and Workshop Journal pages on phone and desktop.
8. Run `/admin/deployment-preflight/` and record evidence using `BUILD194_TESTING_GUIDE.md`.

## Documentation policy

Canonical files:

1. `PROJECT_STATUS_AND_ROADMAP.md`
2. `AI_HANDOFF.md`

Supporting documents exist only for specialist detail. Historical context remains in `docs/archive/`.
