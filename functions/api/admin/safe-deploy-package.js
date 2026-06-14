// File: /functions/api/admin/safe-deploy-package.js
// Brief description: Admin-only safe deploy package summary with a real binary-safe ZIP download option for release handoff files.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 178 deploy readiness and promote live controls';
const changedFiles = [
  'DEVELOPMENT_ROADMAP.md',
  'KNOWN_GAPS_AND_RISKS.md',
  'DATABASE_SCHEMA_REFERENCE.md',
  'RELEASE_NOTES.md',
  'SANITY_HEALTH_CHECK.md',
  'POST_DEPLOY_SMOKE_TEST.md',
  'NEW_CHAT_STATUS.md',
  'LOCAL_SEO_PLAYBOOK.md',
  'IMAGES.md',
  'README.md',
  'admin/deployment-preflight/index.html',
  'admin/index.html',
  'admin/release-control/index.html',
  'database_build178_promote_live_controls.sql',
  'public/js/admin-deploy-readiness.js',
  'functions/api/admin/deploy-readiness.js',
  'admin/deploy-readiness/index.html',
  'admin/safe-deploy-package/index.html',
  'css/styles.css',
  'data/site/deployment-preflight.json',
  'data/site/release-notes.json',
  'data/site/release-package-manifest.json',
  'data/site/local-business-schema.json',
  'database_build174_deployment_preflight_detail.sql',
  'database_build175_release_control.sql',
  'database_build176_release_safety_controls.sql',
  'database_build177_deploy_score_and_controls.sql',
  'database_full_schema.sql',
  'database_schema.sql',
  'database_store_schema.sql',
  'database_upgrade_current_pass.sql',
  'functions/api/admin/dashboard-summary.js',
  'functions/api/admin/db-sanity.js',
  'functions/api/admin/deployment-preflight.js',
  'functions/api/admin/migration-ledger.js',
  'functions/api/admin/release-control.js',
  'functions/api/admin/safe-deploy-package.js',
  'functions/api/admin/schema-drift-report.js',
  'public/js/admin-dashboard-preflight-badge.js',
  'public/js/admin-deployment-preflight.js',
  'public/js/admin-release-control.js',
  'public/js/admin-safe-deploy-package.js',
  'data/site/build178-release-controls.json',
  'public/js/admin-marketplace-export-preview.js',
  'functions/api/admin/marketplace-export-preview.js',
  'scripts/deployment_preflight_static_check.py',
  'scripts/generate_release_manifest.py',
  'scripts/generate_release_notes.py',
  'scripts/regenerate_sanity_from_preflight.py'
];
const defaultPackageFiles = [
  'RELEASE_NOTES.md',
  'SANITY_HEALTH_CHECK.md',
  'DEVELOPMENT_ROADMAP.md',
  'KNOWN_GAPS_AND_RISKS.md',
  'DATABASE_SCHEMA_REFERENCE.md',
  'POST_DEPLOY_SMOKE_TEST.md',
  'data/site/deployment-preflight.json',
  'data/site/release-notes.json',
  'data/site/release-package-manifest.json',
  'data/site/local-business-schema.json',
  'database_build171_ledger_repair.sql',
  'database_build173_deployment_preflight.sql',
  'database_build174_deployment_preflight_detail.sql',
  'database_build175_release_control.sql',
  'database_build176_release_safety_controls.sql',
  'database_build177_deploy_score_and_controls.sql',
  'database_build178_promote_live_controls.sql'
];
function le16(value) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, value, true); return b; }
function le32(value) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, value >>> 0, true); return b; }
function concat(parts) { const len = parts.reduce((n, p) => n + p.length, 0); const out = new Uint8Array(len); let off = 0; for (const part of parts) { out.set(part, off); off += part.length; } return out; }
const encoder = new TextEncoder();
let crcTable;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  }
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
async function sha256Hex(bytes) {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function zipStore(files) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name.replace(/^\/+/, ''));
    const data = file.bytes;
    const crc = crc32(data);
    const local = concat([le32(0x04034b50), le16(20), le16(0), le16(0), le16(0), le16(0), le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), name, data]);
    locals.push(local);
    const central = concat([le32(0x02014b50), le16(20), le16(20), le16(0), le16(0), le16(0), le16(0), le32(crc), le32(data.length), le32(data.length), le16(name.length), le16(0), le16(0), le16(0), le16(0), le32(0), le32(offset), name]);
    centrals.push(central);
    offset += local.length;
  }
  const centralStart = offset;
  const central = concat(centrals);
  const end = concat([le32(0x06054b50), le16(0), le16(0), le16(files.length), le16(files.length), le32(central.length), le32(centralStart), le16(0)]);
  return concat([...locals, central, end]);
}
async function fetchTextFile(request, rel) {
  const url = new URL('/' + rel.replace(/^\/+/, ''), request.url);
  const response = await fetch(url.toString(), { headers: { 'Accept': 'text/plain, application/json, */*' } });
  if (!response.ok) return { name: rel, text: `Missing or unavailable during package generation: ${rel}\nHTTP status: ${response.status}\n`, ok: false };
  return { name: rel, text: await response.text(), ok: true };
}
async function buildZip(request) {
  const fetched = [];
  for (const rel of defaultPackageFiles) fetched.push(await fetchTextFile(request, rel));
  const index = {
    build_label: BUILD_LABEL,
    generated_at: new Date().toISOString(),
    package_kind: 'safe_deploy_zip',
    included_files: fetched.map((row) => ({ path: row.name, ok: row.ok, bytes: encoder.encode(row.text).length })),
    skipped_files: fetched.filter((row) => !row.ok).map((row) => row.name),
    post_deploy_order: ['database_build171_ledger_repair.sql if needed only', 'database_build173_deployment_preflight.sql', 'database_build174_deployment_preflight_detail.sql', 'database_build175_release_control.sql', 'database_build176_release_safety_controls.sql', 'database_build177_deploy_score_and_controls.sql', 'database_build178_promote_live_controls.sql']
  };
  const files = [{ name: 'SAFE_DEPLOY_PACKAGE_INDEX.json', bytes: encoder.encode(JSON.stringify(index, null, 2) + '\n') }, ...fetched.map((row) => ({ name: row.name, bytes: encoder.encode(row.text) }))];
  const bytes = zipStore(files);
  return { bytes, sha256: await sha256Hex(bytes), index };
}
async function recordDownload(env, user, pack) {
  const db = getDb(env);
  if (!db) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS safe_deploy_package_downloads (safe_deploy_package_download_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, package_kind TEXT NOT NULL DEFAULT 'safe_deploy_zip', included_files_json TEXT NOT NULL DEFAULT '[]', file_count INTEGER NOT NULL DEFAULT 0, total_bytes INTEGER NOT NULL DEFAULT 0, zip_sha256 TEXT, download_status TEXT NOT NULL DEFAULT 'prepared', prepared_by_user_id INTEGER, prepared_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
    await db.prepare(`INSERT INTO safe_deploy_package_downloads (build_label, package_kind, included_files_json, file_count, total_bytes, zip_sha256, download_status, prepared_by_user_id, notes, prepared_at) VALUES (?, 'safe_deploy_zip', ?, ?, ?, ?, 'prepared', ?, ?, CURRENT_TIMESTAMP)`).bind(BUILD_LABEL, JSON.stringify(pack.index.included_files), pack.index.included_files.length, pack.bytes.length, pack.sha256, Number(user?.user_id || 0) || null, pack.index.skipped_files.length ? `Skipped/missing: ${pack.index.skipped_files.join(', ')}` : 'All default package files were included.').run();
  } catch {}
}
function packagePayload() {
  return {
    build_label: BUILD_LABEL,
    schema: [
      'Fresh D1: run database_upgrade_current_pass.sql, then database_build173_deployment_preflight.sql, then database_build174_deployment_preflight_detail.sql, then database_build175_release_control.sql, then database_build176_release_safety_controls.sql, then database_build177_deploy_score_and_controls.sql, then database_build178_promote_live_controls.sql.',
      'Partial D1 with Build 171 tables but missing marker: run database_build171_ledger_repair.sql only, then Build 173, Build 174, Build 175, Build 176, Build 177, and Build 178.',
      'Do not rerun ALTER TABLE-heavy SQL blocks on a database where those columns already exist.'
    ],
    sql_copy_blocks: {
      fresh_install: ['database_upgrade_current_pass.sql', 'database_build173_deployment_preflight.sql', 'database_build174_deployment_preflight_detail.sql', 'database_build175_release_control.sql', 'database_build176_release_safety_controls.sql', 'database_build177_deploy_score_and_controls.sql', 'database_build178_promote_live_controls.sql'],
      repair_only: ['database_build171_ledger_repair.sql', 'database_build173_deployment_preflight.sql', 'database_build174_deployment_preflight_detail.sql', 'database_build175_release_control.sql', 'database_build176_release_safety_controls.sql', 'database_build177_deploy_score_and_controls.sql', 'database_build178_promote_live_controls.sql']
    },
    changed_files: changedFiles,
    safe_deploy_zip_url: '/api/admin/safe-deploy-package?format=zip',
    manifest: '/data/site/release-package-manifest.json',
    post_deploy_actions: [
      'Open /admin/deployment-preflight/ and run Preflight after D1 migration.',
      'Download /api/admin/safe-deploy-package?format=zip for a support handoff bundle.',
      'Open /admin/release-control/ and run live manifest compare against the deployed manifest URL.',
      'Review Product QA bulk preview cards, approve the group, then apply only low-risk image-alt fixes.',
      'Review marketplace validation previews before generating CSV exports.',
      'Confirm recall locks are released only after a signed compliance review exists.',
      'Calculate the deploy-readiness score, run /admin/post-deploy-smoke-tests/, and confirm dashboard/preflight badges, then open /admin/deploy-readiness/ and pass/block the promote-live checklist before promotion.'
    ]
  };
}
export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(context.request.url);
  if (url.searchParams.get('format') === 'zip') {
    const pack = await buildZip(context.request);
    await recordDownload(context.env, user, pack);
    return new Response(pack.bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="devilndove-safe-deploy-build178.zip"',
        'X-Safe-Deploy-SHA256': pack.sha256,
        'Cache-Control': 'no-store'
      }
    });
  }
  return jsonResponse({ ok: true, package: packagePayload() }, 200, { 'Cache-Control': 'no-store' });
}
