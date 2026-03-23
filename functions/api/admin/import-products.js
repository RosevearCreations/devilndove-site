// File: /functions/api/admin/import-products.js
// Brief description: Imports validated product rows in bulk so finished products can be seeded faster.

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


function normalizeSlug(value) {
  return String(value || '')
    .trim().toLowerCase().replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) return json({ ok: false, error: 'rows are required.' }, 400);

  let inserted = 0;
  const errors = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};
    const name = normalizeText(row.name);
    const slug = normalizeSlug(row.slug || row.name);
    const product_type = normalizeText(row.product_type || 'physical').toLowerCase();
    const status = ['draft','active','archived'].includes(normalizeText(row.status).toLowerCase()) ? normalizeText(row.status).toLowerCase() : 'draft';
    const price_cents = Number.isInteger(Number(row.price_cents)) ? Number(row.price_cents) : null;
    if (!name || !slug || !['physical','digital'].includes(product_type) || price_cents == null || price_cents < 0) {
      errors.push({ row_number: i + 1, error: 'Missing required name/slug/product_type/price_cents.' });
      continue;
    }
    try {
      await env.DB.prepare(`
        INSERT INTO products (
          slug, sku, name, short_description, description, product_type, status, price_cents,
          compare_at_price_cents, currency, taxable, tax_class_id, requires_shipping, weight_grams,
          inventory_tracking, inventory_quantity, digital_file_url, featured_image_url, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        slug,
        normalizeText(row.sku) || null,
        name,
        normalizeText(row.short_description) || null,
        normalizeText(row.description) || null,
        product_type,
        status,
        price_cents,
        Number.isInteger(Number(row.compare_at_price_cents)) ? Number(row.compare_at_price_cents) : null,
        normalizeText(row.currency || 'CAD').toUpperCase() || 'CAD',
        Number(row.taxable) === 0 ? 0 : 1,
        Number.isInteger(Number(row.tax_class_id)) ? Number(row.tax_class_id) : null,
        Number(row.requires_shipping) === 1 ? 1 : 0,
        Number.isInteger(Number(row.weight_grams)) ? Number(row.weight_grams) : null,
        Number(row.inventory_tracking) === 1 ? 1 : 0,
        Number.isInteger(Number(row.inventory_quantity)) ? Number(row.inventory_quantity) : 0,
        normalizeText(row.digital_file_url) || null,
        normalizeText(row.featured_image_url) || null,
        Number.isInteger(Number(row.sort_order)) ? Number(row.sort_order) : 0
      ).run();
      inserted += 1;
    } catch (error) {
      errors.push({ row_number: i + 1, error: error.message || 'Insert failed.' });
    }
  }
  return json({ ok: true, inserted_count: inserted, error_count: errors.length, errors });
}
