import { getNextProductNumber } from './_product-numbering.js';
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

async function requireAdmin(request, env) {
  const sessionUser = await getAdminUserFromRequest(request, env);
  if (!sessionUser) return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  return { sessionUser };
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeImageUrls(imageUrls) {
  if (!Array.isArray(imageUrls)) return [];
  return imageUrls
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeColorNamesInput(input, fallbackColor = "") {
  const values = [];

  if (Array.isArray(input)) {
    input.forEach((entry) => {
      const clean = String(entry || "").trim();
      if (clean) values.push(clean);
    });
  } else if (typeof input === "string") {
    const raw = String(input || "").trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((entry) => {
            const clean = String(entry || "").trim();
            if (clean) values.push(clean);
          });
        } else {
          raw.split(/[\r\n,|/]+/g).map((part) => String(part || "").trim()).filter(Boolean).forEach((part) => values.push(part));
        }
      } catch {
        raw.split(/[\r\n,|/]+/g).map((part) => String(part || "").trim()).filter(Boolean).forEach((part) => values.push(part));
      }
    }
  }

  const fallback = String(fallbackColor || "").trim();
  if (fallback && !values.some((item) => item.toLowerCase() === fallback.toLowerCase())) {
    values.unshift(fallback);
  }

  return [...new Set(values)].slice(0, 12);
}

function computeReadiness(fields = {}) {
  const failures = [];
  if (!String(fields.name || "").trim()) failures.push("name");
  if (!String(fields.slug || "").trim()) failures.push("slug");
  if (Number(fields.price_cents || 0) <= 0) failures.push("price");
  if (!String(fields.featured_image_url || "").trim()) failures.push("featured_image");
  if (!String(fields.product_category || "").trim()) failures.push("category");
  if (!String(fields.meta_title || "").trim()) failures.push("meta_title");
  if (!String(fields.meta_description || "").trim()) failures.push("meta_description");
  return {
    is_ready_for_storefront: failures.length === 0 ? 1 : 0,
    ready_check_notes: failures.join(", ")
  };
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

async function safeFirst(db, sql, bindings = []) {
  try {
    let stmt = db.prepare(sql);
    if (bindings.length) stmt = stmt.bind(...bindings);
    return await stmt.first();
  } catch {
    return null;
  }
}

async function safeAll(db, sql, bindings = []) {
  try {
    let stmt = db.prepare(sql);
    if (bindings.length) stmt = stmt.bind(...bindings);
    const result = await stmt.all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}

function cleanMerchandiseOrigin(value) {
  const raw = String(value || "").trim().toLowerCase();
  return ["handmade", "vintage", "collectible", "antique", "oddity", "prebuilt"].includes(raw)
    ? raw
    : "handmade";
}

function cleanSaleChannel(value) {
  const raw = String(value || "").trim().toLowerCase();
  return ["onsite", "external_only", "hybrid"].includes(raw) ? raw : "onsite";
}

function cleanExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : null;
}

function cleanText(value, max = 255) {
  const raw = String(value || "").trim();
  return raw ? raw.slice(0, max) : null;
}

function parseInteger(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : NaN;
}

function parseOptionalInteger(value) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : NaN;
}

function addColumnValue(columns, values, productColumns, column, value) {
  if (!productColumns.has(column)) return false;
  columns.push(column);
  values.push(value);
  return true;
}

async function ensureUniqueSlug(db, productColumns, requestedSlug, name, productNumber) {
  let baseSlug = normalizeSlug(requestedSlug || name || "") || `draft-product-${productNumber || Date.now()}`;
  let candidate = baseSlug;
  if (!productColumns.has("slug")) return candidate;

  const existing = await safeFirst(db, `SELECT product_id FROM products WHERE slug = ? LIMIT 1`, [candidate]);
  if (!existing) return candidate;

  const suffixes = [productNumber, Date.now()].filter(Boolean);
  for (const suffix of suffixes) {
    candidate = `${baseSlug}-${suffix}`;
    const row = await safeFirst(db, `SELECT product_id FROM products WHERE slug = ? LIMIT 1`, [candidate]);
    if (!row) return candidate;
  }
  return `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
}

async function insertProductImages(db, productId, name, imageUrls) {
  const rows = [];
  if (!productId || !imageUrls.length) return rows;
  const imageColumns = await getTableColumnSet(db, "product_images");
  if (!imageColumns.has("product_id") || !imageColumns.has("image_url")) return rows;

  for (let i = 0; i < imageUrls.length; i += 1) {
    const columns = ["product_id", "image_url"];
    const values = [productId, imageUrls[i]];
    if (imageColumns.has("alt_text")) {
      columns.push("alt_text");
      values.push(name || "Product image");
    }
    if (imageColumns.has("sort_order")) {
      columns.push("sort_order");
      values.push(i);
    }
    const placeholders = columns.map(() => "?");
    if (imageColumns.has("created_at")) {
      columns.push("created_at");
      placeholders.push("CURRENT_TIMESTAMP");
    }
    await db.prepare(`INSERT INTO product_images (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`).bind(...values).run().catch(() => null);
  }

  return safeAll(db, `SELECT * FROM product_images WHERE product_id = ? ORDER BY ${imageColumns.has("sort_order") ? "sort_order ASC," : ""} product_image_id ASC`, [productId]);
}

async function upsertProductSeo(db, productId, seo = {}) {
  if (!productId) return false;
  const seoColumns = await getTableColumnSet(db, "product_seo");
  if (!seoColumns.has("product_id")) return false;

  const valuesByColumn = {
    product_id: productId,
    meta_title: seo.meta_title,
    meta_description: seo.meta_description,
    keywords: seo.keywords,
    h1_override: seo.h1_override,
    canonical_url: seo.canonical_url,
    schema_type: "Product",
    og_title: seo.og_title,
    og_description: seo.og_description,
    og_image_url: seo.og_image_url
  };

  const columns = ["product_id"];
  const values = [productId];
  Object.entries(valuesByColumn).forEach(([column, value]) => {
    if (column === "product_id") return;
    if (seoColumns.has(column)) {
      columns.push(column);
      values.push(value == null || value === "" ? null : value);
    }
  });
  const placeholders = columns.map(() => "?");
  if (seoColumns.has("created_at")) {
    columns.push("created_at");
    placeholders.push("CURRENT_TIMESTAMP");
  }
  if (seoColumns.has("updated_at")) {
    columns.push("updated_at");
    placeholders.push("CURRENT_TIMESTAMP");
  }

  const updateColumns = columns.filter((column) => !["product_id", "created_at"].includes(column));
  const updateSql = updateColumns.length
    ? ` ON CONFLICT(product_id) DO UPDATE SET ${updateColumns.map((column) => `${column} = excluded.${column}`).join(", ")}`
    : "";

  try {
    await db.prepare(`INSERT INTO product_seo (${columns.join(", ")}) VALUES (${placeholders.join(", ")})${updateSql}`).bind(...values).run();
    return true;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body." }, 400);
    }

    const productColumns = await getTableColumnSet(db, "products");
    if (!productColumns.size) {
      return json({ ok: false, error: "Products table is unavailable or has no readable columns." }, 500);
    }

    const requested_product_number = parseOptionalInteger(body.product_number);
    const generatedProductNumber = productColumns.has("product_number")
      ? (requested_product_number == null ? await getNextProductNumber(db) : requested_product_number)
      : null;

    const name = cleanText(body.name, 160) || "";
    const slug = await ensureUniqueSlug(db, productColumns, body.slug, name, generatedProductNumber);
    const sku = cleanText(body.sku, 80);
    const product_category = cleanText(body.product_category, 120);
    const color_name = cleanText(body.color_name, 80);
    const color_names = normalizeColorNamesInput(
      body.color_names ?? body.color_names_json ?? body.color_names_text ?? body.colour_names,
      color_name
    );
    const color_names_json = JSON.stringify(color_names);
    const shipping_code = cleanText(body.shipping_code, 80);
    const review_status = String(body.review_status || "pending_review").trim().toLowerCase();
    const short_description = cleanText(body.short_description, 1200);
    const description = cleanText(body.description, 6000);
    const product_type = String(body.product_type || "physical").trim().toLowerCase();
    const status = String(body.status || "draft").trim().toLowerCase();
    const price_cents = parseInteger(body.price_cents, 0);
    const compare_at_price_cents = parseOptionalInteger(body.compare_at_price_cents);
    const currency = String(body.currency || "CAD").trim().toUpperCase() || "CAD";
    const taxable = Number(body.taxable) === 0 ? 0 : 1;
    const tax_class_id = parseOptionalInteger(body.tax_class_id);
    const requires_shipping = Number(body.requires_shipping) === 1 ? 1 : 0;
    const weight_grams = parseOptionalInteger(body.weight_grams);
    const inventory_tracking = Number(body.inventory_tracking) === 1 ? 1 : 0;
    const inventory_quantity = parseInteger(body.inventory_quantity, 0);
    const digital_file_url = cleanExternalUrl(body.digital_file_url);
    const featured_image_url = cleanExternalUrl(body.featured_image_url);
    const sort_order = parseInteger(body.sort_order, 0);
    const image_urls = normalizeImageUrls(body.image_urls);
    const meta_title = cleanText(body.meta_title, 70);
    const meta_description = cleanText(body.meta_description, 180);
    const keywords = cleanText(body.keywords, 255);
    const h1_override = cleanText(body.h1_override, 120);
    const canonical_url = cleanExternalUrl(body.canonical_url);
    const og_title = cleanText(body.og_title, 120);
    const og_description = cleanText(body.og_description, 200);
    const og_image_url = cleanExternalUrl(body.og_image_url);
    const merchandise_origin = cleanMerchandiseOrigin(body.merchandise_origin);
    const sale_channel = cleanSaleChannel(body.sale_channel);
    const external_listing_url = cleanExternalUrl(body.external_listing_url);
    const external_listing_label = cleanText(body.external_listing_label, 120);
    const condition_summary = cleanText(body.condition_summary, 255);
    const era_label = cleanText(body.era_label, 120);
    const sourcing_notes = cleanText(body.sourcing_notes, 2000);
    const capture_entry_mode = String(body.capture_entry_mode || "full").trim().toLowerCase() === "wizard" ? "wizard" : "full";

    const readiness = computeReadiness({
      name,
      slug,
      price_cents,
      featured_image_url,
      product_category,
      meta_title,
      meta_description
    });

    if (requested_product_number !== null && (!Number.isInteger(requested_product_number) || requested_product_number <= 0)) {
      return json({ ok: false, error: "product_number must be a valid whole number." }, 400);
    }
    if (!name) return json({ ok: false, error: "Product name is required for a draft." }, 400);
    if (!slug) return json({ ok: false, error: "A valid slug could not be created from this product name." }, 400);
    if (!productColumns.has("name")) return json({ ok: false, error: "Products table is missing the required name column." }, 500);
    if (!productColumns.has("slug")) return json({ ok: false, error: "Products table is missing the required slug column." }, 500);
    if (!["physical", "digital"].includes(product_type)) {
      return json({ ok: false, error: "Product type must be physical or digital." }, 400);
    }
    if (!["draft", "active", "archived"].includes(status)) {
      return json({ ok: false, error: "Status must be draft, active, or archived." }, 400);
    }
    if (!["pending_review", "approved", "needs_changes", "published"].includes(review_status)) {
      return json({ ok: false, error: "review_status must be pending_review, approved, needs_changes, or published." }, 400);
    }
    if (!Number.isInteger(price_cents) || price_cents < 0) {
      return json({ ok: false, error: "price_cents must be a valid whole number of cents." }, 400);
    }
    if (compare_at_price_cents !== null && (!Number.isInteger(compare_at_price_cents) || compare_at_price_cents < 0)) {
      return json({ ok: false, error: "compare_at_price_cents must be a valid whole number of cents." }, 400);
    }
    if (tax_class_id !== null && (!Number.isInteger(tax_class_id) || tax_class_id <= 0)) {
      return json({ ok: false, error: "tax_class_id must be a valid id." }, 400);
    }
    if (weight_grams !== null && (!Number.isInteger(weight_grams) || weight_grams < 0)) {
      return json({ ok: false, error: "weight_grams must be a valid whole number." }, 400);
    }
    if (!Number.isInteger(inventory_quantity) || inventory_quantity < 0) {
      return json({ ok: false, error: "inventory_quantity must be a valid whole number." }, 400);
    }
    if (!Number.isInteger(sort_order)) {
      return json({ ok: false, error: "sort_order must be a valid whole number." }, 400);
    }
    if (status !== "draft" && sale_channel !== "onsite" && !external_listing_url) {
      return json({ ok: false, error: "Add an external listing URL before activating hybrid or external-only items. Drafts can skip this." }, 400);
    }

    if (productColumns.has("product_number") && generatedProductNumber !== null) {
      const existingProductNumber = await safeFirst(db, `SELECT product_id FROM products WHERE product_number = ? LIMIT 1`, [generatedProductNumber]);
      if (existingProductNumber) return json({ ok: false, error: "That product number already exists." }, 409);
    }

    if (sku && productColumns.has("sku")) {
      const existingSku = await safeFirst(db, `SELECT product_id FROM products WHERE sku = ? LIMIT 1`, [sku]);
      if (existingSku) return json({ ok: false, error: "That SKU already exists." }, 409);
    }

    if (tax_class_id !== null) {
      const taxClass = await safeFirst(db, `SELECT tax_class_id FROM tax_classes WHERE tax_class_id = ? LIMIT 1`, [tax_class_id]);
      if (!taxClass) return json({ ok: false, error: "Selected tax class was not found." }, 400);
    }

    const columns = [];
    const values = [];

    addColumnValue(columns, values, productColumns, "product_number", generatedProductNumber);
    addColumnValue(columns, values, productColumns, "slug", slug);
    addColumnValue(columns, values, productColumns, "sku", sku);
    addColumnValue(columns, values, productColumns, "name", name);
    addColumnValue(columns, values, productColumns, "product_category", product_category);
    addColumnValue(columns, values, productColumns, "color_name", color_name);
    addColumnValue(columns, values, productColumns, "color_names_json", color_names_json);
    addColumnValue(columns, values, productColumns, "shipping_code", shipping_code);
    addColumnValue(columns, values, productColumns, "review_status", review_status);
    addColumnValue(columns, values, productColumns, "is_ready_for_storefront", readiness.is_ready_for_storefront);
    addColumnValue(columns, values, productColumns, "ready_check_notes", readiness.ready_check_notes || null);
    addColumnValue(columns, values, productColumns, "short_description", short_description);
    addColumnValue(columns, values, productColumns, "description", description);
    addColumnValue(columns, values, productColumns, "product_type", product_type);
    addColumnValue(columns, values, productColumns, "status", status);
    addColumnValue(columns, values, productColumns, "price_cents", price_cents);
    addColumnValue(columns, values, productColumns, "compare_at_price_cents", compare_at_price_cents);
    addColumnValue(columns, values, productColumns, "currency", currency);
    addColumnValue(columns, values, productColumns, "taxable", taxable);
    addColumnValue(columns, values, productColumns, "tax_class_id", tax_class_id);
    addColumnValue(columns, values, productColumns, "requires_shipping", requires_shipping);
    addColumnValue(columns, values, productColumns, "weight_grams", weight_grams);
    addColumnValue(columns, values, productColumns, "inventory_tracking", inventory_tracking);
    addColumnValue(columns, values, productColumns, "inventory_quantity", inventory_quantity);
    addColumnValue(columns, values, productColumns, "digital_file_url", digital_file_url);
    addColumnValue(columns, values, productColumns, "featured_image_url", featured_image_url || image_urls[0] || null);
    addColumnValue(columns, values, productColumns, "merchandise_origin", merchandise_origin);
    addColumnValue(columns, values, productColumns, "sale_channel", sale_channel);
    addColumnValue(columns, values, productColumns, "external_listing_url", external_listing_url);
    addColumnValue(columns, values, productColumns, "external_listing_label", external_listing_label);
    addColumnValue(columns, values, productColumns, "condition_summary", condition_summary);
    addColumnValue(columns, values, productColumns, "era_label", era_label);
    addColumnValue(columns, values, productColumns, "sourcing_notes", sourcing_notes);
    addColumnValue(columns, values, productColumns, "sort_order", sort_order);
    addColumnValue(columns, values, productColumns, "capture_entry_mode", capture_entry_mode);
    if (productColumns.has("capture_last_saved_at")) {
      columns.push("capture_last_saved_at");
      values.push(null);
    }

    const placeholders = columns.map(() => "?");
    if (productColumns.has("created_at")) {
      columns.push("created_at");
      placeholders.push("CURRENT_TIMESTAMP");
    }
    if (productColumns.has("updated_at")) {
      columns.push("updated_at");
      placeholders.push("CURRENT_TIMESTAMP");
    }

    const insertResult = await db
      .prepare(`INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`)
      .bind(...values)
      .run();

    const newProductId = Number(insertResult?.meta?.last_row_id || 0);

    await upsertProductSeo(db, newProductId, {
      meta_title,
      meta_description,
      keywords,
      h1_override,
      canonical_url,
      og_title,
      og_description,
      og_image_url
    });

    const createdImages = await insertProductImages(db, newProductId, name, image_urls);

    const createdProduct = await safeFirst(db, `SELECT * FROM products WHERE product_id = ? LIMIT 1`, [newProductId]);

    await auditAdminAction(env, request, authCheck.sessionUser, {
      action_type: "product_create",
      target_type: "product",
      target_id: Number(createdProduct?.product_id || newProductId || 0),
      target_key: createdProduct?.slug || slug,
      details: {
        name,
        status,
        review_status,
        readiness,
        merchandise_origin,
        sale_channel,
        has_external_listing: !!external_listing_url,
        color_names,
        image_url_count: image_urls.length,
        draft_mode_relaxed: status === "draft"
      }
    });

    return json(
      {
        ok: true,
        message: status === "draft" ? "Draft product created successfully." : "Product created successfully.",
        product: createdProduct || { product_id: newProductId, slug, name, status, review_status },
        images: createdImages || [],
        readiness,
        draft_mode_relaxed: status === "draft"
      },
      201
    );
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: "admin_products",
      incident_code: "create_product_failed",
      severity: "error",
      message: error?.message || "Create product failed.",
      details: {
        name: error?.name || null,
        stack: String(error?.stack || "").slice(0, 1200)
      },
      related_user_id: authCheck?.sessionUser?.user_id || null
    });

    return json({
      ok: false,
      error: "Create product failed before saving. The error was logged as a runtime incident.",
      error_detail: error?.message || String(error || "Unknown error"),
      incident_code: "create_product_failed"
    }, 500);
  }
}
