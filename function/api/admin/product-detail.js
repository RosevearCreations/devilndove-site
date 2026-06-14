// File: /functions/api/admin/product-detail.js
// Brief description: Returns one product with images, SEO, and image annotations for admin editing.

import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  try {
    const row = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`)
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
    return new Set(rows.map((row) => String(row?.name || "").trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function parseColorNamesJson(value, fallbackColor = "") {
  const parsed = [];
  if (typeof value === "string" && value.trim()) {
    try {
      const raw = JSON.parse(value);
      if (Array.isArray(raw)) {
        raw.forEach((item) => {
          const cleaned = normalizeText(item);
          if (cleaned && !parsed.includes(cleaned)) parsed.push(cleaned);
        });
      }
    } catch {}
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
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  const [hasTaxClasses, hasProductSeo, hasProductImages, hasImageAnnotations] = await Promise.all([
    tableExists(db, "tax_classes"),
    tableExists(db, "product_seo"),
    tableExists(db, "product_images"),
    tableExists(db, "product_image_annotations")
  ]);

  const taxCols = hasTaxClasses ? await getTableColumnSet(db, "tax_classes") : new Set();
  const taxRateExpr = hasTaxClasses
    ? (taxCols.has("rate_percent") ? "COALESCE(tc.rate_percent, tc.tax_rate, 0)" : "COALESCE(tc.tax_rate, 0)")
    : "0";

  const product = await db.prepare(`
    SELECT
      p.*,
      ${hasTaxClasses ? "tc.code" : "NULL"} AS tax_class_code,
      ${hasTaxClasses ? "tc.name" : "NULL"} AS tax_class_name,
      ${taxRateExpr} AS tax_rate,
      ${hasProductSeo ? "ps.meta_title" : "NULL"} AS meta_title,
      ${hasProductSeo ? "ps.meta_description" : "NULL"} AS meta_description,
      ${hasProductSeo ? "ps.keywords" : "NULL"} AS keywords,
      ${hasProductSeo ? "ps.h1_override" : "NULL"} AS h1_override,
      ${hasProductSeo ? "ps.canonical_url" : "NULL"} AS canonical_url,
      ${hasProductSeo ? "ps.schema_type" : "NULL"} AS schema_type,
      ${hasProductSeo ? "ps.og_title" : "NULL"} AS og_title,
      ${hasProductSeo ? "ps.og_description" : "NULL"} AS og_description,
      ${hasProductSeo ? "ps.og_image_url" : "NULL"} AS og_image_url
    FROM products p
    ${hasTaxClasses ? "LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id" : ""}
    ${hasProductSeo ? "LEFT JOIN product_seo ps ON ps.product_id = p.product_id" : ""}
    WHERE p.product_id = ?
    LIMIT 1
  `).bind(productId).first();

  if (!product) return json({ ok: false, error: "Product not found." }, 404);

  product.color_names = parseColorNamesJson(product.color_names_json, product.color_name || "");
  product.color_names_text = product.color_names.join(", ");

  const images = hasProductImages
    ? normalizeResults(await db.prepare(`
        SELECT product_image_id, product_id, image_url, alt_text, sort_order, created_at
        FROM product_images
        WHERE product_id = ?
        ORDER BY sort_order ASC, product_image_id ASC
      `).bind(productId).all())
    : [];

  const imageAnnotations = hasImageAnnotations
    ? normalizeResults(await db.prepare(`
        SELECT product_image_annotation_id, product_id, product_image_id, image_url, alt_text, image_title, caption,
               focal_point_x, focal_point_y, annotation_notes, updated_at,
               merchandising_score, first_image_score, merchandising_override_reason, shot_style
        FROM product_image_annotations
        WHERE product_id = ?
        ORDER BY product_image_annotation_id ASC
      `).bind(productId).all().catch(() => ({ results: [] })))
    : [];

  return json({ ok: true, product, images, image_annotations: imageAnnotations });
}
