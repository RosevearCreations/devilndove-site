// Build 440: lightweight D1-authoritative product/resource loaders with fractional usage support.
// Inventory identity matching is case/whitespace normalized; missing/non-positive use-per-batch reads as 1.
// Schema creation belongs to numbered migrations; these helpers perform read-only queries only.

import { normalizeText } from '../_lib/adminAudit.js';

const DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL = 'https://assets.devilndove.com';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function positive(value, fallback = 1) { const parsed = number(value, fallback); return parsed > 0 ? parsed : fallback; }
function money(value) { return Math.max(0, Math.round(number(value, 0))); }

function publicBase(env) {
  return normalizeText(
    env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL || env.ASSET_ORIGIN || DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL
  );
}

export function normalizeResourceImageUrl(env, value) {
  const clean = normalizeText(value);
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) return clean;
  const base = publicBase(env);
  return base ? `${base.replace(/\/$/, '')}/${clean.replace(/^\/+/, '')}` : clean;
}

export function normalizeConsumptionMode(value) {
  const mode = normalizeText(value).toLowerCase();
  return ['per_unit', 'end_of_lot', 'story_only'].includes(mode) ? mode : 'per_unit';
}

export function resourcePreview(resource = {}, link = null) {
  const unitCostCents = money(resource.unit_cost_cents);
  const onHandQuantity = Math.max(0, number(resource.on_hand_quantity, 0));
  const usageUnitsPerStockUnit = Math.max(0.001, number(resource.usage_units_per_stock_unit, 1));
  const quantityUsed = positive(link?.quantity_used, 1);
  const productsPerLot = positive(link?.lot_size_units, 1);
  const consumptionMode = normalizeConsumptionMode(link?.consumption_mode);
  const totalUsageUnitsAvailable = onHandQuantity * usageUnitsPerStockUnit;
  let estimatedCostPerProductCents = 0;
  let buildableProducts = 0;

  if (consumptionMode === 'end_of_lot') {
    estimatedCostPerProductCents = productsPerLot > 0 ? Math.round(unitCostCents / productsPerLot) : unitCostCents;
    buildableProducts = onHandQuantity * productsPerLot;
  } else if (consumptionMode !== 'story_only') {
    estimatedCostPerProductCents = usageUnitsPerStockUnit > 0 ? Math.round((unitCostCents / usageUnitsPerStockUnit) * quantityUsed) : unitCostCents;
    buildableProducts = quantityUsed > 0 ? Math.floor(totalUsageUnitsAvailable / quantityUsed) : 0;
  }

  return {
    stock_unit_label: resource.stock_unit_label || 'stock unit',
    usage_unit_label: resource.usage_unit_label || 'unit',
    usage_units_per_stock_unit: usageUnitsPerStockUnit,
    estimated_cost_per_product_cents: Math.max(0, estimatedCostPerProductCents),
    buildable_products: Math.max(0, buildableProducts)
  };
}

export async function loadProducts(db, env, limit = 600) {
  const result = await db.prepare(`
    SELECT product_id, name, slug, featured_image_url, status
    FROM products
    ORDER BY LOWER(COALESCE(name, '')) ASC, product_id ASC
    LIMIT ?
  `).bind(Math.max(1, Math.min(1200, Number(limit || 600)))).all();
  return rows(result).map((row) => ({
    product_id: Number(row.product_id || 0),
    name: row.name || '',
    slug: row.slug || '',
    featured_image_url: normalizeResourceImageUrl(env, row.featured_image_url || ''),
    status: row.status || ''
  }));
}

export async function loadProductLinks(db, productId) {
  if (!Number(productId || 0)) return [];
  const result = await db.prepare(`
    WITH inventory_ranked AS (
      SELECT
        sii.*,
        LOWER(TRIM(COALESCE(sii.source_type, ''))) AS item_kind_norm,
        LOWER(TRIM(COALESCE(sii.external_key, ''))) AS source_key_norm,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(TRIM(COALESCE(sii.source_type, ''))), LOWER(TRIM(COALESCE(sii.external_key, '')))
          ORDER BY COALESCE(sii.is_active, 1) DESC, sii.site_item_inventory_id DESC
        ) AS rn
      FROM site_item_inventory sii
      WHERE LOWER(TRIM(COALESCE(sii.source_type, ''))) IN ('tool','supply')
    ),
    catalog_ranked AS (
      SELECT
        ci.*,
        LOWER(TRIM(COALESCE(ci.item_kind, ''))) AS item_kind_norm,
        LOWER(TRIM(COALESCE(ci.source_key, ''))) AS source_key_norm,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(TRIM(COALESCE(ci.item_kind, ''))), LOWER(TRIM(COALESCE(ci.source_key, '')))
          ORDER BY ci.catalog_item_id DESC
        ) AS rn
      FROM catalog_items ci
      WHERE LOWER(TRIM(COALESCE(ci.item_kind, ''))) IN ('tool','supply')
        AND COALESCE(ci.status, 'active') <> 'archived'
    ),
    lot_stats AS (
      SELECT
        site_item_inventory_id,
        COUNT(*) AS lot_count,
        SUM(CASE WHEN COALESCE(lot_status,'available')='available' AND COALESCE(quantity_remaining,0)>0 THEN 1 ELSE 0 END) AS available_lot_count,
        COALESCE(SUM(COALESCE(quantity_remaining,0)),0) AS lot_remaining_quantity,
        COALESCE(SUM(COALESCE(quantity_received,0) * COALESCE(unit_cost_cents,0)),0) AS lot_received_value_cents
      FROM inventory_purchase_lots
      GROUP BY site_item_inventory_id
    )
    SELECT
      prl.product_resource_link_id, prl.product_id, prl.resource_kind, prl.source_key,
      COALESCE(NULLIF(TRIM(sii.item_name), ''), NULLIF(TRIM(ci.name), ''), prl.source_key) AS resource_name,
      COALESCE(sii.category, ci.category, '') AS resource_category,
      sii.site_item_inventory_id,
      COALESCE(sii.is_active,0) AS resource_is_active,
      ci.catalog_item_id,
      COALESCE(sii.on_hand_quantity, 0) AS resource_on_hand_quantity,
      COALESCE(sii.reserved_quantity, 0) AS resource_reserved_quantity,
      COALESCE(sii.incoming_quantity, 0) AS resource_incoming_quantity,
      COALESCE(sii.unit_cost_cents, 0) AS resource_unit_cost_cents,
      COALESCE(sii.stock_unit_label, 'unit') AS resource_stock_unit_label,
      COALESCE(sii.usage_unit_label, 'unit') AS resource_usage_unit_label,
      COALESCE(sii.usage_units_per_stock_unit, 1) AS resource_usage_units_per_stock_unit,
      CASE WHEN siup.site_item_inventory_id IS NULL THEN 0 ELSE 1 END AS usage_profile_present,
      COALESCE(siup.usage_tracking_mode,
        CASE WHEN LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool' THEN 'reusable' ELSE 'exact' END
      ) AS resource_usage_tracking_mode,
      COALESCE(siup.minimum_usage_increment, 0.001) AS resource_minimum_usage_increment,
      COALESCE(ls.lot_count,0) AS lot_count,
      COALESCE(ls.available_lot_count,0) AS available_lot_count,
      COALESCE(ls.lot_remaining_quantity,0) AS lot_remaining_quantity,
      COALESCE(ls.lot_received_value_cents,0) AS lot_received_value_cents,
      COALESCE(ilp.depletion_method,'manual') AS lot_depletion_method,
      COALESCE(ilp.reconcile_status,'needs_review') AS lot_reconcile_status,
      ilp.last_reconciled_at AS lot_last_reconciled_at,
      prl.quantity_used, prl.usage_notes, prl.sort_order,
      COALESCE(prl.consumption_mode, 'per_unit') AS consumption_mode,
      COALESCE(prl.lot_size_units, 1) AS lot_size_units,
      COALESCE(prip.is_label_ingredient,0) AS is_label_ingredient,
      COALESCE(prip.ingredient_name_en,'') AS ingredient_name_en,
      COALESCE(prip.ingredient_name_fr,'') AS ingredient_name_fr,
      COALESCE(prip.inci_name,'') AS inci_name,
      COALESCE(prip.translation_review_status,'needs_review') AS translation_review_status
    FROM product_resource_links prl
    LEFT JOIN product_resource_ingredient_profiles prip
      ON prip.product_resource_link_id=prl.product_resource_link_id
    LEFT JOIN inventory_ranked sii
      ON sii.rn=1
     AND sii.item_kind_norm=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
     AND sii.source_key_norm=LOWER(TRIM(COALESCE(prl.source_key,'')))
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN catalog_ranked ci
      ON ci.rn=1
     AND ci.item_kind_norm=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
     AND ci.source_key_norm=LOWER(TRIM(COALESCE(prl.source_key,'')))
    LEFT JOIN lot_stats ls
      ON ls.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN inventory_lot_policies ilp
      ON ilp.site_item_inventory_id=sii.site_item_inventory_id
    WHERE prl.product_id=?
    ORDER BY prl.sort_order ASC, prl.product_resource_link_id ASC
  `).bind(Number(productId)).all();
  return rows(result).map((row) => {
    const rawQuantityUsed = number(row.quantity_used, 0);
    const rawLotSizeUnits = number(row.lot_size_units, 0);
    const shaped = {
      product_resource_link_id: Number(row.product_resource_link_id || 0),
      product_id: Number(row.product_id || 0),
      resource_kind: normalizeText(row.resource_kind).toLowerCase(),
      source_key: row.source_key || '',
      name: row.resource_name || row.source_key || '',
      quantity_used: positive(row.quantity_used, 1),
      quantity_defaulted: rawQuantityUsed > 0 ? 0 : 1,
      usage_notes: row.usage_notes || '',
      sort_order: Number(row.sort_order || 0),
      consumption_mode: normalizeConsumptionMode(row.consumption_mode),
      lot_size_units: positive(row.lot_size_units, 1),
      lot_size_defaulted: rawLotSizeUnits > 0 ? 0 : 1,
      is_label_ingredient: Number(row.is_label_ingredient || 0) === 1 ? 1 : 0,
      ingredient_name_en: row.ingredient_name_en || '',
      ingredient_name_fr: row.ingredient_name_fr || '',
      inci_name: row.inci_name || '',
      translation_review_status: row.translation_review_status || 'needs_review'
    };
    const linkedResource = {
      item_kind: shaped.resource_kind,
      source_key: shaped.source_key,
      name: shaped.name,
      category: normalizeText(row.resource_category).toLowerCase(),
      site_item_inventory_id: Number(row.site_item_inventory_id || 0),
      catalog_item_id: Number(row.catalog_item_id || 0),
      is_active: Number(row.resource_is_active || 0),
      on_hand_quantity: Math.max(0, number(row.resource_on_hand_quantity, 0)),
      reserved_quantity: Math.max(0, number(row.resource_reserved_quantity, 0)),
      incoming_quantity: Math.max(0, number(row.resource_incoming_quantity, 0)),
      unit_cost_cents: money(row.resource_unit_cost_cents),
      stock_unit_label: normalizeText(row.resource_stock_unit_label).toLowerCase() || 'unit',
      usage_unit_label: normalizeText(row.resource_usage_unit_label).toLowerCase() || 'unit',
      usage_units_per_stock_unit: Math.max(0.001, number(row.resource_usage_units_per_stock_unit, 1)),
      usage_profile_present: Number(row.usage_profile_present || 0) === 1,
      usage_tracking_mode: normalizeText(row.resource_usage_tracking_mode).toLowerCase() || (shaped.resource_kind === 'tool' ? 'reusable' : 'exact'),
      minimum_usage_increment: Math.max(0.0001, number(row.resource_minimum_usage_increment, 0.001)),
      lot_count: Math.max(0, Number(row.lot_count || 0)),
      available_lot_count: Math.max(0, Number(row.available_lot_count || 0)),
      lot_remaining_quantity: Math.max(0, number(row.lot_remaining_quantity, 0)),
      lot_received_value_cents: Math.max(0, money(row.lot_received_value_cents)),
      lot_depletion_method: normalizeText(row.lot_depletion_method).toLowerCase() || 'manual',
      lot_reconcile_status: normalizeText(row.lot_reconcile_status).toLowerCase() || 'needs_review',
      lot_last_reconciled_at: row.lot_last_reconciled_at || null
    };
    return { ...shaped, resource: linkedResource, preview: resourcePreview(linkedResource, shaped) };
  });
}

function amazonAsinFromRow(row = {}) {
  const sku = normalizeText(row.supplier_sku);
  if (/^[A-Z0-9]{10}$/i.test(sku)) return sku.toUpperCase();
  const match = normalizeText(row.amazon_url).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?#]|$)/i);
  return match ? String(match[1]).toUpperCase() : '';
}

export async function searchResources(db, env, query = '', limit = 240) {
  const q = normalizeText(query).toLowerCase();
  const like = `%${q}%`;
  const safeLimit = Math.max(25, Math.min(400, Number(limit || 240)));

  // Inventory is the operational authority. Catalog rows are included only when an
  // active inventory record does not yet exist for the same normalized kind/key.
  const inventoryResult = await db.prepare(`
    SELECT
      LOWER(TRIM(COALESCE(sii.source_type, 'supply'))) AS item_kind,
      sii.external_key AS source_key,
      sii.item_name AS name,
      sii.image_url,
      sii.category,
      '' AS subcategory,
      sii.site_item_inventory_id,
      0 AS catalog_item_id,
      sii.on_hand_quantity,
      is_on_reorder_list,
      do_not_reuse,
      unit_cost_cents,
      usage_unit_label,
      stock_unit_label,
      usage_units_per_stock_unit,
      amazon_url,
      supplier_sku,
      sii.supplier_name,
      COALESCE(siup.usage_tracking_mode, CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) AS usage_tracking_mode,
      COALESCE(siup.minimum_usage_increment, 0.001) AS minimum_usage_increment
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id = sii.site_item_inventory_id
    WHERE COALESCE(sii.is_active, 1) = 1
      AND LOWER(TRIM(COALESCE(sii.source_type, ''))) IN ('tool', 'supply')
      AND (
        ? = ''
        OR LOWER(COALESCE(sii.item_name, '')) LIKE ?
        OR LOWER(COALESCE(sii.category, '')) LIKE ?
        OR LOWER(COALESCE(sii.external_key, '')) LIKE ?
        OR LOWER(COALESCE(sii.amazon_url, '')) LIKE ?
        OR LOWER(COALESCE(sii.supplier_sku, '')) LIKE ?
      )
    ORDER BY LOWER(COALESCE(sii.item_name, '')) ASC, sii.site_item_inventory_id ASC
    LIMIT ?
  `).bind(q, like, like, like, like, like, safeLimit).all();

  const inventory = rows(inventoryResult).map((row) => ({
    item_kind: normalizeText(row.item_kind).toLowerCase() || 'supply',
    catalog_item_id: Number(row.catalog_item_id || 0),
    source_key: row.source_key || `inventory:${row.site_item_inventory_id}`,
    name: row.name || row.source_key || 'Inventory item',
    image_url: normalizeResourceImageUrl(env, row.image_url || ''),
    category: normalizeText(row.category).toLowerCase(),
    subcategory: normalizeText(row.subcategory).toLowerCase(),
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    on_hand_quantity: number(row.on_hand_quantity, 0),
    is_on_reorder_list: Number(row.is_on_reorder_list || 0),
    do_not_reuse: Number(row.do_not_reuse || 0),
    unit_cost_cents: money(row.unit_cost_cents),
    usage_unit_label: normalizeText(row.usage_unit_label).toLowerCase() || 'unit',
    stock_unit_label: normalizeText(row.stock_unit_label).toLowerCase() || 'unit',
    usage_units_per_stock_unit: Math.max(0.001, number(row.usage_units_per_stock_unit, 1)),
    usage_tracking_mode: normalizeText(row.usage_tracking_mode).toLowerCase() || (normalizeText(row.item_kind).toLowerCase() === 'tool' ? 'reusable' : 'exact'),
    minimum_usage_increment: Math.max(0.0001, number(row.minimum_usage_increment, 0.001)),
    amazon_url: row.amazon_url || '',
    amazon_asin: amazonAsinFromRow(row),
    amazon_title: '',
    amazon_match_status: '',
    supplier_name: row.supplier_name || '',
    latest_order_id: '',
    latest_purchase_date: ''
  }));

  if (inventory.length >= safeLimit) return inventory.map((item) => ({ ...item, preview: resourcePreview(item) }));

  const remaining = safeLimit - inventory.length;
  const catalogResult = await db.prepare(`
    SELECT ci.catalog_item_id, ci.item_kind, ci.source_key, ci.name, ci.image_url, ci.amazon_url,
           ci.category, ci.subcategory
    FROM catalog_items ci
    WHERE LOWER(TRIM(COALESCE(ci.item_kind, ''))) IN ('tool', 'supply')
      AND COALESCE(ci.status, 'active') != 'archived'
      AND (
        ? = ''
        OR LOWER(COALESCE(ci.name, '')) LIKE ?
        OR LOWER(COALESCE(ci.category, '')) LIKE ?
        OR LOWER(COALESCE(ci.subcategory, '')) LIKE ?
        OR LOWER(COALESCE(ci.source_key, '')) LIKE ?
        OR LOWER(COALESCE(ci.amazon_url, '')) LIKE ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM site_item_inventory sii
        WHERE COALESCE(sii.is_active, 1) = 1
          AND LOWER(TRIM(COALESCE(sii.source_type, ''))) = LOWER(TRIM(COALESCE(ci.item_kind, '')))
          AND LOWER(TRIM(COALESCE(sii.external_key, ''))) = LOWER(TRIM(COALESCE(ci.source_key, '')))
      )
    ORDER BY LOWER(COALESCE(ci.name, '')) ASC, ci.item_kind ASC
    LIMIT ?
  `).bind(q, like, like, like, like, like, remaining).all();

  const catalog = rows(catalogResult).map((row) => ({
    item_kind: normalizeText(row.item_kind).toLowerCase(),
    catalog_item_id: Number(row.catalog_item_id || 0),
    source_key: row.source_key || '',
    name: row.name || row.source_key || 'Catalog item',
    image_url: normalizeResourceImageUrl(env, row.image_url || ''),
    category: normalizeText(row.category).toLowerCase(),
    subcategory: normalizeText(row.subcategory).toLowerCase(),
    site_item_inventory_id: 0,
    on_hand_quantity: 0,
    is_on_reorder_list: 0,
    do_not_reuse: 0,
    unit_cost_cents: 0,
    usage_unit_label: 'unit',
    stock_unit_label: 'unit',
    usage_units_per_stock_unit: 1,
    usage_tracking_mode: normalizeText(row.item_kind).toLowerCase() === 'tool' ? 'reusable' : 'exact',
    minimum_usage_increment: 0.001,
    amazon_url: row.amazon_url || '',
    amazon_asin: amazonAsinFromRow(row),
    amazon_title: '',
    amazon_match_status: '',
    supplier_name: '',
    latest_order_id: '',
    latest_purchase_date: ''
  }));

  return [...inventory, ...catalog].map((item) => ({ ...item, preview: resourcePreview(item) }));
}
