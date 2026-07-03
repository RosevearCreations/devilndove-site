// Returns one product with images, SEO, and image annotations for admin editing.
// Build 206: merges the product-media asset layer into the editor's featured-image
// resolution so an existing approved media asset does not appear as a blank field.

import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import { normalizeTaxRateFraction, taxRatePercent } from "./_tax-rate.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeText(value) { return String(value || "").trim(); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first();
    return !!row;
  } catch { return false; }
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(normalizeResults(result).map((row) => String(row?.name || "").trim()).filter(Boolean));
  } catch { return new Set(); }
}

function columnOrNull(columns, column, alias = column, tableAlias = "") {
  return columns.has(column) ? `${tableAlias}${column} AS ${alias}` : `NULL AS ${alias}`;
}

function parseColorNamesJson(value, fallbackColor = "") {
  const parsed = [];
  if (typeof value === "string" && value.trim()) {
    try {
      const raw = JSON.parse(value);
      if (Array.isArray(raw)) raw.forEach((item) => {
        const cleaned = normalizeText(item);
        if (cleaned && !parsed.includes(cleaned)) parsed.push(cleaned);
      });
    } catch {
      value.split(/[\r\n,|/]+/g).map(normalizeText).filter(Boolean).forEach((item) => {
        if (!parsed.includes(item)) parsed.push(item);
      });
    }
  }
  const fallback = normalizeText(fallbackColor);
  if (fallback && !parsed.includes(fallback)) parsed.unshift(fallback);
  return parsed;
}

function uniqueByImageUrl(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = normalizeText(row?.image_url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceLabel(source) {
  return ({
    product_record: "Product featured-image field",
    product_images: "Product image gallery",
    media_assets: "Media library asset"
  })[source] || "No image source";
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

  const productId = Number(new URL(request.url).searchParams.get("product_id"));
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: "A valid product_id is required." }, 400);

  try {
    const [hasTaxClasses, hasProductSeo, hasProductImages, hasImageAnnotations, hasMediaAssets] = await Promise.all([
      tableExists(db, "tax_classes"), tableExists(db, "product_seo"), tableExists(db, "product_images"), tableExists(db, "product_image_annotations"), tableExists(db, "media_assets")
    ]);
    const [taxCols, seoCols, imageCols, annotationCols, mediaCols] = await Promise.all([
      hasTaxClasses ? getTableColumnSet(db, "tax_classes") : new Set(),
      hasProductSeo ? getTableColumnSet(db, "product_seo") : new Set(),
      hasProductImages ? getTableColumnSet(db, "product_images") : new Set(),
      hasImageAnnotations ? getTableColumnSet(db, "product_image_annotations") : new Set(),
      hasMediaAssets ? getTableColumnSet(db, "media_assets") : new Set()
    ]);

    const taxCodeExpr = hasTaxClasses && taxCols.has("code") ? "tc.code" : "NULL";
    const taxNameExpr = hasTaxClasses && taxCols.has("name") ? "tc.name" : "NULL";
    const taxRateRawExpr = hasTaxClasses && taxCols.has("tax_rate") ? "tc.tax_rate" : "NULL";
    const ratePercentRawExpr = hasTaxClasses && taxCols.has("rate_percent") ? "tc.rate_percent" : "NULL";
    const seoField = (column) => hasProductSeo && seoCols.has(column) ? `ps.${column}` : "NULL";

    const product = await db.prepare(`
      SELECT p.*,
        ${taxCodeExpr} AS tax_class_code,
        ${taxNameExpr} AS tax_class_name,
        ${taxRateRawExpr} AS tax_rate_raw,
        ${ratePercentRawExpr} AS rate_percent_raw,
        ${seoField("meta_title")} AS meta_title,
        ${seoField("meta_description")} AS meta_description,
        ${seoField("keywords")} AS keywords,
        ${seoField("h1_override")} AS h1_override,
        ${seoField("canonical_url")} AS canonical_url,
        ${seoField("schema_type")} AS schema_type,
        ${seoField("og_title")} AS og_title,
        ${seoField("og_description")} AS og_description,
        ${seoField("og_image_url")} AS og_image_url
      FROM products p
      ${hasTaxClasses && taxCols.has("tax_class_id") ? "LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id" : ""}
      ${hasProductSeo && seoCols.has("product_id") ? "LEFT JOIN product_seo ps ON ps.product_id = p.product_id" : ""}
      WHERE p.product_id = ?
      LIMIT 1
    `).bind(productId).first();

    if (!product) return json({ ok: false, error: "Product not found." }, 404);
    product.tax_rate = normalizeTaxRateFraction(product.tax_rate_raw, product.rate_percent_raw);
    product.rate_percent = taxRatePercent(product.tax_rate);
    product.color_names = parseColorNamesJson(product.color_names_json, product.color_name || "");
    product.color_names_text = product.color_names.join(", ");

    let galleryImages = [];
    if (hasProductImages && imageCols.has("product_id") && imageCols.has("image_url")) {
      const idColumn = imageCols.has("product_image_id") ? "product_image_id" : imageCols.has("id") ? "id" : "rowid";
      const orderingColumn = imageCols.has("sort_order") ? "sort_order" : imageCols.has("display_order") ? "display_order" : imageCols.has("position") ? "position" : idColumn;
      const select = [
        `${idColumn} AS product_image_id`,
        "product_id",
        "image_url",
        columnOrNull(imageCols, "alt_text"),
        `${orderingColumn} AS sort_order`,
        columnOrNull(imageCols, "created_at")
      ].join(", ");
      galleryImages = normalizeResults(await db.prepare(`SELECT ${select} FROM product_images WHERE product_id = ? ORDER BY ${orderingColumn} ASC, ${idColumn} ASC`).bind(productId).all().catch(() => ({ results: [] }))).map((row) => ({ ...row, image_source: "product_images" }));
    }

    let mediaAssets = [];
    if (hasMediaAssets && mediaCols.has("product_id") && mediaCols.has("public_url")) {
      const idColumn = mediaCols.has("media_asset_id") ? "media_asset_id" : mediaCols.has("id") ? "id" : "rowid";
      const orderColumn = mediaCols.has("sort_order") ? "sort_order" : idColumn;
      const createdExpr = mediaCols.has("created_at") ? "created_at" : "NULL";
      const roleExpr = mediaCols.has("variant_role") ? "variant_role" : "NULL";
      const filenameExpr = mediaCols.has("original_filename") ? "original_filename" : "NULL";
      const noteExpr = mediaCols.has("annotation_notes") ? "annotation_notes" : "NULL";
      const deletedClause = mediaCols.has("deleted_at") ? "AND deleted_at IS NULL" : "";
      const rows = normalizeResults(await db.prepare(`
        SELECT ${idColumn} AS media_asset_id, product_id, public_url AS image_url,
               ${roleExpr} AS variant_role, ${filenameExpr} AS original_filename,
               ${noteExpr} AS annotation_notes, ${orderColumn} AS sort_order,
               ${createdExpr} AS created_at
        FROM media_assets
        WHERE product_id = ? AND LENGTH(TRIM(COALESCE(public_url,''))) > 0 ${deletedClause}
        ORDER BY CASE LOWER(COALESCE(${roleExpr},'')) WHEN 'featured' THEN 0 WHEN 'hero_front' THEN 1 ELSE 2 END,
                 COALESCE(${orderColumn}, 999999) ASC, ${idColumn} ASC
      `).bind(productId).all().catch(() => ({ results: [] })));
      mediaAssets = rows.map((row) => ({
        product_image_id: null,
        media_asset_id: Number(row.media_asset_id || 0) || null,
        product_id: row.product_id,
        image_url: row.image_url,
        alt_text: row.original_filename || row.annotation_notes || "",
        sort_order: Number(row.sort_order || 999999),
        created_at: row.created_at || null,
        variant_role: row.variant_role || null,
        image_source: "media_assets"
      }));
    }

    const storedFeaturedUrl = normalizeText(product.featured_image_url);
    const featureCandidates = [
      storedFeaturedUrl ? { image_url: storedFeaturedUrl, source: "product_record" } : null,
      ...galleryImages.map((row) => ({ image_url: normalizeText(row.image_url), source: "product_images" })),
      ...mediaAssets.map((row) => ({ image_url: normalizeText(row.image_url), source: "media_assets" }))
    ].filter((row) => row?.image_url);
    const resolvedFeatured = featureCandidates[0] || null;
    product.featured_image_stored_url = storedFeaturedUrl || null;
    product.featured_image_url = resolvedFeatured?.image_url || "";
    product.featured_image_source = resolvedFeatured?.source || null;
    product.featured_image_source_label = sourceLabel(resolvedFeatured?.source);
    product.featured_image_needs_sync = !storedFeaturedUrl && !!resolvedFeatured ? 1 : 0;
    product.media_asset_count = mediaAssets.length;
    product.product_image_count = galleryImages.length;

    const images = uniqueByImageUrl([...galleryImages, ...mediaAssets]);

    let imageAnnotations = [];
    if (hasImageAnnotations && annotationCols.has("product_id")) {
      const fields = [
        columnOrNull(annotationCols, "product_image_annotation_id"),
        columnOrNull(annotationCols, "product_id"),
        columnOrNull(annotationCols, "product_image_id"),
        columnOrNull(annotationCols, "image_url"),
        columnOrNull(annotationCols, "alt_text"),
        columnOrNull(annotationCols, "image_title"),
        columnOrNull(annotationCols, "caption"),
        columnOrNull(annotationCols, "focal_point_x"),
        columnOrNull(annotationCols, "focal_point_y"),
        columnOrNull(annotationCols, "annotation_notes"),
        columnOrNull(annotationCols, "updated_at"),
        columnOrNull(annotationCols, "merchandising_score"),
        columnOrNull(annotationCols, "first_image_score"),
        columnOrNull(annotationCols, "merchandising_override_reason"),
        columnOrNull(annotationCols, "shot_style")
      ].join(", ");
      imageAnnotations = normalizeResults(await db.prepare(`SELECT ${fields} FROM product_image_annotations WHERE product_id = ? ORDER BY ${annotationCols.has("product_image_annotation_id") ? "product_image_annotation_id" : "rowid"} ASC`).bind(productId).all().catch(() => ({ results: [] })));
    }

    return json({ ok: true, product, images, media_assets: mediaAssets, image_annotations: imageAnnotations });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not load this product safely." }, 500);
  }
}
