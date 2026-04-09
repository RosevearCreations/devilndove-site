import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function monthRange(monthValue) {
  const raw = String(monthValue || '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4,'0')}-${String(nextMonth).padStart(2,'0')}-01`;
  return { raw, start, end };
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch { return false; }
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function c(v) { return Number(v || 0); }

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);

  const url = new URL(context.request.url);
  const range = monthRange(url.searchParams.get('month') || new Date().toISOString().slice(0,7));
  if (!range) return jsonResponse({ ok:false, error:'Please provide month in YYYY-MM format.' }, 400);

  const hasProducts = await tableExists(db, 'products');
  if (!hasProducts) return jsonResponse({ ok:true, period: range.raw, items: [], summary: { active_product_count: 0, total_allocated_overhead_cents: 0, average_allocated_overhead_cents: 0, average_full_unit_cost_cents: 0 } });

  const hasProductCosts = await tableExists(db, 'product_costs');
  const hasResourceLinks = await tableExists(db, 'product_resource_links');
  const hasInventory = await tableExists(db, 'site_item_inventory');
  const hasOverhead = await tableExists(db, 'accounting_overhead_allocations');

  const rows = normalizeResults(await db.prepare(`
    SELECT
      p.product_id,
      p.product_number,
      p.name,
      p.slug,
      p.status,
      p.review_status,
      p.currency,
      COALESCE(p.price_cents,0) AS price_cents,
      COALESCE(pc.cost_per_unit_cents,0) AS direct_unit_cost_cents,
      COALESCE(resource_rollup.linked_resource_cost_cents,0) AS linked_resource_cost_cents,
      COALESCE(resource_rollup.linked_resource_count,0) AS linked_resource_count,
      COALESCE(resource_rollup.missing_cost_links,0) AS missing_cost_links
    FROM products p
    LEFT JOIN (
      SELECT pc1.product_id, pc1.cost_per_unit_cents
      FROM product_costs pc1
      INNER JOIN (
        SELECT product_id, MAX(COALESCE(effective_date, created_at, CURRENT_TIMESTAMP)) AS max_effective
        FROM product_costs
        GROUP BY product_id
      ) latest ON latest.product_id = pc1.product_id AND COALESCE(pc1.effective_date, pc1.created_at, CURRENT_TIMESTAMP) = latest.max_effective
    ) pc ON pc.product_id = p.product_id
    LEFT JOIN (
      SELECT
        prl.product_id,
        COUNT(*) AS linked_resource_count,
        SUM(CASE WHEN sii.site_item_inventory_id IS NOT NULL THEN COALESCE(prl.quantity_used,0) * COALESCE(sii.unit_cost_cents,0) ELSE 0 END) AS linked_resource_cost_cents,
        SUM(CASE WHEN sii.site_item_inventory_id IS NULL THEN 1 ELSE 0 END) AS missing_cost_links
      FROM product_resource_links prl
      LEFT JOIN site_item_inventory sii ON sii.source_type = prl.resource_kind AND sii.external_key = prl.source_key
      GROUP BY prl.product_id
    ) resource_rollup ON resource_rollup.product_id = p.product_id
    ORDER BY CASE WHEN LOWER(COALESCE(p.status,'draft'))='active' THEN 0 ELSE 1 END, LOWER(COALESCE(p.name,'')) ASC
  `).all().catch(() => ({ results: [] })));

  const overheadRow = hasOverhead ? await db.prepare(`
    SELECT COALESCE(SUM(COALESCE(amount_cents,0)),0) AS total_overhead_cents
    FROM accounting_overhead_allocations
    WHERE period_month = ?
  `).bind(range.raw).first().catch(() => ({ total_overhead_cents: 0 })) : { total_overhead_cents: 0 };

  const totalOverhead = c(overheadRow?.total_overhead_cents);
  const activeRows = rows.filter((row) => String(row.status || '').toLowerCase() === 'active');
  const allocationBaseRows = activeRows.length ? activeRows : rows;
  const revenueWeightTotal = allocationBaseRows.reduce((sum, row) => sum + Math.max(1, c(row.price_cents)), 0);

  const items = rows.map((row) => {
    const direct = hasProductCosts ? c(row.direct_unit_cost_cents) : 0;
    const resource = hasResourceLinks && hasInventory ? c(row.linked_resource_cost_cents) : 0;
    const baseUnitCost = Math.max(direct, resource, direct + resource ? 0 : 0);
    const usesRowForAllocation = allocationBaseRows.some((entry) => Number(entry.product_id || 0) === Number(row.product_id || 0));
    const weight = usesRowForAllocation ? Math.max(1, c(row.price_cents)) : 0;
    const allocatedOverhead = revenueWeightTotal > 0 ? Math.round(totalOverhead * (weight / revenueWeightTotal)) : 0;
    const fullUnitCost = baseUnitCost + allocatedOverhead;
    return {
      product_id: Number(row.product_id || 0),
      product_number: Number(row.product_number || 0),
      name: row.name || '',
      slug: row.slug || '',
      status: row.status || 'draft',
      review_status: row.review_status || '',
      currency: row.currency || 'CAD',
      price_cents: c(row.price_cents),
      direct_unit_cost_cents: direct,
      linked_resource_cost_cents: resource,
      base_unit_cost_cents: baseUnitCost,
      allocated_overhead_cents: allocatedOverhead,
      estimated_full_unit_cost_cents: fullUnitCost,
      rough_unit_margin_cents: c(row.price_cents) - fullUnitCost,
      linked_resource_count: c(row.linked_resource_count),
      missing_cost_links: c(row.missing_cost_links),
      allocation_basis: usesRowForAllocation ? 'revenue-share' : 'none'
    };
  });

  return jsonResponse({
    ok: true,
    period: range.raw,
    items,
    summary: {
      active_product_count: activeRows.length,
      total_allocated_overhead_cents: totalOverhead,
      average_allocated_overhead_cents: items.length ? Math.round(items.reduce((sum, row) => sum + c(row.allocated_overhead_cents), 0) / items.length) : 0,
      average_full_unit_cost_cents: items.length ? Math.round(items.reduce((sum, row) => sum + c(row.estimated_full_unit_cost_cents), 0) / items.length) : 0
    }
  });
}
