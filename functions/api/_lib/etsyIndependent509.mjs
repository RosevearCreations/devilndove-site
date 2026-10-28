/* Build 509 — independently check exact media origins and Etsy photo identity.
 * Never infer matching pixels from an ID alone. An owner must inspect both images.
 */
const str=x=>String(x??'').trim();
const number=x=>Number(x)||0;
export const ORIGINAL_IDS_509=Object.freeze([344,345,346]);
export function sourcePhotoSnapshot509({gallery=[],remoteImages=[],accepted=[],listingId='',expected=ORIGINAL_IDS_509}){
 const rows=[],issues=[];
 const originals=new Map(gallery.map(row=>[number(row.product_image_id),row]));
 const remote=new Map(remoteImages.map(row=>[str(row.listing_image_id),row]));
 const usedRemote=new Set();
 for(const sourceId of expected){
  const original=originals.get(sourceId);
  const matches=accepted.filter(row=>row.verified_remote_readback===true&&number(row.product_image_id)===sourceId&&
   str(row.listing_id)===str(listingId)&&remote.has(str(row.etsy_image_id)));
  const receipt=matches.length===1?matches[0]:null;
  const etsy=receipt?remote.get(str(receipt.etsy_image_id)):null;
  const sourceUrl=str(original?.image_url),remoteUrl=str(etsy?.url_fullxfull||etsy?.url_570xN||etsy?.url_75x75);
  const etsyId=str(etsy?.listing_image_id);
  const unique=Boolean(etsyId&&!usedRemote.has(etsyId));if(etsyId)usedRemote.add(etsyId);
  const ready=Boolean(original&&sourceUrl&&etsy&&remoteUrl&&receipt&&unique);
  if(!ready)issues.push(`Original #${sourceId}: missing or conflicting approved source image, current Etsy image URL, or unique verified receipt.`);
  rows.push({product_image_id:sourceId,etsy_image_id:etsyId||null,original_image_url:sourceUrl||null,
   etsy_image_url:remoteUrl||null,receipt_confirmed:Boolean(receipt),live_image_readback:Boolean(etsy&&remoteUrl),ready});
 }
 if(gallery.length!==expected.length)issues.push(`The approved gallery has ${gallery.length} image(s), expected exactly ${expected.length}.`);
 if(remoteImages.length!==expected.length)issues.push(`Etsy returned ${remoteImages.length} image(s), expected exactly ${expected.length}.`);
 return {rows,issues,ready:issues.length===0&&rows.every(x=>x.ready),requires_owner_visual_comparison:true};
}
export function independentReceipt509({prior,review,actorId}){
 if(!prior||!review?.ready||!review?.photo_freshness_509?.ready)return {ready:false,reason:'Missing verified Etsy/photo readback or fresh original-photo evidence.'};
 const detail=typeof prior.details_json==='string'?JSON.parse(prior.details_json):prior.details_json||{};
 const same=detail.product_id===53&&str(detail.listing_id)===str(review.listing_id)&&
  /^[a-f0-9]{64}$/.test(str(detail.evidence_fingerprint))&&detail.evidence_fingerprint===review.evidence_fingerprint_508&&
  Array.isArray(detail.confirmed_photo_ids)&&ORIGINAL_IDS_509.every(x=>detail.confirmed_photo_ids.includes(x))&&
  detail.publication_performed===false&&detail.provider_modified===false;
 const separate=number(prior.actor_user_id)>0&&number(actorId)>0&&number(prior.actor_user_id)!==number(actorId);
 return {ready:Boolean(same&&separate),same_evidence:Boolean(same),separate_reviewer:Boolean(separate),
  reason:!same?'An owner closeout for the exact current Etsy/media fingerprint is required.':
   !separate?'An independent verified Admin other than the recorded owner must review this receipt.':''};
}
