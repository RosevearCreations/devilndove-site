import {
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from "../_lib/adminAudit.js";
import { tableExists } from "./_costing.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function buildReadiness(row = {}) {
  const checks = {
    has_name: normalizeText(row.name).length > 0,
    has_slug: normalizeText(row.slug).length > 0,
    has_price: Number(row.price_cents || 0) > 0,
    has_featured_image: normalizeText(row.featured_image_url).length > 0,
    has_short_description: normalizeText(row.short_description).length >= 40,
    has_meta_title: normalizeText(row.meta_title).length >= 10,
    has_meta_description: normalizeText(row.meta_description).length >= 50,
    has_category: normalizeText(row.product_category).length > 0,
  };
  const failedKeys = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);
  return {
    is_ready_for_storefront: failedKeys.length === 0 ? 1 : 0,
    ready_check_notes: failedKeys.join(", "),
    readiness_checks: checks,
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function safeAll(db, sql, bindings = []) {
  try {
    const result = await db.prepare(sql).bind(...bindings).all();
    return normalizeResults(result);
  } catch {
    return [];
  }
}

function buildProductSql(flags, hasQuery) {
  const selectFields = [
    "p.*",
    flags.hasTaxClasses
      ? "tc.code AS tax_class_code, tc.name AS tax_class_name, tc.tax_rate AS tax_rate"
      : "'' AS tax_class_code, '' AS tax_class_name, 0 AS tax_rate",
    flags.hasProductSeo
      ? "ps.meta_title, ps.meta_description, ps.keywords, ps.h1_override"
      : "'' AS meta_title, '' AS meta_description, '' AS keywords, '' AS h1_override",
    flags.hasProductImages
      ? "COUNT(DISTINCT pi.product_image_id) AS image_count"
      : "0 AS image_count",
    flags.hasProductResourceLinks
      ? "COUNT(DISTINCT prl.product_resource_link_id) AS linked_resource_count"
      : "0 AS linked_resource_count",
    flags.hasProductResourceLinks && flags.hasInventory
      ? "COALESCE(SUM(CASE WHEN sii.site_item_inventory_id IS NOT NULL THEN COALESCE(prl.quantity_used, 0) * COALESCE(sii.unit_cost_cents, 0) ELSE 0 END), 0) AS linked_resource_cost_cents"
      : "0 AS linked_resource_cost_cents",
    flags.hasProductResourceLinks && flags.hasInventory
      ? "COALESCE(SUM(CASE WHEN sii.site_item_inventory_id IS NULL THEN 1 ELSE 0 END), 0) AS missing_cost_links"
      : flags.hasProductResourceLinks
        ? "COUNT(DISTINCT prl.product_resource_link_id) AS missing_cost_links"
        : "0 AS missing_cost_links",
    flags.hasProductResourceLinks && flags.hasInventory
      ? "MIN(CASE WHEN COALESCE(prl.quantity_used, 0) > 0 AND sii.site_item_inventory_id IS NOT NULL THEN CAST(MAX(0, COALESCE(sii.on_hand_quantity,0) - COALESCE(sii.reserved_quantity,0)) / prl.quantity_used AS INTEGER) ELSE NULL END) AS buildable_units_from_resources"
      : "NULL AS buildable_units_from_resources",
    flags.hasProductResourceLinks && flags.hasInventory
      ? "COALESCE(SUM(CASE WHEN COALESCE(prl.quantity_used, 0) > 0 AND sii.site_item_inventory_id IS NOT NULL AND MAX(0, COALESCE(sii.on_hand_quantity,0) - COALESCE(sii.reserved_quantity,0)) < COALESCE(prl.quantity_used,0) THEN 1 ELSE 0 END), 0) AS resource_shortage_links"
      : "0 AS resource_shortage_links",
    "CASE WHEN COALESCE(p.inventory_tracking,0)=1 AND COALESCE(p.inventory_quantity,0) <= 2 THEN 1 ELSE 0 END AS low_stock_flag",
  ];

  const joins = [];
  if (flags.hasTaxClasses) joins.push("LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id");
  if (flags.hasProductSeo) joins.push("LEFT JOIN product_seo ps ON ps.product_id = p.product_id");
  if (flags.hasProductImages) joins.push("LEFT JOIN product_images pi ON pi.product_id = p.product_id");
  if (flags.hasProductResourceLinks) joins.push("LEFT JOIN product_resource_links prl ON prl.product_id = p.product_id");
  if (flags.hasProductResourceLinks && flags.hasInventory) {
    joins.push("LEFT JOIN site_item_inventory sii ON sii.source_type = prl.resource_kind AND sii.external_key = prl.source_key");
  }

  const clauses = ["1=1"];
  if (hasQuery) {
    const searchable = ["LOWER(COALESCE(p.name, '')) LIKE ?", "LOWER(COALESCE(p.slug, '')) LIKE ?", "LOWER(COALESCE(p.sku, '')) LIKE ?"];
    if (flags.hasProductSeo) searchable.push("LOWER(COALESCE(ps.keywords, '')) LIKE ?");
    clauses.push(`(${searchable.join(" OR ")})`);
  }

  return `
    SELECT ${selectFields.join(",\n           ")}
    FROM products p
    ${joins.join("\n    ")}
    WHERE ${clauses.join(" AND ")}
    GROUP BY p.product_id
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;
}

function buildBindings(query, flags) {
  if (!query) return [];
  const like = `%${query}%`;
  const bindings = [like, like, like];
  if (flags.hasProductSeo) bindings.push(like);
  return bindings;
}

function shapeProducts(rawProducts) {
  return rawProducts.map((row) => {
    const linkedResourceCost = Number(row.linked_resource_cost_cents || 0);
    const priceCents = Number(row.price_cents || 0);
    return {
      ...row,
      image_count: Number(row.image_count || 0),
      linked_resource_count: Number(row.linked_resource_count || 0),
      linked_resource_cost_cents: linkedResourceCost,
      gross_margin_cents: priceCents - linkedResourceCost,
      gross_margin_ratio: priceCents > 0 ? Number(((priceCents - linkedResourceCost) / priceCents).toFixed(4)) : 0,
      missing_cost_links: Number(row.missing_cost_links || 0),
      buildable_units_from_resources:
        row.buildable_units_from_resources == null ? null : Number(row.buildable_units_from_resources || 0),
      resource_shortage_links: Number(row.resource_shortage_links || 0),
      low_stock_flag: Number(row.low_stock_flag || 0),
      ...buildReadiness(row),
    };
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const hasProducts = await tableExists(db, "products");
  if (!hasProducts) {
    return json({
      ok: true,
      requested_by: adminUser,
      products: [],
      summary: {
        total_products: 0,
        low_stock_products: 0,
        ready_for_storefront_products: 0,
        pending_review_products: 0,
        products_with_cost_rollups: 0,
        products_missing_cost_links: 0,
        products_with_resource_shortages: 0,
      },
      warnings: ["Products table is not available yet on this database."],
    });
  }

  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get("q")).toLowerCase();

  const flags = {
    hasTaxClasses: await tableExists(db, "tax_classes"),
    hasProductSeo: await tableExists(db, "product_seo"),
    hasProductImages: await tableExists(db, "product_images"),
    hasProductResourceLinks: await tableExists(db, "product_resource_links"),
    hasInventory: await tableExists(db, "site_item_inventory"),
  };

  try {
    const sql = buildProductSql(flags, Boolean(q));
    const bindings = buildBindings(q, flags);
    const rawProducts = await safeAll(db, sql, bindings);
    const products = shapeProducts(rawProducts);

    return json({
      ok: true,
      requested_by: adminUser,
      products,
      summary: {
        total_products: products.length,
        low_stock_products: products.filter((row) => Number(row.low_stock_flag || 0) === 1).length,
        ready_for_storefront_products: products.filter((row) => Number(row.is_ready_for_storefront || 0) === 1).length,
        pending_review_products: products.filter((row) => String(row.review_status || "").toLowerCase() === "pending_review").length,
        products_with_cost_rollups: products.filter((row) => Number(row.linked_resource_count || 0) > 0).length,
        products_missing_cost_links: products.filter((row) => Number(row.missing_cost_links || 0) > 0).length,
        products_with_resource_shortages: products.filter((row) => Number(row.resource_shortage_links || 0) > 0).length,
      },
      warnings: [
        !flags.hasProductSeo ? "Product SEO table is missing, so SEO readiness fields are using safe fallbacks." : null,
        !flags.hasProductImages ? "Product images table is missing, so image counts are using safe fallbacks." : null,
        !flags.hasProductResourceLinks ? "Product resource links table is missing, so cost rollups are using safe fallbacks." : null,
        flags.hasProductResourceLinks && !flags.hasInventory ? "Site inventory table is missing, so linked resource cost rollups are using safe fallbacks." : null,
      ].filter(Boolean),
    });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: "admin_products",
      incident_code: "products_list_failed",
      severity: "error",
      related_user_id: adminUser.user_id,
      message: "Failed to load admin products list.",
      details: {
        error: String(error?.message || error || "Unknown error"),
        flags,
        query: q,
      },
    });

    const fallbackRows = await safeAll(
      db,
      `SELECT p.*, '' AS meta_title, '' AS meta_description, '' AS keywords, '' AS h1_override, 0 AS image_count, 0 AS linked_resource_count, 0 AS linked_resource_cost_cents, 0 AS missing_cost_links, NULL AS buildable_units_from_resources, 0 AS resource_shortage_links, CASE WHEN COALESCE(p.inventory_tracking,0)=1 AND COALESCE(p.inventory_quantity,0) <= 2 THEN 1 ELSE 0 END AS low_stock_flag FROM products p WHERE (? = '' OR LOWER(COALESCE(p.name, '')) LIKE ? OR LOWER(COALESCE(p.slug, '')) LIKE ? OR LOWER(COALESCE(p.sku, '')) LIKE ?) ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC`,
      q ? [`${q}`, `%${q}%`, `%${q}%`, `%${q}%`] : ["", "%%", "%%", "%%"]
    );
    const products = shapeProducts(fallbackRows);

    return json({
      ok: true,
      requested_by: adminUser,
      products,
      summary: {
        total_products: products.length,
        low_stock_products: products.filter((row) => Number(row.low_stock_flag || 0) === 1).length,
        ready_for_storefront_products: products.filter((row) => Number(row.is_ready_for_storefront || 0) === 1).length,
        pending_review_products: products.filter((row) => String(row.review_status || "").toLowerCase() === "pending_review").length,
        products_with_cost_rollups: 0,
        products_missing_cost_links: 0,
        products_with_resource_shortages: 0,
      },
      warnings: ["Live product rollups are temporarily unavailable. Showing a safer fallback list."],
    });
  }
}
