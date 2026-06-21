# Devil n Dove AI Handoff — Build 193

Read this first in a new chat. Then read `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, and `LIVE_TESTING_GUIDE.md`.

## Current build

Build 193 adds two important integrations:

1. `/api/admin/live-readiness-playbook` and `public/js/admin-live-readiness-playbook.js`, shown inside `/admin/command-center/`. It provides detailed live-only testing steps, status recording, evidence URLs, runs, Markdown export, and usage telemetry.
2. `/api/admin/mobile-resumable-upload` and `public/js/admin-mobile-resumable-upload.js`, shown inside `/admin/mobile-product/`. It uses R2 multipart uploads so completed image chunks are not resent after a connection interruption.

## Primary routes

- `/admin/command-center/` — daily operations plus Build 190–193 integrated panels.
- `/admin/mobile-product/` — phone product draft capture and the Build 193 safer large-photo uploader.
- `/admin/products/` — desktop product editor.
- `/admin/local-seo-review/` — Search Console and local SEO review.
- `/admin/marketplace-exports/` — channel exports with margin gates.
- `/admin/visual-enrichment-studio/` — visual/media controls.
- `/admin/live-ops-followthrough/` — provider/R2/live configuration records.
- `/admin/post-deploy-smoke-tests/` — deployed checks.

## Important APIs

- `/api/auth/login` — must return JSON; root `_routes.json` must include `/api/*`.
- `/api/admin/value-ops` — Build 190 integrated values.
- `/api/admin/value-ops-followthrough` — Build 191 settings, approvals, imports, D1 draft and evidence workflows.
- `/api/admin/value-ops-next` — Build 192 schedules, readiness checks, GBP evidence, duplicate candidates, provider checks.
- `/api/admin/live-readiness-playbook` — Build 193 detailed test cases/runs/evidence.
- `/api/admin/mobile-resumable-upload` — Build 193 R2 multipart mobile image upload.
- `/api/before-after-gallery` — public read-only approved/consented gallery proof.
- `/api/admin/marketplace-export-preview` — marketplace CSV with margin enforcement.

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
database_build192_operational_data_connection.sql
database_build193_live_readiness_playbook.sql
```

Builds 187 and 188 were routing/environment hotfixes without D1 migrations.

## Key business rules

- One H1 maximum per exposed page.
- Never promise first-page or local-pack placement.
- Fee/cost defaults are not financial truth until owner-reviewed.
- Marketplace exports stay blocked for unhealthy/unknown margin unless a current reviewed override exists.
- Review eligibility is not permission to contact.
- Customer stories, gallery proof, and customer photographs require consent/public-use approval.
- Placeholders are layout scaffolding, not real proof.
- Mobile recovery stores fields; user must reselect image files after browser reload.
- Resumable image uploads require an R2 binding and an already-saved product draft.
- Environment views must never reveal secret values.
- Do not merge customer duplicates automatically.

## Live deployment/testing order

1. Apply `database_build193_live_readiness_playbook.sql` after Build 192.
2. Confirm `/api/auth/login` returns JSON.
3. Confirm `DB` and `PRODUCT_MEDIA_BUCKET` bindings in Cloudflare Pages.
4. Open `/admin/command-center/` and record the first cost/fee, marketplace, and local SEO checks.
5. Open `/admin/mobile-product/`; save/reopen a text-only draft, then test a non-sensitive resumable image.
6. Use `LIVE_TESTING_GUIDE.md` or the Command Center playbook for all live-only verification.
7. Run deployment preflight and smoke tests before promotion.

## Documentation policy

Canonical files:

1. `PROJECT_STATUS_AND_ROADMAP.md`
2. `AI_HANDOFF.md`

Supporting documents exist only for specialist detail. Historical context remains in `docs/archive/`.
