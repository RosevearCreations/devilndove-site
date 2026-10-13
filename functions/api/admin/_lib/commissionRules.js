export const EVENTS=Object.freeze(['intake_review','quote_review','revision_review','deposit_request_review','customer_proof_review','handoff_review','progress_approval']);
export const STAGES=Object.freeze(['request_received','design_review','quote_in_review','production_planning','production_in_progress','quality_review','fulfillment_preparation']);
export const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
export function eventGuard(kind,sources){
 if(!EVENTS.includes(kind))return 'UNSUPPORTED_KIND';
 if(kind==='quote_review'&&!sources.quote)return 'SOURCE_QUOTE_REQUIRED';
 if(kind==='revision_review'&&!sources.revision)return 'SOURCE_REVISION_REQUIRED';
 if(kind==='deposit_request_review'&&!sources.paymentRequest)return 'SOURCE_PAYMENT_REQUEST_DRAFT_REQUIRED';
 if(kind==='customer_proof_review'&&sources.proof?.proof_status!=='approved')return 'CUSTOMER_PROOF_NOT_APPROVED';
 if(kind==='handoff_review'&&(!sources.job||!(sources.requestStatus==='accepted'||sources.proof?.proof_status==='approved')))return 'ACCEPTANCE_AND_JOB_DRAFT_REQUIRED';
 if(kind==='progress_approval'&&(!sources.activeOrderLink||!STAGES.includes(sources.stage)))return 'ORDER_LINK_AND_PROGRESS_STAGE_REQUIRED';
 if(kind==='progress_approval'&&['production_in_progress','quality_review'].includes(sources.stage)&&!sources.actualEvidence)return 'ACTUAL_PRODUCTION_EVIDENCE_REQUIRED';
 return null;
}
