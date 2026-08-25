import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { readAccountingVendorStatements } from '../_lib/accountingVendorStatementsReadService.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  try { return jsonResponse(await readAccountingVendorStatements(db,{periodMonth:String(url.searchParams.get('period_month')||'').trim()})); }
  catch(error){ return jsonResponse({ok:false,build:336,contract:'accounting-vendor-statements-read',owner:'accounting',error:error?.message||'Failed to read vendor statement summary.'},500); }
}
