// Release 461: admin-only buyer-facing media roles plus deterministic primary-image quality acceptance.
// Schema is migration-owned. No request-time DDL or implicit schema repair.

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

const PRIMARY_MIN_WIDTH = 1200;
const PRIMARY_MIN_HEIGHT = 1200;
const PRIMARY_MIN_ALT = 12;
const PRIMARY_MIN_SCORE = 70;
const REQUIRED_TABLES = ['product_media_role_assignments','product_image_quality_reviews'];

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function id(value) { const n=Number(value); return Number.isInteger(n) && n>0 ? n : 0; }
function integer(value) { const n=Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }
function clean(value) { return normalizeText(value); }
function validRole(value) { return ROLE_DEFS.some(([key]) => key === clean(value)); }

async function schemaReadiness(db) {
  const placeholders = REQUIRED_TABLES.map(() => '?').join(',');
  const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...REQUIRED_TABLES).all().catch(() => ({results:[]}));
  const present = new Set(rows(result).map((row) => String(row.name || '')));
  const missing_tables = REQUIRED_TABLES.filter((name) => !present.has(name));
  return { ok: missing_tables.length === 0, missing_tables };
}

function roleScore(assignments, profile) {
  const byRole = new Map((assignments || []).filter((row) => clean(row.assignment_status || 'assigned') !== 'missing').map((row) => [clean(row.role_key), row]));
  let total=0;
  const roles=ROLE_DEFS.map(([key,label,points,detail]) => {
    const assigned = key === 'video' ? Boolean(clean(profile?.product_video_url)) : Boolean(byRole.get(key)?.image_url || byRole.get(key)?.product_image_id);
    if (assigned) total += points;
    return { role_key:key, label, points, detail, status:assigned ? 'assigned' : 'missing', assignment:byRole.get(key) || null };
  });
  return { score:total, status:total >= 80 ? 'strong' : total >= 55 ? 'developing' : 'needs_media', roles };
}

function qualityScore({ isPrimary=false, width=0, height=0, altLength=0, loadStatus='unknown' } = {}) {
  let score = 0;
  if (loadStatus === 'loaded') score += 15;
  if (width >= PRIMARY_MIN_WIDTH && height >= PRIMARY_MIN_HEIGHT) score += 45;
  if (altLength >= PRIMARY_MIN_ALT) score += 20;
  if (isPrimary) score += 20;
  return Math.max(0, Math.min(100, score));
}

function primaryAcceptance(primaryImage, review) {
  const currentUrl = clean(primaryImage?.image_url);
  const reviewCurrent = Boolean(review && currentUrl && clean(review.image_url) === currentUrl);
  const width = reviewCurrent ? integer(review.width_px) : 0;
  const height = reviewCurrent ? integer(review.height_px) : 0;
  const altLength = clean(primaryImage?.alt_text).length;
  const score = reviewCurrent ? integer(review.quality_score) : 0;
  const loaded = reviewCurrent && clean(review.load_status) === 'loaded';
  const dimensions_ok = width >= PRIMARY_MIN_WIDTH && height >= PRIMARY_MIN_HEIGHT;
  const alt_ok = altLength >= PRIMARY_MIN_ALT;
  const score_ok = score >= PRIMARY_MIN_SCORE;
  const accepted = Boolean(primaryImage && loaded && dimensions_ok && alt_ok && score_ok && clean(review?.acceptance_status) === 'accepted');
  return {
    accepted,
    status: accepted ? 'accepted' : (primaryImage ? 'needs_review' : 'missing_primary_image'),
    primary_image: primaryImage || null,
    review: reviewCurrent ? review : null,
    stale_review: Boolean(review && !reviewCurrent),
    thresholds: { min_width_px:PRIMARY_MIN_WIDTH, min_height_px:PRIMARY_MIN_HEIGHT, min_alt_characters:PRIMARY_MIN_ALT, min_quality_score:PRIMARY_MIN_SCORE },
    checks: { loaded, dimensions_ok, alt_ok, score_ok },
    current: { width_px:width, height_px:height, alt_text_length:altLength, quality_score:score }
  };
}

async function rawProductMedia(db, productId) {
  const product = await db.prepare(`SELECT product_id,name,slug,status,featured_image_url,product_category,merchandise_origin FROM products WHERE product_id=? LIMIT 1`).bind(productId).first().catch(() => null);
  if (!product) return null;
  const images = rows(await db.prepare(`SELECT product_image_id,image_url,alt_text,sort_order FROM product_images WHERE product_id=? ORDER BY COALESCE(sort_order,0),product_image_id`).bind(productId).all().catch(() => ({results:[]})));
  const assignments = rows(await db.prepare(`SELECT * FROM product_media_role_assignments WHERE product_id=? ORDER BY role_key`).bind(productId).all().catch(() => ({results:[]})));
  const profile = await db.prepare(`SELECT product_video_url FROM product_listing_profiles WHERE product_id=? LIMIT 1`).bind(productId).first().catch(() => null);
  const inferredMain = images.find((row) => clean(row.image_url) === clean(product.featured_image_url)) || images[0] || null;
  const normalized = assignments.length ? assignments : (inferredMain ? [{ role_key:'main', product_image_id:inferredMain.product_image_id, image_url:inferredMain.image_url, assignment_status:'assigned', notes:'Inferred from featured/first image until explicitly saved.' }] : []);
  const mainAssignment = normalized.find((row) => clean(row.role_key) === 'main') || null;
  const primaryImage = mainAssignment
    ? images.find((row) => id(row.product_image_id) === id(mainAssignment.product_image_id) || clean(row.image_url) === clean(mainAssignment.image_url)) || inferredMain
    : inferredMain;
  return { product, images, assignments:normalized, profile:profile || {}, primaryImage };
}

async function loadProduct(db, productId) {
  const base = await rawProductMedia(db, productId);
  if (!base) return null;
  const reviews = rows(await db.prepare(`SELECT product_image_quality_review_id,product_id,product_image_id,image_url,image_role,width_px,height_px,alt_text_length,load_status,quality_score,acceptance_status,review_source,reviewed_at,updated_at FROM product_image_quality_reviews WHERE product_id=? ORDER BY product_image_id`).bind(productId).all().catch(() => ({results:[]})));
  const primaryReview = base.primaryImage ? reviews.find((row) => id(row.product_image_id) === id(base.primaryImage.product_image_id)) || null : null;
  return {
    product:base.product,
    images:base.images,
    assignments:base.assignments,
    profile:base.profile,
    media_score:roleScore(base.assignments, base.profile),
    quality_reviews:reviews,
    primary_image_acceptance:primaryAcceptance(base.primaryImage, primaryReview)
  };
}

async function listProducts(db) {
  const products=rows(await db.prepare(`SELECT p.product_id,p.name,p.slug,p.status,p.product_category,p.featured_image_url,COUNT(pi.product_image_id) AS image_count FROM products p LEFT JOIN product_images pi ON pi.product_id=p.product_id WHERE COALESCE(p.status,'draft') <> 'archived' GROUP BY p.product_id ORDER BY datetime(COALESCE(p.updated_at,p.created_at,CURRENT_TIMESTAMP)) DESC,p.product_id DESC LIMIT 300`).all().catch(()=>({results:[]})));
  const summary={ total_products:products.length, products_with_images:products.filter((r)=>Number(r.image_count||0)>0 || clean(r.featured_image_url)).length };
  return { products, summary };
}

async function saveQualityReviews(db, productId, measurements, userId) {
  const base = await rawProductMedia(db, productId);
  if (!base) return null;
  const primaryId = id(base.primaryImage?.product_image_id);
  const byId = new Map(base.images.map((image) => [id(image.product_image_id), image]));
  for (const measurement of (Array.isArray(measurements) ? measurements : []).slice(0, 20)) {
    const imageId = id(measurement.product_image_id);
    const image = byId.get(imageId);
    if (!image) continue;
    const width = integer(measurement.width_px);
    const height = integer(measurement.height_px);
    const loadStatus = clean(measurement.load_status) === 'loaded' ? 'loaded' : 'error';
    const altLength = clean(image.alt_text).length;
    const isPrimary = imageId === primaryId;
    const score = qualityScore({ isPrimary, width, height, altLength, loadStatus });
    const accepted = isPrimary && loadStatus === 'loaded' && width >= PRIMARY_MIN_WIDTH && height >= PRIMARY_MIN_HEIGHT && altLength >= PRIMARY_MIN_ALT && score >= PRIMARY_MIN_SCORE;
    const acceptanceStatus = isPrimary ? (accepted ? 'accepted' : 'needs_review') : 'supporting';
    await db.prepare(`
      INSERT INTO product_image_quality_reviews (
        product_id,product_image_id,image_url,image_role,width_px,height_px,alt_text_length,load_status,
        quality_score,acceptance_status,review_source,reviewed_by_user_id,reviewed_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?, 'browser_measurement',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(product_id,product_image_id) DO UPDATE SET
        image_url=excluded.image_url,image_role=excluded.image_role,width_px=excluded.width_px,height_px=excluded.height_px,
        alt_text_length=excluded.alt_text_length,load_status=excluded.load_status,quality_score=excluded.quality_score,
        acceptance_status=excluded.acceptance_status,review_source=excluded.review_source,
        reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    `).bind(productId,imageId,clean(image.image_url).slice(0,2048),isPrimary?'primary':'supporting',width,height,altLength,loadStatus,score,acceptanceStatus,Number(userId||0)||null).run();
  }
  return loadProduct(db, productId);
}

export async function onRequestGet(context) {
  const admin=await getAdminUserFromRequest(context.request,context.env);
  if(!admin) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);
  if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const readiness=await schemaReadiness(db);
  if(!readiness.ok) return jsonResponse({ok:false,error:'Product media quality needs the current Release 461 Development migration.',code:'product_media_quality_migration_required',missing_tables:readiness.missing_tables},503);
  try {
    const productId=id(new URL(context.request.url).searchParams.get('product_id'));
    if(productId){ const item=await loadProduct(db,productId); if(!item) return jsonResponse({ok:false,error:'Product was not found.'},404); return jsonResponse({ok:true,...item},200,{'Cache-Control':'no-store'}); }
    return jsonResponse({ok:true,...(await listProducts(db)),roles:ROLE_DEFS.map(([role_key,label,points,detail])=>({role_key,label,points,detail})),primary_image_thresholds:{min_width_px:PRIMARY_MIN_WIDTH,min_height_px:PRIMARY_MIN_HEIGHT,min_alt_characters:PRIMARY_MIN_ALT,min_quality_score:PRIMARY_MIN_SCORE}},200,{'Cache-Control':'no-store'});
  } catch { return jsonResponse({ok:false,error:'Product media roles are temporarily unavailable.'},503); }
}

export async function onRequestPost(context) {
  const {request,env}=context;
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(env);
  if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const readiness=await schemaReadiness(db);
  if(!readiness.ok) return jsonResponse({ok:false,error:'Product media quality needs the current Release 461 Development migration.',code:'product_media_quality_migration_required',missing_tables:readiness.missing_tables},503);
  let body={}; try{body=await request.json();}catch{return jsonResponse({ok:false,error:'Invalid JSON body.'},400);}
  const productId=id(body.product_id);
  if(!productId) return jsonResponse({ok:false,error:'Choose a product first.'},400);
  const product=await db.prepare('SELECT product_id,name FROM products WHERE product_id=? LIMIT 1').bind(productId).first().catch(() => null);
  if(!product) return jsonResponse({ok:false,error:'Product was not found.'},404);

  try {
    if(clean(body.action)==='quality_review') {
      const item=await saveQualityReviews(db, productId, body.measurements, admin.user_id);
      await auditAdminAction(env,request,admin,{action_type:'review_product_image_quality',target_type:'product',target_id:productId,target_key:String(product.name||productId),details:{measurement_count:Array.isArray(body.measurements)?body.measurements.length:0,primary_accepted:Boolean(item?.primary_image_acceptance?.accepted)}});
      return jsonResponse({ok:true,message:item?.primary_image_acceptance?.accepted?'Primary product image accepted.':'Image measurements saved; primary image still needs attention.',...item},200,{'Cache-Control':'no-store'});
    }

    const items=Array.isArray(body.assignments)?body.assignments:[];
    for(const role of ROLE_DEFS.map(([key])=>key)){
      const row=items.find((item)=>clean(item.role_key)===role) || null;
      if(!row || role==='video' || !clean(row.image_url)) { await db.prepare('DELETE FROM product_media_role_assignments WHERE product_id=? AND role_key=?').bind(productId,role).run(); continue; }
      const imageId=id(row.product_image_id) || null;
      const imageUrl=clean(row.image_url).slice(0,2048);
      const notes=clean(row.notes).slice(0,800);
      if (!validRole(role)) continue;
      await db.prepare(`INSERT INTO product_media_role_assignments (product_id,role_key,product_image_id,image_url,assignment_status,notes,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?, ?, ?, ?, 'assigned', ?, ?, ?, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(product_id,role_key) DO UPDATE SET product_image_id=excluded.product_image_id,image_url=excluded.image_url,assignment_status='assigned',notes=excluded.notes,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(productId,role,imageId,imageUrl,notes||null,Number(admin.user_id||0)||null,Number(admin.user_id||0)||null).run();
    }
    await auditAdminAction(env,request,admin,{action_type:'save_product_media_roles',target_type:'product',target_id:productId,target_key:String(product.name||productId),details:{role_count:items.length}});
    const item=await loadProduct(db,productId);
    return jsonResponse({ok:true,message:'Product media roles saved. Re-run image quality measurement when the primary image changes.',...item},200,{'Cache-Control':'no-store'});
  } catch { return jsonResponse({ok:false,error:'Could not save product media roles or quality review.'},500); }
}
