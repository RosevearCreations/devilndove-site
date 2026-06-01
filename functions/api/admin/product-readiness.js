// File: /functions/api/admin/product-readiness.js
// Brief description: Admin-only readiness preview endpoint for product publish blockers,
// image-role coverage, public-use blockers, and SEO/data gaps before approve/publish clicks.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || "").trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function col(columnSet, columnName, alias = columnName, fallback = "NULL") {
  return columnSet.has(columnName) ? `p.${columnName}` : `${fallback} AS ${alias}`;
}

async function ensureReadinessSupportTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_seo (
    product_id INTEGER PRIMARY KEY,
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT,
    h1_override TEXT,
    canonical_url TEXT,
    schema_type TEXT DEFAULT 'Product',
    og_title TEXT,
    og_description TEXT,
    og_image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS product_images (
    product_image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);

  await db.prepare(`CREATE TABLE IF NOT EXISTS product_image_annotations (
    product_image_annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_image_id INTEGER,
    image_url TEXT,
    alt_text TEXT,
    image_role TEXT,
    public_use_status TEXT DEFAULT 'internal_review',
    width_px INTEGER,
    height_px INTEGER,
    image_orientation TEXT,
    merchandising_score INTEGER,
    first_image_score INTEGER,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}

function buildReadiness(row = {}) {
  const imageCount = Number(row.image_count || 0);
  const altCoverage = Number(row.alt_coverage_count || 0);
  const missingImageRoleCount = Number(row.missing_image_role_count || 0);
  const heroImageRoleCount = Number(row.hero_image_role_count || 0);
  const detailImageRoleCount = Number(row.detail_image_role_count || 0);
  const scaleImageRoleCount = Number(row.scale_image_role_count || 0);
  const blockedPublicUseCount = Number(row.blocked_public_use_count || 0);
  const firstOrientation = String(row.first_image_orientation || "").toLowerCase();
  const firstWidth = Number(row.first_width_px || 0);
  const firstHeight = Number(row.first_height_px || 0);
  const knowsLeadSize = firstWidth > 0 && firstHeight > 0;
  const firstScore = Number(row.first_merchandising_score || 0);
  const averageScore = Number(row.average_merchandising_score || 0);

  const checks = [
    ["Product name", normalizeText(row.name).length > 0, "Add a clear product name."],
    ["Slug", normalizeText(row.slug).length > 0, "Add a slug for the product page URL."],
    ["Price", Number(row.price_cents || 0) > 0, "Set a price greater than $0."],
    ["Featured image", normalizeText(row.featured_image_url).length > 0, "Choose a featured image."],
    ["Image count", imageCount >= 3, "Add at least 3 product images."],
    ["Alt text", imageCount > 0 && altCoverage >= Math.min(3, imageCount), "Add useful alt text to the first 3 images."],
    ["Short description", normalizeText(row.short_description).length >= 40, "Write a short description of at least 40 characters."],
    ["SEO title", normalizeText(row.meta_title).length >= 10, "Add an SEO title."],
    ["SEO meta description", normalizeText(row.meta_description).length >= 50, "Add an SEO meta description of at least 50 characters."],
    ["Category", normalizeText(row.product_category).length > 0, "Choose a product category."],
    ["Hero/front role", imageCount > 0 && heroImageRoleCount > 0, "Mark one image as Hero/front."],
    ["Detail image role", imageCount < 2 || detailImageRoleCount > 0, "Mark one image as Detail/texture when multiple images exist."],
    ["Scale/context role", imageCount < 3 || scaleImageRoleCount > 0, "Mark one image as Scale/context when three or more images exist."],
    ["Image roles", imageCount > 0 && missingImageRoleCount === 0, "Choose an image role for every image row."],
    ["Public-use clearance", blockedPublicUseCount === 0, "Clear or remove images marked Consent needed or Blocked."],
    ["Lead image shape", !knowsLeadSize || ["square", "landscape"].includes(firstOrientation), "Make the lead image square or landscape."],
    ["Lead image size", !knowsLeadSize || (firstWidth >= 800 && firstHeight >= 800), "Use a lead image at least 800×800; 1200×1200 is preferred."],
    ["Lead image score", !normalizeText(row.featured_image_url) || firstScore === 0 || firstScore >= 70, "Improve or override the lead image merchandising score."],
    ["Gallery score", imageCount === 0 || averageScore === 0 || averageScore >= 60, "Improve low-score gallery images or add notes explaining why to keep them."],
    ["Onsite URL fit", ["onsite", "hybrid", "external_only", ""].includes(String(row.sale_channel || "").toLowerCase()), "Review sale channel and external listing URL."],
  ];

  const blockers = checks.filter(([, ok]) => !ok).map(([label, , help]) => ({ label, help }));
  const score = Math.round(((checks.length - blockers.length) / checks.length) * 100);

  return {
    ready: blockers.length === 0,
    score,
    blockers,
    image: {
      image_count: imageCount,
      alt_coverage_count: altCoverage,
      missing_image_role_count: missingImageRoleCount,
      hero_image_role_count: heroImageRoleCount,
      detail_image_role_count: detailImageRoleCount,
      scale_image_role_count: scaleImageRoleCount,
      blocked_public_use_count: blockedPublicUseCount,
      first_width_px: firstWidth,
      first_height_px: firstHeight,
      first_image_orientation: firstOrientation || "unknown",
      first_merchandising_score: firstScore,
      average_merchandising_score: averageScore
    }
  };
}

function summarizeProducts(products) {
  const summary = {
    total_products: products.length,
    ready_products: 0,
    blocked_products: 0,
    missing_featured_image: 0,
    missing_required_roles: 0,
    missing_alt_text: 0,
    blocked_public_use: 0,
    missing_seo: 0,
    missing_price: 0,
    needs_three_images: 0,
    average_score: 0
  };

  for (const product of products) {
    const readiness = product.readiness || {};
    if (readiness.ready) summary.ready_products += 1;
    else summary.blocked_products += 1;
    const labels = new Set((readiness.blockers || []).map((row) => row.label));
    if (labels.has("Featured image")) summary.missing_featured_image += 1;
    if (labels.has("Hero/front role") || labels.has("Detail image role") || labels.has("Scale/context role") || labels.has("Image roles")) summary.missing_required_roles += 1;
    if (labels.has("Alt text")) summary.missing_alt_text += 1;
    if (labels.has("Public-use clearance")) summary.blocked_public_use += 1;
    if (labels.has("SEO title") || labels.has("SEO meta description")) summary.missing_seo += 1;
    if (labels.has("Price")) summary.missing_price += 1;
    if (labels.has("Image count")) summary.needs_three_images += 1;
    summary.average_score += Number(readiness.score || 0);
  }

  summary.average_score = products.length ? Math.round(summary.average_score / products.length) : 0;
  return summary;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is missing." }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

  await ensureReadinessSupportTables(db);

  const url = new URL(request.url);
  const productId = Number(url.searchParams.get("product_id") || 0);
  const limit = Math.max(1, Math.min(500, Number(url.searchParams.get("limit") || 160)));
  const showReady = String(url.searchParams.get("show_ready") || "0") === "1";

  const productCols = await getTableColumnSet(db, "products");
  const annotationCols = await getTableColumnSet(db, "product_image_annotations");
  const imageScoreExpr = annotationCols.has("merchandising_score") ? "pia.merchandising_score" : (annotationCols.has("first_image_score") ? "pia.first_image_score" : "NULL");

  const sql = `
    SELECT
      p.product_id,
      ${col(productCols, "name", "name", "''")},
      ${col(productCols, "slug", "slug", "''")},
      ${col(productCols, "sku", "sku", "''")},
      ${col(productCols, "status", "status", "''")},
      ${col(productCols, "review_status", "review_status", "''")},
      ${col(productCols, "price_cents", "price_cents", "0")},
      ${col(productCols, "short_description", "short_description", "''")},
      ${col(productCols, "featured_image_url", "featured_image_url", "''")},
      ${col(productCols, "product_category", "product_category", "''")},
      ${col(productCols, "sale_channel", "sale_channel", "''")},
      ps.meta_title,
      ps.meta_description,
      COUNT(DISTINCT pi.product_image_id) AS image_count,
      COUNT(DISTINCT CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,''))) >= 5 THEN pi.product_image_id ELSE NULL END) AS alt_coverage_count,
      MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has("image_orientation") ? "pia.image_orientation" : "NULL"} ELSE NULL END) AS first_image_orientation,
      MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has("width_px") ? "pia.width_px" : "NULL"} ELSE NULL END) AS first_width_px,
      MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has("height_px") ? "pia.height_px" : "NULL"} ELSE NULL END) AS first_height_px,
      MIN(CASE WHEN pi.sort_order = 0 THEN ${imageScoreExpr} ELSE NULL END) AS first_merchandising_score,
      AVG(COALESCE(${imageScoreExpr}, 0)) AS average_merchandising_score,
      SUM(CASE WHEN pi.product_image_id IS NOT NULL AND COALESCE(${annotationCols.has("image_role") ? "pia.image_role" : "''"}, '') = '' THEN 1 ELSE 0 END) AS missing_image_role_count,
      SUM(CASE WHEN LOWER(COALESCE(${annotationCols.has("image_role") ? "pia.image_role" : "''"}, '')) = 'hero_front' THEN 1 ELSE 0 END) AS hero_image_role_count,
      SUM(CASE WHEN LOWER(COALESCE(${annotationCols.has("image_role") ? "pia.image_role" : "''"}, '')) = 'detail_texture' THEN 1 ELSE 0 END) AS detail_image_role_count,
      SUM(CASE WHEN LOWER(COALESCE(${annotationCols.has("image_role") ? "pia.image_role" : "''"}, '')) = 'scale_context' THEN 1 ELSE 0 END) AS scale_image_role_count,
      SUM(CASE WHEN LOWER(COALESCE(${annotationCols.has("public_use_status") ? "pia.public_use_status" : "''"}, '')) IN ('consent_needed','blocked') THEN 1 ELSE 0 END) AS blocked_public_use_count
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    LEFT JOIN product_images pi ON pi.product_id = p.product_id
    LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
    ${productId > 0 ? "WHERE p.product_id = ?" : ""}
    GROUP BY p.product_id
    ORDER BY datetime(COALESCE(p.updated_at, p.created_at, '1970-01-01')) DESC, p.product_id DESC
    LIMIT ?`;

  const statement = db.prepare(sql);
  const result = productId > 0 ? await statement.bind(productId, limit).all() : await statement.bind(limit).all();
  const products = rows(result).map((row) => {
    const readiness = buildReadiness(row);
    return {
      product_id: Number(row.product_id || 0),
      name: normalizeText(row.name),
      slug: normalizeText(row.slug),
      sku: normalizeText(row.sku),
      status: normalizeText(row.status),
      review_status: normalizeText(row.review_status),
      price_cents: Number(row.price_cents || 0),
      featured_image_url: normalizeText(row.featured_image_url),
      readiness
    };
  });

  const filteredProducts = showReady ? products : products.filter((product) => !product.readiness.ready);

  return json({
    ok: true,
    products: filteredProducts,
    summary: summarizeProducts(products),
    generated_at: new Date().toISOString(),
    requested_by: { user_id: adminUser.user_id, email: adminUser.email }
  });
}
