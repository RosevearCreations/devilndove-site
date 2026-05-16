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


const SCHEMA_CACHE_MS = 5 * 60 * 1000;
const schemaColumnCache = new Map();

const PRODUCT_COLUMN_CANDIDATES = [
  "product_id", "product_number", "slug", "sku", "name", "product_category", "color_name",
  "color_names_json", "shipping_code", "review_status", "short_description", "description",
  "product_type", "status", "merchandise_origin", "sale_channel", "external_listing_url",
  "external_listing_label", "condition_summary", "era_label", "sourcing_notes", "price_cents",
  "compare_at_price_cents", "currency", "taxable", "tax_class_id", "requires_shipping",
  "weight_grams", "inventory_tracking", "inventory_quantity", "digital_file_url",
  "featured_image_url", "sort_order", "created_at", "updated_at"
];

const TAX_COLUMN_CANDIDATES = ["tax_class_id", "code", "name", "rate_percent", "tax_rate"];
const SEO_COLUMN_CANDIDATES = [
  "product_id", "meta_title", "meta_description", "keywords", "h1_override", "canonical_url",
  "og_title", "og_description", "og_image_url"
];

function safeIdentifier(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text) ? text : "";
}

async function canSelectColumn(db, tableName, columnName) {
  const safeTable = safeIdentifier(tableName);
  const safeColumn = safeIdentifier(columnName);
  if (!safeTable || !safeColumn) return false;
  try {
    await db.prepare(`SELECT ${safeColumn} FROM ${safeTable} LIMIT 0`).all();
    return true;
  } catch {
    return false;
  }
}

function parseOptionalInteger(value) {
  const text = normalizeText(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) ? number : null;
}

function sqlString(value) {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

async function getTableColumnSet(db, tableName) {
  try {
    const safeTable = safeIdentifier(tableName);
    if (!safeTable) return new Set();
    const result = await db.prepare(`PRAGMA table_info(${safeTable})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || "").trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function getVerifiedTableColumnSet(db, tableName, candidateColumns = []) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();

  const cacheKey = `${safeTable}:${candidateColumns.join(",")}`;
  const cached = schemaColumnCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < SCHEMA_CACHE_MS) {
    return new Set(cached.columns);
  }

  const pragmaColumns = await getTableColumnSet(db, safeTable);
  const candidates = new Set([
    ...Array.from(pragmaColumns),
    ...candidateColumns
  ].filter((columnName) => safeIdentifier(columnName)));

  const verified = new Set();
  for (const columnName of candidates) {
    if (await canSelectColumn(db, safeTable, columnName)) {
      verified.add(columnName);
    }
  }

  schemaColumnCache.set(cacheKey, {
    cachedAt: Date.now(),
    columns: Array.from(verified)
  });

  return verified;
}

function selectColumn(columns, alias, columnName, fallbackSql, outputName = columnName) {
  return columns.has(columnName)
    ? `${alias}.${columnName} AS ${outputName}`
    : `${fallbackSql} AS ${outputName}`;
}

function taxRateExpression(taxColumns) {
  const parts = [];
  if (taxColumns.has("rate_percent")) parts.push("tc.rate_percent");
  if (taxColumns.has("tax_rate")) parts.push("tc.tax_rate");
  if (!parts.length) return "0 AS tax_rate";
  return `COALESCE(${parts.join(", ")}, 0) AS tax_rate`;
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

function buildWhere({ productColumns, seoColumns, hasSeoJoin, filters, includeSeoKeywords }) {
  const clauses = [];
  const bindings = [];
  const warnings = [];

  if (productColumns.has("status")) {
    clauses.push(`p.status = 'active'`);
  } else {
    clauses.push(`1 = 1`);
    warnings.push("products_status_column_missing");
  }

  if (filters.q) {
    const like = `%${filters.q}%`;
    const searchParts = [];
    [
      "name",
      "short_description",
      "description",
      "sku",
      "product_category",
      "color_name",
      "color_names_json"
    ].forEach((columnName) => {
      if (productColumns.has(columnName)) {
        searchParts.push(`LOWER(COALESCE(p.${columnName}, '')) LIKE ?`);
        bindings.push(like);
      }
    });

    if (includeSeoKeywords && hasSeoJoin && seoColumns.has("keywords")) {
      searchParts.push(`LOWER(COALESCE(ps.keywords, '')) LIKE ?`);
      bindings.push(like);
    }

    if (searchParts.length) {
      clauses.push(`(${searchParts.join(" OR ")})`);
    } else {
      warnings.push("products_search_columns_missing");
    }
  }

  if (["physical", "digital"].includes(filters.product_type)) {
    if (productColumns.has("product_type")) {
      clauses.push(`p.product_type = ?`);
      bindings.push(filters.product_type);
    } else {
      warnings.push("product_type_filter_skipped_column_missing");
    }
  }

  if (["handmade", "vintage", "collectible", "antique", "oddity", "prebuilt"].includes(filters.merchandise_origin)) {
    if (productColumns.has("merchandise_origin")) {
      clauses.push(`COALESCE(p.merchandise_origin, 'handmade') = ?`);
      bindings.push(filters.merchandise_origin);
    } else {
      warnings.push("merchandise_origin_filter_skipped_column_missing");
    }
  }

  if (["onsite", "external_only", "hybrid"].includes(filters.sale_channel)) {
    if (productColumns.has("sale_channel")) {
      clauses.push(`COALESCE(p.sale_channel, 'onsite') = ?`);
      bindings.push(filters.sale_channel);
    } else {
      warnings.push("sale_channel_filter_skipped_column_missing");
    }
  }

  if (filters.color_name) {
    const colorParts = [];
    if (productColumns.has("color_name")) {
      colorParts.push(`LOWER(COALESCE(p.color_name, '')) = ?`);
      bindings.push(filters.color_name);
    }
    if (productColumns.has("color_names_json")) {
      colorParts.push(`LOWER(COALESCE(p.color_names_json, '')) LIKE ?`);
      bindings.push(`%${filters.color_name}%`);
    }
    if (colorParts.length) {
      clauses.push(`(${colorParts.join(" OR ")})`);
    } else {
      warnings.push("color_filter_skipped_column_missing");
    }
  }

  if (filters.min_price_cents != null) {
    if (productColumns.has("price_cents")) {
      clauses.push(`p.price_cents >= ?`);
      bindings.push(filters.min_price_cents);
    } else {
      warnings.push("min_price_filter_skipped_column_missing");
    }
  }

  if (filters.max_price_cents != null) {
    if (productColumns.has("price_cents")) {
      clauses.push(`p.price_cents <= ?`);
      bindings.push(filters.max_price_cents);
    } else {
      warnings.push("max_price_filter_skipped_column_missing");
    }
  }

  if (filters.requires_shipping === "1" || filters.requires_shipping === "0") {
    if (productColumns.has("requires_shipping")) {
      clauses.push(`p.requires_shipping = ?`);
      bindings.push(Number(filters.requires_shipping));
    } else {
      warnings.push("requires_shipping_filter_skipped_column_missing");
    }
  }

  return {
    whereSql: clauses.length ? clauses.join(" AND ") : "1 = 1",
    bindings,
    warnings
  };
}

function buildOrderBy(productColumns) {
  const parts = [];
  if (productColumns.has("sort_order")) parts.push("p.sort_order ASC");
  if (productColumns.has("created_at")) parts.push("p.created_at DESC");
  if (productColumns.has("product_id")) parts.push("p.product_id DESC");
  return parts.length ? parts.join(", ") : "1";
}

function buildProductSelectSql({ productColumns, taxColumns, seoColumns, hasTaxJoin, hasSeoJoin, whereSql, includeJoins }) {
  const joins = [];
  if (includeJoins && hasTaxJoin) {
    joins.push("LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id");
  }
  if (includeJoins && hasSeoJoin) {
    joins.push("LEFT JOIN product_seo ps ON ps.product_id = p.product_id");
  }

  const taxSelects = includeJoins && hasTaxJoin
    ? [
        selectColumn(taxColumns, "tc", "code", "''", "tax_class_code"),
        selectColumn(taxColumns, "tc", "name", "''", "tax_class_name"),
        taxRateExpression(taxColumns)
      ]
    : ["'' AS tax_class_code", "'' AS tax_class_name", "0 AS tax_rate"];

  const seoSelects = includeJoins && hasSeoJoin
    ? [
        selectColumn(seoColumns, "ps", "meta_title", "''"),
        selectColumn(seoColumns, "ps", "meta_description", "''"),
        selectColumn(seoColumns, "ps", "keywords", "''"),
        selectColumn(seoColumns, "ps", "h1_override", "''"),
        selectColumn(seoColumns, "ps", "canonical_url", "''"),
        selectColumn(seoColumns, "ps", "og_title", "''"),
        selectColumn(seoColumns, "ps", "og_description", "''"),
        selectColumn(seoColumns, "ps", "og_image_url", "''")
      ]
    : [
        "'' AS meta_title",
        "'' AS meta_description",
        "'' AS keywords",
        "'' AS h1_override",
        "'' AS canonical_url",
        "'' AS og_title",
        "'' AS og_description",
        "'' AS og_image_url"
      ];

  const selectList = [
    selectColumn(productColumns, "p", "product_id", "NULL"),
    selectColumn(productColumns, "p", "product_number", "NULL"),
    selectColumn(productColumns, "p", "slug", "''"),
    selectColumn(productColumns, "p", "sku", "''"),
    selectColumn(productColumns, "p", "name", sqlString("Untitled product")),
    selectColumn(productColumns, "p", "product_category", "''"),
    selectColumn(productColumns, "p", "color_name", "''"),
    selectColumn(productColumns, "p", "color_names_json", sqlString("[]")),
    selectColumn(productColumns, "p", "shipping_code", "''"),
    selectColumn(productColumns, "p", "review_status", sqlString("published")),
    selectColumn(productColumns, "p", "short_description", "''"),
    selectColumn(productColumns, "p", "description", "''"),
    selectColumn(productColumns, "p", "product_type", sqlString("physical")),
    selectColumn(productColumns, "p", "status", sqlString("active")),
    selectColumn(productColumns, "p", "merchandise_origin", sqlString("handmade")),
    selectColumn(productColumns, "p", "sale_channel", sqlString("onsite")),
    selectColumn(productColumns, "p", "external_listing_url", "''"),
    selectColumn(productColumns, "p", "external_listing_label", "''"),
    selectColumn(productColumns, "p", "condition_summary", "''"),
    selectColumn(productColumns, "p", "era_label", "''"),
    selectColumn(productColumns, "p", "sourcing_notes", "''"),
    selectColumn(productColumns, "p", "price_cents", "0"),
    selectColumn(productColumns, "p", "compare_at_price_cents", "NULL"),
    selectColumn(productColumns, "p", "currency", sqlString("CAD")),
    selectColumn(productColumns, "p", "taxable", "1"),
    selectColumn(productColumns, "p", "tax_class_id", "NULL"),
    selectColumn(productColumns, "p", "requires_shipping", "0"),
    selectColumn(productColumns, "p", "weight_grams", "NULL"),
    selectColumn(productColumns, "p", "inventory_tracking", "0"),
    productColumns.has("inventory_quantity")
      ? "COALESCE(p.inventory_quantity, 0) AS inventory_quantity"
      : "0 AS inventory_quantity",
    selectColumn(productColumns, "p", "digital_file_url", "''"),
    selectColumn(productColumns, "p", "featured_image_url", "''"),
    selectColumn(productColumns, "p", "sort_order", "0"),
    selectColumn(productColumns, "p", "created_at", "''"),
    selectColumn(productColumns, "p", "updated_at", "''"),
    ...taxSelects,
    ...seoSelects
  ];

  return `
    SELECT
      ${selectList.join(",\n      ")}
    FROM products p
    ${joins.join("\n    ")}
    WHERE ${whereSql}
    ORDER BY ${buildOrderBy(productColumns)}
  `;
}


function buildProductSafeFallbackSql({ productColumns, whereSql }) {
  const selectList = [
    selectColumn(productColumns, "p", "product_id", "NULL"),
    selectColumn(productColumns, "p", "product_number", "NULL"),
    selectColumn(productColumns, "p", "slug", "''"),
    selectColumn(productColumns, "p", "sku", "''"),
    selectColumn(productColumns, "p", "name", sqlString("Untitled product")),
    selectColumn(productColumns, "p", "product_category", "''"),
    selectColumn(productColumns, "p", "color_name", "''"),
    selectColumn(productColumns, "p", "color_names_json", sqlString("[]")),
    selectColumn(productColumns, "p", "shipping_code", "''"),
    selectColumn(productColumns, "p", "review_status", sqlString("published")),
    selectColumn(productColumns, "p", "short_description", "''"),
    selectColumn(productColumns, "p", "description", "''"),
    "'physical' AS product_type",
    selectColumn(productColumns, "p", "status", sqlString("active")),
    "'handmade' AS merchandise_origin",
    "'onsite' AS sale_channel",
    "'' AS external_listing_url",
    "'' AS external_listing_label",
    "'' AS condition_summary",
    "'' AS era_label",
    "'' AS sourcing_notes",
    selectColumn(productColumns, "p", "price_cents", "0"),
    "NULL AS compare_at_price_cents",
    selectColumn(productColumns, "p", "currency", sqlString("CAD")),
    selectColumn(productColumns, "p", "taxable", "1"),
    selectColumn(productColumns, "p", "tax_class_id", "NULL"),
    selectColumn(productColumns, "p", "requires_shipping", "0"),
    selectColumn(productColumns, "p", "weight_grams", "NULL"),
    selectColumn(productColumns, "p", "inventory_tracking", "0"),
    productColumns.has("inventory_quantity")
      ? "COALESCE(p.inventory_quantity, 0) AS inventory_quantity"
      : "0 AS inventory_quantity",
    selectColumn(productColumns, "p", "digital_file_url", "''"),
    selectColumn(productColumns, "p", "featured_image_url", "''"),
    selectColumn(productColumns, "p", "sort_order", "0"),
    selectColumn(productColumns, "p", "created_at", "''"),
    selectColumn(productColumns, "p", "updated_at", "''"),
    "'' AS tax_class_code",
    "'' AS tax_class_name",
    "0 AS tax_rate",
    "'' AS meta_title",
    "'' AS meta_description",
    "'' AS keywords",
    "'' AS h1_override",
    "'' AS canonical_url",
    "'' AS og_title",
    "'' AS og_description",
    "'' AS og_image_url"
  ];

  return `
    SELECT
      ${selectList.join(",\n      ")}
    FROM products p
    WHERE ${whereSql}
    ORDER BY ${buildOrderBy(productColumns)}
  `;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB || env.DD_DB;
  const url = new URL(request.url);

  const filters = {
    q: normalizeText(url.searchParams.get("q")).toLowerCase(),
    product_type: normalizeText(url.searchParams.get("product_type")).toLowerCase(),
    merchandise_origin: normalizeText(url.searchParams.get("merchandise_origin")).toLowerCase(),
    sale_channel: normalizeText(url.searchParams.get("sale_channel")).toLowerCase(),
    color_name: normalizeText(url.searchParams.get("color_name")).toLowerCase(),
    min_price_cents: parseOptionalInteger(url.searchParams.get("min_price_cents")),
    max_price_cents: parseOptionalInteger(url.searchParams.get("max_price_cents")),
    requires_shipping: normalizeText(url.searchParams.get("requires_shipping"))
  };
  const warnings = [];

  const emptyFilterGroups = {
    categories: [],
    colors: [],
    product_types: [],
    merchandise_origins: [],
    sale_channels: []
  };

  if (!db) {
    warnings.push("db_binding_unavailable");
    return json({
      ok: true,
      products: [],
      warning: "Product database is unavailable right now. Showing an empty live result.",
      summary: { total_products: 0, authority: "binding_unavailable" },
      filter_groups: emptyFilterGroups,
      diagnostics: { warnings, ...filters }
    });
  }

  const productColumns = await getVerifiedTableColumnSet(db, "products", PRODUCT_COLUMN_CANDIDATES);
  const taxColumns = await getVerifiedTableColumnSet(db, "tax_classes", TAX_COLUMN_CANDIDATES);
  const seoColumns = await getVerifiedTableColumnSet(db, "product_seo", SEO_COLUMN_CANDIDATES);

  if (!productColumns.size) {
    warnings.push("products_table_missing_or_unreadable");
    await captureRuntimeIncident(env, request, {
      incident_scope: "public_catalog",
      incident_code: "products_table_missing_or_unreadable",
      severity: "error",
      message: "The public products endpoint could not inspect the products table.",
      details: { ...filters }
    });
    return json({
      ok: true,
      products: [],
      warning: "Product database schema is unavailable right now. A safe empty result was returned.",
      summary: { total_products: 0, authority: "schema_unavailable" },
      filter_groups: emptyFilterGroups,
      diagnostics: { warnings, ...filters }
    });
  }

  const hasTaxJoin = productColumns.has("tax_class_id") && taxColumns.has("tax_class_id");
  const hasSeoJoin = seoColumns.has("product_id");

  if (!hasTaxJoin) warnings.push("tax_class_join_skipped_schema_not_ready");
  if (!hasSeoJoin) warnings.push("product_seo_join_skipped_schema_not_ready");

  const primaryWhere = buildWhere({
    productColumns,
    seoColumns,
    hasSeoJoin,
    filters,
    includeSeoKeywords: true
  });
  warnings.push(...primaryWhere.warnings);

  const primarySql = buildProductSelectSql({
    productColumns,
    taxColumns,
    seoColumns,
    hasTaxJoin,
    hasSeoJoin,
    whereSql: primaryWhere.whereSql,
    includeJoins: true
  });

  try {
    const rows = await runProductQuery(db, primarySql, primaryWhere.bindings);
    const products = shapeProducts(rows);
    return json({
      ok: true,
      products,
      summary: { total_products: products.length, authority: "d1_adaptive_query" },
      filter_groups: buildFilterGroups(products),
      diagnostics: { warnings, ...filters }
    });
  } catch (primaryError) {
    warnings.push("primary_query_failed");

    await captureRuntimeIncident(env, request, {
      incident_scope: "public_catalog",
      incident_code: "products_primary_query_failed",
      severity: "warning",
      message: "Primary adaptive products query failed. Trying the product-only fallback query.",
      details: {
        error: String(primaryError?.message || primaryError || "Unknown primary query error"),
        warnings,
        ...filters
      }
    });

    const fallbackWhere = buildWhere({
      productColumns,
      seoColumns: new Set(),
      hasSeoJoin: false,
      filters,
      includeSeoKeywords: false
    });
    warnings.push(...fallbackWhere.warnings.map((warning) => `fallback_${warning}`));

    const fallbackSql = buildProductSafeFallbackSql({
      productColumns,
      whereSql: fallbackWhere.whereSql
    });

    try {
      const rows = await runProductQuery(db, fallbackSql, fallbackWhere.bindings);
      const products = shapeProducts(rows);
      warnings.push("fallback_query_used");

      return json({
        ok: true,
        products,
        warning: "Fallback product query used while the richer storefront query recovers.",
        summary: { total_products: products.length, authority: "d1_product_only_fallback_query" },
        filter_groups: buildFilterGroups(products),
        diagnostics: { warnings, ...filters }
      });
    } catch (fallbackError) {
      warnings.push("fallback_query_failed");

      await captureRuntimeIncident(env, request, {
        incident_scope: "public_catalog",
        incident_code: "products_fallback_query_failed",
        severity: "error",
        message: "Both adaptive primary and product-only fallback product queries failed. Returning a safe empty live result.",
        details: {
          primary_error: String(primaryError?.message || primaryError || "Unknown primary query error"),
          fallback_error: String(fallbackError?.message || fallbackError || "Unknown fallback query error"),
          warnings,
          ...filters
        }
      });

      return json({
        ok: true,
        products: [],
        warning: "Live product queries are unavailable right now. A safe empty result was returned.",
        error_detail: String(fallbackError?.message || primaryError?.message || "Unknown error"),
        summary: { total_products: 0, authority: "error" },
        filter_groups: emptyFilterGroups,
        diagnostics: { warnings, ...filters }
      });
    }
  }
}
