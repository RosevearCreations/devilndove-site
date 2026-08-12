-- Devil n Dove Build 254 — Startup Readiness / Post-Deploy Smoke runtime hardening.
-- Run after the Build 250 migration boundary. Builds 251–253 required no D1 migration.
-- Additive/idempotent. Back up D1 first.
PRAGMA foreign_keys = ON;

-- Request-time DDL was removed from /api/admin/post-deploy-smoke-tests.
CREATE TABLE IF NOT EXISTS post_deploy_smoke_test_results (
  post_deploy_smoke_test_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  page_url TEXT NOT NULL,
  check_kind TEXT NOT NULL DEFAULT 'manual',
  result_status TEXT NOT NULL DEFAULT 'pending',
  http_status INTEGER,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_post_deploy_smoke_results_recent
  ON post_deploy_smoke_test_results(checked_at DESC, post_deploy_smoke_test_result_id DESC);

-- Compact status/history reads used by Build 254 Startup Readiness.
CREATE INDEX IF NOT EXISTS idx_startup_readiness_active_key
  ON startup_readiness_items(is_active, item_key);
CREATE INDEX IF NOT EXISTS idx_startup_readiness_history_recent
  ON startup_readiness_history(startup_readiness_history_id DESC);

UPDATE startup_readiness_items
SET external_location='Current build archive, current schema/migration files, Cloudflare Pages Functions bundle, and PRELAUNCH_PROCESS_PLAYBOOKS.md',
    instructions_markdown='1. Open the Prelaunch Operations Map and confirm Deployment Preflight is stage 2, before Safe Deploy, live smoke tests, Deploy Readiness, and Go-Live Execution.
2. Run the current static predeploy/deployment checks, JavaScript syntax checks, retained product/media/inventory/packaging regressions, Build 254 Startup/Smoke runtime regression, aggregate-schema test, repeated-current-migration test, Startup 46-gate integrity check, image/packaging-reference checks, and the Pages Functions bundle check against the exact archive to deploy.
3. Confirm all public HTML pages have a viewport, distinctive title, useful meta description, one H1, crawlable canonical where applicable, valid structured data, and descriptive image alternative text.
4. Confirm CSS braces balance and review phone, tablet, laptop, and wide-desktop overflow for every changed interface.
5. Confirm database_upgrade_current_pass.sql is identical to the migration named by the current validation report and that the migration remains additive/idempotent.
6. Confirm AI_HANDOFF.md, PROJECT_STATUS_AND_ROADMAP.md, release notes, changed-files list and validation report identify the same current build and D1 migration boundary.
7. Save the exact archive name, SHA-256, check results and unresolved warnings. Do not proceed when any blocker remains.
8. If a check fails, correct the owning source file rather than editing only generated output; rerun the full preflight from the beginning.',
    pass_condition='The exact current build archive passes static, schema, syntax, CSS, one-H1, metadata, media, fallback, packaging-reference, documentation and Pages Functions checks with zero unresolved blocker.',
    updated_at=CURRENT_TIMESTAMP
WHERE item_key='deployment_preflight_standalone';

UPDATE startup_readiness_items
SET external_location='Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments',
    instructions_markdown='1. Open Cloudflare D1 and record the current Time Travel bookmark or approved recovery point before changing the schema.
2. Record the date, database name and safe recovery reference in the evidence notes.
3. Confirm the prior Build 250 migration boundary is already applied, then apply database_build254_startup_smoke_runtime_hardening.sql or the identical database_upgrade_current_pass.sql, but not both. Builds 251–253 required no D1 migration.
4. Confirm the migration ledger records Build 254 and the Startup Readiness and Post-Deploy Smoke storage tables/indexes are available.
5. Deploy the complete ZIP rather than selected files and record the Pages deployment URL/identifier.
6. Open Startup Readiness with All statuses and confirm all 46 gates load from the compact status API without losing browser-only recovery data.
7. Open Post-Deploy Smoke Tests and confirm stored results load without request-time schema creation.
8. Continue to the standalone Post-Deploy Smoke Tests; do not treat successful upload as a passed live deployment.
9. Stop and restore the previous deployment or D1 recovery point if any critical migration, Function, route or data-integrity error appears.',
    pass_condition='A recoverable D1 point exists, the Build 254 migration is applied once after the Build 250 boundary, the complete deployment is live, all 46 readiness gates load, smoke-test storage is reachable, and no migration, Function, route or data-integrity error remains.',
    updated_at=CURRENT_TIMESTAMP
WHERE item_key='backup_migrate_deploy';

UPDATE startup_readiness_items
SET external_location='Production domain, browser developer tools, Cloudflare Pages Functions logs, and POST_DEPLOY_SMOKE_TEST.md',
    instructions_markdown='1. Confirm the deployment ID and current build/migration evidence match the package that passed Deployment Preflight.
2. Open the production home, handmade-jewelry, gift-card, shop, one product detail, contact, policies, login and password-recovery pages while signed out; record HTTP and visual results.
3. Confirm the three generated WebP illustrations load at phone and desktop sizes, disclose editorial use, preserve one H1, and are absent from Product/Offer structured data and real-product galleries.
4. Sign in with an owner-controlled administrator and test Startup Readiness, Visual Image Manifest, Creative Automation Studio, Labeling & Packaging, Client Documents, Orders and the Prelaunch Operations Map.
5. In the manifest, filter open blockers, open a route, make one reversible review update, reload, and confirm database history. Test the API failure path and confirm the full 20-row Unsynced fallback remains visible with saving disabled.
6. Test safe public/API reads and confirm every failure returns structured JSON or a clearly labelled usable fallback rather than a blank page or false success.
7. At phone, tablet, laptop and wide-desktop widths, check navigation, image crops, cards, forms, tables, focus, touch targets, contrast and horizontal overflow on every changed route.
8. Confirm one H1/title/meta/canonical/structured-data behaviour on representative live public pages and verify no admin page is indexable.
9. Open Startup Readiness with All statuses, confirm 46 unique gates and locate the missing-launch-images Critical blocker.
10. Record every failed route, console error, incident ID, screenshot/evidence reference and correction owner. After any correction/redeploy, repeat all smoke checks.
11. Continue to Deploy Readiness only when every critical smoke result passes.',
    pass_condition='The exact production deployment passes all critical public, authentication, admin, API, fallback, mobile/desktop and SEO smoke checks with current evidence and no unresolved critical result.',
    updated_at=CURRENT_TIMESTAMP
WHERE item_key='post_deploy_smoke_standalone';

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.startup_readiness.runtime_contract','compact_status_v2_build254',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build254_startup_smoke_runtime_hardening',
  'database_build254_startup_smoke_runtime_hardening.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Moves post-deploy smoke schema creation out of request handlers, adds compact Startup Readiness status/history indexes, updates foundation deployment guidance, and records the compact status API runtime contract.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
