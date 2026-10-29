/* Build 521: present exact original ↔ existing Etsy image receipts for HUMAN
 * visual inspection. Matching IDs/URLs alone never prove identical pixels. */
export const THREE_ORIGINALS_521=Object.freeze([344,345,346]);
const id=value=>typeof value==='string'||typeof value==='number'?String(value).trim():'';
const valid=value=>/^[1-9]\d{0,15}$/.test(id(value))&&Number.isSafeInteger(Number(value));
export const witnessImageUrl521=value=>{
  const url=String(value||'').trim();
  if(/^\/(?!\/)[a-z0-9%/_?=&.\-#]+$/i.test(url))return url;
  if(/^https:\/\/[^\s<>'"]+$/i.test(url))return url;
  return '';
};

export function assessVisualPhotoPairs521(receipt){
  const issues=[],originals=Array.isArray(receipt?.originals)?receipt.originals:[],
    remote=Array.isArray(receipt?.etsy_photos)?receipt.etsy_photos:[],
    matches=Array.isArray(receipt?.matched)?receipt.matched:[];
  if(Number(receipt?.product_id)!==53||id(receipt?.listing_id)!=='4603838854')
    issues.push('Exact Product #53 and existing draft #4603838854 are required.');
  if(originals.length!==3||new Set(originals.map(x=>Number(x.product_image_id))).size!==3||
    !THREE_ORIGINALS_521.every(n=>originals.some(x=>Number(x.product_image_id)===n)))
    issues.push('Current original gallery must contain exactly #344, #345 and #346.');
  if(remote.length!==3||remote.some(x=>!valid(x.etsy_image_id))||
    new Set(remote.map(x=>id(x.etsy_image_id))).size!==3)
    issues.push('Exactly three distinct current Etsy image IDs are required; no image is assumed missing.');
  if(matches.length!==3||new Set(matches.map(x=>Number(x.product_image_id))).size!==3||
    new Set(matches.map(x=>id(x.etsy_image_id))).size!==3)
    issues.push('One or more distinct owner-witnessed local photo receipts are missing.');
  const pairs=THREE_ORIGINALS_521.map(original=>{
    const local=originals.find(x=>Number(x.product_image_id)===original);
    const match=matches.find(x=>Number(x.product_image_id)===original);
    const image=remote.find(x=>id(x.etsy_image_id)===id(match?.etsy_image_id));
    const localUrl=witnessImageUrl521(local?.image_url),remoteUrl=witnessImageUrl521(image?.image_url);
    const receiptPresent=!!local&&!!match&&!!image&&valid(match.etsy_image_id);
    if(!receiptPresent)issues.push('Original #'+original+' lacks a current Etsy photo receipt.');
    else if(!localUrl||!remoteUrl)issues.push('Original #'+original+' needs both current preview URLs for human comparison.');
    return {original,etsyImageId:receiptPresent?id(match.etsy_image_id):null,
      localUrl,remoteUrl,receiptPresent,previewsReady:!!localUrl&&!!remoteUrl};
  });
  if(Number(receipt?.unresolved_upload_attempts||0)>0)
    issues.push('A prior photo upload claim is unresolved. No new upload is authorized.');
  return {pairs,readyForHumanVisualReview:issues.length===0,
    humanVisualWitnessRecorded:false,ownerAccepted:false,issues,
    next:issues.length?'Resolve current local/photo readback gaps; never resend uncertain Etsy images.':
      'Open each pair and visually compare the two actual photographs. An owner must explicitly confirm the match before final unpublished-draft approval.'};
}
