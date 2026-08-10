// File: /functions/api/admin/inventory-bootstrap.js
// Build 245: lightweight Inventory Operations bootstrap. No schema DDL and no full catalog/Amazon expansion.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    const [categories, summary] = await Promise.all([
      db.prepare(`
        SELECT category FROM (
          SELECT LOWER(TRIM(category)) AS category FROM catalog_items WHERE TRIM(COALESCE(category,''))<>''
          UNION
          SELECT LOWER(TRIM(category)) AS category FROM site_item_inventory WHERE TRIM(COALESCE(category,''))<>''
        ) WHERE category<>'' ORDER BY category ASC LIMIT 400
      `).all(),
      db.prepare(`
        SELECT
          COUNT(*) AS inventory_count,
          SUM(CASE WHEN COALESCE(is_active,1)=1 THEN 1 ELSE 0 END) AS active_count,
          SUM(CASE WHEN LOWER(TRIM(COALESCE(source_type,'')))='tool' AND COALESCE(is_active,1)=1 THEN 1 ELSE 0 END) AS tool_count,
          SUM(CASE WHEN LOWER(TRIM(COALESCE(source_type,'')))='supply' AND COALESCE(is_active,1)=1 THEN 1 ELSE 0 END) AS supply_count
        FROM site_item_inventory
      `).first()
    ]);
    return jsonResponse({
      ok: true,
      categories: Array.isArray(categories?.results) ? categories.results.map((r)=>String(r.category||'')).filter(Boolean) : [],
      unit_presets: ['unit','each','piece','gram','kilogram','milligram','millilitre','litre','ounce','pound','inch','foot','metre','centimetre','jar','bottle','bag','box','package','spool','sheet','pair','set','use'],
      source_types: ['tool','supply','product','other'],
      usage_tracking_modes: ['exact','estimated','log_only','reusable'],
      summary: summary || {}
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load inventory bootstrap data.', code: 'inventory_bootstrap_failed' }, 500);
  }
}
