import { normalizeText } from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function ensureAccountingVendorsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_vendors (
      accounting_vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_name TEXT NOT NULL UNIQUE,
      default_ledger_code TEXT,
      default_tax_percent REAL NOT NULL DEFAULT 0,
      payment_terms TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      website_url TEXT,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_vendors_active_name ON accounting_vendors(is_active, vendor_name)`).run(); } catch {}
}

export async function listAccountingVendors(db, { includeInactive = false } = {}) {
  await ensureAccountingVendorsTable(db);
  const result = await db.prepare(`
    SELECT accounting_vendor_id, vendor_name, default_ledger_code, default_tax_percent,
           payment_terms, contact_name, contact_email, contact_phone, website_url,
           notes, is_active, created_at, updated_at
    FROM accounting_vendors
    ORDER BY is_active DESC, vendor_name ASC
  `).all().catch(() => ({ results: [] }));
  return rows(result)
    .filter((row) => includeInactive || Number(row.is_active || 0) === 1)
    .map((row) => ({
      accounting_vendor_id: Number(row.accounting_vendor_id || 0),
      vendor_name: row.vendor_name || '',
      default_ledger_code: row.default_ledger_code || '',
      default_tax_percent: Number(row.default_tax_percent || 0),
      payment_terms: row.payment_terms || '',
      contact_name: row.contact_name || '',
      contact_email: row.contact_email || '',
      contact_phone: row.contact_phone || '',
      website_url: row.website_url || '',
      notes: row.notes || '',
      is_active: Number(row.is_active || 0) === 1 ? 1 : 0,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
    }));
}

export async function getAccountingVendorById(db, vendorId) {
  await ensureAccountingVendorsTable(db);
  const id = Number(vendorId || 0);
  if (!id) return null;
  const row = await db.prepare(`
    SELECT accounting_vendor_id, vendor_name, default_ledger_code, default_tax_percent,
           payment_terms, contact_name, contact_email, contact_phone, website_url,
           notes, is_active, created_at, updated_at
    FROM accounting_vendors
    WHERE accounting_vendor_id = ?
    LIMIT 1
  `).bind(id).first().catch(() => null);
  if (!row) return null;
  return {
    accounting_vendor_id: Number(row.accounting_vendor_id || 0),
    vendor_name: row.vendor_name || '',
    default_ledger_code: row.default_ledger_code || '',
    default_tax_percent: Number(row.default_tax_percent || 0),
    payment_terms: row.payment_terms || '',
    contact_name: row.contact_name || '',
    contact_email: row.contact_email || '',
    contact_phone: row.contact_phone || '',
    website_url: row.website_url || '',
    notes: row.notes || '',
    is_active: Number(row.is_active || 0) === 1 ? 1 : 0,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

export function cleanVendorPayload(body = {}) {
  return {
    vendor_name: normalizeText(body.vendor_name),
    default_ledger_code: normalizeText(body.default_ledger_code).toUpperCase(),
    default_tax_percent: Math.max(0, Math.min(100, Number(body.default_tax_percent || 0) || 0)),
    payment_terms: normalizeText(body.payment_terms),
    contact_name: normalizeText(body.contact_name),
    contact_email: normalizeText(body.contact_email),
    contact_phone: normalizeText(body.contact_phone),
    website_url: normalizeText(body.website_url),
    notes: normalizeText(body.notes),
    is_active: Number(body.is_active == null || body.is_active === '' ? 1 : body.is_active) === 0 ? 0 : 1,
  };
}
