import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  try {
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1")
      .bind(tableName)
      .first();
    return !!row;
  } catch {
    return false;
  }
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

function buildReadiness(row = {}) {
  const imageCount = Number(row.image_count || 0);
  const altCoverage = Number(row.alt_coverage_count || 0);
  const firstMerchandisingScore = Number(row.first_merchandising_score || 0);
  const averageMerchandisingScore = Number(row.average_merchandising_score || 0);
  const effectiveGalleryMerchandisingScore = Number(row.effective_gallery_merchandising_score || averageMerchandisingScore || 0);
  const weakUnapprovedGalleryImageCount = Number(row.weak_unapproved_gallery_image_count || 0);
  const checks = {
    has_name: normalizeText(row.name).length > 0,
    has_slug: normalizeText(row.slug).length > 0,
    has_price: Number(row.price_cents || 0) > 0,
    has_featured_image: normalizeText(row.featured_image_url).length > 0,
    has_short_description: normalizeText(row.short_description).length >= 40,
    has_description: normalizeText(row.description).length >= 120,
    has_meta_title: normalizeText(row.meta_title).length >= 10,
    has_meta_description: normalizeText(row.meta_description).length >= 50,
    has_category: normalizeText(row.product_category).length > 0,
    has_photo_set: imageCount >= 3,
    has_photo_alt: imageCount > 0 && altCoverage >= Math.min(3, imageCount),
    has_lead_merch_score: imageCount === 0 || firstMerchandisingScore >= 72,
    has_gallery_merch_score: imageCount === 0 || (effectiveGalleryMerchandisingScore >= 64 && weakUnapprovedGalleryImageCount === 0),
  };
  const weights = {
    has_name: 10,
    has_slug: 8,
    has_price: 12,
    has_featured_image: 12,
    has_short_description: 10,
    has_description: 8,
    has_meta_title: 8,
    has_meta_description: 8,
    has_category: 4,
    has_photo_set: 10,
    has_photo_alt: 4,
    has_lead_merch_score: 4,
    has_gallery_merch_score: 2,
  };
  const failedKeys = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  const earned = Object.entries(checks).reduce((sum, [key, ok]) => sum + (ok ? Number(weights[key] || 0) : 0), 0);
  const total = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0);
  return {
    is_ready_for_storefront: failedKeys.length === 0 ? 1 : 0,
    ready_check_notes: failedKeys.join(", "),
    publish_readiness_score: total > 0 ? Math.round((earned / total) * 100) : 0,
    image_quality_score: Math.round(([
      imageCount >= 5 ? 1 : imageCount >= 3 ? 0.8 : imageCount > 0 ? 0.45 : 0,
      imageCount > 0 ? Math.min(altCoverage / imageCount, 1) : 0,
      firstMerchandisingScore / 100,
      effectiveGalleryMerchandisingScore / 100
    ].reduce((sum, value) => sum + value, 0) / 4) * 100),
    merchandising_score: averageMerchandisingScore,
    effective_gallery_merchandising_score: effectiveGalleryMerchandisingScore,
    lead_image_merchandising_score: firstMerchandisingScore,
    previous_lead_image_merchandising_score: row.previous_lead_image_merchandising_score == null ? null : Number(row.previous_lead_image_merchandising_score || 0),
    previous_gallery_merchandising_score: row.previous_gallery_merchandising_score == null ? null : Number(row.previous_gallery_merchandising_score || 0),
    merchandising_history_recorded_at: row.merchandising_history_recorded_at || null,
    overridden_gallery_image_count: Number(row.overridden_gallery_image_count || 0),
    weak_unapproved_gallery_image_count: weakUnapprovedGalleryImageCount,
    context_image_count: Number(row.context_image_count || 0),
    record_image_count: Number(row.record_image_count || 0),
    duplicate_angle_group_count: Number(row.duplicate_angle_group_count || 0),
    duplicate_image_count: Number(row.duplicate_image_count || 0),
    readiness_checks: checks,
  };
}

async function loadProducts(db, q) {
  const hasTaxClasses = await tableExists(db, "tax_classes");
  const hasProductSeo = await tableExists(db, "product_seo");
  const hasProductImages = await tableExists(db, "product_images");
  const annotationCols = hasProductImages ? await getTableColumnSet(db, 'product_image_annotations') : new Set();
  const hasResourceLinks = await tableExists(db, "product_resource_links");
  const hasInventory = await tableExists(db, "site_item_inventory");
  const hasMediaScoreHistory = await tableExists(db, "product_media_score_history");
  const historyCols = hasMediaScoreHistory ? await getTableColumnSet(db, 'product_media_score_history') : new Set();
  const resourceLinkColumns = hasResourceLinks ? await getTableColumnSet(db, 'product_resource_links') : new Set();
  const hasConsumptionMode = resourceLinkColumns.has('consumption_mode');
  const hasLotSizeUnits = resourceLinkColumns.has('lot_size_units');
  const inventoryColumns = hasInventory ? await getTableColumnSet(db, 'site_item_inventory') : new Set();
  const usageUnitsExpr = hasInventory && inventoryColumns.has('usage_units_per_stock_unit') ? `COALESCE(NULLIF(sii.usage_units_per_stock_unit,0),1)` : `1`;
  const inventoryUnitCostExpr = hasInventory ? (inventoryColumns.has('unit_cost_cents') ? `COALESCE(sii.unit_cost_cents,0)` : (inventoryColumns.has('cost_cents') ? `COALESCE(sii.cost_cents,0)` : `0`)) : `0`;

  const clauses = ["1=1"];
  const bindings = [];

  if (q) {
    const searchable = [
      "LOWER(COALESCE(p.name, '')) LIKE ?",
      "LOWER(COALESCE(p.slug, '')) LIKE ?",
      "LOWER(COALESCE(p.sku, '')) LIKE ?",
    ];
    if (hasProductSeo) searchable.push("LOWER(COALESCE(ps.keywords, '')) LIKE ?");
    clauses.push(`(${searchable.join(" OR ")})`);
    const like = `%${q}%`;
    bindings.push(like, like, like);
    if (hasProductSeo) bindings.push(like);
  }

  const selectParts = [
    "p.*",
    hasTaxClasses ? "tc.code AS tax_class_code" : "NULL AS tax_class_code",
    hasTaxClasses ? "tc.name AS tax_class_name" : "NULL AS tax_class_name",
    hasTaxClasses ? "tc.tax_rate AS tax_rate" : "NULL AS tax_rate",
    hasProductSeo ? "ps.meta_title" : "NULL AS meta_title",
    hasProductSeo ? "ps.meta_description" : "NULL AS meta_description",
    hasProductSeo ? "ps.keywords" : "NULL AS keywords",
    hasProductSeo ? "ps.h1_override" : "NULL AS h1_override",
    hasProductImages ? "COUNT(DISTINCT pi.product_image_id) AS image_count" : "0 AS image_count",
    hasProductImages ? "COUNT(DISTINCT CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,''))) >= 5 THEN pi.product_image_id ELSE NULL END) AS alt_coverage_count" : "0 AS alt_coverage_count",
    hasProductImages ? `MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has('merchandising_score') ? 'COALESCE(pia.merchandising_score, pia.first_image_score)' : (annotationCols.has('first_image_score') ? 'pia.first_image_score' : '0')} ELSE NULL END) AS first_merchandising_score` : "0 AS first_merchandising_score",
    hasProductImages ? `AVG(COALESCE(${annotationCols.has('merchandising_score') ? 'pia.merchandising_score' : (annotationCols.has('first_image_score') ? 'pia.first_image_score' : '0')}, 0)) AS average_merchandising_score` : "0 AS average_merchandising_score",
    hasProductImages ? `AVG(CASE WHEN ${annotationCols.has('merchandising_score') ? 'COALESCE(pia.merchandising_score, pia.first_image_score, 0)' : (annotationCols.has('first_image_score') ? 'COALESCE(pia.first_image_score, 0)' : '0')} < 64 AND COALESCE(pi.sort_order,0) > 0 AND LENGTH(TRIM(COALESCE(${annotationCols.has('merchandising_override_reason') ? 'pia.merchandising_override_reason' : "''"},''))) > 0 THEN 64 ELSE COALESCE(${annotationCols.has('merchandising_score') ? 'pia.merchandising_score' : (annotationCols.has('first_image_score') ? 'pia.first_image_score' : '0')}, 0) END) AS effective_gallery_merchandising_score` : "0 AS effective_gallery_merchandising_score",
    hasProductImages ? `SUM(CASE WHEN COALESCE(pi.sort_order,0) > 0 AND LENGTH(TRIM(COALESCE(${annotationCols.has('merchandising_override_reason') ? 'pia.merchandising_override_reason' : "''"},''))) > 0 THEN 1 ELSE 0 END) AS overridden_gallery_image_count` : "0 AS overridden_gallery_image_count",
    hasProductImages ? `SUM(CASE WHEN COALESCE(pi.sort_order,0) > 0 AND COALESCE(${annotationCols.has('merchandising_score') ? 'pia.merchandising_score' : (annotationCols.has('first_image_score') ? 'pia.first_image_score' : '0')}, 0) < 64 AND LENGTH(TRIM(COALESCE(${annotationCols.has('merchandising_override_reason') ? 'pia.merchandising_override_reason' : "''"},''))) = 0 THEN 1 ELSE 0 END) AS weak_unapproved_gallery_image_count` : "0 AS weak_unapproved_gallery_image_count",
    hasProductImages && annotationCols.has('shot_style') ? `(SELECT COUNT(*) FROM product_images pi2 LEFT JOIN product_image_annotations pia2 ON pia2.product_image_id = pi2.product_image_id WHERE pi2.product_id = p.product_id AND LOWER(TRIM(COALESCE(pia2.shot_style,'record'))) IN ('lifestyle','process','packaging','scale_reference')) AS context_image_count` : "0 AS context_image_count",
    hasProductImages ? `(SELECT COUNT(*) FROM product_images pi2 LEFT JOIN product_image_annotations pia2 ON pia2.product_image_id = pi2.product_image_id WHERE pi2.product_id = p.product_id AND LOWER(TRIM(COALESCE(${annotationCols.has('shot_style') ? 'pia2.shot_style' : "'record'"},'record'))) NOT IN ('lifestyle','process','packaging','scale_reference')) AS record_image_count` : "0 AS record_image_count",
    hasProductImages && annotationCols.has('angle_group') ? `(SELECT COUNT(*) FROM (SELECT LOWER(TRIM(COALESCE(pia2.angle_group,''))) AS grp FROM product_images pi2 LEFT JOIN product_image_annotations pia2 ON pia2.product_image_id = pi2.product_image_id WHERE pi2.product_id = p.product_id AND LENGTH(TRIM(COALESCE(pia2.angle_group,''))) > 0 GROUP BY LOWER(TRIM(COALESCE(pia2.angle_group,''))) HAVING COUNT(*) > 1)) AS duplicate_angle_group_count` : "0 AS duplicate_angle_group_count",
    hasProductImages && annotationCols.has('angle_group') ? `COALESCE((SELECT SUM(group_count - 1) FROM (SELECT COUNT(*) AS group_count FROM product_images pi2 LEFT JOIN product_image_annotations pia2 ON pia2.product_image_id = pi2.product_image_id WHERE pi2.product_id = p.product_id AND LENGTH(TRIM(COALESCE(pia2.angle_group,''))) > 0 GROUP BY LOWER(TRIM(COALESCE(pia2.angle_group,''))) HAVING COUNT(*) > 1)), 0) AS duplicate_image_count` : "0 AS duplicate_image_count",
    hasMediaScoreHistory ? `(SELECT h.lead_image_score FROM product_media_score_history h WHERE h.product_id = p.product_id ORDER BY h.created_at DESC, h.product_media_score_history_id DESC LIMIT 1 OFFSET 1) AS previous_lead_image_merchandising_score` : "NULL AS previous_lead_image_merchandising_score",
    hasMediaScoreHistory ? `(SELECT h.gallery_merchandising_score FROM product_media_score_history h WHERE h.product_id = p.product_id ORDER BY h.created_at DESC, h.product_media_score_history_id DESC LIMIT 1 OFFSET 1) AS previous_gallery_merchandising_score` : "NULL AS previous_gallery_merchandising_score",
    hasMediaScoreHistory ? `(SELECT h.created_at FROM product_media_score_history h WHERE h.product_id = p.product_id ORDER BY h.created_at DESC, h.product_media_score_history_id DESC LIMIT 1) AS merchandising_history_recorded_at` : "NULL AS merchandising_history_recorded_at",
    hasResourceLinks ? "COUNT(DISTINCT prl.product_resource_link_id) AS linked_resource_count" : "0 AS linked_resource_count",
    hasResourceLinks && hasInventory
      ? `COALESCE(SUM(CASE WHEN ${hasConsumptionMode ? `COALESCE(prl.consumption_mode,'per_unit')` : `'per_unit'`} = 'story_only' THEN 0 WHEN ${hasConsumptionMode ? `COALESCE(prl.consumption_mode,'per_unit')` : `'per_unit'`} = 'end_of_lot' THEN COALESCE(prl.quantity_used, 0) * ${inventoryUnitCostExpr} / ${usageUnitsExpr} / COALESCE(NULLIF(${hasLotSizeUnits ? `prl.lot_size_units` : `1`},0),1) ELSE COALESCE(prl.quantity_used, 0) * ${inventoryUnitCostExpr} / ${usageUnitsExpr} END), 0) AS linked_resource_cost_cents`
      : "0 AS linked_resource_cost_cents",
    hasResourceLinks && hasInventory
      ? "SUM(CASE WHEN sii.site_item_inventory_id IS NULL THEN 1 ELSE 0 END) AS missing_cost_links"
      : "0 AS missing_cost_links",
    hasResourceLinks && hasInventory
      ? `MIN(CASE WHEN sii.site_item_inventory_id IS NULL THEN NULL WHEN ${hasConsumptionMode ? `COALESCE(prl.consumption_mode,'per_unit')` : `'per_unit'`} = 'story_only' THEN NULL WHEN COALESCE(prl.quantity_used, 0) > 0 AND ${hasConsumptionMode ? `COALESCE(prl.consumption_mode,'per_unit')` : `'per_unit'`} = 'end_of_lot' THEN CAST((MAX(0, COALESCE(sii.on_hand_quantity,0) - COALESCE(sii.reserved_quantity,0)) * ${usageUnitsExpr} * COALESCE(NULLIF(${hasLotSizeUnits ? `prl.lot_size_units` : `1`},0),1)) / COALESCE(NULLIF(prl.quantity_used,0),1) AS INTEGER) WHEN COALESCE(prl.quantity_used, 0) > 0 THEN CAST((MAX(0, COALESCE(sii.on_hand_quantity,0) - COALESCE(sii.reserved_quantity,0)) * ${usageUnitsExpr}) / prl.quantity_used AS INTEGER) ELSE NULL END) AS buildable_units_from_resources`
      : "NULL AS buildable_units_from_resources",
    hasResourceLinks && hasInventory
      ? `SUM(CASE WHEN sii.site_item_inventory_id IS NULL THEN 0 WHEN ${hasConsumptionMode ? `COALESCE(prl.consumption_mode,'per_unit')` : `'per_unit'`} = 'story_only' THEN 0 WHEN ${hasConsumptionMode ? `COALESCE(prl.consumption_mode,'per_unit')` : `'per_unit'`} = 'end_of_lot' AND COALESCE(prl.quantity_used,0) > 0 AND (MAX(0, COALESCE(sii.on_hand_quantity,0) - COALESCE(sii.reserved_quantity,0)) * ${usageUnitsExpr} * COALESCE(NULLIF(${hasLotSizeUnits ? `prl.lot_size_units` : `1`},0),1)) < COALESCE(prl.quantity_used,0) THEN 1 WHEN COALESCE(prl.quantity_used,0) > 0 AND (MAX(0, COALESCE(sii.on_hand_quantity,0) - COALESCE(sii.reserved_quantity,0)) * ${usageUnitsExpr}) < COALESCE(prl.quantity_used,0) THEN 1 ELSE 0 END) AS resource_shortage_links`
      : "0 AS resource_shortage_links",
    "CASE WHEN COALESCE(p.inventory_tracking,0)=1 AND COALESCE(p.inventory_quantity,0) <= 2 THEN 1 ELSE 0 END AS low_stock_flag",
  ];

  const joinParts = [];
  if (hasTaxClasses) joinParts.push("LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id");
  if (hasProductSeo) joinParts.push("LEFT JOIN product_seo ps ON ps.product_id = p.product_id");
  if (hasProductImages) joinParts.push("LEFT JOIN product_images pi ON pi.product_id = p.product_id");
  if (hasProductImages) joinParts.push("LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id");
  if (hasResourceLinks) joinParts.push("LEFT JOIN product_resource_links prl ON prl.product_id = p.product_id");
  if (hasResourceLinks && hasInventory) {
    joinParts.push(
      "LEFT JOIN site_item_inventory sii ON sii.source_type = prl.resource_kind AND sii.external_key = prl.source_key"
    );
  }

  const sql = `
    SELECT ${selectParts.join(",\n           ")}
    FROM products p
    ${joinParts.join("\n    ")}
    WHERE ${clauses.join(" AND ")}
    GROUP BY p.product_id
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;

  const result = bindings.length
    ? await db.prepare(sql).bind(...bindings).all()
    : await db.prepare(sql).all();

  return {
    rawProducts: normalizeResults(result),
    features: {
      hasTaxClasses,
      hasProductSeo,
      hasProductImages,
      hasResourceLinks,
      hasInventory,
      hasMediaScoreHistory,
      hasMediaMixHistory: historyCols.has('shot_mix_json') || historyCols.has('angle_mix_json'),
    },
  };
}

async function loadProductsFallback(db, q) {
  const clauses = ["1=1"];
  const bindings = [];
  if (q) {
    clauses.push("(LOWER(COALESCE(name, '')) LIKE ? OR LOWER(COALESCE(slug, '')) LIKE ? OR LOWER(COALESCE(sku, '')) LIKE ?)");
    const like = `%${q}%`;
    bindings.push(like, like, like);
  }

  const sql = `
    SELECT
      p.*,
      NULL AS tax_class_code,
      NULL AS tax_class_name,
      NULL AS tax_rate,
      NULL AS meta_title,
      NULL AS meta_description,
      NULL AS keywords,
      NULL AS h1_override,
      0 AS image_count,
      0 AS alt_coverage_count,
      0 AS first_merchandising_score,
      0 AS average_merchandising_score,
      0 AS linked_resource_count,
      0 AS linked_resource_cost_cents,
      0 AS missing_cost_links,
      NULL AS buildable_units_from_resources,
      0 AS resource_shortage_links,
      CASE WHEN COALESCE(p.inventory_tracking,0)=1 AND COALESCE(p.inventory_quantity,0) <= 2 THEN 1 ELSE 0 END AS low_stock_flag
    FROM products p
    WHERE ${clauses.join(" AND ")}
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;

  const result = bindings.length
    ? await db.prepare(sql).bind(...bindings).all()
    : await db.prepare(sql).all();

  return {
    rawProducts: normalizeResults(result),
    features: {
      hasTaxClasses: false,
      hasProductSeo: false,
      hasProductImages: false,
      hasResourceLinks: false,
      hasInventory: false,
      fallbackMode: true,
    },
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get("q")).toLowerCase();

  let loaded;
  let warnings = [];

  try {
    loaded = await loadProducts(db, q);
  } catch (error) {
    warnings.push(`Primary product rollup query failed: ${String(error?.message || error || "Unknown error")}`);
    try {
      loaded = await loadProductsFallback(db, q);
    } catch (fallbackError) {
      return json(
        {
          ok: false,
          error: "Could not load admin products.",
          warnings: [
            ...warnings,
            `Fallback query failed: ${String(fallbackError?.message || fallbackError || "Unknown error")}`,
          ],
        },
        500
      );
    }
  }

  const products = loaded.rawProducts.map((row) => {
    const linkedResourceCost = Number(row.linked_resource_cost_cents || 0);
    const priceCents = Number(row.price_cents || 0);
    return {
      ...row,
      low_stock_flag: Number(row.low_stock_flag || 0),
      image_count: Number(row.image_count || 0),
      linked_resource_count: Number(row.linked_resource_count || 0),
      linked_resource_cost_cents: linkedResourceCost,
      gross_margin_cents: priceCents - linkedResourceCost,
      gross_margin_ratio: priceCents > 0 ? Number(((priceCents - linkedResourceCost) / priceCents).toFixed(4)) : 0,
      missing_cost_links: Number(row.missing_cost_links || 0),
      buildable_units_from_resources:
        row.buildable_units_from_resources == null ? null : Number(row.buildable_units_from_resources || 0),
      resource_shortage_links: Number(row.resource_shortage_links || 0),
      ...buildReadiness(row),
    };
  });

  return json({
    ok: true,
    requested_by: adminUser,
    products,
    warnings,
    feature_flags: loaded.features,
    summary: {
      total_products: products.length,
      low_stock_products: products.filter((row) => Number(row.low_stock_flag || 0) === 1).length,
      ready_for_storefront_products: products.filter((row) => Number(row.is_ready_for_storefront || 0) === 1).length,
      pending_review_products: products.filter((row) => String(row.review_status || "").toLowerCase() === "pending_review").length,
      products_with_cost_rollups: products.filter((row) => Number(row.linked_resource_count || 0) > 0).length,
      products_missing_cost_links: products.filter((row) => Number(row.missing_cost_links || 0) > 0).length,
      products_with_resource_shortages: products.filter((row) => Number(row.resource_shortage_links || 0) > 0).length,
      products_with_duplicate_angle_groups: products.filter((row) => Number(row.duplicate_angle_group_count || 0) > 0).length,
      products_missing_context_shots: products.filter((row) => Number(row.image_count || 0) >= 3 && Number(row.context_image_count || 0) === 0).length,
    },
  });
}
