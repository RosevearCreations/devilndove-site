/* Build 511 -- factual local witness follow-up and independent photo-evidence renewal.
 * A current URL/receipt match does not prove visual pixel equality or Etsy approval. */
export const originalIds511=Object.freeze([344,345,346]);
const parse=x=>{try{return JSON.parse(x||'{}')}catch{return {}}};
export function evidenceRenewal511({claim,review=null,witness=null,retest=null,reviewerId=0}){
 const note=parse(witness?.details_json),prior=parse(retest?.details_json),
  photos=review?.photo_freshness_509;
 const link=claim?.confirmed===true&&claim.listing_id==='4603838854';
 const rows=Array.isArray(photos?.rows)?photos.rows:[];
 const three=photos?.ready===true&&rows.length===3&&originalIds511.every(photo=>
  rows.some(row=>row.product_image_id===photo&&row.ready&&row.receipt_confirmed&&
   row.original_image_url&&row.etsy_image_url&&row.etsy_image_id));
 const current=String(review?.evidence_fingerprint_508||'');
 const sameDigest=/^[a-f0-9]{64}$/.test(current)&&current===prior.evidence_fingerprint;
 const sameListing=String(prior.listing_id||'')==='4603838854'&&prior.source_claim_receipt_id===claim?.receipt_id;
 const sourceRetested=prior.build===510&&prior.source_evidence_verified===true&&
  Array.isArray(prior.photo_original_ids)&&originalIds511.every(photo=>prior.photo_original_ids.includes(photo))&&
  prior.publication_performed===false&&prior.provider_modified===false;
 const independent=Number(retest?.actor_user_id)>0&&Number(reviewerId)>0&&
  Number(retest.actor_user_id)!==Number(reviewerId);
 const missing=[];
 if(!link)missing.push('Exact Etsy listing is not uniquely claimed by Product #53 in D1 primary.');
 if(!review?.verified_unpublished||!review?.verified_canada_only)missing.push('Current unpublished Canada-only Etsy readback is missing.');
 if(!three)missing.push('Fresh original #344–346 URLs, Etsy image URLs or unique media receipts do not fully match.');
 if(!sourceRetested||!sameListing)missing.push('Prior Build 510 owner visual retest for the exact saved Product/Etsy link is missing.');
 if(!sameDigest)missing.push('The earlier photo evidence digest is absent or stale; a fresh owner retest is required.');
 if(!independent)missing.push('Photo renewal requires a different authenticated Admin from the Build 510 owner retest.');
 return {build:511,listing_id:'4603838854',claim_state:claim?.claim_state||'unknown',
  linked:link,claim_receipt_id:claim?.receipt_id||null,
  previous_witness_id:witness?.admin_action_audit_id||null,previous_witness_claim_state:note.source_claim_state||null,
  previous_retest_id:retest?.admin_action_audit_id||null,
  previous_retest_actor_id:retest?.actor_user_id||null,
  current_evidence_fingerprint:current||null,evidence_unchanged:sameDigest,
  fresh_three_original_pairs:three,original_photo_pairs:rows,
  current_unpublished_canada_only:review?.verified_unpublished===true&&review?.verified_canada_only===true,
  can_record_witness_followup:Boolean(witness)&&note.product_id===53&&note.listing_id==='4603838854'&&
   note.conclusion==='observation_only_not_provider_verified',
  independent_reviewer:independent,
  can_record_photo_renewal:missing.length===0,
  issues:missing,owner_final_acceptance_recorded:false,provider_modified:false,publication_performed:false};
}
