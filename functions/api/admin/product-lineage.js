// Release 448 — Admin Product material/tool lineage review.
// Existing product_resource_links + site_item_inventory remain operational authorities.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';
import { loadProductLineageReadiness, productLineageSchemaReadiness } from '../_lib/productLineage.js';

const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const id = (value) => { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; };
const ORIGINS = new Set(['made_in_house','antiquity','resale','external_finished_good','legacy_pending']);
const STATES = new Set(['pending','legacy_pending','exempt','unverified','verified']);
const POLICIES = new Set(['required','legacy_nonblocking','exempt']);
const ROLES = new Set(['material','tool','mold','fixture','equipment','other']);

function clean(value, max = 1000) { return normalizeText(value).slice(0, max); }
function safeOrigin(value) { const v = clean(value, 60).toLowerCase(); return ORIGINS.has(v) ? v : 'legacy_pending'; }
function safeState(value, fallback = 'unverified') { const v = clean(value, 60).toLowerCase(); return STATES.has(v) ? v : fallback; }
function safePolicy(value) { const v = clean(value, 60).toLowerCase(); return POLICIES.has(v) ? v : 'legacy_nonblocking'; }
function safeRole(value, resourceKind = '') { const v = clean(value, 60).toLowerCase(); if (ROLES.has(v)) return v; return resourceKind === 'tool' ? 'tool' : 'material'; }

async function granted(request, env) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return { response: json({ ok: false, release: CURRENT_RELEASE, error: 'Admin access required.' }, 401) };
  const db = getDb(env);
  if (!db) return { response: json({ ok: false, release: CURRENT_RELEASE, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function listProducts(db, limit = 800) {
  const schema = await productLineageSchemaReadiness(db);
  const safeLimit = Math.max(1, Math.min(1200, Number(limit || 800)));
  if (!schema.ok) {
    const result = await db.prepare(`SELECT product_id,name,sku,status,review_status,merchandise_origin,created_at FROM products ORDER BY LOWER(COALESCE(name,'')),product_id LIMIT ?`).bind(safeLimit).all();
    return rows(result).map((row) => ({ ...row, product_id: id(row.product_id), origin_kind: null, lineage_status: null, publication_policy: null }));
  }
  const result = await db.prepare(`
    SELECT p.product_id,p.name,p.sku,p.status,p.review_status,p.merchandise_origin,p.created_at,
           plp.origin_kind,plp.lineage_status,plp.publication_policy,plp.materials_required,plp.updated_at AS lineage_updated_at
    FROM products p
    LEFT JOIN product_lineage_profiles plp ON plp.product_id=p.product_id
    ORDER BY CASE WHEN plp.lineage_status IN ('pending','legacy_pending','unverified') THEN 0 ELSE 1 END,
             LOWER(COALESCE(p.name,'')),p.product_id
    LIMIT ?
  `).bind(safeLimit).all();
  return rows(result).map((row) => ({ ...row, product_id: id(row.product_id), materials_required: Number(row.materials_required || 0) }));
}

async function loadLinkEvidence(db, productId) {
  const result = await db.prepare(`
    SELECT prl.product_resource_link_id,LOWER(TRIM(COALESCE(prl.resource_kind,''))) AS resource_kind,
           COALESCE(prl.consumption_mode,'per_unit') AS consumption_mode,
           sii.site_item_inventory_id,COALESCE(sii.is_active,0) AS inventory_active,
           COALESCE(plr.verification_status,'unverified') AS existing_verification_status
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=(
      SELECT sii2.site_item_inventory_id FROM site_item_inventory sii2
      WHERE COALESCE(sii2.is_active,1)=1
        AND LOWER(TRIM(COALESCE(sii2.source_type,'')))=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
        AND LOWER(TRIM(COALESCE(sii2.external_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
      ORDER BY sii2.site_item_inventory_id DESC LIMIT 1
    )
    LEFT JOIN product_resource_lineage_reviews plr ON plr.product_resource_link_id=prl.product_resource_link_id
    WHERE prl.product_id=?
  `).bind(productId).all();
  return rows(result);
}

export async function onRequestGet({ request, env }) {
  const access = await granted(request, env); if (access.response) return access.response;
  const url = new URL(request.url);
  const productId = id(url.searchParams.get('product_id'));
  const schema = await productLineageSchemaReadiness(access.db);
  if (!productId) {
    return json({
      ok: true,
      release: CURRENT_RELEASE,
      schema_ready: schema.ok ? 1 : 0,
      missing_tables: schema.missing_tables,
      products: await listProducts(access.db, url.searchParams.get('limit') || 800),
      inventory_authority: 'site_item_inventory + site_inventory_movements',
      resource_link_authority: 'product_resource_links',
      stock_mutation_capability: 'none',
    });
  }
  const readiness = await loadProductLineageReadiness(access.db, productId);
  return json({ ...readiness, release: CURRENT_RELEASE, stock_mutation_capability: 'none' }, readiness.ok ? 200 : 404);
}

export async function onRequestPost(context) {
  const access = await granted(context.request, context.env); if (access.response) return access.response;
  const schema = await productLineageSchemaReadiness(access.db);
  if (!schema.ok) return json({ ok: false, release: CURRENT_RELEASE, code: 'product_lineage_schema_not_ready', error: `Release 448 Product lineage schema is not ready: ${schema.missing_tables.join(', ')}.`, missing_tables: schema.missing_tables }, 503);

  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, release: CURRENT_RELEASE, error: 'Invalid JSON body.' }, 400); }
  const productId = id(body.product_id);
  if (!productId) return json({ ok: false, release: CURRENT_RELEASE, error: 'product_id is required.' }, 400);
  const product = await access.db.prepare(`SELECT product_id,name,merchandise_origin FROM products WHERE product_id=? LIMIT 1`).bind(productId).first();
  if (!product) return json({ ok: false, release: CURRENT_RELEASE, error: 'Product not found.' }, 404);

  let origin = safeOrigin(body.origin_kind);
  let status = safeState(body.lineage_status, origin === 'legacy_pending' ? 'legacy_pending' : 'unverified');
  let policy = safePolicy(body.publication_policy);
  let materialsRequired = Number(body.materials_required || 0) === 1 ? 1 : 0;
  if (['antiquity','resale','external_finished_good'].includes(origin)) {
    status = 'exempt'; policy = 'exempt'; materialsRequired = 0;
  } else if (origin === 'made_in_house') {
    policy = 'required'; materialsRequired = 1;
    if (status === 'exempt' || status === 'legacy_pending') status = 'unverified';
  } else {
    origin = 'legacy_pending'; policy = 'legacy_nonblocking'; materialsRequired = 1;
    if (status === 'exempt') status = 'legacy_pending';
  }

  const linkEvidence = await loadLinkEvidence(access.db, productId);
  const submittedReviews = Array.isArray(body.resource_reviews) ? body.resource_reviews : [];
  const submittedById = new Map(submittedReviews.map((row) => [id(row.product_resource_link_id), row]).filter(([key]) => key));
  if (origin === 'made_in_house' && status === 'verified') {
    const consuming = linkEvidence.filter((row) => String(row.resource_kind) === 'supply' && String(row.consumption_mode || 'per_unit').toLowerCase() !== 'story_only');
    if (!consuming.length) return json({ ok: false, release: CURRENT_RELEASE, code: 'product_lineage_materials_required', error: 'A made-in-house product cannot be verified without at least one consuming Supply link.' }, 400);
    const unresolved = consuming.filter((row) => !id(row.site_item_inventory_id) || Number(row.inventory_active || 0) !== 1);
    if (unresolved.length) return json({ ok: false, release: CURRENT_RELEASE, code: 'product_lineage_inventory_unresolved', error: `${unresolved.length} raw-material link(s) do not resolve to active Inventory.` }, 400);
    const unverified = consuming.filter((row) => {
      const submitted = submittedById.get(id(row.product_resource_link_id));
      const next = submitted ? safeState(submitted.verification_status) : safeState(row.existing_verification_status);
      return next !== 'verified';
    });
    if (unverified.length) return json({ ok: false, release: CURRENT_RELEASE, code: 'product_lineage_resource_unverified', error: `${unverified.length} raw-material link(s) must be verified before the product lineage profile can be verified.` }, 400);
  }

  const statements = [
    access.db.prepare(`
      INSERT INTO product_lineage_profiles(product_id,origin_kind,lineage_status,publication_policy,materials_required,evidence_reference,review_notes,reviewed_by_user_id,reviewed_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(product_id) DO UPDATE SET
        origin_kind=excluded.origin_kind,lineage_status=excluded.lineage_status,publication_policy=excluded.publication_policy,
        materials_required=excluded.materials_required,evidence_reference=excluded.evidence_reference,review_notes=excluded.review_notes,
        reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    `).bind(productId, origin, status, policy, materialsRequired, clean(body.evidence_reference, 1000) || null, clean(body.review_notes, 3000) || null, access.adminUser.user_id),
  ];

  for (const review of submittedReviews) {
    const linkId = id(review.product_resource_link_id);
    const current = linkEvidence.find((row) => id(row.product_resource_link_id) === linkId);
    if (!linkId || !current) continue;
    const reviewStatus = safeState(review.verification_status);
    const inventoryId = id(current.site_item_inventory_id) || null;
    statements.push(access.db.prepare(`
      INSERT INTO product_resource_lineage_reviews(product_id,product_resource_link_id,site_item_inventory_id,resource_role,verification_status,evidence_reference,review_note,reviewed_by_user_id,reviewed_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(product_resource_link_id) DO UPDATE SET
        product_id=excluded.product_id,site_item_inventory_id=excluded.site_item_inventory_id,resource_role=excluded.resource_role,
        verification_status=excluded.verification_status,evidence_reference=excluded.evidence_reference,review_note=excluded.review_note,
        reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    `).bind(productId, linkId, inventoryId, safeRole(review.resource_role, String(current.resource_kind)), reviewStatus, clean(review.evidence_reference, 1000) || null, clean(review.review_note, 2000) || null, access.adminUser.user_id));
  }

  await access.db.batch(statements);
  await auditAdminAction(context.env, context.request, access.adminUser, {
    action_type: 'product_lineage_review_saved',
    target_type: 'product',
    target_id: productId,
    details: { origin_kind: origin, lineage_status: status, publication_policy: policy, resource_reviews: submittedReviews.length },
  });
  const readiness = await loadProductLineageReadiness(access.db, productId);
  return json({ ...readiness, release: CURRENT_RELEASE, message: 'Product lineage review saved. Inventory quantities were not changed.', stock_mutation_capability: 'none' });
}
