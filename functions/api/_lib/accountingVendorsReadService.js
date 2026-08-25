export const BUILD = 331;
export const CONTRACT_ID = 'accounting-vendors-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_vendors';

const EXPECTED_COLUMNS = Object.freeze([
  'accounting_vendor_id',
  'vendor_name',
  'default_ledger_code',
  'default_tax_percent',
  'payment_terms',
  'contact_name',
  'contact_email',
  'contact_phone',
  'website_url',
  'notes',
  'is_active',
  'created_at',
  'updated_at',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

async function columnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function shapeVendor(row) {
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

export async function readAccountingVendors(db, { includeInactive = false } = {}) {
  const exists = await tableExists(db, AUTHORITY_TABLE);
  const cols = exists ? await columnSet(db, AUTHORITY_TABLE) : new Set();
  const missingTables = exists ? [] : [AUTHORITY_TABLE];
  const missingColumns = exists
    ? EXPECTED_COLUMNS.filter((name) => !cols.has(name)).map((name) => `${AUTHORITY_TABLE}.${name}`)
    : [];
  const schemaReady = missingTables.length === 0 && missingColumns.length === 0;

  let vendors = [];
  if (schemaReady) {
    const result = await db.prepare(`
      SELECT accounting_vendor_id, vendor_name, default_ledger_code, default_tax_percent,
             payment_terms, contact_name, contact_email, contact_phone, website_url,
             notes, is_active, created_at, updated_at
      FROM accounting_vendors
      ORDER BY is_active DESC, vendor_name ASC
    `).all().catch(() => ({ results: [] }));
    vendors = rows(result)
      .map(shapeVendor)
      .filter((row) => includeInactive || row.is_active === 1);
  }

  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-vendors',
    authority_table: AUTHORITY_TABLE,
    schema_ready: schemaReady,
    missing_tables: missingTables,
    missing_columns: missingColumns,
    request_time_schema_mutation: false,
    vendors,
    count: vendors.length,
    summary: {
      vendor_count: vendors.length,
      active_vendor_count: vendors.filter((row) => row.is_active === 1).length,
    },
  };
}
