/* Build 504: testable, read-only comparison for exact existing-draft owner approval. */
const same=(a,b)=>String(a??'').trim().toLocaleLowerCase()===String(b??'').trim().toLocaleLowerCase();
export function priceCents504(price){
  if(!price||typeof price!=='object'||!Number.isFinite(Number(price.amount))||!Number.isFinite(Number(price.divisor))||Number(price.divisor)<=0)return null;
  return Math.round(Number(price.amount)*100/Number(price.divisor));
}
export function assessOwnerApproval504({product,listing,gallery=[],accepted=[],remoteImages=[],tagsReady=false,expected=[344,345,346]}){
  const issues=[];
  const id=String(listing?.listing_id||'');
  const allowed=String(listing?.state||'').toLowerCase()==='draft';
  if(!allowed)issues.push('Etsy listing is not confirmed as an unpublished draft.');
  if(!same(listing?.title,product?.name))issues.push('Etsy title differs from the saved Product title.');
  const description=String(product?.description||product?.short_description||'').trim();
  if(description.length<Math.max(16,String(product?.name||'').length+8)||same(description,product?.name))issues.push('Product description still needs real item details, not only its title.');
  else if(!same(listing?.description,description))issues.push('Etsy description differs from the saved Product description.');
  const localPrice=Number(product?.price_cents),remotePrice=priceCents504(listing?.price);
  if(!Number.isSafeInteger(localPrice)||remotePrice===null||remotePrice!==localPrice||
     !same(listing?.price?.currency_code,product?.currency)||!same(product?.currency,'CAD'))issues.push('Etsy CAD price differs from the saved Product price, or price could not be verified.');
  if(Number(listing?.quantity)!==Number(product?.inventory_quantity))issues.push('Etsy quantity differs from the saved Product quantity.');
  if(!Number.isSafeInteger(Number(listing?.taxonomy_id))||Number(listing?.taxonomy_id)<1)issues.push('Etsy category could not be verified.');
  if(!tagsReady)issues.push('Native Etsy search tags do not match the saved Product tags.');
  const eligible=new Set(gallery.map(x=>Number(x.product_image_id)));
  const remote=new Set(remoteImages.map(x=>String(x.listing_image_id||'')));
  const receipts=accepted.filter(x=>String(x.listing_id||'')===id&&x.verified_remote_readback===true);
  const confirmed=new Set(receipts.filter(x=>remote.has(String(x.etsy_image_id||''))).map(x=>Number(x.product_image_id)));
  for(const imageId of expected){
    if(!eligible.has(imageId))issues.push(`Approved Product photo #${imageId} is missing from our gallery.`);
    else if(!confirmed.has(imageId))issues.push(`Product photo #${imageId} needs an Etsy live-image receipt: verify an existing photo with owner review, or upload the original once if Etsy does not have it.`);
  }
  if(gallery.some(x=>!confirmed.has(Number(x.product_image_id))))issues.push('One or more additional approved Product photographs have no confirmed Etsy receipt.');
  if(remote.size!==new Set(receipts.map(x=>String(x.etsy_image_id||''))).size||
     [...remote].some(imageId=>!receipts.some(x=>String(x.etsy_image_id||'')===imageId)))issues.push('Etsy contains photos with no matching saved Product receipt, or a receipt is missing remotely.');
  return {ready:issues.length===0,issues,expected_photo_ids:expected,confirmed_photo_ids:expected.filter(x=>confirmed.has(x)),etsy_remote_photo_count:remote.size,approved_gallery_count:gallery.length};
}
