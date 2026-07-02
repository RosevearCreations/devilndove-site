import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import { createOrRefreshContentProjectForProduct } from "../_lib/contentAutomationStudio.js";
import { syncCreativeProjectFromContentProject } from "../_lib/creativeAssetIntelligence.js";

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
    .slice(0, 7);
}

function normalizeCanonicalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
}

function normalizeImageKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
}

function uniqueProductImageUrls(featuredImageUrl, imageUrls = []) {
  const seen = new Set();
  const urls = [];
  [featuredImageUrl, ...normalizeImageUrls(imageUrls)].forEach((url) => {
    const clean = String(url || "").trim();
    if (!clean) return;
    const key = normalizeImageKey(clean);
    if (seen.has(key)) return;
    seen.add(key);
    urls.push(clean);
  });
  return urls.slice(0, 7);
}

async function syncProductImages(db, productId, name, featuredImageUrl, imageUrls = [], { replaceExisting = false } = {}) {
  const rows = [];
  const urls = uniqueProductImageUrls(featuredImageUrl, imageUrls);
  const imageColumns = await getTableColumnSet(db, "product_images");
  if (!productId || !imageColumns.has("product_id") || !imageColumns.has("image_url")) return rows;

  const orderingColumn = imageColumns.has("sort_order") ? "sort_order" : imageColumns.has("display_order") ? "display_order" : "product_image_id";
  const existingResult = await db
    .prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY ${orderingColumn} ASC, product_image_id ASC`)
    .bind(productId)
    .all()
    .catch(() => ({ results: [] }));
  const existingRows = Array.isArray(existingResult?.results) ? existingResult.results : [];
  const existingByUrl = new Map();
  existingRows.forEach((row) => {
    const key = normalizeImageKey(row?.image_url);
    if (key && !existingByUrl.has(key)) existingByUrl.set(key, row);
  });

  const keptIds = [];
  const explicitKeys = new Set();
  for (let index = 0; index < urls.length; index += 1) {
    const imageUrl = urls[index];
    const key = normalizeImageKey(imageUrl);
    explicitKeys.add(key);
    const existing = existingByUrl.get(key);
    const existingId = Number(existing?.product_image_id || 0);
    const fallbackAlt = name || (index === 0 ? "Featured product image" : `Product image ${index + 1}`);

    if (existingId && imageColumns.has("product_image_id")) {
      const assignments = [];
      const binds = [];
      assignments.push("image_url = ?"); binds.push(imageUrl);
      if (imageColumns.has("sort_order")) { assignments.push("sort_order = ?"); binds.push(index); }
      else if (imageColumns.has("display_order")) { assignments.push("display_order = ?"); binds.push(index); }
      if (imageColumns.has("alt_text")) { assignments.push("alt_text = COALESCE(NULLIF(alt_text, ''), ?)"); binds.push(fallbackAlt); }
      if (imageColumns.has("updated_at")) assignments.push("updated_at = CURRENT_TIMESTAMP");
      binds.push(existingId);
      await db.prepare(`UPDATE product_images SET ${assignments.join(", ")} WHERE product_image_id = ?`).bind(...binds).run().catch(() => null);
      keptIds.push(existingId);
    } else {
      const columns = ["product_id", "image_url"];
      const placeholders = ["?", "?"];
      const binds = [productId, imageUrl];
      if (imageColumns.has("alt_text")) { columns.push("alt_text"); placeholders.push("?"); binds.push(fallbackAlt); }
      if (imageColumns.has("sort_order")) { columns.push("sort_order"); placeholders.push("?"); binds.push(index); }
      else if (imageColumns.has("display_order")) { columns.push("display_order"); placeholders.push("?"); binds.push(index); }
      if (imageColumns.has("created_at")) { columns.push("created_at"); placeholders.push("CURRENT_TIMESTAMP"); }
      if (imageColumns.has("updated_at")) { columns.push("updated_at"); placeholders.push("CURRENT_TIMESTAMP"); }
      const inserted = await db.prepare(`INSERT INTO product_images (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`).bind(...binds).run().catch(() => null);
      const insertedId = Number(inserted?.meta?.last_row_id || 0);
      if (insertedId) keptIds.push(insertedId);
    }
  }

  // Normal saves preserve media omitted by partial editors. Re-number those retained rows
  // after the requested/featured set, so exactly one first image remains authoritative.
  if (!replaceExisting && (imageColumns.has("sort_order") || imageColumns.has("display_order"))) {
    let retainedOrder = urls.length;
    for (const row of existingRows) {
      const rowId = Number(row?.product_image_id || 0);
      const key = normalizeImageKey(row?.image_url);
      if (!rowId || explicitKeys.has(key)) continue;
      const orderColumn = imageColumns.has("sort_order") ? "sort_order" : "display_order";
      const orderAssignments = [`${orderColumn} = ?`];
      if (imageColumns.has("updated_at")) orderAssignments.push("updated_at = CURRENT_TIMESTAMP");
      await db.prepare(`UPDATE product_images SET ${orderAssignments.join(", ")} WHERE product_image_id = ?`)
        .bind(retainedOrder, rowId)
        .run()
        .catch(() => null);
      retainedOrder += 1;
    }
  }

  // Destructive replacement remains opt-in only for an explicit media-management action.
  if (replaceExisting && imageColumns.has("product_image_id")) {
    if (keptIds.length) {
      const placeholders = keptIds.map(() => "?").join(", ");
      await db.prepare(`DELETE FROM product_images WHERE product_id = ? AND product_image_id NOT IN (${placeholders})`).bind(productId, ...keptIds).run().catch(() => null);
    } else {
      await db.prepare(`DELETE FROM product_images WHERE product_id = ?`).bind(productId).run().catch(() => null);
    }
  }

  const updated = await db.prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY ${orderingColumn} ASC, product_image_id ASC`).bind(productId).all().catch(() => ({ results: [] }));
  return Array.isArray(updated?.results) ? updated.results : [];
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
          raw
            .split(/[\r\n,|/]+/g)
            .map((part) => String(part || "").trim())
            .filter(Boolean)
            .forEach((part) => values.push(part));
        }
      } catch {
        raw
          .split(/[\r\n,|/]+/g)
          .map((part) => String(part || "").trim())
          .filter(Boolean)
          .forEach((part) => values.push(part));
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

    const product_id = Number(body.product_id);
    const product_number =
      body.product_number == null || body.product_number === "" ? null : Number(body.product_number);
    const name = String(body.name || "").trim();
    const slug = normalizeSlug(body.slug || body.name || "");
    const sku = String(body.sku || "").trim() || null;
    const product_category = String(body.product_category || "").trim() || null;
    const color_name = String(body.color_name || "").trim() || null;
    const color_names = normalizeColorNamesInput(
      body.color_names ?? body.color_names_json ?? body.color_names_text ?? body.colour_names,
      color_name
    );
    const color_names_json = JSON.stringify(color_names);
    const shipping_code = String(body.shipping_code || "").trim() || null;
    const review_status = String(body.review_status || "pending_review").trim().toLowerCase();
    const short_description = String(body.short_description || "").trim() || null;
    const description = String(body.description || "").trim() || null;
    const product_type = String(body.product_type || "").trim().toLowerCase();
    const status = String(body.status || "draft").trim().toLowerCase();
    const price_cents = Number(body.price_cents);
    const compare_at_price_cents =
      body.compare_at_price_cents == null || body.compare_at_price_cents === ""
        ? null
        : Number(body.compare_at_price_cents);
    const currency = String(body.currency || "CAD").trim().toUpperCase();
    const taxable = Number(body.taxable) === 0 ? 0 : 1;
    const tax_class_id =
      body.tax_class_id == null || body.tax_class_id === "" ? null : Number(body.tax_class_id);
    const requires_shipping = Number(body.requires_shipping) === 1 ? 1 : 0;
    const weight_grams =
      body.weight_grams == null || body.weight_grams === "" ? null : Number(body.weight_grams);
    const inventory_tracking = Number(body.inventory_tracking) === 1 ? 1 : 0;
    const inventory_quantity =
      body.inventory_quantity == null || body.inventory_quantity === ""
        ? 0
        : Number(body.inventory_quantity);
    const digital_file_url = String(body.digital_file_url || "").trim() || null;
    const requested_featured_image_url = String(body.featured_image_url || "").trim() || null;
    const sort_order = body.sort_order == null || body.sort_order === "" ? 0 : Number(body.sort_order);
    const image_urls = normalizeImageUrls(body.image_urls);
    const meta_title = String(body.meta_title || "").trim() || null;
    const meta_description = String(body.meta_description || "").trim() || null;
    const keywords = String(body.keywords || "").trim() || null;
    const h1_override = String(body.h1_override || "").trim() || null;
    const canonical_url = normalizeCanonicalUrl(body.canonical_url);
    const og_title = String(body.og_title || "").trim() || null;
    const og_description = String(body.og_description || "").trim() || null;
    const requested_og_image_url = String(body.og_image_url || "").trim() || null;
    const merchandise_origin = cleanMerchandiseOrigin(body.merchandise_origin);
    const sale_channel = cleanSaleChannel(body.sale_channel);
    const external_listing_url = cleanExternalUrl(body.external_listing_url);
    const external_listing_label = cleanText(body.external_listing_label, 120);
    const condition_summary = cleanText(body.condition_summary, 255);
    const era_label = cleanText(body.era_label, 120);
    const sourcing_notes = cleanText(body.sourcing_notes, 2000);

    if (!Number.isInteger(product_id) || product_id <= 0) {
      return json({ ok: false, error: "A valid product_id is required." }, 400);
    }
    if (product_number !== null && (!Number.isInteger(product_number) || product_number <= 0)) {
      return json({ ok: false, error: "product_number must be a valid whole number." }, 400);
    }
    if (!name) return json({ ok: false, error: "Product name is required." }, 400);
    if (!slug) return json({ ok: false, error: "A valid slug is required." }, 400);
    if (!["physical", "digital"].includes(product_type)) {
      return json({ ok: false, error: "Product type must be physical or digital." }, 400);
    }
    if (!["draft", "active", "archived"].includes(status)) {
      return json({ ok: false, error: "Status must be draft, active, or archived." }, 400);
    }
    if (!["pending_review", "approved", "needs_changes", "published"].includes(review_status)) {
      return json(
        { ok: false, error: "review_status must be pending_review, approved, needs_changes, or published." },
        400
      );
    }
    if (!Number.isInteger(price_cents) || price_cents < 0) {
      return json({ ok: false, error: "price_cents must be a valid whole number of cents." }, 400);
    }
    if (
      compare_at_price_cents !== null &&
      (!Number.isInteger(compare_at_price_cents) || compare_at_price_cents < 0)
    ) {
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
      return json(
        { ok: false, error: "Add an external listing URL before activating hybrid or external-only items. Drafts can skip this." },
        400
      );
    }

    const existingProduct = await db
      .prepare(`SELECT * FROM products WHERE product_id = ? LIMIT 1`)
      .bind(product_id)
      .first();
    if (!existingProduct) return json({ ok: false, error: "Product not found." }, 404);

    const existingImagesResult = await db
      .prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, product_image_id ASC`)
      .bind(product_id)
      .all()
      .catch(() => ({ results: [] }));
    const existingImages = Array.isArray(existingImagesResult?.results) ? existingImagesResult.results : [];
    const existingPrimaryImageUrl = String(existingImages[0]?.image_url || "").trim() || null;
    // A blank field means “keep the product's current primary image”, not “erase it”.
    // For a new list, first gallery image becomes the canonical featured image.
    const resolvedFeaturedImageUrl = requested_featured_image_url || image_urls[0] || existingPrimaryImageUrl || String(existingProduct.featured_image_url || "").trim() || null;

    if (product_number !== null) {
      const existingProductNumber = await db
        .prepare(`SELECT product_id FROM products WHERE product_number = ? AND product_id != ? LIMIT 1`)
        .bind(product_number, product_id)
        .first();
      if (existingProductNumber) {
        return json({ ok: false, code: "duplicate_product_number", error: "That product number already exists." }, 409);
      }
    }

    const existingSlug = await db
      .prepare(`SELECT product_id FROM products WHERE slug = ? AND product_id != ? LIMIT 1`)
      .bind(slug, product_id)
      .first();
    if (existingSlug) return json({ ok: false, code: "duplicate_slug", error: "That product slug already exists." }, 409);

    if (sku) {
      const existingSku = await db
        .prepare(`SELECT product_id FROM products WHERE sku = ? AND product_id != ? LIMIT 1`)
        .bind(sku, product_id)
        .first();
      if (existingSku) return json({ ok: false, code: "duplicate_sku", error: "That SKU already exists." }, 409);
    }

    if (tax_class_id !== null) {
      const taxClass = await db
        .prepare(`SELECT tax_class_id FROM tax_classes WHERE tax_class_id = ? AND is_active = 1 LIMIT 1`)
        .bind(tax_class_id)
        .first();
      if (!taxClass) return json({ ok: false, error: "Selected tax class was not found." }, 400);
    }

    const syncedImages = await syncProductImages(db, product_id, name, resolvedFeaturedImageUrl, image_urls, {
      replaceExisting: String(body.media_sync_mode || "").toLowerCase() === "replace"
    });
    // sort_order zero is authoritative: products.featured_image_url mirrors the first retained image.
    const featured_image_url = String(syncedImages[0]?.image_url || resolvedFeaturedImageUrl || "").trim() || null;
    const og_image_url = requested_og_image_url || featured_image_url;
    const readiness = computeReadiness({
      name,
      slug,
      price_cents,
      featured_image_url,
      product_category,
      meta_title,
      meta_description
    });

    const assignments = [];
    const bindValues = [];
    const addColumnValue = (column, value) => {
      if (!productColumns.has(column)) return;
      assignments.push(`${column} = ?`);
      bindValues.push(value);
    };

    addColumnValue("product_number", product_number);
    addColumnValue("slug", slug);
    addColumnValue("sku", sku);
    addColumnValue("name", name);
    addColumnValue("product_category", product_category);
    addColumnValue("color_name", color_name);
    addColumnValue("shipping_code", shipping_code);
    addColumnValue("review_status", review_status);
    addColumnValue("is_ready_for_storefront", readiness.is_ready_for_storefront);
    addColumnValue("ready_check_notes", readiness.ready_check_notes || null);
    addColumnValue("short_description", short_description);
    addColumnValue("description", description);
    addColumnValue("product_type", product_type);
    addColumnValue("status", status);
    addColumnValue("price_cents", price_cents);
    addColumnValue("compare_at_price_cents", compare_at_price_cents);
    addColumnValue("currency", currency);
    addColumnValue("taxable", taxable);
    addColumnValue("tax_class_id", tax_class_id);
    addColumnValue("requires_shipping", requires_shipping);
    addColumnValue("weight_grams", weight_grams);
    addColumnValue("inventory_tracking", inventory_tracking);
    addColumnValue("inventory_quantity", inventory_quantity);
    addColumnValue("digital_file_url", digital_file_url);
    addColumnValue("featured_image_url", featured_image_url);
    addColumnValue("sort_order", sort_order);
    addColumnValue("color_names_json", color_names_json);
    addColumnValue("merchandise_origin", merchandise_origin);
    addColumnValue("sale_channel", sale_channel);
    addColumnValue("external_listing_url", external_listing_url);
    addColumnValue("external_listing_label", external_listing_label);
    addColumnValue("condition_summary", condition_summary);
    addColumnValue("era_label", era_label);
    addColumnValue("sourcing_notes", sourcing_notes);

    if (productColumns.has("updated_at")) assignments.push("updated_at = CURRENT_TIMESTAMP");
    if (!assignments.length) return json({ ok: false, error: "Products table has no editable columns available for update." }, 500);
    bindValues.push(product_id);

    await db
      .prepare(`
        UPDATE products
        SET ${assignments.join(", ")}
        WHERE product_id = ?
      `)
      .bind(...bindValues)
      .run();

    try {
      await db
        .prepare(`
          INSERT INTO product_seo (
            product_id, meta_title, meta_description, keywords, h1_override, canonical_url,
            schema_type, og_title, og_description, og_image_url, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'Product', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(product_id) DO UPDATE SET
            meta_title = excluded.meta_title,
            meta_description = excluded.meta_description,
            keywords = excluded.keywords,
            h1_override = excluded.h1_override,
            canonical_url = excluded.canonical_url,
            schema_type = excluded.schema_type,
            og_title = excluded.og_title,
            og_description = excluded.og_description,
            og_image_url = excluded.og_image_url,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(
          product_id,
          meta_title,
          meta_description,
          keywords,
          h1_override,
          canonical_url,
          og_title,
          og_description,
          og_image_url
        )
        .run();
    } catch {}

    const updatedProduct = await db
      .prepare(`SELECT * FROM products WHERE product_id = ? LIMIT 1`)
      .bind(product_id)
      .first();

    // An editor-based approval must receive the same automation handoff as the
    // dedicated review screen. Only the transition starts the package; later
    // edits can be refreshed deliberately from Content Automation Studio.
    let contentProject = null;
    const previousReviewStatus = String(existingProduct?.review_status || '').trim().toLowerCase();
    const isApprovedNow = ['approved', 'published'].includes(review_status);
    const wasApproved = ['approved', 'published'].includes(previousReviewStatus);
    if (isApprovedNow && !wasApproved) {
      try {
        contentProject = await createOrRefreshContentProjectForProduct(db, product_id, Number(authCheck.sessionUser?.user_id || 0));
        try {
          await syncCreativeProjectFromContentProject(db, contentProject.project.content_project_id, Number(authCheck.sessionUser?.user_id || 0), { trigger: 'product_approval' });
        } catch (caipError) {
          await captureRuntimeIncident(env, request, {
            incident_scope: 'creative_asset_intelligence',
            incident_code: 'editor_approval_caip_sync_failed',
            severity: 'warning',
            message: 'Product update created its content package, but the CAIP mirror could not sync automatically.',
            related_user_id: Number(authCheck.sessionUser?.user_id || 0),
            details: { product_id, content_project_id: contentProject?.project?.content_project_id || null, error: String(caipError?.message || caipError || 'Unknown CAIP sync error') }
          }).catch(() => null);
        }
      } catch (contentError) {
        await captureRuntimeIncident(env, request, {
          incident_scope: 'content_automation_studio',
          incident_code: 'editor_approval_content_package_prepare_failed',
          severity: 'warning',
          message: 'Product update succeeded, but the approval content package could not be prepared automatically.',
          related_user_id: Number(authCheck.sessionUser?.user_id || 0),
          details: { product_id, previous_review_status: previousReviewStatus, new_review_status: review_status, error: String(contentError?.message || contentError || 'Unknown content package error') }
        }).catch(() => null);
      }
    }

    const updatedImagesResult = { results: syncedImages };

    await db.prepare(`
      INSERT INTO product_media_change_audit (
        product_id, action_key, media_kind, media_url, details_json, created_by_user_id, created_at
      ) VALUES (?, ?, 'image', ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      product_id,
      'product_update_preserved_media',
      featured_image_url || null,
      JSON.stringify({ media_sync_mode: 'preserve_existing', requested_image_count: uniqueProductImageUrls(featured_image_url, image_urls).length, retained_image_count: syncedImages.length }),
      Number(authCheck.sessionUser?.user_id || 0) || null
    ).run().catch(() => null);

    await auditAdminAction(env, request, authCheck.sessionUser, {
      action_type: "product_update",
      target_type: "product",
      target_id: Number(updatedProduct?.product_id || product_id),
      target_key: updatedProduct?.slug || slug,
      details: {
        name,
        status,
        review_status,
        inventory_quantity,
        has_images: uniqueProductImageUrls(featured_image_url, image_urls).length > 0,
        merchandise_origin,
        sale_channel,
        has_external_listing: !!external_listing_url,
        color_names,
        media_sync_mode: "preserve_existing",
        content_project_id: contentProject?.project?.content_project_id || null,
        content_package_prepared_on_approval: Boolean(contentProject)
      }
    });

    return json({
      ok: true,
      message: "Product updated successfully.",
      product: updatedProduct,
      images: updatedImagesResult.results || [],
      media_sync_mode: "preserve_existing",
      media_notice: "Existing product media was preserved. Use an explicit media delete control to remove a file.",
      content_project: contentProject ? {
        content_project_id: contentProject.project?.content_project_id || null,
        content_project_key: contentProject.project?.content_project_key || null,
        archived_count: Number(contentProject.archived_count || 0),
        deliverables_created: Number(contentProject.deliverables_created || 0)
      } : null
    });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: "admin_product_update",
      incident_code: "product_update_failed",
      severity: "warning",
      message: error?.message || "Product update failed.",
      related_user_id: authCheck.sessionUser?.user_id,
      details: { error: String(error?.message || error || "Unknown error") }
    });

    return json({ ok: false, error: error?.message || "Failed to update product." }, 500);
  }
}
