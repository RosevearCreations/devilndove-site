// Release 467 Build 410 — pure, fail-closed draft outcome and manual recovery evidence.
import {parseReceipt} from './listingSyncOperator408.mjs';
const receiptId = r => Number(r?.admin_action_audit_id || 0);
const hash = s => {let x=2166136261;for(const c of s){x^=c.charCodeAt(0);x=Math.imul(x,16777619);}return (x>>>0).toString(16).padStart(8,'0');};
export const CASE_ACTIONS=Object.freeze({hold:'HOLD_FOR_MANUAL_REVIEW',close:'CLOSED_WITH_VERIFIED_DRAFT_PROOF'});
export function verifiedDraftEvidence({claim,verified,draft}={}){
 const proof=parseReceipt(verified),listing=String(draft?.external_reference||'');
 return !!claim&&!!verified&&receiptId(claim)>0&&receiptId(verified)>0&&
  String(proof.claim_receipt||'')===String(receiptId(claim))&&
  /^[1-9][0-9]*$/.test(listing)&&String(proof.listing_id||'')===listing&&
  proof.listing_state==='draft'&&proof.provider_get_only===true&&
  proof.local_link_only===true&&proof.publication_performed===false;
}
export function outcomeState({claim,verified,draft,latestCase}={}){
 const hasAttempt=receiptId(claim)>0;
 const proofOk=verifiedDraftEvidence({claim,verified,draft});
 const caseData=parseReceipt(latestCase);
 const latestClose=caseData.outcome===CASE_ACTIONS.close&&
    Number(caseData.claim_receipt)===receiptId(claim)&&
    Number(caseData.verified_receipt)===receiptId(verified)&&
    String(caseData.listing_id||'')===String(draft?.external_reference||'')&&proofOk;
 const conflict=hasAttempt&&!!verified&&!proofOk;
 const state=!hasAttempt?'NOT_ATTEMPTED':conflict?'EVIDENCE_CONFLICT_HOLD':
   proofOk?(latestClose?'VERIFIED_CASE_CLOSED':'VERIFIED_DRAFT_PENDING_CASE_CLOSE'):'REMOTE_ATTEMPT_OUTCOME_UNKNOWN_HOLD';
 return {state,can_open_hold:hasAttempt&&!proofOk,
   can_close_with_proof:hasAttempt&&proofOk&&!latestClose,
   manual_investigation_required:hasAttempt&&!proofOk,
   provider_verification_snapshot:proofOk,provider_live_state_verified_now:false,
   no_retry_allowed:hasAttempt,publication_allowed:false,us_shipping_suspended:true,
   last_case_receipt:receiptId(latestCase),last_case_decision:caseData.outcome||null,
   attempt_claim_receipt:receiptId(claim),build400_proof_receipt:receiptId(verified),
   linked_listing_id:String(draft?.external_reference||'')||null};
}
export function evidenceToken({productId,draft,claim,verified,latestCase,trial,sourceFingerprint}={}){
 return hash(JSON.stringify([Number(productId),String(draft?.id||''),String(draft?.status||''),
 String(draft?.updated_at||''),String(draft?.external_reference||''),receiptId(claim),
 receiptId(verified),receiptId(latestCase),receiptId(trial),String(sourceFingerprint||'')]));
}
export function caseDecisionValid({action,status,body}={}){
 if(!body||typeof body.operator_note!=='string'||body.operator_note.trim().length<12||
    body.operator_note.trim().length>600||body.confirmed_no_retry!==true||
    body.confirmed_no_publication!==true||body.us_shipping_disabled!==true)return false;
 if(action==='hold')return status?.can_open_hold===true;
 if(action==='close')return status?.can_close_with_proof===true&&
    body.confirmed_build400_verified_unpublished_draft===true;
 return false;
}
