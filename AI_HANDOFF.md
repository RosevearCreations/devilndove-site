# Devil n Dove AI Handoff — Build 186

Use this file first when opening a new AI chat or handing the repository to another assistant.

## Current build

Build 186: Markdown consolidation, value-backlog tracking, visual graphic placeholders, desktop/mobile sanity rows, and CSS drift review rows.

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
