/* Build 519: a read-only view of existing Product-to-Etsy photo mapping.
 * Locally stored matches are NOT by themselves a live owner approval. */
export const ORIGINALS_519=Object.freeze([344,345,346]);
const id=value=>typeof value==='string'||typeof value==='number'?String(value).trim():'';
const valid=value=>/^[1-9]\d{0,15}$/.test(id(value))&&Number.isSafeInteger(Number(value));

export function assessExistingPhotoMatches519({productId,listingId,receipt}={}){
  const issues=[],structural=[];
  if(Number(productId)!==53||id(listingId)!=='4603838854'||
     Number(receipt?.product_id)!==53||id(receipt?.listing_id)!=='4603838854')
    structural.push('Product and existing Etsy draft identity must match exactly.');
  const originals=Array.isArray(receipt?.originals)?receipt.originals:[];
  const remote=Array.isArray(receipt?.etsy_photos)?receipt.etsy_photos:[];
  const matched=Array.isArray(receipt?.matched)?receipt.matched:[];
  const originalIds=originals.map(x=>Number(x.product_image_id));
  const remoteIds=remote.map(x=>id(x.etsy_image_id));
  const pairLocal=matched.map(x=>Number(x.product_image_id));
  const pairRemote=matched.map(x=>id(x.etsy_image_id));
  if(originalIds.length!==3||new Set(originalIds).size!==3||
     !ORIGINALS_519.every(n=>originalIds.includes(n)))
    structural.push('The saved gallery must contain exactly the three originals #344–346.');
  if(remoteIds.some(x=>!valid(x))||new Set(remoteIds).size!==remoteIds.length)
    structural.push('Etsy returned a missing or duplicate remote photo ID.');
  if(pairLocal.length!==new Set(pairLocal).size||pairRemote.length!==new Set(pairRemote).size||
     matched.some(x=>!originalIds.includes(Number(x.product_image_id))||!remoteIds.includes(id(x.etsy_image_id))))
    structural.push('A local photo receipt is duplicate or cannot be found in the current live inventory.');
  const pending=ORIGINALS_519.filter(n=>!matched.some(x=>Number(x.product_image_id)===n&&valid(x.etsy_image_id)));
  const unmappedRemote=remoteIds.filter(x=>!pairRemote.includes(x));
  const outstanding=Number(receipt?.unresolved_upload_attempts);
  if(!Number.isSafeInteger(outstanding)||outstanding<0||outstanding>0)
    issues.push('One or more previous upload attempts are unresolved. Never upload them again blindly.');
  if(unmappedRemote.length)issues.push('Etsy has additional photographs without a confirmed original match.');
  if(pending.length)issues.push('At least one of the three original photographs has no confirmed existing-Etsy mapping.');
  issues.unshift(...structural);
  return {readyForFinalRead:issues.length===0,safeToMatch:structural.length===0,acceptedByOwner:false,
    matchedCount:ORIGINALS_519.length-pending.length,pending,
    statuses:ORIGINALS_519.map(n=>({original:n,matched:!pending.includes(n)})),issues,
    next:issues.length?'Compare each unmatched original with the actual Etsy photo and record one explicit local match only if visually identical.':
      'All three local mappings are present. Run the separate final live Etsy draft check and inspect the listing before owner approval.'};
}
