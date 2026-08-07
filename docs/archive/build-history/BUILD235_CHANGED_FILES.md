# Build 235 Changed Files

Build 235 is a code-only Creative Automation stabilization and Markdown-authority consolidation pass. It adds no D1 migration.

## Creative Automation runtime

- `functions/api/admin/creative-automation.js`
  - server-computed readiness for seven stages using bounded specialist-source aggregates
  - blocked/overdue/due-soon/unassigned work queue
  - authenticated JSON and accessible HTML evidence packets
  - corrected publication counting through `content_status`
  - retained human review, incident capture and guarded duplicate deletion
- `public/js/admin-creative-automation.js`
  - eight metrics, priority queue, readiness checklists and safe authenticated exports
  - retry/degraded handling and contained phone/desktop controls
- `admin/creative-automation/index.html`
  - Build 235 explanatory copy, one H1, noindex metadata and v235 client asset
- `css/styles.css`
  - responsive queue/readiness/export layouts and semantic admin empty-state graphic
- `sw.js`
  - shell cache `devilndove-shell-v16`
- `scripts/build235_creative_readiness_test.mjs`
  - readiness, queue, publication, evidence packet, accessibility/layout and schema-boundary regression

## Current authority and specialist documentation

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `README.md`
- `MARKDOWN_INDEX.md`
- `CREATIVE_AUTOMATION_STUDIO.md`
- `SANITY_HEALTH_CHECK.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`
- `IMAGES_REQUIRED.md`
- `COMPETITIVE.md`
- `LOCAL_SEO_PLAYBOOK.md`
- `RELEASE_NOTES.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`

## Release metadata and checks

- `data/site/release-notes.json`
- `data/site/deployment-preflight.json`
- `data/site/release-package-manifest.json`
- `scripts/deployment_preflight_static_check.py`
- `scripts/final_deployment_blocker_check.py`
- `scripts/generate_release_manifest.py`
- `BUILD235_VALIDATION.md`
- `BUILD235_CHANGED_FILES.md`

## Historical Markdown consolidation

Forty-seven Build-specific guides, validations, changed-file records and manifests formerly at the repository root were moved unchanged to:

- `docs/archive/build-history/`
- `docs/archive/build-history/README.md`

References in release/testing scripts, current guides and historical metadata now use the archive path. `BUILD234_VALIDATION.md` and `BUILD234_CHANGED_FILES.md` remain at root as the immediate schema/release predecessor.

## No schema change

These remain authoritative and byte-identical:

- `database_build234_packaging_templates_creative_cleanup.sql`
- `database_upgrade_current_pass.sql`

Build 235 creates no table, column, index, seed or migration-ledger row.
