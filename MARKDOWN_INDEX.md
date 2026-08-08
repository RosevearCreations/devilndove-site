# Devil n Dove Markdown Index — Build 242

## Two current authorities

1. `AI_HANDOFF.md` — architecture, data authority, safety, schema boundary and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed work, current risks and ordered next steps.

A new AI/chat reads these two first. No other Markdown file overrides them.

## Current release pair

- `BUILD242_CHANGED_FILES.md`
- `BUILD242_VALIDATION.md`

## Active specialist playbooks

- **CAIP:** `docs/creative-asset-intelligence-platform/README.md` and especially `16_Private_Raw_Media_Intake.md`.
- **Creative/content:** `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md`.
- **Packaging:** `PACKAGING_STUDIO.md`, `PACKAGING_REFERENCE_BASELINE.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`.
- **Launch/release:** `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `LIVE_TESTING_GUIDE.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.
- **Visuals:** `IMAGES_REQUIRED.md`, `GENERATED_VISUAL_ASSET_REGISTER.md`, `IMAGES.md`, plus D1 `/admin/image-manifest/` for mutable status/evidence.
- **SEO/market:** `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- **Data/operations:** `DATABASE_SCHEMA_REFERENCE.md`, `OPERATIONAL_CONTINUITY_BUILD240.md`, `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`.

## Current schema boundary

Build 242 is code-only. `database_build241_caip_large_media_intake.sql` remains the current D1 migration boundary and is byte-identical to `database_upgrade_current_pass.sql`. The three aggregate schema files are marked/synchronized for Build 242 without introducing a new D1 migration.

## Compatibility pointers

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` are short pointers to the two canonical files; they must not grow independent roadmaps.

## Historical evidence

Superseded Build changed-file/validation/test-guide Markdown belongs in `docs/archive/build-history/`. Numbered SQL migrations remain at root for deployment/repair tooling.
