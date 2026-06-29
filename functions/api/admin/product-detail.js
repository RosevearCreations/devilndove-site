// File: /functions/api/admin/product-detail.js
// Returns one product with images, SEO, and image annotations for admin editing.
// Build 197: schema-aware reads keep older D1 builds from failing an entire editor load.

import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

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

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

  const productId = Number(new URL(request.url).searchParams.get("product_id"));
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: "A valid product_id is required." }, 400);

  try {
    const [hasTaxClasses, hasProductSeo, hasProductImages, hasImageAnnotations] = await Promise.all([
      tableExists(db, "tax_classes"), tableExists(db, "product_seo"), tableExists(db, "product_images"), tableExists(db, "product_image_annotations")
    ]);
    const [taxCols, seoCols, imageCols, annotationCols] = await Promise.all([
      hasTaxClasses ? getTableColumnSet(db, "tax_classes") : new Set(),
      hasProductSeo ? getTableColumnSet(db, "product_seo") : new Set(),
      hasProductImages ? getTableColumnSet(db, "product_images") : new Set(),
      hasImageAnnotations ? getTableColumnSet(db, "product_image_annotations") : new Set()
    ]);

    const taxCodeExpr = hasTaxClasses && taxCols.has("code") ? "tc.code" : "NULL";
    const taxNameExpr = hasTaxClasses && taxCols.has("name") ? "tc.name" : "NULL";
    const taxRateExpr = hasTaxClasses
      ? (taxCols.has("rate_percent") && taxCols.has("tax_rate") ? "COALESCE(tc.rate_percent, tc.tax_rate, 0)" : taxCols.has("rate_percent") ? "COALESCE(tc.rate_percent, 0)" : taxCols.has("tax_rate") ? "COALESCE(tc.tax_rate, 0)" : "0")
      : "0";
    const seoField = (column) => hasProductSeo && seoCols.has(column) ? `ps.${column}` : "NULL";

    const product = await db.prepare(`
      SELECT p.*,
        ${taxCodeExpr} AS tax_class_code,
        ${taxNameExpr} AS tax_class_name,
        ${taxRateExpr} AS tax_rate,
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
    product.color_names = parseColorNamesJson(product.color_names_json, product.color_name || "");
    product.color_names_text = product.color_names.join(", ");

    let images = [];
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
      images = normalizeResults(await db.prepare(`SELECT ${select} FROM product_images WHERE product_id = ? ORDER BY ${orderingColumn} ASC, ${idColumn} ASC`).bind(productId).all().catch(() => ({ results: [] })));
    }

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

    return json({ ok: true, product, images, image_annotations: imageAnnotations });
  } catch (error) {
    // Keep an editor-specific failure from surfacing as an opaque Pages 503.
    return json({ ok: false, error: error?.message || "Could not load this product safely." }, 500);
  }
}
