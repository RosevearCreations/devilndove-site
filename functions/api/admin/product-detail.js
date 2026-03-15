// File: /functions/api/admin/product-detail.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
    SELECT
      users.user_id,
      users.email,
      users.display_name,
      users.role,
      users.is_active
    FROM sessions
    JOIN users ON sessions.user_id = users.user_id
    WHERE sessions.session_token = ?
      AND sessions.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token)
    .first();

  return sessionUser || null;
}

async function requireAdmin(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return { error: json({ ok: false, error: "Missing session token." }, 401) };
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return { error: json({ ok: false, error: "Invalid session." }, 401) };
  }

  if (!sessionUser.is_active) {
    return { error: json({ ok: false, error: "Account is inactive." }, 403) };
  }

  if (sessionUser.role !== "admin") {
    return { error: json({ ok: false, error: "Forbidden." }, 403) };
  }

  return { sessionUser };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  const url = new URL(request.url);
  const productId = Number(url.searchParams.get("product_id"));

  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  const product = await env.DB.prepare(`
    SELECT
      p.product_id,
      p.slug,
      p.sku,
      p.name,
      p.short_description,
      p.description,
      p.product_type,
      p.status,
      p.price_cents,
      p.compare_at_price_cents,
      p.currency,
      p.taxable,
      p.tax_class_id,
      p.requires_shipping,
      p.weight_grams,
      p.inventory_tracking,
      p.inventory_quantity,
      p.digital_file_url,
      p.featured_image_url,
      p.sort_order,
      p.created_at,
      p.updated_at,
      tc.code AS tax_class_code,
      tc.name AS tax_class_name,
      tc.tax_rate AS tax_class_rate
    FROM products p
    LEFT JOIN tax_classes tc
      ON p.tax_class_id = tc.tax_class_id
    WHERE p.product_id = ?
    LIMIT 1
  `)
    .bind(productId)
    .first();

  if (!product) {
    return json({ ok: false, error: "Product not found." }, 404);
  }

  const imagesResult = await env.DB.prepare(`
    SELECT
      product_image_id,
      product_id,
      image_url,
      alt_text,
      sort_order,
      created_at
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC, product_image_id ASC
  `)
    .bind(productId)
    .all();

  return json({
    ok: true,
    product,
    images: imagesResult.results || []
  });
}
