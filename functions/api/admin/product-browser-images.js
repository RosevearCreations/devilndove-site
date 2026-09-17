// Release 467 Build 170 — explicit single-Product fallback image recovery.
// The Product Browser already owns featured_image_url from its bounded page query, so this endpoint
// never re-reads products. It runs only after an explicit operator action and checks one Product's
// existing secondary image authorities. No R2 listing, catalog scan, readiness/quality work or retry.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

const MAX_IDS=1;
function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-browser-images-v170-explicit',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function measuredRows(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}
function clean(value){return String(value||'').trim();}
function add(images,id,url,source,extra={}){const productId=Number(id||0),imageUrl=clean(url);if(!productId||!imageUrl||images[productId])return;images[productId]={image_url:imageUrl,source,...extra};}

export async function onRequestPost(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  if(body.operator_triggered!==true)return json({ok:false,error:'Product photo recovery requires an explicit operator action.',code:'operator_action_required'},400);
  if(body.featured_missing_only!==true)return json({ok:false,error:'Product photo recovery is limited to Products whose page row has no featured image.',code:'missing_featured_only_required'},400);
  const ids=[...new Set((Array.isArray(body.product_ids)?body.product_ids:[]).map(Number).filter((id)=>Number.isInteger(id)&&id>0))].slice(0,MAX_IDS);
  if(ids.length!==1)return json({ok:false,error:'Exactly one Product may be checked per explicit photo recovery action.',code:'single_product_required'},400);
  const images={};let rowsRead=0;const warnings=[];
  try{
    const missing=()=>ids.filter((id)=>!images[id]);
    let remaining=missing();
    if(remaining.length){
      const marks=remaining.map(()=>'?').join(',');
      try{const result=await db.prepare(`SELECT product_id,product_image_id,image_url,alt_text,sort_order FROM product_images WHERE product_id IN (${marks}) AND TRIM(COALESCE(image_url,''))<>'' ORDER BY product_id ASC,COALESCE(sort_order,0) ASC,product_image_id ASC LIMIT ?`).bind(...remaining,remaining.length*12).all();rowsRead+=measuredRows(result);for(const row of result?.results||[])add(images,row.product_id,row.image_url,'gallery',{product_image_id:Number(row.product_image_id||0),alt_text:clean(row.alt_text)});}catch(error){warnings.push(`product_images:${clean(error?.message).slice(0,120)}`);}
    }

    remaining=missing();
    if(remaining.length){
      const marks=remaining.map(()=>'?').join(',');
      try{const result=await db.prepare(`SELECT product_id,product_image_id,image_url,role_key FROM product_media_role_assignments WHERE product_id IN (${marks}) AND COALESCE(assignment_status,'assigned')='assigned' AND TRIM(COALESCE(image_url,''))<>'' ORDER BY product_id ASC,CASE WHEN role_key='hero_front' THEN 0 ELSE 1 END,product_media_role_assignment_id ASC LIMIT ?`).bind(...remaining,remaining.length*12).all();rowsRead+=measuredRows(result);for(const row of result?.results||[])add(images,row.product_id,row.image_url,'media role',{product_image_id:Number(row.product_image_id||0),role_key:clean(row.role_key)});}catch(error){warnings.push(`media_roles:${clean(error?.message).slice(0,120)}`);}
    }

    remaining=missing();
    if(remaining.length){
      const marks=remaining.map(()=>'?').join(',');
      try{const result=await db.prepare(`SELECT product_id,media_asset_id,public_url,variant_role,sort_order FROM media_assets WHERE product_id IN (${marks}) AND TRIM(COALESCE(public_url,''))<>'' AND deleted_at IS NULL ORDER BY product_id ASC,COALESCE(sort_order,0) ASC,media_asset_id ASC LIMIT ?`).bind(...remaining,remaining.length*12).all();rowsRead+=measuredRows(result);for(const row of result?.results||[])add(images,row.product_id,row.public_url,'media asset',{media_asset_id:Number(row.media_asset_id||0),variant_role:clean(row.variant_role)});}catch(error){warnings.push(`media_assets:${clean(error?.message).slice(0,120)}`);}
    }

    return json({ok:true,images_by_product:images,product_ids:ids,delivery:'product-browser-images-v170-explicit',read_policy:'operator_triggered_single_product_missing_featured_secondary_only',source_order:['gallery','media role','media asset'],requested_missing_featured:1,recovered_count:Object.keys(images).length,automatic:false,max_product_ids:MAX_IDS,product_table_read:false,r2_listing:false,warnings,d1_rows_read:rowsRead},200,{'X-DD-D1-Rows-Read':String(rowsRead)});
  }catch(error){
    const message=String(error?.message||'Product browser image read failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Product images will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_browser_images_failed',retry_automatically:false},quota?503:500);
  }
}