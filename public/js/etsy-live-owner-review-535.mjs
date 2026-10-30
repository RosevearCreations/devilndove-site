/* Build 535: an OWNER-INITIATED readback of the real draft. Never treat an
 * empty remote gallery, a UI listing ID, or an unverified GET as acceptance. */
export function evaluateEtsyLiveOwnerReview535({productId,listingId,receipt,photos,tags}={}){
 const id=String(listingId||''),issues=[];
 const identityReady=Number(productId)>0&&receipt?.verified===true&&String(receipt.listing_id)===id&&/^[1-9]\d{0,14}$/.test(id);
 if(!identityReady)issues.push('The exact saved Product ↔ Etsy primary receipt is not verified. Inspect and link this existing draft first.');
 const expected=Number(photos?.gallery_photo_count),received=photos?.remote_reconciliation?.remote_count;
 const photoCount=Number.isInteger(received)&&received>=0?received:null;
 if(!photos||photos.provider_contacted!==true||String(photos.listing_id)!==id)
  issues.push('Actual Etsy draft photos have not been read back successfully.');
 else if(!Number.isInteger(expected)||expected<1)
  issues.push('The saved Product gallery has no approved photograph count.');
 else if(photoCount===null)
  issues.push('The actual number of Etsy photos is unverified.');
 else if(photoCount!==expected)
  issues.push(`Etsy has ${photoCount} of ${expected} Product photos. Review the missing originals using the same draft; a zero-photo draft is not photo acceptance.`);
 if(photos?.photo_pair_readback_529?.ready!==true)
  issues.push('Original-to-Etsy image IDs are not all independently matched to current photo receipts.');
 const photosReady=identityReady&&photos?.provider_contacted===true&&Number.isInteger(expected)&&expected>0&&photoCount===expected&&
  photos?.photo_pair_readback_529?.ready===true&&photos?.remote_reconciliation?.ready===true;
 if(!tags||tags.provider_contacted!==true||String(tags.listing_id)!==id)
  issues.push('Actual Etsy native tags have not been read back successfully.');
 else if(tags.ready!==true)
  issues.push(`Saved Product search tags need attention: ${(tags.blockers||[]).join(' ')||'enter valid tags and save Product.'}`);
 else if(tags.matching_tags!==true)
  issues.push('Actual Etsy tags differ from saved Product tags. Review them before authorizing a native tag replacement.');
 const tagsReady=identityReady&&tags?.provider_contacted===true&&tags?.ready===true&&tags?.matching_tags===true&&
  tags?.verified_draft===true&&tags?.verified_canada_only===true&&String(tags?.listing_id)===id;
 return {ready:identityReady&&photosReady&&tagsReady,identityReady,photosReady,tagsReady,
  expectedPhotoCount:Number.isInteger(expected)&&expected>=0?expected:null,remotePhotoCount:photoCount,
  issues:[...new Set(issues)]};
}
