// Release 467 Build 404 — exception resolution is audit-only, never Etsy publication.
import {parseReceipt,imageId} from './etsyImageReconciliation402.mjs';
import {assessDraftPublicationReadiness,ownerReadyConsent,validRequestKey} from './etsyDraftDecision403.mjs';

export const validHoldId=id=>/^[1-9]\d{0,15}$/.test(String(id??''))&&Number.isSafeInteger(Number(id));
export const evidenceDescription=s=>typeof s==='string'&&s.trim().length>=20&&s.trim().length<=1600;
export const fullConsent=b=>ownerReadyConsent(b)&&b?.owner_confirmed_correction===true;
export const receiptDetails=row=>parseReceipt(row);
export const holdIsOriginal=(hold,id,listing)=>{
 const d=receiptDetails(hold);
 return !!hold&&Number(hold.admin_action_audit_id)===Number(id)&&d?.decision==='HOLD_OWNER_REVIEW'&&
  d?.listing_id===String(listing);
};
export const evidenceForHold=(receipt,holdId,listing)=>{
 const d=receiptDetails(receipt);
 return !!receipt&&d?.hold_receipt===Number(holdId)&&d?.listing_id===String(listing)&&
 evidenceDescription(d?.operator_correction);
};
export const resolutionForHold=(receipt,holdId,listing)=>{
 const d=receiptDetails(receipt);
 return !!receipt&&d?.hold_receipt===Number(holdId)&&d?.listing_id===String(listing)&&d?.resolution==='RESOLVED_BY_FRESH_PROVIDER_GET';
};
export function gateFreshDraft(data){
 const report=assessDraftPublicationReadiness(data);
 const blockerSet=[...report.blockers];
 return {...report,can_close_exception:report.readiness==='READY_FOR_SEPARATE_MANUAL_ETSY_DECISION',
  unresolved_blockers:blockerSet,
  no_provider_write:true,no_publication:true,automatic_retry:false};
}
export const lastDecisionIsReady=row=>receiptDetails(row)?.decision==='READY_FOR_SEPARATE_MANUAL_ETSY_DECISION';
export const holdAfterReady=(holds,lastReady)=>{
 const readyId=Number(lastReady?.admin_action_audit_id||0);
 return holds.some(h=>Number(h.admin_action_audit_id)>readyId);
};
export function finalRevalidation({snapshot,activeHolds,lastDecision,lastHold,selectedImage,acceptance}){
 const blockers=[...snapshot.blockers];
 if(activeHolds.length)blockers.push('unresolved_owner_exception_holds');
 if(!lastDecisionIsReady(lastDecision))blockers.push('latest_403_decision_not_ready');
 if(lastHold&&Number(lastDecision?.admin_action_audit_id||0)<=Number(lastHold.admin_action_audit_id))
  blockers.push('403_ready_decision_precedes_latest_hold');
 if(!imageId(selectedImage)||imageId(selectedImage)!==snapshot.selected_image_id)
  blockers.push('selected_live_image_mismatch');
 if(!acceptance?.admin_action_audit_id)blockers.push('build402_acceptance_missing');
 return {status:blockers.length?'HOLD_REVALIDATION':'REVALIDATED_FOR_SEPARATE_MANUAL_ETSY_DECISION',
  blockers:[...new Set(blockers)],listing_id:snapshot.listing_id,
  selected_image_id:snapshot.selected_image_id,
  latest_403_receipt:lastDecision?.admin_action_audit_id||null,
  etsy_listing_state:snapshot.draft_state,
  publication_performed:false,publication_authorized:false,
  provider_write:false};
}
