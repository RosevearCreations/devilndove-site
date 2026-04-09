import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function moneyCents(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Unauthorized." }, 401);

  const url = new URL(context.request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status') || 'draft').toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)));

  const bindings = [];
  const where = [];
  if (status) {
    where.push(`LOWER(COALESCE(p.status,'draft')) = ?`);
    bindings.push(status);
  }
  if (q) {
    where.push(`(
      LOWER(COALESCE(p.name,'')) LIKE ? OR
      LOWER(COALESCE(p.capture_reference,'')) LIKE ? OR
      LOWER(COALESCE(p.slug,'')) LIKE ? OR
      LOWER(COALESCE(p.sku,'')) LIKE ? OR
      CAST(COALESCE(p.product_number,0) AS TEXT) LIKE ?
    )`);
    const like = `%${q}%`;
    bindings.push(like, like, like, like, like);
  }
  bindings.push(limit);

  const rows = normalizeResults(await db.prepare(`
    SELECT
      p.product_id,
      p.product_number,
      p.slug,
      p.sku,
      p.name,
      p.capture_reference,
      p.product_category,
      p.color_name,
      p.shipping_code,
      p.price_cents,
      p.compare_at_price_cents,
      p.currency,
      p.short_description,
      p.description,
      p.featured_image_url,
      p.inventory_quantity,
      p.review_status,
      p.status,
      p.tax_class_id,
      p.weight_grams,
      p.updated_at,
      COUNT(DISTINCT pi.product_image_id) AS image_count,
      COUNT(DISTINCT prl.product_resource_link_id) AS linked_resource_count
    FROM products p
    LEFT JOIN product_images pi ON pi.product_id = p.product_id
    LEFT JOIN product_resource_links prl ON prl.product_id = p.product_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY p.product_id
    ORDER BY COALESCE(p.updated_at, p.created_at) DESC, p.product_id DESC
    LIMIT ?
  `).bind(...bindings).all().catch(() => ({ results: [] })));

  let imageMap = new Map();
  let resourceMap = new Map();
  if (rows.length) {
    const ids = rows.map((row) => Number(row.product_id || 0)).filter(Boolean);
    const placeholders = ids.map(() => '?').join(',');
    const imageRows = normalizeResults(await db.prepare(`
      SELECT product_id, image_url, alt_text, sort_order
      FROM product_images
      WHERE product_id IN (${placeholders})
      ORDER BY product_id ASC, sort_order ASC, product_image_id ASC
    `).bind(...ids).all().catch(() => ({ results: [] })));
    imageRows.forEach((row) => {
      const list = imageMap.get(Number(row.product_id || 0)) || [];
      list.push({ image_url: row.image_url || '', alt_text: row.alt_text || '', sort_order: Number(row.sort_order || 0) });
      imageMap.set(Number(row.product_id || 0), list);
    });

    const resourceRows = normalizeResults(await db.prepare(`
      SELECT product_id, resource_kind, source_key, quantity_used, usage_notes, sort_order
      FROM product_resource_links
      WHERE product_id IN (${placeholders})
      ORDER BY product_id ASC, sort_order ASC, product_resource_link_id ASC
    `).bind(...ids).all().catch(() => ({ results: [] })));
    resourceRows.forEach((row) => {
      const list = resourceMap.get(Number(row.product_id || 0)) || [];
      list.push({
        resource_kind: row.resource_kind || '',
        source_key: row.source_key || '',
        quantity_used: Number(row.quantity_used || 1),
        usage_notes: row.usage_notes || '',
        sort_order: Number(row.sort_order || 0)
      });
      resourceMap.set(Number(row.product_id || 0), list);
    });
  }

  return jsonResponse({
    ok: true,
    drafts: rows.map((row) => ({
      product_id: Number(row.product_id || 0),
      product_number: Number(row.product_number || 0),
      slug: row.slug || '',
      sku: row.sku || '',
      name: row.name || '',
      capture_reference: row.capture_reference || '',
      product_category: row.product_category || '',
      color_name: row.color_name || '',
      shipping_code: row.shipping_code || '',
      price_cents: moneyCents(row.price_cents),
      compare_at_price_cents: moneyCents(row.compare_at_price_cents),
      currency: row.currency || 'CAD',
      short_description: row.short_description || '',
      description: row.description || '',
      featured_image_url: row.featured_image_url || '',
      inventory_quantity: Number(row.inventory_quantity || 0),
      review_status: row.review_status || '',
      status: row.status || 'draft',
      tax_class_id: Number(row.tax_class_id || 0) || '',
      weight_grams: Number(row.weight_grams || 0) || '',
      updated_at: row.updated_at || null,
      image_count: Number(row.image_count || 0),
      linked_resource_count: Number(row.linked_resource_count || 0),
      images: imageMap.get(Number(row.product_id || 0)) || [],
      resource_links: resourceMap.get(Number(row.product_id || 0)) || []
    }))
  });
}
