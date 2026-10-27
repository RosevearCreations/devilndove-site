/* Build 505 — pure owner decision checks. Never infer an image match from URLs. */
export const validEtsyId505=value=>/^[1-9]\d{0,14}$/.test(String(value??''))&&Number.isSafeInteger(Number(value));
export const validOwnerKey505=value=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(value||''));
export const sameEtsyTitle505=(left,right)=>String(left??'').trim().toLocaleLowerCase()===String(right??'').trim().toLocaleLowerCase();

export function reassignmentReview505({target,claimant,listing,priorClaims=0,otherClaims=0}){
  const issues=[];
  if(!target||!claimant||!listing)issues.push('Both local Products and the actual Etsy draft must be verified.');
  if(target&&listing&&!sameEtsyTitle505(target.name,listing.title))
    issues.push('The Etsy title does not match this Product. Correct the record manually before changing any link.');
  if(claimant&&listing&&sameEtsyTitle505(claimant.name,listing.title))
    issues.push('The other local Product has the same title as the Etsy draft. Ownership is ambiguous; do not move its receipt.');
  if(Number(priorClaims)>0)issues.push('The other Product has attempted Etsy writes or photo receipts. These must be reviewed independently before moving its link.');
  if(Number(otherClaims)>0)issues.push('More than one local receipt claims this Etsy ID. An administrator must reconcile those receipts separately.');
  return {safe_to_offer:issues.length===0,issues};
}

export function ownerPhotoMatches505({gallery=[],remoteImages=[],receipts=[],listingId,productImageId,etsyImageId}){
  const image=gallery.find(row=>Number(row.product_image_id)===Number(productImageId));
  const remote=remoteImages.find(row=>String(row.listing_image_id)===String(etsyImageId));
  const existing=receipts.filter(row=>String(row.listing_id)===String(listingId));
  const issues=[];
  if(!image)issues.push(`Original Product photo #${productImageId} is not in the approved canonical gallery.`);
  if(!remote)issues.push(`Etsy photo #${etsyImageId} is not on the verified unpublished listing.`);
  if(existing.some(row=>Number(row.product_image_id)===Number(productImageId)))issues.push(`Product photo #${productImageId} already has a saved Etsy receipt.`);
  if(existing.some(row=>String(row.etsy_image_id)===String(etsyImageId)))issues.push(`Etsy photo #${etsyImageId} already has a saved Product receipt.`);
  return {ready:issues.length===0,issues};
}
