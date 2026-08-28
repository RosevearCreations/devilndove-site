// Release 447 — authenticated, read-only Development infrastructure readiness.
// Harmless SELECT/list probes only. No D1, R2, provider or Production write is performed here.
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 447;
const CONTRACT = 'platform_convergence_infrastructure_v1';
const EXPECTED = Object.freeze({
  project: 'devilndove-site-dev',
  d1: { binding: 'DB', database_name: 'devilndove-dev', database_id: 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' },
  r2: [
    { binding: 'PRODUCT_MEDIA_BUCKET', bucket_name: 'devilndove-toolshed-images-dev' },
    { binding: 'CAIP_PRIVATE_MEDIA_BUCKET', bucket_name: 'devilndove-caip-media-dev' },
  ],
});
const REQUIRED_D1_TABLES = Object.freeze([
  'users', 'sessions', 'products',
  'app_modules', 'app_module_role_access', 'app_module_user_access',
  'home_carousel_slides', 'home_carousel_events',
]);
const MIGRATION_FILE = 'database_platform_convergence.sql';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function cleanError(error) {
  return String(error?.message || error || 'unknown error').replace(/\s+/g, ' ').slice(0, 240);
}

async function probeD1(env) {
  const db = env?.DB;
  const result = {
    kind: 'd1', binding: EXPECTED.d1.binding, resource: EXPECTED.d1.database_name,
    database_id: EXPECTED.d1.database_id,
    configured: Boolean(db && typeof db.prepare === 'function'), reachable: false,
    schema_ready: false, required_tables: REQUIRED_D1_TABLES, tables: [], missing_tables: [], error: '',
  };
  if (!result.configured) {
    result.error = 'DB binding is not available to this Development runtime.';
    return result;
  }
  try {
    const ping = await db.prepare('SELECT 1 AS ok').first();
    result.reachable = Number(ping?.ok) === 1;
    const placeholders = REQUIRED_D1_TABLES.map(() => '?').join(',');
    const rows = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`)
      .bind(...REQUIRED_D1_TABLES).all();
    result.tables = (rows?.results || []).map((row) => String(row?.name || '')).filter(Boolean).sort();
    const found = new Set(result.tables);
    result.missing_tables = REQUIRED_D1_TABLES.filter((name) => !found.has(name));
    result.schema_ready = result.reachable && result.missing_tables.length === 0;
  } catch (error) {
    result.error = cleanError(error);
  }
  return result;
}

async function probeR2(env, authority) {
  const bucket = env?.[authority.binding];
  const result = {
    kind: 'r2', binding: authority.binding, resource: authority.bucket_name,
    configured: Boolean(bucket && typeof bucket.list === 'function'), reachable: false,
    storage_ready: false, error: '',
  };
  if (!result.configured) {
    result.error = `${authority.binding} binding is not available to this Development runtime.`;
    return result;
  }
  try {
    await bucket.list({ limit: 1 });
    result.reachable = true;
    result.storage_ready = true;
  } catch (error) {
    result.error = cleanError(error);
  }
  return result;
}

export async function onRequestGet(context) {
  let adminUser = null;
  try { adminUser = await getAdminUserFromRequest(context.request, context.env); } catch { adminUser = null; }
  if (!adminUser) return json({ ok: false, release: RELEASE, contract: CONTRACT, error: 'Admin access required.' }, 401);

  const d1 = await probeD1(context.env);
  const r2 = [];
  for (const authority of EXPECTED.r2) r2.push(await probeR2(context.env, authority));
  const configured = d1.configured && r2.every((item) => item.configured);
  const reachable = d1.reachable && r2.every((item) => item.reachable);
  const ready = d1.schema_ready && r2.every((item) => item.storage_ready);
  const migrationRequired = d1.configured && d1.reachable && !d1.schema_ready;

  return json({
    ok: true,
    release: RELEASE,
    contract: CONTRACT,
    target: 'development',
    project: EXPECTED.project,
    configured,
    reachable,
    ready,
    authority: EXPECTED,
    migration: {
      required: migrationRequired,
      file: MIGRATION_FILE,
      missing_tables: d1.missing_tables,
      target_database: EXPECTED.d1.database_name,
      production_allowed: false,
    },
    current_release_sql_required: migrationRequired,
    mutation_policy: {
      d1_probe: 'SELECT only',
      r2_probe: 'list limit 1 only',
      d1_write: false,
      r2_write: false,
      provider_write: false,
      destructive_probe_performed: false,
    },
    d1,
    r2,
    note: 'Release 447 uses database_platform_convergence.sql as the only current Development D1 convergence path. Historical build migrations are provenance only.',
  });
}
