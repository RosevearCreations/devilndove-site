// Release 448 — normalized manufacturer provenance + Devil n Dove-authored purchased-item reviews.
// Amazon/marketplaces are references only; this endpoint never scrapes or contacts them.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CURRENT_RELEASE } from '../_lib/releaseAuthority.js';
import { productLineageSchemaReadiness } from '../_lib/productLineage.js';

const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const id = (value) => { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; };
const text = (value, max = 2000) => normalizeText(value).slice(0, max);
const RELATIONSHIPS = new Set(['manufacturer','brand_owner','oem','private_label','unknown']);
const VERIFY = new Set(['pending','unverified','verified']);
const PUBLICATION = new Set(['private','internal','approved_public','archived']);
const PLATFORMS = new Set(['local','amazon','vevor','ebay','etsy','other']);

function canonicalKey(value) {
  return text(value, 180).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function safeUrl(value) {
  const raw = text(value, 1000);
  if (!raw) return null;
  try { const url = new URL(raw); return ['http:','https:'].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}
async function access(request, env) {
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return { response: json({ ok: false, release: CURRENT_RELEASE, error: 'Admin access required.' }, 401) };
  const db = getDb(env);
  if (!db) return { response: json({ ok: false, release: CURRENT_RELEASE, error: 'Database binding is not configured.' }, 500) };
  const schema = await productLineageSchemaReadiness(db);
  if (!schema.ok) return { response: json({ ok: false, release: CURRENT_RELEASE, code: 'manufacturer_review_schema_not_ready', error: `Release 448 manufacturer/review schema is not ready: ${schema.missing_tables.join(', ')}.`, missing_tables: schema.missing_tables }, 503) };
  return { adminUser, db };
}
async function inventoryItem(db, inventoryId) {
  return db.prepare(`SELECT site_item_inventory_id,source_type,external_key,item_name,category,supplier_name,supplier_sku,amazon_url,is_active,on_hand_quantity,stock_unit_label FROM site_item_inventory WHERE site_item_inventory_id=? AND LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply') LIMIT 1`).bind(inventoryId).first();
}
async function manufacturers(db) {
  const result = await db.prepare(`SELECT manufacturer_id,manufacturer_name,canonical_key,website_url,notes,status,created_at,updated_at FROM inventory_manufacturers WHERE status='active' ORDER BY LOWER(manufacturer_name),manufacturer_id`).all();
  return rows(result).map((row) => ({ ...row, manufacturer_id: id(row.manufacturer_id) }));
}
async function loadDetail(db, inventoryId) {
  const item = await inventoryItem(db, inventoryId);
  if (!item) return null;
  const link = await db.prepare(`
    SELECT iml.site_item_inventory_id,iml.manufacturer_id,iml.relationship_type,iml.verification_status,
           iml.external_item_id,iml.evidence_reference,iml.review_note,iml.reviewed_by_user_id,iml.reviewed_at,
           im.manufacturer_name,im.canonical_key,im.website_url
    FROM inventory_manufacturer_links iml
    JOIN inventory_manufacturers im ON im.manufacturer_id=iml.manufacturer_id
    WHERE iml.site_item_inventory_id=? LIMIT 1
  `).bind(inventoryId).first().catch(() => null);
  const result = await db.prepare(`
    SELECT r.inventory_vendor_review_id,r.site_item_inventory_id,r.manufacturer_id,r.vendor_name,r.platform_code,
           r.external_item_id,r.source_url,r.external_review_url,r.review_title,r.review_body,r.rating_value,r.review_date,
           r.verification_status,r.publication_status,r.created_by_user_id,r.verified_by_user_id,r.verified_at,r.created_at,r.updated_at,
           COALESCE(im.manufacturer_name,'') AS manufacturer_name
    FROM inventory_vendor_reviews r
    LEFT JOIN inventory_manufacturers im ON im.manufacturer_id=r.manufacturer_id
    WHERE r.site_item_inventory_id=? AND r.publication_status<>'archived'
    ORDER BY COALESCE(r.review_date,r.created_at) DESC,r.inventory_vendor_review_id DESC
  `).bind(inventoryId).all();
  return {
    item: { ...item, site_item_inventory_id: id(item.site_item_inventory_id), on_hand_quantity: Number(item.on_hand_quantity || 0) },
    manufacturer_link: link ? { ...link, site_item_inventory_id: id(link.site_item_inventory_id), manufacturer_id: id(link.manufacturer_id) } : null,
    reviews: rows(result).map((row) => ({ ...row, inventory_vendor_review_id: id(row.inventory_vendor_review_id), site_item_inventory_id: id(row.site_item_inventory_id), manufacturer_id: id(row.manufacturer_id) || null, rating_value: row.rating_value == null ? null : Number(row.rating_value) })),
  };
}

export async function onRequestGet({ request, env }) {
  const granted = await access(request, env); if (granted.response) return granted.response;
  const url = new URL(request.url);
  const inventoryId = id(url.searchParams.get('inventory_id'));
  const q = text(url.searchParams.get('q'), 120).toLowerCase();
  const like = `%${q}%`;
  const limit = Math.max(20, Math.min(1000, Number(url.searchParams.get('limit') || 500)));
  if (inventoryId) {
    const detail = await loadDetail(granted.db, inventoryId);
    if (!detail) return json({ ok: false, release: CURRENT_RELEASE, error: 'Tool/Supply Inventory item not found.' }, 404);
    return json({ ok: true, release: CURRENT_RELEASE, ...detail, manufacturers: await manufacturers(granted.db), marketplace_runtime_dependency: false, stock_mutation_capability: 'none' });
  }
  const result = await granted.db.prepare(`
    SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,sii.supplier_name,sii.supplier_sku,sii.amazon_url,sii.is_active,
           im.manufacturer_id,COALESCE(im.manufacturer_name,'') AS manufacturer_name,
           COALESCE(iml.verification_status,'') AS manufacturer_verification_status,
           (SELECT COUNT(*) FROM inventory_vendor_reviews r WHERE r.site_item_inventory_id=sii.site_item_inventory_id AND r.publication_status<>'archived') AS review_count
    FROM site_item_inventory sii
    LEFT JOIN inventory_manufacturer_links iml ON iml.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN inventory_manufacturers im ON im.manufacturer_id=iml.manufacturer_id
    WHERE LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply') AND COALESCE(sii.is_active,1)=1
      AND (?='' OR LOWER(COALESCE(sii.item_name,'')) LIKE ? OR LOWER(COALESCE(sii.external_key,'')) LIKE ? OR LOWER(COALESCE(sii.supplier_name,'')) LIKE ? OR LOWER(COALESCE(im.manufacturer_name,'')) LIKE ?)
    ORDER BY CASE WHEN iml.site_item_inventory_id IS NULL THEN 0 ELSE 1 END,LOWER(COALESCE(sii.item_name,'')),sii.site_item_inventory_id
    LIMIT ?
  `).bind(q, like, like, like, like, limit).all();
  return json({
    ok: true,
    release: CURRENT_RELEASE,
    inventory: rows(result).map((row) => ({ ...row, site_item_inventory_id: id(row.site_item_inventory_id), manufacturer_id: id(row.manufacturer_id) || null, review_count: Number(row.review_count || 0) })),
    manufacturers: await manufacturers(granted.db),
    manufacturer_inference: 'never_from_supplier_without_review',
    marketplace_runtime_dependency: false,
    stock_mutation_capability: 'none',
  });
}

export async function onRequestPost(context) {
  const granted = await access(context.request, context.env); if (granted.response) return granted.response;
  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, release: CURRENT_RELEASE, error: 'Invalid JSON body.' }, 400); }
  const action = text(body.action, 60).toLowerCase();
  const inventoryId = id(body.site_item_inventory_id);
  if (!inventoryId || !await inventoryItem(granted.db, inventoryId)) return json({ ok: false, release: CURRENT_RELEASE, error: 'Choose a valid active Tool/Supply Inventory item.' }, 400);

  if (action === 'save_manufacturer') {
    let manufacturerId = id(body.manufacturer_id);
    const manufacturerName = text(body.manufacturer_name, 180);
    if (!manufacturerId) {
      if (!manufacturerName) return json({ ok: false, release: CURRENT_RELEASE, error: 'Choose an existing manufacturer or enter a manufacturer name.' }, 400);
      const key = canonicalKey(manufacturerName);
      if (!key) return json({ ok: false, release: CURRENT_RELEASE, error: 'Manufacturer name is not valid.' }, 400);
      await granted.db.prepare(`INSERT INTO inventory_manufacturers(manufacturer_name,canonical_key,website_url,notes,status,created_by_user_id,created_at,updated_at) VALUES(?,?,?,?, 'active',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(canonical_key) DO UPDATE SET manufacturer_name=excluded.manufacturer_name,website_url=COALESCE(excluded.website_url,inventory_manufacturers.website_url),notes=COALESCE(excluded.notes,inventory_manufacturers.notes),status='active',updated_at=CURRENT_TIMESTAMP`).bind(manufacturerName, key, safeUrl(body.website_url), text(body.manufacturer_notes, 2000) || null, granted.adminUser.user_id).run();
      const row = await granted.db.prepare(`SELECT manufacturer_id FROM inventory_manufacturers WHERE canonical_key=? LIMIT 1`).bind(key).first();
      manufacturerId = id(row?.manufacturer_id);
    }
    if (!manufacturerId) return json({ ok: false, release: CURRENT_RELEASE, error: 'Manufacturer could not be resolved.' }, 400);
    const relationship = RELATIONSHIPS.has(text(body.relationship_type, 40).toLowerCase()) ? text(body.relationship_type, 40).toLowerCase() : 'manufacturer';
    const verification = VERIFY.has(text(body.verification_status, 40).toLowerCase()) ? text(body.verification_status, 40).toLowerCase() : 'unverified';
    await granted.db.prepare(`INSERT INTO inventory_manufacturer_links(site_item_inventory_id,manufacturer_id,relationship_type,verification_status,external_item_id,evidence_reference,review_note,reviewed_by_user_id,reviewed_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET manufacturer_id=excluded.manufacturer_id,relationship_type=excluded.relationship_type,verification_status=excluded.verification_status,external_item_id=excluded.external_item_id,evidence_reference=excluded.evidence_reference,review_note=excluded.review_note,reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(inventoryId, manufacturerId, relationship, verification, text(body.external_item_id, 200) || null, text(body.evidence_reference, 1000) || null, text(body.review_note, 2000) || null, granted.adminUser.user_id).run();
    await auditAdminAction(context.env, context.request, granted.adminUser, { action_type: 'inventory_manufacturer_link_saved', target_type: 'site_item_inventory', target_id: inventoryId, details: { manufacturer_id: manufacturerId, relationship_type: relationship, verification_status: verification } });
    return json({ ok: true, release: CURRENT_RELEASE, message: 'Manufacturer provenance saved. Inventory quantity was not changed.', ...(await loadDetail(granted.db, inventoryId)), manufacturers: await manufacturers(granted.db) });
  }

  if (action === 'save_review') {
    const reviewId = id(body.inventory_vendor_review_id);
    const reviewBody = text(body.review_body, 8000);
    if (reviewBody.length < 5) return json({ ok: false, release: CURRENT_RELEASE, error: 'Add the Devil n Dove-authored review text.' }, 400);
    const platform = PLATFORMS.has(text(body.platform_code, 40).toLowerCase()) ? text(body.platform_code, 40).toLowerCase() : 'other';
    const publication = PUBLICATION.has(text(body.publication_status, 40).toLowerCase()) ? text(body.publication_status, 40).toLowerCase() : 'private';
    const verification = VERIFY.has(text(body.verification_status, 40).toLowerCase()) ? text(body.verification_status, 40).toLowerCase() : 'unverified';
    let rating = body.rating_value == null || body.rating_value === '' ? null : Number(body.rating_value);
    if (rating != null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) return json({ ok: false, release: CURRENT_RELEASE, error: 'Rating must be between 0 and 5.' }, 400);
    const linked = await granted.db.prepare(`SELECT manufacturer_id FROM inventory_manufacturer_links WHERE site_item_inventory_id=? LIMIT 1`).bind(inventoryId).first();
    const manufacturerId = id(body.manufacturer_id) || id(linked?.manufacturer_id) || null;
    if (reviewId) {
      await granted.db.prepare(`UPDATE inventory_vendor_reviews SET manufacturer_id=?,vendor_name=?,platform_code=?,external_item_id=?,source_url=?,external_review_url=?,review_title=?,review_body=?,rating_value=?,review_date=?,verification_status=?,publication_status=?,verified_by_user_id=?,verified_at=CASE WHEN ?='verified' THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE inventory_vendor_review_id=? AND site_item_inventory_id=?`).bind(manufacturerId, text(body.vendor_name, 180) || null, platform, text(body.external_item_id, 200) || null, safeUrl(body.source_url), safeUrl(body.external_review_url), text(body.review_title, 300) || null, reviewBody, rating, text(body.review_date, 40) || null, verification, publication, verification === 'verified' ? granted.adminUser.user_id : null, verification, reviewId, inventoryId).run();
    } else {
      await granted.db.prepare(`INSERT INTO inventory_vendor_reviews(site_item_inventory_id,manufacturer_id,vendor_name,platform_code,external_item_id,source_url,external_review_url,review_title,review_body,rating_value,review_date,verification_status,publication_status,created_by_user_id,verified_by_user_id,verified_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CASE WHEN ?='verified' THEN CURRENT_TIMESTAMP ELSE NULL END,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(inventoryId, manufacturerId, text(body.vendor_name, 180) || null, platform, text(body.external_item_id, 200) || null, safeUrl(body.source_url), safeUrl(body.external_review_url), text(body.review_title, 300) || null, reviewBody, rating, text(body.review_date, 40) || null, verification, publication, granted.adminUser.user_id, verification === 'verified' ? granted.adminUser.user_id : null, verification).run();
    }
    await auditAdminAction(context.env, context.request, granted.adminUser, { action_type: 'inventory_vendor_review_saved', target_type: 'site_item_inventory', target_id: inventoryId, details: { platform_code: platform, publication_status: publication, verification_status: verification, external_item_id: text(body.external_item_id, 200) || null } });
    return json({ ok: true, release: CURRENT_RELEASE, message: 'Devil n Dove purchased-item review saved locally. No marketplace was contacted.', ...(await loadDetail(granted.db, inventoryId)), manufacturers: await manufacturers(granted.db), marketplace_contacted: false });
  }

  if (action === 'archive_review') {
    const reviewId = id(body.inventory_vendor_review_id);
    if (!reviewId) return json({ ok: false, release: CURRENT_RELEASE, error: 'Review id is required.' }, 400);
    await granted.db.prepare(`UPDATE inventory_vendor_reviews SET publication_status='archived',updated_at=CURRENT_TIMESTAMP WHERE inventory_vendor_review_id=? AND site_item_inventory_id=?`).bind(reviewId, inventoryId).run();
    await auditAdminAction(context.env, context.request, granted.adminUser, { action_type: 'inventory_vendor_review_archived', target_type: 'site_item_inventory', target_id: inventoryId, details: { inventory_vendor_review_id: reviewId } });
    return json({ ok: true, release: CURRENT_RELEASE, message: 'Review archived locally.', ...(await loadDetail(granted.db, inventoryId)), manufacturers: await manufacturers(granted.db) });
  }

  return json({ ok: false, release: CURRENT_RELEASE, error: 'Unsupported manufacturer/review action.' }, 400);
}
