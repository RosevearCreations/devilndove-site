// File: /functions/api/admin/products.js
// Brief description: Returns admin product records with SEO and inventory support using normalized admin auth.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_active
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
    display_name: session.display_name || '',
    role: 'admin'
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}


export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const clauses = ['1=1'];
  const bindings = [];
  if (q) {
    clauses.push(`(
      LOWER(COALESCE(p.name, '')) LIKE ? OR LOWER(COALESCE(p.slug, '')) LIKE ? OR
      LOWER(COALESCE(p.sku, '')) LIKE ? OR LOWER(COALESCE(ps.keywords, '')) LIKE ?
    )`);
    const like = `%${q}%`;
    bindings.push(like, like, like, like);
  }
  const sql = `
    SELECT p.*, tc.code AS tax_class_code, tc.name AS tax_class_name, tc.tax_rate AS tax_rate,
           ps.meta_title, ps.meta_description, ps.keywords, ps.h1_override,
           COUNT(pi.product_image_id) AS image_count, CASE WHEN COALESCE(p.inventory_tracking,0)=1 AND COALESCE(p.inventory_quantity,0) <= 2 THEN 1 ELSE 0 END AS low_stock_flag
    FROM products p
    LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    LEFT JOIN product_images pi ON pi.product_id = p.product_id
    WHERE ${clauses.join(' AND ')}
    GROUP BY p.product_id
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;
  const result = bindings.length ? await env.DB.prepare(sql).bind(...bindings).all() : await env.DB.prepare(sql).all();
  const products = (result.results || []).map((row) => ({ ...row, low_stock_flag: Number(row.low_stock_flag || 0) })); return json({ ok: true, requested_by: adminUser, products, summary: { total_products: products.length, low_stock_products: products.filter((row) => Number(row.low_stock_flag || 0) === 1).length } });
}
