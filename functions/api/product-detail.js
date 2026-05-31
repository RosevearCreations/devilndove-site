// File: /functions/api/product-detail.js
// Brief description: Returns one active storefront product with images, SEO fields,
// linked making-story resources, and stock/trust summaries for the product detail page.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}


function normalizePublicUseStatus(value) {
  const clean = String(value || '').trim().toLowerCase();
  return ['internal_review', 'product_page_ok', 'social_ok', 'all_public_ok', 'consent_needed', 'blocked'].includes(clean) ? clean : 'internal_review';
}

function isPublicConsentSafe(row = {}) {
  const status = String(row.consent_status || '').trim().toLowerCase();
  const scope = String(row.consent_scope || '').trim().toLowerCase();
  if (Number(row.consent_public_use_allowed || row.public_use_allowed || 0) === 1) return true;
  return ['granted', 'not_required'].includes(status) && ['product_page', 'website_gallery', 'all_public'].includes(scope);
}

function imageRoleGroup(role, variantRole = '') {
  const cleanRole = String(role || '').trim().toLowerCase();
  if (cleanRole === 'hero_front') return 'featured';
  if (['detail_texture', 'back_side'].includes(cleanRole)) return 'detail';
  if (cleanRole === 'scale_context') return 'scale';
  if (cleanRole === 'process_story') return 'process';
  if (cleanRole === 'packaging_pickup') return 'packaging';
  if (cleanRole === 'material_tool_proof') return 'proof';
  const legacy = String(variantRole || '').trim().toLowerCase();
  if (['detail', 'hero', 'featured'].includes(legacy)) return legacy === 'detail' ? 'detail' : 'featured';
  return 'gallery';
}

function parseColorNamesJson(value, fallbackColor = '') {
  let parsed = [];
  try {
    const raw = JSON.parse(String(value || '[]'));
    parsed = Array.isArray(raw) ? raw : [];
  } catch {}
  const values = parsed.map((item) => String(item || '').trim()).filter(Boolean);
  if (fallbackColor && !values.some((entry) => entry.toLowerCase() === String(fallbackColor).trim().toLowerCase())) values.unshift(String(fallbackColor).trim());
  return values;
}

function splitFilterValues(...values) {
  const seen = new Set();
  const output = [];
  values.forEach((value) => {
    if (value == null) return;
    let parsed = value;
    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return;
      if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
        try { parsed = JSON.parse(text); } catch { parsed = text; }
      }
    }
    const list = Array.isArray(parsed) ? parsed : String(parsed || '').split(/[|,;/\n]+/);
    list.map((entry) => String(entry || '').trim()).filter(Boolean).forEach((entry) => {
      const key = entry.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      output.push(entry);
    });
  });
  return output;
}

function filterText(values) {
  return (Array.isArray(values) ? values : splitFilterValues(values)).join(', ');
}

const SCHEMA_CACHE_MS = 5 * 60 * 1000;
const schemaColumnCache = new Map();

const PRODUCT_COLUMN_CANDIDATES = [
  'product_id', 'product_number', 'slug', 'sku', 'name', 'product_category', 'color_name',
  'color_names_json', 'shipping_code', 'review_status', 'short_description', 'description',
  'product_type', 'status', 'merchandise_origin', 'sale_channel', 'external_listing_url',
  'external_listing_label', 'condition_summary', 'era_label', 'sourcing_notes', 'price_cents',
  'compare_at_price_cents', 'currency', 'taxable', 'tax_class_id', 'requires_shipping',
  'weight_grams', 'inventory_tracking', 'inventory_quantity', 'on_hand_quantity',
  'digital_file_url', 'featured_image_url', 'material_tags', 'materials_json', 'primary_material', 'material', 'process_tags', 'making_process', 'process_notes', 'locality_label', 'local_pickup_note', 'sort_order', 'created_at', 'updated_at'
];
const TAX_COLUMN_CANDIDATES = ['tax_class_id', 'code', 'name', 'rate_percent', 'tax_rate'];
const SEO_COLUMN_CANDIDATES = [
  'product_id', 'meta_title', 'meta_description', 'keywords', 'h1_override', 'canonical_url',
  'schema_type', 'og_title', 'og_description', 'og_image_url'
];

function safeIdentifier(value) {
  const text = String(value || '').trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text) ? text : '';
}

function sqlString(value) {
  return `'${String(value || '').replace(/'/g, "''")}'`;
}

async function getTableColumnSet(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();
  try {
    const result = await db.prepare(`PRAGMA table_info(${safeTable})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    const names = rows.map((row) => String(row?.name || '').trim()).filter((name) => safeIdentifier(name));
    if (names.length) return new Set(names);
  } catch {
    // Fall through to the SELECT * sample fallback below.
  }

  try {
    const sample = await db.prepare(`SELECT * FROM ${safeTable} LIMIT 1`).first();
    return new Set(Object.keys(sample || {}).filter((name) => safeIdentifier(name)));
  } catch {
    return new Set();
  }
}

async function getVerifiedTableColumnSet(db, tableName, candidateColumns = []) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();
  const cacheKey = `${safeTable}:strict:${candidateColumns.join(',')}`;
  const cached = schemaColumnCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < SCHEMA_CACHE_MS) return new Set(cached.columns);

  // Build 130: use only columns proven by D1 table metadata/sample rows.
  // Do not add candidate columns to the returned set. D1/SQLite will throw if a query
  // references a missing optional column such as p.merchandise_origin.
  const columns = await getTableColumnSet(db, safeTable);
  schemaColumnCache.set(cacheKey, { cachedAt: Date.now(), columns: Array.from(columns) });
  return columns;
}

function selectColumn(columns, alias, columnName, fallbackSql, outputName = columnName) {
  return columns.has(columnName) ? `${alias}.${columnName} AS ${outputName}` : `${fallbackSql} AS ${outputName}`;
}

function taxRateExpression(taxColumns) {
  const parts = [];
  if (taxColumns.has('rate_percent')) parts.push('tc.rate_percent');
  if (taxColumns.has('tax_rate')) parts.push('tc.tax_rate');
  return parts.length ? `COALESCE(${parts.join(', ')}, 0) AS tax_rate` : '0 AS tax_rate';
}

function inventoryQuantityExpression(productColumns) {
  const parts = [];
  if (productColumns.has('inventory_quantity')) parts.push('p.inventory_quantity');
  if (productColumns.has('on_hand_quantity')) parts.push('p.on_hand_quantity');
  return parts.length ? `COALESCE(${parts.join(', ')}, 0) AS inventory_quantity` : '0 AS inventory_quantity';
}

function buildProductDetailSql({ productColumns, taxColumns, seoColumns, hasTaxJoin, hasSeoJoin }) {
  const joins = [];
  if (hasTaxJoin) joins.push('LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id');
  if (hasSeoJoin) joins.push('LEFT JOIN product_seo ps ON ps.product_id = p.product_id');
  const where = productColumns.has('status') ? `p.slug = ? AND p.status = 'active'` : 'p.slug = ?';
  const taxSelects = hasTaxJoin
    ? [
        selectColumn(taxColumns, 'tc', 'code', "''", 'tax_class_code'),
        selectColumn(taxColumns, 'tc', 'name', "''", 'tax_class_name'),
        taxRateExpression(taxColumns)
      ]
    : ["'' AS tax_class_code", "'' AS tax_class_name", '0 AS tax_rate'];
  const seoSelects = hasSeoJoin
    ? [
        selectColumn(seoColumns, 'ps', 'meta_title', "''"),
        selectColumn(seoColumns, 'ps', 'meta_description', "''"),
        selectColumn(seoColumns, 'ps', 'keywords', "''"),
        selectColumn(seoColumns, 'ps', 'h1_override', "''"),
        selectColumn(seoColumns, 'ps', 'canonical_url', "''"),
        selectColumn(seoColumns, 'ps', 'schema_type', sqlString('Product')),
        selectColumn(seoColumns, 'ps', 'og_title', "''"),
        selectColumn(seoColumns, 'ps', 'og_description', "''"),
        selectColumn(seoColumns, 'ps', 'og_image_url', "''")
      ]
    : [
        "'' AS meta_title", "'' AS meta_description", "'' AS keywords", "'' AS h1_override",
        "'' AS canonical_url", "'Product' AS schema_type", "'' AS og_title", "'' AS og_description", "'' AS og_image_url"
      ];
  const selectList = [
    selectColumn(productColumns, 'p', 'product_id', 'NULL'),
    selectColumn(productColumns, 'p', 'slug', "''"),
    selectColumn(productColumns, 'p', 'sku', "''"),
    selectColumn(productColumns, 'p', 'name', sqlString('Untitled product')),
    selectColumn(productColumns, 'p', 'product_category', "''"),
    selectColumn(productColumns, 'p', 'short_description', "''"),
    selectColumn(productColumns, 'p', 'description', "''"),
    selectColumn(productColumns, 'p', 'product_type', sqlString('physical')),
    selectColumn(productColumns, 'p', 'status', sqlString('active')),
    selectColumn(productColumns, 'p', 'color_name', "''"),
    selectColumn(productColumns, 'p', 'color_names_json', sqlString('[]')),
    selectColumn(productColumns, 'p', 'merchandise_origin', sqlString('handmade')),
    selectColumn(productColumns, 'p', 'sale_channel', sqlString('onsite')),
    selectColumn(productColumns, 'p', 'external_listing_url', "''"),
    selectColumn(productColumns, 'p', 'external_listing_label', "''"),
    selectColumn(productColumns, 'p', 'condition_summary', "''"),
    selectColumn(productColumns, 'p', 'era_label', "''"),
    selectColumn(productColumns, 'p', 'sourcing_notes', "''"),
    selectColumn(productColumns, 'p', 'material_tags', "''"),
    selectColumn(productColumns, 'p', 'materials_json', "''"),
    selectColumn(productColumns, 'p', 'primary_material', "''"),
    selectColumn(productColumns, 'p', 'material', "''"),
    selectColumn(productColumns, 'p', 'process_tags', "''"),
    selectColumn(productColumns, 'p', 'making_process', "''"),
    selectColumn(productColumns, 'p', 'process_notes', "''"),
    selectColumn(productColumns, 'p', 'locality_label', "''"),
    selectColumn(productColumns, 'p', 'local_pickup_note', "''"),
    selectColumn(productColumns, 'p', 'price_cents', '0'),
    selectColumn(productColumns, 'p', 'compare_at_price_cents', 'NULL'),
    selectColumn(productColumns, 'p', 'currency', sqlString('CAD')),
    selectColumn(productColumns, 'p', 'taxable', '1'),
    selectColumn(productColumns, 'p', 'tax_class_id', 'NULL'),
    selectColumn(productColumns, 'p', 'requires_shipping', '0'),
    selectColumn(productColumns, 'p', 'weight_grams', 'NULL'),
    selectColumn(productColumns, 'p', 'inventory_tracking', '0'),
    inventoryQuantityExpression(productColumns),
    selectColumn(productColumns, 'p', 'digital_file_url', "''"),
    selectColumn(productColumns, 'p', 'featured_image_url', "''"),
    selectColumn(productColumns, 'p', 'sort_order', '0'),
    selectColumn(productColumns, 'p', 'created_at', "''"),
    selectColumn(productColumns, 'p', 'updated_at', "''"),
    ...taxSelects,
    ...seoSelects
  ];
  return `
    SELECT
      ${selectList.join(',\n      ')}
    FROM products p
    ${joins.join('\n    ')}
    WHERE ${where}
    LIMIT 1
  `;
}

async function handleProductDetailRequest(context) {
  const { request, env } = context;
  const db = env.DB || env.DD_DB;
  const url = new URL(request.url);
  const slug = String(url.searchParams.get('slug') || '').trim().toLowerCase();

  if (!slug) return json({ ok: false, error: 'A valid slug is required.' }, 400);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const productColumns = await getVerifiedTableColumnSet(db, 'products', PRODUCT_COLUMN_CANDIDATES);
  if (!productColumns.has('slug')) {
    return json({ ok: false, error: 'Product database schema is missing the slug column.' }, 503);
  }

  const taxColumns = await getVerifiedTableColumnSet(db, 'tax_classes', TAX_COLUMN_CANDIDATES);
  const seoColumns = await getVerifiedTableColumnSet(db, 'product_seo', SEO_COLUMN_CANDIDATES);
  const hasTaxJoin = productColumns.has('tax_class_id') && taxColumns.has('tax_class_id');
  const hasSeoJoin = seoColumns.has('product_id');
  const productSql = buildProductDetailSql({ productColumns, taxColumns, seoColumns, hasTaxJoin, hasSeoJoin });

  let product = null;
  try {
    product = await db.prepare(productSql).bind(slug).first();
  } catch (error) {
    return json({
      ok: false,
      error: 'Product detail is temporarily unavailable because the product schema is out of sync.',
      detail: String(error?.message || error || 'Unknown product detail error')
    }, 503);
  }


  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);
  product.color_names = parseColorNamesJson(product.color_names_json, product.color_name || '');
  product.color_names_text = product.color_names.join(', ');
  product.proof_materials = splitFilterValues(product.material_tags, product.materials_json, product.primary_material, product.material, product.product_category);
  product.proof_material = filterText(product.proof_materials);
  product.proof_processes = splitFilterValues(product.process_tags, product.making_process, product.process_notes);
  product.proof_process = filterText(product.proof_processes);
  product.proof_localities = splitFilterValues(product.locality_label, product.local_pickup_note, product.sourcing_notes);
  product.proof_locality = filterText(product.proof_localities);

  const resourceLinkColumns = await getTableColumnSet(db, 'product_resource_links');
  const inventoryColumns = await getTableColumnSet(db, 'site_item_inventory');
  const imageAnnotationColumns = await getTableColumnSet(db, 'product_image_annotations');
  const mediaConsentColumns = await getTableColumnSet(db, 'media_consent_records');
  const hasImageAnnotationJoin = imageAnnotationColumns.has('product_image_id');
  const hasConsentJoin = hasImageAnnotationJoin && imageAnnotationColumns.has('consent_record_id') && mediaConsentColumns.has('consent_record_id');
  const piaColumn = (columnName, fallbackSql = 'NULL') => hasImageAnnotationJoin && imageAnnotationColumns.has(columnName) ? `pia.${columnName} AS ${columnName}` : `${fallbackSql} AS ${columnName}`;
  const mcrColumn = (columnName, fallbackSql = 'NULL', outputName = columnName) => hasConsentJoin && mediaConsentColumns.has(columnName) ? `mcr.${columnName} AS ${outputName}` : `${fallbackSql} AS ${outputName}`;
  const hasConsumptionMode = resourceLinkColumns.has('consumption_mode');
  const hasLotSizeUnits = resourceLinkColumns.has('lot_size_units');
  const usageUnitsExpr = inventoryColumns.has('usage_units_per_stock_unit') ? `COALESCE(NULLIF(sii.usage_units_per_stock_unit,0),1)` : `1`;
  const usageUnitLabelExpr = inventoryColumns.has('usage_unit_label') ? `COALESCE(NULLIF(sii.usage_unit_label,''),'unit')` : `'unit'`;
  const stockUnitLabelExpr = inventoryColumns.has('stock_unit_label') ? `COALESCE(NULLIF(sii.stock_unit_label,''),'unit')` : `'unit'`;
  const unitCostExpr = inventoryColumns.has('unit_cost_cents') ? `COALESCE(sii.unit_cost_cents,0)` : (inventoryColumns.has('cost_cents') ? `COALESCE(sii.cost_cents,0)` : `0`);

  const images = normalizeResults(await db.prepare(`
    SELECT pi.product_image_id, pi.product_id, pi.image_url,
           ${hasImageAnnotationJoin && imageAnnotationColumns.has('alt_text') ? `COALESCE(pia.alt_text, pi.alt_text, p.name)` : `COALESCE(pi.alt_text, p.name)`} AS alt_text,
           pi.sort_order, pi.created_at,
           ${piaColumn('product_image_annotation_id', 'NULL')},
           ${piaColumn('image_title', `''`)},
           ${piaColumn('caption', `''`)},
           ${piaColumn('focal_point_x', 'NULL')},
           ${piaColumn('focal_point_y', 'NULL')},
           ${piaColumn('annotation_notes', `''`)},
           ${piaColumn('image_role', `''`)},
           ${piaColumn('public_use_status', `'internal_review'`)},
           ${piaColumn('consent_record_id', 'NULL')},
           ${mcrColumn('consent_status', `''`)},
           ${mcrColumn('consent_scope', `''`)},
           ${mcrColumn('public_use_allowed', '0', 'consent_public_use_allowed')},
           ma.variant_role
    FROM product_images pi
    ${hasImageAnnotationJoin ? `LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id` : ``}
    LEFT JOIN products p ON p.product_id = pi.product_id
    LEFT JOIN media_assets ma ON ma.product_id = pi.product_id AND ma.public_url = pi.image_url AND ma.deleted_at IS NULL
    ${hasConsentJoin ? `LEFT JOIN media_consent_records mcr ON mcr.consent_record_id = pia.consent_record_id` : ``}
    WHERE pi.product_id = ?
    ORDER BY pi.sort_order ASC, pi.product_image_id ASC
    LIMIT 20
  `).bind(product.product_id).all());

  let image_annotations = [];
  if (hasImageAnnotationJoin) {
    image_annotations = normalizeResults(await db.prepare(`
      SELECT ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'product_image_annotation_id', 'NULL')},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'product_id', 'NULL')},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'product_image_id', 'NULL')},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'image_url', `''`)},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'alt_text', `''`)},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'image_title', `''`)},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'caption', `''`)},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'image_role', `''`)},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'public_use_status', `'internal_review'`)},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'consent_record_id', 'NULL')},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'focal_point_x', 'NULL')},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'focal_point_y', 'NULL')},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'annotation_notes', `''`)},
             ${selectColumn(imageAnnotationColumns, 'product_image_annotations', 'updated_at', `''`)}
      FROM product_image_annotations
      WHERE product_id = ?
      ORDER BY product_image_annotation_id ASC
    `).bind(product.product_id).all()).catch(() => []);
  }

  const resource_links = normalizeResults(await db.prepare(`
    SELECT prl.product_resource_link_id, prl.product_id, prl.resource_kind, prl.source_key, prl.quantity_used,
           prl.usage_notes, prl.sort_order,
           ${hasConsumptionMode ? `COALESCE(prl.consumption_mode,'per_unit')` : `'per_unit'`} AS consumption_mode,
           ${hasLotSizeUnits ? `COALESCE(prl.lot_size_units,1)` : `1`} AS lot_size_units,
           ci.name AS resource_name, ci.image_url AS resource_image_url, ci.category AS resource_category,
           ci.subcategory AS resource_subcategory, ci.short_description AS resource_short_description,
           sii.site_item_inventory_id, sii.on_hand_quantity, sii.reserved_quantity, sii.incoming_quantity,
           sii.reorder_level, sii.is_on_reorder_list, sii.do_not_reorder, sii.do_not_reuse, sii.reuse_status,
           ${usageUnitLabelExpr} AS usage_unit_label,
           ${stockUnitLabelExpr} AS stock_unit_label,
           ${usageUnitsExpr} AS usage_units_per_stock_unit,
           ${unitCostExpr} AS unit_cost_cents
    FROM product_resource_links prl
    LEFT JOIN catalog_items ci ON ci.item_kind = prl.resource_kind AND ci.source_key = prl.source_key
    LEFT JOIN site_item_inventory sii ON sii.source_type = prl.resource_kind AND sii.external_key = prl.source_key
    WHERE prl.product_id = ?
    ORDER BY prl.sort_order ASC, prl.product_resource_link_id ASC
  `).bind(product.product_id).all()).map((row) => {
    const usageUnitsPerStockUnit = Math.max(1, Number(row.usage_units_per_stock_unit || 1) || 1);
    const onHand = Number(row.on_hand_quantity || 0);
    const reserved = Number(row.reserved_quantity || 0);
    const incoming = Number(row.incoming_quantity || 0);
    const quantityUsed = Math.max(0, Number(row.quantity_used || 0));
    const lotSizeUnits = Math.max(1, Number(row.lot_size_units || 1) || 1);
    const mode = String(row.consumption_mode || 'per_unit').toLowerCase();
    const totalUsageUnits = onHand * usageUnitsPerStockUnit;
    const estimatedCostPerProductCents = mode === 'story_only'
      ? 0
      : mode === 'end_of_lot'
        ? Math.round(Number(row.unit_cost_cents || 0) / lotSizeUnits)
        : Math.round((Number(row.unit_cost_cents || 0) / usageUnitsPerStockUnit) * Math.max(1, quantityUsed || 1));
    const buildableProducts = mode === 'story_only'
      ? 0
      : mode === 'end_of_lot'
        ? Math.floor(onHand * lotSizeUnits)
        : (quantityUsed > 0 ? Math.floor(totalUsageUnits / quantityUsed) : 0);
    return {
      product_resource_link_id: Number(row.product_resource_link_id || 0),
      product_id: Number(row.product_id || 0),
      resource_kind: row.resource_kind || '',
      source_key: row.source_key || '',
      quantity_used: quantityUsed,
      usage_notes: row.usage_notes || '',
      sort_order: Number(row.sort_order || 0),
      consumption_mode: mode,
      lot_size_units: lotSizeUnits,
      resource_name: row.resource_name || row.source_key || '',
      resource_image_url: row.resource_image_url || '',
      resource_category: row.resource_category || '',
      resource_subcategory: row.resource_subcategory || '',
      resource_short_description: row.resource_short_description || '',
      inventory: row.site_item_inventory_id ? {
        site_item_inventory_id: Number(row.site_item_inventory_id || 0),
        on_hand_quantity: onHand,
        reserved_quantity: reserved,
        incoming_quantity: incoming,
        reorder_level: Number(row.reorder_level || 0),
        is_on_reorder_list: Number(row.is_on_reorder_list || 0),
        do_not_reorder: Number(row.do_not_reorder || 0),
        do_not_reuse: Number(row.do_not_reuse || 0),
        reuse_status: row.reuse_status || '',
        usage_unit_label: row.usage_unit_label || 'unit',
        stock_unit_label: row.stock_unit_label || 'unit',
        usage_units_per_stock_unit: usageUnitsPerStockUnit,
        unit_cost_cents: Number(row.unit_cost_cents || 0),
        total_usage_units_available: totalUsageUnits,
        estimated_cost_per_product_cents: estimatedCostPerProductCents,
        buildable_products: buildableProducts
      } : null
    };
  });

  const resource_summary = {
    total_linked_items: resource_links.length,
    linked_tools: resource_links.filter((row) => row.resource_kind === 'tool').length,
    linked_supplies: resource_links.filter((row) => row.resource_kind === 'supply').length,
    low_stock_items: resource_links.filter((row) => row.inventory && ((Number(row.inventory.on_hand_quantity || 0) - Number(row.inventory.reserved_quantity || 0) + Number(row.inventory.incoming_quantity || 0)) <= Number(row.inventory.reorder_level || 0))).length,
    estimated_cost_per_product_cents: resource_links.reduce((sum, row) => sum + Number(row.inventory?.estimated_cost_per_product_cents || 0), 0)
  };

  const storefront_images = images.filter((row) => {
    const publicUseStatus = normalizePublicUseStatus(row.public_use_status);
    if (['blocked', 'consent_needed'].includes(publicUseStatus)) return false;
    if (Number(row.consent_record_id || 0) > 0 && !isPublicConsentSafe(row)) return false;
    return true;
  }).map((row) => {
    const imageUrl = row.image_url || '';
    const publicUseStatus = normalizePublicUseStatus(row.public_use_status);
    const role = row.image_role || '';
    const group = imageRoleGroup(role, row.variant_role || '');
    return {
      product_image_id: Number(row.product_image_id || 0),
      image_url: imageUrl,
      alt_text: row.alt_text || product.name || '',
      image_title: row.image_title || '',
      caption: row.caption || '',
      variant_role: row.variant_role || '',
      image_role: role,
      image_group: group,
      public_use_status: publicUseStatus,
      public_reuse_ready: ['product_page_ok', 'all_public_ok', 'social_ok'].includes(publicUseStatus) || !row.product_image_annotation_id ? 1 : 0,
      annotation_notes: row.annotation_notes || '',
      sort_order: Number(row.sort_order || 0),
      variant_urls: imageUrl ? {
        original: imageUrl,
        thumb: imageUrl,
        medium: imageUrl,
        large: imageUrl,
        webp: imageUrl
      } : null
    };
  });

  const image_groups = {
    featured: storefront_images.find((row) => row.image_url === product.featured_image_url) || storefront_images.find((row) => row.image_group === 'featured') || storefront_images[0] || null,
    detail: storefront_images.filter((row) => row.image_group === 'detail'),
    scale: storefront_images.filter((row) => row.image_group === 'scale'),
    process: storefront_images.filter((row) => row.image_group === 'process'),
    packaging: storefront_images.filter((row) => row.image_group === 'packaging'),
    proof: storefront_images.filter((row) => row.image_group === 'proof'),
    gallery: storefront_images.filter((row) => !['featured', 'detail', 'scale', 'process', 'packaging', 'proof'].includes(row.image_group)),
    annotated: storefront_images.filter((row) => row.caption || row.annotation_notes || row.image_title)
  };

  const build_summary = {
    buildable_units_from_resources: resource_links.length
      ? resource_links.reduce((minUnits, row) => {
          const possibleUnits = row.inventory?.buildable_products;
          if (possibleUnits == null || possibleUnits < 0) return minUnits;
          return minUnits == null ? possibleUnits : Math.min(minUnits, possibleUnits);
        }, null)
      : null,
    resource_shortage_links: resource_links.filter((row) => row.inventory && Number(row.inventory.buildable_products || 0) < 1 && row.consumption_mode !== 'story_only').length
  };


  let story_notes = {};
  try {
    const storyTable = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='product_story_public_notes' LIMIT 1`).first();
    if (storyTable) {
      story_notes = await db.prepare(`
        SELECT product_story_public_note_id, product_id, story_heading, story_summary, story_body,
               process_notes, care_notes, local_pickup_note, display_status, updated_at
        FROM product_story_public_notes
        WHERE product_id = ? AND COALESCE(display_status,'draft') IN ('approved','published')
        ORDER BY datetime(updated_at) DESC, product_story_public_note_id DESC
        LIMIT 1
      `).bind(product.product_id).first().catch(() => ({})) || {};
    }
  } catch {}

  const trust_summary = {
    has_multiple_images: storefront_images.length > 1,
    has_maker_story: resource_links.length > 0,
    can_request_back_in_stock: Number(product.inventory_tracking || 0) === 1,
    in_stock: Number(product.inventory_quantity || 0) > 0,
    image_count: storefront_images.length
  };

  async function relatedProductsByProof() {
    const fields = ['material_tags', 'materials_json', 'primary_material', 'material', 'product_category', 'process_tags', 'making_process', 'process_notes', 'locality_label', 'local_pickup_note', 'sourcing_notes'].filter((field) => productColumns.has(field));
    if (!fields.length) return [];
    const tokens = [
      ...(Array.isArray(product.proof_materials) ? product.proof_materials : []),
      ...(Array.isArray(product.proof_processes) ? product.proof_processes : []),
      ...(Array.isArray(product.proof_localities) ? product.proof_localities : [])
    ].map((item) => String(item || '').trim().toLowerCase()).filter((item) => item.length >= 3).slice(0, 8);
    if (!tokens.length) return [];
    const clauses = [];
    const binds = [];
    tokens.forEach((token) => {
      const parts = fields.map((field) => `LOWER(COALESCE(p.${field}, '')) LIKE ?`);
      clauses.push(`(${parts.join(' OR ')})`);
      fields.forEach(() => binds.push(`%${token}%`));
    });
    const statusClause = productColumns.has('status') ? `AND p.status='active'` : '';
    const imageColumn = productColumns.has('featured_image_url') ? 'p.featured_image_url' : "''";
    const priceColumn = productColumns.has('price_cents') ? 'p.price_cents' : '0';
    const currencyColumn = productColumns.has('currency') ? 'p.currency' : "'CAD'";
    const rows = normalizeResults(await db.prepare(`
      SELECT p.product_id, p.slug, p.name, p.product_category, ${imageColumn} AS featured_image_url, ${priceColumn} AS price_cents, ${currencyColumn} AS currency,
             (${clauses.map((clause) => `CASE WHEN ${clause} THEN 1 ELSE 0 END`).join(' + ')}) AS proof_match_score
      FROM products p
      WHERE p.product_id <> ? ${statusClause} AND (${clauses.join(' OR ')})
      ORDER BY proof_match_score DESC, p.updated_at DESC, p.product_id DESC
      LIMIT 6
    `).bind(...binds, Number(product.product_id || 0), ...binds).all().catch(() => ({ results: [] })));
    return rows.map((row) => ({
      product_id: Number(row.product_id || 0),
      slug: row.slug || '',
      name: row.name || '',
      product_category: row.product_category || '',
      featured_image_url: row.featured_image_url || '',
      price_cents: Number(row.price_cents || 0),
      currency: row.currency || 'CAD',
      proof_match_score: Number(row.proof_match_score || 0),
      proof_match_note: 'Related by material, process, locality, or product proof tags.'
    }));
  }

  let reviews = [];
  let review_summary = { review_count: 0, average_rating: 0 };
  try {
    const reviewsTable = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='product_reviews' LIMIT 1`).first();
    if (reviewsTable) {
      const reviewRows = normalizeResults(await db.prepare(`
        SELECT product_review_id, product_id, reviewer_name, rating, review_text, review_kind, is_featured, created_at
        FROM product_reviews
        WHERE status = 'approved' AND product_id = ?
        ORDER BY is_featured DESC, created_at DESC, product_review_id DESC
        LIMIT 12
      `).bind(product.product_id).all());
      reviews = reviewRows.map((row) => ({
        product_review_id: Number(row.product_review_id || 0),
        product_id: Number(row.product_id || 0),
        reviewer_name: row.reviewer_name || 'Devil n Dove customer',
        rating: Number(row.rating || 0),
        review_text: row.review_text || '',
        review_kind: row.review_kind || 'testimonial',
        is_featured: Number(row.is_featured || 0),
        created_at: row.created_at || null
      }));
      review_summary = {
        review_count: reviews.length,
        average_rating: reviews.length ? Number((reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) / reviews.length).toFixed(2)) : 0
      };
    }
  } catch {}

  const related_products = await relatedProductsByProof();
  return json({ ok: true, product, images, image_annotations, storefront_images, image_groups, resource_links, resource_summary, build_summary, trust_summary, story_notes, reviews, review_summary, related_products });
}


export async function onRequestGet(context) {
  try {
    return await handleProductDetailRequest(context);
  } catch (error) {
    return json({
      ok: false,
      error: 'Product detail is temporarily unavailable, but the page can try the shop fallback.',
      detail: String(error?.message || error || 'Unknown product detail error')
    }, 503);
  }
}
