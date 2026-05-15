import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const DEFAULT_PROFILES = [
  { provider_scope: 'bank', display_name: 'Bank CSV', date_column: 'Date', description_column: 'Description', gross_column: 'Amount', fee_column: '', net_column: 'Amount', currency_column: '', reference_column: 'Reference', default_currency: 'CAD', notes: 'Generic Canadian bank CSV mapping. Review against each bank export.' },
  { provider_scope: 'paypal', display_name: 'PayPal Activity', date_column: 'Date', description_column: 'Name', gross_column: 'Gross', fee_column: 'Fee', net_column: 'Net', currency_column: 'Currency', reference_column: 'Transaction ID', default_currency: 'CAD', notes: 'PayPal activity export mapping for gross/fee/net reconciliation.' },
  { provider_scope: 'stripe', display_name: 'Stripe Balance Transactions', date_column: 'Created', description_column: 'Description', gross_column: 'Amount', fee_column: 'Fee', net_column: 'Net', currency_column: 'Currency', reference_column: 'id', default_currency: 'CAD', notes: 'Stripe balance transaction CSV mapping.' },
  { provider_scope: 'square', display_name: 'Square Transactions', date_column: 'Date', description_column: 'Description', gross_column: 'Gross Sales', fee_column: 'Fees', net_column: 'Net Total', currency_column: 'Currency', reference_column: 'Transaction ID', default_currency: 'CAD', notes: 'Square transaction CSV mapping.' },
  { provider_scope: 'etsy', display_name: 'Etsy Payment Account', date_column: 'Date', description_column: 'Type', gross_column: 'Amount', fee_column: 'Fees & Taxes', net_column: 'Net', currency_column: 'Currency', reference_column: 'Info', default_currency: 'CAD', notes: 'Etsy exports vary; use as a saved review starting point.' },
  { provider_scope: 'manual', display_name: 'Manual CSV', date_column: 'date', description_column: 'description', gross_column: 'gross_cents', fee_column: 'fee_cents', net_column: 'net_cents', currency_column: 'currency', reference_column: 'reference', default_currency: 'CAD', notes: 'Internal/manual import template.' },
];

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function providerScope(value) {
  const raw = normalizeText(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return raw || 'manual';
}

async function ensureProviderProfilesTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_statement_provider_profiles (
      accounting_statement_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_scope TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      date_column TEXT,
      description_column TEXT,
      gross_column TEXT,
      fee_column TEXT,
      net_column TEXT,
      currency_column TEXT,
      reference_column TEXT,
      default_currency TEXT NOT NULL DEFAULT 'CAD',
      mapping_json TEXT,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_statement_provider_profiles_active ON accounting_statement_provider_profiles(is_active, provider_scope)`).run().catch(() => null);
}

async function seedDefaults(db) {
  await ensureProviderProfilesTable(db);
  for (const profile of DEFAULT_PROFILES) {
    await db.prepare(`
      INSERT OR IGNORE INTO accounting_statement_provider_profiles (
        provider_scope, display_name, date_column, description_column, gross_column, fee_column, net_column,
        currency_column, reference_column, default_currency, mapping_json, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      profile.provider_scope,
      profile.display_name,
      profile.date_column || null,
      profile.description_column || null,
      profile.gross_column || null,
      profile.fee_column || null,
      profile.net_column || null,
      profile.currency_column || null,
      profile.reference_column || null,
      profile.default_currency || 'CAD',
      JSON.stringify(profile),
      profile.notes || null
    ).run();
  }
}

function shape(row) {
  let mapping = {};
  try { mapping = JSON.parse(row.mapping_json || '{}'); } catch { mapping = {}; }
  return {
    accounting_statement_provider_profile_id: Number(row.accounting_statement_provider_profile_id || 0),
    provider_scope: row.provider_scope || '',
    display_name: row.display_name || '',
    date_column: row.date_column || '',
    description_column: row.description_column || '',
    gross_column: row.gross_column || '',
    fee_column: row.fee_column || '',
    net_column: row.net_column || '',
    currency_column: row.currency_column || '',
    reference_column: row.reference_column || '',
    default_currency: row.default_currency || 'CAD',
    mapping,
    notes: row.notes || '',
    is_active: Number(row.is_active || 0),
    updated_at: row.updated_at || null,
  };
}

async function listProfiles(db) {
  await seedDefaults(db);
  return rows(await db.prepare(`
    SELECT *
    FROM accounting_statement_provider_profiles
    ORDER BY is_active DESC, provider_scope ASC
  `).all().catch(() => ({ results: [] }))).map(shape);
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  return jsonResponse({ ok: true, profiles: await listProfiles(db), default_profile_count: DEFAULT_PROFILES.length });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await seedDefaults(db);

  let body = {};
  try { body = await context.request.json(); }
  catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  if (normalizeText(body.action).toLowerCase() === 'seed_defaults') {
    const profiles = await listProfiles(db);
    return jsonResponse({ ok: true, profiles, seeded: DEFAULT_PROFILES.length });
  }

  const provider = providerScope(body.provider_scope);
  const displayName = normalizeText(body.display_name) || provider;
  const payload = {
    provider_scope: provider,
    display_name: displayName,
    date_column: normalizeText(body.date_column),
    description_column: normalizeText(body.description_column),
    gross_column: normalizeText(body.gross_column),
    fee_column: normalizeText(body.fee_column),
    net_column: normalizeText(body.net_column),
    currency_column: normalizeText(body.currency_column),
    reference_column: normalizeText(body.reference_column),
    default_currency: normalizeText(body.default_currency || 'CAD').toUpperCase().slice(0, 3) || 'CAD',
    notes: normalizeText(body.notes),
    is_active: Number(body.is_active) === 0 ? 0 : 1,
  };

  await db.prepare(`
    INSERT INTO accounting_statement_provider_profiles (
      provider_scope, display_name, date_column, description_column, gross_column, fee_column, net_column,
      currency_column, reference_column, default_currency, mapping_json, notes, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(provider_scope) DO UPDATE SET
      display_name = excluded.display_name,
      date_column = excluded.date_column,
      description_column = excluded.description_column,
      gross_column = excluded.gross_column,
      fee_column = excluded.fee_column,
      net_column = excluded.net_column,
      currency_column = excluded.currency_column,
      reference_column = excluded.reference_column,
      default_currency = excluded.default_currency,
      mapping_json = excluded.mapping_json,
      notes = excluded.notes,
      is_active = excluded.is_active,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    payload.provider_scope,
    payload.display_name,
    payload.date_column || null,
    payload.description_column || null,
    payload.gross_column || null,
    payload.fee_column || null,
    payload.net_column || null,
    payload.currency_column || null,
    payload.reference_column || null,
    payload.default_currency,
    JSON.stringify(payload),
    payload.notes || null,
    payload.is_active
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'accounting_statement_provider_profile_save',
    target_type: 'accounting_statement_provider_profile',
    target_key: provider,
    details: payload,
  });

  return jsonResponse({ ok: true, profiles: await listProfiles(db) });
}
