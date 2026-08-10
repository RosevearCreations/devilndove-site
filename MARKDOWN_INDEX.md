# Devil n Dove Markdown Index — Build 245

## Two current authorities

1. `AI_HANDOFF.md` — architecture, D1/JSON authority, auth/fallback, product-media integrity, schema and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed Build 245 work, current risks and next 20 ordered actions.

A new AI/chat reads these two first. No other Markdown file overrides them.

## Current release pair

- `BUILD245_CHANGED_FILES.md`
- `BUILD245_VALIDATION.md`
- read-only production SQL check: `BUILD245_D1_VERIFICATION.sql`

## Active specialist playbooks

- CAIP: `docs/creative-asset-intelligence-platform/README.md`, especially `16_Private_Raw_Media_Intake.md`.
- Creative/content: `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md`.
- Packaging: `PACKAGING_STUDIO.md`, `PACKAGING_REFERENCE_BASELINE.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`.
- Launch/release: `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `LIVE_TESTING_GUIDE.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.
- Visuals/product media: `IMAGES_REQUIRED.md`, `GENERATED_VISUAL_ASSET_REGISTER.md`, `IMAGES.md`, D1 Product Media + `/admin/image-manifest/`.
- SEO/market: `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- Data/operations: `DATABASE_SCHEMA_REFERENCE.md`, `OPERATIONAL_CONTINUITY_BUILD240.md`, `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`.
- Auth troubleshooting: `AUTH_LOGIN_500_TROUBLESHOOTING.md`.

## Current schema boundary

Build 245 is current. `database_build245_admin_media_resilience.sql` is byte-identical to `database_upgrade_current_pass.sql` and includes the Build 244 inventory-authority/fractional transition for direct upgrade from a Build 243-era production database. The complete aggregate `database_full_schema.sql` contains the executable current block. Scoped historical aggregates carry Build 245-safe definitions/settings without claiming tables outside their scope.

## Compatibility pointers

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` intentionally remain short pointers to the two canonical files.

## Historical evidence

Superseded `BUILD*.md` changed-file/validation records and visual-audit Build prose belong under `docs/archive/build-history/` and are frozen evidence. Numbered SQL migrations remain at repository root because deployment/repair tooling uses their exact filenames. Specialist source/reference documents keep their own historical Build labels when those labels describe the version of that specialist authority rather than the current application build.
