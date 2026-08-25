import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { readAccountingYearEndClose, accountingYearEndCsv, accountingYearEndCsvPack } from '../_lib/accountingYearEndCloseReadService.js';

function yearValue(value) { const raw=String(value||'').trim(); return /^\d{4}$/.test(raw)?raw:''; }

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  const year = yearValue(url.searchParams.get('year') || new Date().getFullYear());
  if (!year) return jsonResponse({ ok:false, error:'Please provide year in YYYY format.' }, 400);
  const bundle = await readAccountingYearEndClose(db, { year });
  const format = String(url.searchParams.get('format') || '').toLowerCase();
  if (format === 'json') {
    return new Response(JSON.stringify(bundle, null, 2), { headers:{ 'Content-Type':'application/json; charset=utf-8', 'Content-Disposition':`attachment; filename="devilndove-year-end-close-${year}.json"`, 'Cache-Control':'no-store' } });
  }
  if (format === 'csv_pack') {
    return new Response(accountingYearEndCsvPack(bundle), { headers:{ 'Content-Type':'text/plain; charset=utf-8', 'Content-Disposition':`attachment; filename="devilndove-year-end-close-${year}-csv-pack.txt"`, 'Cache-Control':'no-store' } });
  }
  if (format === 'csv') {
    return new Response(accountingYearEndCsv(bundle), { headers:{ 'Content-Type':'text/csv; charset=utf-8', 'Content-Disposition':`attachment; filename="devilndove-year-end-close-${year}.csv"`, 'Cache-Control':'no-store' } });
  }
  return jsonResponse(bundle, 200, { 'Cache-Control':'no-store' });
}
