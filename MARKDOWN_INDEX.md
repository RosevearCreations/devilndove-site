# Devil n Dove Markdown Index — Build 199

## Canonical first-read files

1. `PROJECT_STATUS_AND_ROADMAP.md` — business priorities, completed work, limits, test order, and release opinion.
2. `AI_HANDOFF.md` — technical state, migration order, operational rules, and next-AI continuation notes.

These two files define current project direction. Update them each build.

## Active specialist runbooks and references

- `CONTENT_AUTOMATION_STUDIO.md` — Build 199 source archive, content package, review, output, and future renderer/publisher integration rules.
- `POST_DEPLOY_SMOKE_TEST.md` — Build 199 deployment checks, including automatic approved-product package creation and media integrity.
- `SANITY_HEALTH_CHECK.md` — local validation evidence and live-only limits.
- `LIVE_TESTING_GUIDE.md` — R2, Stripe, email, Search Console, GBP, and real-device checks.
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md` — bindings, encrypted variables, and safe handling of secrets.
- `DATABASE_SCHEMA_REFERENCE.md` — schema/migration orientation; `database_full_schema.sql` is the fresh database source.
- `IMAGES.md` — consent, image roles, content archive safety, alt text, visual QA, and placeholders.
- `LOCAL_SEO_PLAYBOOK.md` — local-search evidence process.
- `COMPETITIVE.md` — market/reference research.
- `RELEASE_NOTES.md` — release history.

## Pointer and retained specialist files

- `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `AI_CONTEXT.md`, and `NEW_CHAT_STATUS.md` point to the canonical pair.
- `REPO_RULES.md`, `REPO_BASE_GUIDE.md`, `AMAZON_MATCHING_NOTES.md`, and database extension files remain specialist references.
- Historical planning stays in `docs/archive/`; do not revive an old task only because it appears in an archived file.

## Consolidation rule

Do not delete useful context merely to reduce file count. Keep the canonical pair current, preserve narrow specialist runbooks, and turn superseded general planning files into pointers or archive entries. Avoid creating a new general roadmap Markdown.

## Build 199 additions

- `database_build199_content_automation_studio.sql` — safe rerunnable Content Automation Studio migration.
- `CONTENT_AUTOMATION_STUDIO.md` — the dedicated operating/implementation guide.
- Build 199 details are consolidated in the canonical pair, smoke test, sanity check, release notes, and schema reference.
