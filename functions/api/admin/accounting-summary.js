// File: /functions/api/admin/accounting-summary.js
// Build 319: delegates to the Accounting-owned read authority and performs no request-time schema repair.

import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import {
  BUILD,
  CONTRACT_ID,
  OWNER,
  readAccountingSummary,
} from '../_lib/accountingSummaryReadService.js';

function emptySummary() {
  return {
    records_count: 0,
    total_booked_cents: 0,
    total_paid_cents: 0,
    total_outstanding_cents: 0,
    total_tax_cents: 0,
    open_records_count: 0,
  };
}

function safeFallback(adminUser, warnings = []) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-summary',
    authority_table: 'accounting_order_records',
    request_time_schema_mutation: false,
    schema_ready: false,
    missing_tables: [],
    missing_columns: [],
    requested_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name,
    },
    warnings,
    summary: emptySummary(),
    records: [],
    count: 0,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);

  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get('limit'));
  const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) && rawLimit > 0 ? Math.trunc(rawLimit) : 25));

  try {
    const result = await readAccountingSummary(db, { limit });
    return jsonResponse({
      ...result,
      requested_by: {
        user_id: adminUser.user_id,
        email: adminUser.email,
        display_name: adminUser.display_name,
      },
    }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'admin_accounting',
      incident_code: 'accounting_summary_read_failed',
      severity: 'warning',
      message: 'Accounting summary read authority failed. Returning safe empty fallback.',
      related_user_id: adminUser.user_id,
      details: { error: error?.message || 'Unknown summary read error.' },
    }).catch(() => null);

    return jsonResponse(safeFallback(adminUser, ['accounting_summary_read_failed']));
  }
}
