// Build 398 — explicit, bounded, authenticated Product choices for Etsy operator testing.
// Search by product category, name, SKU or slug. Single D1 read on button press; no writes or paging scans.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const out=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-Etsy-Product-Picker':'manual-50'});
export async function onRequestGet(context){
 const admin=verifiedAdminFromModule(context);
 if(!admin)return out({ok:false,error:'Admin access required.'},401);
 const db=getDb(context.env);
 if(!db)return out({ok:false,error:'Database unavailable.'},503);
 const url=new URL(context.request.url),q=String(url.searchParams.get('q')||'').trim().slice(0,70);
 // Escape SQL LIKE wildcards supplied by the operator, do not interpolate user values into SQL.
 const contains='%'+q.replace(/[\\%_]/g,'\\$&')+'%';
 const limit=50;
 const sql="SELECT product_id,sku,name,product_category,price_cents,currency,inventory_quantity "+
  "FROM products "+(q?"WHERE name LIKE ? ESCAPE '\\' COLLATE NOCASE "+
   "OR sku LIKE ? ESCAPE '\\' COLLATE NOCASE "+
   "OR product_category LIKE ? ESCAPE '\\' COLLATE NOCASE ":"")+
  "ORDER BY product_id DESC LIMIT ?";
 try{
  const result=await db.prepare(sql).bind(...(q?[contains,contains,contains]:[]),limit+1).all();
  const rows=Array.isArray(result?.results)?result.results:[];
  return out({ok:true,products:rows.slice(0,limit).map(row=>({
   product_id:Number(row.product_id),name:String(row.name||'').slice(0,140),
   sku:String(row.sku||'').slice(0,80),product_category:String(row.product_category||'').slice(0,70),
   price_cents:Number(row.price_cents),currency:String(row.currency||''),
   inventory_quantity:Number(row.inventory_quantity||0)})),
   has_more:rows.length>limit,limit,search_scope:'name_sku_product_category',read_only:true,
   provider_calls_performed:false,automatic_paging:false});
 }catch{return out({ok:false,error:'Product choices are unavailable; no automatic retry.',retry_automatically:false},503);}
}
