// Build 406 — checked canonical media mapping and distribution policy for existing source Products.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {readCanonicalDistributionGallery} from '../_lib/canonicalDistributionGallery436.mjs';
import {outboundChannel,productIdValid,ownerKeyValid,imageSelectionValid,allowedImage,
 reviewedSourceSignature,reviewEvidence,auditJSON} from '../_lib/productDistribution406.mjs';
const reply=(x,status=200)=>jsonResponse({ok:status<400,build:406,provider_called:false,publication_performed:false,provider_publication_allowed:false,...x},status,{'Cache-Control':'no-store'});
const productSQL="SELECT product_id,name,description,price_cents,currency,inventory_quantity,status FROM products WHERE product_id=? LIMIT 1";
// Canonical approval metadata lives in product_image_annotations (Build 436 fix).
const preferenceSQL="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_channel_intent_405' AND target_type='product' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const reviewSQL="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.channel')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
const selectedSQL="SELECT selected_product_image_ids_json FROM marketplace_export_image_selections WHERE channel=? AND product_id=? LIMIT 1";
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:reply({error:'Active Admin authorization required.'},401)}:!db?{error:reply({error:'D1 Production binding unavailable.'},503)}:{admin,db};}
function imageHolds(im){const out=[];
 if(!/^https:\/\//i.test(String(im.image_url||''))||/\/placeholders?\/|placeholder\.(?:svg|png|webp)|\/fallbacks?\//i.test(String(im.image_url||'')))out.push('real original image URL required');
 if(!['product_page_ok','social_ok','all_public_ok'].includes(String(im.public_use_status||'').toLowerCase()))out.push('public-use approval missing');
 if(String(im.alt_text||'').trim().length<5)out.push('descriptive alt text missing');
 if(Number(im.width_px||0)<800||Number(im.height_px||0)<800)out.push('verified dimensions below 800×800 or missing');
 return out;
}
async function source(db,productId,channel){
 const [product,gallery,preference,review,selection]=await Promise.all([
  db.prepare(productSQL).bind(productId).first(),readCanonicalDistributionGallery(db,productId),
  db.prepare(preferenceSQL).bind(String(productId)).first(),db.prepare(reviewSQL).bind(String(productId),channel).first(),
  db.prepare(selectedSQL).bind(channel,productId).first()
 ]);
 if(!product)return null;
 let selectedIds=[];try{selectedIds=JSON.parse(selection?.selected_product_image_ids_json||'[]')}catch{}
 const images=gallery?.images||[];
 return {product,images,preference,review,selectedIds,annotationAuthority:gallery.annotation_authority,
  status:reviewEvidence({channel,product,images,selectedIds,preference,policyReceipt:review})};
}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const url=new URL(c.request.url),id=url.searchParams.get('product_id'),channel=url.searchParams.get('channel');
 if(!productIdValid(id)||!outboundChannel(channel))return reply({error:'Saved Product and supported destination required.'},400);
 try{const data=await source(g.db,Number(id),channel);
  return data?reply({product_id:Number(id),channel,
   product:{name:data.product.name,price_cents:data.product.price_cents,quantity:data.product.inventory_quantity,status:data.product.status},
   gallery:data.images.map(im=>({product_image_id:im.product_image_id,image_url:im.image_url,
     alt_text:im.alt_text,width_px:im.width_px,height_px:im.height_px,image_role:im.image_role,
     approved_for_distribution:allowedImage(im),hold_reasons:imageHolds(im)})),
   selected_image_ids:data.selectedIds,review_receipt:data.review?.admin_action_audit_id||null,
   current_evidence:data.status,annotation_authority:data.annotationAuthority,source:'CANONICAL_PRODUCTS_AND_PRODUCT_IMAGES_WITH_ANNOTATIONS'}):
  reply({error:'Original Product not found.'},404);
 }catch{return reply({error:'Canonical gallery cannot be verified. No provider calls.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let body;try{body=await c.request.json()}catch{return reply({error:'JSON required.'},400)}
 const channel=body?.channel,id=body?.product_id,ids=body?.image_ids;
 if(!outboundChannel(channel)||!productIdValid(id)||!imageSelectionValid(ids)||!ownerKeyValid(body?.request_key)||
 body.owner_verified_destinations!==true||body.us_shipping_disabled!==true||
 body.confirmed_local_only!==true)return reply({error:'Explicit approved canonical images, valid Product, and US-shipping-disabled/local-only owner consent required.'},400);
 try{
  const src=await source(g.db,Number(id),channel);
  if(!src)return reply({error:'Canonical Product unavailable.'},404);
  const chosen=ids.map(imageId=>src.images.find(im=>Number(im.product_image_id)===Number(imageId)));
  if(chosen.some(im=>!im||!allowedImage(im)))return reply({error:'Each image must belong to this Product, have approved public use, alt text and at least 800×800 pixels. Choose a canonical gallery image.'},409);
  const check=reviewEvidence({channel,product:src.product,images:src.images,selectedIds:ids,
   preference:src.preference,policyReceipt:{details_json:JSON.stringify({channel,product_id:Number(id),
   image_ids:ids.map(Number),source_signature:reviewedSourceSignature(src.product,ids.map(Number)),
   owner_verified_destinations:true,us_shipping_disabled:true})}});
  if(check.blockers.length)return reply({error:'Channel distribution blocked.',blockers:check.blockers},409);
  const current=Number(src.review?.admin_action_audit_id||0);
  if(Number(body.expected_receipt||0)!==current)return reply({error:'Another owner review changed; reload Product mapping first.'},409);
  const detail={build:406,request_key:body.request_key,channel,product_id:Number(id),image_ids:ids.map(Number),
   source_signature:reviewedSourceSignature(src.product,ids.map(Number)),owner_verified_destinations:true,
   us_shipping_disabled:true,local_only:true,publication_performed:false,provider_called:false};
  const existing=await g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1").bind(String(id),body.request_key).first();
  if(existing){if(JSON.stringify(auditJSON(existing))!==JSON.stringify(detail))return reply({error:'Conflicting owner request-key reuse.'},409);
   return reply({product_id:id,channel,review_receipt:existing.admin_action_audit_id,idempotent:true});}
  const imageURLs=chosen.map(im=>im.image_url);
  // D1 batch is transactional: gallery selection and owner review receipt commit together or neither does.
  await g.db.batch([
   g.db.prepare("INSERT INTO marketplace_export_image_selections (channel,product_id,selected_image_urls_json,selected_product_image_ids_json,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(channel,product_id) DO UPDATE SET selected_image_urls_json=excluded.selected_image_urls_json,selected_product_image_ids_json=excluded.selected_product_image_ids_json,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP")
    .bind(channel,Number(id),JSON.stringify(imageURLs),JSON.stringify(ids.map(Number)),'Build 406 canonical gallery selection; US shipping excluded',Number(g.admin.user_id||0)||null),
   g.db.prepare("INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'product_distribution_policy_406','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM products WHERE product_id=?) AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='product_distribution_policy_406' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=?)")
    .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify(detail),id,String(id),body.request_key)
  ]);
  const result=await source(g.db,Number(id),channel);
  if(result?.status?.blockers.length||auditJSON(result.review)?.request_key!==body.request_key)
   return reply({error:'Local media/owner review persistence not confirmed. Inspect before retry.',blockers:result?.status?.blockers||[]},409);
  return reply({product_id:Number(id),channel,review_receipt:result.review.admin_action_audit_id,
   current_evidence:result.status,message:'Canonical image mapping and US shipping review saved LOCALLY. No listing published.'});
 }catch{return reply({error:'Local mapping result unknown; reload before attempting anything else.'},503);}
}
