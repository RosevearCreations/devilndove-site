// Build 409: owner-gated Etsy remote draft authorization and recorded provider reconciliation evidence.
// No outbound provider calls in this endpoint. Build 399 owns its ONE remote draft POST;
// Build 400 owns its user-initiated verified Etsy GET and local link.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {productIdValid} from '../_lib/productDistribution406.mjs';
import {positive} from '../_lib/etsyDraftTrial399.mjs';
import {loadTrial409,trial409Summary,keyValid,uuidDraft,isAuthorized409} from '../_lib/etsyTrialGate409.mjs';
import {parseReceipt} from '../_lib/listingSyncOperator408.mjs';
const reply=(v,status=200)=>jsonResponse({ok:status<400,build:409,provider_called:false,provider_write:false,publication_performed:false,external_publication_allowed:false,...v},status,{'Cache-Control':'no-store'});
const detailSQL="SELECT admin_action_audit_id,action_type,details_json FROM admin_action_audit WHERE action_type IN ('etsy_trial_409_authorized','etsy_trial_409_reconciliation_reviewed') AND target_type='marketplace_draft' AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);return !admin?{error:reply({error:'Verified active Admin required.'},401)}:!db?{error:reply({error:'D1 not available.'},503)}:{admin,db};}
export async function onRequestGet(c){
 const g=gate(c);if(g.error)return g.error;
 const u=new URL(c.request.url),productId=u.searchParams.get('product_id'),draftId=u.searchParams.get('draft_id');
 if(!productIdValid(productId)||!uuidDraft(draftId))return reply({error:'Saved Product and local Etsy draft required.'},400);
 try{const s=await loadTrial409(g.db,c.env,Number(productId),draftId);
 return s?reply(trial409Summary(s)):reply({error:'Local source Product/draft mismatch or missing.'},404);}
 catch{return reply({error:'Readiness unavailable. No provider action attempted.'},503);}
}
export async function onRequestPost(c){
 const g=gate(c);if(g.error)return g.error;
 let b;try{b=await c.request.json()}catch{return reply({error:'JSON required.'},400)}
 if(!productIdValid(b?.product_id)||!uuidDraft(b?.draft_id)||!keyValid(b?.request_key)||
 !['authorize_unpublished_etsy_trial','record_verified_draft_reconciliation'].includes(b?.action))
 return reply({error:'Supported action, saved Product, local draft and secure request key required.'},400);
 const action=b.action,isAuthorize=action==='authorize_unpublished_etsy_trial';
 if(isAuthorize&&(!positive(b.shipping_profile_id)||b.confirmed_no_publish!==true||
 b.confirmed_one_attempt!==true||b.confirmed_us_shipping_disabled!==true||
 b.owner_verified_shipping_profile_us_excluded!==true))
 return reply({error:'Manual Etsy shipping profile US exclusion, one attempt and unpublished-only confirmations required.'},400);
 if(!isAuthorize&&b.confirmed_read_only_provider_reconciliation!==true)
 return reply({error:'Explicit operator provider-evidence acknowledgement required.'},400);
 try{
 const previous=await g.db.prepare(detailSQL).bind(b.draft_id,b.request_key).first();
 const type=isAuthorize?'etsy_trial_409_authorized':'etsy_trial_409_reconciliation_reviewed';
 if(previous)return previous.action_type===type?reply({receipt:previous.admin_action_audit_id,idempotent:true}):
 reply({error:'Request key already used for a different action.'},409);
 const s=await loadTrial409(g.db,c.env,Number(b.product_id),b.draft_id);
 if(!s)return reply({error:'Local Product/draft no longer matches.'},404);
 if(b.expected_source_fingerprint!==s.fingerprint||b.expected_draft_fingerprint!==s.draftFingerprint||
 Number(b.expected_review_receipt)!==s.reviewReceipt)return reply({error:'Source/draft/review changed; reload evidence.',blockers:['source_snapshot_stale']},409);
 if(isAuthorize){
  if(s.blockers.length)return reply({error:'Provider trial not ready.',blockers:s.blockers},409);
  if(s.trial)return reply({error:'Trial already authorized for this draft. Inspect its receipt; do not silently issue multiple approvals.'},409);
 }else{
  if(!s.claim||!s.verified||!s.draft.external_reference||
     String(parseReceipt(s.verified).listing_id||'')!==String(s.draft.external_reference))
   return reply({error:'Build 400 verified unpublished Etsy draft and linked claim required. Run provider GET and reconcile first.'},409);
  if(s.reconciled409)return reply({receipt:s.reconciled409.admin_action_audit_id,idempotent:true});
 }
 const detail={build:409,action,request_key:b.request_key,product_id:Number(b.product_id),draft_id:b.draft_id,
 destination:'etsy',shop_id:s.shopId,source_fingerprint:s.fingerprint,draft_fingerprint:s.draftFingerprint,
 review_receipt:s.reviewReceipt,shipping_profile_id:isAuthorize?Number(b.shipping_profile_id):null,
 confirmed_no_publish:true,confirmed_one_attempt:true,confirmed_us_shipping_disabled:true,
 owner_verified_shipping_profile_us_excluded:isAuthorize,provider_write_permitted:isAuthorize?'unpublished_draft_only':'none',
 build400_reconciliation_receipt:isAuthorize?null:s.verified.admin_action_audit_id,
 external_listing_id:isAuthorize?null:String(s.draft.external_reference),
 provider_called:false,publication_performed:false};
 const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'marketplace_draft',?,'POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='marketplace_draft' AND target_key=?)";
 const saved=await g.db.prepare(sql).bind(g.admin.user_id,type,b.draft_id,new URL(c.request.url).pathname,JSON.stringify(detail),type,b.draft_id).run();
 if(Number(saved?.meta?.changes||0)!==1)return reply({error:'Receipt already exists or concurrent operator action. Reload.'},409);
 const found=await g.db.prepare(detailSQL).bind(b.draft_id,b.request_key).first();
 if(!found||found.action_type!==type)return reply({error:'Operator evidence cannot be confirmed. No external action initiated.'},409);
 const fresh=await loadTrial409(g.db,c.env,Number(b.product_id),b.draft_id);
 if(isAuthorize&&!isAuthorized409({receipt:fresh?.trial,source:fresh,draftId:b.draft_id,shippingProfileId:b.shipping_profile_id}))
 return reply({error:'New trial receipt failed fresh-source verification. Do not attempt Etsy write.'},409);
 return reply({receipt:found.admin_action_audit_id,trial_authorized:isAuthorize,
 message:isAuthorize?'One bounded unpublished Etsy draft may be attempted separately in Build 399; never retry an uncertain result.':
 'Prior Build 400 Etsy GET and local link evidence acknowledged. No new provider call or publication.',
 provider_listing_id:isAuthorize?null:s.draft.external_reference});
 }catch{return reply({error:'Local receipt outcome unknown; reload D1 and audit before retry.'},503);}
}
