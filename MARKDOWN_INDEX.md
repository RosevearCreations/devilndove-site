# Devil n Dove Markdown Index — Build 253

## Two current authorities

1. `AI_HANDOFF.md` — architecture, data authority, product/project/inventory/CAIP/packaging safety, schema and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed Build 253 work, known risks and the ordered next actions.

A new AI/chat reads these two first. No other Markdown file overrides them.

## Current release pair

- `BUILD253_CHANGED_FILES.md`
- `BUILD253_VALIDATION.md`
- no D1 migration is required for Build 253; Build 250 remains the current database migration boundary

## Active specialist playbooks

- CAIP: `docs/creative-asset-intelligence-platform/README.md`, especially private raw-media intake.
- Creative/content: `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md`.
- Packaging: `PACKAGING_STUDIO.md`, `PACKAGING_REFERENCE_BASELINE.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`.
- Launch/release: `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `LIVE_TESTING_GUIDE.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.
- Visuals/product media: `IMAGES_REQUIRED.md`, `GENERATED_VISUAL_ASSET_REGISTER.md`, `IMAGES.md`, D1 Product Media + `/admin/image-manifest/`.
- SEO/market: `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- Data/operations: `DATABASE_SCHEMA_REFERENCE.md`, `OPERATIONAL_CONTINUITY_BUILD240.md`, `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`.

## Compatibility pointers

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` intentionally point to the two current authorities rather than duplicating mutable roadmap content.

## Root cleanup in Build 249

Superseded `BUILD*.md` files are no longer duplicated at the repository root. Their preserved copies live under `docs/archive/build-history/`. Current release evidence stays at root only for the active Build.

## Historical rule

Superseded Build release notes/changed-files/validation/verification records belong under `docs/archive/build-history/`. Fixed specialist source/reference documents may retain an older Build label when that label identifies the specialist design authority rather than current application state.
