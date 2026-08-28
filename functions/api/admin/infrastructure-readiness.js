// Build 444 — authenticated, read-only Development infrastructure and carried-schema readiness.
// Harmless SELECT/list probes only. No D1/R2/provider write is performed by this endpoint.
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const BUILD = '444';
const CONTRACT = 'development_infrastructure_readiness_v2';
const EXPECTED = Object.freeze({
  project: 'devilndove-site-dev',
  d1: { binding: 'DB', database_name: 'devilndove-dev', database_id: 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' },
  r2: [
    { binding: 'PRODUCT_MEDIA_BUCKET', bucket_name: 'devilndove-toolshed-images-dev' },
    { binding: 'CAIP_PRIVATE_MEDIA_BUCKET', bucket_name: 'devilndove-caip-media-dev' }
  ]
});
const REQUIRED_D1_TABLES = Object.freeze([
  'users',
  'sessions',
  'products',
  'app_module_user_access',
  'home_carousel_slides',
  'home_carousel_events'
]);
const CARRIED_MIGRATIONS = Object.freeze([
  {
    id: 'IT-444-H1',
    origin_build: 442,
    label: 'I.T. explicit user access authority',
    required_tables: ['app_module_user_access'],
    runner: 'python scripts/build442_apply_development_it_platform.py'
  },
  {
    id: 'CAR-444-H1',
    origin_build: 443,
    label: 'Home carousel authority',
    required_tables: ['home_carousel_slides', 'home_carousel_events'],
    runner: 'python scripts/build443_apply_development_home_carousel.py'
  }
]);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function cleanError(error) {
  return String(error?.message || error || 'unknown error').replace(/\s+/g, ' ').slice(0, 240);
}
function migrationState(missingTables) {
  const missing = new Set(Array.isArray(missingTables) ? missingTables : []);
  return CARRIED_MIGRATIONS.map((item) => {
    const missingRequired = item.required_tables.filter((name) => missing.has(name));
    return {
      ...item,
      ready: missingRequired.length === 0,
      missing_tables: missingRequired
    };
  });
}

async function probeD1(env) {
  const db = env?.DB;
  const result = {
    kind: 'd1', binding: EXPECTED.d1.binding, resource: EXPECTED.d1.database_name,
    configured: Boolean(db && typeof db.prepare === 'function'), reachable: false,
    schema_ready: false, required_tables: REQUIRED_D1_TABLES, tables: [], missing_tables: [], error: ''
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
    storage_ready: false, error: ''
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
  try {
    adminUser = await getAdminUserFromRequest(context.request, context.env);
  } catch {
    adminUser = null;
  }
  if (!adminUser) return json({ ok: false, build: BUILD, contract: CONTRACT, error: 'Admin access required.' }, 401);

  const d1 = await probeD1(context.env);
  const r2 = [];
  for (const authority of EXPECTED.r2) r2.push(await probeR2(context.env, authority));
  const configured = d1.configured && r2.every((item) => item.configured);
  const reachable = d1.reachable && r2.every((item) => item.reachable);
  const ready = d1.schema_ready && r2.every((item) => item.storage_ready);
  const carriedMigrations = migrationState(d1.missing_tables);

  return json({
    ok: true,
    build: BUILD,
    contract: CONTRACT,
    target: 'development',
    project: EXPECTED.project,
    configured,
    reachable,
    ready,
    current_release_sql_required: false,
    mutation_policy: {
      d1_probe: 'SELECT only',
      r2_probe: 'list limit 1 only',
      d1_write: false,
      r2_write: false,
      provider_write: false,
      destructive_probe_performed: false
    },
    d1,
    r2,
    carried_migrations: carriedMigrations,
    note: 'Build 444 adds no D1 schema mutation. Readiness also verifies the tables required by the carried Build 442 I.T. and Build 443 carousel authorities. Missing carried tables remain HOLDs and report their guarded correction runner.'
  });
}
