// Build 443: narrow source/bytes validation for a product-owned, already-approved image.
// Neither the browser nor a marketplace request may supply an arbitrary download URL.
import {allowedImage} from './productDistribution406.mjs';

export const MAX_ETSY_IMAGE_BYTES = 8 * 1024 * 1024;
export const imageReady = allowedImage;

export function approvedR2Key(imageUrl, productId, env={}) {
  if (!Number.isSafeInteger(Number(productId)) || Number(productId) < 1) return null;
  let url;
  try { url = new URL(String(imageUrl || '')); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port) return null;
  const bases=[env.PRODUCT_MEDIA_PUBLIC_BASE_URL,env.R2_PUBLIC_BASE_URL,
    env.PUBLIC_R2_BASE_URL,env.ASSET_ORIGIN,'https://assets.devilndove.com']
    .filter(Boolean).map(value=>{try{return new URL(String(value));}catch{return null;}}).filter(Boolean);
  const root=bases.find(base=>base.origin===url.origin&&url.pathname.startsWith(base.pathname.replace(/\/$/,'')+'/'));
  if (!root) return null;
  let key;
  try { key=decodeURIComponent(url.pathname.slice(root.pathname.replace(/\/$/,'').length).replace(/^\//,'')); }
  catch { return null; }
  if (!key.startsWith(`products/${Number(productId)}/`) || /[\\\x00-\x1f]/.test(key) || key.split('/').includes('..')) return null;
  return key;
}

export function checkedEtsyBytes(contentType, bytes) {
  const buffer=bytes instanceof ArrayBuffer?new Uint8Array(bytes):bytes;
  if (!buffer || buffer.length < 100 || buffer.length > MAX_ETSY_IMAGE_BYTES) return null;
  if (/^image\/jpeg(?:;|$)/i.test(contentType||'') && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff)
    return {type:'image/jpeg',extension:'jpg'};
  if (/^image\/png(?:;|$)/i.test(contentType||'') &&
    [137,80,78,71,13,10,26,10].every((v,i)=>buffer[i]===v))
    return {type:'image/png',extension:'png'};
  return null;
}

export function completedImageIds(rows) {
  const ids=new Set();
  for (const row of rows||[]) {
    let details;try{details=JSON.parse(row.details_json||'{}');}catch{continue;}
    if (Number.isSafeInteger(Number(details.product_image_id)) && Number(details.product_image_id)>0 &&
      /^\d+$/.test(String(details.etsy_image_id||''))) ids.add(Number(details.product_image_id));
  }
  return ids;
}

// Build 497: a provider's 201 response is not yet acceptance. Require a
// subsequent read of the same draft's image inventory before writing receipt.
export function confirmedEtsyImageReadback497(remote,listingId,imageId) {
  if(!/^\d+$/.test(String(listingId||''))||!/^\d+$/.test(String(imageId||''))||!Array.isArray(remote?.results))return false;
  return remote.results.some(row=>String(row?.listing_image_id||'')===String(imageId)&&
    (!row.listing_id||String(row.listing_id)===String(listingId)));
}
