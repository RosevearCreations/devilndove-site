# Build 241 Changed Files

## CAIP private large-media intake
- `database_build241_caip_large_media_intake.sql`
- `database_upgrade_current_pass.sql`
- `database_schema.sql`
- `database_full_schema.sql`
- `database_store_schema.sql`
- `functions/api/_lib/caipMediaIntake.js`
- `functions/api/admin/caip-media-intake.js`
- `functions/api/admin/caip-media-upload-part.js`
- `functions/api/_lib/creativeAssetIntelligence.js`
- `functions/api/_lib/creativeAssetOperations.js`
- `functions/api/admin/creative-assets.js`
- `public/js/admin-caip-media-intake.js`
- `admin/creative-assets/index.html`
- `css/styles.css`
- `wrangler.toml`
- `sw.js`

## CAIP design rewrite / specialist documentation
- `docs/creative-asset-intelligence-platform/README.md`
- `docs/creative-asset-intelligence-platform/03_Storage_Architecture.md`
- `docs/creative-asset-intelligence-platform/04_Project_Ingestion_Pipeline.md`
- `docs/creative-asset-intelligence-platform/05_Governance_Rights_Privacy.md`
- `docs/creative-asset-intelligence-platform/08_API_Event_and_Manifest_Contracts.md`
- `docs/creative-asset-intelligence-platform/09_Operations_Reliability_and_Observability.md`
- `docs/creative-asset-intelligence-platform/10_Delivery_Roadmap.md`
- `docs/creative-asset-intelligence-platform/12_Testing_and_Acceptance.md`
- `docs/creative-asset-intelligence-platform/13_Media_Operations_Secure_Review.md`
- `docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md`
- `CREATIVE_AUTOMATION_STUDIO.md`
- `CONTENT_AUTOMATION_STUDIO.md`
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`
- `COMPETITIVE.md`
- `LOCAL_SEO_PLAYBOOK.md`

## Startup / Operational Continuity integration
- `functions/api/admin/startup-readiness.js`
- `public/js/admin-startup-readiness.js`
- `functions/api/admin/operational-continuity.js`
- `public/js/admin-operational-continuity.js`
- `admin/operational-continuity/index.html`

## Current authority / release documentation
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `MARKDOWN_INDEX.md`
- `README.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `SANITY_HEALTH_CHECK.md`
- `RELEASE_NOTES.md`
- `STARTUP_GO_LIVE_GUIDE.md`
- `PRELAUNCH_PROCESS_PLAYBOOKS.md`
- `POST_DEPLOY_SMOKE_TEST.md`
- `LIVE_TESTING_GUIDE.md`
- `BUILD241_CHANGED_FILES.md`
- `BUILD241_VALIDATION.md`

## Validation / synchronization tooling
- `scripts/sync-build241-aggregate-schema.mjs`
- `scripts/build241_caip_large_media_intake_test.mjs`
- `scripts/build241_public_page_audit.py`
- `scripts/build241_asset_reference_audit.py`
- `scripts/generate-startup-guide.mjs`
- `scripts/sync-startup-client-fallback.mjs`
- `scripts/deployment_preflight_static_check.py`
- `scripts/final_deployment_blocker_check.py`
- retained Startup regressions 226–230 updated for the current 46-gate authority
- retained regression expectations updated for current gate/cache/schema boundary
- `data/site/build241-public-page-audit.json`
- `data/site/build241-asset-reference-audit.json`
- `data/site/build241-validation-summary.json`
- `data/site/release-package-manifest.json`
- `scripts/generate_release_manifest.py`

## Markdown consolidation
Superseded root `BUILD*.md` files were retired into `docs/archive/build-history/`. The only Build-specific release pair kept at repository root is Build 241.
