# Devil n Dove AI Handoff — Build 189

Use this file first when opening a new AI chat or handing the repository to another assistant.

## Current build

Build 189: Markdown consolidation, value-backlog tracking, visual graphic placeholders, desktop/mobile sanity rows, and CSS drift review rows.

## Important route additions

- `/admin/markdown-sanity/`
- `/api/admin/markdown-sanity`

Recent main routes to know:

- `/admin/command-center/`
- `/admin/application-sanity/`
- `/admin/visual-polish/`
- `/admin/visual-enrichment-studio/`
- `/admin/deployment-preflight/`
- `/admin/deploy-readiness/`
- `/admin/promotion-control/`
- `/admin/go-live-execution/`
- `/admin/live-ops-followthrough/`

## D1 migration order

Run only the missing migrations, in order. Do not rerun older `ALTER TABLE ADD COLUMN` migrations against a database that already has those columns unless the SQL has been made idempotent.

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
```

## Markdown policy

Primary files:

1. `PROJECT_STATUS_AND_ROADMAP.md` — current human/business roadmap.
2. `AI_HANDOFF.md` — current new-chat technical handoff.

Supporting references remain available: `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `DATABASE_SCHEMA_REFERENCE.md`, `RELEASE_NOTES.md`, `SANITY_HEALTH_CHECK.md`, `LOCAL_SEO_PLAYBOOK.md`, `IMAGES.md`, `COMPETITIVE.md`, `README.md`, `NEW_CHAT_STATUS.md`, `AI_CONTEXT.md`, `REPO_BASE_GUIDE.md`, `REPO_RULES.md`, and `AMAZON_MATCHING_NOTES.md`.

## SEO and visual rules

- Keep no more than one H1 per exposed public page.
- Use clear, searchable titles, headings, body copy, internal links, image alt text, and structured data.
- Keep local wording natural and useful; do not keyword stuff.
- Visual placeholders are temporary and should be replaced only after image approval, alt text, consent/public-use, compression, and mobile checks.
- Keep desktop and mobile versions usable. Admin tables must remain horizontally scrollable and buttons should stay phone-tappable.

## Live-only checks still required after deployment

Cloudflare D1, R2, email providers, payment providers, Search Console import, Google Business Profile observations, and any direct R2/private evidence actions must be tested in the deployed environment with real bindings/secrets.


## Build 187 handoff note

The user reported `api/auth/login` returning 405 and said Cloudflare currently shows only `FACEBOOK_PAGE_ID` and `STRIPE_SECRET_KEY`. Build 187 patches `/api/auth/login`, adds `/api/auth-login`, updates `auth.js` fallback behavior, patches `health` and legacy `admin/bootstrap` to prefer `DB`, and adds `CLOUDFLARE_ENVIRONMENT_CHECKLIST.md`. No D1 migration is required.


## Build 189 — Value Ops live counts, funnel events, mobile recovery, and visual replacement plan

Completed in this pass:

1. Added the missing `/api/admin/command-center` endpoint so the Admin Command Center can load real live counts instead of being only a static page.
2. Connected live Product Readiness counts from products/product images/product gaps into the Command Center.
3. Added live conversion funnel rollups: landing page view → product view → add to cart → checkout start → order.
4. Added explicit public funnel events for product detail views, add-to-cart actions, checkout starts, and order creation.
5. Added mobile product browser autosave/recovery so phone-entered draft text survives refresh/session/upload failures.
6. Added visual placeholder bands to high-value public pages without adding extra H1 tags.
7. Added visual replacement candidate rows so placeholders can be replaced only after public-use/consent/compression review.
8. Added local SEO observation rows to pair Search Console data with Google Business Profile/manual ranking notes.
9. Added product cost/margin review rows for product pricing and marketplace-profit review.
10. Updated schema files, release notes, sanity notes, handoff docs, and static Build 189 report.

Next 20 recommended steps after Build 189:

1. Replace placeholder graphics with approved real compressed photos, starting with homepage, shop, custom gifts, jewelry, and gallery.
2. Import the first Search Console export and connect real clicks/impressions to Local SEO scorecards.
3. Add manual Google Business Profile observation notes monthly for important pages and products.
4. Add product material/labour/package cost defaults for major product families.
5. Add customer/member timeline cards that combine orders, custom requests, gift cards, recalls, proof approvals, and notes.
6. Add a phone-tested Mobile Quick Add recovery checklist with screenshots from a real device.
7. Connect approved customer stories directly into product cards and local landing trust blocks.
8. Add a product margin warning before marketplace export when estimated margin is too low.
9. Add a simple dashboard for real media waiting on consent/public-use review.
10. Add product-detail visual proof modules that show process, scale, material, and care notes.
11. Add admin command-center saved views for Owner, Product, SEO, Accounting, and Deploy mode.
12. Add a low-bandwidth preview toggle to more public pages.
13. Add image compression reports for all public placeholder replacement candidates.
14. Add “missing real photo” badges on Product Readiness rows.
15. Add conversion funnel date filters and source/UTM filters.
16. Add cart recovery/customer follow-up review rows before emailing anyone.
17. Add Search Console opportunity buttons that create title/meta/internal-link actions.
18. Add a customer story approval screen grouped by source product/order/custom request.
19. Add performance-budget badges directly beside visual placeholder candidates.
20. Retire or archive duplicate Markdown once `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md` stay complete for two more build passes.

