// Returns the compact product, SEO and editor-image payload used by admin workspaces.
// Build 231: removes repeated database introspection from this Free-plan hot path.

import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import { normalizeTaxRateFraction, taxRatePercent } from "./_tax-rate.js";

function json(data, status = 200) {
  return jsonResponse(data, status, { "Cache-Control": "no-store" });
}

function text(value) { return String(value || "").trim(); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }

function parseColorNames(value, fallback = "") {
  let input = [];
  if (typeof value === "string" && value.trim()) {
    try { input = JSON.parse(value); }
    catch { input = value.split(/[\r\n,|/]+/g); }
  }
  if (!Array.isArray(input)) input = [];
  const output = [];
  [fallback, ...input].forEach((entry) => {
    const clean = text(entry);
    if (clean && !output.some((item) => item.toLowerCase() === clean.toLowerCase())) output.push(clean);
  });
  return output.slice(0, 12);
}

function imageKey(value) {
  return text(value).toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "");
}

function normalizeImages(galleryRows, mediaRows) {
  const output = [];
  const seen = new Set();
  const add = (row, source, index) => {
    const imageUrl = text(row?.image_url || row?.public_url);
    const key = imageKey(imageUrl);
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push({
      product_image_id: Number(row?.product_image_id || 0) || null,
      media_asset_id: Number(row?.media_asset_id || 0) || null,
      product_id: Number(row?.product_id || 0) || null,
      image_url: imageUrl,
      alt_text: text(row?.alt_text || row?.original_filename || row?.annotation_notes),
      sort_order: Number(row?.sort_order ?? row?.display_order ?? index),
      created_at: row?.created_at || null,
      variant_role: row?.variant_role || null,
      image_source: source
    });
  };
  galleryRows.slice(0, 14).forEach((row, index) => add(row, "product_images", index));
  mediaRows.filter((row) => !row?.deleted_at).slice(0, 14).forEach((row, index) => add(row, "media_assets", index + 20));
  return output.sort((a, b) => {
    const sourceOrder = (value) => value === "product_images" ? 0 : 1;
    return sourceOrder(a.image_source) - sourceOrder(b.image_source) || a.sort_order - b.sort_order;
  }).slice(0, 7);
}

function sourceLabel(source) {
  if (source === "product_record") return "Product featured-image field";
  if (source === "product_images") return "Product image gallery";
  if (source === "media_assets") return "Media library asset";
  return "No image source";
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

  try {
    // products and tax_classes are core schema. Optional/editor layers are queried
    // independently below so an older optional table never takes this route down.
    const product = await db.prepare(`
      SELECT p.*, tc.code AS tax_class_code, tc.name AS tax_class_name,
             tc.tax_rate AS tax_rate_raw
      FROM products p
      LEFT JOIN tax_classes tc ON tc.tax_class_id = p.tax_class_id
      WHERE p.product_id = ?
      LIMIT 1
    `).bind(productId).first();
    if (!product) return json({ ok: false, error: "Product not found." }, 404);

    const [seo, galleryResult, mediaResult] = await Promise.all([
      db.prepare("SELECT * FROM product_seo WHERE product_id = ? LIMIT 1").bind(productId).first().catch(() => null),
      db.prepare("SELECT * FROM product_images WHERE product_id = ? LIMIT 20").bind(productId).all().catch(() => ({ results: [] })),
      db.prepare("SELECT * FROM media_assets WHERE product_id = ? LIMIT 20").bind(productId).all().catch(() => ({ results: [] }))
    ]);

    if (seo) {
      for (const key of ["meta_title", "meta_description", "keywords", "h1_override", "canonical_url", "schema_type", "og_title", "og_description", "og_image_url"]) {
        product[key] = seo[key] ?? null;
      }
    }
    product.tax_rate = normalizeTaxRateFraction(product.tax_rate_raw);
    product.rate_percent = taxRatePercent(product.tax_rate);
    product.color_names = parseColorNames(product.color_names_json, product.color_name);
    product.color_names_text = product.color_names.join(", ");

    const galleryRows = rows(galleryResult);
    const usableMediaRows = rows(mediaResult).filter((row) => text(row?.public_url) && !row?.deleted_at);
    const images = normalizeImages(galleryRows, usableMediaRows);
    const storedFeatured = text(product.featured_image_url);
    const galleryFeatured = images.find((row) => row.image_source === "product_images")?.image_url || "";
    const mediaFeatured = images.find((row) => row.image_source === "media_assets")?.image_url || "";
    const resolvedFeatured = storedFeatured || galleryFeatured || mediaFeatured;
    const featuredSource = storedFeatured ? "product_record" : galleryFeatured ? "product_images" : mediaFeatured ? "media_assets" : "";

    product.featured_image_stored_url = storedFeatured || null;
    product.featured_image_url = resolvedFeatured;
    product.featured_image_source = featuredSource || null;
    product.featured_image_source_label = sourceLabel(featuredSource);
    product.featured_image_needs_sync = !storedFeatured && Boolean(resolvedFeatured) ? 1 : 0;
    product.media_asset_count = usableMediaRows.length;
    product.product_image_count = galleryRows.length;

    return json({
      ok: true,
      product,
      images,
      media_assets: images.filter((row) => row.image_source === "media_assets"),
      image_annotations: [],
      response_profile: "editor_compact_v1"
    });
  } catch (error) {
    return json({ ok: false, error: error?.message || "Could not load this product safely." }, 500);
  }
}
