# Devil n Dove Markdown Index — Build 244

## Two current authorities

1. `AI_HANDOFF.md` — architecture, D1/JSON authority, inventory/material-use rules, safety, schema and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed Build 244 work, current risks and next 20 ordered actions.

A new AI/chat reads these two first. No other Markdown file overrides them.

## Current release pair

- `BUILD244_CHANGED_FILES.md`
- `BUILD244_VALIDATION.md`

## Active specialist playbooks

- CAIP: `docs/creative-asset-intelligence-platform/README.md`, especially `16_Private_Raw_Media_Intake.md`.
- Creative/content: `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md`.
- Packaging: `PACKAGING_STUDIO.md`, `PACKAGING_REFERENCE_BASELINE.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`.
- Launch/release: `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `LIVE_TESTING_GUIDE.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.
- Visuals: `IMAGES_REQUIRED.md`, `GENERATED_VISUAL_ASSET_REGISTER.md`, `IMAGES.md`, plus D1 `/admin/image-manifest/` for mutable evidence.
- SEO/market: `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- Data/operations: `DATABASE_SCHEMA_REFERENCE.md`, `OPERATIONAL_CONTINUITY_BUILD240.md`, `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`.

## Current schema boundary

Build 244 is current. `database_build244_inventory_authority_fractional_usage.sql` is byte-identical to `database_upgrade_current_pass.sql`. The complete aggregate `database_full_schema.sql` contains the executable Build 244 block. Scoped historical aggregates identify the Build 244 boundary without pretending to own tables outside their scope.

## Compatibility pointers

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` intentionally remain short pointers to the two canonical files.

## Historical evidence

Superseded Build changed-file/validation Markdown belongs under `docs/archive/build-history/`. Numbered SQL migrations remain at root because deployment/repair tooling uses their exact filenames.
