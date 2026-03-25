// File: /functions/api/admin/import-products-preview.js
// Brief description: Previews bulk product import rows for admin workflow cleanup. It accepts
// CSV or JSON row data, normalizes important fields, and reports validation problems so admins
// can clean data before a full import/insert step is run.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
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

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) {
    return json({ ok: false, error: 'rows must contain at least one product row.' }, 400);
  }

  const previewSlugs = new Map();
  rows.forEach((row) => {
    const previewSlug = normalizeText(row?.slug) || slugify(normalizeText(row?.name));
    if (!previewSlug) return;
    previewSlugs.set(previewSlug, (previewSlugs.get(previewSlug) || 0) + 1);
  });

  const slugCandidates = Array.from(previewSlugs.keys()).slice(0, 200);
  const existingSlugMap = new Map();
  if (slugCandidates.length) {
    const placeholders = slugCandidates.map(() => '?').join(',');
    const existingRows = await env.DB.prepare(`SELECT slug FROM products WHERE slug IN (${placeholders})`).bind(...slugCandidates).all().catch(() => ({ results: [] }));
    for (const existingRow of Array.isArray(existingRows?.results) ? existingRows.results : []) {
      existingSlugMap.set(String(existingRow.slug || '').trim(), true);
    }
  }

  const preview = rows.map((row, index) => {
    const name = normalizeText(row?.name);
    const slug = normalizeText(row?.slug) || slugify(name);
    const sku = normalizeText(row?.sku);
    const product_type = ['physical', 'digital'].includes(normalizeText(row?.product_type).toLowerCase())
      ? normalizeText(row?.product_type).toLowerCase()
      : '';
    const status = ['draft', 'active', 'archived'].includes(normalizeText(row?.status).toLowerCase())
      ? normalizeText(row?.status).toLowerCase()
      : 'draft';
    const price = Number(row?.price_cents);
    const issues = [];

    if (!name) issues.push('Missing name.');
    if (!slug) issues.push('Missing slug.');
    if (!product_type) issues.push('product_type must be physical or digital.');
    if (!Number.isInteger(price) || price < 0) issues.push('price_cents must be a whole number.');
    if (slug && (previewSlugs.get(slug) || 0) > 1) issues.push('Slug is duplicated in this import batch.');
    if (slug && existingSlugMap.has(slug)) issues.push('Slug already exists in the database.');
    if (normalizeText(row?.featured_image_url) && !/^https?:\/\//i.test(normalizeText(row?.featured_image_url))) issues.push('featured_image_url must start with http or https when provided.');
    if (row?.inventory_tracking != null && ![0,1,'0','1',true,false].includes(row.inventory_tracking)) issues.push('inventory_tracking should be 0 or 1.');

    return {
      row_number: index + 1,
      normalized: {
        name,
        slug,
        sku,
        product_type: product_type || null,
        status,
        price_cents: Number.isInteger(price) && price >= 0 ? price : null,
        currency: normalizeText(row?.currency || 'CAD').toUpperCase() || 'CAD'
      },
      issues,
      valid: issues.length === 0
    };
  });

  return json({
    ok: true,
    preview,
    summary: {
      total_rows: preview.length,
      valid_rows: preview.filter((row) => row.valid).length,
      invalid_rows: preview.filter((row) => !row.valid).length
    },
    requested_by: adminUser
  });
}
