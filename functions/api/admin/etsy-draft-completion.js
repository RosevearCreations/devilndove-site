// Release 467 Build 401 — one explicitly approved image upload per linked draft, never publish.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {validId,verifyRemote} from '../_lib/etsyListingEvidence400.mjs';
import {MAX_IMAGE_BYTES,checkedImage,inspectListingImages,consentValid,complianceKeys,statusForDraft} from '../_lib/etsyDraftImages401.mjs';
const reply=(body,status=200)=>jsonResponse({ok:status<400,build:401,publication_performed:false,automatic_retry:false,listing_activation:false,...body},status,{'Cache-Control':'no-store'});
const sql={
 draft:"SELECT id,channel_key,product_id,draft_title,payload_json,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1",
 product:"SELECT product_id,name,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1",
 claim:"SELECT admin_action_audit_id FROM admin_action_audit WHERE target_type='marketplace_draft' AND action_type='etsy_remote_draft_trial_claimed' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 imageClaim:"SELECT admin_action_audit_id,created_at FROM admin_action_audit WHERE target_type='marketplace_draft' AND action_type='etsy_image_upload_401_claimed' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 review:"SELECT admin_action_audit_id,created_at FROM admin_action_audit WHERE target_type='marketplace_draft' AND action_type='etsy_draft_completion_401_review' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 conn:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1"
};
const idPattern=/^[a-zA-Z0-9-]{16,80}$/;
function gate(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return {error:reply({error:'Verified active administrator access required.'},401)};
 if(!db)return {error:reply({error:'Database unavailable.'},503)};
 return {admin,db};
}
async function local(db,id){
 const draft=await db.prepare(sql.draft).bind(id).first();if(!draft)return null;
 const [product,claim,imageClaim,review]=await Promise.all([
  db.prepare(sql.product).bind(draft.product_id).first(),
  db.prepare(sql.claim).bind(id).first(),
  db.prepare(sql.imageClaim).bind(id).first(),
  db.prepare(sql.review).bind(id).first()
 ]);
 return {draft,product,claim,imageClaim,review};
}
async function access(db,env,needWrite=false){
 const [conn,shop]=await Promise.all([db.prepare(sql.conn).first(),db.prepare(sql.shop).first()]);
 const blockers=connectionBlockers(conn,shop,env);
 let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
 if(!Array.isArray(scopes)||!scopes.includes('listings_r'))blockers.push('listings_r_missing');
 if(needWrite&&(!Array.isArray(scopes)||!scopes.includes('listings_w')))blockers.push('listings_w_missing');
 if(blockers.length)return {error:reply({error:'Verified current Etsy shop, token and scopes required.',blockers},409)};
 const token=await decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
 if(!token)return {error:reply({error:'Etsy access token unavailable.'},409)};
 return {conn,shop,token,headers:{'Accept':'application/json',
  'x-api-key':String(env.ETSY_API_KEYSTRING)+':'+String(env.ETSY_SHARED_SECRET),
  'Authorization':'Bearer '+token}};
}
async function getEtsy(path,headers){
 const response=await fetch('https://api.etsy.com/v3/application/'+path,{method:'GET',headers,redirect:'manual'});
 if(response.status>=300&&response.status<400)throw Error('etsy_redirect_refused');
 if(!response.ok)throw Error('etsy_read_failed_'+response.status);
 return response.json();
}
async function providerEvidence(a,s){
 const id=String(s.draft.external_reference||'');
 if(!validId(id)||!s.claim||!s.product)throw Error('reconcile_build400_draft_first');
 const [listing,images]=await Promise.all([
  getEtsy('listings/'+encodeURIComponent(id),a.headers),
  getEtsy('listings/'+encodeURIComponent(id)+'/images',a.headers)
 ]);
 const evidence=verifyRemote(listing,a.shop,s.product,s.draft,s.claim);
 if(!evidence.verified)throw Error('listing_not_matching_unpublished_local_draft_'+evidence.blockers.join('_'));
 return {listing,images,evidence,photo:inspectListingImages(images)};
}
const summary=s=>({draft_id:s.draft.id,product_id:s.product?.product_id||null,
 linked_listing_id:s.draft.external_reference||null,
 prior_image_attempt_receipt:s.imageClaim?.admin_action_audit_id||null,
 prior_review_receipt:s.review?.admin_action_audit_id||null,
 local_claim_present:!!s.claim});
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const id=new URL(c.request.url).searchParams.get('draft_id');
 if(!idPattern.test(String(id||'')))return reply({error:'Select valid staged draft ID.'},400);
 try{
  const s=await local(g.db,id);
  return s?reply({...summary(s),source:'local_only',provider_contacted:false,
   image_upload_available:!!s.claim&&validId(s.draft.external_reference)&&!s.imageClaim,
   readiness:'PENDING_MANUAL_PROVIDER_REVIEW'}):reply({error:'Local Etsy draft not found.'},404);
 }catch{return reply({error:'Local readiness unavailable; provider not contacted.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 const ct=String(c.request.headers.get('Content-Type')||'');
 let b,file=null;
 if(ct.startsWith('multipart/form-data')){
  if(Number(c.request.headers.get('Content-Length')||0)>MAX_IMAGE_BYTES+20000)return reply({error:'Image payload exceeds 8 MiB limit.'},413);
  try{const form=await c.request.formData();b=Object.fromEntries(form.entries());file=form.get('image');
   b.image_rights_confirmed=b.image_rights_confirmed==='true';
   b.image_matches_product=b.image_matches_product==='true';
   b.description_and_materials_reviewed=b.description_and_materials_reviewed==='true';
   b.ingredients_and_required_labels_reviewed=b.ingredients_and_required_labels_reviewed==='true';
   b.claims_and_safety_reviewed=b.claims_and_safety_reviewed==='true';
   b.shipping_returns_reviewed=b.shipping_returns_reviewed==='true';
   b.confirmed_unpublished_only=b.confirmed_unpublished_only==='true';
   b.confirmed_one_attempt_no_retry=b.confirmed_one_attempt_no_retry==='true';
  }catch{return reply({error:'Unreadable image form.'},400);}
 }else{
  try{b=await c.request.json();}catch{return reply({error:'Valid JSON required.'},400);}
 }
 const id=String(b?.draft_id||'');
 if(!idPattern.test(id))return reply({error:'Select one existing linked local draft.'},400);
 if(!['inspect_images','upload_one_image','record_completion_review'].includes(b?.action))
  return reply({error:'Unsupported manual Etsy draft action.'},400);
 const isUpload=b.action==='upload_one_image',isReview=b.action==='record_completion_review';
 if(isUpload&&(!ct.startsWith('multipart/form-data')||!consentValid(b)))return reply({error:'Explicit one-attempt image and compliance approvals required.'},400);
 if(isReview&&(!complianceKeys.every(k=>b[k]===true)||b.confirmed_unpublished_only!==true))
  return reply({error:'Complete explicit operator compliance review before recording local readiness.'},400);
 try{
  const s=await local(g.db,id);if(!s?.product||!s.claim||!validId(s.draft.external_reference))
   return reply({error:'Build 400 verified local draft linkage and prior Build 399 claim required.'},409);
  if(isUpload&&s.imageClaim)return reply({...summary(s),error:'Prior image upload was already claimed. Inspect Etsy images; never automatically retry.'},409);
  const a=await access(g.db,c.env,isUpload);if(a.error)return a.error;
  let before;
  try{before=await providerEvidence(a,s);}
  catch(e){return reply({error:'Provider draft/image verification blocked: '+String(e?.message||'unknown')+'. No write made.'},409);}
  if(!isUpload){
   if(!isReview)return reply({...summary(s),provider_read_performed:true,provider_write:false,
    listing_evidence:before.evidence,image_evidence:before.photo,
    readiness:before.photo.has_image?'IMAGE_PRESENT_MANUAL_COMPLIANCE_REVIEW':'IMAGE_REQUIRED',
    message:'Etsy draft and image metadata checked. Nothing published or modified.'});
   const check=statusForDraft(before.listing,a.shop,s.product,s.draft,s.claim,before.images,true);
   if(check.readiness!=='READY_FOR_MANUAL_ETSY_REVIEW')return reply({...summary(s),...check,
    error:'Listing is not ready. No completion receipt recorded.'},409);
   const detail=JSON.stringify({build:401,listing_id:String(s.draft.external_reference),shop_id:String(a.shop.shop_id),
    image_ids:check.photo.images.map(i=>i.id),image_count:check.photo.image_count,
    compliance_attested:complianceKeys,readiness:check.readiness,listing_state:'draft',
    publication_performed:false,provider_read_only:true});
   await g.db.prepare("INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
    "SELECT ?,'etsy_draft_completion_401_review','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
    "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_draft_completion_401_review' AND target_type='marketplace_draft' AND target_key=?)")
    .bind(g.admin.user_id,id,new URL(c.request.url).pathname,detail,id).run();
   const receipt=await g.db.prepare(sql.review).bind(id).first();
   if(!receipt)return reply({error:'Readiness audit receipt not confirmed, inspect manually.'},503);
   return reply({...summary(s),...check,review_receipt:receipt.admin_action_audit_id,
    message:'Image-present unpublished draft reviewed. Recorded local readiness only; Etsy remains unpublished.'});
  }
  if(before.photo.has_image)return reply({...summary(s),image_evidence:before.photo,
   error:'An Etsy image already exists. Review it; controlled first-image upload not offered.'},409);
  if(!file||typeof file.arrayBuffer!=='function'||!Number.isFinite(Number(file.size))||
   file.size>MAX_IMAGE_BYTES||file.size<100)return reply({error:'Select JPEG/PNG image of 100 bytes to 8 MiB.'},400);
  const bytes=await file.arrayBuffer(),validated=checkedImage(file,bytes,b.alt_text);
  if(!validated.ok)return reply({error:'Invalid image or alt text.',blockers:validated.reasons},400);
  const detail=JSON.stringify({build:401,listing_id:String(s.draft.external_reference),shop_id:String(a.shop.shop_id),
   request_key:String(b.request_key),image_size:validated.size,mime:validated.mime,alt_text_present:true,
   compliance_attested:complianceKeys,remote_upload_attempted:true,one_attempt_no_retry:true,
   publication_performed:false});
  const claimed=await g.db.prepare("INSERT INTO admin_action_audit "+
   "(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
   "SELECT ?,'etsy_image_upload_401_claimed','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
   "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_image_upload_401_claimed' AND target_type='marketplace_draft' AND target_key=?) "+
   "AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE id=? AND external_reference=? AND channel_key='etsy')")
   .bind(g.admin.user_id,id,new URL(c.request.url).pathname,detail,id,id,String(s.draft.external_reference)).run();
  if(Number(claimed?.meta?.changes||0)!==1)return reply({error:'Upload claim collision. Never resend this file automatically.'},409);
  const receipt=await g.db.prepare(sql.imageClaim).bind(id).first();
  if(!receipt)return reply({error:'Upload claim not confirmed. No Etsy request made. Manual HOLD.'},409);
  const form=new FormData();
  form.set('image',new Blob([bytes],{type:validated.mime}),'devilndove-etsy-draft.'+validated.extension);
  form.set('rank','1');form.set('overwrite','false');form.set('is_watermarked','false');
  form.set('alt_text',String(b.alt_text).trim());
  let result,resp;
  try{
   resp=await fetch('https://api.etsy.com/v3/application/shops/'+encodeURIComponent(String(a.shop.shop_id))+
    '/listings/'+encodeURIComponent(String(s.draft.external_reference))+'/images',{
    method:'POST',headers:a.headers,body:form,redirect:'manual'
   });
   if(resp.status>=300&&resp.status<400)throw Error('etsy_redirect');
   result=await resp.json().catch(()=>null);
  }catch{return reply({...summary(s),receipt_id:receipt.admin_action_audit_id,
   error:'Upload outcome unknown. Check Etsy images; do not repeat this draft upload.'},502);}
  if(!resp.ok||!validId(result?.listing_image_id)||String(result?.listing_id)!==String(s.draft.external_reference))
   return reply({...summary(s),receipt_id:receipt.admin_action_audit_id,provider_http_status:resp.status,
    error:'Etsy image response not confirmed. Manual verification required; no retry.'},409);
  const audit=JSON.stringify({build:401,listing_id:String(s.draft.external_reference),
   image_id:String(result.listing_image_id),claim_receipt:receipt.admin_action_audit_id,
   provider_upload:true,listing_remains_draft:true,publication_performed:false});
  await g.db.prepare("INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
   "VALUES (?,'etsy_image_upload_401_accepted','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP)")
   .bind(g.admin.user_id,id,new URL(c.request.url).pathname,audit).run();
  return reply({draft_id:id,listing_id:String(s.draft.external_reference),image_id:String(result.listing_image_id),
   claim_receipt:receipt.admin_action_audit_id,etsy_image_uploaded:true,
   listing_activation:false,publication_performed:false,
   message:'Etsy returned an image ID. Refresh provider evidence before recording manual compliance readiness.'});
 }catch{
  return reply({error:'Unconfirmed outcome. Review local audit and Etsy; do not retry or publish automatically.'},503);
 }
}
