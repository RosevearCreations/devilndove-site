// Build 284 Inventory-owned implementation of the inventory-read module contract.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../../_lib/adminAudit.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function boundedInt(value, fallback = 500, max = 1000) {
  const n = Number(value);
  return Math.max(1, Math.min(max, Number.isFinite(n) ? Math.trunc(n) : fallback));
}
function safeJson(value, fallback = {}) { try { const parsed = JSON.parse(String(value || '')); return parsed ?? fallback; } catch { return fallback; } }
function metadataText(meta, keys = []) {
  if (!meta || typeof meta !== 'object') return '';
  for (const key of keys) {
    const value = meta[key];
    if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : (item?.name || item?.title || '')).filter(Boolean).join(', ');
    if (value && typeof value === 'object') continue;
    if (String(value || '').trim()) return normalizeText(value).slice(0, 8000);
  }
  return '';
}
function mapItem(row = {}) {
  const meta = safeJson(row.catalog_source_record_json, {});
  const onHand = Number(row.on_hand_quantity || 0);
  const reserved = Number(row.reserved_quantity || 0);
  return {
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    source_type: normalizeText(row.source_type),
    external_key: normalizeText(row.external_key),
    item_name: normalizeText(row.item_name),
    category: normalizeText(row.category),
    source_url: normalizeText(row.source_url),
    amazon_url: normalizeText(row.amazon_url),
    image_url: normalizeText(row.image_url),
    on_hand_quantity: onHand,
    reserved_quantity: reserved,
    available_quantity: Math.max(0, onHand - reserved),
    unit_cost_cents: Math.max(0, Math.round(Number(row.unit_cost_cents || 0))),
    stock_unit_label: normalizeText(row.stock_unit_label) || 'unit',
    usage_unit_label: normalizeText(row.usage_unit_label) || 'unit',
    usage_units_per_stock_unit: Math.max(0.001, Number(row.usage_units_per_stock_unit || 1) || 1),
    supplier_name: normalizeText(row.supplier_name || row.catalog_brand),
    supplier_sku: normalizeText(row.supplier_sku),
    item_description: normalizeText(row.item_description || row.catalog_short_description || row.catalog_notes).slice(0, 1200),
    packaging_source_material_template_id: Number(row.packaging_source_material_template_id || 0) || null,
    source_material_link_role: normalizeText(row.source_material_link_role) || null,
    captured_ingredients: metadataText(meta, ['ingredients','ingredient_list','ingredient_declaration','ingredient_declaration_raw','inci','master_inci']),
    captured_allergens: metadataText(meta, ['allergens','allergen_statement','allergen_information']),
    captured_benefits: metadataText(meta, ['benefits','features','key_features']),
    captured_claims: metadataText(meta, ['claims','claim_suggestions']),
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const limit = boundedInt(url.searchParams.get('limit'));
  const includeTools = ['1','true','yes'].includes(String(url.searchParams.get('include_tools') || '').toLowerCase());
  const like = `%${q}%`;

  try {
    let result;
    try {
      result = await db.prepare(`
        SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,sii.source_url,sii.amazon_url,sii.image_url,
               sii.on_hand_quantity,sii.reserved_quantity,sii.unit_cost_cents,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit,
               sii.supplier_name,sii.supplier_sku,d.item_description,ci.brand AS catalog_brand,ci.short_description AS catalog_short_description,
               ci.notes AS catalog_notes,ci.source_record_json AS catalog_source_record_json,
               isml.packaging_source_material_template_id,isml.link_role AS source_material_link_role
        FROM site_item_inventory sii
        LEFT JOIN site_inventory_item_descriptions d ON d.site_item_inventory_id=sii.site_item_inventory_id
        LEFT JOIN catalog_items ci ON ci.item_kind=sii.source_type AND ci.source_key=sii.external_key
        LEFT JOIN inventory_source_material_links isml ON isml.inventory_source_material_link_id=(
          SELECT x.inventory_source_material_link_id FROM inventory_source_material_links x
          WHERE x.site_item_inventory_id=sii.site_item_inventory_id
          ORDER BY CASE x.link_role WHEN 'soap_base' THEN 1 WHEN 'fragrance' THEN 2 WHEN 'colourant' THEN 3 WHEN 'additive' THEN 4 ELSE 5 END,
                   x.inventory_source_material_link_id LIMIT 1
        )
        WHERE COALESCE(sii.is_active,1)=1
          AND (?=1 OR LOWER(COALESCE(sii.source_type,''))<>'tool')
          AND (?='' OR LOWER(COALESCE(sii.item_name,'')) LIKE ? OR LOWER(COALESCE(sii.category,'')) LIKE ? OR LOWER(COALESCE(sii.supplier_name,'')) LIKE ?)
        ORDER BY LOWER(COALESCE(sii.item_name,'')),sii.site_item_inventory_id
        LIMIT ?
      `).bind(includeTools ? 1 : 0, q, like, like, like, limit).all();
    } catch {
      result = await db.prepare(`
        SELECT site_item_inventory_id,source_type,external_key,item_name,category,source_url,amazon_url,image_url,
               on_hand_quantity,reserved_quantity,unit_cost_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,supplier_name,supplier_sku
        FROM site_item_inventory
        WHERE COALESCE(is_active,1)=1
          AND (?=1 OR LOWER(COALESCE(source_type,''))<>'tool')
          AND (?='' OR LOWER(COALESCE(item_name,'')) LIKE ? OR LOWER(COALESCE(category,'')) LIKE ? OR LOWER(COALESCE(supplier_name,'')) LIKE ?)
        ORDER BY LOWER(COALESCE(item_name,'')),site_item_inventory_id
        LIMIT ?
      `).bind(includeTools ? 1 : 0, q, like, like, like, limit).all();
    }

    const items = rows(result).map(mapItem);
    return json({ ok: true, contract: 'inventory-read', owner: 'inventory', requested_by: adminUser, items, count: items.length });
  } catch (error) {
    return json({ ok: false, error: 'Inventory read contract failed.', error_code: 'inventory_read_failed', detail: String(error?.message || error) }, 500);
  }
}
