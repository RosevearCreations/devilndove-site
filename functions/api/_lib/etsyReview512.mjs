/* Build 512: local Etsy claim/photo conflicts remain evidence, never an implicit repair. */
export const listing512='4603838854';
export const sourceOriginals512=Object.freeze([344,345,346]);
const parse=row=>{try{return JSON.parse(row?.details_json||'{}');}catch{return {};}};
const numeric=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):null;

export function conflictReview512({claim,receipts=[],witness=null,renewal=null,live=null,actorId=0}){
 const state=String(claim?.claim_state||'unknown');
 const realLink=claim?.confirmed===true&&claim?.listing_id===listing512;
 const media=receipts.map(row=>({id:numeric(row.admin_action_audit_id),...parse(row)}))
  .filter(row=>sourceOriginals512.includes(Number(row.product_image_id)));
 const foreign=media.filter(row=>row.verified_remote_readback===true&&String(row.listing_id)!==listing512);
 const missing=sourceOriginals512.filter(id=>!media.some(row=>Number(row.product_image_id)===id&&
   String(row.listing_id)===listing512&&row.verified_remote_readback===true&&numeric(row.etsy_image_id)));
 const oldWitness=parse(witness),oldRenewal=parse(renewal);
 const rows=live?.photo_freshness_509?.rows||[];
 const currentDigest=String(live?.evidence_fingerprint_508||'');
 const three=realLink&&live?.verified_unpublished===true&&live?.verified_canada_only===true&&
  live.photo_freshness_509?.ready===true&&rows.length===3&&sourceOriginals512.every(id=>
   rows.some(row=>row.product_image_id===id&&row.ready&&row.receipt_confirmed&&
     row.original_image_url&&row.etsy_image_url&&numeric(row.etsy_image_id)));
 const renewed=oldRenewal.build===511&&oldRenewal.decision==='current_evidence_renewed_local_only'&&
  oldRenewal.listing_id===listing512&&oldRenewal.source_claim_receipt_id===claim?.receipt_id&&
  oldRenewal.evidence_fingerprint===currentDigest&&/^[a-f\d]{64}$/.test(currentDigest)&&
  sourceOriginals512.every(id=>oldRenewal.original_photo_ids?.includes(id));
 const separate=numeric(actorId)&&numeric(renewal?.actor_user_id)&&Number(actorId)!==Number(renewal?.actor_user_id);
 const photoReady=Boolean(three&&renewed&&separate&&foreign.length===0&&missing.length===0);
 const notes=[];
 if(!realLink)notes.push('Product #53 has no unique D1 primary claim to this exact Etsy draft.');
 if(foreign.length)notes.push('An accepted media receipt refers to a different Etsy listing ID; manual source review required.');
 if(missing.length)notes.push('Missing exact-listing original photo receipts: '+missing.join(', ')+'.');
 if(!three)notes.push('Fresh unpublished Canada-only Etsy and original-photo URL readback is not verified.');
 if(!renewed)notes.push('A matching Build 511 independent renewal for the current fingerprint is missing or stale.');
 if(!separate)notes.push('Build 512 recheck requires a different verified Admin from Build 511 renewal.');
 return {build:512,product_id:53,listing_id:listing512,claim_state:state,
  claim_receipt_id:claim?.receipt_id||null,linked:realLink,
  conflicting_photo_receipt_ids:foreign.map(row=>row.id),conflicting_receipt_count:foreign.length,
  missing_original_ids:missing,original_photo_pairs:rows,
  prior_witness_followup_id:witness?.admin_action_audit_id||null,
  prior_witness_claim_state:oldWitness.source_claim_state||null,
  prior_photo_renewal_id:renewal?.admin_action_audit_id||null,
  current_evidence_fingerprint:currentDigest||null,
  independent_reviewer:Boolean(separate),current_three_verified:Boolean(three),
  can_record_conflict_witness:state!=='unknown',can_record_independent_photo_recheck:photoReady,
  issues:notes,provider_modified:false,local_claim_reassigned:false,
  photo_receipt_repaired:false,owner_final_acceptance_recorded:false};
}
