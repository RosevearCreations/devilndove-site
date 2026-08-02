// File: /functions/api/admin/release-notes.js
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const notes = {
  build_label: 'Build 230 — Visual Image Manifest and Editorial Enrichment',
  generated_at: '2026-08-01T21:30:00-04:00',
  source: '/data/site/release-notes.json',
  summary: [
    'Added a visual D1 manifest for 20 static/dynamic image requirements with owner, rights, public-use, URL, alternative text and phone/desktop evidence.',
    'Added approval validation, history/audit/runtime incidents and a complete read-only Unsynced fallback.',
    'Generated three disclosed editorial illustrations plus responsive derivatives for home, general jewelry and gift cards.',
    'Preserved prompts, hashes and prohibited uses so generated art cannot be mistaken for real product/process/condition proof.',
    'Expanded the missing_launch_images Startup gate to 12 detailed steps while preserving all 43 gate keys and the full fallback.',
    'Synchronized the D1-safe Build 230 schema and refreshed responsive CSS, one-H1, SEO, current handoff, smoke and release documentation.'
  ],
  changed_files: [
    'admin/image-manifest/index.html',
    'functions/api/admin/image-manifest.js',
    'public/js/admin-image-manifest.js',
    'assets/generated/editorial/',
    'index.html',
    'handmade-jewelry-ontario/index.html',
    'gift-cards/index.html',
    'css/styles.css',
    'functions/api/admin/startup-readiness.js',
    'public/js/admin-startup-readiness.js',
    'database_build230_visual_image_manifest.sql',
    'database_full_schema.sql',
    'database_schema.sql',
    'database_store_schema.sql',
    'database_upgrade_current_pass.sql',
    'IMAGES_REQUIRED.md',
    'GENERATED_VISUAL_ASSET_REGISTER.md',
    'AI_HANDOFF.md',
    'PROJECT_STATUS_AND_ROADMAP.md',
    'STARTUP_GO_LIVE_GUIDE.md',
    'data/site/release-notes.json'
  ],
  d1_migrations: [
    'image_manifest_items',
    'image_manifest_history',
    '20 active requirement rows and Build 230 migration ledger entry'
  ]
};

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  return jsonResponse({ ok: true, release_notes: notes }, 200, { 'Cache-Control': 'no-store' });
}
