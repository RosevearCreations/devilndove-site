// Release 467 Build 165 — bounded image recovery for the visible Product Browser page.
// Reads only product_images rows belonging to explicitly supplied Product ids. No R2 listing,
// no media library scan, no readiness/quality work, no background refresh.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

const MAX_IDS=16;
function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Read-Contract':'product-browser-images-v165',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function measuredRows(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:null;}

export async function onRequestPost(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const ids=[...new Set((Array.isArray(body.product_ids)?body.product_ids:[]).map(Number).filter((id)=>Number.isInteger(id)&&id>0))].slice(0,MAX_IDS);
  if(!ids.length)return json({ok:true,images_by_product:{},product_ids:[],delivery:'product-browser-images-v165',d1_rows_read:0});
  const placeholders=ids.map(()=>'?').join(',');
  try{
    const result=await db.prepare(`SELECT product_id,product_image_id,image_url,alt_text,sort_order FROM product_images WHERE product_id IN (${placeholders}) ORDER BY product_id ASC,COALESCE(sort_order,0) ASC,product_image_id ASC LIMIT ?`).bind(...ids,MAX_IDS*12).all();
    const rows=Array.isArray(result?.results)?result.results:[];const imagesByProduct={};
    for(const row of rows){const id=Number(row.product_id||0);if(!id||imagesByProduct[id])continue;imagesByProduct[id]={product_image_id:Number(row.product_image_id||0),image_url:String(row.image_url||''),alt_text:String(row.alt_text||''),sort_order:Number(row.sort_order||0)};}
    const rowsRead=measuredRows(result);
    return json({ok:true,images_by_product:imagesByProduct,product_ids:ids,delivery:'product-browser-images-v165',read_policy:'visible_product_ids_only',r2_listing:false,d1_rows_read:rowsRead},200,rowsRead==null?{}:{'X-DD-D1-Rows-Read':String(rowsRead)});
  }catch(error){
    const message=String(error?.message||'Product browser image read failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. Product images will not retry automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_browser_images_failed',retry_automatically:false},quota?503:500);
  }
}
