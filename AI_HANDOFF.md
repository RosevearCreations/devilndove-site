# Devil n Dove AI Handoff — Build 190

Use this file first when opening a new AI chat or handing the repository to another assistant. Then read `PROJECT_STATUS_AND_ROADMAP.md` and `MARKDOWN_INDEX.md`.

## Current build

Build 190 integrates the Build 189 dashboards into practical owner workflows: saved Command Center views, environment health, filtered conversion funnels, product margin/photo/stock warnings, customer timelines, Search Console/GBP actions, visual publication review, guarded cart recovery, seasonal campaigns, real asset optimization, and Markdown retirement.

## Primary admin routes

- `/admin/command-center/` — daily owner dashboard plus Build 190 value operations.
- `/admin/members/` — users, engagement, gift-card history, and unified customer/member timelines.
- `/admin/local-seo-review/` — landing-page review plus Search Console opportunities and GBP observations.
- `/admin/readiness/` — product publish readiness.
- `/admin/visual-enrichment-studio/` — approved media, placeholders, screenshots, alt text, and budgets.
- `/admin/deployment-preflight/` — static/live release checks.
- `/admin/post-deploy-smoke-tests/` — live URL verification.

## Important APIs

- `/api/admin/command-center` — existing Build 189 live summary and snapshots.
- `/api/admin/value-ops` — Build 190 integrated value operations.
- `/api/admin/local-seo-review` — local landing-page review rows.
- `/api/admin/search-console-import` — Search Console import groundwork.
- `/api/auth/login` — login route; `_routes.json` must include `/api/*`.

## Build 190 D1 migration

Run only missing migrations. Do not blindly rerun old non-idempotent `ALTER TABLE` migrations.

```text
database_build171_ledger_repair.sql only if Build 171 schema exists but the ledger marker is missing
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
```

Build 187 and Build 188 were routing/environment hotfixes and did not require a D1 migration.

## Documentation policy

Canonical files:

1. `PROJECT_STATUS_AND_ROADMAP.md` — current business/application state and next work.
2. `AI_HANDOFF.md` — technical handoff and deployment order.

Use `MARKDOWN_INDEX.md` to locate supporting references. Historical roadmap/gap/context files through Build 189 are under `docs/archive/`.

## SEO rules

- No more than one H1 per exposed page.
- Keep each page title and meta description specific and useful.
- Use natural customer language in headings/body/internal links; do not repeat location phrases unnaturally.
- Put high-quality images near relevant text and use descriptive alt text.
- Structured data must match visible content and real product/business facts.
- Local ranking cannot be guaranteed; website relevance must be paired with complete Google Business Profile information, reviews, photos, links, activity, and real customer proof.

## Visual/media rules

- Placeholders are layout scaffolding, not finished trust proof.
- Replace a placeholder only after consent/public-use review, descriptive alt text, compression, mobile crop review, and performance-budget review.
- Build 190 includes optimized display variants for shared logo/banner/collage assets while retaining originals for rollback/metadata compatibility.
- Product detail now has prepared process, scale, material, and care visual slots without adding a second H1.

## Customer/privacy rules

- Customer timelines are admin-only aggregations.
- Cart recovery is human-review only; no automatic sending from Build 190.
- Customer stories/public proof remain blocked until consent is approved.
- Recall, gift-card, accounting evidence, and private downloads retain their separate approval/security gates.

## Live checks after deployment

1. Run `database_build190_integrated_value_operations.sql` if missing.
2. Open `/api/auth/login` and confirm JSON, not homepage HTML.
3. Open `/admin/command-center/` and verify both the original Command Center and Build 190 integrated panels load.
4. Test funnel filters, customer timeline sync, GBP observation save, and SEO action creation.
5. Open `/admin/members/` and verify timeline cards.
6. Open `/admin/local-seo-review/` and verify GBP/Search Console helper rows.
7. Test product detail on desktop and phone widths.
8. Run `/admin/deployment-preflight/` and `/admin/post-deploy-smoke-tests/`.
9. Verify D1, R2, Stripe, email provider mode, and Cloudflare token status in the environment health panel.

## Immediate next priorities

Upload approved real photos, establish product-family cost defaults, import real Search Console data, perform monthly GBP observations, refine marketplace fee rules, and run a real-device mobile QA pass.
