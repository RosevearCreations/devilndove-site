// File: /functions/api/admin/release-notes.js
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const notes = {
  build_label: 'Build 229 — Packaging References and Missing-Image Launch Gate',
  generated_at: '2026-08-01T18:45:00-04:00',
  source: '/data/site/release-notes.json',
  summary: [
    'Adopted the supplied soap-label specification, guide PDF and master SVG as a three-source packaging baseline with repository paths and SHA-256 values.',
    'Exposed the three source references in Labeling & Packaging and registered their provenance/dimensional scope in D1.',
    'Preserved all 42 prior Startup gates, added the distinct Critical missing_launch_images blocker and strengthened the complete 43-gate fallback.',
    'Documented the 25 mm supplied SVG seal, 38.1 mm artboard and 50 mm specification target as a physical-proof decision rather than silently changing the source.',
    'Added D1-safe schema checks that reject explicit SQL transaction statements and require current/numbered Build 229 migrations to match.',
    'Refreshed responsive Packaging/Startup layouts, image manifest, SEO/one-H1 checks and canonical handoff/playbook documentation.'
  ],
  changed_files: [
    'admin/packaging-studio/index.html',
    'admin/prelaunch/index.html',
    'functions/api/admin/packaging-studio.js',
    'public/js/admin-packaging-studio.js',
    'public/js/admin-prelaunch-hub.js',
    'css/styles.css',
    'functions/api/admin/startup-readiness.js',
    'public/js/admin-startup-readiness.js',
    'database_build229_packaging_reference_authority.sql',
    'database_full_schema.sql',
    'database_schema.sql',
    'database_store_schema.sql',
    'database_upgrade_current_pass.sql',
    'PACKAGING_REFERENCE_BASELINE.md',
    'PACKAGING_STUDIO.md',
    'PRELAUNCH_PROCESS_PLAYBOOKS.md',
    'AI_HANDOFF.md',
    'PROJECT_STATUS_AND_ROADMAP.md',
    'STARTUP_GO_LIVE_GUIDE.md',
    'data/site/release-notes.json'
  ],
  d1_migrations: [
    'packaging_reference_sources',
    'Three adopted source-reference rows',
    'Build 229 migration ledger entry'
  ]
};

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  return jsonResponse({ ok: true, release_notes: notes }, 200, { 'Cache-Control': 'no-store' });
}
