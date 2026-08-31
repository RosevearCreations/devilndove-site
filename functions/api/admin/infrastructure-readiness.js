// Release 463 — authenticated, read-only environment infrastructure readiness.
// Harmless SELECT/list probes only. No D1, R2, provider or external write is performed here.
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 463;
const CONTRACT = 'release463_environment_infrastructure_v1';
const PROJECT = 'devilndove-site';
const AUTHORITIES = Object.freeze({
  development: Object.freeze({
    project: PROJECT,
    d1: { binding: 'DB', database_name: 'devilndove-dev', database_id: 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' },
    r2: [
      { binding: 'PRODUCT_MEDIA_BUCKET', bucket_name: 'devilndove-toolshed-images-dev' },
      { binding: 'CAIP_PRIVATE_MEDIA_BUCKET', bucket_name: 'devilndove-caip-media-dev' },
    ],
  }),
  production: Object.freeze({
    project: PROJECT,
    d1: { binding: 'DB', database_name: 'devilndove-prod-r462', database_id: 'f34a741b-0000-45b0-9a96-6be08754d563' },
    r2: [
      { binding: 'PRODUCT_MEDIA_BUCKET', bucket_name: 'devilndove-toolshed-images' },
      { binding: 'CAIP_PRIVATE_MEDIA_BUCKET', bucket_name: 'devilndove-caip-media' },
    ],
  }),
});
const REQUIRED_D1_TABLES = Object.freeze([
  'users', 'sessions', 'products',
  'app_modules', 'app_module_role_access', 'app_module_user_access',
  'home_carousel_slides', 'home_carousel_events',
]);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function cleanError(error) {
  return String(error?.message || error || 'unknown error').replace(/\s+/g, ' ').slice(0, 240);
}
function targetFor(env) {
  const target = String(env?.DND_ENVIRONMENT || '').trim().toLowerCase();
  return target === 'production' ? 'production' : 'development';
}

async function probeD1(env, expected) {
  const db = env?.DB;
  const result = {
    kind: 'd1', binding: expected.binding, resource: expected.database_name,
    database_id: expected.database_id,
    configured: Boolean(db && typeof db.prepare === 'function'), reachable: false,
    schema_ready: false, required_tables: REQUIRED_D1_TABLES, tables: [], missing_tables: [],
    foreign_key_violations: null, error: '',
  };
  if (!result.configured) {
    result.error = 'DB binding is not available to this runtime.';
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
    const fk = await db.prepare('PRAGMA foreign_key_check').all();
    result.foreign_key_violations = Array.isArray(fk?.results) ? fk.results.length : null;
    result.schema_ready = result.reachable && result.missing_tables.length === 0 && result.foreign_key_violations === 0;
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
    storage_ready: false, sampled_objects: null, error: '',
  };
  if (!result.configured) {
    result.error = `${authority.binding} binding is not available to this runtime.`;
    return result;
  }
  try {
    const listing = await bucket.list({ limit: 1 });
    result.reachable = true;
    result.storage_ready = true;
    result.sampled_objects = Array.isArray(listing?.objects) ? listing.objects.length : 0;
  } catch (error) {
    result.error = cleanError(error);
  }
  return result;
}

export async function onRequestGet(context) {
  let adminUser = null;
  try { adminUser = await getAdminUserFromRequest(context.request, context.env); } catch { adminUser = null; }
  if (!adminUser) return json({ ok: false, release: RELEASE, contract: CONTRACT, error: 'Admin access required.' }, 401);

  const target = targetFor(context.env);
  const expected = AUTHORITIES[target];
  const declaredProject = String(context.env?.DND_PAGES_PROJECT || '').trim() || PROJECT;
  const d1 = await probeD1(context.env, expected.d1);
  const r2 = [];
  for (const authority of expected.r2) r2.push(await probeR2(context.env, authority));
  const configured = declaredProject === PROJECT && d1.configured && r2.every((item) => item.configured);
  const reachable = d1.reachable && r2.every((item) => item.reachable);
  const ready = configured && d1.schema_ready && r2.every((item) => item.storage_ready);

  return json({
    ok: true,
    release: RELEASE,
    contract: CONTRACT,
    target,
    project: PROJECT,
    declared_project: declaredProject,
    configured,
    reachable,
    ready,
    authority: expected,
    current_release_sql_required: false,
    mutation_policy: {
      d1_probe: 'SELECT/PRAGMA read only',
      r2_probe: 'list limit 1 only',
      d1_write: false,
      r2_write: false,
      provider_write: false,
      destructive_probe_performed: false,
    },
    d1,
    r2,
    note: 'Release 463 proves the active runtime environment without mutating D1 or R2. Production and Development use isolated resources on the single canonical Pages project.',
  });
}
