import {
  auditAdminAction,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';

const EXPECTED_MIGRATIONS = [
  {
    migration_key: 'database_upgrade_current_pass',
    file_name: 'database_upgrade_current_pass.sql',
    purpose: 'Current pass D1 schema/data safety migration.',
    destructive: false,
    run_order: 10,
  },
  {
    migration_key: 'database_amazon_purchase_import_staging',
    file_name: 'database_amazon_purchase_import_staging.sql',
    purpose: 'Private Amazon purchase import staging table and indexes.',
    destructive: false,
    run_order: 20,
  },
  {
    migration_key: 'database_inventory_stock_unit_quick_fix',
    file_name: 'database_inventory_stock_unit_quick_fix.sql',
    purpose: 'Optional one-time stock/default-unit correction for existing Tools/Supplies inventory rows.',
    destructive: false,
    run_order: 25,
  },
  {
    migration_key: 'database_growth_analytics_seo_extension',
    file_name: 'database_growth_analytics_seo_extension.sql',
    purpose: 'Growth analytics, SEO, media, and operational reporting extension.',
    destructive: false,
    run_order: 30,
  },
  {
    migration_key: 'database_payments_extension',
    file_name: 'database_payments_extension.sql',
    purpose: 'Payments, refunds, disputes, and provider tracking extension.',
    destructive: false,
    run_order: 40,
  },
  {
    migration_key: 'database_profiles_extension',
    file_name: 'database_profiles_extension.sql',
    purpose: 'Profiles, access-tier support, and admin identity extension.',
    destructive: false,
    run_order: 50,
  },
  {
    migration_key: 'database_access_tiers',
    file_name: 'database_access_tiers.sql',
    purpose: 'Access tiers and admin-permission foundation.',
    destructive: false,
    run_order: 60,
  },
];

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function normalizeStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  if (['applied', 'skipped', 'failed', 'pending_review'].includes(raw)) return raw;
  return 'applied';
}

function slugKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\.sql$/i, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function ensureMigrationLedgerTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS schema_migration_ledger (
      schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_key TEXT NOT NULL UNIQUE,
      file_name TEXT NOT NULL,
      checksum TEXT,
      status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','skipped','failed','pending_review')),
      destructive INTEGER NOT NULL DEFAULT 0,
      applied_by_user_id INTEGER,
      applied_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_status ON schema_migration_ledger(status, applied_at DESC)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_file ON schema_migration_ledger(file_name)`).run().catch(() => null);
}

async function listLedger(db) {
  await ensureMigrationLedgerTable(db);
  return normalizeResults(await db.prepare(`
    SELECT
      schema_migration_id,
      migration_key,
      file_name,
      checksum,
      status,
      destructive,
      applied_by_user_id,
      applied_at,
      notes,
      created_at,
      updated_at
    FROM schema_migration_ledger
    ORDER BY COALESCE(applied_at, created_at) DESC, schema_migration_id DESC
  `).all().catch(() => ({ results: [] })));
}

function buildChecklist(rows = []) {
  const byKey = new Map(rows.map((row) => [String(row.migration_key || ''), row]));
  const expected = EXPECTED_MIGRATIONS
    .slice()
    .sort((a, b) => Number(a.run_order || 0) - Number(b.run_order || 0))
    .map((item) => {
      const recorded = byKey.get(item.migration_key);
      return {
        ...item,
        recorded: !!recorded,
        status: recorded?.status || 'not_recorded',
        applied_at: recorded?.applied_at || null,
        checksum: recorded?.checksum || '',
        notes: recorded?.notes || '',
      };
    });

  const unrecordedExpected = expected.filter((item) => !item.recorded);
  const failed = rows.filter((row) => row.status === 'failed');
  const pendingReview = rows.filter((row) => row.status === 'pending_review');
  return {
    expected,
    unrecorded_expected_count: unrecordedExpected.length,
    failed_count: failed.length,
    pending_review_count: pendingReview.length,
    attention_required: unrecordedExpected.length + failed.length + pendingReview.length,
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const rows = await listLedger(db);
  const checklist = buildChecklist(rows);
  return jsonResponse({
    ok: true,
    summary: {
      ledger_count: rows.length,
      expected_migration_count: EXPECTED_MIGRATIONS.length,
      unrecorded_expected_count: checklist.unrecorded_expected_count,
      failed_count: checklist.failed_count,
      pending_review_count: checklist.pending_review_count,
      status: checklist.attention_required ? 'attention_required' : 'ok',
    },
    expected_migrations: checklist.expected,
    ledger: rows,
  });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureMigrationLedgerTable(db);

  let body = {};
  try { body = await context.request.json(); }
  catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const fileName = normalizeText(body.file_name || body.fileName);
  const migrationKey = normalizeText(body.migration_key || body.migrationKey || slugKey(fileName));
  const status = normalizeStatus(body.status);
  const checksum = normalizeText(body.checksum || body.hash || '');
  const notes = normalizeText(body.notes || body.note || '');
  const destructive = Number(body.destructive || 0) === 1 ? 1 : 0;
  const force = Number(body.force || 0) === 1 || body.force === true;

  if (!fileName || !migrationKey) {
    return jsonResponse({ ok: false, error: 'file_name and migration_key are required.' }, 400);
  }

  const existing = await db.prepare(`
    SELECT migration_key, file_name, checksum, status, applied_at
    FROM schema_migration_ledger
    WHERE migration_key = ?
    LIMIT 1
  `).bind(migrationKey).first().catch(() => null);

  if (existing?.status === 'applied' && status === 'applied' && !force) {
    return jsonResponse({
      ok: false,
      error: 'This migration is already recorded as applied. Use force only after verifying it is safe.',
      existing,
    }, 409);
  }

  await db.prepare(`
    INSERT INTO schema_migration_ledger (
      migration_key, file_name, checksum, status, destructive, applied_by_user_id, applied_at, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'applied' THEN CURRENT_TIMESTAMP ELSE NULL END, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(migration_key) DO UPDATE SET
      file_name = excluded.file_name,
      checksum = COALESCE(NULLIF(excluded.checksum, ''), schema_migration_ledger.checksum),
      status = excluded.status,
      destructive = excluded.destructive,
      applied_by_user_id = excluded.applied_by_user_id,
      applied_at = CASE WHEN excluded.status = 'applied' THEN CURRENT_TIMESTAMP ELSE schema_migration_ledger.applied_at END,
      notes = COALESCE(NULLIF(excluded.notes, ''), schema_migration_ledger.notes),
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    migrationKey,
    fileName,
    checksum || null,
    status,
    destructive,
    Number(adminUser.user_id || 0) || null,
    status,
    notes || null
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'schema_migration_ledger_record',
    target_type: 'schema_migration',
    target_key: migrationKey,
    details: { file_name: fileName, status, destructive, checksum, force },
  });

  const rows = await listLedger(db);
  return jsonResponse({ ok: true, summary: buildChecklist(rows), ledger: rows });
}
