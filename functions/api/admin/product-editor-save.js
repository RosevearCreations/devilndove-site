// Release 467 Build 175 — explicit zero-introspection Product Editor save authority.
// Updates one Product and its one SEO row through the proven Product/SEO schema contract.
// No request-time PRAGMA/schema discovery, media sync, readiness scan, inventory scan,
// content-project creation, provider execution, or background retry is performed.
import { auditAdminAction, getDb, jsonResponse } from '../_lib/adminAudit.js';

const PRODUCT_FIELDS = Object.freeze([
  'name','slug','sku','product_category','color_name','color_names_json','shipping_code','review_status',
  'short_description','description','product_type','status','price_cents','compare_at_price_cents','currency',
  'taxable','tax_class_id','requires_shipping','weight_grams','inventory_tracking','inventory_quantity',
  'digital_file_url','featured_image_url','sort_order','merchandise_origin','sale_channel','external_listing_url',
  'external_listing_label','condition_summary','era_label','sourcing_notes'
]);
async function validate389(db,category,shipping){
 const allowedCat=['jewelry','earrings','necklaces','bracelets','rings','pendants','charms','keychains','accessories','candles','home decor','artwork','collectibles','craft supplies','tools','other'];
 const allowedShip=['standard','tracked','letter_mail','local_pickup','oversize','digital_delivery'];
 const known=async(col,v)=>Boolean(v&&(await db.prepare(`SELECT 1 AS found FROM products WHERE LOWER(${col})=LOWER(?) LIMIT 1`).bind(v).first())?.found);
 if(category&&!allowedCat.includes(category.toLowerCase())&&!(await known('product_category',category)))
  return 'Select an existing or approved Product category.';
 if(shipping&&!allowedShip.includes(shipping.toLowerCase())&&!(await known('shipping_code',shipping)))
  return 'Select a configured shipping code or leave it blank.';
 return '';
}
const SEO_FIELDS = Object.freeze(['meta_title','meta_description','keywords','h1_override','canonical_url','og_title','og_description','og_image_url']);
const PRODUCT_UPDATE_SQL=`UPDATE products SET ${PRODUCT_FIELDS.map((key)=>`${key}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE product_id=?`;
const SEO_UPSERT_SQL=`INSERT INTO product_seo (product_id,${SEO_FIELDS.join(',')},created_at,updated_at) VALUES (?,${SEO_FIELDS.map(()=>'?').join(',')},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(product_id) DO UPDATE SET ${SEO_FIELDS.map((key)=>`${key}=excluded.${key}`).join(',')},updated_at=CURRENT_TIMESTAMP`;

function json(data,status=200,headers={}){return jsonResponse(data,status,{'Cache-Control':'no-store','X-DD-D1-Write-Contract':'single-product-save-v175',...headers});}
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
function productPayload(body){
  const colorName=nullable(body.color_name,80);
  return {
    name:text(body.name,160),slug:normalizeSlug(body.slug||body.name),sku:nullable(body.sku,80),product_category:nullable(body.product_category,120),
    color_name:colorName,color_names_json:JSON.stringify(normalizeColors(body.color_names??body.color_names_text,colorName||'')),shipping_code:nullable(body.shipping_code,80),
    review_status:text(body.review_status||'pending_review',40).toLowerCase(),short_description:nullable(body.short_description,1500),description:nullable(body.description,12000),
    product_type:text(body.product_type||'physical',40).toLowerCase(),status:text(body.status||'draft',40).toLowerCase(),price_cents:nonNegativeInt(body.price_cents,0),
    compare_at_price_cents:intOrNull(body.compare_at_price_cents),currency:text(body.currency||'CAD',8).toUpperCase(),taxable:Number(body.taxable)===0?0:1,
    tax_class_id:intOrNull(body.tax_class_id),requires_shipping:Number(body.requires_shipping)===1?1:0,weight_grams:intOrNull(body.weight_grams),
    inventory_tracking:Number(body.inventory_tracking)===1?1:0,inventory_quantity:nonNegativeInt(body.inventory_quantity,0),digital_file_url:nullable(body.digital_file_url,2048),
    featured_image_url:nullable(body.featured_image_url,2048),sort_order:nonNegativeInt(body.sort_order,0),merchandise_origin:text(body.merchandise_origin||'handmade',40).toLowerCase(),
    sale_channel:text(body.sale_channel||'onsite',40).toLowerCase(),external_listing_url:nullable(body.external_listing_url,2048),external_listing_label:nullable(body.external_listing_label,160),
    condition_summary:nullable(body.condition_summary,500),era_label:nullable(body.era_label,160),sourcing_notes:nullable(body.sourcing_notes,4000)
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
  // Build390: reject malformed/out-of-range cents BEFORE running any Product update.
  const submitted=Number(body.price_cents),compare=body.compare_at_price_cents==null?null:Number(body.compare_at_price_cents);
  if(!Number.isSafeInteger(submitted)||submitted<0||submitted>999999999||compare!==null&&(!Number.isSafeInteger(compare)||compare<0||compare>999999999))
    return json({ok:false,error:'Price must be submitted as valid non-negative CAD cents; no Product fields were changed.',code:'invalid_price_cents'},400);
  if(submitted===0&&body.confirm_zero_price!==true)
    return json({ok:false,error:'A zero-dollar Product requires explicit confirmation. No Product fields were changed.',code:'zero_price_not_confirmed'},400);
  const payload=productPayload(body);const choiceError=await validate389(db,payload.product_category,payload.shipping_code);if(choiceError)return json({ok:false,error:choiceError,code:'product_choice_invalid'},400);if(!payload.name)return json({ok:false,error:'Product name is required.'},400);if(!payload.slug)return json({ok:false,error:'A valid slug is required.'},400);
  try{
    let measured=0;
    const productValues=PRODUCT_FIELDS.map((key)=>payload[key]);
    const update=await db.prepare(PRODUCT_UPDATE_SQL).bind(...productValues,productId).run();measured+=rowsRead(update);
    if(Number(update?.meta?.changes||0)<1)return json({ok:false,error:'Product was not found or could not be updated.'},404);

    const seo=seoPayload(body);const seoValues=SEO_FIELDS.map((key)=>seo[key]);
    const seoResult=await db.prepare(SEO_UPSERT_SQL).bind(productId,...seoValues).run();measured+=rowsRead(seoResult);

    const check=await db.prepare('SELECT name,short_description,description,product_category,inventory_quantity,price_cents,compare_at_price_cents,currency FROM products WHERE product_id=? LIMIT 1').bind(productId).all();
    measured+=rowsRead(check);
    const saved=Array.isArray(check?.results)?check.results[0]:null;
    const priceConfirmed=Boolean(saved&&Number(saved.price_cents)===submitted&&
      (saved.compare_at_price_cents==null?null:Number(saved.compare_at_price_cents))===compare&&String(saved.currency||'').toUpperCase()===payload.currency);
    if(!priceConfirmed)return json({ok:false,error:'Stored Product price could not be confirmed. Check the Product record before another write.',code:'product_price_readback_unconfirmed',retry_automatically:false},409);
    const fieldsConfirmed=Boolean(saved&&['name','short_description','description','product_category','inventory_quantity']
      .every(key=>String(saved[key]??'')===String(payload[key]??'')));
    if(!fieldsConfirmed)return json({ok:false,error:'Product fields did not match the saved record. Press Retry load and compare the server copy before any additional write. Nothing was sent to Etsy.',code:'product_fields_readback_unconfirmed',retry_automatically:false},409);
    if(typeof context.waitUntil==='function')context.waitUntil(auditAdminAction(context.env,context.request,admin,{action_type:'update_product_low_read',target_type:'product',target_id:productId,target_key:payload.name,details:{build:175,fields:PRODUCT_FIELDS.length,seo_saved:true,schema_introspection_reads:0}}).catch(()=>null));
    return json({ok:true,product_id:productId,message:'Product saved and important Product fields read back from D1.',delivery:'single-product-save-v175',saved_fields:PRODUCT_FIELDS.length,seo_saved:true,price_cents_confirmed:true,product_fields_confirmed:true,price_cents:submitted,compare_at_price_cents:compare,currency:payload.currency,schema_introspection_reads:0,d1_rows_read:measured,background_work_started:false,media_sync_started:false,readiness_scan_started:false},200,{'X-DD-D1-Rows-Read':String(measured)});
  }catch(error){
    const message=String(error?.message||'Product save failed.');const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'D1 read capacity is temporarily unavailable. The Product save was not retried automatically.':message,code:quota?'d1_read_capacity_unavailable':'product_editor_save_failed',retry_automatically:false},quota?503:500);
  }
}
