// File: /functions/api/admin/safe-deploy-package.js
// Brief description: Admin-only safe deploy package summary with schema order, changed files, manifest links, and post-deploy action checklist.

import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const changedFiles = [
  'DEVELOPMENT_ROADMAP.md',
  'KNOWN_GAPS_AND_RISKS.md',
  'DATABASE_SCHEMA_REFERENCE.md',
  'RELEASE_NOTES.md',
  'SANITY_HEALTH_CHECK.md',
  'POST_DEPLOY_SMOKE_TEST.md',
  'NEW_CHAT_STATUS.md',
  'admin/deployment-preflight/index.html',
  'admin/index.html',
  'admin/safe-deploy-package/index.html',
  'css/styles.css',
  'data/site/deployment-preflight.json',
  'data/site/release-notes.json',
  'data/site/release-package-manifest.json',
  'database_build174_deployment_preflight_detail.sql',
  'database_full_schema.sql',
  'database_schema.sql',
  'database_store_schema.sql',
  'database_upgrade_current_pass.sql',
  'functions/api/admin/dashboard-summary.js',
  'functions/api/admin/db-sanity.js',
  'functions/api/admin/deployment-preflight.js',
  'functions/api/admin/migration-ledger.js',
  'functions/api/admin/safe-deploy-package.js',
  'functions/api/admin/schema-drift-report.js',
  'public/js/admin-dashboard-preflight-badge.js',
  'public/js/admin-deployment-preflight.js',
  'public/js/admin-safe-deploy-package.js',
  'scripts/deployment_preflight_static_check.py',
  'scripts/generate_release_manifest.py',
  'scripts/generate_release_notes.py',
  'scripts/regenerate_sanity_from_preflight.py',
  'data/site/local-business-schema.json',
  'database_build175_release_control.sql',
  'functions/api/admin/release-control.js',
  'public/js/admin-release-control.js',
  'admin/release-control/index.html'
];

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  return jsonResponse({
    ok: true,
    package: {
      build_label: 'Build 175 release control, deeper preflight, and local business schema',
      schema: [
        'Fresh D1: run database_upgrade_current_pass.sql, then database_build173_deployment_preflight.sql, then database_build174_deployment_preflight_detail.sql, then database_build175_release_control.sql.',
        'Partial D1 with Build 171 tables but missing marker: run database_build171_ledger_repair.sql only, then Build 173, then Build 174, then Build 175.',
        'Do not rerun ALTER TABLE-heavy SQL blocks on a database where those columns already exist.'
      ],
      sql_copy_blocks: {
        fresh_install: [
          'database_upgrade_current_pass.sql',
          'database_build173_deployment_preflight.sql',
          'database_build174_deployment_preflight_detail.sql',
          'database_build175_release_control.sql'
        ],
        repair_only: [
          'database_build171_ledger_repair.sql',
          'database_build173_deployment_preflight.sql',
          'database_build174_deployment_preflight_detail.sql',
          'database_build175_release_control.sql'
        ]
      },
      changed_files: changedFiles,
      manifest: '/data/site/release-package-manifest.json',
      post_deploy_actions: [
        'Open /admin/deployment-preflight/ and run Preflight after D1 migration.',
        'Export the Preflight Markdown handoff if any warning needs support review.',
        'Save a Preflight snapshot and mark post-deploy confirmation rows as complete after smoke testing.',
        'Open /admin/post-deploy-smoke-tests/ and run core public/admin URL checks.',
        'Open /admin/release-control/ to record deployment history, queue screenshot jobs, seed mobile views, and review LocalBusiness JSON.',
        'Open /admin/r2-derivative-settings/ or the R2 derivative settings panel and run the live health test if R2 is enabled.',
        'Review RELEASE_NOTES.md and SANITY_HEALTH_CHECK.md before promoting the branch.'
      ]
    }
  }, 200, { 'Cache-Control': 'no-store' });
}
