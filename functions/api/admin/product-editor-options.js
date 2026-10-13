// Build 389: explicit lazy option choices; never introspect schema or mutate catalog/tax classes.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {BASE_CATEGORIES,BASE_SHIPPING_CODES} from './_lib/productFieldChoices389.js';
const json=(body,status=200)=>jsonResponse(body,status,{'Cache-Control':'no-store'});
function admin(context){const user=context?.data?.ddModuleAccess?.user;return user&&String(user.role||'').toLowerCase()==='admin';}
function rows(result,key,max){return (result?.results||[]).map(row=>String(row[key]||'').trim()).filter(Boolean).slice(0,max);}
export async function onRequestGet(context){
 if(!admin(context))return json({ok:false,error:'Admin permission required'},401);
 const db=getDb(context.env);if(!db)return json({ok:false,error:'Database unavailable'},503);
 try{
  const [cat,ship,tax]=await Promise.all([
   db.prepare(`SELECT DISTINCT product_category AS value FROM products WHERE TRIM(COALESCE(product_category,''))<>'' ORDER BY value COLLATE NOCASE LIMIT 100`).all(),
   db.prepare(`SELECT DISTINCT shipping_code AS value FROM products WHERE TRIM(COALESCE(shipping_code,''))<>'' ORDER BY value COLLATE NOCASE LIMIT 60`).all(),
   db.prepare(`SELECT tax_class_id,name,code,tax_rate,is_active FROM tax_classes ORDER BY COALESCE(is_active,0) DESC,name COLLATE NOCASE,tax_class_id LIMIT 80`).all()
  ]);
  const merge=(base,prior,max)=>[...new Set([...base,...prior])].slice(0,max);
  return json({ok:true,build:389,categories:merge(BASE_CATEGORIES,rows(cat,'value',100),120),
   shipping_codes:merge(BASE_SHIPPING_CODES,rows(ship,'value',60),80),
   tax_classes:(tax?.results||[]).map(row=>({tax_class_id:Number(row.tax_class_id),name:String(row.name||row.code||row.tax_class_id),
    code:String(row.code||''),tax_rate:Number(row.tax_rate)||0,is_active:Number(row.is_active)||0})),
   count_read_only:true,does_not_assign_shipping_rates:true});
 }catch{return json({ok:false,error:'Cannot load validated Product options. Save is not blocked for previously loaded legacy values.'},503);}
}
