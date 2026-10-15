// Release 467 Build 401 — validation only. No automatic Etsy mutation.
import {verifyRemote,validId} from './etsyListingEvidence400.mjs';
export const MAX_IMAGE_BYTES=8*1024*1024;
export const imageType=(buf)=>{
 const a=new Uint8Array(buf);
 if(a.length>=3&&a[0]===255&&a[1]===216&&a[2]===255)return {mime:'image/jpeg',extension:'jpg'};
 if(a.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>a[i]===x))return {mime:'image/png',extension:'png'};
 return null;
};
export function checkedImage(file,bytes,alt){
 const reasons=[],kind=imageType(bytes);
 if(!file||!Number.isFinite(Number(file.size))||Number(file.size)<100||Number(file.size)>MAX_IMAGE_BYTES)reasons.push('image_size_invalid');
 if(!kind||!['image/jpeg','image/png'].includes(String(file?.type||'').toLowerCase())||kind.mime!==String(file?.type||'').toLowerCase())reasons.push('image_type_or_magic_invalid');
 if(!String(alt||'').trim()||String(alt).length>500)reasons.push('alt_text_required_up_to_500');
 return {ok:reasons.length===0,reasons,mime:kind?.mime||null,extension:kind?.extension||null,size:Number(file?.size||0)};
}
export function inspectListingImages(raw){
 const arr=Array.isArray(raw?.results)?raw.results:[];
 const seen=new Set(),images=[];
 for(const item of arr.slice(0,15)){
  if(!validId(item?.listing_image_id)||seen.has(String(item.listing_image_id)))continue;
  seen.add(String(item.listing_image_id));
  const w=Number(item.full_width||0),h=Number(item.full_height||0);
  images.push({id:String(item.listing_image_id),rank:Number(item.rank||0),
   alt_text_present:!!String(item.alt_text||'').trim(),
   width:Number.isSafeInteger(w)?w:0,height:Number.isSafeInteger(h)?h:0});
 }
 return {images,image_count:images.length,has_image:images.length>0,
   image_quality_review_required:images.some(x=>x.width>0&&x.width<1000)};
}
export const complianceKeys=Object.freeze(['image_rights_confirmed','image_matches_product','description_and_materials_reviewed',
 'ingredients_and_required_labels_reviewed','claims_and_safety_reviewed','shipping_returns_reviewed']);
export function consentValid(b){
 return !!b&&b.confirmed_unpublished_only===true&&b.confirmed_one_attempt_no_retry===true&&
 complianceKeys.every(key=>b[key]===true)&&/^[a-fA-F0-9-]{32,50}$/.test(String(b.request_key||''));
}
export function statusForDraft(listing,shop,product,draft,claim,images,reviewConfirmed){
 const listingEvidence=verifyRemote(listing,shop,product,draft,claim);
 const photo=inspectListingImages(images),blockers=[...listingEvidence.blockers];
 if(!photo.has_image)blockers.push('listing_photo_missing');
 if(!reviewConfirmed)blockers.push('manual_compliance_confirmation_missing');
 return {provider_verified:listingEvidence.verified,listing_evidence:listingEvidence,photo,
  readiness:!blockers.length?'READY_FOR_MANUAL_ETSY_REVIEW':'HOLD_REVIEW',blockers,
  published:false,etsy_activation_performed:false};
}
