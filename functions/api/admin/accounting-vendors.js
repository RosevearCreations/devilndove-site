import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { cleanVendorPayload, ensureAccountingVendorsTable, listAccountingVendors } from './_accountingVendors.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingVendorsTable(db);
  const vendors = await listAccountingVendors(db, { includeInactive: new URL(context.request.url).searchParams.get('include_inactive') === '1' });
  return jsonResponse({ ok: true, vendors, summary: { vendor_count: vendors.length, active_vendor_count: vendors.filter((row) => Number(row.is_active || 0) === 1).length } });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingVendorsTable(db);
  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const payload = cleanVendorPayload(body);
  if (!payload.vendor_name) return jsonResponse({ ok: false, error: 'vendor_name is required.' }, 400);

  await db.prepare(`
    INSERT INTO accounting_vendors (
      vendor_name, default_ledger_code, default_tax_percent, payment_terms,
      contact_name, contact_email, contact_phone, website_url, notes,
      is_active, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(vendor_name) DO UPDATE SET
      default_ledger_code = excluded.default_ledger_code,
      default_tax_percent = excluded.default_tax_percent,
      payment_terms = excluded.payment_terms,
      contact_name = excluded.contact_name,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      website_url = excluded.website_url,
      notes = excluded.notes,
      is_active = excluded.is_active,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    payload.vendor_name,
    payload.default_ledger_code || null,
    payload.default_tax_percent,
    payload.payment_terms || null,
    payload.contact_name || null,
    payload.contact_email || null,
    payload.contact_phone || null,
    payload.website_url || null,
    payload.notes || null,
    payload.is_active,
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'save_accounting_vendor',
    target_type: 'accounting_vendor',
    target_key: payload.vendor_name,
    details: payload,
  });

  return jsonResponse({ ok: true, vendor_name: payload.vendor_name });
}
