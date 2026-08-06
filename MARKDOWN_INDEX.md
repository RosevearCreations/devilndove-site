# Devil n Dove Markdown Index — Build 236

## Two current authorities

1. `AI_HANDOFF.md` — architecture, data authority, safety, schema boundary and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed work, launch position, risks and ordered next steps.

A new AI/chat reads these two first. No other Markdown file may override them.

## Active specialist playbooks

- Launch/release: `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `LIVE_TESTING_GUIDE.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.
- Creative/content: `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md` and the scoped CAIP documentation.
- Packaging: `PACKAGING_STUDIO.md`, `PACKAGING_REFERENCE_BASELINE.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` and adopted source files under `docs/packaging/source-references/`.
- Visuals: `IMAGES_REQUIRED.md`, `GENERATED_VISUAL_ASSET_REGISTER.md`, `IMAGES.md` and D1 `/admin/image-manifest/` for mutable status/evidence.
- SEO/market: `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- Data/operations: `DATABASE_SCHEMA_REFERENCE.md`, `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`.

## Current release files

- `BUILD236_CHANGED_FILES.md`
- `BUILD236_VALIDATION.md`
- `RELEASE_NOTES.md`
- `SANITY_HEALTH_CHECK.md`
- `data/site/release-package-manifest.json`
- `database_build234_packaging_templates_creative_cleanup.sql` and identical `database_upgrade_current_pass.sql` remain the current schema boundary because Build 235 is code-only.

## Retired pointers

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` point to the two current authorities. They are compatibility entry points, not competing roadmaps.

## Historical evidence

Forty-seven superseded Build guides, validations and changed-file records were moved to `docs/archive/build-history/`, whose `README.md` explains the policy. They retain original labels for traceability but cannot override current instructions. Numbered SQL migrations remain at the repository root because deployment/repair tooling addresses them by exact filename.

This is the Markdown sanity rule: two cross-project authorities, narrowly scoped specialist guides, one current release pair and one clearly separated historical archive.
