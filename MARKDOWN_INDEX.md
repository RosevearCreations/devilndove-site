# Devil n Dove Markdown Index — Build 198

## Canonical first-read files

1. `PROJECT_STATUS_AND_ROADMAP.md` — business priorities, completed work, limits, test order, and release opinion.
2. `AI_HANDOFF.md` — technical state, migration order, operational rules, and next-AI continuation notes.

These two files define the current project direction. Update them each build.

## Active runbooks and references

- `POST_DEPLOY_SMOKE_TEST.md` — deployment checks for Build 198: inventory PATCH editing, first-image recovery, approval media preservation, and earlier 503 safeguards.
- `SANITY_HEALTH_CHECK.md` — local validation evidence and live-only limits.
- `LIVE_TESTING_GUIDE.md` — R2, Stripe, email, Search Console, GBP, and real-device checks.
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md` — bindings, encrypted variables, and safe handling of secrets.
- `DATABASE_SCHEMA_REFERENCE.md` — schema/migration orientation; `database_full_schema.sql` is the fresh database source.
- `BUILD194_TESTING_GUIDE.md` — storefront, product facts, media roles, Workshop Journal, and SEO checks.
- `BUILD195_PRODUCT_LIFECYCLE_INVENTORY_GUIDE.md` — system number, SKU, archive/delete, and inventory rules.
- `BUILD196_PRODUCT_CORRECTION_MATERIAL_RETURN_GUIDE.md` — correction preview, reservation release, physical return, and product-deletion limits.
- `IMAGES.md` — consent, image roles, alt text, visual QA, and placeholders.
- `LOCAL_SEO_PLAYBOOK.md` — local-search evidence process.
- `COMPETITIVE.md` — market/reference research.
- `RELEASE_NOTES.md` — release history.

## Pointer and retained specialist files

- `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `AI_CONTEXT.md`, and `NEW_CHAT_STATUS.md` point to the canonical pair.
- `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`, and database extension files remain specialist references.
- Historical planning stays in `docs/archive/`; do not revive an old task only because it appears in an archived file.

## Consolidation rule

Do not delete useful context merely to reduce file count. Keep these two canonical files current, preserve narrow specialist runbooks, and turn superseded general planning files into pointers or archive entries. Avoid creating a new general roadmap markdown.

## Build 198 additions

- `database_build198_inventory_editor_featured_media_integrity.sql` — safe rerunnable D1 migration that fills only blank featured image fields from retained first media and adds a supporting index.
- Build 198 details are consolidated in the canonical pair, smoke test, sanity check, and release notes; specialist Markdown remains retained.

## Build 197 additions

- `database_build197_application_resilience_media_catalog.sql` — safe rerunnable D1 migration for media audit/indexes and Build 197 ledger.
- Build 197 details are consolidated into the canonical pair, smoke test, sanity check, and release notes instead of a new permanent general-purpose guide.
