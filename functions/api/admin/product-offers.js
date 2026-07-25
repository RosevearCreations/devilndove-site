// Build 220 — review-first volume pricing and component-reserved product sets.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  ensureProductOffersSchema,
  getBundleDetails,
  getQuantityPriceTiers,
  normalizeRows,
  reserveBundleComponents
} from '../_lib/productOffers.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function whole(value, fallback = 0) { const n = Number(value); return Number.isInteger(n) && n >= 0 ? n : fallback; }

async function requireAdmin(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function productOptions(db, excludeProductId = 0) {
  const result = await db.prepare(`
    SELECT product_id, product_number, name, sku, status,
           COALESCE(inventory_tracking,0) inventory_tracking,
           COALESCE(inventory_quantity,0) inventory_quantity,
           featured_image_url
    FROM products
    WHERE product_id <> ? AND COALESCE(status,'draft') <> 'archived'
    ORDER BY LOWER(COALESCE(name,'')), product_id
    LIMIT 1000
  `).bind(Number(excludeProductId || 0)).all();
  return normalizeRows(result).map((row) => ({
    ...row,
    product_id: Number(row.product_id || 0),
    product_number: Number(row.product_number || 0),
    inventory_tracking: Number(row.inventory_tracking || 0),
    inventory_quantity: Math.max(0, Number(row.inventory_quantity || 0))
  }));
}

async function detail(db, productId) {
  const product = await db.prepare(`
    SELECT product_id, product_number, name, sku, status, price_cents, currency,
           COALESCE(inventory_tracking,0) inventory_tracking,
           COALESCE(inventory_quantity,0) inventory_quantity
    FROM products WHERE product_id = ? LIMIT 1
  `).bind(productId).first();
  if (!product) return null;
  return {
    product,
    quantity_tiers: await getQuantityPriceTiers(db, productId),
    bundle: await getBundleDetails(db, productId),
    product_options: await productOptions(db, productId)
  };
}

export async function onRequestGet(context) {
  const access = await requireAdmin(context); if (access.error) return access.error;
  try {
    await ensureProductOffersSchema(access.db);
    const productId = whole(new URL(context.request.url).searchParams.get('product_id'));
    if (!productId) return json({ ok: true, detail: null, product_options: await productOptions(access.db) });
    const item = await detail(access.db, productId);
    if (!item) return json({ ok: false, error: 'Product not found.' }, 404);
    return json({ ok: true, detail: item });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Product offers could not load.' }, 500);
  }
}

export async function onRequestPost(context) {
  const access = await requireAdmin(context); if (access.error) return access.error;
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();
  const productId = whole(body.product_id);
  if (!productId) return json({ ok: false, error: 'A product is required.' }, 400);
  try {
    await ensureProductOffersSchema(access.db);
    const product = await access.db.prepare(`SELECT product_id, name, price_cents FROM products WHERE product_id=? LIMIT 1`).bind(productId).first();
    if (!product) return json({ ok: false, error: 'Product not found.' }, 404);
    let message = 'Saved.';
    let auditDetails = {};

    if (action === 'save_quantity_tiers') {
      const rows = (Array.isArray(body.tiers) ? body.tiers : []).map((row, index) => ({
        min_quantity: whole(row?.min_quantity),
        unit_price_cents: whole(row?.unit_price_cents),
        label: normalizeText(row?.label).slice(0, 120) || null,
        sort_order: index
      })).filter((row) => row.min_quantity >= 2);
      const unique = new Set(rows.map((row) => row.min_quantity));
      if (unique.size !== rows.length) throw new Error('Each quantity break must use a different minimum quantity.');
      rows.sort((a, b) => a.min_quantity - b.min_quantity);
      let priorPrice = Math.max(0, Number(product.price_cents || 0));
      for (const row of rows) {
        if (row.unit_price_cents <= 0) throw new Error('Each special price must be greater than zero.');
        if (row.unit_price_cents > priorPrice) throw new Error('Each higher quantity tier must be the same price or less per item than the tier before it.');
        priorPrice = row.unit_price_cents;
      }
      const statements = [access.db.prepare(`DELETE FROM product_quantity_price_tiers WHERE product_id=?`).bind(productId)];
      rows.forEach((row) => statements.push(access.db.prepare(`
        INSERT INTO product_quantity_price_tiers (product_id,min_quantity,unit_price_cents,label,is_active,sort_order,created_by_user_id,created_at,updated_at)
        VALUES (?,?,?,?,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `).bind(productId,row.min_quantity,row.unit_price_cents,row.label,row.sort_order,access.adminUser.user_id)));
      if (typeof access.db.batch === 'function') await access.db.batch(statements); else for (const statement of statements) await statement.run();
      message = rows.length ? `${rows.length} quantity special${rows.length === 1 ? '' : 's'} saved.` : 'Quantity specials removed.';
      auditDetails = { tier_count: rows.length, tiers: rows };
    } else if (action === 'save_bundle') {
      const result = await reserveBundleComponents(access.db, {
        bundleProductId: productId,
        requestedBundleQuantity: body.requested_bundle_quantity,
        components: body.components,
        actorUserId: access.adminUser.user_id
      });
      message = result.reservation_status === 'reserved'
        ? `${result.reserved_bundle_quantity} complete set${result.reserved_bundle_quantity === 1 ? '' : 's'} reserved.`
        : result.reserved_bundle_quantity > 0
          ? `${result.reserved_bundle_quantity} complete set${result.reserved_bundle_quantity === 1 ? '' : 's'} reserved; shortages prevent the full requested quantity.`
          : 'No complete set can be reserved. Storefront availability is now zero.';
      auditDetails = result;
    } else if (action === 'release_bundle') {
      const result = await reserveBundleComponents(access.db, {
        bundleProductId: productId,
        requestedBundleQuantity: 0,
        components: Array.isArray(body.components) && body.components.length ? body.components : (await getBundleDetails(access.db, productId)).components,
        actorUserId: access.adminUser.user_id
      });
      message = 'Set reservations released and storefront set quantity changed to zero.';
      auditDetails = result;
    } else {
      return json({ ok: false, error: 'Unsupported product-offer action.' }, 400);
    }

    const current = await detail(access.db, productId);
    await auditAdminAction(context.env, context.request, access.adminUser, {
      action_type: `product_offer_${action}`,
      target_type: 'product', target_id: productId, target_key: product.name || String(productId),
      details: auditDetails
    });
    return json({ ok: true, message, detail: current });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Product offers could not be saved.' }, 400);
  }
}
