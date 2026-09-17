// Release 467 Build 163 — explicit low-read Product Editor save authority.
// This path updates one Product and its one SEO row only. It deliberately does not
// sync media, run readiness, scan inventory/resources, create content projects, or queue social work.
import { auditAdminAction, getDb, jsonResponse } from '../_lib/adminAudit.js';

const PRODUCT_FIELDS = Object.freeze([
  'name','slug','sku','product_category','color_name','color_names_json','shipping_code','review_status',
  'short_description','description','product_type','status','price_cents','compare_at_price_cents','currency',
  'taxable','tax_class_id','requires_shipping','weight_grams','inventory_tracking','inventory_quantity',
  'digital_file_url','featured_image_url','sort_order','merchandise_origin','sale_channel','external_listing_url',
  'external_listing_label','condition_summary','era_label','sourcing_notes'
]);
const SEO_FIELDS = Object.freeze(['meta_title','meta_description','keywords','h1_override','canonical_url','og_title','og_description','og_image_url']);
const columnCache = new Map();

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Write-Contract':'single-product-save-v163',...headers});}
function adminFromContext(context){const user=context?.data?.ddModuleAccess?.user||null;return user&&String(user.role||'').toLowerCase()==='admin'?user:null;}
function text(value,max=0){const v=String(value??'').trim();return max>0?v.slice(0,max):v;}
function nullable(value,max=0){const v=text(value,max);return v||null;}
function intOrNull(value){if(value==null||value==='')return null;const n=Number(value);return Number.isFinite(n)?Math.trunc(n):null;}
function nonNegativeInt(value,fallback=0){const n=intOrNull(value);return n==null?fallback:Math.max(0,n);}
function normalizeSlug(value){return text(value,180).toLowerCase().replace(/["']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function normalizeColors(value,fallback=''){
  const rows=[];
  const push=(entry)=>{const clean=text(entry,80);if(clean&&!rows.some((item)=>item.toLowerCase()===clean.toLowerCase()))rows.push(clean);};
  push(fallback);
  if(Array.isArray(value))value.forEach(push);else text(value,1000).split(/[\r\n,|/]+/g).forEach(push);
  return rows.slice(0,12);
}
function rowsRead(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}
async function columns(db,table){
  if(columnCache.has(table))return columnCache.get(table);
  const promise=db.prepare(`PRAGMA table_info(${table})`).all().then((result)=>({set:new Set((result?.results||[]).map((row)=>String(row?.name||'').trim()).filter(Boolean)),rows_read:rowsRead(result)})).catch(()=>({set:new Set(),rows_read:0}));
  columnCache.set(table,promise);return promise;
}
function productPayload(body){
  const colorName=nullable(body.color_name,80);
  return {
    name:text(body.name,160), slug:normalizeSlug(body.slug||body.name), sku:nullable(body.sku,80), product_category:nullable(body.product_category,120),
    color_name:colorName, color_names_json:JSON.stringify(normalizeColors(body.color_names??body.color_names_text,colorName||'')), shipping_code:nullable(body.shipping_code,80),
    review_status:text(body.review_status||'pending_review',40).toLowerCase(), short_description:nullable(body.short_description,1500), description:nullable(body.description,12000),
    product_type:text(body.product_type||'physical',40).toLowerCase(), status:text(body.status||'draft',40).toLowerCase(), price_cents:nonNegativeInt(body.price_cents,0),
    compare_at_price_cents:intOrNull(body.compare_at_price_cents), currency:text(body.currency||'CAD',8).toUpperCase(), taxable:Number(body.taxable)===0?0:1,
    tax_class_id:intOrNull(body.tax_class_id), requires_shipping:Number(body.requires_shipping)===1?1:0, weight_grams:intOrNull(body.weight_grams),
    inventory_tracking:Number(body.inventory_tracking)===1?1:0, inventory_quantity:nonNegativeInt(body.inventory_quantity,0), digital_file_url:nullable(body.digital_file_url,2048),
    featured_image_url:nullable(body.featured_image_url,2048), sort_order:nonNegativeInt(body.sort_order,0), merchandise_origin:text(body.merchandise_origin||'handmade',40).toLowerCase(),
    sale_channel:text(body.sale_channel||'onsite',40).toLowerCase(), external_listing_url:nullable(body.external_listing_url,2048), external_listing_label:nullable(body.external_listing_label,160),
    condition_summary:nullable(body.condition_summary,500), era_label:nullable(body.era_label,160), sourcing_notes:nullable(body.sourcing_notes,4000)
  };
}
function seoPayload(body){
  return {
    meta_title:nullable(body.meta_title,160),meta_description:nullable(body.meta_description,500),keywords:nullable(body.keywords,1000),h1_override:nullable(body.h1_override,160),
    canonical_url:nullable(body.canonical_url,2048),og_title:nullable(body.og_title,160),og_description:nullable(body.og_description,500),og_image_url:nullable(body.og_image_url,2048)
  };
}

export async function onRequestPost(context){
  const admin=adminFromContext(context);if(!admin)return json({ok:false,error:'Administrator authorization was not established by the route guard.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const productId=Number(body.product_id);if(!Number.isInteger(productId)||productId<=0)return json({ok:false,error:'A valid product_id is required.'},400);
  const payload=productPayload(body);if(!payload.name)return json({ok:false,error:'Product name is required.'},400);if(!payload.slug)return json({ok:false,error:'A valid slug is required.'},400);
  try{
    let measured=0;
    const productSchema=await columns(db,'products');measured+=productSchema.rows_read;
    const assignments=[];const bindings=[];
    for(const key of PRODUCT_FIELDS){if(!productSchema.set.has(key))continue;assignments.push(`${key}=?`);bindings.push(payload[key]);}
    if(productSchema.set.has('updated_at'))assignments.push('updated_at=CURRENT_TIMESTAMP');
    if(!assignments.length)return json({ok:false,error:'No editable Product columns are available.'},500);
    const update=await db.prepare(`UPDATE products SET ${assignments.join(',')} WHERE product_id=?`).bind(...bindings,productId).run();measured+=rowsRead(update);
    if(Number(update?.meta?.changes||0)<1)return json({ok:false,error:'Product was not found or could not be updated.'},404);

    let seoSaved=false;
    const seoSchema=await columns(db,'product_seo');measured+=seoSchema.rows_read;
    if(seoSchema.set.has('product_id')){
      const seo=seoPayload(body);const fields=SEO_FIELDS.filter((key)=>seoSchema.set.has(key));
      if(fields.length){
        const cols=['product_id',...fields];const values=[productId,...fields.map((key)=>seo[key])];
        if(seoSchema.set.has('updated_at')){
          const sql=`INSERT INTO product_seo (${cols.join(',')}${seoSchema.set.has('created_at')?',created_at,updated_at':',updated_at'}) VALUES (${cols.map(()=>'?').join(',')}${seoSchema.set.has('created_at')?',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP':',CURRENT_TIMESTAMP'}) ON CONFLICT(product_id) DO UPDATE SET ${fields.map((key)=>`${key}=excluded.${key}`).join(',')},updated_at=CURRENT_TIMESTAMP`;
          const result=await db.prepare(sql).bind(...values).run();measured+=rowsRead(result);seoSaved=true;
        }else{
          const sql=`INSERT INTO product_seo (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')}) ON CONFLICT(product_id) DO UPDATE SET ${fields.map((key)=>`${key}=excluded.${key}`).join(',')}`;
          const result=await db.prepare(sql).bind(...values).run();measured+=rowsRead(result);seoSaved=true;
        }
      }
    }

    if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'update_product_low_read',target_type:'product',target_id:productId,target_key:payload.name,details:{build:163,fields:assignments.length,seo_saved:seoSaved}}).catch(()=>null));
    return json({ok:true,product_id:productId,message:'Product saved through the low-read editor path.',delivery:'single-product-save-v163',saved_fields:assignments.length,seo_saved:seoSaved,d1_rows_read:measured,background_work_started:false,media_sync_started:false,readiness_scan_started:false},200,{'X-DD-D1-Rows-Read':String(measured)});
  }catch(error){
    const message=String(error?.message||'Product save failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. The Product save was not retried automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_editor_save_failed',retry_automatically:false},quota?503:500);
  }
}
