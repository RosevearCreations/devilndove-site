# Devil n Dove AI Handoff — Build 191

Read this file first in a new chat. Then read `PROJECT_STATUS_AND_ROADMAP.md` and `MARKDOWN_INDEX.md`.

## Current build

Build 191 turns Build 190 review dashboards into working owner controls: configurable channel fees, family cost defaults, margin gates/overrides, private customer notes, customer-story output drafts, Search Console mapping previews, monthly GBP tasks, review eligibility, approved before/after galleries, image-role prompts, D1 mobile drafts, deployed performance evidence, responsive-image jobs, Owner Daily exports, campaign readiness, local freshness, real-device QA, and live-environment configuration checks.

## Primary admin routes

- `/admin/command-center/` — daily dashboard plus Build 190 and Build 191 integrated operations.
- `/admin/products/` — desktop product editor with image-role prompts.
- `/admin/mobile-product/` — phone capture with local + D1 field recovery.
- `/admin/members/` — member/customer views and existing timelines.
- `/admin/local-seo-review/` — local pages, Search Console, and GBP review.
- `/admin/marketplace-exports/` — exports now hard-blocked by margin/validation gates.
- `/admin/deployment-preflight/` — release checks.
- `/admin/post-deploy-smoke-tests/` — live verification.

## Important APIs

- `/api/admin/value-ops` — Build 190 funnel, readiness, customer, visual, SEO, and campaign summary; Build 191 now uses configured fee/cost settings.
- `/api/admin/value-ops-followthrough` — Build 191 settings, approvals, imports, D1 drafts, evidence, and owner summaries.
- `/api/before-after-gallery` — public read-only approved/consented gallery proof.
- `/api/admin/marketplace-export-preview` — CSV download now enforces margin gates.
- `/api/admin/search-console-import` — full Search Console import/action workflow.
- `/api/auth/login` — login; root `_routes.json` must include `/api/*`.

## D1 migration order

Run only missing migrations. Do not blindly rerun old non-idempotent migrations.

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
```

Builds 187 and 188 were routing/environment hotfixes without D1 migrations.

## Documentation policy

Canonical files:

1. `PROJECT_STATUS_AND_ROADMAP.md`
2. `AI_HANDOFF.md`

Use `MARKDOWN_INDEX.md` for supporting references. Historical roadmap/gap/context content remains in `docs/archive/`.

## Safety and business rules

- One H1 maximum per exposed public/admin page.
- Never claim guaranteed local ranking.
- Do not calculate automated margins from unreviewed fee/cost defaults.
- Marketplace downloads stay blocked for unhealthy/unknown margin unless an active approved override exists.
- Review eligibility is not permission to contact.
- Customer stories and gallery proof require consent and public-use approval.
- Placeholders are layout scaffolding, not real proof.
- Mobile D1 recovery stores form fields, not image file bytes.
- Environment checks do not reveal secret values.

## Live checks after deployment

1. Apply `database_build191_value_operations_followthrough.sql`.
2. Confirm `/api/auth/login` returns JSON.
3. Open `/admin/command-center/` and verify Build 190 and Build 191 panels.
4. Enter at least one reviewed channel fee and one family cost default.
5. Refresh Product Readiness and confirm fee/cost configuration affects margin status.
6. Test marketplace CSV blocking and a temporary approved override.
7. Test Search Console mapping preview with a real export sample.
8. Save a phone draft, reload another device/session, and verify D1 field recovery.
9. Add one approved consented gallery item and confirm `/api/before-after-gallery`.
10. Record mobile/desktop performance and real-device QA evidence.
11. Run environment verification, deployment preflight, and smoke tests.

## Immediate priorities

Enter real channel fees and product costs, upload approved real photos, test live Stripe/email/R2 connections, import real Search Console data, complete the first GBP monthly task cycle, and capture real-device screenshots.


## Build 192 — Operational data connection and live proof follow-through

Build 192 keeps the project moving toward real business usefulness instead of adding another disconnected admin page. The new work is integrated into `/admin/command-center/` through `/api/admin/value-ops-next` and `public/js/admin-value-ops-next.js`.

Completed in this pass:

1. Added fee/cost change-audit rows so actual Stripe/Etsy/PayPal/local fee changes can be recorded with a reason and effective date.
2. Added R2 derivative worker readiness checks for bindings, WebP, AVIF, srcset writeback, and cleanup.
3. Added resumable mobile upload session rows and draft-conflict review rows beyond browser-only autosave.
4. Added approved real-media replacement plan rows for key public placeholders.
5. Added scheduled Search Console import rows for monthly pages/queries, weekly top pages, and quarterly image-search review.
6. Added Google Business Profile evidence records for monthly observations, photos, reviews, posts, and local-page proof.
7. Added customer duplicate/merge candidate rows and a Command Center action to refresh duplicate email candidates.
8. Added live provider test records for Stripe, email, R2, and Cloudflare checks without exposing secret values.
9. Added Lighthouse/PageSpeed import schedules for mobile and desktop routes.
10. Added legacy admin usage and consolidation recommendation rows so older admin pages are not retired until real usage data supports it.
11. Added extra visual placeholders to business-relevant public pages that still lacked visual enrichment.
12. Updated schema, release, roadmap, handoff, SEO, image, sanity, and deployment documentation.

Current opinion: the app is now past the “add structure” stage. The next business value comes from entering real costs/fees, uploading approved photographs, importing live evidence, and using the Command Center daily.

### Build 192 D1 migration

Run after Build 191:

```text
database_build192_operational_data_connection.sql
```
