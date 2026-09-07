import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

const VERSION_KEYS = Object.freeze([
  "product_id",
  "updated_at",
  "name",
  "slug",
  "sku",
  "short_description",
  "description",
  "product_category",
  "color_name",
  "color_names_json",
  "shipping_code",
  "review_status",
  "product_type",
  "status",
  "price_cents",
  "compare_at_price_cents",
  "currency",
  "taxable",
  "tax_class_id",
  "requires_shipping",
  "weight_grams",
  "inventory_tracking",
  "inventory_quantity",
  "digital_file_url",
  "featured_image_url",
  "sort_order",
  "merchandise_origin",
  "sale_channel",
  "external_listing_url",
  "external_listing_label",
  "condition_summary",
  "era_label",
  "sourcing_notes",
]);

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function versionProjection(row = {}) {
  const output = {};
  VERSION_KEYS.forEach((key) => {
    const value = row?.[key];
    output[key] = value == null ? null : value;
  });
  return output;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const sessionUser = await getAdminUserFromRequest(request, env);
  if (!sessionUser) return json({ ok: false, error: "Unauthorized." }, 401);

  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const url = new URL(request.url);
  const productId = Number(url.searchParams.get("product_id") || 0);
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  try {
    // One primary-key Product read only. Build 67 intentionally avoids joins, counts,
    // PRAGMA scans, media reads, pricing reads, and any write-side behavior.
    const product = await db
      .prepare("SELECT * FROM products WHERE product_id = ? LIMIT 1")
      .bind(productId)
      .first();

    if (!product) return json({ ok: false, error: "Product not found." }, 404);

    return json({
      ok: true,
      product: versionProjection(product),
      diagnostics: {
        mode: "stale_copy_preflight",
        product_rows_read: 1,
        secondary_service_reads: 0,
        writes: 0,
      },
    });
  } catch (error) {
    return json({
      ok: false,
      error: error?.message || "Could not verify the current Product version.",
    }, 500);
  }
}