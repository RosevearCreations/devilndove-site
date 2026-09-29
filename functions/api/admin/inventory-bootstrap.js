// File: /functions/api/admin/inventory-bootstrap.js
// Build 245: lightweight Inventory Operations bootstrap. No schema DDL and no full catalog/Amazon expansion.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    const [categories, processes, stationTools, summary] = await Promise.all([
      db.prepare(`
        SELECT category FROM (
          SELECT LOWER(TRIM(category)) AS category FROM catalog_items WHERE TRIM(COALESCE(category,''))<>''
          UNION
          SELECT LOWER(TRIM(category)) AS category FROM site_item_inventory WHERE TRIM(COALESCE(category,''))<>''
        ) WHERE category<>'' ORDER BY category ASC LIMIT 400
      `).all(),
      db.prepare(`
        SELECT inventory_process_id,process_key,process_name,description,sort_order
        FROM inventory_processes
        WHERE is_active=1
        ORDER BY sort_order,process_name
        LIMIT 80
      `).all(),
      db.prepare(`
        SELECT sii.site_item_inventory_id,sii.item_name,ipa.inventory_process_id,ip.process_key,ip.process_name
        FROM inventory_workstation_roles iwr
        JOIN site_item_inventory sii ON sii.site_item_inventory_id=iwr.site_item_inventory_id
        JOIN inventory_process_assignments ipa ON ipa.site_item_inventory_id=sii.site_item_inventory_id
        JOIN inventory_processes ip ON ip.inventory_process_id=ipa.inventory_process_id
        WHERE iwr.workstation_role='station'
          AND LOWER(TRIM(COALESCE(sii.source_type,'')))='tool'
          AND COALESCE(sii.is_active,1)=1
          AND COALESCE(ip.is_active,1)=1
        ORDER BY ip.sort_order,LOWER(COALESCE(sii.item_name,'')),sii.site_item_inventory_id
        LIMIT 160
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
      processes: Array.isArray(processes?.results) ? processes.results : [],
      station_tools: Array.isArray(stationTools?.results) ? stationTools.results : [],
      unit_presets: ['unit','each','piece','gram','kilogram','milligram','millilitre','litre','ounce','pound','inch','foot','metre','centimetre','jar','bottle','bag','box','package','pack','roll','spool','sheet','pair','set','kit','cartridge','tube','can','pail','tool','machine','use'],
      source_types: ['tool','supply','product','other'],
      usage_tracking_modes: ['exact','estimated','log_only','reusable'],
      summary: summary || {}
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load inventory bootstrap data.', code: 'inventory_bootstrap_failed' }, 500);
  }
}
