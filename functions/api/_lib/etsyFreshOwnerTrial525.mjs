/* Build 525 — compare original source images, recorded transfer receipts and
 * today's actual Etsy image inventory. An ID match is not a pixel comparison. */
const str=x=>String(x??'').trim();
const numeric=x=>/^[1-9]\d{0,14}$/.test(str(x))&&Number.isSafeInteger(Number(x));
const secure=x=>{try{const url=new URL(str(x));return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}};

export function evaluateFreshOwnerTrial525({productId,listingId,claim,product,gallery=[],remoteListing,
 remoteImages=[],receipts=[],metadataIssues=[]}={}){
 const issues=[...metadataIssues],id=Number(productId),listing=str(listingId),rows=[];
 if(!Number.isSafeInteger(id)||id<1||[48,53].includes(id))issues.push('Choose a fresh saved Product, not the two owner-managed trial Products #48/#53.');
 if(!numeric(listing)||claim?.confirmed!==true||str(claim?.listing_id)!==listing||!str(claim?.receipt_id))
  issues.push('One unique primary D1 Etsy listing claim is required for this exact Product.');
 if(str(product?.product_id)!==str(id))issues.push('Saved source Product identity does not match.');
 if(str(remoteListing?.listing_id)!==listing||str(remoteListing?.state).toLowerCase()!=='draft')
  issues.push('The actual remote Etsy ID or unpublished draft state differs.');
 if(!Array.isArray(gallery)||gallery.length<1||gallery.length>20)issues.push('A complete source gallery must contain 1–20 originals.');
 if(!Array.isArray(remoteImages)||remoteImages.length!==gallery.length)issues.push('Etsy image count differs from the full original gallery.');
 if(!Array.isArray(receipts))issues.push('Actual saved Etsy image-transfer receipts were not returned.');
 const sourcePhotos=Array.isArray(gallery)?gallery:[],etsyPhotos=Array.isArray(remoteImages)?remoteImages:[],savedReceipts=Array.isArray(receipts)?receipts:[];
 if(savedReceipts.some(row=>str(row?.listing_id)!==listing||!sourcePhotos.some(p=>Number(p.product_image_id)===Number(row?.product_image_id))))
  issues.push('A saved image receipt refers to another listing or an image outside the current Product gallery.');
 const local=new Set(),remote=new Set(),matchedRemote=new Set();
 for(const original of sourcePhotos){
  const sourceId=Number(original?.product_image_id),sourceUrl=str(original?.image_url);
  if(!Number.isSafeInteger(sourceId)||sourceId<1||local.has(sourceId))issues.push('Source gallery has a missing or duplicate original image ID.');
  local.add(sourceId);
  if(!secure(sourceUrl)||str(original?.public_use_status)!=='all_public_ok'||str(original?.alt_text).length<5||
   Number(original?.width_px)<800||Number(original?.height_px)<800||original?.approved_for_distribution!==true)
   issues.push(`Original #${sourceId}: current canonical public-use, alt text, size or HTTPS approval is missing.`);
  const claims=savedReceipts.filter(row=>Number(row?.product_image_id)===sourceId&&str(row?.listing_id)===listing&&
    row?.verified_remote_readback===true&&numeric(row?.etsy_image_id));
  const mapping=claims.length===1?claims[0]:null;
  if(!mapping)issues.push(`Original #${sourceId}: exactly one genuine accepted Etsy transfer receipt is required.`);
  const imageId=str(mapping?.etsy_image_id),found=etsyPhotos.filter(row=>str(row?.listing_image_id)===imageId);
  const remotePhoto=found.length===1?found[0]:null;
  const remoteUrl=str(remotePhoto?.url_fullxfull||remotePhoto?.url_570xN||remotePhoto?.url_75x75);
  if(!remotePhoto||!secure(remoteUrl)||matchedRemote.has(imageId))issues.push(`Original #${sourceId}: a unique current Etsy image ID and public photo URL were not confirmed.`);
  if(remotePhoto)matchedRemote.add(imageId);
  rows.push({product_image_id:sourceId,original_url:sourceUrl,etsy_image_id:remotePhoto?imageId:null,
   etsy_url:remotePhoto?remoteUrl:null,alt_text:str(original?.alt_text),width:Number(original?.width_px||0),
   height:Number(original?.height_px||0),mapped:Boolean(mapping&&remotePhoto)});
 }
 for(const row of etsyPhotos){
  const imageId=str(row?.listing_image_id);
  if(!numeric(imageId)||remote.has(imageId))issues.push('Etsy returned a missing or duplicate remote image ID.');
  remote.add(imageId);
  if(!matchedRemote.has(imageId))issues.push(`Etsy image #${imageId}: no one-to-one original receipt exists.`);
  if(row?.listing_id&&str(row.listing_id)!==listing)issues.push('Etsy image belongs to a different listing.');
 }
 return {ready_for_owner_visual_review:issues.length===0,owner_visual_acceptance_recorded:false,
  pixel_identity_independently_proven:false,product_id:id,listing_id:listing,primary_receipt_id:str(claim?.receipt_id)||null,
  photos:rows,original_count:sourcePhotos.length,remote_count:etsyPhotos.length,issues:[...new Set(issues)]};
}

export function ownerPhotoDecision525({trial,expectedFingerprint,actualFingerprint,confirmedPairs}={}){
 const issues=[];
 if(!trial?.ready_for_owner_visual_review)issues.push('The fresh live owner-trial readback is not ready.');
 if(!/^[a-f0-9]{64}$/.test(str(expectedFingerprint))||str(expectedFingerprint)!==str(actualFingerprint))
  issues.push('The original Product/Etsy evidence changed since review. Refresh before acceptance.');
 if(!Array.isArray(confirmedPairs)||confirmedPairs.length!==trial?.photos?.length)
  issues.push('The owner must visually compare and acknowledge every original/Etsy image pair.');
 else {
  const expected=new Set(trial.photos.map(p=>`${p.product_image_id}:${p.etsy_image_id}`)),actual=new Set(confirmedPairs.map(p=>`${p?.product_image_id}:${p?.etsy_image_id}`));
  if(actual.size!==expected.size||[...actual].some(p=>!expected.has(p)))issues.push('Photo approvals do not match the current one-to-one Etsy/source pairs.');
 }
 return {may_record_owner_statement:issues.length===0,independently_proven_pixel_identity:false,issues};
}
