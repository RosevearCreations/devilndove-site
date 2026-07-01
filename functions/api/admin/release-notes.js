// File: /functions/api/admin/release-notes.js
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const notes = {
  build_label: 'Build 199 — Content Automation Studio',
  generated_at: '2026-06-30T00:00:00-04:00',
  source: '/data/site/release-notes.json',
  summary: [
    'Added a review-first Content Automation Studio for approved finished products.',
    'Approved product workflows now prepare a structured source-media archive and exactly 1 YouTube, 3 Facebook, 5 Instagram Reel, and 5 TikTok production plans, plus website gallery, Google Business Profile photo, SEO, blog, thumbnail, and caption deliverables.',
    'Source media is reference-linked only: no product image, media asset, R2 object, or original video is moved, overwritten, or deleted by content-package preparation.',
    'Added a responsive admin workspace with media selection/safety review, editable content plans, protected copy refresh, JSON manifest export, and a gated handoff to the existing social review queue.',
    'Added direct-create and editor-transition triggers so an approved product gets the same content-package handoff regardless of where approval occurred.',
    'Preserved Build 197/198 media-integrity, featured-image, inventory-editing, storefront-card, mobile-navigation, and canonical Markdown protections.'
  ],
  changed_files: [
    'admin/content-studio/index.html',
    'public/js/admin-content-studio.js',
    'css/styles.css',
    'functions/api/_lib/contentAutomationStudio.js',
    'functions/api/admin/content-studio.js',
    'functions/api/admin/create-product.js',
    'functions/api/admin/update-product.js',
    'functions/api/admin/product-review-actions.js',
    'database_build199_content_automation_studio.sql',
    'database_full_schema.sql',
    'database_schema.sql',
    'database_store_schema.sql',
    'database_upgrade_current_pass.sql',
    'CONTENT_AUTOMATION_STUDIO.md',
    'AI_HANDOFF.md',
    'PROJECT_STATUS_AND_ROADMAP.md',
    'POST_DEPLOY_SMOKE_TEST.md',
    'data/site/release-notes.json'
  ],
  d1_migrations: [
    'content_projects',
    'content_project_media',
    'content_project_deliverables',
    'content_render_jobs',
    'content_project_events',
    'Build 199 migration ledger entry'
  ]
};

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  return jsonResponse({ ok: true, release_notes: notes }, 200, { 'Cache-Control': 'no-store' });
}
