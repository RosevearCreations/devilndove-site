// Build 244: lightweight D1-authoritative product/resource loaders with fractional usage support.
// Schema creation belongs to numbered migrations; these helpers perform read-only queries only.

import { normalizeText } from '../_lib/adminAudit.js';

const DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL = 'https://assets.devilndove.com';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
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
  const quantityUsed = Math.max(0, number(link?.quantity_used ?? 1, 1));
  const productsPerLot = Math.max(1, number(link?.lot_size_units ?? 1, 1));
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
    SELECT product_resource_link_id, product_id, resource_kind, source_key,
           quantity_used, usage_notes, sort_order,
           COALESCE(consumption_mode, 'per_unit') AS consumption_mode,
           COALESCE(lot_size_units, 1) AS lot_size_units
    FROM product_resource_links
    WHERE product_id = ?
    ORDER BY sort_order ASC, product_resource_link_id ASC
  `).bind(Number(productId)).all();
  return rows(result).map((row) => {
    const shaped = {
      product_resource_link_id: Number(row.product_resource_link_id || 0),
      product_id: Number(row.product_id || 0),
      resource_kind: normalizeText(row.resource_kind).toLowerCase(),
      source_key: row.source_key || '',
      quantity_used: Math.max(0, number(row.quantity_used, 0)),
      usage_notes: row.usage_notes || '',
      sort_order: Number(row.sort_order || 0),
      consumption_mode: normalizeConsumptionMode(row.consumption_mode),
      lot_size_units: Math.max(1, number(row.lot_size_units, 1))
    };
    return { ...shaped, preview: resourcePreview({}, shaped) };
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
  // active inventory record does not yet exist for the same kind/key.
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
    WHERE ci.item_kind IN ('tool', 'supply')
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
          AND LOWER(TRIM(COALESCE(sii.source_type, ''))) = ci.item_kind
          AND sii.external_key = ci.source_key
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
