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

function safeIdentifier(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text) ? text : "";
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

async function getStrictTableColumnSet(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();

  try {
    const result = await db.prepare(`PRAGMA table_info(${safeTable})`).all();
    const rows = normalizeResults(result);
    const names = rows
      .map((row) => String(row?.name || "").trim())
      .filter((name) => safeIdentifier(name));

    if (names.length) return new Set(names);
  } catch {
    // Fall back below. Some older D1 mocks/tools do not support PRAGMA reliably.
  }

  try {
    const sample = await db.prepare(`SELECT * FROM ${safeTable} LIMIT 1`).first();
    return new Set(Object.keys(sample || {}).filter((name) => safeIdentifier(name)));
  } catch {
    return new Set();
  }
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

function splitFilterValues(...values) {
  const seen = new Set();
  const output = [];
  values.forEach((value) => {
    if (value == null) return;
    let parsed = value;
    if (typeof value === "string") {
      const text = value.trim();
      if (!text) return;
      if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
        try { parsed = JSON.parse(text); } catch { parsed = text; }
      }
    }
    const list = Array.isArray(parsed) ? parsed : String(parsed || "").split(/[|,;/\n]+/);
    list.map((entry) => String(entry || "").trim()).filter(Boolean).forEach((entry) => {
      const key = entry.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      output.push(entry);
    });
  });
  return output;
}

function filterText(values) {
  return (Array.isArray(values) ? values : splitFilterValues(values)).join(", ");
}

async function runProductQuery(db, sql, bindings = []) {
  const stmt = db.prepare(sql);
  const result = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();
  return normalizeResults(result);
}

function normalizeProductRow(row = {}) {
  const colorNames = parseColorNamesJson(row.color_names_json, row.color_name || "");
  const proofMaterials = splitFilterValues(row.proof_material, row.material_tags, row.materials_json, row.materials, row.primary_material, row.material, row.product_category);
  const proofProcesses = splitFilterValues(row.proof_process, row.process_tags, row.making_process, row.process_notes, row.public_story_heading);
  const proofLocalities = splitFilterValues(row.proof_locality, row.locality_label, row.local_pickup_note, row.sourcing_notes);
  return {
    product_id: row.product_id ?? null,
    product_number: row.product_number ?? null,
    slug: row.slug || "",
    sku: row.sku || "",
    name: row.name || "Untitled product",
    product_category: row.product_category || row.category || "",
    color_name: row.color_name || "",
    color_names_json: row.color_names_json || "[]",
    color_names: colorNames,
    color_names_text: colorNames.join(", "),
    shipping_code: row.shipping_code || "",
    review_status: row.review_status || "published",
    short_description: row.short_description || "",
    description: row.description || "",
    product_type: row.product_type || "physical",
    status: row.status || "active",
    merchandise_origin: row.merchandise_origin || "handmade",
    sale_channel: row.sale_channel || "onsite",
    external_listing_url: row.external_listing_url || "",
    external_listing_label: row.external_listing_label || "",
    condition_summary: row.condition_summary || "",
    era_label: row.era_label || "",
    sourcing_notes: row.sourcing_notes || "",
    price_cents: Number(row.price_cents || 0),
    compare_at_price_cents: row.compare_at_price_cents ?? null,
    currency: row.currency || "CAD",
    taxable: row.taxable ?? 1,
    tax_class_id: row.tax_class_id ?? null,
    tax_class_code: row.tax_class_code || "",
    tax_class_name: row.tax_class_name || "",
    tax_rate: Number(row.tax_rate || 0),
    requires_shipping: row.requires_shipping ?? 0,
    weight_grams: row.weight_grams ?? null,
    inventory_tracking: row.inventory_tracking ?? 0,
    inventory_quantity: Number(row.inventory_quantity ?? row.on_hand_quantity ?? 0),
    digital_file_url: row.digital_file_url || "",
    featured_image_url: row.featured_image_url || "",
    sort_order: Number(row.sort_order || 0),
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
    meta_title: row.meta_title || "",
    meta_description: row.meta_description || "",
    keywords: row.keywords || "",
    h1_override: row.h1_override || "",
    canonical_url: row.canonical_url || "",
    og_title: row.og_title || "",
    og_description: row.og_description || "",
    og_image_url: row.og_image_url || "",
    public_story_heading: row.public_story_heading || "",
    public_story_summary: row.public_story_summary || "",
    public_story_snippet: row.public_story_snippet || "",
    public_story_status: row.public_story_status || "",
    public_story_privacy_status: row.public_story_privacy_status || "",
    proof_material: filterText(proofMaterials),
    proof_materials: proofMaterials,
    proof_process: filterText(proofProcesses),
    proof_processes: proofProcesses,
    proof_locality: filterText(proofLocalities),
    proof_localities: proofLocalities,
    seo_h1: row.h1_override || row.name || "Untitled product"
  };
}

function shapeProducts(rows) {
  return rows.map((row) => normalizeProductRow(row));
}

async function enrichProductsWithStoryNotes(db, products) {
  const rows = Array.isArray(products) ? products : [];
  if (!db || !rows.length) return rows;

  try {
    const storyColumns = await getStrictTableColumnSet(db, "product_story_public_notes");
    if (!storyColumns.has("product_id")) return rows;

    const ids = [...new Set(rows.map((product) => Number(product.product_id || 0)).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 500);
    if (!ids.length) return rows;

    const selectList = [
      "product_id",
      storyColumns.has("story_heading") ? "story_heading" : "'' AS story_heading",
      storyColumns.has("story_summary") ? "story_summary" : "'' AS story_summary",
      storyColumns.has("story_body") ? "story_body" : "'' AS story_body",
      storyColumns.has("display_status") ? "display_status" : "'approved' AS display_status",
      storyColumns.has("privacy_status") ? "privacy_status" : "'safe' AS privacy_status",
      storyColumns.has("process_notes") ? "process_notes" : "'' AS process_notes",
      storyColumns.has("local_pickup_note") ? "local_pickup_note" : "'' AS local_pickup_note",
      storyColumns.has("care_notes") ? "care_notes" : "'' AS care_notes",
      storyColumns.has("updated_at") ? "updated_at" : "'' AS updated_at"
    ];
    const whereParts = [`product_id IN (${ids.map(() => "?").join(",")})`];
    if (storyColumns.has("display_status")) whereParts.push("LOWER(COALESCE(display_status,'')) IN ('approved','published')");
    if (storyColumns.has("privacy_status")) whereParts.push("LOWER(COALESCE(privacy_status,'')) IN ('safe','private_detail_removed')");
    const orderSql = storyColumns.has("updated_at")
      ? "ORDER BY CASE LOWER(COALESCE(display_status,'')) WHEN 'published' THEN 0 ELSE 1 END, datetime(COALESCE(updated_at,'1970-01-01')) DESC"
      : "ORDER BY product_id ASC";

    const storyRows = await runProductQuery(db, `
      SELECT ${selectList.join(", ")}
      FROM product_story_public_notes
      WHERE ${whereParts.join(" AND ")}
      ${orderSql}
    `, ids);

    const byProductId = new Map();
    storyRows.forEach((story) => {
      const productId = Number(story.product_id || 0);
      if (!productId || byProductId.has(productId)) return;
      const summary = normalizeText(story.story_summary) || normalizeText(story.story_body);
      const snippet = summary.length > 220 ? `${summary.slice(0, 217).trim()}...` : summary;
      const processValues = splitFilterValues(story.process_notes, story.story_heading);
      const localityValues = splitFilterValues(story.local_pickup_note);
      byProductId.set(productId, {
        public_story_heading: normalizeText(story.story_heading),
        public_story_summary: summary,
        public_story_snippet: snippet,
        public_story_status: normalizeText(story.display_status),
        public_story_privacy_status: normalizeText(story.privacy_status),
        proof_process: filterText(processValues),
        proof_processes: processValues,
        proof_locality: filterText(localityValues),
        proof_localities: localityValues
      });
    });

    return rows.map((product) => ({ ...product, ...(byProductId.get(Number(product.product_id || 0)) || {}) }));
  } catch {
    return rows;
  }
}

async function enrichProductsWithImages(db, products) {
  const rows = Array.isArray(products) ? products : [];
  if (!db || !rows.length) return rows;
  try {
    const imageColumns = await getStrictTableColumnSet(db, "product_images");
    if (!imageColumns.has("product_id") || !imageColumns.has("image_url")) return rows;
    const ids = [...new Set(rows.map((product) => Number(product.product_id || 0)).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 500);
    if (!ids.length) return rows;
    const selectList = [
      imageColumns.has("product_image_id") ? "product_image_id" : "NULL AS product_image_id",
      "product_id",
      "image_url",
      imageColumns.has("alt_text") ? "alt_text" : "'' AS alt_text",
      imageColumns.has("sort_order") ? "sort_order" : "0 AS sort_order",
      imageColumns.has("created_at") ? "created_at" : "'' AS created_at"
    ];
    const imageRows = await runProductQuery(db, `
      SELECT ${selectList.join(", ")}
      FROM product_images
      WHERE product_id IN (${ids.map(() => "?").join(",")})
      ORDER BY product_id ASC, COALESCE(sort_order,0) ASC, COALESCE(product_image_id,0) ASC
    `, ids);
    const byProductId = new Map();
    imageRows.forEach((image) => {
      const productId = Number(image.product_id || 0);
      const imageUrl = normalizeText(image.image_url);
      if (!productId || !imageUrl) return;
      if (!byProductId.has(productId)) byProductId.set(productId, []);
      const list = byProductId.get(productId);
      if (list.some((row) => String(row.image_url || '').trim().toLowerCase() === imageUrl.toLowerCase())) return;
      list.push({
        product_image_id: Number(image.product_image_id || 0),
        image_url: imageUrl,
        alt_text: normalizeText(image.alt_text),
        sort_order: Number(image.sort_order || 0),
        created_at: normalizeText(image.created_at)
      });
    });
    return rows.map((product) => {
      const savedImages = byProductId.get(Number(product.product_id || 0)) || [];
      const allImages = [];
      const push = (image) => {
        const imageUrl = normalizeText(image?.image_url || image);
        if (!imageUrl) return;
        if (allImages.some((row) => String(row.image_url || '').trim().toLowerCase() === imageUrl.toLowerCase())) return;
        allImages.push(typeof image === 'object' ? { ...image, image_url: imageUrl } : { image_url: imageUrl, alt_text: product.name || '' });
      };
      push(product.featured_image_url);
      savedImages.forEach(push);
      return {
        ...product,
        image_urls: allImages.map((image) => image.image_url),
        images: allImages.slice(0, 12),
        image_count: allImages.length,
        featured_image_url: product.featured_image_url || allImages[0]?.image_url || ''
      };
    });
  } catch {
    return rows;
  }
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
  const materials = {};
  const processes = {};
  const localities = {};

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
    const materialValues = Array.isArray(product.proof_materials) ? product.proof_materials : splitFilterValues(product.proof_material);
    const processValues = Array.isArray(product.proof_processes) ? product.proof_processes : splitFilterValues(product.proof_process);
    const localityValues = Array.isArray(product.proof_localities) ? product.proof_localities : splitFilterValues(product.proof_locality);

    if (category) categories[category] = (categories[category] || 0) + 1;
    colorsForProduct.forEach((color) => {
      colors[color] = (colors[color] || 0) + 1;
    });
    if (productType) productTypes[productType] = (productTypes[productType] || 0) + 1;
    if (origin) origins[origin] = (origins[origin] || 0) + 1;
    if (channel) saleChannels[channel] = (saleChannels[channel] || 0) + 1;
    materialValues.forEach((material) => { materials[material] = (materials[material] || 0) + 1; });
    processValues.forEach((process) => { processes[process] = (processes[process] || 0) + 1; });
    localityValues.forEach((locality) => { localities[locality] = (localities[locality] || 0) + 1; });
  });

  return {
    categories: group(categories),
    colors: group(colors),
    product_types: group(productTypes),
    merchandise_origins: group(origins),
    sale_channels: group(saleChannels),
    materials: group(materials),
    processes: group(processes),
    localities: group(localities)
  };
}

function productMatchesFilters(product, filters) {
  const q = normalizeText(filters.q).toLowerCase();
  if (q) {
    const haystack = [
      product.name,
      product.slug,
      product.short_description,
      product.description,
      product.sku,
      product.product_category,
      product.color_name,
      product.color_names_text,
      product.public_story_heading,
      product.public_story_summary,
      product.public_story_snippet,
      product.proof_material,
      product.proof_process,
      product.proof_locality,
      product.keywords
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (["physical", "digital"].includes(filters.product_type)) {
    if (String(product.product_type || "physical").toLowerCase() !== filters.product_type) return false;
  }

  if (["handmade", "vintage", "collectible", "antique", "oddity", "prebuilt"].includes(filters.merchandise_origin)) {
    if (String(product.merchandise_origin || "handmade").toLowerCase() !== filters.merchandise_origin) return false;
  }

  if (["onsite", "external_only", "hybrid"].includes(filters.sale_channel)) {
    if (String(product.sale_channel || "onsite").toLowerCase() !== filters.sale_channel) return false;
  }

  if (filters.color_name) {
    const wanted = filters.color_name.toLowerCase();
    const colors = Array.isArray(product.color_names) ? product.color_names : [];
    const hasExactColor = colors.some((color) => String(color || "").trim().toLowerCase() === wanted);
    const hasJsonColor = String(product.color_names_json || "").toLowerCase().includes(wanted);
    const hasFallbackColor = String(product.color_name || "").trim().toLowerCase() === wanted;
    if (!hasExactColor && !hasJsonColor && !hasFallbackColor) return false;
  }


  const proofFilterMap = [
    [filters.material, product.proof_materials, product.proof_material],
    [filters.process, product.proof_processes, product.proof_process],
    [filters.locality, product.proof_localities, product.proof_locality]
  ];
  for (const [wanted, list, fallback] of proofFilterMap) {
    if (!wanted) continue;
    const needle = String(wanted || "").toLowerCase();
    const values = Array.isArray(list) ? list : splitFilterValues(fallback);
    const exact = values.some((value) => String(value || "").trim().toLowerCase() === needle);
    const fuzzy = String(fallback || "").toLowerCase().includes(needle);
    if (!exact && !fuzzy) return false;
  }

  if (filters.min_price_cents != null && Number(product.price_cents || 0) < filters.min_price_cents) return false;
  if (filters.max_price_cents != null && Number(product.price_cents || 0) > filters.max_price_cents) return false;

  if (filters.requires_shipping === "1" || filters.requires_shipping === "0") {
    if (Number(product.requires_shipping || 0) !== Number(filters.requires_shipping)) return false;
  }

  return true;
}

function sortProducts(products) {
  return [...products].sort((a, b) => {
    const sortDelta = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (sortDelta) return sortDelta;
    const createdDelta = String(b.created_at || "").localeCompare(String(a.created_at || ""));
    if (createdDelta) return createdDelta;
    return Number(b.product_id || 0) - Number(a.product_id || 0);
  });
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
      "color_names_json",
      "material_tags",
      "materials_json",
      "primary_material",
      "process_tags",
      "locality_label"
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

  [[filters.material, ["material_tags", "materials_json", "primary_material", "material", "product_category"], "material"], [filters.process, ["process_tags", "making_process", "process_notes"], "process"], [filters.locality, ["locality_label", "local_pickup_note", "sourcing_notes"], "locality"]].forEach(([value, columnNames, label]) => {
    if (!value) return;
    const proofParts = [];
    columnNames.forEach((columnName) => {
      if (productColumns.has(columnName)) {
        proofParts.push(`LOWER(COALESCE(p.${columnName}, '')) LIKE ?`);
        bindings.push(`%${value}%`);
      }
    });
    if (proofParts.length) {
      clauses.push(`(${proofParts.join(" OR ")})`);
    } else {
      warnings.push(`${label}_filter_client_side_only`);
    }
  });

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
  if (includeJoins && hasTaxJoin) joins.push("LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id");
  if (includeJoins && hasSeoJoin) joins.push("LEFT JOIN product_seo ps ON ps.product_id = p.product_id");

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
    selectColumn(productColumns, "p", "material_tags", "''"),
    selectColumn(productColumns, "p", "materials_json", "''"),
    selectColumn(productColumns, "p", "primary_material", "''"),
    selectColumn(productColumns, "p", "material", "''"),
    selectColumn(productColumns, "p", "process_tags", "''"),
    selectColumn(productColumns, "p", "making_process", "''"),
    selectColumn(productColumns, "p", "process_notes", "''"),
    selectColumn(productColumns, "p", "locality_label", "''"),
    selectColumn(productColumns, "p", "local_pickup_note", "''"),
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
      : productColumns.has("on_hand_quantity")
        ? "COALESCE(p.on_hand_quantity, 0) AS inventory_quantity"
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
    LIMIT 500
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
      : productColumns.has("on_hand_quantity")
        ? "COALESCE(p.on_hand_quantity, 0) AS inventory_quantity"
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
    LIMIT 500
  `;
}

async function runUltraProductFallback(db, filters) {
  const rows = await runProductQuery(db, "SELECT * FROM products LIMIT 500");
  const enrichedProducts = await enrichProductsWithStoryNotes(db, shapeProducts(rows));
  const products = enrichedProducts
    .filter((product) => String(product.status || "active").toLowerCase() === "active")
    .filter((product) => productMatchesFilters(product, filters));
  return sortProducts(products);
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
    material: normalizeText(url.searchParams.get("material") || url.searchParams.get("product_material")).toLowerCase(),
    process: normalizeText(url.searchParams.get("process") || url.searchParams.get("making_process")).toLowerCase(),
    locality: normalizeText(url.searchParams.get("locality") || url.searchParams.get("proof_locality")).toLowerCase(),
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
    sale_channels: [],
    materials: [],
    processes: [],
    localities: []
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

  const productColumns = await getStrictTableColumnSet(db, "products");
  const taxColumns = await getStrictTableColumnSet(db, "tax_classes");
  const seoColumns = await getStrictTableColumnSet(db, "product_seo");

  if (!productColumns.size) {
    try {
      const products = await enrichProductsWithImages(db, await runUltraProductFallback(db, filters));
      warnings.push("schema_columns_unavailable_ultra_fallback_used");
      return json({
        ok: true,
        products,
        warning: "Schema inspection was unavailable, so a safe product-only fallback was used.",
        summary: { total_products: products.length, authority: "d1_select_star_fallback" },
        filter_groups: buildFilterGroups(products),
        diagnostics: { warnings, ...filters }
      });
    } catch (error) {
      warnings.push("products_table_missing_or_unreadable");
      await captureRuntimeIncident(env, request, {
        incident_scope: "public_catalog",
        incident_code: "products_unavailable_all_tiers_failed",
        severity: "error",
        message: "The public products endpoint could not inspect or read the products table.",
        details: { error: String(error?.message || error || "Unknown products table error"), ...filters }
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
  }

  const hasTaxJoin = productColumns.has("tax_class_id") && taxColumns.has("tax_class_id");
  const hasSeoJoin = seoColumns.has("product_id") && productColumns.has("product_id");
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
    const storyProducts = await enrichProductsWithStoryNotes(db, shapeProducts(rows));
    const products = (await enrichProductsWithImages(db, storyProducts)).filter((product) => productMatchesFilters(product, filters));
    return json({
      ok: true,
      products,
      summary: { total_products: products.length, authority: "d1_adaptive_query" },
      filter_groups: buildFilterGroups(products),
      diagnostics: { warnings, ...filters }
    });
  } catch (primaryError) {
    warnings.push("primary_query_failed_no_incident_until_all_tiers_fail");
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
      const storyProducts = await enrichProductsWithStoryNotes(db, shapeProducts(rows));
      const products = (await enrichProductsWithImages(db, storyProducts)).filter((product) => productMatchesFilters(product, filters));
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
      warnings.push("fallback_query_failed_trying_select_star_fallback");

      try {
        const products = await enrichProductsWithImages(db, await runUltraProductFallback(db, filters));
        warnings.push("select_star_fallback_used");
        return json({
          ok: true,
          products,
          warning: "Safe product-only fallback used because richer product queries are still recovering.",
          summary: { total_products: products.length, authority: "d1_select_star_fallback" },
          filter_groups: buildFilterGroups(products),
          diagnostics: { warnings, ...filters }
        });
      } catch (ultraError) {
        warnings.push("select_star_fallback_failed");
        await captureRuntimeIncident(env, request, {
          incident_scope: "public_catalog",
          incident_code: "products_unavailable_all_tiers_failed",
          severity: "error",
          message: "All product query tiers failed. Returning a safe empty live result.",
          details: {
            primary_error: String(primaryError?.message || primaryError || "Unknown primary query error"),
            fallback_error: String(fallbackError?.message || fallbackError || "Unknown fallback query error"),
            ultra_error: String(ultraError?.message || ultraError || "Unknown select-star fallback error"),
            warnings,
            ...filters
          }
        });

        return json({
          ok: true,
          products: [],
          warning: "Live product queries are unavailable right now. A safe empty result was returned.",
          error_detail: String(ultraError?.message || fallbackError?.message || primaryError?.message || "Unknown error"),
          summary: { total_products: 0, authority: "error" },
          filter_groups: emptyFilterGroups,
          diagnostics: { warnings, ...filters }
        });
      }
    }
  }
}
