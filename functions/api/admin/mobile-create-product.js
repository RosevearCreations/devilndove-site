// File: /functions/api/admin/mobile-create-product.js
// Purpose: Admin-only mobile product capture endpoint for quick draft creation/update.
// Repair: prevents duplicate generated SKUs/product numbers/slugs from crashing Save Partial.
// It re-checks identity fields before insert, retries cleanly if D1 reports a unique constraint,
// and keeps optional image/SEO/resource side effects from turning a partial mobile save into a hard 500.

import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { DEFAULT_PRODUCT_NUMBER_START, allocateNextProductNumber, ensureProductNumberSequenceAtLeast, getNextProductNumber } from "./_product-numbering.js";
import { parseProductResourceLinksJson, persistProductResourceLinks } from "./_productResourcePersistence.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeFilename(filename) {
  const cleaned = String(filename || "upload")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned || "upload";
}

function inferExtension(filename, mimeType) {
  const fromName = String(filename || "").match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;

  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif"
  };

  return map[String(mimeType || "").toLowerCase()] || "bin";
}

const DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL = "https://assets.devilndove.com";

const FALLBACK_PRODUCT_COLUMNS = new Set([
  'product_id', 'slug', 'product_number', 'sku', 'name', 'capture_reference', 'product_category',
  'color_name', 'color_names_json', 'shipping_code', 'review_status', 'is_ready_for_storefront',
  'ready_check_notes', 'short_description', 'description', 'product_type', 'status', 'price_cents',
  'compare_at_price_cents', 'currency', 'taxable', 'tax_class_id', 'requires_shipping', 'weight_grams',
  'inventory_tracking', 'inventory_quantity', 'featured_image_url', 'sort_order', 'capture_entry_mode',
  'capture_created_by_user_id', 'capture_updated_by_user_id', 'capture_entry_started_at',
  'capture_last_saved_at', 'created_at', 'updated_at'
]);


function getProductMediaPublicBase(env) {
  return normalizeText(
    env.PRODUCT_MEDIA_PUBLIC_BASE_URL ||
      env.R2_PUBLIC_BASE_URL ||
      env.PUBLIC_R2_BASE_URL ||
      env.ASSET_ORIGIN ||
      DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL
  );
}

function buildPublicUrl(env, objectKey) {
  const cleanKey = normalizeText(objectKey);
  if (!cleanKey) return null;

  const base = getProductMediaPublicBase(env);
  if (!base) return null;

  return `${base.replace(/\/$/, "")}/${cleanKey.replace(/^\/+/, "")}`;
}

function normalizeStoredImageUrl(env, value) {
  const cleanValue = normalizeText(value);
  if (!cleanValue) return "";

  if (/^https?:\/\//i.test(cleanValue) || cleanValue.startsWith("data:") || cleanValue.startsWith("blob:")) {
    return cleanValue;
  }

  return buildPublicUrl(env, cleanValue) || cleanValue;
}

function normalizeColorNames(input, fallbackColor = "") {
  const values = [];

  const add = (value) => {
    const clean = normalizeText(value)
      .replace(/^#+/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) return;

    const exists = values.some((item) => item.toLowerCase() === clean.toLowerCase());
    if (!exists) values.push(clean);
  };

  const raw = input == null ? "" : String(input);
  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        parsed.forEach((entry) => {
          if (typeof entry === "string") add(entry);
          else if (entry && typeof entry === "object") add(entry.name || entry.color_name || entry.label || entry.value);
        });
      }
    } catch {
      // If it looked like JSON but was not valid JSON, the delimiter parser below still handles it.
    }
  }

  raw
    .split(/[\r\n,;|/]+/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach(add);

  add(fallbackColor);

  return values.slice(0, 12);
}

function formatProductNumberLabel(value) {
  const parsed = Number(value || 0);
  if (!Number.isInteger(parsed) || parsed <= 0) return "DD1000";
  return `DD${String(parsed).padStart(4, "0")}`;
}

function parseWholeNumber(value, fallback = 0) {
  const raw = normalizeText(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function normalizeSku(value) {
  const clean = normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  return clean || "DND-DRAFT";
}

function buildDefaultSku(productNumber, fallbackSeed = "DRAFT") {
  const parsed = Number(productNumber || 0);
  if (Number.isInteger(parsed) && parsed > 0) {
    return `DND-${String(parsed).padStart(5, "0")}`;
  }

  return normalizeSku(`DND-${fallbackSeed}`);
}

function isSqliteUniqueConstraint(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("unique constraint") || message.includes("sqlite_constraint_unique") || message.includes("sqlite_constraint");
}

async function productColumnValueExists(db, columnName, value, excludeProductId = 0) {
  const cleanValue = normalizeText(value);
  if (!cleanValue) return false;

  const safeColumns = new Set(["sku", "slug"]);
  if (!safeColumns.has(columnName)) return false;

  try {
    const row = await db
      .prepare(
        `SELECT product_id
         FROM products
         WHERE ${columnName} = ?
           AND (? <= 0 OR product_id <> ?)
         LIMIT 1`
      )
      .bind(cleanValue, Number(excludeProductId || 0), Number(excludeProductId || 0))
      .first();

    return Boolean(row?.product_id);
  } catch {
    return false;
  }
}

async function productNumberExists(db, value, excludeProductId = 0) {
  const parsed = Number(value || 0);
  if (!Number.isInteger(parsed) || parsed <= 0) return false;

  try {
    const row = await db
      .prepare(
        `SELECT product_id
         FROM products
         WHERE product_number = ?
           AND (? <= 0 OR product_id <> ?)
         LIMIT 1`
      )
      .bind(parsed, Number(excludeProductId || 0), Number(excludeProductId || 0))
      .first();

    return Boolean(row?.product_id);
  } catch {
    return false;
  }
}

async function resolveAvailableProductNumber(db, productColumns, preferredProductNumber, excludeProductId = 0) {
  if (!productColumns.has("product_number")) return Number(preferredProductNumber || 0) || 0;

  const start = await getNextProductNumber(db).catch(() => DEFAULT_PRODUCT_NUMBER_START);
  let candidate = Number(preferredProductNumber || start || DEFAULT_PRODUCT_NUMBER_START);
  if (!Number.isInteger(candidate) || candidate <= 0) candidate = DEFAULT_PRODUCT_NUMBER_START;

  for (let attempt = 0; attempt < 250; attempt += 1) {
    const exists = await productNumberExists(db, candidate, excludeProductId);
    if (!exists) return candidate;
    candidate += 1;
  }

  const fallback = await db
    .prepare("SELECT COALESCE(MAX(product_number), 0) + 1 AS next_product_number FROM products")
    .first()
    .catch(() => null);

  const fallbackNumber = Number(fallback?.next_product_number || candidate || DEFAULT_PRODUCT_NUMBER_START);
  return Number.isInteger(fallbackNumber) && fallbackNumber > 0 ? fallbackNumber : candidate;
}

async function resolveAvailableTextValue(db, productColumns, columnName, preferredValue, fallbackValue, excludeProductId = 0) {
  if (!productColumns.has(columnName)) return normalizeText(preferredValue || fallbackValue);

  const base =
    columnName === "sku"
      ? normalizeSku(preferredValue || fallbackValue)
      : slugify(preferredValue || fallbackValue) || slugify(fallbackValue) || "draft-product";

  let candidate = base;

  for (let attempt = 0; attempt < 250; attempt += 1) {
    const exists = await productColumnValueExists(db, columnName, candidate, excludeProductId);
    if (!exists) return candidate;

    candidate = `${base}-${attempt + 2}`;
  }

  return `${base}-${Date.now()}`;
}

async function resolveNewProductIdentity({ db, productColumns, preferredProductNumber, resolvedName, slugCandidate, skuCandidate, excludeProductId = 0 }) {
  const productNumber = await resolveAvailableProductNumber(db, productColumns, preferredProductNumber, excludeProductId);
  const fallbackSlug = slugify(`${resolvedName || "draft-product"}-${productNumber || Date.now()}`) || `product-${productNumber || Date.now()}`;
  const fallbackSku = buildDefaultSku(productNumber, productNumber || Date.now());

  const slug = await resolveAvailableTextValue(db, productColumns, "slug", slugCandidate || fallbackSlug, fallbackSlug, excludeProductId);
  const sku = await resolveAvailableTextValue(db, productColumns, "sku", skuCandidate || fallbackSku, fallbackSku, excludeProductId);

  return { productNumber, slug, sku };
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    const columns = new Set(rows.map((row) => String(row?.name || "").trim()).filter(Boolean));
    if (columns.size > 0) return columns;
  } catch {
    // Fall through to compatibility defaults below.
  }

  if (String(tableName || '').toLowerCase() === 'products') return new Set(FALLBACK_PRODUCT_COLUMNS);
  return new Set();
}

function selectColumnSql(columnSet, columnName, alias = columnName) {
  return columnSet.has(columnName) ? columnName : `NULL AS ${alias}`;
}

function pushOptionalInsert({ columns, placeholders, bindings, columnSet, column, value, placeholder = "?" }) {
  if (!columnSet.has(column)) return;
  columns.push(column);
  placeholders.push(placeholder);
  if (placeholder === "?") bindings.push(value);
}

function pushOptionalUpdate({ assignments, bindings, columnSet, column, value, expression = null }) {
  if (!columnSet.has(column)) return;
  if (expression) {
    assignments.push(`${column} = ${expression}`);
  } else {
    assignments.push(`${column} = ?`);
    bindings.push(value);
  }
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return true;
  }
}

async function upsertProductSeo(db, payload) {
  try {
    if (!(await tableExists(db, 'product_seo'))) return;
    await db
      .prepare(`
        INSERT INTO product_seo (
          product_id,
          meta_title,
          meta_description,
          keywords,
          h1_override,
          canonical_url,
          schema_type,
          og_title,
          og_description,
          og_image_url,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'Product', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(product_id) DO UPDATE SET
          meta_title = excluded.meta_title,
          meta_description = excluded.meta_description,
          keywords = excluded.keywords,
          h1_override = excluded.h1_override,
          canonical_url = excluded.canonical_url,
          og_title = excluded.og_title,
          og_description = excluded.og_description,
          og_image_url = excluded.og_image_url,
          updated_at = CURRENT_TIMESTAMP
      `)
      .bind(
        payload.product_id,
        payload.meta_title,
        payload.meta_description,
        payload.keywords,
        payload.h1_override,
        payload.canonical_url,
        payload.og_title,
        payload.og_description,
        payload.og_image_url
      )
      .run();
  } catch {
    // SEO is helpful, but it should never block a mobile draft save.
  }
}

async function insertProductImage(db, env, productId, imageUrl, altText, sortOrder) {
  const storedImageUrl = normalizeStoredImageUrl(env, imageUrl);
  if (!storedImageUrl) return null;

  try {
    const result = await db
      .prepare(`
        INSERT INTO product_images (product_id, image_url, alt_text, sort_order, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
      .bind(productId, storedImageUrl, altText || "Product photo", sortOrder)
      .run();

    return Number(result?.meta?.last_row_id || 0) || null;
  } catch {
    return null;
  }
}

async function uploadImages({ db, env, files, productId, resolvedName, adminUser }) {
  const bucket = env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
  const uploaded = [];

  if (!bucket || typeof bucket.put !== "function") return uploaded;

  const currentMaxSortResult = await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM product_images WHERE product_id = ?")
    .bind(productId)
    .first()
    .catch(() => null);

  let nextImageSortOrder = Number(currentMaxSortResult?.max_sort ?? -1) + 1;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const mimeType = normalizeText(file.type || "application/octet-stream").toLowerCase();

    if (!mimeType.startsWith("image/")) {
      uploaded.push({ ok: false, skipped: true, reason: "Only image files are supported.", original_filename: file?.name || `image-${index + 1}` });
      continue;
    }

    if (Number(file.size || 0) <= 0) {
      uploaded.push({ ok: false, skipped: true, reason: "Image file is empty.", original_filename: file?.name || `image-${index + 1}` });
      continue;
    }

    if (Number(file.size || 0) > 10 * 1024 * 1024) {
      uploaded.push({ ok: false, skipped: true, reason: "Image must be 10 MB or smaller.", original_filename: file?.name || `image-${index + 1}` });
      continue;
    }

    const originalName = sanitizeFilename(file.name || `image-${index + 1}`);
    const extension = inferExtension(originalName, mimeType);
    const objectKey = ["products", String(productId), `${Date.now()}-${index + 1}-${crypto.randomUUID()}.${extension}`].join("/");

    try {
      const buffer = await file.arrayBuffer();

      await bucket.put(objectKey, buffer, {
        httpMetadata: {
          contentType: mimeType,
          cacheControl: "public, max-age=31536000, immutable"
        },
        customMetadata: {
          original_name: originalName,
          product_id: String(productId),
          uploaded_by_user_id: String(adminUser.user_id || "")
        }
      });

      const publicUrl = buildPublicUrl(env, objectKey);
      const storedImageUrl = normalizeStoredImageUrl(env, publicUrl || objectKey);
      const sortOrder = nextImageSortOrder;
      nextImageSortOrder += 1;

      const productImageId = await insertProductImage(db, env, productId, storedImageUrl, `${resolvedName} photo ${index + 1}`, sortOrder);

      try {
        await db
          .prepare(`
            INSERT INTO media_assets (
              product_id,
              storage_provider,
              bucket_name,
              object_key,
              public_url,
              original_filename,
              mime_type,
              file_size_bytes,
              created_by_user_id,
              created_at,
              updated_at
            ) VALUES (?, 'r2', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `)
          .bind(
            productId,
            normalizeText(env.PRODUCT_MEDIA_BUCKET_NAME || env.R2_BUCKET_NAME || "product-media"),
            objectKey,
            storedImageUrl || null,
            originalName,
            mimeType,
            Number(file.size || 0),
            adminUser.user_id
          )
          .run();
      } catch {
        // Older schemas may not have media_assets yet. Do not block the saved product.
      }

      uploaded.push({
        ok: true,
        product_image_id: productImageId,
        object_key: objectKey,
        public_url: storedImageUrl,
        original_filename: originalName,
        file_size_bytes: Number(file.size || 0),
        mime_type: mimeType
      });
    } catch (error) {
      uploaded.push({
        ok: false,
        original_filename: originalName,
        error: error?.message || "Image upload failed."
      });
    }
  }

  return uploaded;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);

  if (!db) {
    return json({ ok: false, error: "Database binding is missing for mobile product capture." }, 500);
  }

  try {
    const adminUser = await getAdminUserFromRequest(request, env);
    if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ ok: false, error: "Expected multipart/form-data upload." }, 400);
    }

    const requestedProductId = Number(form.get("product_id") || 0) || 0;
    const name = normalizeText(form.get("name"));
    const captureReference = normalizeText(form.get("capture_reference"));
    const productCategory = normalizeText(form.get("product_category"));
    const colorNames = normalizeColorNames(form.get("color_names_text") || "", form.get("color_name"));
    const colorName = colorNames[0] || "";
    const shortDescription = normalizeText(form.get("short_description"));
    const description = normalizeText(form.get("description"));
    const metaTitle = normalizeText(form.get("meta_title"));
    const metaDescription = normalizeText(form.get("meta_description"));
    const keywords = normalizeText(form.get("keywords"));
    const shippingCode = normalizeText(form.get("shipping_code"));
    const currency = normalizeText(form.get("currency") || "CAD").toUpperCase() || "CAD";
    const skuOverride = normalizeText(form.get("sku"));
    const taxClassIdRaw = normalizeText(form.get("tax_class_id"));
    const taxClassId = taxClassIdRaw ? Number(taxClassIdRaw) : null;
    const priceCents = parseWholeNumber(form.get("price_cents"), 0);
    const compareAtPriceRaw = normalizeText(form.get("compare_at_price_cents"));
    const compareAtPriceCents = compareAtPriceRaw ? parseWholeNumber(compareAtPriceRaw, 0) : null;
    const inventoryQuantity = Math.max(0, parseWholeNumber(form.get("inventory_quantity"), 1) || 1);
    const requiresShipping = Number(form.get("requires_shipping") || 1) === 1 ? 1 : 0;
    const taxable = Number(form.get("taxable") || 1) === 1 ? 1 : 0;
    const weightGramsRaw = normalizeText(form.get("weight_grams"));
    const weightGrams = weightGramsRaw ? parseWholeNumber(weightGramsRaw, 0) : null;
    const resourceLinksRaw = normalizeText(form.get("resource_links_json"));
    const captureEntryModeRaw = normalizeText(form.get("capture_entry_mode")).toLowerCase();
    const captureEntryMode = ["full", "wizard"].includes(captureEntryModeRaw) ? captureEntryModeRaw : "full";
    const creativeProjectId = Math.max(0, Number(form.get("creative_project_id") || 0) || 0);

    if (!Number.isInteger(priceCents) || priceCents < 0) {
      return json({ ok: false, error: "price_cents must be a valid whole number." }, 400);
    }

    if (compareAtPriceCents !== null && (!Number.isInteger(compareAtPriceCents) || compareAtPriceCents < 0)) {
      return json({ ok: false, error: "compare_at_price_cents must be a valid whole number." }, 400);
    }

    if (weightGrams !== null && (!Number.isInteger(weightGrams) || weightGrams < 0)) {
      return json({ ok: false, error: "weight_grams must be a valid whole number." }, 400);
    }

    if (taxClassId !== null && (!Number.isInteger(taxClassId) || taxClassId <= 0)) {
      return json({ ok: false, error: "tax_class_id must be a valid id." }, 400);
    }

    const files = form
      .getAll("images")
      .filter((file) => file && typeof file.arrayBuffer === "function")
      .slice(0, 7);

    if (!name && !captureReference && !files.length && !requestedProductId) {
      return json({ ok: false, error: "Add at least a name, a reference, or a photo before saving." }, 400);
    }

    const productColumns = await getTableColumnSet(db, "products");

    let resolvedProductId = requestedProductId;
    let productNumber = 0;
    let resolvedName = "";
    let slug = "";
    let sku = "";
    let readyNotes = "";

    if (resolvedProductId > 0) {
      const existing = await db
        .prepare(`
          SELECT product_id, product_number, slug, sku, name,
                 ${selectColumnSql(productColumns, "capture_reference")},
                 featured_image_url
          FROM products
          WHERE product_id = ?
          LIMIT 1
        `)
        .bind(resolvedProductId)
        .first();

      if (!existing) return json({ ok: false, error: "Draft product not found." }, 404);

      productNumber = Number(existing.product_number || 0);
      resolvedName = name || captureReference || normalizeText(existing.name) || `Draft product ${productNumber || resolvedProductId}`;
      slug = normalizeText(existing.slug) || slugify(`${resolvedName}-${productNumber || resolvedProductId}`) || `product-${productNumber || resolvedProductId}`;
      sku = skuOverride || normalizeText(existing.sku) || `DND-${String(productNumber || resolvedProductId).padStart(5, "0")}`;
      readyNotes = [
        captureReference ? `Capture reference: ${captureReference}` : "",
        !name ? "Partial draft saved without final product name." : "",
        !productCategory ? "Category still needed." : "",
        priceCents === 0 ? "Price still needed." : ""
      ]
        .filter(Boolean)
        .join(" ");

      const assignments = ["name = ?"];
      const bindings = [resolvedName];

      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "capture_reference", value: captureReference || null });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "product_category", value: productCategory || null });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "color_name", value: colorName || null });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "color_names_json", value: JSON.stringify(colorNames) });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "shipping_code", value: shippingCode || null });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "review_status", value: null, expression: "'pending_review'" });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "is_ready_for_storefront", value: null, expression: "0" });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "ready_check_notes", value: readyNotes || null });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "capture_entry_mode", value: captureEntryMode });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "capture_updated_by_user_id", value: Number(adminUser.user_id || 0) || null });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "capture_entry_started_at", value: null, expression: "COALESCE(capture_entry_started_at, CURRENT_TIMESTAMP)" });
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "capture_last_saved_at", value: null, expression: "CURRENT_TIMESTAMP" });

      const commonUpdates = [
        ["short_description", shortDescription || null],
        ["description", description || null],
        ["price_cents", priceCents],
        ["compare_at_price_cents", compareAtPriceCents],
        ["currency", currency],
        ["taxable", taxable],
        ["tax_class_id", taxClassId],
        ["requires_shipping", requiresShipping],
        ["weight_grams", weightGrams],
        ["inventory_quantity", inventoryQuantity]
      ];

      commonUpdates.forEach(([column, value]) => pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column, value }));
      pushOptionalUpdate({ assignments, bindings, columnSet: productColumns, column: "updated_at", value: null, expression: "CURRENT_TIMESTAMP" });

      bindings.push(resolvedProductId);

      await db
        .prepare(`
          UPDATE products
          SET ${assignments.join(",\n              ")}
          WHERE product_id = ?
        `)
        .bind(...bindings)
        .run();
    } else {
      productNumber = await allocateNextProductNumber(db);
      resolvedName = name || captureReference || `Draft product ${productNumber}`;

      const identity = await resolveNewProductIdentity({
        db,
        productColumns,
        preferredProductNumber: productNumber,
        resolvedName,
        slugCandidate: slugify(`${resolvedName}-${productNumber}`) || `product-${productNumber}`,
        skuCandidate: skuOverride || buildDefaultSku(productNumber, productNumber)
      });

      productNumber = identity.productNumber || productNumber;
      slug = identity.slug || slugify(`${resolvedName}-${productNumber}`) || `product-${productNumber}`;
      sku = identity.sku || buildDefaultSku(productNumber, productNumber);

      readyNotes = [
        captureReference ? `Capture reference: ${captureReference}` : "",
        !name ? "Partial draft saved without final product name." : "",
        !productCategory ? "Category still needed." : "",
        priceCents === 0 ? "Price still needed." : ""
      ]
        .filter(Boolean)
        .join(" ");

      const columns = [];
      const placeholders = [];
      const bindings = [];

      [
        ["product_number", productNumber],
        ["slug", slug],
        ["sku", sku],
        ["name", resolvedName],
        ["short_description", shortDescription || null],
        ["description", description || null],
        ["product_type", "physical"],
        ["status", "draft"],
        ["price_cents", priceCents],
        ["compare_at_price_cents", compareAtPriceCents],
        ["currency", currency],
        ["taxable", taxable],
        ["tax_class_id", taxClassId],
        ["requires_shipping", requiresShipping],
        ["weight_grams", weightGrams],
        ["inventory_tracking", 1],
        ["inventory_quantity", inventoryQuantity],
        ["featured_image_url", null],
        ["sort_order", 0]
      ].forEach(([column, value]) => pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column, value }));

      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "capture_reference", value: captureReference || null });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "product_category", value: productCategory || null });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "color_name", value: colorName || null });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "color_names_json", value: JSON.stringify(colorNames) });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "shipping_code", value: shippingCode || null });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "review_status", value: "pending_review" });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "is_ready_for_storefront", value: 0 });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "ready_check_notes", value: readyNotes || null });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "capture_entry_mode", value: captureEntryMode });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "capture_created_by_user_id", value: Number(adminUser.user_id || 0) || null });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "capture_updated_by_user_id", value: Number(adminUser.user_id || 0) || null });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "capture_entry_started_at", value: null, placeholder: "CURRENT_TIMESTAMP" });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "capture_last_saved_at", value: null, placeholder: "CURRENT_TIMESTAMP" });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "created_at", value: null, placeholder: "CURRENT_TIMESTAMP" });
      pushOptionalInsert({ columns, placeholders, bindings, columnSet: productColumns, column: "updated_at", value: null, placeholder: "CURRENT_TIMESTAMP" });

      if (!columns.includes("name")) return json({ ok: false, error: "The products table is missing the required name column." }, 500);

      let insertResult = null;
      let lastUniqueError = null;

      for (let insertAttempt = 0; insertAttempt < 5; insertAttempt += 1) {
        try {
          insertResult = await db
            .prepare(`
              INSERT INTO products (${columns.join(", ")})
              VALUES (${placeholders.join(", ")})
            `)
            .bind(...bindings)
            .run();
          break;
        } catch (error) {
          if (!isSqliteUniqueConstraint(error)) throw error;
          lastUniqueError = error;

          const retryProductNumber = await allocateNextProductNumber(db);
          const identityRetry = await resolveNewProductIdentity({
            db,
            productColumns,
            preferredProductNumber: retryProductNumber,
            resolvedName,
            slugCandidate: slugify(`${resolvedName}-${retryProductNumber}`) || `product-${retryProductNumber}`,
            skuCandidate: skuOverride ? `${normalizeSku(skuOverride)}-${insertAttempt + 2}` : buildDefaultSku(retryProductNumber, retryProductNumber)
          });

          productNumber = identityRetry.productNumber || productNumber + insertAttempt + 1;
          slug = identityRetry.slug || slug;
          sku = identityRetry.sku || sku;

          const numberIndex = columns.indexOf("product_number");
          if (numberIndex >= 0) bindings[numberIndex] = productNumber;

          const slugIndex = columns.indexOf("slug");
          if (slugIndex >= 0) bindings[slugIndex] = slug;

          const skuIndex = columns.indexOf("sku");
          if (skuIndex >= 0) bindings[skuIndex] = sku;
        }
      }

      if (!insertResult) {
        return json(
          {
            ok: false,
            error: "This draft could not be saved because the generated SKU or product number already exists. Refresh the mobile product page and try Save Partial again.",
            details: lastUniqueError?.message || "Unique constraint failed.",
            recoverable: true
          },
          409
        );
      }

      resolvedProductId = Number(insertResult?.meta?.last_row_id || 0);
      if (!resolvedProductId) return json({ ok: false, error: "Product could not be created." }, 500);
      await ensureProductNumberSequenceAtLeast(db, Number(productNumber || 0) + 1);
    }

    const uploaded = await uploadImages({ db, env, files, productId: resolvedProductId, resolvedName, adminUser });
    const firstUploadedUrl = uploaded.find((row) => row?.ok && row.public_url)?.public_url || "";
    const featuredImageUrl = normalizeStoredImageUrl(env, firstUploadedUrl) || null;

    if (featuredImageUrl && productColumns.has("featured_image_url")) {
      await db
        .prepare("UPDATE products SET featured_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?")
        .bind(featuredImageUrl, resolvedProductId)
        .run()
        .catch(() => null);
    }

    const seoTitle = metaTitle || `${resolvedName}${productCategory ? ` ${productCategory}` : ""}${colorName ? ` ${colorName}` : ""} | Devil n Dove`;
    const seoDescription = metaDescription || shortDescription || description || captureReference || `Draft ${productCategory || "creation"} by Devil n Dove.`;

    await upsertProductSeo(db, {
      product_id: resolvedProductId,
      meta_title: seoTitle,
      meta_description: seoDescription,
      keywords: keywords || [resolvedName, captureReference, productCategory, ...colorNames, "handmade", "Devil n Dove", "Ontario"].filter(Boolean).join(", "),
      h1_override: resolvedName,
      canonical_url: `/shop/product/?slug=${slug}`,
      og_title: seoTitle,
      og_description: seoDescription,
      og_image_url: featuredImageUrl || null
    });

    await persistProductResourceLinks({
      db,
      productId: resolvedProductId,
      links: parseProductResourceLinksJson(resourceLinksRaw),
      adminUserId: Number(adminUser.user_id || 0) || null
    });

    // Build 214: project association is optional. A product created by phone capture may remain independent.
    if (creativeProjectId > 0) {
      // Build 214 migration owns creative_project_product_links; request-time schema mutation is forbidden.
      const projectExists = await db.prepare("SELECT creative_work_project_id FROM creative_work_projects WHERE creative_work_project_id = ? LIMIT 1").bind(creativeProjectId).first().catch(() => null);
      if (projectExists) {
        const hasPrimary = await db.prepare("SELECT 1 AS found FROM creative_project_product_links WHERE creative_work_project_id = ? AND is_primary = 1 LIMIT 1").bind(creativeProjectId).first().catch(() => null);
        await db.prepare(`INSERT INTO creative_project_product_links (creative_work_project_id, product_id, relationship_type, is_primary, created_by)
          VALUES (?, ?, 'phone_capture', ?, ?)
          ON CONFLICT(creative_work_project_id, product_id) DO UPDATE SET relationship_type = excluded.relationship_type`)
          .bind(creativeProjectId, resolvedProductId, hasPrimary ? 0 : 1, Number(adminUser.user_id || 0) || null).run();
      }
    }

    const createdProduct = await db
      .prepare("SELECT * FROM products WHERE product_id = ? LIMIT 1")
      .bind(resolvedProductId)
      .first()
      .catch(() => null);

    const normalizedProduct = createdProduct
      ? {
          ...createdProduct,
          featured_image_url: normalizeStoredImageUrl(env, createdProduct?.featured_image_url || "")
        }
      : createdProduct;

    const nextProductNumber = await getNextProductNumber(db).catch(() => productNumber + 1);

    return json(
      {
        ok: true,
        message: requestedProductId > 0 ? "Draft product updated." : "Draft product saved. You can come back later to finish the details.",
        product: normalizedProduct,
        product_number_label: formatProductNumberLabel(normalizedProduct?.product_number || productNumber),
        uploaded_images: uploaded,
        next_product_number: nextProductNumber,
        next_product_number_label: formatProductNumberLabel(nextProductNumber),
        creative_project_id: creativeProjectId || null,
        project_linked: creativeProjectId > 0
      },
      requestedProductId > 0 ? 200 : 201
    );
  } catch (error) {
    try {
      await captureRuntimeIncident(env, request, {
        incident_scope: "admin_mobile_product",
        incident_code: "mobile_create_product_failed",
        severity: "error",
        message: "Phone product capture save failed.",
        details: { error: error?.message || String(error || "Unknown error") }
      });
    } catch {
      // Do not let incident logging hide the original endpoint error.
    }

    if (isSqliteUniqueConstraint(error)) {
      return json(
        {
          ok: false,
          error: "A draft product could not be saved because the SKU/product number/slug already exists. The endpoint will generate a new identity on the next Save Partial attempt.",
          details: error?.message || String(error || "Unique constraint failed."),
          recoverable: true
        },
        409
      );
    }

    return json({ ok: false, error: error?.message || "Phone product capture failed unexpectedly." }, 500);
  }
}
