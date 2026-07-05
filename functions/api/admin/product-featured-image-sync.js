// Build 208 — explicit product featured-image sync.
// An administrator may mirror a known gallery/media-library image URL into
// products.featured_image_url. This route never changes source media, media order,
// annotations, consent records, CAIP assets, or public-release state.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200) {
  return jsonResponse(data, status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
}

function text(value, max = 0) {
  const clean = normalizeText(value);
  return max > 0 ? clean.slice(0, max).trim() : clean;
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1")
    .bind(tableName).first().catch(() => null);
  return Boolean(row);
}

async function columnsFor(db, tableName) {
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  return new Set(rows(result).map((item) => text(item?.name)).filter(Boolean));
}

async function resolveCandidates(db, productId) {
  const candidates = [];
  const product = await db.prepare('SELECT product_id, name, featured_image_url FROM products WHERE product_id=? LIMIT 1')
    .bind(productId).first().catch(() => null);
  if (!product) return { product: null, candidates: [] };

  const productImagesExist = await tableExists(db, 'product_images');
  if (productImagesExist) {
    const cols = await columnsFor(db, 'product_images');
    if (cols.has('product_id') && cols.has('image_url')) {
      const idExpr = cols.has('product_image_id') ? 'product_image_id' : 'rowid';
      const orderExpr = cols.has('sort_order') ? 'sort_order' : idExpr;
      const imageRows = rows(await db.prepare(`SELECT ${idExpr} AS source_id, image_url, ${orderExpr} AS sort_order
        FROM product_images WHERE product_id=? AND LENGTH(TRIM(COALESCE(image_url,'')))>0
        ORDER BY ${orderExpr} ASC, ${idExpr} ASC`).bind(productId).all().catch(() => ({ results: [] })));
      imageRows.forEach((row) => candidates.push({
        source: 'product_images', source_id: number(row.source_id), image_url: text(row.image_url), sort_order: Number(row.sort_order || 0)
      }));
    }
  }

  const mediaAssetsExist = await tableExists(db, 'media_assets');
  if (mediaAssetsExist) {
    const cols = await columnsFor(db, 'media_assets');
    if (cols.has('product_id') && cols.has('public_url')) {
      const idExpr = cols.has('media_asset_id') ? 'media_asset_id' : 'rowid';
      const orderExpr = cols.has('sort_order') ? 'sort_order' : idExpr;
      const roleExpr = cols.has('variant_role') ? 'variant_role' : "''";
      const deletedClause = cols.has('deleted_at') ? 'AND deleted_at IS NULL' : '';
      const assetRows = rows(await db.prepare(`SELECT ${idExpr} AS source_id, public_url AS image_url, ${roleExpr} AS variant_role, ${orderExpr} AS sort_order
        FROM media_assets WHERE product_id=? AND LENGTH(TRIM(COALESCE(public_url,'')))>0 ${deletedClause}
        ORDER BY CASE LOWER(COALESCE(${roleExpr},'')) WHEN 'featured' THEN 0 WHEN 'hero_front' THEN 1 ELSE 2 END,
          COALESCE(${orderExpr},999999) ASC, ${idExpr} ASC`).bind(productId).all().catch(() => ({ results: [] })));
      assetRows.forEach((row) => candidates.push({
        source: 'media_assets', source_id: number(row.source_id), image_url: text(row.image_url), sort_order: Number(row.sort_order || 999999), variant_role: text(row.variant_role)
      }));
    }
  }

  const unique = new Map();
  for (const candidate of candidates) {
    if (candidate.image_url && !unique.has(candidate.image_url)) unique.set(candidate.image_url, candidate);
  }
  return {
    product: { product_id: number(product.product_id), name: text(product.name), featured_image_url: text(product.featured_image_url) },
    candidates: [...unique.values()]
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const productId = number(body.product_id);
  if (!productId) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  try {
    const resolved = await resolveCandidates(db, productId);
    if (!resolved.product) return json({ ok: false, error: 'Product not found.' }, 404);
    const requestedUrl = text(body.candidate_url, 1800);
    const chosen = requestedUrl
      ? resolved.candidates.find((candidate) => candidate.image_url === requestedUrl)
      : resolved.candidates[0];
    if (!chosen?.image_url) {
      return json({ ok: false, error: 'No retained product-image or media-library URL is available to sync.' }, 422);
    }

    const previous = text(resolved.product.featured_image_url);
    const changeRequired = previous !== chosen.image_url;
    if (changeRequired) {
      await db.prepare('UPDATE products SET featured_image_url=?, updated_at=CURRENT_TIMESTAMP WHERE product_id=?')
        .bind(chosen.image_url, productId).run();
    }

    if (await tableExists(db, 'product_media_change_audit')) {
      await db.prepare(`INSERT INTO product_media_change_audit (
        product_id, action_key, media_kind, media_url, details_json, created_by_user_id, created_at
      ) VALUES (?, ?, 'image', ?, ?, ?, CURRENT_TIMESTAMP)`).bind(
        productId,
        changeRequired ? 'featured_image_synced' : 'featured_image_sync_no_change',
        chosen.image_url,
        JSON.stringify({ previous_featured_image_url: previous || null, source: chosen.source, source_id: chosen.source_id || null, explicit_operator_action: true }),
        number(adminUser.user_id) || null
      ).run().catch(() => null);
    }

    await auditAdminAction(env, request, adminUser, {
      action_type: changeRequired ? 'product_featured_image_synced' : 'product_featured_image_sync_no_change',
      target_type: 'product',
      target_id: productId,
      target_key: String(productId),
      details: { previous_featured_image_url: previous || null, featured_image_url: chosen.image_url, source: chosen.source, source_id: chosen.source_id || null, source_media_unchanged: true }
    }).catch(() => null);

    return json({
      ok: true,
      changed: changeRequired,
      product: { product_id: productId, name: resolved.product.name, featured_image_url: chosen.image_url },
      source: { source: chosen.source, source_id: chosen.source_id || null },
      message: changeRequired ? 'Featured image URL was synced from an existing retained media row.' : 'The product already uses this featured image URL.'
    });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'catalog_media',
      incident_code: 'featured_image_sync_failed',
      severity: 'error',
      message: 'Explicit featured-image sync failed.',
      related_user_id: number(adminUser.user_id) || null,
      details: { product_id: productId, error: text(error?.message || error, 500) }
    }).catch(() => null);
    return json({ ok: false, error: 'Could not sync the featured image URL.', detail: text(error?.message || error, 500) }, 500);
  }
}
