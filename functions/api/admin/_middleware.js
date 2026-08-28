// Release 448 — Admin API cross-cutting safeguards and current-release response authority.
// Product publication lineage is enforced here without rewriting proven historical handlers.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';
import { loadProductLineageReadiness } from '../_lib/productLineage.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }

const CURRENTIZED_ADMIN_PATHS = new Set([
  '/api/admin/product-integrity-review',
  '/api/admin/tool-lifecycle-review',
  '/api/admin/product-production-release',
  '/api/admin/product-production-reversal',
  '/api/admin/inventory-integrity-review',
]);

async function guardProductPublication(context) {
  const request = context.request;
  if (String(request.method || '').toUpperCase() !== 'POST') return null;
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '');
  if (pathname !== '/api/admin/product-review-actions') return null;

  const adminUser = await getAdminUserFromRequest(request, context.env);
  if (!adminUser) return null; // The owner route returns the canonical auth response.

  let body = {};
  try { body = await request.clone().json(); } catch { return null; }
  const action = normalizeText(body.action).toLowerCase();
  if (!['publish', 'publish_override'].includes(action)) return null;
  const productId = Number(body.product_id || 0);
  if (!Number.isInteger(productId) || productId <= 0) return null;

  const db = getDb(context.env);
  if (!db) return null;
  const lineage = await loadProductLineageReadiness(db, productId);
  if (!lineage?.schema_ready) return null; // Migration rollout must not break existing publication routes.
  if (!lineage.publish_blocked) return null;

  return json({
    ok: false,
    release: CURRENT_RELEASE,
    code: 'product_lineage_publication_blocked',
    error: 'Publication is blocked until required in-house Product material lineage is verified.',
    product_id: productId,
    origin_kind: lineage.profile?.origin_kind || null,
    lineage_status: lineage.profile?.lineage_status || null,
    blockers: lineage.blockers || [],
    owner_url: `/admin/product-lineage/?product_id=${productId}`,
    inventory_mutation: false,
  }, 409);
}

async function currentizeRetainedAdminContract(response, pathname) {
  if (!CURRENTIZED_ADMIN_PATHS.has(pathname)) return response;
  const type = String(response?.headers?.get('Content-Type') || '').toLowerCase();
  if (!type.includes('application/json')) return response;
  let payload;
  try { payload = await response.clone().json(); } catch { return response; }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return response;

  delete payload.build;
  payload.release = CURRENT_RELEASE;
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-DND-Release', String(CURRENT_RELEASE));
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname.replace(/\/+$/, '');
  const blocked = await guardProductPublication(context);
  if (blocked) return blocked;
  const response = await context.next();
  return currentizeRetainedAdminContract(response, pathname);
}
