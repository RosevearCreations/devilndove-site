import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }

function buildReadiness(row = {}) {
  const checks = {
    has_name: normalizeText(row.name).length > 0,
    has_slug: normalizeText(row.slug).length > 0,
    has_price: Number(row.price_cents || 0) > 0,
    has_featured_image: normalizeText(row.featured_image_url).length > 0,
    has_short_description: normalizeText(row.short_description).length >= 40,
    has_meta_title: normalizeText(row.meta_title).length >= 10,
    has_meta_description: normalizeText(row.meta_description).length >= 50,
    has_category: normalizeText(row.product_category).length > 0
  };
  const failedKeys = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  return {
    is_ready_for_storefront: failedKeys.length === 0 ? 1 : 0,
    ready_check_notes: failedKeys.join(', '),
    readiness_checks: checks
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
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
           COUNT(DISTINCT pi.product_image_id) AS image_count,
           COUNT(DISTINCT prl.product_resource_link_id) AS linked_resource_count,
           COALESCE(SUM(COALESCE(prl.quantity_used, 0) * COALESCE(sii.unit_cost_cents, 0)), 0) AS linked_resource_cost_cents,
           SUM(CASE WHEN sii.site_item_inventory_id IS NULL THEN 1 ELSE 0 END) AS missing_cost_links,
           CASE WHEN COALESCE(p.inventory_tracking,0)=1 AND COALESCE(p.inventory_quantity,0) <= 2 THEN 1 ELSE 0 END AS low_stock_flag
    FROM products p
    LEFT JOIN tax_classes tc ON p.tax_class_id = tc.tax_class_id
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    LEFT JOIN product_images pi ON pi.product_id = p.product_id
    LEFT JOIN product_resource_links prl ON prl.product_id = p.product_id
    LEFT JOIN site_item_inventory sii ON sii.source_type = prl.resource_kind AND sii.external_key = prl.source_key
    WHERE ${clauses.join(' AND ')}
    GROUP BY p.product_id
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `;
  const result = bindings.length ? await db.prepare(sql).bind(...bindings).all() : await db.prepare(sql).all();
  const rawProducts = Array.isArray(result?.results) ? result.results : [];
  const products = rawProducts.map((row) => {
    const linkedResourceCost = Number(row.linked_resource_cost_cents || 0);
    const priceCents = Number(row.price_cents || 0);
    return {
      ...row,
      low_stock_flag: Number(row.low_stock_flag || 0),
      linked_resource_count: Number(row.linked_resource_count || 0),
      linked_resource_cost_cents: linkedResourceCost,
      gross_margin_cents: priceCents - linkedResourceCost,
      gross_margin_ratio: priceCents > 0 ? Number(((priceCents - linkedResourceCost) / priceCents).toFixed(4)) : 0,
      missing_cost_links: Number(row.missing_cost_links || 0),
      ...buildReadiness(row)
    };
  });
  return json({
    ok: true,
    requested_by: adminUser,
    products,
    summary: {
      total_products: products.length,
      low_stock_products: products.filter((row) => Number(row.low_stock_flag || 0) === 1).length,
      ready_for_storefront_products: products.filter((row) => Number(row.is_ready_for_storefront || 0) === 1).length,
      pending_review_products: products.filter((row) => String(row.review_status || '').toLowerCase() === 'pending_review').length,
      products_with_cost_rollups: products.filter((row) => Number(row.linked_resource_count || 0) > 0).length,
      products_missing_cost_links: products.filter((row) => Number(row.missing_cost_links || 0) > 0).length
    }
  });
}
