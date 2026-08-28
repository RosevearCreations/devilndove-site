// Release 448 — Admin API cross-cutting safeguards.
// Product publication lineage is enforced here without changing historical route implementations.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';
import { loadProductLineageReadiness } from '../_lib/productLineage.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }

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

export async function onRequest(context) {
  const blocked = await guardProductPublication(context);
  if (blocked) return blocked;
  return context.next();
}
