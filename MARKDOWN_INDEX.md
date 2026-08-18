# Devil n Dove Markdown Index — Build 273

## Only two mutable current authorities

1. `AI_HANDOFF.md` — architecture, data authority, safety, schema/migration boundaries and continuity rules.
2. `PROJECT_STATUS_AND_ROADMAP.md` — current release status, known risks and ordered next work.

**New AI/chat rule:** read those two first. No Build validation note, specialist design document, archived roadmap, or compatibility filename may override them.

## Specialist references (read when the task needs them)

- CAIP: `docs/creative-asset-intelligence-platform/README.md`, `10_Delivery_Roadmap.md`, `18_Operator_Workflow_Guide.md`.
- Creative/content: `CREATIVE_AUTOMATION_STUDIO.md`, `CONTENT_AUTOMATION_STUDIO.md`.
- Media management: `docs/media-content/DEVIL_N_DOVE_MEDIA_CONTENT_MANAGEMENT_STUDIO.md`.
- Packaging: `PACKAGING_STUDIO.md`, `PACKAGING_REFERENCE_BASELINE.md`, `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`.
- Launch/release: `STARTUP_GO_LIVE_GUIDE.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md`, `LIVE_TESTING_GUIDE.md`, `POST_DEPLOY_SMOKE_TEST.md`, `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.
- SEO/market: `LOCAL_SEO_PLAYBOOK.md`, `COMPETITIVE.md`.
- Data/operations: `DATABASE_SCHEMA_REFERENCE.md`, `OPERATIONAL_CONTINUITY_BUILD240.md`, `REPO_RULES.md`, `REPO_BASE_GUIDE.md`.

## Retired / historical material

- `BUILD*.md`, `BUILD*_D1_VERIFICATION.sql` and similar release artifacts are **evidence for that build only**. They are not current project direction after a newer build exists.
- `docs/archive/build-history/` is historical evidence.
- `AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` are compatibility pointers only.
- Specialist CAIP documents preserve detailed design/rationale; their “next work” sections defer to the two current authorities whenever they conflict.

## Current migration boundary

- Broad retained migration: Build 264 `database_upgrade_current_pass.sql`.
- Focused CAIP schema after it: Build 269 `database_build269_caip_social_project_dedupe_integrity.sql`.
- Builds 270–273 add no D1 schema.
