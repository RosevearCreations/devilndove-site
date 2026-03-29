import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

// File: /functions/api/admin/delete-product.js

function json(data, status = 200) { return jsonResponse(data, status); }

async function requireAdmin(request, env) {
  const sessionUser = await getAdminUserFromRequest(request, env);
  if (!sessionUser) return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  return { sessionUser };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const product_id = Number(body.product_id);

  if (!Number.isInteger(product_id) || product_id <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  const existingProduct = await db.prepare(`
    SELECT
      product_id,
      slug,
      sku,
      name,
      product_type,
      status,
      price_cents,
      currency
    FROM products
    WHERE product_id = ?
    LIMIT 1
  `)
    .bind(product_id)
    .first();

  if (!existingProduct) {
    return json({ ok: false, error: "Product not found." }, 404);
  }

  const db = getDb(env);

  const orderUseResult = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM order_items
    WHERE product_id = ?
  `)
    .bind(product_id)
    .first();

  const orderUseCount = Number(orderUseResult?.count || 0);

  if (orderUseCount > 0) {
    return json({
      ok: false,
      error: "This product is already used in an order and cannot be deleted. Archive it instead."
    }, 400);
  }

  await db.prepare(`
    DELETE FROM product_images
    WHERE product_id = ?
  `)
    .bind(product_id)
    .run();

  await db.prepare(`
    DELETE FROM product_tags
    WHERE product_id = ?
  `)
    .bind(product_id)
    .run();

  await db.prepare(`
    DELETE FROM products
    WHERE product_id = ?
  `)
    .bind(product_id)
    .run();

  await auditAdminAction(env, request, authCheck.sessionUser, {
    action_type: "product_delete",
    target_type: "product",
    target_id: Number(existingProduct?.product_id || product_id),
    target_key: existingProduct?.slug || existingProduct?.sku || String(product_id),
    details: existingProduct
  });

  return json({
    ok: true,
    message: "Product deleted successfully.",
    product: existingProduct
  });
}
