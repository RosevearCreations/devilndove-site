// File: /functions/api/admin/product-resources.js
// Brief description: Lets admin link tools and supplies used in a finished product,
// with visual item browsing from catalog_items and site_item_inventory.

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }); }
function normalizeText(value) { return String(value || '').trim(); }
function getBearerToken(request) { const authHeader = request.headers.get('Authorization') || ''; const match = authHeader.match(/^Bearer\s+(.+)$/i); return match ? String(match[1] || '').trim() : ''; }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request); if (!token) return null;
  const session = await env.DB.prepare(`SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active FROM sessions s INNER JOIN users u ON u.user_id=s.user_id WHERE (s.session_token=? OR s.token=?) AND s.expires_at > datetime('now') LIMIT 1`).bind(token, token).first();
  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
  return { user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '' };
}

export async function onRequestGet(context) {
  const { request, env } = context; const adminUser = await getAdminUserFromRequest(request, env); if (!adminUser) return json({ ok:false, error:'Unauthorized.' }, 401);
  const url = new URL(request.url); const productId = Number(url.searchParams.get('product_id') || 0); const query = normalizeText(url.searchParams.get('q')).toLowerCase(); const like = `%${query}%`;
  const products = normalizeResults(await env.DB.prepare(`SELECT product_id, name, slug, featured_image_url, status FROM products ORDER BY LOWER(name) ASC LIMIT 300`).all()).map((row) => ({ product_id:Number(row.product_id||0), name:row.name||'', slug:row.slug||'', featured_image_url:row.featured_image_url||'', status:row.status||'' }));
  const resources = normalizeResults(await env.DB.prepare(`
    SELECT ci.item_kind, ci.source_key, ci.name, ci.image_url, ci.category, ci.subcategory,
           sii.site_item_inventory_id, sii.on_hand_quantity, sii.is_on_reorder_list, sii.do_not_reuse
    FROM catalog_items ci
    LEFT JOIN site_item_inventory sii ON sii.source_type = ci.item_kind AND sii.external_key = ci.source_key
    WHERE ci.item_kind IN ('tool','supply') AND COALESCE(ci.status,'active') != 'archived'
      AND (? = '' OR LOWER(COALESCE(ci.name,'')) LIKE ? OR LOWER(COALESCE(ci.category,'')) LIKE ? OR LOWER(COALESCE(ci.subcategory,'')) LIKE ?)
    ORDER BY ci.item_kind ASC, LOWER(ci.name) ASC LIMIT 500
  `).bind(query, like, like, like).all()).map((row)=>({ item_kind:row.item_kind||'', source_key:row.source_key||'', name:row.name||'', image_url:row.image_url||'', category:row.category||'', subcategory:row.subcategory||'', site_item_inventory_id:Number(row.site_item_inventory_id||0), on_hand_quantity:Number(row.on_hand_quantity||0), is_on_reorder_list:Number(row.is_on_reorder_list||0), do_not_reuse:Number(row.do_not_reuse||0) }));
  const links = productId ? normalizeResults(await env.DB.prepare(`SELECT product_resource_link_id, product_id, resource_kind, source_key, quantity_used, usage_notes, sort_order FROM product_resource_links WHERE product_id=? ORDER BY sort_order ASC, product_resource_link_id ASC`).bind(productId).all()) : [];
  return json({ ok:true, products, resources, links: links.map((x)=>({ product_resource_link_id:Number(x.product_resource_link_id||0), product_id:Number(x.product_id||0), resource_kind:x.resource_kind||'', source_key:x.source_key||'', quantity_used:Number(x.quantity_used||0), usage_notes:x.usage_notes||'', sort_order:Number(x.sort_order||0) })) });
}

export async function onRequestPost(context) {
  const { request, env } = context; const adminUser = await getAdminUserFromRequest(request, env); if (!adminUser) return json({ ok:false, error:'Unauthorized.' }, 401);
  let body={}; try { body = await request.json(); } catch { return json({ ok:false, error:'Invalid JSON body.' }, 400); }
  const productId = Number(body.product_id || 0); const links = Array.isArray(body.links) ? body.links : [];
  if (!productId) return json({ ok:false, error:'product_id is required.' }, 400);
  const product = await env.DB.prepare(`SELECT product_id FROM products WHERE product_id=? LIMIT 1`).bind(productId).first(); if (!product) return json({ ok:false, error:'Product not found.' }, 404);
  await env.DB.prepare(`DELETE FROM product_resource_links WHERE product_id=?`).bind(productId).run();
  let saved = 0;
  for (let i=0;i<links.length;i+=1) {
    const row = links[i] || {}; const resourceKind = normalizeText(row.resource_kind).toLowerCase(); const sourceKey = normalizeText(row.source_key); if (!['tool','supply'].includes(resourceKind) || !sourceKey) continue;
    await env.DB.prepare(`INSERT INTO product_resource_links (product_id, resource_kind, source_key, quantity_used, usage_notes, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(productId, resourceKind, sourceKey, Math.max(0, Number(row.quantity_used || 1) || 1), normalizeText(row.usage_notes) || null, Number(row.sort_order || i)).run();
    saved += 1;
  }
  return json({ ok:true, saved_links:saved });
}
