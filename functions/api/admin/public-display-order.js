// Build 264 — explicit public merchandising priority for Home Featured, Art/Gallery and Creations.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText, captureRuntimeIncident } from '../_lib/adminAudit.js';

const SURFACES = new Set(['home_featured','gallery','creations']);
function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function text(value,max=200){return normalizeText(value).slice(0,max);}
function int(value,fallback=0){const n=Number(value);return Number.isInteger(n)?n:fallback;}
async function tableExists(db,name){return Boolean(await db.prepare("SELECT 1 ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null));}
async function requireAdmin(context){
  const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user)return {error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  if(!(await tableExists(db,'public_display_priorities')))return {error:json({ok:false,error:'Build 264 merchandising migration is not installed.'},409)};
  return {user,db};
}
function cleanSurface(value){const v=text(value,40).toLowerCase();return SURFACES.has(v)?v:'home_featured';}

async function loadItems(db,surface){
  if(surface==='home_featured'){
    return rows(await db.prepare(`
      SELECT p.product_id AS record_id,'product' AS record_type,p.name,p.slug,p.product_category AS category,
             COALESCE(NULLIF(p.featured_image_url,''),(SELECT pi.image_url FROM product_images pi WHERE pi.product_id=p.product_id AND COALESCE(pi.image_url,'')<>'' ORDER BY COALESCE(pi.sort_order,0),pi.product_image_id LIMIT 1),'') AS image_url,
             COALESCE(p.sort_order,999999) AS source_sort,
             COALESCE(d.is_pinned,0) AS is_pinned,COALESCE(d.priority_rank,9999) AS priority_rank,COALESCE(d.notes,'') AS priority_notes
      FROM products p
      LEFT JOIN public_display_priorities d ON d.surface_key=? AND d.record_type='product' AND d.record_id=p.product_id
      WHERE COALESCE(p.status,'active')='active' AND COALESCE(p.review_status,'published') IN ('approved','published','')
      ORDER BY COALESCE(d.is_pinned,0) DESC,COALESCE(d.priority_rank,9999) ASC,COALESCE(p.sort_order,999999) ASC,LOWER(p.name),p.product_id
      LIMIT 300`).bind(surface).all());
  }
  return rows(await db.prepare(`
    SELECT c.catalog_item_id AS record_id,'creation' AS record_type,c.name,c.slug,c.category,COALESCE(c.image_url,'') AS image_url,
           COALESCE(c.sort_order,0) AS source_sort,
           COALESCE(d.is_pinned,0) AS is_pinned,COALESCE(d.priority_rank,9999) AS priority_rank,COALESCE(d.notes,'') AS priority_notes
    FROM catalog_items c
    LEFT JOIN public_display_priorities d ON d.surface_key=? AND d.record_type='creation' AND d.record_id=c.catalog_item_id
    WHERE c.item_kind='creation' AND COALESCE(c.visible_public,1)=1 AND COALESCE(c.status,'active')='active'
    ORDER BY COALESCE(d.is_pinned,0) DESC,COALESCE(d.priority_rank,9999) ASC,COALESCE(c.sort_order,0) ASC,LOWER(c.name),c.catalog_item_id
    LIMIT 500`).bind(surface).all());
}

export async function onRequestGet(context){
  const access=await requireAdmin(context);if(access.error)return access.error;
  const surface=cleanSurface(new URL(context.request.url).searchParams.get('surface'));
  try{return json({ok:true,build:'264',surface,items:await loadItems(access.db,surface),surfaces:[
    {key:'home_featured',label:'Home — Featured workshop creations'},
    {key:'gallery',label:'Art / Gallery'},
    {key:'creations',label:'Creations'}
  ]});}
  catch(error){await captureRuntimeIncident(context.env,'public_display_order_get',error,{surface});return json({ok:false,error:'Could not load public display order.',detail:String(error?.message||error)},500);}
}

export async function onRequestPost(context){
  const access=await requireAdmin(context);if(access.error)return access.error;
  let body={};try{body=await context.request.json();}catch{}
  const surface=cleanSurface(body.surface);
  const items=Array.isArray(body.items)?body.items.slice(0,600):[];
  try{
    const statements=[];
    for(const item of items){
      const recordType=text(item.record_type,30).toLowerCase();
      const recordId=Math.max(0,int(item.record_id));
      if(!recordId||!['product','creation'].includes(recordType))continue;
      const rank=Math.max(1,Math.min(999999,int(item.priority_rank,9999)||9999));
      const pinned=Number(item.is_pinned)===1?1:0;
      statements.push(access.db.prepare(`INSERT INTO public_display_priorities(surface_key,record_type,record_id,priority_rank,is_pinned,notes,updated_by,updated_at)
        VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(surface_key,record_type,record_id) DO UPDATE SET priority_rank=excluded.priority_rank,is_pinned=excluded.is_pinned,notes=excluded.notes,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`)
        .bind(surface,recordType,recordId,rank,pinned,text(item.notes,500)||null,access.user.user_id));
    }
    if(statements.length)await access.db.batch(statements);
    return json({ok:true,build:'264',surface,items:await loadItems(access.db,surface),message:'Public display order saved.'});
  }catch(error){await captureRuntimeIncident(context.env,'public_display_order_save',error,{surface});return json({ok:false,error:'Could not save public display order.',detail:String(error?.message||error)},500);}
}
