// Release 467 Build 402: evidence-only reconciliation of one-attempt Etsy image uploads.
import {validId} from './etsyListingEvidence400.mjs';
import {inspectListingImages} from './etsyDraftImages401.mjs';
export const parseReceipt=(row)=>{try{const x=JSON.parse(row?.details_json||'{}');return x&&typeof x==='object'?x:null;}catch{return null;}};
export const imageId=x=>validId(x)?String(x):null;
export function reconcileClassification({listing,images,claim,uploaded,reconciled,review}){
 const photo=inspectListingImages(images),claimInfo=parseReceipt(claim),uploadInfo=parseReceipt(uploaded),reconcileInfo=parseReceipt(reconciled),reviewInfo=parseReceipt(review);
 const blockers=[];
 if(!listing||String(listing.state).toLowerCase()!=='draft')blockers.push('provider_listing_not_unpublished');
 if(claim&&String(claimInfo?.listing_id)!==String(listing?.listing_id))blockers.push('image_claim_listing_mismatch');
 if(uploaded&&(!claim||String(uploadInfo?.listing_id)!==String(listing?.listing_id)))blockers.push('upload_receipt_listing_mismatch');
 const known=imageId(uploadInfo?.image_id),knownPresent=!!known&&photo.images.some(x=>x.id===known);
 const manuallyConfirmed=imageId(reconcileInfo?.image_id),manualPresent=!!manuallyConfirmed&&photo.images.some(x=>x.id===manuallyConfirmed);
 if(uploaded&&(!known||!knownPresent))blockers.push('accepted_image_no_longer_verified_live');
 if(reconciled&&(!manuallyConfirmed||!manualPresent))blockers.push('reconciled_image_no_longer_verified_live');
 if(!photo.has_image)blockers.push('provider_images_missing');
 let upload_outcome='NO_BUILD401_ATTEMPT';
 if(claim&&!uploaded&&!reconciled)upload_outcome=photo.has_image?'AMBIGUOUS_PRESENT_NEEDS_OWNER_CORROBORATION':'UNKNOWN_AFTER_CLAIM';
 if(claim&&uploaded)upload_outcome=knownPresent?'PROVIDER_ID_VERIFIED_LIVE':'PROVIDER_ID_MISMATCH_HOLD';
 if(claim&&!uploaded&&reconciled)upload_outcome=manualPresent?'OWNER_CORROBORATED_PRESENT':'CORROBORATED_ID_MISSING_HOLD';
 if(!claim&&photo.has_image)upload_outcome='PRE_EXISTING_IMAGE_MANUAL_REVIEW';
 if(!review)blockers.push('build401_compliance_review_receipt_missing');
 if(review&&(!Array.isArray(reviewInfo?.image_ids)||!reviewInfo.image_ids.length))blockers.push('review_receipt_image_evidence_invalid');
 return {photo,upload_outcome,accepted_image_id:knownPresent?known:null,
  corroborated_image_id:manualPresent?manuallyConfirmed:null,
  reviewed_image_ids:Array.isArray(reviewInfo?.image_ids)?reviewInfo.image_ids.map(imageId).filter(Boolean):[],
  blockers,can_consider_final_acceptance:!blockers.length,
  etsy_is_draft:!blockers.includes('provider_listing_not_unpublished'),
  no_provider_mutation:true,no_auto_retry:true,publication_performed:false};
}
export const strictOwnerApproval=(body)=>Boolean(body?.owner_confirmed_current_photo===true&&
 body?.owner_confirmed_compliance===true&&body?.owner_acknowledges_unpublished===true&&
 body?.owner_approves_local_acceptance===true);
export function finalReviewReady(report,id,hasImageClaim){
 const selected=imageId(id),reasons=[...report.blockers];
 if(!selected||!report.photo.images.some(x=>x.id===selected))reasons.push('selected_image_not_verified_live');
 if(selected&&!report.reviewed_image_ids.includes(selected))reasons.push('build401_review_not_for_selected_image');
 if(hasImageClaim&&selected&&selected!==report.accepted_image_id&&selected!==report.corroborated_image_id)
  reasons.push('claimed_image_requires_verified_upload_or_owner_reconciliation');
 return {ready:reasons.length===0,reasons,selected_image_id:selected};
}
