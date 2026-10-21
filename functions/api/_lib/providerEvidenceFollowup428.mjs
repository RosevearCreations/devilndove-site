// Release 467 Build 428 — bounded evidence follow-up checklist, no external assertion.
export function reviewEvidenceFollowup428(source) {
 const r=source?.review;
 const errors=[];
 if(source?.ok!==true||source?.build!==427||source?.read_only!==true||source?.local_only!==true||
    source?.provider_called!==false||source?.automatic_closure!==false||
    source?.us_shipping_suspended!==true||r?.build!==427||r?.read_only!==true||
    r?.human_closure_authorized!==false||r?.independent_provider_verified!==false)
   errors.push('PROVENANCE_SOURCE_UNTRUSTED');
 if(!Number.isSafeInteger(r?.reviewed_acceptance_receipt)||r.reviewed_acceptance_receipt<1)
   errors.push('ACCEPTANCE_RECEIPT_MISSING');
 if(!/^[0-9a-f]{8}$/.test(String(r?.source_signature||'')))
   errors.push('SOURCE_SIGNATURE_MISSING');
 if(!Array.isArray(r?.holds)||!r.holds.includes('PROVIDER_EVIDENCE_MUST_BE_INDEPENDENTLY_VERIFIED')||
   !r.holds.includes('MANUAL_CLOSURE_DECISION_NOT_RECORDED'))
   errors.push('MANDATORY_MANUAL_HOLDS_MISSING');
 return {
  build:428,read_only:true,local_only:true,
  status:'PENDING_INDEPENDENT_PROVIDER_EVIDENCE_AND_HUMAN_DECISION',
  source_integrity_holds:errors,
  review_checklist:[
   {id:'external_evidence',label:'Independently retrieve and verify current provider evidence',complete:false},
   {id:'case_match',label:'Check provider evidence against the exact selected case and destination',complete:false},
   {id:'owner_review',label:'Present independently verified evidence to authorized human owner',complete:false},
   {id:'separate_decision',label:'Record explicit human closure decision in a separately authorized workflow',complete:false}
  ],
  evidence_verified:false,manual_decision_recorded:false,closure_authorized:false,
  provider_called:false,publication_performed:false,notifications_sent:false,
  automatic_closure:false,automatic_reopen:false,us_shipping_suspended:true
 };
}
