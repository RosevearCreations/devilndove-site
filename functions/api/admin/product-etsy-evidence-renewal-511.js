/* Build 511: review source receipts and record local follow-up/independent photo renewal.
 * Never repairs a foreign Etsy listing claim or uploads a photo. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {linkedReceipt506} from './product-etsy-existing-draft.js';
import {reviewOwnerEtsy504} from './product-etsy-owner-signoff-504.js';
import {evidenceRenewal511} from '../_lib/etsyRenewal511.mjs';

const listing='4603838854',validKey=x=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(x||''));
const response=(data,status=200)=>jsonResponse({ok:status<400,build:511,product_id:53,
 candidate_listing_id:listing,source_of_truth:'D1 primary + direct read-only Etsy review',
 provider_modified:false,etsy_draft_created:false,etsy_published:false,
 local_claim_reassigned:false,owner_pilot_approved:false,...data},status,{'Cache-Control':'no-store'});
const gate=c=>{const actor=verifiedAdminFromModule(c),db=getDb(c.env);
 return !actor?{error:response({error:'Verified Admin required.'},401)}:
  !db?{error:response({error:'Current D1 audit unavailable.'},503)}:{actor,db};};
async function read(c,db,actor){
 const [claim,witness,retest]=await Promise.all([
  linkedReceipt506(db,53,listing),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_510_unlinked_candidate_witnessed' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='etsy_510_three_originals_retested' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 let review=null,readbackError=null;
 if(claim.confirmed)try{review=await reviewOwnerEtsy504(c,db,53);}catch(e){readbackError=String(e?.message||'unavailable').slice(0,140);}
 const result=evidenceRenewal511({claim,review,witness,retest,reviewerId:actor.user_id});
 if(readbackError)result.issues.push('Remote readback not completed: '+readbackError);
 return result;
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 if(new URL(c.request.url).searchParams.get('product_id')!=='53')return response({error:'Exact Product #53 required.'},400);
 try{return response({...await read(c,g.db,g.actor),read_only:true});}
 catch{return response({error:'D1 primary and Build 510 receipt reconciliation unavailable; HOLD remains.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same-origin verified Admin required.'},403);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON required.'},400);}
 const follow=b?.action==='record_claim_witness_followup',renew=b?.action==='record_three_photo_renewal';
 if((!follow&&!renew)||!validKey(b.request_key)||b.product_id!==53||String(b.listing_id)!==listing||
   b.confirm_no_provider_write!==true)return response({error:'Exact existing Etsy draft, idempotency key and no-provider-write consent required.'},400);
 if(follow&&(b.confirm_manual_claim_review!==true||typeof b.next_action!=='string'||
  b.next_action.trim().length<15||b.next_action.length>500))
  return response({error:'We need a factual next review step (15–500 characters) after personally examining the existing draft.'},400);
 if(renew&&(b.confirm_original_344!==true||b.confirm_original_345!==true||b.confirm_original_346!==true||
  b.confirm_actual_visual_match!==true||b.confirm_independent_actor!==true||
  !/^[a-f0-9]{64}$/.test(String(b.evidence_fingerprint||''))))
  return response({error:'Current three-original visual evidence, exact fingerprint and separate reviewer confirmations required.'},400);
 try{const state=await read(c,g.db,g.actor);
  if(follow&&!state.can_record_witness_followup)return response({error:'HOLD — a previous factual Build 510 witness receipt is required. Do not invent an Etsy link.'},409);
  if(renew&&(!state.can_record_photo_renewal||state.current_evidence_fingerprint!==b.evidence_fingerprint||
     Number(b.prior_retest_id)!==state.previous_retest_id))return response({error:'HOLD — current source/Etsy photo evidence has changed, or an independent retest is missing.',issues:state.issues},409);
  if(follow&&b.expected_claim_state!==state.claim_state)return response({error:'HOLD — D1 primary ownership has changed; refresh before recording a witness follow-up.'},409);
  const action=renew?'etsy_511_independent_photo_evidence_renewed':'etsy_511_claim_witness_followup';
  const detail={build:511,product_id:53,listing_id:listing,request_key:b.request_key,
   source_claim_state:state.claim_state,source_claim_receipt_id:state.claim_receipt_id,
   prior_build510_witness_id:state.previous_witness_id,prior_build510_retest_id:renew?state.previous_retest_id:null,
   evidence_fingerprint:renew?state.current_evidence_fingerprint:null,
   original_photo_ids:renew?[344,345,346]:[],
   next_action:follow?b.next_action.trim():null,
   independent_reviewer:renew,decision:renew?'current_evidence_renewed_local_only':'owner_followup_only',
   verified_etsy_link:renew,final_etsy_acceptance:false,owner_pilot_approved:false,
   provider_modified:false,publication_performed:false};
  // Compare local ownership and prior receipt again *inside* the conditional
  // INSERT, so an observed D1 claim change cannot be silently accepted after
  // the initial preview. Etsy itself remains externally mutable and on HOLD.
  const written=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'product','53','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key='53' AND (json_extract(details_json,'$.request_key')=? OR (?=1 AND json_extract(details_json,'$.prior_build510_retest_id')=?))) AND (?=0 OR ((SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=1 AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) AND EXISTS (SELECT 1 FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type='etsy_510_three_originals_retested' AND actor_user_id<>? AND json_extract(details_json,'$.evidence_fingerprint')=?))) AND (?=1 OR (?=CASE WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=0 THEN 'unclaimed' WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)>1 THEN 'multiple_local_claims' WHEN EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) THEN 'same_product' ELSE 'another_product' END AND EXISTS (SELECT 1 FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type='etsy_510_unlinked_candidate_witnessed'))")
    .bind(g.actor.user_id,action,new URL(c.request.url).pathname,JSON.stringify(detail),action,b.request_key,
      renew?1:0,renew?state.previous_retest_id:null,
      renew?1:0,listing,listing,renew?state.previous_retest_id:null,g.actor.user_id,
      renew?state.current_evidence_fingerprint:null,
      renew?1:0,state.claim_state,listing,listing,listing,state.previous_witness_id).run();
  if(Number(written.meta?.changes)!==1)return response({error:'This exact owner follow-up or photo-renewal source receipt is already recorded. Refresh the evidence; do not repeat it.'},409);
  return response({receipt_id:Number(written.meta?.last_row_id)||null,
   witness_followup_recorded:follow,independent_photo_renewal_recorded:renew,
   decision:'LOCAL_ONLY_HOLD',message:renew?'Current three-original photo evidence independently rechecked. Final Etsy approval remains separate.':
    'Local owner witness follow-up stored. The Etsy claim is not reassigned or automatically accepted.'});
 }catch{return response({error:'HOLD — current Product, photo or audit proof was unavailable.'},503);}
}
