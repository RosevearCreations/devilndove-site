import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status, { "Cache-Control": "no-store" });
}

function mapSeoRow(row) {
  if (!row) return null;
  return {
    product_id: Number(row.product_id || 0),
    meta_title: row.meta_title || "",
    meta_description: row.meta_description || "",
    keywords: row.keywords || "",
    h1_override: row.h1_override || "",
    canonical_url: row.canonical_url || "",
    schema_type: row.schema_type || "Product",
    og_title: row.og_title || "",
    og_description: row.og_description || "",
    og_image_url: row.og_image_url || "",
    updated_at: row.updated_at || null,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const productId = Number(new URL(request.url).searchParams.get("product_id") || 0);
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  const row = await db.prepare(`
    SELECT
      ps.product_id,
      ps.meta_title,
      ps.meta_description,
      ps.keywords,
      ps.h1_override,
      ps.canonical_url,
      ps.schema_type,
      ps.og_title,
      ps.og_description,
      ps.og_image_url,
      ps.updated_at
    FROM product_seo ps
    WHERE ps.product_id = ?
    LIMIT 1
  `).bind(productId).first();

  return json({ ok: true, seo: mapSeoRow(row) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

  const db = getDb(env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const productId = Number(body.product_id || 0);
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  const product = await db.prepare(`SELECT product_id, slug, name FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
  if (!product) return json({ ok: false, error: "Product not found." }, 404);

  const payload = {
    meta_title: normalizeText(body.meta_title) || null,
    meta_description: normalizeText(body.meta_description) || null,
    keywords: normalizeText(body.keywords) || null,
    h1_override: normalizeText(body.h1_override) || null,
    canonical_url: normalizeText(body.canonical_url) || null,
    schema_type: normalizeText(body.schema_type) || "Product",
    og_title: normalizeText(body.og_title) || null,
    og_description: normalizeText(body.og_description) || null,
    og_image_url: normalizeText(body.og_image_url) || null,
  };

  try {
    await db.prepare(`
      INSERT INTO product_seo (
        product_id, meta_title, meta_description, keywords, h1_override, canonical_url,
        schema_type, og_title, og_description, og_image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
    `).bind(
      productId,
      payload.meta_title,
      payload.meta_description,
      payload.keywords,
      payload.h1_override,
      payload.canonical_url,
      payload.schema_type,
      payload.og_title,
      payload.og_description,
      payload.og_image_url
    ).run();
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: "admin_product_seo",
      incident_code: "product_seo_save_failed",
      severity: "warning",
      message: "Product SEO save failed during write.",
      related_user_id: Number(adminUser.user_id || 0),
      details: {
        product_id: productId,
        error: String(error?.message || error || "Unknown product SEO save error"),
      },
    });
    return json({ ok: false, error: "Failed to save product SEO right now." }, 500);
  }

  const saved = await db.prepare(`
    SELECT
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
      updated_at
    FROM product_seo
    WHERE product_id = ?
    LIMIT 1
  `).bind(productId).first();

  await auditAdminAction(env, request, adminUser, {
    action_type: "product_seo_save",
    target_type: "product",
    target_id: productId,
    target_key: normalizeText(product.slug),
    details: {
      product_name: normalizeText(product.name),
      meta_title_length: normalizeText(payload.meta_title).length,
      meta_description_length: normalizeText(payload.meta_description).length,
      canonical_url: payload.canonical_url,
      has_og_image: payload.og_image_url ? 1 : 0,
    },
  });

  return json({ ok: true, message: "Product SEO saved.", seo: mapSeoRow(saved) });
}
