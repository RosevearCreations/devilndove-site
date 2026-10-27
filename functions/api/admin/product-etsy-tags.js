// Build 497 — owner-initiated native Etsy tags for ONE verified unpublished
// Canada-only draft. Server reads saved SEO authority, not browser-supplied tags.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {preparedEtsyTags497,tagsMatch497} from '../_lib/etsyNativeTags497.mjs';
import {readOverride499,effectiveEtsyTags499} from '../_lib/channelTagOverrides499.mjs';
import {readExistingDraftLocal486,existingDraftCredentials486,verifyExistingDraft486,readEtsy486} from './product-etsy-existing-draft.js';

const respond=(data,status=200)=>jsonResponse({ok:status<400,build:497,publication_performed:false,
 automatic_retry:false,shipping_modified:false,...data},status,{'Cache-Control':'no-store'});
const valid=value=>/^[1-9]\d{0,14}$/.test(String(value??''))&&Number.isSafeInteger(Number(value));
const uuid=value=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(value||''));
const parse=row=>{try{return JSON.parse(row?.payload_json||'{}');}catch{return {};}};
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:respond({error:'Verified administrator required.'},401)}:
  !db?{error:respond({error:'D1 unavailable.'},503)}:{admin,db};}
async function source(db,id){
 const [record,claims]=await Promise.all([
  db.prepare('SELECT p.product_id,ps.keywords FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id WHERE p.product_id=? LIMIT 1').bind(id).first(),
  db.prepare("SELECT (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_native_tags_497_claimed' AND target_type='product' AND target_key=?) claimed,(SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_native_tags_497_confirmed' AND target_type='product' AND target_key=?) confirmed").bind(String(id),String(id)).first()
 ]);
 const override=record?await readOverride499(db,id,'etsy'):null;
 return {record,claims,prepared:override?effectiveEtsyTags499(record?.keywords,override):preparedEtsyTags497(record?.keywords)};
}
async function linked(db,id){const s=await readExistingDraftLocal486(db,id);
 const listingId=String(s.draft?.external_reference||'');
 if(!valid(listingId)||parse(s.draft).canada_only_shipping_verified!==true||parse(s.draft).publication_performed!==false)
  throw Error('First link a verified unpublished Canada-only Etsy draft to this Product.');
 return {s,listingId};
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 const url=new URL(c.request.url),id=url.searchParams.get('product_id');
 if(!valid(id))return respond({error:'A saved Product is required.'},400);
 try{
  const x=await source(g.db,Number(id));if(!x.record)return respond({error:'Product unavailable.'},404);
  const reply={product_id:Number(id),local_tags:x.prepared.tags,tag_source:x.prepared.source||'shared_product_seo',blockers:x.prepared.blockers,ready:x.prepared.ready,
   unresolved_attempt:Number(x.claims?.claimed||0)!==Number(x.claims?.confirmed||0),provider_contacted:false};
  if(url.searchParams.get('reconcile')!=='1')return respond(reply);
  const {s,listingId}=await linked(g.db,Number(id)),headers=await existingDraftCredentials486(c.env,s);
  const listing=await verifyExistingDraft486(c.env,s,listingId,headers);
  const remoteTags=Array.isArray(listing.tags)?listing.tags:null;
  return respond({...reply,listing_id:listingId,provider_contacted:true,remote_tags:remoteTags,
   verified_draft:true,verified_canada_only:true,matching_tags:remoteTags!==null&&tagsMatch497(x.prepared.tags,remoteTags),
   state:remoteTags===null?'hold_remote_tags_unavailable':
    tagsMatch497(x.prepared.tags,remoteTags)?'verified_native_tags':'native_tags_differ'});
 }catch(error){return respond({error:'Etsy native tag reconciliation held: '+String(error?.message||'unknown').slice(0,180)},409);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin request required.'},403);
 let body;try{body=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 const id=Number(body?.product_id);
 if(body?.action!=='update_native_tags'||!valid(id)||!uuid(body?.request_key)||
   !valid(body?.listing_id)||!Array.isArray(body?.reviewed_tags)||
   body?.confirm_saved_product_tags!==true||body?.confirm_replace_existing_tags!==true||
   body?.confirm_unpublished_only!==true||body?.confirm_canada_only!==true)
  return respond({error:'Explicit tags, linked draft ID, unique key and Canada-only draft approval required.'},400);
 try{
  const local=await source(g.db,id);
  if(!local.record||!local.prepared.ready||!tagsMatch497(local.prepared.tags,body.reviewed_tags))
   return respond({error:'Saved Product tags have changed or are invalid. Save/review again.',blockers:local.prepared.blockers},409);
  if(Number(local.claims?.claimed)!==Number(local.claims?.confirmed))
   return respond({error:'Previous Etsy tags attempt is unresolved. Compare live Etsy tags; do not retry blindly.'},409);
  const {s,listingId}=await linked(g.db,id);
  if(listingId!==String(body.listing_id))return respond({error:'The linked draft changed. Nothing sent.'},409);
  const headers=await existingDraftCredentials486(c.env,s);
  const remote=await verifyExistingDraft486(c.env,s,listingId,headers);
  if(!Array.isArray(remote.tags))return respond({error:'Current Etsy tags unavailable; do not replace unknown listing state.'},409);
  if(tagsMatch497(remote.tags,local.prepared.tags))return respond({listing_id:listingId,already_matches:true,
   native_tags_verified:true,remote_tags:remote.tags,provider_modified:false});
  const prior=await g.db.prepare("SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='etsy_native_tags_497_claimed' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1")
   .bind(String(id),body.request_key).first();
  if(prior)return respond({error:'This request key was already used. Check Etsy before another update.'},409);
  const receipt={build:497,product_id:id,listing_id:listingId,request_key:body.request_key,
   requested_tags:local.prepared.tags,previous_tags:remote.tags,publication_performed:false,automatic_retry:false};
  const claim=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'etsy_native_tags_497_claimed','product',?,'POST',?,?,CURRENT_TIMESTAMP WHERE (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_native_tags_497_claimed' AND target_type='product' AND target_key=?)=(SELECT COUNT(*) FROM admin_action_audit WHERE action_type='etsy_native_tags_497_confirmed' AND target_type='product' AND target_key=?) AND NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_native_tags_497_claimed' AND target_type='product' AND target_key=? AND json_extract(details_json,'$.request_key')=?) AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND product_id=? AND external_reference=?)")
   .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,JSON.stringify(receipt),String(id),String(id),String(id),body.request_key,id,listingId).run();
  if(Number(claim?.meta?.changes||0)!==1)return respond({error:'A concurrent tags update was claimed. Inspect Etsy before another action.'},409);
  // The API documentation defines tags as a comma-separated form value.
  const form=new URLSearchParams({tags:local.prepared.tags.join(',')});
  let response,updated;
  try{
   response=await fetch('https://api.etsy.com/v3/application/shops/'+encodeURIComponent(String(s.shop.shop_id))+'/listings/'+encodeURIComponent(listingId),
    {method:'PATCH',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:form,
     redirect:'manual',signal:AbortSignal.timeout(15000)});
   updated=await response.json().catch(()=>null);
  }catch{return respond({error:'Etsy tags outcome unknown. Inspect the existing draft; do not retry automatically.'},502);}
  if(!response.ok||String(updated?.listing_id||'')!==listingId||String(updated?.shop_id||'')!==String(s.shop.shop_id)||
    String(updated?.state||'').toLowerCase()!=='draft')
   return respond({error:'Etsy did not confirm the unpublished draft update. Reconcile manually, no retry.',provider_http_status:response.status},409);
  let checked;
  try{checked=await readEtsy486('listings/'+encodeURIComponent(listingId),headers);}catch{
   return respond({error:'Etsy accepted an update but live tags readback failed. Outcome held; never retry blindly.'},502);}
  if(String(checked?.listing_id||'')!==listingId||String(checked?.shop_id||'')!==String(s.shop.shop_id)||
    String(checked?.state||'').toLowerCase()!=='draft'||!tagsMatch497(local.prepared.tags,checked.tags))
   return respond({error:'Live Etsy tags did not match the saved Product after update. Held for owner reconciliation.'},409);
  const confirmation=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) VALUES (?,'etsy_native_tags_497_confirmed','product',?,'POST',?,?,CURRENT_TIMESTAMP)")
   .bind(g.admin.user_id,String(id),new URL(c.request.url).pathname,
    JSON.stringify({...receipt,verified_remote_tags:checked.tags,provider_confirmed:true})).run();
  if(Number(confirmation?.meta?.changes||0)!==1)
   return respond({error:'Etsy tags matched but durable confirmation receipt failed. Reconcile before another write.'},503);
  return respond({listing_id:listingId,native_tags_verified:true,remote_tags:checked.tags,
   updated:true,still_unpublished:true,message:'Etsy draft tags verified from a fresh provider read. No publication.'});
 }catch(error){return respond({error:'Native tags held: '+String(error?.message||'unknown').slice(0,180)},409);}
}
