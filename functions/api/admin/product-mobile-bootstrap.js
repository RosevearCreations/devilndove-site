function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function normalizeText(value) { return String(value || '').trim(); }
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
  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
  return { user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '' };
}
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const nextProductRow = await env.DB.prepare(`SELECT COALESCE(MAX(product_number), 0) + 1 AS next_product_number FROM products`).first().catch(() => ({ next_product_number: 1 }));
  const taxClasses = normalizeResults(await env.DB.prepare(`SELECT tax_class_id, code, name, COALESCE(rate_percent, tax_rate, 0) AS tax_rate FROM tax_classes WHERE COALESCE(is_active,1)=1 ORDER BY LOWER(name) ASC`).all().catch(() => ({ results: [] })));
  const resources = normalizeResults(await env.DB.prepare(`
    SELECT ci.item_kind, ci.source_key, ci.name, ci.image_url, ci.category, ci.subcategory,
           COALESCE(sii.on_hand_quantity,0) AS on_hand_quantity,
           COALESCE(sii.reorder_point,0) AS reorder_point,
           COALESCE(sii.is_on_reorder_list,0) AS is_on_reorder_list,
           COALESCE(sii.do_not_reuse,0) AS do_not_reuse
    FROM catalog_items ci
    LEFT JOIN site_item_inventory sii ON sii.source_type = ci.item_kind AND sii.external_key = ci.source_key
    WHERE ci.item_kind IN ('tool','supply') AND COALESCE(ci.status,'active') != 'archived'
    ORDER BY ci.item_kind ASC, LOWER(ci.name) ASC
    LIMIT 250
  `).all().catch(() => ({ results: [] })));

  return json({
    ok: true,
    next_product_number: Number(nextProductRow?.next_product_number || 1),
    category_options: ['Rings','Necklaces','Bracelets','Earrings','Pendants','CNC Components','3D Printed Items','Laser Engraved Items','Polymer Clay Items','Home Decor','Accessories','Other'],
    color_options: ['Silver','Gold','Black','White','Red','Blue','Green','Purple','Pink','Orange','Yellow','Brown','Clear','Multicolor'],
    shipping_code_options: ['standard-jewelry','small-parcel','oversize','pickup-only','digital'],
    tax_classes: taxClasses.map((row) => ({ tax_class_id: Number(row.tax_class_id || 0), code: row.code || '', name: row.name || '', tax_rate: Number(row.tax_rate || 0) })),
    resources: resources.map((row) => ({ item_kind: row.item_kind || '', source_key: row.source_key || '', name: row.name || '', image_url: row.image_url || '', category: row.category || '', subcategory: row.subcategory || '', on_hand_quantity: Number(row.on_hand_quantity || 0), reorder_point: Number(row.reorder_point || 0), is_on_reorder_list: Number(row.is_on_reorder_list || 0), do_not_reuse: Number(row.do_not_reuse || 0) }))
  });
}
