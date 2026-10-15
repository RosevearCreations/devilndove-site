// Release 467 Build 403 — deterministic, read-only draft exception classification.
import {validId,verifyRemote} from './etsyListingEvidence400.mjs';
import {reconcileClassification,parseReceipt,finalReviewReady,imageId} from './etsyImageReconciliation402.mjs';

export const decisionCategories=Object.freeze(['PHOTO_REVIEW','PRODUCT_COMPLIANCE','SHIPPING_DESTINATIONS','ETSY_ACCOUNT','PROVIDER_MISMATCH','OTHER']);
export const validRequestKey=x=>/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(String(x||''));
export const ownerReadyConsent=x=>x?.owner_checked_product===true&&x?.owner_checked_images===true&&
 x?.owner_checked_shipping===true&&x?.owner_checked_etsy_policies===true&&
 x?.owner_acknowledges_no_publication===true&&x?.owner_approves_manual_decision===true;
export const validException=(category,notes)=>decisionCategories.includes(category)&&
 typeof notes==='string'&&notes.trim().length>=12&&notes.trim().length<=1200;
export const priorDecision=x=>parseReceipt(x);

export function assessDraftPublicationReadiness({listing,images,shop,product,draft,claim,imageClaim,uploaded,reconciled,review,accepted,selected_image_id,shipping_reviewed}){
 const remote=verifyRemote(listing,shop,product,draft,claim);
 const image=reconcileClassification({listing,images,claim:imageClaim,uploaded,reconciled,review});
 const selected=imageId(selected_image_id||parseReceipt(accepted)?.image_id);
 const final=finalReviewReady(image,selected,!!imageClaim);
 const blockers=[...remote.blockers,...final.reasons];
 const finalReceipt=parseReceipt(accepted);
 if(!accepted)blockers.push('build402_final_owner_acceptance_missing');
 if(accepted&&finalReceipt?.listing_id!==String(listing?.listing_id))blockers.push('build402_final_listing_identity_conflict');
 if(accepted&&finalReceipt?.image_id!==selected)blockers.push('build402_final_image_identity_conflict');
 if(accepted&&finalReceipt?.compliance_review_receipt!==review?.admin_action_audit_id)
  blockers.push('build402_review_receipt_conflict');
 if(!shipping_reviewed)blockers.push('shipping_restrictions_owner_review_missing');
 const errors=[...new Set(blockers)];
 return {readiness:errors.length===0?'READY_FOR_SEPARATE_MANUAL_ETSY_DECISION':'HOLD_OWNER_REVIEW',
  blockers:errors,listing_id:validId(listing?.listing_id)?String(listing.listing_id):null,
  selected_image_id:selected,
  image_count:image.photo.image_count,upload_outcome:image.upload_outcome,
  build402_acceptance_receipt:accepted?.admin_action_audit_id||null,
  draft_state:String(listing?.state||'unavailable'),image_ids:image.photo.images.map(x=>x.id),
  no_provider_write:true,publication_performed:false,requires_separate_manual_publish:true};
}
