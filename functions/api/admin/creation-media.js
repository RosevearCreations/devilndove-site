// Release 467 Build 201 — specialist Creation Image Editor authority.
// Exact creation-only image assignment. Managed public media can be selected or uploaded.
// A trusted repository fallback creation may be promoted one record at a time only when
// an authenticated operator explicitly assigns its image.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=201;
const FALLBACK_PATH='/data/itemsforsale/itemsforsale_items_master.json';
const BLOCKED_SOURCE_TYPES=new Set(['product','products','inventory','supply','supplies','tool','tools']);
const BLOCKED_PREFIXES=['products/','inventory/','supplies/','tools/','toolshed/'];
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const text=(v,max=500)=>normalizeText(v).slice(0,max);
const n=(v)=>Number(v||0);
const json=(data,status=200)=>jsonResponse({release:467,build:BUILD,...data},status,{'Cache-Control':'no-store'});

function slugify(value){
  return text(value,500).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function blockedKey(value){
  const key=text(value,1200).replace(/^\/+/, '').toLowerCase();
  return BLOCKED_PREFIXES.some(prefix=>key.startsWith(prefix));
}
function fallbackSourceKey(row={},index=0){
  return text(row.source_key||row.id||row.slug||slugify(row.name||row.title)||('creation-'+(index+1)),300);
}
function fallbackImageUrl(row={}){
  const direct=text(row.image_url||row.image||row.src,2000);
  if(direct)return direct;
  const key=text(row.r2_object_key||row.image_key,1200).replace(/^\/+/, '');
  if(key)return 'https://assets.devilndove.com/'+key.split('/').map(encodeURIComponent).join('/');
  const file=text(row.image_file,500);
  if(file)return 'https://assets.devilndove.com/Itemsforsale/'+encodeURIComponent(file);
  return text(row.fallback_image,2000);
}
function fallbackTarget(row,index){
  const key=fallbackSourceKey(row,index);
  return {
    catalog_item_id:null,
    source_key:key,
    name:text(row.name||row.title||key,500),
    slug:text(row.slug||slugify(row.name||row.title||key),500),
    category:text(row.category||row.section,300),
    subcategory:text(row.subcategory||row.type,300),
    item_type:text(row.item_type||row.type,300),
    image_url:fallbackImageUrl(row),
    updated_at:null,
    status:'fallback',
    visible_public:1,
    fallback_only:true,
    fallback_index:index,
  };
}
async function loadTrustedFallback(request,sourceKey){
  const wanted=text(sourceKey,300).toLowerCase();
  if(!wanted)return null;
  const response=await fetch(new URL(FALLBACK_PATH,request.url).toString(),{cf:{cacheTtl:0,cacheEverything:false}});
  if(!response.ok)throw new Error('Trusted creation fallback responded '+response.status+'.');
  const parsed=await response.json().catch(()=>null);
  const list=Array.isArray(parsed)?parsed:Array.isArray(parsed?.items)?parsed.items:[];
  for(let index=0;index<list.length;index++){
    const row=list[index]||{};
    const candidates=[fallbackSourceKey(row,index),text(row.id,300),text(row.source_key,300),text(row.slug,300)].filter(Boolean).map(v=>v.toLowerCase());
    if(candidates.includes(wanted))return {row,index,target:fallbackTarget(row,index)};
  }
  return null;
}
async function access(context){
  const user=await getAdminUserFromRequest(context.request,context.env);
  if(!user)return {error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  return {user,db};
}
async function loadTarget(db,{catalogId=0,sourceKey=''}={}){
  if(catalogId>0)return db.prepare(`
    SELECT catalog_item_id,source_key,name,slug,category,subcategory,item_type,image_url,updated_at,status,visible_public
    FROM catalog_items WHERE catalog_item_id=? AND LOWER(TRIM(COALESCE(item_kind,'')))='creation' LIMIT 1
  `).bind(catalogId).first();
  const key=text(sourceKey,300);
  if(!key)return null;
  return db.prepare(`
    SELECT catalog_item_id,source_key,name,slug,category,subcategory,item_type,image_url,updated_at,status,visible_public
    FROM catalog_items WHERE LOWER(TRIM(COALESCE(item_kind,'')))='creation' AND LOWER(TRIM(COALESCE(source_key,'')))=LOWER(TRIM(?)) LIMIT 1
  `).bind(key).first();
}
async function mediaPage(db,{q='',beforeId=0,limit=48}={}){
  const needle=text(q,120).toLowerCase(),like=`%${needle}%`,safeLimit=Math.max(1,Math.min(72,Math.trunc(n(limit)||48)));
  const result=await db.prepare(`
    SELECT ma.media_asset_id,ma.object_key,ma.public_url,ma.original_filename,ma.mime_type,ma.width_px,ma.height_px,ma.updated_at,
           mm.display_name,mm.alt_text,mm.media_type,mm.source_type,mm.archived_at
    FROM media_assets ma
    LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id
    WHERE ma.deleted_at IS NULL AND ma.product_id IS NULL AND COALESCE(ma.public_url,'')<>''
      AND (?=0 OR ma.media_asset_id<?)
      AND mm.archived_at IS NULL
      AND LOWER(COALESCE(mm.media_type,'photo'))<>'product'
      AND LOWER(COALESCE(mm.source_type,'')) NOT IN ('product','products','inventory','supply','supplies','tool','tools')
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'products/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'inventory/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'supplies/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'tools/%'
      AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'toolshed/%'
      AND (?='' OR LOWER(COALESCE(mm.display_name,'')) LIKE ? OR LOWER(COALESCE(ma.original_filename,'')) LIKE ? OR LOWER(COALESCE(ma.object_key,'')) LIKE ? OR LOWER(COALESCE(mm.alt_text,'')) LIKE ?)
    ORDER BY ma.media_asset_id DESC LIMIT ?
  `).bind(beforeId,beforeId,needle,like,like,like,like,safeLimit+1).all();
  const all=rows(result),visible=all.slice(0,safeLimit);
  return {
    media:visible.map(r=>({...r,media_asset_id:n(r.media_asset_id),width_px:r.width_px==null?null:n(r.width_px),height_px:r.height_px==null?null:n(r.height_px),display_name:r.display_name||r.original_filename||r.object_key})),
    has_more:all.length>safeLimit,
    next_before_id:all.length>safeLimit&&visible.length?n(visible[visible.length-1].media_asset_id):null
  };
}
async function loadMedia(db,id){
  return db.prepare(`
    SELECT ma.media_asset_id,ma.object_key,ma.public_url,ma.product_id,ma.deleted_at,
           mm.source_type,mm.media_type,mm.archived_at,mm.display_name,mm.alt_text
    FROM media_assets ma LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id
    WHERE ma.media_asset_id=? LIMIT 1
  `).bind(id).first();
}
function mediaAllowed(row){
  if(!row||row.deleted_at||row.product_id!=null||row.archived_at||!text(row.public_url,2000))return false;
  if(blockedKey(row.object_key))return false;
  if(BLOCKED_SOURCE_TYPES.has(text(row.source_type,100).toLowerCase()))return false;
  if(text(row.media_type,100).toLowerCase()==='product')return false;
  return true;
}
function identityFrom(urlOrBody){
  return {catalogId:Math.max(0,Math.trunc(n(urlOrBody.catalog_item_id||urlOrBody.catalogId))),sourceKey:text(urlOrBody.source_key||urlOrBody.sourceKey,300)};
}
async function promoteTrustedFallback(context,db,user,fallback,media){
  const row=fallback.row||{},target=fallback.target,sourceKey=target.source_key;
  const sourceJson=JSON.stringify(row);
  const result=await db.prepare(`
    INSERT INTO catalog_items (
      item_kind,source_key,slug,name,category,subcategory,item_type,
      short_description,notes,image_url,r2_object_key,
      quantity_on_hand,reorder_point,visible_public,status,sort_order,
      source_record_json,source_json_path,created_at,updated_at
    ) VALUES ('creation',?,?,?,?,?,?,?,?,?,?,0,0,1,'active',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(item_kind,source_key) DO NOTHING
  `).bind(
    sourceKey,
    target.slug||null,
    target.name,
    target.category||null,
    target.subcategory||null,
    target.item_type||null,
    text(row.description||row.short_description,2000)||null,
    text(row.notes||row.caption||row.description||row.alt,3000)||null,
    text(media.public_url,2000),
    text(row.r2_object_key||row.image_key,1200)||null,
    Math.max(0,Math.trunc(n(row.sort_order||fallback.index))),
    sourceJson,
    FALLBACK_PATH
  ).run();
  if(n(result?.meta?.changes)!==1){
    const concurrent=await loadTarget(db,{sourceKey});
    throw Object.assign(new Error(concurrent?'This fallback creation was promoted by another change. Reload before assigning its image.':'The fallback creation could not be promoted.'),{status:409,code:'creation_fallback_promotion_conflict'});
  }
  const saved=await loadTarget(db,{sourceKey});
  if(!saved||text(saved.image_url,2000)!==text(media.public_url,2000))throw new Error('Fallback creation promotion could not be verified.');
  await auditAdminAction(context.env,context.request,user,{
    action_type:'creation_catalog_promoted_from_fallback',
    target_type:'catalog_creation',
    target_id:n(saved.catalog_item_id),
    target_key:sourceKey,
    details:{fallback_path:FALLBACK_PATH,media_asset_id:n(media.media_asset_id),new_image_url:text(media.public_url,2000)}
  });
  return saved;
}

export async function onRequestGet(context){
  const granted=await access(context);if(granted.error)return granted.error;
  const url=new URL(context.request.url),identity=identityFrom(Object.fromEntries(url.searchParams.entries()));
  try{
    let target=await loadTarget(granted.db,identity),catalogSource='live_catalog';
    if(!target&&identity.sourceKey){
      const fallback=await loadTrustedFallback(context.request,identity.sourceKey);
      if(fallback){target=fallback.target;catalogSource='trusted_json_fallback';}
    }
    if(!target)return json({ok:false,code:'creation_target_missing',error:'This creation could not be resolved from either the live catalog or the trusted fallback list.'},404);
    const library=await mediaPage(granted.db,{q:url.searchParams.get('q'),beforeId:url.searchParams.get('before_id'),limit:url.searchParams.get('limit')});
    return json({ok:true,mutation_capability:'explicit_creation_image_only',catalog_source:catalogSource,target:{...target,catalog_item_id:target.catalog_item_id?n(target.catalog_item_id):null},...library});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'creation_media',incident_code:'creation_media_read_failed',severity:'warning',message:'Creation image editor could not load.',details:{error:text(error?.message,500)}});
    return json({ok:false,error:'Creation image editor could not load.',detail:text(error?.message,500)},500);
  }
}

export async function onRequestPost(context){
  const granted=await access(context);if(granted.error)return granted.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'A JSON request body is required.'},400);}
  if(text(body.action,60)!=='assign_media')return json({ok:false,error:'Unsupported Creation Image action.'},400);
  const identity=identityFrom(body),mediaId=Math.max(0,Math.trunc(n(body.media_asset_id))),expected=text(body.expected_updated_at,120);
  if(mediaId<=0)return json({ok:false,error:'Choose a managed image first.'},400);
  try{
    let target=await loadTarget(granted.db,identity),promotedFromFallback=false;
    const media=await loadMedia(granted.db,mediaId);
    if(!mediaAllowed(media))return json({ok:false,error:'That image belongs to another specialist workflow, is archived/deleted, or has no public URL.'},409);

    if(!target){
      const fallback=await loadTrustedFallback(context.request,identity.sourceKey);
      if(!fallback)return json({ok:false,code:'creation_target_missing',error:'The selected creation no longer exists in the live catalog or trusted fallback list. Nothing was changed.'},404);
      target=await promoteTrustedFallback(context,granted.db,granted.user,fallback,media);
      promotedFromFallback=true;
    }else{
      const current=text(target.updated_at,120);
      if(expected&&expected!==current)return json({ok:false,code:'creation_image_stale_target',error:'This creation changed after the editor opened. Reload it before assigning an image.',current_updated_at:current},409);
      const oldUrl=text(target.image_url,2000);
      const save=await granted.db.prepare(`
        UPDATE catalog_items SET image_url=?,updated_at=CURRENT_TIMESTAMP
        WHERE catalog_item_id=? AND LOWER(TRIM(COALESCE(item_kind,'')))='creation'
      `).bind(text(media.public_url,2000),n(target.catalog_item_id)).run();
      if(n(save?.meta?.changes)!==1)return json({ok:false,error:'The creation image was not changed. Reload before retrying.'},409);
      const saved=await loadTarget(granted.db,{catalogId:n(target.catalog_item_id)});
      if(text(saved?.image_url,2000)!==text(media.public_url,2000))return json({ok:false,error:'The new creation image could not be verified after save.'},409);
      target=saved;
      await auditAdminAction(context.env,context.request,granted.user,{action_type:'creation_image_assignment',target_type:'catalog_creation',target_id:n(target.catalog_item_id),target_key:text(target.source_key,300),details:{old_image_url:oldUrl||null,new_image_url:text(media.public_url,2000),media_asset_id:mediaId,promoted_from_fallback:false}});
    }

    return json({ok:true,message:promotedFromFallback?'Fallback creation promoted to the live catalog and its image saved and verified.':'Creation image saved and verified.',promoted_from_fallback:promotedFromFallback,target:{...target,catalog_item_id:n(target.catalog_item_id)},media_asset_id:mediaId});
  }catch(error){
    const status=Math.max(400,Math.min(599,n(error?.status)||500));
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'creation_media',incident_code:text(error?.code,120)||'creation_media_assign_failed',severity:status>=500?'error':'warning',message:'Creation image assignment failed.',details:{error:text(error?.message,500),media_asset_id:mediaId}});
    return json({ok:false,code:text(error?.code,120)||'creation_media_assign_failed',error:text(error?.message,500)||'Creation image assignment failed. Nothing should be treated as changed until verification succeeds.'},status);
  }
}
