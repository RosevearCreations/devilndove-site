// File: /functions/api/admin/product-detail.js
// Brief description: Returns one product plus image rows for the admin editor using the
// normalized admin bearer-session pattern, keeping product edit flow consistent with newer auth.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(`
    SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();

  if (!session) return null;
  if (Number(session.is_active || 0) !== 1) return null;
  if (String(session.role || '').toLowerCase() !== 'admin') return null;

  return {
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || '',
    display_name: session.display_name || ''
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id'));
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: 'A valid product_id is required.' }, 400);
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
    LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id
    WHERE p.product_id = ?
    LIMIT 1
  `).bind(productId).first();

  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

  const imagesResult = await env.DB.prepare(`
    SELECT product_image_id, product_id, image_url, alt_text, sort_order, created_at
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC, product_image_id ASC
  `).bind(productId).all();

  return json({
    ok: true,
    requested_by: adminUser,
    product,
    images: normalizeResults(imagesResult)
  });
}
