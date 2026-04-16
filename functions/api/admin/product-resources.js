// File: /functions/api/admin/product-resources.js
import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText
} from "../_lib/adminAudit.js";

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

const DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL = 'https://assets.devilndove.com';

function getProductMediaPublicBase(env) {
  return normalizeText(
    env.PRODUCT_MEDIA_PUBLIC_BASE_URL ||
    env.R2_PUBLIC_BASE_URL ||
    env.PUBLIC_R2_BASE_URL ||
    env.ASSET_ORIGIN ||
    DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL
  );
}

function normalizeImageUrl(env, value) {
  const cleanValue = normalizeText(value);
  if (!cleanValue) return '';
  if (/^https?:\/\//i.test(cleanValue) || cleanValue.startsWith('data:') || cleanValue.startsWith('blob:')) {
    return cleanValue;
  }
  const base = getProductMediaPublicBase(env);
  return base ? `${base.replace(/\/$/, '')}/${cleanValue.replace(/^\/+/, '')}` : cleanValue;
}

function json(data, status = 200) {
  return jsonResponse(data, status);
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function coalesceSql(expressions, fallback = "NULL") {
  const usable = expressions.filter(Boolean);
  if (!usable.length) return fallback;
  if (usable.length === 1) return usable[0];
  return `COALESCE(${usable.join(', ')})`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) {
    return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  }

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  try {
    const [inventoryColumns, catalogColumns] = await Promise.all([
      getTableColumnSet(db, 'site_item_inventory'),
      getTableColumnSet(db, 'catalog_items')
    ]);

    const url = new URL(request.url);
    const productId = Number(url.searchParams.get('product_id') || 0);
    const query = normalizeText(url.searchParams.get('q')).toLowerCase();
    const like = `%${query}%`;

    const inventoryKindExpr = coalesceSql([
      inventoryColumns.has('item_kind') ? 'sii.item_kind' : '',
      inventoryColumns.has('source_type') ? 'sii.source_type' : ''
    ], "'supply'");

    const inventorySourceTypeExpr = coalesceSql([
      inventoryColumns.has('source_type') ? 'sii.source_type' : '',
      inventoryColumns.has('item_kind') ? 'sii.item_kind' : ''
    ], "'supply'");

    const inventoryExternalKeyExpr = coalesceSql([
      inventoryColumns.has('external_key') ? 'sii.external_key' : '',
      inventoryColumns.has('source_key') ? 'sii.source_key' : ''
    ], "NULL");

    const inventoryNameExpr = coalesceSql([
      inventoryColumns.has('item_name') ? 'sii.item_name' : '',
      inventoryColumns.has('name') ? 'sii.name' : '',
      inventoryExternalKeyExpr !== "NULL" ? inventoryExternalKeyExpr : ''
    ], "''");

    const inventoryCategoryExpr = inventoryColumns.has('category') ? 'sii.category' : "''";
    const inventorySubcategoryExpr = inventoryColumns.has('subcategory') ? 'sii.subcategory' : "''";
    const inventoryOnHandExpr = coalesceSql([
      inventoryColumns.has('on_hand_quantity') ? 'sii.on_hand_quantity' : '',
      inventoryColumns.has('quantity_on_hand') ? 'sii.quantity_on_hand' : '',
      inventoryColumns.has('quantity') ? 'sii.quantity' : ''
    ], '0');
    const inventoryReorderExpr = coalesceSql([
      inventoryColumns.has('is_on_reorder_list') ? 'sii.is_on_reorder_list' : '',
      inventoryColumns.has('reorder_flag') ? 'sii.reorder_flag' : ''
    ], '0');
    const inventoryDoNotReuseExpr = inventoryColumns.has('do_not_reuse') ? 'sii.do_not_reuse' : '0';
    const inventoryImageExpr = coalesceSql([
      inventoryColumns.has('image_url') ? 'sii.image_url' : '',
      inventoryColumns.has('featured_image_url') ? 'sii.featured_image_url' : ''
    ], "''");
    const inventoryIdExpr = inventoryColumns.has('site_item_inventory_id') ? 'sii.site_item_inventory_id' : '0';

    const canJoinCatalogInventory =
      catalogColumns.has('item_kind') &&
      catalogColumns.has('source_key') &&
      (inventoryColumns.has('source_type') || inventoryColumns.has('item_kind')) &&
      (inventoryColumns.has('external_key') || inventoryColumns.has('source_key'));

    const catalogInventoryJoinSql = canJoinCatalogInventory
      ? `
        LEFT JOIN site_item_inventory sii
          ON ${inventorySourceTypeExpr} = ci.item_kind
         AND ${inventoryExternalKeyExpr} = ci.source_key
      `
      : `
        LEFT JOIN site_item_inventory sii
          ON 1 = 0
      `;

    const products = normalizeResults(
      await db.prepare(`
        SELECT product_id, name, slug, featured_image_url, status
        FROM products
        ORDER BY LOWER(COALESCE(name, '')) ASC
        LIMIT 300
      `).all()
    ).map((row) => ({
      product_id: Number(row.product_id || 0),
      name: row.name || '',
      slug: row.slug || '',
      featured_image_url: normalizeImageUrl(env, row.featured_image_url || ''),
      status: row.status || ''
    }));

    const catalogResources = normalizeResults(
      await db.prepare(`
        SELECT
          ci.item_kind,
          ci.source_key,
          ci.name,
          ci.image_url,
          ci.category,
          ci.subcategory,
          ${inventoryIdExpr} AS site_item_inventory_id,
          ${inventoryOnHandExpr} AS on_hand_quantity,
          ${inventoryReorderExpr} AS is_on_reorder_list,
          ${inventoryDoNotReuseExpr} AS do_not_reuse
        FROM catalog_items ci
        ${catalogInventoryJoinSql}
        WHERE ci.item_kind IN ('tool', 'supply')
          AND COALESCE(ci.status, 'active') != 'archived'
          AND (
            ? = ''
            OR LOWER(COALESCE(ci.name, '')) LIKE ?
            OR LOWER(COALESCE(ci.category, '')) LIKE ?
            OR LOWER(COALESCE(ci.subcategory, '')) LIKE ?
          )
        ORDER BY ci.item_kind ASC, LOWER(COALESCE(ci.name, '')) ASC
        LIMIT 500
      `).bind(query, like, like, like).all()
    ).map((row) => ({
      item_kind: row.item_kind || '',
      source_key: row.source_key || '',
      name: row.name || '',
      image_url: normalizeImageUrl(env, row.image_url || ''),
      category: row.category || '',
      subcategory: row.subcategory || '',
      site_item_inventory_id: Number(row.site_item_inventory_id || 0),
      on_hand_quantity: Number(row.on_hand_quantity || 0),
      is_on_reorder_list: Number(row.is_on_reorder_list || 0),
      do_not_reuse: Number(row.do_not_reuse || 0)
    }));

    const canReadInventoryOnly =
      inventoryColumns.size > 0 &&
      (inventoryColumns.has('item_name') || inventoryColumns.has('name') || inventoryColumns.has('external_key') || inventoryColumns.has('source_key'));

    const inventoryOnlySql = canReadInventoryOnly
      ? `
        SELECT
          ${inventoryIdExpr} AS site_item_inventory_id,
          ${inventoryNameExpr} AS item_name,
          ${inventoryKindExpr} AS item_kind,
          ${inventorySourceTypeExpr} AS source_type,
          ${inventoryExternalKeyExpr} AS external_key,
          ${inventoryCategoryExpr} AS category,
          ${inventorySubcategoryExpr} AS subcategory,
          ${inventoryOnHandExpr} AS on_hand_quantity,
          ${inventoryReorderExpr} AS is_on_reorder_list,
          ${inventoryDoNotReuseExpr} AS do_not_reuse,
          ${inventoryImageExpr} AS image_url
        FROM site_item_inventory sii
        WHERE ${inventoryKindExpr} IN ('tool', 'supply')
          AND (
            ? = ''
            OR LOWER(COALESCE(${inventoryNameExpr}, '')) LIKE ?
            OR LOWER(COALESCE(${inventoryCategoryExpr}, '')) LIKE ?
            OR LOWER(COALESCE(${inventorySubcategoryExpr}, '')) LIKE ?
          )
          ${canJoinCatalogInventory ? `
          AND NOT EXISTS (
            SELECT 1
            FROM catalog_items ci
            WHERE ci.item_kind = ${inventoryKindExpr}
              AND ci.source_key = ${inventoryExternalKeyExpr}
          )` : ''}
        ORDER BY LOWER(COALESCE(${inventoryNameExpr}, '')) ASC
        LIMIT 300
      `
      : null;

    const inventoryOnlyResources = inventoryOnlySql
      ? normalizeResults(
          await db.prepare(inventoryOnlySql).bind(query, like, like, like).all()
        ).map((row) => {
          const itemKind = row.item_kind || row.source_type || 'supply';
          const sourceKey = row.external_key || `inventory:${row.site_item_inventory_id}`;
          return {
            item_kind: itemKind,
            source_key: sourceKey,
            name: row.item_name || sourceKey,
            image_url: normalizeImageUrl(env, row.image_url || ''),
            category: row.category || '',
            subcategory: row.subcategory || '',
            site_item_inventory_id: Number(row.site_item_inventory_id || 0),
            on_hand_quantity: Number(row.on_hand_quantity || 0),
            is_on_reorder_list: Number(row.is_on_reorder_list || 0),
            do_not_reuse: Number(row.do_not_reuse || 0)
          };
        })
      : [];

    const resourceMap = new Map();
    [...catalogResources, ...inventoryOnlyResources].forEach((item) => {
      const key = `${item.item_kind}::${item.source_key}`;
      if (!resourceMap.has(key)) resourceMap.set(key, item);
    });

    const resources = Array.from(resourceMap.values());

    const links = productId
      ? normalizeResults(
          await db.prepare(`
            SELECT
              product_resource_link_id,
              product_id,
              resource_kind,
              source_key,
              quantity_used,
              usage_notes,
              sort_order
            FROM product_resource_links
            WHERE product_id = ?
            ORDER BY sort_order ASC, product_resource_link_id ASC
          `).bind(productId).all()
        )
      : [];

    return json({
      ok: true,
      products,
      resources,
      links: links.map((row) => ({
        product_resource_link_id: Number(row.product_resource_link_id || 0),
        product_id: Number(row.product_id || 0),
        resource_kind: row.resource_kind || '',
        source_key: row.source_key || '',
        quantity_used: Number(row.quantity_used || 0),
        usage_notes: row.usage_notes || '',
        sort_order: Number(row.sort_order || 0)
      }))
    });
  } catch (error) {
    return json({
      ok: false,
      error: error?.message || 'Failed to load product tools and supplies.'
    }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) {
    return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  }

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) {
    return json({ ok: false, error: 'Unauthorized.' }, 401);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  try {
    const productId = Number(body.product_id || 0);
    const links = Array.isArray(body.links) ? body.links : [];

    if (!productId) {
      return json({ ok: false, error: 'product_id is required.' }, 400);
    }

    const product = await db
      .prepare(`SELECT product_id FROM products WHERE product_id = ? LIMIT 1`)
      .bind(productId)
      .first();

    if (!product) {
      return json({ ok: false, error: 'Product not found.' }, 404);
    }

    await db.prepare(`DELETE FROM product_resource_links WHERE product_id = ?`).bind(productId).run();

    let saved = 0;
    for (let i = 0; i < links.length; i += 1) {
      const row = links[i] || {};
      const resourceKind = normalizeText(row.resource_kind).toLowerCase();
      const sourceKey = normalizeText(row.source_key);

      if (!['tool', 'supply'].includes(resourceKind) || !sourceKey) continue;

      await db.prepare(`
        INSERT INTO product_resource_links (
          product_id,
          resource_kind,
          source_key,
          quantity_used,
          usage_notes,
          sort_order,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        productId,
        resourceKind,
        sourceKey,
        Math.max(1, Number(row.quantity_used || 1) || 1),
        normalizeText(row.usage_notes) || null,
        Number(row.sort_order ?? i)
      ).run();

      saved += 1;
    }

    return json({ ok: true, saved_links: saved });
  } catch (error) {
    return json({
      ok: false,
      error: error?.message || 'Failed to save product links.'
    }, 500);
  }
}
