import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { ensureAccountingAttachmentsTable, listAccountingAttachments } from './_accountingAttachments.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingAttachmentsTable(db);
  const url = new URL(context.request.url);
  const periodMonth = String(url.searchParams.get('period_month') || '').trim();
  const attachments = await listAccountingAttachments(db, { periodMonth, attachmentKind: 'statement', limit: 1000 });
  const byVendor = {};
  for (const row of attachments) {
    const key = String(row.vendor_id || 0) || '0';
    const bucket = byVendor[key] || { vendor_id: row.vendor_id || null, attachment_count: 0, statement_count: 0, gross_cents: 0, fee_cents: 0, net_cents: 0, filenames: [] };
    bucket.attachment_count += 1;
    bucket.statement_count += (row.attachment_kind || '') === 'statement' ? 1 : 0;
    bucket.gross_cents += Number(row.statement_gross_cents || 0);
    bucket.fee_cents += Number(row.statement_fee_cents || 0);
    bucket.net_cents += Number(row.statement_net_cents || 0);
    if (bucket.filenames.length < 6) bucket.filenames.push(row.original_filename || row.statement_reference || 'statement');
    byVendor[key] = bucket;
  }
  return jsonResponse({ ok: true, rows: Object.values(byVendor) });
}
