import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, DEFAULT_PROFILES, OWNER, readAccountingStatementProviderProfiles } from '../_lib/accountingStatementProviderProfilesReadService.js';

function providerScope(value) {
  const raw = normalizeText(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return raw || 'manual';
}

async function tableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set((Array.isArray(result?.results) ? result.results : []).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableIndexSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    return new Set((Array.isArray(result?.results) ? result.results : []).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureProviderProfilesTable(db) {
  const requiredColumns = [
    'accounting_statement_provider_profile_id','provider_scope','display_name','date_column','description_column',
    'gross_column','fee_column','net_column','currency_column','reference_column','default_currency','mapping_json',
    'notes','is_active','created_at','updated_at'
  ];
  const columns = await tableColumnSet(db, 'accounting_statement_provider_profiles');
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Accounting statement provider schema is not ready: accounting_statement_provider_profiles is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  const indexes = await tableIndexSet(db, 'accounting_statement_provider_profiles');
  if (!indexes.has('idx_accounting_statement_provider_profiles_active')) {
    throw new Error('Accounting statement provider schema is not ready: accounting_statement_provider_profiles is missing index idx_accounting_statement_provider_profiles_active. Apply the current Development migration authority.');
  }
  return true;
}

async function seedDefaults(db) {
  await ensureProviderProfilesTable(db);
  let changedRows = 0;
  for (const profile of DEFAULT_PROFILES) {
    const result = await db.prepare(`
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
    changedRows += Number(result?.meta?.changes || 0);
  }
  return changedRows;
}

async function listProfiles(db) {
  const result = await readAccountingStatementProviderProfiles(db);
  return result.profiles || [];
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try {
    return jsonResponse(await readAccountingStatementProviderProfiles(db));
  } catch (error) {
    return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to load statement provider profiles.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureProviderProfilesTable(db);

  let body = {};
  try { body = await context.request.json(); }
  catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const action = normalizeText(body.action).toLowerCase();
  if (action === 'seed_defaults') {
    const changedRows = await seedDefaults(db);
    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: 'accounting_statement_provider_profiles_seed_defaults',
      target_type: 'accounting_statement_provider_profile',
      details: { default_profile_count: DEFAULT_PROFILES.length, changed_rows: changedRows },
    });
    const profiles = await listProfiles(db);
    return jsonResponse({ ok: true, profiles, seeded: DEFAULT_PROFILES.length, changed_rows: changedRows });
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