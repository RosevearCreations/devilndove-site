// File: /functions/api/admin/accounting-evidence-check.js
// Brief description: Admin-only evidence URL checker for accountant export readiness.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const period = new URL(request.url).searchParams.get('period_month') || '';
  const checks = [];
  const hst = rows(await db.prepare(`SELECT hst_gst_review_id, period_month, remittance_status, evidence_url, due_date FROM hst_gst_review_records WHERE (?='' OR period_month=?) ORDER BY period_month DESC LIMIT 24`).bind(period, period).all().catch(() => ({ results: [] })));
  hst.forEach((row) => checks.push({ source: 'hst_gst_review_records', record_id: row.hst_gst_review_id, period_month: row.period_month, ok: !!row.evidence_url, evidence_url: row.evidence_url || '', issue: row.evidence_url ? '' : 'Missing HST/GST evidence URL.' }));
  const manifests = rows(await db.prepare(`SELECT accountant_export_manifest_id, period_month, export_status, evidence_index_url, archive_url FROM accountant_export_manifests WHERE (?='' OR period_month=?) ORDER BY period_month DESC LIMIT 24`).bind(period, period).all().catch(() => ({ results: [] })));
  manifests.forEach((row) => checks.push({ source: 'accountant_export_manifests', record_id: row.accountant_export_manifest_id, period_month: row.period_month, ok: !!(row.evidence_index_url || row.archive_url), evidence_url: row.evidence_index_url || row.archive_url || '', issue: (row.evidence_index_url || row.archive_url) ? '' : 'Missing export/evidence index URL.' }));
  return json({ ok: true, period_month: period, checks, summary: { total: checks.length, missing: checks.filter((row) => !row.ok).length, ready: checks.filter((row) => row.ok).length } });
}
