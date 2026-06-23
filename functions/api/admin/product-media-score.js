// File: /functions/api/admin/product-media-score.js
// Brief description: Admin-only role coverage for product photos. Roles describe real buyer questions rather than generic gallery count.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const ROLE_DEFS = [
  ['main','Main product image',20,'A clear first image of the actual item.'],
  ['close_up','Close-up / texture',15,'Show texture, finish, engraving, stone, or detail.'],
  ['scale','Scale reference',15,'Show size beside a familiar reference, hand, ruler, coin, stand, or packaging.'],
  ['back_or_side','Back / side',10,'Show the reverse, closure, side, or condition details.'],
  ['process','Process / workshop',15,'Show a truthful making step when appropriate.'],
  ['packaging','Packaging / pickup',5,'Show packaging, gift readiness, or pickup handoff when useful.'],
  ['social_share','Social share image',10,'Reserve a strong square/vertical share image for social use.'],
  ['video','Short product video',10,'Optional short video or motion detail stored in the listing profile.']
];
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function id(value) { const n=Number(value); return Number.isInteger(n) && n>0 ? n : 0; }
function clean(value) { return normalizeText(value); }
function validRole(value) { return ROLE_DEFS.some(([key]) => key === clean(value)); }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_media_role_assignments (
    product_media_role_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    role_key TEXT NOT NULL,
    product_image_id INTEGER,
    image_url TEXT,
    assignment_status TEXT NOT NULL DEFAULT 'assigned',
    notes TEXT,
    created_by_user_id INTEGER,
    updated_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, role_key),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE SET NULL
  )`).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_product_media_role_assignments_product ON product_media_role_assignments(product_id, role_key)').run();
}
function score(assignments, profile) {
  const byRole = new Map((assignments || []).filter((row) => clean(row.assignment_status || 'assigned') !== 'missing').map((row) => [clean(row.role_key), row]));
  let total=0;
  const roles=ROLE_DEFS.map(([key,label,points,detail]) => {
    const assigned = key === 'video' ? Boolean(clean(profile?.product_video_url)) : Boolean(byRole.get(key)?.image_url || byRole.get(key)?.product_image_id);
    if (assigned) total += points;
    return { role_key:key, label, points, detail, status:assigned ? 'assigned' : 'missing', assignment:byRole.get(key) || null };
  });
  return { score:total, status:total >= 80 ? 'strong' : total >= 55 ? 'developing' : 'needs_media', roles };
}
async function loadProduct(db, productId) {
  const product = await db.prepare(`SELECT product_id,name,slug,status,featured_image_url,product_category,merchandise_origin FROM products WHERE product_id=? LIMIT 1`).bind(productId).first().catch(() => null);
  if (!product) return null;
  const images = rows(await db.prepare(`SELECT product_image_id, image_url, alt_text, sort_order FROM product_images WHERE product_id=? ORDER BY COALESCE(sort_order,0), product_image_id`).bind(productId).all().catch(() => ({results:[]})));
  const assignments = rows(await db.prepare(`SELECT * FROM product_media_role_assignments WHERE product_id=? ORDER BY role_key`).bind(productId).all().catch(() => ({results:[]})));
  const profile = await db.prepare(`SELECT product_video_url FROM product_listing_profiles WHERE product_id=? LIMIT 1`).bind(productId).first().catch(() => null);
  const inferredMain = images.find((row) => clean(row.image_url) === clean(product.featured_image_url)) || images[0] || null;
  const normalized = assignments.length ? assignments : (inferredMain ? [{ role_key:'main', product_image_id:inferredMain.product_image_id, image_url:inferredMain.image_url, assignment_status:'assigned', notes:'Inferred from featured/first image until explicitly saved.' }] : []);
  return { product, images, assignments:normalized, profile:profile || {}, media_score:score(normalized, profile || {}) };
}
async function listProducts(db) {
  const products=rows(await db.prepare(`SELECT p.product_id,p.name,p.slug,p.status,p.product_category,p.featured_image_url,COUNT(pi.product_image_id) AS image_count FROM products p LEFT JOIN product_images pi ON pi.product_id=p.product_id WHERE COALESCE(p.status,'draft') <> 'archived' GROUP BY p.product_id ORDER BY datetime(COALESCE(p.updated_at,p.created_at,CURRENT_TIMESTAMP)) DESC,p.product_id DESC LIMIT 300`).all().catch(()=>({results:[]})));
  const summary={ total_products:products.length, products_with_images:products.filter((r)=>Number(r.image_count||0)>0 || clean(r.featured_image_url)).length };
  return { products, summary };
}
export async function onRequestGet(context) {
  const admin=await getAdminUserFromRequest(context.request,context.env); if(!admin) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  try { await ensureSchema(db); const productId=id(new URL(context.request.url).searchParams.get('product_id')); if(productId){ const item=await loadProduct(db,productId); if(!item) return jsonResponse({ok:false,error:'Product was not found.'},404); return jsonResponse({ok:true,...item},200,{'Cache-Control':'no-store'}); } return jsonResponse({ok:true,...(await listProducts(db)),roles:ROLE_DEFS.map(([role_key,label,points,detail])=>({role_key,label,points,detail}))},200,{'Cache-Control':'no-store'}); }
  catch { return jsonResponse({ok:false,error:'Product media roles are temporarily unavailable.'},503); }
}
export async function onRequestPost(context) {
  const {request,env}=context; const admin=await getAdminUserFromRequest(request,env); if(!admin) return jsonResponse({ok:false,error:'Admin access required.'},401); const db=getDb(env); if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  let body={}; try{body=await request.json();}catch{return jsonResponse({ok:false,error:'Invalid JSON body.'},400);} const productId=id(body.product_id); if(!productId) return jsonResponse({ok:false,error:'Choose a product first.'},400);
  try { await ensureSchema(db); const product=await db.prepare('SELECT product_id,name FROM products WHERE product_id=? LIMIT 1').bind(productId).first(); if(!product) return jsonResponse({ok:false,error:'Product was not found.'},404);
    const items=Array.isArray(body.assignments)?body.assignments:[];
    for(const role of ROLE_DEFS.map(([key])=>key)){
      const row=items.find((item)=>clean(item.role_key)===role) || null;
      if(!row || role==='video' || !clean(row.image_url)) { await db.prepare('DELETE FROM product_media_role_assignments WHERE product_id=? AND role_key=?').bind(productId,role).run(); continue; }
      const imageId=id(row.product_image_id) || null; const imageUrl=clean(row.image_url).slice(0,2048); const notes=clean(row.notes).slice(0,800);
      await db.prepare(`INSERT INTO product_media_role_assignments (product_id,role_key,product_image_id,image_url,assignment_status,notes,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?, ?, ?, ?, 'assigned', ?, ?, ?, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(product_id,role_key) DO UPDATE SET product_image_id=excluded.product_image_id,image_url=excluded.image_url,assignment_status='assigned',notes=excluded.notes,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(productId,role,imageId,imageUrl,notes||null,Number(admin.user_id||0)||null,Number(admin.user_id||0)||null).run();
    }
    await auditAdminAction(env,request,admin,{action_type:'save_product_media_roles',target_type:'product',target_id:productId,target_key:String(product.name||productId),details:{role_count:items.length}});
    const item=await loadProduct(db,productId); return jsonResponse({ok:true,message:'Product media roles saved.',...item},200,{'Cache-Control':'no-store'});
  } catch { return jsonResponse({ok:false,error:'Could not save product media roles.'},500); }
}
