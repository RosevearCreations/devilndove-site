# Build 273 Changed Files

Build 273 is a code/documentation-only Creative Process → CAIP → Content Studio consolidation release. It adds **no D1 migration**; Build 269 remains the focused CAIP schema boundary.

## Runtime / UI

- `functions/api/admin/creative-process.js` — Build 273 output-media context; draft standalone Content Studio handoff allowed without duplicating the project.
- `public/js/admin-creative-process.js` — type-searchable Inventory selectors and CAIP/Content-Studio-aware Automatic Output Blueprint.
- `functions/api/admin/content-studio.js` — direct existing Creative Process project selection / `creative_project_id` resolution and standalone package creation.
- `functions/api/_lib/contentAutomationStudio.js` — existing CAIP attachment, private CAIP media archive references, standalone project-journal deliverable wording, no default GBP pack for unrelated standalone projects.
- `public/js/admin-content-studio.js` — separate searchable Creative Process project selector and package workflow.
- `admin/creative-process/index.html` — Build 273 JS cache key.
- `admin/content-studio/index.html` — Build 273 JS cache key.
- `css/styles.css` — searchable Inventory, output context, project bridge, long-content overflow and mobile layout hardening.

## Tests

- `scripts/build273_caip_workflow_consolidation_test.mjs`

## Current-authority / specialist Markdown

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `RELEASE_NOTES.md`
- `CREATIVE_AUTOMATION_STUDIO.md`
- `CONTENT_AUTOMATION_STUDIO.md`
- `docs/creative-asset-intelligence-platform/README.md`
- `docs/creative-asset-intelligence-platform/10_Delivery_Roadmap.md`
- `docs/creative-asset-intelligence-platform/18_Operator_Workflow_Guide.md`

Historical Build files remain evidence only and were not deleted merely to reduce Markdown count.
