import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const like = `%${q}%`;

  const rows = normalizeResults(await db.prepare(`
    SELECT
      p.product_id,
      p.slug,
      p.name,
      p.status,
      p.review_status,
      p.currency,
      COALESCE(p.price_cents, 0) AS price_cents,
      COUNT(prl.product_resource_link_id) AS linked_resource_count,
      COALESCE(SUM(COALESCE(prl.quantity_used, 0) * COALESCE(sii.unit_cost_cents, 0)), 0) AS linked_resource_cost_cents,
      SUM(CASE WHEN prl.resource_kind = 'supply' THEN COALESCE(prl.quantity_used, 0) * COALESCE(sii.unit_cost_cents, 0) ELSE 0 END) AS supply_cost_cents,
      SUM(CASE WHEN prl.resource_kind = 'tool' THEN COALESCE(prl.quantity_used, 0) * COALESCE(sii.unit_cost_cents, 0) ELSE 0 END) AS tool_usage_cost_cents,
      SUM(CASE WHEN sii.site_item_inventory_id IS NULL THEN 1 ELSE 0 END) AS missing_cost_links,
      GROUP_CONCAT(DISTINCT CASE WHEN sii.site_item_inventory_id IS NULL THEN prl.resource_kind || ':' || prl.source_key ELSE NULL END) AS missing_resources
    FROM products p
    LEFT JOIN product_resource_links prl ON prl.product_id = p.product_id
    LEFT JOIN site_item_inventory sii ON sii.source_type = prl.resource_kind AND sii.external_key = prl.source_key
    WHERE (? = 0 OR p.product_id = ?)
      AND (? = '' OR LOWER(COALESCE(p.name,'')) LIKE ? OR LOWER(COALESCE(p.slug,'')) LIKE ? OR LOWER(COALESCE(p.product_category,'')) LIKE ?)
    GROUP BY p.product_id
    ORDER BY p.sort_order ASC, p.created_at DESC, p.product_id DESC
  `).bind(productId, productId, q, like, like, like).all().catch(() => ({ results: [] })));

  const items = rows.map((row) => {
    const price = Number(row.price_cents || 0);
    const cost = Number(row.linked_resource_cost_cents || 0);
    const margin = price - cost;
    return {
      product_id: Number(row.product_id || 0),
      slug: row.slug || '',
      name: row.name || '',
      status: row.status || 'draft',
      review_status: row.review_status || 'pending_review',
      currency: row.currency || 'CAD',
      price_cents: price,
      linked_resource_count: Number(row.linked_resource_count || 0),
      linked_resource_cost_cents: cost,
      supply_cost_cents: Number(row.supply_cost_cents || 0),
      tool_usage_cost_cents: Number(row.tool_usage_cost_cents || 0),
      gross_margin_cents: margin,
      gross_margin_ratio: price > 0 ? Number((margin / price).toFixed(4)) : 0,
      missing_cost_links: Number(row.missing_cost_links || 0),
      missing_resources: row.missing_resources || ''
    };
  });

  return json({
    ok: true,
    requested_by: adminUser,
    items,
    summary: {
      total_products: items.length,
      products_with_costs: items.filter((row) => row.linked_resource_count > 0).length,
      products_missing_cost_links: items.filter((row) => row.missing_cost_links > 0).length,
      average_margin_ratio: items.length ? Number((items.reduce((sum, row) => sum + Number(row.gross_margin_ratio || 0), 0) / items.length).toFixed(4)) : 0
    }
  });
}
