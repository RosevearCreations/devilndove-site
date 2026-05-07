import { captureRuntimeIncident } from "./_lib/adminAudit.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || "").trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function parseColorNamesJson(value, fallbackColor = "") {
  let parsed = [];
  try {
    const raw = JSON.parse(String(value || "[]"));
    parsed = Array.isArray(raw) ? raw : [];
  } catch {}

  const values = parsed.map((item) => String(item || "").trim()).filter(Boolean);
  if (
    fallbackColor &&
    !values.some((entry) => entry.toLowerCase() === String(fallbackColor).trim().toLowerCase())
  ) {
    values.unshift(String(fallbackColor).trim());
  }
  return values;
}

async function runProductQuery(db, sql, bindings = []) {
  const stmt = db.prepare(sql);
  const result = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();
  return normalizeResults(result);
}

function shapeProducts(rows) {
  return rows.map((row) => {
    const colorNames = parseColorNamesJson(row.color_names_json, row.color_name || "");
    return {
      ...row,
      color_names: colorNames,
      color_names_text: colorNames.join(", "),
      seo_h1: row.h1_override || row.name || ""
    };
  });
}

function buildFilterGroups(products) {
  const group = (values) =>
    Object.entries(values)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label));

  const categories = {};
  const colors = {};
  const productTypes = {};
  const origins = {};
  const saleChannels = {};

  products.forEach((product) => {
    const category = normalizeText(product.product_category);
    const colorsForProduct =
      Array.isArray(product.color_names) && product.color_names.length
        ? product.color_names
        : normalizeText(product.color_name)
          ? [normalizeText(product.color_name)]
          : [];
    const productType = normalizeText(product.product_type);
    const origin = normalizeText(product.merchandise_origin);
    const channel = normalizeText(product.sale_channel);

    if (category) categories[category] = (categories[category] || 0) + 1;
    colorsForProduct.forEach((color) => {
      colors[color] = (colors[color] || 0) + 1;
    });
    if (productType) productTypes[productType] = (productTypes[productType] || 0) + 1;
    if (origin) origins[origin] = (origins[origin] || 0) + 1;
    if (channel) saleChannels[channel] = (saleChannels[channel] || 0) + 1;
  });

  return {
    categories: group(categories),
    colors: group(colors),
    product_types: group(productTypes),
    merchandise_origins: group(origins),
    sale_channels: group(saleChannels)
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB || env.DD_DB;
  const url = new URL(request.url);

  const q = normalizeText(url.searchParams.get("q")).toLowerCase();
  const product_type = normalizeText(url.searchParams.get("product_type")).toLowerCase();
  const merchandise_origin = normalizeText(url.searchParams.get("merchandise_origin")).toLowerCase();
  const sale_channel = normalizeText(url.searchParams.get("sale_channel")).toLowerCase();
  const min_price_cents = Number.isInteger(Number(url.searchParams.get("min_price_cents")))
    ? Number(url.searchParams.get("min_price_cents"))
    : null;
  const max_price_cents = Number.isInteger(Number(url.searchParams.get("max_price_cents")))
    ? Number(url.searchParams.get("max_price_cents"))
    : null;
  const requires_shipping = normalizeText(url.searchParams.get("requires_shipping"));
  const warnings = [];

  if (!db) {
    warnings.push("db_binding_unavailable");
    return json({
      ok: true,
      products: [],
      warning: "Product database is unavailable right now. Showing an empty live result.",
      summary: { total_products: 0, authority: "binding_unavailable" },
      filter_groups: {
        categories: [],
        colors: [],
        product_types: [],
        merchandise_origins: [],
        sale_channels: []
      },
      diagnostics: {
        warnings,
        query: q,
        product_type,
        merchandise_origin,
        sale_channel,
        min_price_cents,
        max_price_cents,
        requires_shipping
      }
    });
  }

  const productColumns = await getTableColumnSet(db, "products");
  const hasColorNamesJson = productColumns.has("color_names_json");

  const clauses = [`p.status = 'active'`];
  const bindings = [];

  if (q) {
    const searchParts = [
      `LOWER(COALESCE(p.name, '')) LIKE ?`,
      `LOWER(COALESCE(p.short_description, '')) LIKE ?`,
      `LOWER(COALESCE(p.description, '')) LIKE ?`,
      `LOWER(COALESCE(p.sku, '')) LIKE ?`,
      `LOWER(COALESCE(p.product_category, '')) LIKE ?`,
      `LOWER(COALESCE(p.color_name, '')) LIKE ?`
    ];

    if (hasColorNamesJson) {
      searchParts.push(`LOWER(COALESCE(p.color_names_json, '')) LIKE ?`);
    }

    searchParts.push(`LOWER(COALESCE(ps.keywords, '')) LIKE ?`);
    clauses.push(`(${searchParts.join(" OR ")})`);

    const like = `%${q}%`;
    const qBindings = [like, like, like, like, like, like];
    if (hasColorNamesJson) qBindings.push(like);
    qBindings.push(like);
    bindings.push(...qBindings);
  }

  if (["physical", "digital"].includes(product_type)) {
    clauses.push(`p.product_type = ?`);
    bindings.push(product_type);
  }

  if (["handmade", "vintage", "collectible", "antique", "oddity", "prebuilt"].includes(merchandise_origin)) {
    clauses.push(`COALESCE(p.merchandise_origin, 'handmade') = ?`);
    bindings.push(merchandise_origin);
  }

  if (["onsite", "external_only", "hybrid"].includes(sale_channel)) {
    clauses.push(`COALESCE(p.sale_channel, 'onsite') = ?`);
    bindings.push(sale_channel);
  }

  if (min_price_cents != null) {
    clauses.push(`p.price_cents >= ?`);
    bindings.push(min_price_cents);
  }

  if (max_price_cents != null) {
    clauses.push(`p.price_cents <= ?`);
    bindings.push(max_price_cents);
  }

  if (requires_shipping === "1" || requires_shipping === "0") {
    clauses.push(`p.requires_shipping = ?`);
    bindings.push(Number(requires_shipping));
  }

  const primarySql = `
    SELECT
      p.product_id,
      p.product_number,
      p.slug,
      p.sku,
      p.name,
      p.product_category,
      p.color_name,
      ${hasColorNamesJson ? "p.color_names_json," : '"" AS color_names_json,'}
      p.shipping_code,
      p.review_status,
      p.short_description,
      p.description,
      p.product_type,
      p.status,
      COALESCE(p.merchandise_origin, 'handmade') AS merchandise_origin,
      COALESCE(p.sale_channel, 'onsite') AS sale_channel,
      p.external_listing_url,
      p.external_listing_label,
      p.condition_summary,
      p.era_label,
      p.sourcing_notes,
      p.price_cents,
      p.compare_at_price_cents,
      p.currency,
      p.taxable,
      p.tax_class_id,
      p.requires_shipping,
      p.weight_grams,
      p.inventory_tracking,
      COALESCE(p.inventory_quantity, 0) AS inventory_quantity,
      p.digital_file_url,
      p.featured_image_url,
      p.sort_order,
      p.created_at,
      p.updated_at,
      tc.code AS tax_class_code,
      tc.name AS tax_class_name,
      COALESCE(tc.rate_percent, tc.tax_rate, 0) AS tax_rate,
      ps.meta_title,
      ps.meta_description,
      ps.keywords,
      ps.h1_override,
      ps.canonical_url,
      ps.og_title,
      ps.og_description,
      ps.og_image_url
    FROM products p
    LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;

  const fallbackClauses = [...clauses];
  if (q) {
    const fallbackSearchParts = [
      `LOWER(COALESCE(p.name, '')) LIKE ?`,
      `LOWER(COALESCE(p.short_description, '')) LIKE ?`,
      `LOWER(COALESCE(p.description, '')) LIKE ?`,
      `LOWER(COALESCE(p.sku, '')) LIKE ?`,
      `LOWER(COALESCE(p.product_category, '')) LIKE ?`,
      `LOWER(COALESCE(p.color_name, '')) LIKE ?`
    ];

    if (hasColorNamesJson) {
      fallbackSearchParts.push(`LOWER(COALESCE(p.color_names_json, '')) LIKE ?`);
    }

    fallbackClauses[1] = `(${fallbackSearchParts.join(" OR ")})`;
  }

  const fallbackSql = `
    SELECT
      p.product_id,
      p.product_number,
      p.slug,
      p.sku,
      p.name,
      p.product_category,
      p.color_name,
      ${hasColorNamesJson ? "p.color_names_json," : '"" AS color_names_json,'}
      p.shipping_code,
      p.review_status,
      p.short_description,
      p.description,
      p.product_type,
      p.status,
      COALESCE(p.merchandise_origin, 'handmade') AS merchandise_origin,
      COALESCE(p.sale_channel, 'onsite') AS sale_channel,
      p.external_listing_url,
      p.external_listing_label,
      p.condition_summary,
      p.era_label,
      p.sourcing_notes,
      p.price_cents,
      p.compare_at_price_cents,
      p.currency,
      p.taxable,
      p.tax_class_id,
      p.requires_shipping,
      p.weight_grams,
      p.inventory_tracking,
      COALESCE(p.inventory_quantity, 0) AS inventory_quantity,
      p.digital_file_url,
      p.featured_image_url,
      p.sort_order,
      p.created_at,
      p.updated_at,
      '' AS tax_class_code,
      '' AS tax_class_name,
      0 AS tax_rate,
      '' AS meta_title,
      '' AS meta_description,
      '' AS keywords,
      '' AS h1_override,
      '' AS canonical_url,
      '' AS og_title,
      '' AS og_description,
      '' AS og_image_url
    FROM products p
    WHERE ${fallbackClauses.join(" AND ")}
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;

  try {
    const rows = await runProductQuery(db, primarySql, bindings);
    const products = shapeProducts(rows);
    return json({
      ok: true,
      products,
      summary: { total_products: products.length, authority: "d1_primary_query" },
      filter_groups: buildFilterGroups(products),
      diagnostics: {
        warnings,
        query: q,
        product_type,
        merchandise_origin,
        sale_channel,
        min_price_cents,
        max_price_cents,
        requires_shipping
      }
    });
  } catch (primaryError) {
    warnings.push("primary_query_failed");

    await captureRuntimeIncident(env, request, {
      incident_scope: "public_catalog",
      incident_code: "products_primary_query_failed",
      severity: "warning",
      message: "Primary products query failed. Trying the fallback products query.",
      details: {
        error: String(primaryError?.message || primaryError || "Unknown primary query error"),
        query: q,
        product_type,
        merchandise_origin,
        sale_channel,
        min_price_cents,
        max_price_cents,
        requires_shipping
      }
    });

    try {
      const fbBindings = [];
      if (q) {
        const like = `%${q}%`;
        fbBindings.push(like, like, like, like, like, like);
        if (hasColorNamesJson) fbBindings.push(like);
      }
      if (["physical", "digital"].includes(product_type)) fbBindings.push(product_type);
      if (["handmade", "vintage", "collectible", "antique", "oddity", "prebuilt"].includes(merchandise_origin)) {
        fbBindings.push(merchandise_origin);
      }
      if (["onsite", "external_only", "hybrid"].includes(sale_channel)) {
        fbBindings.push(sale_channel);
      }
      if (min_price_cents != null) fbBindings.push(min_price_cents);
      if (max_price_cents != null) fbBindings.push(max_price_cents);
      if (requires_shipping === "1" || requires_shipping === "0") fbBindings.push(Number(requires_shipping));

      const rows = await runProductQuery(db, fallbackSql, fbBindings);
      const products = shapeProducts(rows);
      warnings.push("fallback_query_used");

      return json({
        ok: true,
        products,
        warning: "Fallback product query used while the richer storefront query recovers.",
        summary: { total_products: products.length, authority: "d1_fallback_query" },
        filter_groups: buildFilterGroups(products),
        diagnostics: {
          warnings,
          query: q,
          product_type,
          merchandise_origin,
          sale_channel,
          min_price_cents,
          max_price_cents,
          requires_shipping
        }
      });
    } catch (fallbackError) {
      warnings.push("fallback_query_failed");

      await captureRuntimeIncident(env, request, {
        incident_scope: "public_catalog",
        incident_code: "products_fallback_query_failed",
        severity: "error",
        message: "Both primary and fallback product queries failed. Returning a safe empty live result.",
        details: {
          primary_error: String(primaryError?.message || primaryError || "Unknown primary query error"),
          fallback_error: String(fallbackError?.message || fallbackError || "Unknown fallback query error"),
          query: q,
          product_type,
          merchandise_origin,
          sale_channel,
          min_price_cents,
          max_price_cents,
          requires_shipping
        }
      });

      return json({
        ok: true,
        products: [],
        warning: "Live product queries are unavailable right now. A safe empty result was returned.",
        error_detail: String(fallbackError?.message || primaryError?.message || "Unknown error"),
        summary: { total_products: 0, authority: "error" },
        filter_groups: {
          categories: [],
          colors: [],
          product_types: [],
          merchandise_origins: [],
          sale_channels: []
        },
        diagnostics: {
          warnings,
          query: q,
          product_type,
          merchandise_origin,
          sale_channel,
          min_price_cents,
          max_price_cents,
          requires_shipping
        }
      });
    }
  }
}
