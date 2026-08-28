// Build 443 — authenticated, read-only Development infrastructure readiness.
// Reports configuration/reachability/schema-storage state without exposing secrets.
import { captureRuntimeIncident, getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const BUILD = '443';
const CONTRACT = 'development_infrastructure_readiness_v1';
const EXPECTED = Object.freeze({
  project: 'devilndove-site-dev',
  d1: { binding: 'DB', database_name: 'devilndove-dev', database_id: 'dbc1615b-dcbe-4951-973b-b47c99c73bfa' },
  r2: [
    { binding: 'PRODUCT_MEDIA_BUCKET', bucket_name: 'devilndove-toolshed-images-dev' },
    { binding: 'CAIP_PRIVATE_MEDIA_BUCKET', bucket_name: 'devilndove-caip-media-dev' }
  ]
});
const REQUIRED_D1_TABLES = Object.freeze(['users', 'sessions', 'products']);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function cleanError(error) {
  return String(error?.message || error || 'unknown error').replace(/\s+/g, ' ').slice(0, 240);
}
function deferIncident(context, payload) {
  if (typeof context.waitUntil === 'function') {
    context.waitUntil(captureRuntimeIncident(context.env, context.request, payload).catch(() => false));
  }
}

async function probeD1(env) {
  const db = env?.DB;
  const result = {
    kind: 'd1', binding: EXPECTED.d1.binding, resource: EXPECTED.d1.database_name,
    configured: Boolean(db && typeof db.prepare === 'function'), reachable: false,
    schema_ready: false, required_tables: REQUIRED_D1_TABLES, missing_tables: [], error: ''
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
    const found = new Set((rows?.results || []).map((row) => String(row?.name || '')));
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
  } catch (error) {
    deferIncident(context, { incident_scope: 'it_infrastructure', incident_code: 'infrastructure_auth_failed', severity: 'warning', message: cleanError(error) });
  }
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const d1 = await probeD1(context.env);
  const r2 = [];
  for (const authority of EXPECTED.r2) r2.push(await probeR2(context.env, authority));
  const configured = d1.configured && r2.every((item) => item.configured);
  const reachable = d1.reachable && r2.every((item) => item.reachable);
  const ready = d1.schema_ready && r2.every((item) => item.storage_ready);
  if (!reachable || !ready) {
    deferIncident(context, {
      incident_scope: 'it_infrastructure', incident_code: 'development_infrastructure_not_ready', severity: 'warning',
      message: 'Development infrastructure readiness probe found a D1/R2 hold.', related_user_id: adminUser.user_id,
      details: { configured, reachable, ready, d1: { reachable: d1.reachable, schema_ready: d1.schema_ready, missing_tables: d1.missing_tables }, r2: r2.map((item) => ({ binding: item.binding, reachable: item.reachable, storage_ready: item.storage_ready })) }
    });
  }
  return json({
    ok: true, build: BUILD, contract: CONTRACT, target: 'development', project: EXPECTED.project,
    configured, reachable, ready, d1, r2,
    note: 'Configured is repository/runtime binding state. Reachable is a harmless live read/list. Ready requires the D1 schema minimum and both R2 lists to succeed. No secret values are returned.'
  });
}
