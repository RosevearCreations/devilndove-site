// File: /functions/api/admin/release-notes.js
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const notes = {
  build_label: 'Build 228 — Creative Automation and Prelaunch Operations',
  generated_at: '2026-08-01T16:30:00-04:00',
  source: '/data/site/release-notes.json',
  summary: [
    'Added one seven-stage Creative Automation master workflow while preserving Creative Process, CAIP, Content Studio, Social Publishing and Release Board specialist authorities.',
    'Added separate Prelaunch, Deployment Preflight, Post-Deploy Smoke, Deploy Readiness, Go-Live and Live Ops operator surfaces and playbooks.',
    'Preserved all 37 prior Startup gates, added five standalone process gates and strengthened the complete 42-gate fallback.',
    'Added D1-safe schema checks that reject explicit SQL transaction statements and require current/numbered Build 228 migrations to match.',
    'Added responsive master/prelaunch layouts, honest fallback paths, runtime incident handling and refreshed SEO/one-H1 checks.',
    'Consolidated current project memory into two canonical Markdown authorities with scoped specialist playbooks and historical evidence retirement.'
  ],
  changed_files: [
    'admin/creative-automation/index.html',
    'admin/prelaunch/index.html',
    'functions/api/admin/creative-automation.js',
    'public/js/admin-creative-automation.js',
    'public/js/admin-prelaunch-hub.js',
    'css/styles.css',
    'functions/api/admin/startup-readiness.js',
    'public/js/admin-startup-readiness.js',
    'database_build228_creative_automation_prelaunch_stages.sql',
    'database_full_schema.sql',
    'database_schema.sql',
    'database_store_schema.sql',
    'database_upgrade_current_pass.sql',
    'CREATIVE_AUTOMATION_STUDIO.md',
    'PRELAUNCH_PROCESS_PLAYBOOKS.md',
    'AI_HANDOFF.md',
    'PROJECT_STATUS_AND_ROADMAP.md',
    'STARTUP_GO_LIVE_GUIDE.md',
    'data/site/release-notes.json'
  ],
  d1_migrations: [
    'creative_automation_workflows',
    'creative_automation_stage_reviews',
    'creative_automation_events',
    'Build 228 migration ledger entry'
  ]
};

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  return jsonResponse({ ok: true, release_notes: notes }, 200, { 'Cache-Control': 'no-store' });
}
