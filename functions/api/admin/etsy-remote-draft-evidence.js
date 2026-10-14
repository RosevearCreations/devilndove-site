
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {connectionBlockers} from '../_lib/etsyDraftTrial399.mjs';
import {validId,verifyRemote} from '../_lib/etsyListingEvidence400.mjs';
const respond=(v,status=200)=>jsonResponse({ok:status<400,build:400,provider_write:false,publication_performed:false,automatic_retry:false,...v},status,{'Cache-Control':'no-store'});
const q={
 draft:"SELECT id,channel_key,product_id,draft_title,payload_json,status,external_reference,updated_at FROM marketplace_syndication_drafts WHERE id=? AND channel_key='etsy' LIMIT 1",
 product:"SELECT product_id,name,price_cents,currency,inventory_quantity FROM products WHERE product_id=? LIMIT 1",
 claim:"SELECT admin_action_audit_id,created_at FROM admin_action_audit WHERE action_type='etsy_remote_draft_trial_claimed' AND target_type='marketplace_draft' AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1",
 conn:"SELECT remote_subject_id,connection_status,scopes_json,access_expires_at,access_token_ciphertext FROM oauth_provider_connections WHERE provider_key='etsy' LIMIT 1",
 shop:"SELECT shop_id,owner_user_id,shop_name,currency_code,acceptance_status FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1"
};
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:respond({error:'Verified active Administrator required.'},401)}:
 !db?{error:respond({error:'Database unavailable.'},503)}:{admin,db};
}
async function stored(db,id){
 const draft=await db.prepare(q.draft).bind(id).first();
 if(!draft)return null;
 const [product,claim]=await Promise.all([db.prepare(q.product).bind(draft.product_id).first(),db.prepare(q.claim).bind(id).first()]);
 return {draft,product,claim};
}
const summary=s=>({draft_id:s.draft.id,product_id:s.product?.product_id||null,product_title:s.product?.name||'',
 linked_listing_id:s.draft.external_reference||null,local_status:s.draft.status,
 claim_receipt:s.claim?.admin_action_audit_id||null,claimed_at:s.claim?.created_at||null});
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const id=new URL(c.request.url).searchParams.get('draft_id');
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(String(id||'')))return respond({error:'Choose local draft ID.'},400);
 try{const s=await stored(g.db,id);return s?respond({...summary(s),source:'D1_ONLY',provider_read_performed:false,provider_verified:false}):
 respond({error:'Local Etsy draft not found.'},404);}
 catch{return respond({error:'Local evidence read failed. No provider call.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json();}catch{return respond({error:'Valid JSON required.'},400);}
 const reconcile=b?.action==='reconcile_verified_draft';
 if(!['verify_etsy_draft','reconcile_verified_draft'].includes(b?.action)||
   !/^[a-zA-Z0-9-]{16,80}$/.test(String(b.draft_id||''))||
   (b.listing_id&&!validId(b.listing_id)))return respond({error:'Valid action, local draft and listing ID required.'},400);
 if(reconcile&&b.confirmed_manual_link!==true)return respond({error:'Confirm local-only reconciliation first.'},400);
 try{
  const s=await stored(g.db,b.draft_id);
  if(!s?.product)return respond({error:'Local draft/Product missing.'},404);
  if(!s.claim)return respond({...summary(s),error:'No prior Build 399 attempt claim; cannot link an unknown listing.'},409);
  const listingId=String(b.listing_id||s.draft.external_reference||'');
  if(!validId(listingId))return respond({...summary(s),error:'Enter real Etsy Draft listing ID; never retry create.'},409);
  if(s.draft.external_reference&&String(s.draft.external_reference)!==listingId)
   return respond({error:'Stored listing ID differs; manual investigation required.'},409);
  const [conn,shop]=await Promise.all([g.db.prepare(q.conn).first(),g.db.prepare(q.shop).first()]);
  const blockers=connectionBlockers(conn,shop,c.env);
  let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
  if(!Array.isArray(scopes)||!scopes.includes('listings_r'))blockers.push('listings_r_missing');
  if(blockers.length)return respond({error:'Current Etsy auth/shop not verified.',blockers},409);
  const token=await decryptOAuthSecret(c.env,conn.access_token_ciphertext,'oauth-token|etsy|access');
  if(!token)return respond({error:'Etsy token unavailable.'},409);
  // Exactly one operator-requested provider GET. No publish/create/automatic retry.
  let response;
  try{response=await fetch('https://api.etsy.com/v3/application/listings/'+encodeURIComponent(listingId),{
   method:'GET',redirect:'manual',headers:{'Accept':'application/json','x-api-key':String(c.env.ETSY_API_KEYSTRING)+':'+String(c.env.ETSY_SHARED_SECRET),'Authorization':'Bearer '+token}
  });}catch{return respond({error:'Etsy read failed. Outcome remains unknown; no provider write.'},502);}
  if(response.status>=300&&response.status<400)return respond({error:'Etsy redirect blocked.'},502);
  if(!response.ok)return respond({error:'Etsy listing unavailable.',provider_http_status:response.status},409);
  const remote=await response.json().catch(()=>null),evidence=verifyRemote(remote,shop,s.product,s.draft,s.claim);
  const out={...summary(s),provider_read_performed:true,provider_verified:evidence.verified,evidence,
    manual_etsy_drafts_url:'https://www.etsy.com/your/shops/me/tools/listings',reconcile_performed:false};
  if(!evidence.verified)return respond({...out,error:'Provider listing did not match staged unpublished draft.'},409);
  if(!reconcile)return respond({...out,message:'Provider confirmed draft. Explicit local-only reconciliation available.'});
  // Local D1 binding only; never call Etsy POST. Reject another draft already linked to listing.
  await g.db.prepare("UPDATE marketplace_syndication_drafts SET external_reference=?,status='needs_review',updated_at=CURRENT_TIMESTAMP "+
   "WHERE id=? AND channel_key='etsy' AND external_reference IS NULL "+
   "AND EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_remote_draft_trial_claimed' AND target_key=? AND target_type='marketplace_draft') "+
   "AND NOT EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND id<>?)")
   .bind(listingId,s.draft.id,s.draft.id,listingId,s.draft.id).run();
  const confirmed=await g.db.prepare(q.draft).bind(s.draft.id).first();
  if(String(confirmed?.external_reference||'')!==listingId)return respond({...out,error:'Local binding not confirmed; inspect claim and listing.'},409);
  const details=JSON.stringify({build:400,claim_receipt:s.claim.admin_action_audit_id,listing_id:listingId,
   shop_id:evidence.shop_id,listing_state:'draft',price_cents:evidence.price_cents,
   quantity:evidence.quantity,provider_get_only:true,local_link_only:true,publication_performed:false});
  // Idempotent receipt for the verified pair, no credentials or raw token.
  await g.db.prepare("INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) "+
   "SELECT ?,'etsy_remote_draft_reconciled','marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP "+
   "WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='etsy_remote_draft_reconciled' AND target_type='marketplace_draft' AND target_key=?)")
   .bind(g.admin.user_id,s.draft.id,new URL(c.request.url).pathname,details,s.draft.id).run();
  return respond({...out,linked_listing_id:listingId,reconcile_performed:true,receipt_persisted:true,
   message:'Unpublished Etsy draft verified and linked locally. No provider mutation or publication.'});
 }catch{return respond({error:'Reconciliation unconfirmed; inspect Etsy and local audit. Do not retry creation.'},503);}
}
