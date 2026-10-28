/* Build 512: factual claim/media conflict witness and separate unchanged-photo recheck.
 * This endpoint never changes a marketplace claim, photo, Etsy listing or permission. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {linkedReceipt506} from './product-etsy-existing-draft.js';
import {reviewOwnerEtsy504} from './product-etsy-owner-signoff-504.js';
import {conflictReview512,listing512} from '../_lib/etsyReview512.mjs';

const uuid=x=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(x||''));
const response=(data,status=200)=>jsonResponse({ok:status<400,build:512,product_id:53,
 candidate_listing_id:listing512,connection_state:'HOLD',provider_modified:false,
 publication_performed:false,etsy_draft_created:false,local_claim_reassigned:false,
 photo_receipt_repaired:false,owner_final_acceptance_recorded:false,...data},status,{'Cache-Control':'no-store'});
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:response({error:'Verified Admin required.'},401)}:
  !db?{error:response({error:'D1 evidence ledger unavailable.'},503)}:{admin,db};};
async function read(c,db,actor){
 const [claim,receipts,witness,renewal]=await Promise.all([
  linkedReceipt506(db,53,listing512),
  db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type IN ('etsy_product_editor_image_443_accepted','etsy_505_owner_existing_image_matched') AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 60").all(),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_511_claim_witness_followup' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='etsy_511_independent_photo_evidence_renewed' AND target_type='product' AND target_key='53' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 let live=null,remote_error=null;
 if(claim.confirmed)try{live=await reviewOwnerEtsy504(c,db,53);}catch(e){remote_error=String(e?.message||'unavailable').slice(0,150);}
 const result=conflictReview512({claim,receipts:receipts?.results||[],witness,renewal,live,actorId:actor.user_id});
 if(remote_error){result.issues.push('Current Etsy readback failed: '+remote_error);result.can_record_independent_photo_recheck=false;}
 return result;
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 if(new URL(c.request.url).searchParams.get('product_id')!=='53')return response({error:'Exact Product #53 required.'},400);
 try{return response({...await read(c,g.db,g.admin),read_only:true});}
 catch{return response({error:'D1 listing/photo evidence unavailable; owner HOLD remains.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same-origin required.'},403);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON required.'},400);}
 const observe=b?.action==='witness_conflict',recheck=b?.action==='independent_photo_recheck';
 if((!observe&&!recheck)||!uuid(b.request_key)||b.product_id!==53||
   String(b.listing_id)!==listing512||b.confirm_no_changes!==true)
  return response({error:'Exact listing, idempotency key and no-provider-write confirmation required.'},400);
 if(observe&&(b.confirm_inspected_existing_draft!==true||typeof b.observation!=='string'||
   b.observation.trim().length<20||b.observation.length>600))
  return response({error:'Record a factual 20–600 character owner observation of the existing draft.'},400);
 if(recheck&&(b.confirm_photo_344!==true||b.confirm_photo_345!==true||b.confirm_photo_346!==true||
   b.confirm_visual_match!==true||b.confirm_separate_reviewer!==true||
   !/^[a-f\d]{64}$/.test(String(b.evidence_fingerprint||''))))
  return response({error:'All three photographs, fingerprint and independent human visual recheck are required.'},400);
 try{const state=await read(c,g.db,g.admin);
  if(b.expected_claim_state!==state.claim_state||b.expected_claim_receipt_id!==(state.claim_receipt_id||null)||
    JSON.stringify(b.expected_conflicting_receipt_ids)!==JSON.stringify(state.conflicting_photo_receipt_ids))
   return response({error:'Primary Etsy claim or photo receipt changed. Recheck before recording anything.'},409);
  if(observe&&!state.can_record_conflict_witness)return response({error:'Source claim not readable.'},409);
  if(recheck&&(!state.can_record_independent_photo_recheck||state.current_evidence_fingerprint!==b.evidence_fingerprint||
    state.prior_photo_renewal_id!==Number(b.prior_photo_renewal_id)))
   return response({error:'HOLD — current Etsy/source photo pairs or independent renewal proof are not verified.',issues:state.issues},409);
  const action=observe?'etsy_512_local_conflict_witness':'etsy_512_independent_photo_recheck';
  const detail={build:512,request_key:b.request_key,product_id:53,listing_id:listing512,
   source_claim_state:state.claim_state,source_claim_receipt_id:state.claim_receipt_id,
   conflicting_photo_receipt_ids:state.conflicting_photo_receipt_ids,
   previous_witness_id:state.prior_witness_followup_id,
   previous_photo_renewal_id:recheck?state.prior_photo_renewal_id:null,
   evidence_fingerprint:recheck?state.current_evidence_fingerprint:null,
   original_photo_ids:recheck?[344,345,346]:[],
   factual_observation:observe?b.observation.trim():null,
   decision:observe?'observed_local_conflict_only':'independently_rechecked_unchanged_photos_only',
   external_etsy_acceptance:false,provider_modified:false,publication_performed:false};
  // Lease the current source claim and prior renewal at insert time. A remote
  // Etsy readback can change independently; this local audit never lifts HOLD.
  const inserted=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,'product','53','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type='product' AND target_key='53' AND json_extract(details_json,'$.request_key')=?) AND (?=0 OR ((SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=1 AND EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) AND EXISTS (SELECT 1 FROM admin_action_audit WHERE admin_action_audit_id=? AND action_type='etsy_511_independent_photo_evidence_renewed' AND actor_user_id<>? AND json_extract(details_json,'$.evidence_fingerprint')=?))) AND (?=1 OR (?=CASE WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)=0 THEN 'unclaimed' WHEN (SELECT COUNT(*) FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=?)>1 THEN 'multiple_local_claims' WHEN EXISTS (SELECT 1 FROM marketplace_syndication_drafts WHERE channel_key='etsy' AND external_reference=? AND product_id=53) THEN 'same_product' ELSE 'another_product' END))")
   .bind(g.admin.user_id,action,new URL(c.request.url).pathname,JSON.stringify(detail),action,b.request_key,
    recheck?1:0,listing512,listing512,recheck?state.prior_photo_renewal_id:null,g.admin.user_id,
    recheck?state.current_evidence_fingerprint:null,recheck?1:0,state.claim_state,listing512,listing512,listing512).run();
  if(Number(inserted.meta?.changes)!==1)return response({error:'Current ownership or prior receipt changed, or this witness is already recorded. Refresh first.'},409);
  return response({receipt_id:Number(inserted.meta?.last_row_id)||null,
   conflict_witness_recorded:observe,independent_photo_recheck_recorded:recheck,
   decision:'LOCAL_ONLY_HOLD',message:'A local source-evidence observation was recorded. Etsy and gateway remain unchanged.'});
 }catch{return response({error:'Source-ledger or remote evidence unavailable; HOLD remains.'},503);}
}
