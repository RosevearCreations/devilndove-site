/* Build 515: an independently observed owner discrepancy remains an unresolved
 * evidence item. This function never calls a provider or approves a draft. */
const parse=row=>{try{return JSON.parse(row?.details_json||'{}');}catch{return {};}};
export const DISPOSITIONS_515=Object.freeze([
 'needs_listing_identity_verification','needs_source_photo_repair',
 'needs_owner_content_correction','needs_external_etsy_evidence',
 'no_new_evidence_still_held']);
export function conflictReassessment515({review514,priorOwner=null,priorIndependent=null,actorId=0}){
 const owner=parse(priorOwner),independent=parse(priorIndependent);
 const issues=[...(review514?.issues||[])];
 const exactOwner=owner.build===514&&owner.product_id===53&&
   owner.listing_id==='4603838854'&&owner.decision==='factual_owner_draft_observation_only'&&
   owner.etsy_provider_modified===false&&owner.final_owner_approval===false&&
   typeof owner.observation_note==='string'&&owner.observation_note.trim().length>=30&&
   owner.claim_state===review514?.claim_state&&
   owner.claim_receipt_id===review514?.claim_receipt_id&&
   JSON.stringify(owner.conflicting_photo_receipt_ids)===JSON.stringify(review514?.conflicting_photo_receipt_ids);
 if(!exactOwner)issues.push('Current owner observation must match the exact saved listing claim and historical photo-receipt references.');
 const different=Number(actorId)>0&&Number(priorOwner?.actor_user_id)>0&&
   Number(actorId)!==Number(priorOwner.actor_user_id);
 if(!different)issues.push('A different verified Admin must perform the independent conflict reassessment.');
 const priorIndependentSameClaim=independent.build===514&&
   independent.decision==='independent_local_disposition_recheck_only'&&
   independent.claim_state===review514?.claim_state&&
   independent.claim_receipt_id===review514?.claim_receipt_id;
 const ownerId=Number(priorOwner?.admin_action_audit_id)||null;
 return {build:515,product_id:53,listing_id:'4603838854',
  source_claim_state:review514?.claim_state||'unknown',
  source_claim_receipt_id:review514?.claim_receipt_id||null,
  conflicting_photo_receipt_ids:review514?.conflicting_photo_receipt_ids||[],
  source_evidence_fingerprint:review514?.current_evidence_fingerprint||null,
  prior_owner_witness_id:ownerId,
  prior_independent_disposition_id:Number(priorIndependent?.admin_action_audit_id)||null,
  prior_independent_disposition_same_claim:priorIndependentSameClaim,
  can_record_independent_conflict_reassessment:Boolean(exactOwner&&different&&review514?.product_id===53),
  allowed_unresolved_dispositions:[...DISPOSITIONS_515],
  issues,reassessment_outcome:'OWNER_EXCEPTION_UNRESOLVED_HOLD',
  owner_identity_independently_verified:false,final_owner_approval:false,
  historical_media_conflict_resolved:false,etsy_provider_modified:false,
  listing_id_reassigned:false,etsy_draft_created:false,publication_performed:false,
  connection_state:'DISCONNECTED'};
}
