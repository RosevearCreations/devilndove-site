# Devil n Dove Markdown Index — Build 240

## Two current authorities

1. `AI_HANDOFF.md` — architecture, data authority, safety, schema boundary and deployment.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed work, current risks and the ordered next twenty actions.

A new AI/chat reads these two first. No other Markdown file may override them.

## Current release evidence

- `BUILD240_CHANGED_FILES.md`
- `BUILD240_VALIDATION.md`
- `OPERATIONAL_CONTINUITY_BUILD240.md`
- `RELEASE_NOTES.md`
- `SANITY_HEALTH_CHECK.md`
- `data/site/build240-public-page-audit.json`
- `data/site/deployment-preflight.json`

## Current database boundary

- `database_build240_operational_evidence_continuity.sql`
- byte-identical `database_upgrade_current_pass.sql`
- synchronized `database_schema.sql`, `database_full_schema.sql`, and `database_store_schema.sql`

Apply the numbered Build 240 migration or the current-pass file once after a D1 backup, never both.

## Active specialist playbooks

- Launch/release: `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `LIVE_TESTING_GUIDE.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.
- Operations/evidence: `OPERATIONAL_CONTINUITY_BUILD240.md` and `/admin/operational-continuity/`.
- Creative/content: `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md` and scoped CAIP documentation.
- Packaging: `PACKAGING_STUDIO.md`, `PACKAGING_REFERENCE_BASELINE.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` and adopted source files under `docs/packaging/source-references/`.
- Visuals: `IMAGES_REQUIRED.md`, `GENERATED_VISUAL_ASSET_REGISTER.md`, `IMAGES.md` and D1 `/admin/image-manifest/`.
- SEO/market: `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- Data/operations: `DATABASE_SCHEMA_REFERENCE.md`, `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`.

## Compatibility pointers

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` point to the two current authorities. They are not independent roadmaps.

## Historical evidence

Superseded Build release notes and validations live under `docs/archive/build-history/`. Numbered SQL migrations remain at the repository root because deployment and repair tooling addresses them by exact filename. Historical files preserve evidence but cannot override Build 240 instructions.
