// File: /functions/api/admin/accounting-summary.js
// Brief description: Returns the current lightweight accounting shadow records
// and summary totals so admin can review revenue/tax/order amounts before
// a fuller accounting backend is added.

import { getAdminUserFromRequest, jsonResponse } from "../_lib/adminAudit.js";
import { ensureAccountingSchema, getDb } from "../_lib/accounting.js";

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Unauthorized.' }, 401);

  await ensureAccountingSchema(db);

  const summaryRow = await db.prepare(`
    SELECT
      COUNT(*) AS records_count,
      COALESCE(SUM(total_cents),0) AS total_booked_cents,
      COALESCE(SUM(amount_paid_cents),0) AS total_paid_cents,
      COALESCE(SUM(amount_outstanding_cents),0) AS total_outstanding_cents,
      COALESCE(SUM(tax_liability_cents),0) AS total_tax_cents,
      SUM(CASE WHEN entry_status IN ('open','partially_paid') THEN 1 ELSE 0 END) AS open_records_count
    FROM accounting_order_records
  `).first().catch(() => null) || {};

  const recent = normalizeResults(await db.prepare(`
    SELECT
      accounting_order_record_id,
      order_id,
      order_number,
      entry_status,
      customer_name,
      customer_email,
      currency,
      total_cents,
      amount_paid_cents,
      amount_outstanding_cents,
      tax_liability_cents,
      source_order_status,
      source_payment_status,
      created_at,
      updated_at
    FROM accounting_order_records
    ORDER BY created_at DESC, accounting_order_record_id DESC
    LIMIT 25
  `).all().catch(() => ({results:[]})));

  return jsonResponse({
    ok:true,
    requested_by:{ user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name },
    summary:{
      records_count:Number(summaryRow.records_count||0),
      total_booked_cents:Number(summaryRow.total_booked_cents||0),
      total_paid_cents:Number(summaryRow.total_paid_cents||0),
      total_outstanding_cents:Number(summaryRow.total_outstanding_cents||0),
      total_tax_cents:Number(summaryRow.total_tax_cents||0),
      open_records_count:Number(summaryRow.open_records_count||0)
    },
    records: recent.map((row) => ({
      accounting_order_record_id:Number(row.accounting_order_record_id||0),
      order_id:Number(row.order_id||0),
      order_number:row.order_number||'',
      entry_status:row.entry_status||'open',
      customer_name:row.customer_name||'',
      customer_email:row.customer_email||'',
      currency:row.currency||'CAD',
      total_cents:Number(row.total_cents||0),
      amount_paid_cents:Number(row.amount_paid_cents||0),
      amount_outstanding_cents:Number(row.amount_outstanding_cents||0),
      tax_liability_cents:Number(row.tax_liability_cents||0),
      source_order_status:row.source_order_status||'',
      source_payment_status:row.source_payment_status||'',
      created_at:row.created_at||null,
      updated_at:row.updated_at||null
    }))
  });
}
