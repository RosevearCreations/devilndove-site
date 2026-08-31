import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  const row = await db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
    LIMIT 1
  `).bind(tableName).first().catch(() => null);
  return String(row?.name || '') === tableName;
}

async function listNativeLedger(db) {
  if (!(await tableExists(db, 'd1_migrations'))) return [];
  return rows(await db.prepare(`
    SELECT id, name, applied_at
    FROM d1_migrations
    ORDER BY id DESC
  `).all().catch(() => ({ results: [] })));
}

async function listProofs(db) {
  if (!(await tableExists(db, 'app_schema_migration_proofs'))) return [];
  return rows(await db.prepare(`
    SELECT
      schema_migration_proof_id,
      migration_name,
      migration_sha256,
      manifest_sha256,
      source_sha,
      environment,
      recovery_note_sha256,
      applied_at,
      verified_at
    FROM app_schema_migration_proofs
    ORDER BY schema_migration_proof_id DESC
  `).all().catch(() => ({ results: [] })));
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const [nativeLedger, proofs] = await Promise.all([
    listNativeLedger(db),
    listProofs(db),
  ]);
  const proofByName = new Map(proofs.map((row) => [String(row.migration_name || ''), row]));
  const canonical = nativeLedger
    .filter((row) => /^\d{4}_[a-z0-9][a-z0-9_-]*\.sql$/i.test(String(row.name || '')))
    .map((row) => ({
      id: Number(row.id || 0),
      migration_name: String(row.name || ''),
      applied_at: row.applied_at || null,
      proof: proofByName.get(String(row.name || '')) || null,
    }));

  return jsonResponse({
    ok: true,
    authority: 'cloudflare_d1_native_migrations',
    native_ledger_table: 'd1_migrations',
    proof_table: 'app_schema_migration_proofs',
    manual_ledger_mutation_allowed: false,
    historical_replay_allowed: false,
    canonical_migration_count: canonical.length,
    canonical,
    native_ledger: nativeLedger,
    proofs,
  });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  return jsonResponse({
    ok: false,
    error: 'Manual migration-ledger writes are disabled. Schema changes must use migrations/canonical through scripts/d1_migrate.py.',
    code: 'canonical_migration_authority_required',
    manual_ledger_mutation_allowed: false,
  }, 405, { Allow: 'GET' });
}
