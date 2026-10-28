/* Build 508: deterministic digest of separately read Product/Etsy/media facts.
 * A digest is a change detector, not a credential, approval or provider receipt.
 */
const str=value=>String(value??'').trim();
const sorted=rows=>rows.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
export function evidencePacket508({product,listing,gallery=[],remoteImages=[],accepted=[],tags=[]}){
 return {product_id:Number(product?.product_id||0),listing_id:str(listing?.listing_id),shop_id:str(listing?.shop_id),
  product:{sku:str(product?.sku),slug:str(product?.slug),name:str(product?.name),description:str(product?.description||product?.short_description),
   price_cents:Number(product?.price_cents),currency:str(product?.currency),quantity:Number(product?.inventory_quantity)},
  etsy:{title:str(listing?.title),description:str(listing?.description),state:str(listing?.state),taxonomy_id:Number(listing?.taxonomy_id),
   shipping_profile_id:Number(listing?.shipping_profile_id),price_amount:Number(listing?.price?.amount),
   price_divisor:Number(listing?.price?.divisor),price_currency:str(listing?.price?.currency_code),quantity:Number(listing?.quantity),
   tags:[...(listing?.tags||[])].map(str).sort()},
  approved_originals:[...gallery].map(row=>Number(row.product_image_id)).sort((a,b)=>a-b),
  remote_etsy_image_ids:[...remoteImages].map(row=>str(row.listing_image_id)).sort(),
  matching_receipts:sorted(accepted.filter(row=>row.verified_remote_readback===true).map(row=>({
   original:Number(row.product_image_id),etsy_image_id:str(row.etsy_image_id),listing_id:str(row.listing_id)}))),
  saved_etsy_tags:[...tags].map(str).sort()};
}
export async function fingerprint508(packet){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(packet)));
 return Array.from(new Uint8Array(bytes)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function priorOwnerApproval508(prior,review){
 if(!prior||!review?.ready||!review?.listing_id)return false;
 const detail=typeof prior==='string'?JSON.parse(prior):prior;
 const expected=[...(review.confirmed_photo_ids||[])].map(Number).sort((a,b)=>a-b);
 const approved=[...(detail.confirmed_photo_ids||[])].map(Number).sort((a,b)=>a-b);
 return String(detail.listing_id||'')===String(review.listing_id)&&expected.length>0&&
  expected.length===approved.length&&expected.every((id,index)=>id===approved[index])&&detail.publication_performed===false&&
  /^[a-f0-9]{64}$/.test(String(review.evidence_fingerprint_508||''))&&
  detail.evidence_fingerprint_508===review.evidence_fingerprint_508;
}
