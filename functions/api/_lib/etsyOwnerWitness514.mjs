/* Build 514: independent owner-witness evidence triage only.
 * Local observation cannot heal a historical listing/media claim or certify
 * independent owner identity, Etsy final acceptance or provider publication. */
const parse=row=>{try{return JSON.parse(row?.details_json||'{}');}catch{return {};}};
export function ownerWitnessReadiness514({evidence513,priorOwner=null,priorContent=null,actorId=0}){
 const owner=parse(priorOwner),content=parse(priorContent);
 // Build 513's actor-relative *Build 512* reviewer warning does not apply to
 // a later Build 514 reviewer: here the independence target is Build 513.
 const issues=[...(evidence513?.issues||[])].filter(x=>
   !String(x).includes('Independent content correction recheck requires a different verified Admin from the Build 512 photo reviewer.'));
 const claimState=String(evidence513?.source_claim_state||'unknown');
 const contentId=Number(priorContent?.admin_action_audit_id)||null;
 const validContent=content.build===513&&content.decision==='independent_content_evidence_rechecked_only'&&
   content.provider_modified===false&&content.product_id===53&&content.listing_id==='4603838854'&&
   /^[a-f0-9]{64}$/.test(String(content.evidence_fingerprint||''))&&
   content.evidence_fingerprint===evidence513?.current_evidence_fingerprint&&
   content.source_claim_receipt_id===evidence513?.source_claim_receipt_id;
 const independent=Number(actorId)>0&&Number(priorContent?.actor_user_id)>0&&
   Number(actorId)!==Number(priorContent.actor_user_id);
 const unique=claimState==='same_product'&&evidence513?.etsy_readback_ready===true;
 const freshContent=evidence513?.description_sufficient===true&&
   evidence513?.tags_require_owner_correction===false&&
   /^[a-f0-9]{64}$/.test(String(evidence513?.current_evidence_fingerprint||''))&&
   !(evidence513?.missing_original_ids||[]).length;
 if(!validContent)issues.push('No matching prior Build 513 independent corrected-content receipt at the exact current listing/photograph fingerprint.');
 if(!independent)issues.push('Independent disposition review requires a different verified Admin from the Build 513 content reviewer.');
 if(!unique)issues.push('Product #53 must uniquely claim the exact same unpublished Etsy draft in the current primary source readback.');
 if(!freshContent)issues.push('Current saved description, channel tags and exact three-original fingerprint must be fresh and approved for recheck.');
 if(evidence513?.conflicting_photo_receipt_ids?.length)issues.push('Historical conflicting Etsy photo listing IDs remain unresolved; no automatic closure.');
 if(evidence513?.tags_require_owner_correction)issues.push('Saved Product channel tags still need an actual owner content correction.');
 const canRecordRecheck=Boolean(unique&&freshContent&&validContent&&independent&&issues.length===0);
 return {build:514,product_id:53,listing_id:'4603838854',claim_state:claimState,
  claim_receipt_id:evidence513?.source_claim_receipt_id||null,
  conflicting_photo_receipt_ids:evidence513?.conflicting_photo_receipt_ids||[],
  current_evidence_fingerprint:evidence513?.current_evidence_fingerprint||null,
  prior_owner_witness_id:Number(priorOwner?.admin_action_audit_id)||null,
  prior_owner_witness_observation:owner.decision==='factual_owner_draft_observation_only',
  prior_content_recheck_id:contentId,prior_content_reviewer_id:Number(priorContent?.actor_user_id)||null,
  can_record_factual_owner_observation:Boolean(evidence513?.product_id===53),
  can_record_independent_disposition_recheck:canRecordRecheck,
  disposition_status:canRecordRecheck?'LOCAL_RECHECK_ELIGIBLE_NOT_CLOSED':'UNRESOLVED_HOLD',
  issues,final_owner_content_acceptance:false,independent_owner_identity_verified:false,
  all_three_etsy_photos_finally_accepted:false,etsy_draft_created:false,
  provider_modified:false,publication_performed:false,connection_state:'DISCONNECTED'};
}
