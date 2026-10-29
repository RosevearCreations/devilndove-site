/* Build 524 — read-only confirmation against the saved Product's primary Etsy
 * claim. A successful provider POST or a numeric ID alone is not a receipt. */
import {assessProductDraft523} from './product-destination-gates-523.mjs';

const listing=value=>typeof value==='string'||typeof value==='number'?
  (/^[1-9]\d{0,14}$/.test(String(value).trim())&&Number.isSafeInteger(Number(value))?String(value).trim():''):'';

export function verifySavedEtsyReceipt524({productId,expectedListingId='',readback}={}){
  const id=Number(productId),remote=listing(expectedListingId),received=listing(readback?.linked_listing_id);
  const issues=[];
  if(!Number.isSafeInteger(id)||id<1||Number(readback?.product_id)!==id)issues.push('Saved Product ID did not match the receipt readback.');
  if(readback?.linked_listing_id&&!received)issues.push('The returned Etsy listing ID is not a valid numeric listing number.');
  if(remote&&received!==remote)issues.push('Etsy returned a different listing ID from the Product primary claim.');
  if(received&&readback?.saved_link_readback_confirmed!==true)issues.push('Primary D1 claim is not independently confirmed; do not create a duplicate.');
  if(received&&!String(readback?.receipt_id||'').trim())issues.push('The verified primary receipt ID is missing.');
  if(remote&&!received)issues.push('Expected Etsy draft ID was not found on the saved Product.');
  return {verified:issues.length===0&&Boolean(received),unlinked:issues.length===0&&!received,
    listing_id:received||null,receipt_id:readback?.receipt_id||null,
    sku:String(readback?.product_sku||''),slug:String(readback?.product_slug||''),issues};
}

export function prepareMarketplaceHandoff524({productId,product,images,authorityReady,dirty,channelSelected}={}){
  const gate=assessProductDraft523({productId,product,images,authorityReady,dirty,channelSelected,channel:'facebook'});
  const photos=gate.ready?images.map(im=>({id:Number(im.product_image_id),url:String(im.image_url),
    alt:String(im.alt_text),width:Number(im.width_px),height:Number(im.height_px)})):[];
  return {ready:gate.ready,issues:gate.issues,product_id:Number(productId),
    title:String(product?.name||''),price_cad:String(product?.price||''),description:String(product?.description||''),photos};
}
