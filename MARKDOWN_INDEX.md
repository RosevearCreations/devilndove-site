# Devil n Dove Markdown Index — Build 201

## Read these two first

1. `PROJECT_STATUS_AND_ROADMAP.md` — current business direction, completed work, non-negotiable public-content guardrails, and ordered next priorities.
2. `AI_HANDOFF.md` — build/migration order, exact CAIP routes/files, operating rules, known limits, and continuation instructions.

They are the **only canonical cross-project planning documents**. Do not create another general roadmap, backlog, or new-chat-status file without updating these two files first.

## Authoritative CAIP subsystem specification

`docs/creative-asset-intelligence-platform/README.md` is the authoritative detailed specification for the Creative Asset Intelligence Platform. Read it after the two canonical planning files whenever a task touches CAIP, source media, evidence, asset rights, story intelligence, rendering, publishing adapters, provider integrations, storage, or governance.

The active CAIP specification includes:

- `00_Project_Charter.md` through `12_Testing_and_Acceptance.md`
- `10_Delivery_Roadmap.md` — completed Build 201 twenty-step foundation plus not-yet-completed next wave
- `11_Migration_and_Compatibility.md` — non-destructive migration/rollback boundaries
- `12_Testing_and_Acceptance.md` — deploy and acceptance evidence

## Active operating references

- `POST_DEPLOY_SMOKE_TEST.md` — required deployed proof steps for Builds 197–201.
- `CONTENT_AUTOMATION_STUDIO.md` — source archive/content package/CAIP/release-board operating guide.
- `DATABASE_SCHEMA_REFERENCE.md` — migration/schema orientation; `database_full_schema.sql` is the fresh-install source.
- `LOCAL_SEO_PLAYBOOK.md` — truthful local/discovery/image/structured-data evidence checks and official references.
- `SANITY_HEALTH_CHECK.md` — latest local validation evidence and live-only caveats.
- `RELEASE_NOTES.md` — concise release history.

## Retired planning/reference files

The following documents are retained for specialist/history context but are **not current direction** and must not override the canonical pair or CAIP specification: `AI_CONTEXT.md`, `AMAZON_MATCHING_NOTES.md`, `BUILD194_TESTING_GUIDE.md`, `BUILD195_PRODUCT_LIFECYCLE_INVENTORY_GUIDE.md`, `BUILD196_PRODUCT_CORRECTION_MATERIAL_RETURN_GUIDE.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`, `COMPETITIVE.md`, `DEVELOPMENT_ROADMAP.md`, `IMAGES.md`, `KNOWN_GAPS_AND_RISKS.md`, `LIVE_TESTING_GUIDE.md`, `NEW_CHAT_STATUS.md`, `README.md`, `REPO_BASE_GUIDE.md`, and `REPO_RULES.md`.

Historical detailed planning belongs in `docs/archive/`. Do not revive a task merely because it appears in an older guide or release list.

## Build 201 additions

- `database_build201_creative_asset_intelligence_platform.sql`
- `functions/api/_lib/creativeAssetIntelligence.js`
- `/admin/creative-assets/` and `/api/admin/creative-assets`
- `public/js/admin-creative-assets.js`
- `assets/visual-placeholders/creative-asset-intelligence.svg`
- `docs/creative-asset-intelligence-platform/` expanded from seed notes into the authoritative enterprise design specification

## Consolidation rule

Preserve implementation evidence, but add general status/roadmap decisions only to the two canonical files. Keep CAIP-specific architecture/governance/contracts in its single authoritative CAIP folder. Narrow runbooks should remain narrow. This keeps a future chat oriented without duplicated or contradictory plans.
