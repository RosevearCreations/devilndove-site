import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const nextProductRow = await db.prepare(`SELECT CASE WHEN COALESCE(MAX(product_number), 0) < 1000 THEN 1000 ELSE COALESCE(MAX(product_number), 0) + 1 END AS next_product_number FROM products`).first().catch(() => ({ next_product_number: 1 }));
  const taxClasses = normalizeResults(await db.prepare(`SELECT tax_class_id, code, name, COALESCE(rate_percent, tax_rate, 0) AS tax_rate FROM tax_classes WHERE COALESCE(is_active,1)=1 ORDER BY LOWER(name) ASC`).all().catch(() => ({ results: [] })));
  const categoryRows = normalizeResults(await db.prepare(`
    SELECT DISTINCT TRIM(product_category) AS product_category
    FROM products
    WHERE TRIM(COALESCE(product_category, '')) != ''
    ORDER BY LOWER(TRIM(product_category)) ASC
  `).all().catch(() => ({ results: [] })));
  const resources = normalizeResults(await db.prepare(`
    SELECT ci.item_kind, ci.source_key, ci.name, ci.image_url, ci.category, ci.subcategory,
           COALESCE(sii.on_hand_quantity,0) AS on_hand_quantity,
           COALESCE(sii.reorder_level,0) AS reorder_level,
           COALESCE(sii.is_on_reorder_list,0) AS is_on_reorder_list,
           COALESCE(sii.do_not_reuse,0) AS do_not_reuse,
           CASE WHEN COALESCE(sii.reorder_level,0) > 0 AND (COALESCE(sii.on_hand_quantity,0) + COALESCE(sii.incoming_quantity,0)) <= COALESCE(sii.reorder_level,0) THEN 1 ELSE 0 END AS reorder_needed
    FROM catalog_items ci
    LEFT JOIN site_item_inventory sii ON sii.source_type = ci.item_kind AND sii.external_key = ci.source_key
    WHERE ci.item_kind IN ('tool','supply') AND COALESCE(ci.status,'active') != 'archived'
    ORDER BY ci.item_kind ASC, LOWER(ci.name) ASC
    LIMIT 500
  `).all().catch(() => ({ results: [] })));

  const defaultCategories = ['Rings','Necklaces','Bracelets','Earrings','Pendants','CNC Components','3D Printed Items','Laser Engraved Items','Polymer Clay Items','Home Decor','Accessories','Other'];
  const categoryOptions = Array.from(new Set([...defaultCategories, ...categoryRows.map((row) => String(row.product_category || '').trim()).filter(Boolean)]));

  return json({
    ok: true,
    next_product_number: Number(nextProductRow?.next_product_number || 1000),
    next_product_code: `DD${String(Number(nextProductRow?.next_product_number || 1000)).padStart(4, '0')}`,
    category_options: categoryOptions,
    color_options: ['Silver','Gold','Black','White','Red','Blue','Green','Purple','Pink','Orange','Yellow','Brown','Clear','Multicolor'],
    shipping_code_options: ['standard-jewelry','small-parcel','oversize','pickup-only','digital'],
    tax_classes: taxClasses.map((row) => ({ tax_class_id: Number(row.tax_class_id || 0), code: row.code || '', name: row.name || '', tax_rate: Number(row.tax_rate || 0) })),
    resources: resources.map((row) => ({ item_kind: row.item_kind || '', source_key: row.source_key || '', name: row.name || '', image_url: row.image_url || '', category: row.category || '', subcategory: row.subcategory || '', on_hand_quantity: Number(row.on_hand_quantity || 0), reorder_level: Number(row.reorder_level || 0), is_on_reorder_list: Number(row.is_on_reorder_list || 0), do_not_reuse: Number(row.do_not_reuse || 0), reorder_needed: Number(row.reorder_needed || 0) }))
  });
}
