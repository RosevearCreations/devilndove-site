/* Build 517 — one fail-closed, read-only verdict for the existing Product #53
 * Etsy draft. A local thumbnail or historical acceptance is never live proof. */
export const PRODUCT_53_ETSY_DRAFT_517='4603838854';
export const PRODUCT_53_ORIGINALS_517=Object.freeze([344,345,346]);

const exactId=value=>typeof value==='string'||typeof value==='number'?String(value).trim():'';
const validId=value=>/^[1-9]\d{0,15}$/.test(exactId(value))&&Number.isSafeInteger(Number(value));
const exactOriginals=ids=>Array.isArray(ids)&&PRODUCT_53_ORIGINALS_517.every(id=>ids.some(item=>Number(item)===id));

export function assessEtsyOwnerVerification517({productId,listingId,inventory,owner,trial}={}){
  const problems=[],photoProblems=[],contentProblems=[];
  const target=PRODUCT_53_ETSY_DRAFT_517;
  const wrongTarget=Number(productId)!==53||exactId(listingId)!==target;
  if(wrongTarget)problems.push('Only Product #53 and its existing Etsy draft #4603838854 can be accepted here.');

  const images=Array.isArray(inventory?.images)?inventory.images:[];
  const localIds=images.map(image=>Number(image.product_image_id));
  const pairs=Array.isArray(owner?.verified_media_pairs_508)?owner.verified_media_pairs_508:[];
  const confirmed=Array.isArray(owner?.confirmed_photo_ids)?owner.confirmed_photo_ids:[];
  const pairIds=pairs.map(pair=>Number(pair.product_image_id));
  const remoteIds=pairs.map(pair=>exactId(pair.etsy_image_id));
  if(!exactOriginals(localIds)||new Set(localIds).size!==localIds.length)
    photoProblems.push('The saved gallery must contain the three distinct originals #344, #345 and #346.');
  if(images.some(image=>image.transferable!==true))
    photoProblems.push('At least one gallery original is not eligible for a verified Etsy transfer.');
  if(!exactOriginals(confirmed)||!exactOriginals(pairIds)||new Set(pairIds).size!==pairs.length||
      remoteIds.some(id=>!validId(id))||new Set(remoteIds).size!==remoteIds.length)
    photoProblems.push('A unique, current Etsy image receipt is missing for at least one original.');
  if(owner?.photo_freshness_509?.ready!==true)
    photoProblems.push('Source and Etsy image URLs have not passed the independent freshness comparison.');
  if(exactId(inventory?.listing_id)!==target||inventory?.provider_contacted!==true||
      inventory?.remote_reconciliation?.ready!==true||inventory?.photo_gap_492?.state!=='matched')
    photoProblems.push('Etsy live photo inventory is not fully reconciled to this exact draft.');
  if(Number(inventory?.hold_unconfirmed_claims||0)!==0||Number(inventory?.pending)!==0||
      Number(inventory?.transferred)!==images.length||
      Number(inventory?.remote_reconciliation?.remote_count)!==images.length||
      Number(inventory?.remote_reconciliation?.tracked_count)!==images.length)
    photoProblems.push('An original photo, local receipt or earlier upload attempt remains unconfirmed.');
  if(exactId(trial?.listing_id)!==target||trial?.remote_readback_confirmed!==true||
      !exactOriginals(trial?.original_image_ids)||Number(trial?.photo_receipts_confirmed)<3)
    photoProblems.push('The separate owner trial did not confirm all three originals on the live draft.');

  if(exactId(owner?.listing_id)!==target||owner?.verified_unpublished!==true||
      owner?.verified_canada_only!==true||owner?.ready!==true)
    contentProblems.push('Actual Etsy draft, Canada-only shipping, item details and native tags are not all verified.');
  if(trial?.local_link_confirmed!==true||trial?.ready_for_owner_signoff!==true||
      exactId(trial?.listing_id)!==target||!exactId(trial?.local_receipt_id))
    contentProblems.push('The saved Product link, description, category or search tags still need owner review.');
  if(trial?.remote_readback_confirmed!==true)
    contentProblems.push('The current Etsy listing details were not independently read.');
  if((trial?.issues||[]).length||(owner?.issues||[]).length)
    contentProblems.push('Provider readback reported an item-content or receipt discrepancy.');
  if(wrongTarget){photoProblems.push('Etsy photo target changed.');contentProblems.push('Etsy Product identity changed.');}
  problems.push(...photoProblems,...contentProblems);
  return {
    ready:problems.length===0,
    photosReady:photoProblems.length===0,
    contentReady:contentProblems.length===0,
    verifiedOriginals:PRODUCT_53_ORIGINALS_517.filter(id=>confirmed.some(value=>Number(value)===id)&&
      pairs.some(pair=>Number(pair.product_image_id)===id&&validId(pair.etsy_image_id))).length,
    listingId:target,
    problems,
    next:photoProblems.length?'Use the existing photo comparison or missing-original sync, then check Etsy again.':
      contentProblems.length?'Correct the actual item description, category or tags; save Product, update this same draft explicitly, then check again.':
        'Inspect the actual Etsy draft yourself, then explicitly record owner approval. No listing has been published.'
  };
}
