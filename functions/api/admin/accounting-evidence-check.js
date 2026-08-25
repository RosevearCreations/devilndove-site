// File: /functions/api/admin/accounting-evidence-check.js
// Brief description: Admin-only evidence readiness read through Accounting ownership.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingEvidenceCheck } from '../_lib/accountingEvidenceCheckReadService.js';

export async function onRequestGet(context) {
  const { request, env } = context; const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env); if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  try { const periodMonth = new URL(request.url).searchParams.get('period_month') || ''; return jsonResponse(await readAccountingEvidenceCheck(db, { periodMonth })); }
  catch (error) { return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to read Accounting evidence readiness.' }, 500); }
}
