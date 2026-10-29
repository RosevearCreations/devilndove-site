/* Build 523: conservative shared Product/gallery prerequisites.
 * These browser checks do NOT replace Etsy provider validation or grant Meta
 * Marketplace publishing permission. A failed/unknown read always blocks POST. */
export const LEGACY_OWNER_TRIAL_IDS_523=Object.freeze([48,53]);

export function assessCanonicalGallery523(galleries){
  const entries=Array.isArray(galleries)?galleries:[];
  const issues=[],byId=new Map();
  if(!entries.length)issues.push('The saved Product has no original gallery photos.');
  for(const image of entries){
    const id=Number(image?.product_image_id||0),url=String(image?.image_url||'');
    if(!Number.isSafeInteger(id)||id<=0){issues.push('A gallery photo is missing its saved original image ID.');continue;}
    if(byId.has(id)){issues.push(`Original photo #${id} appears more than once.`);continue;}
    byId.set(id,image);
    const faults=[];
    if(!/^https:\/\//i.test(url)||/\/placeholders?\/|placeholder\.(?:svg|png|webp)|\/fallbacks?\//i.test(url))faults.push('real secure original URL');
    if(String(image.public_use_status||'')!=='all_public_ok')faults.push('explicit Store + Etsy + Marketplace permission');
    if(String(image.alt_text||'').trim().length<5)faults.push('descriptive alt text');
    if(Number(image.width_px||0)<800||Number(image.height_px||0)<800)faults.push('verified size at least 800 × 800 px');
    if(image.approved_for_distribution!==true)faults.push('server approval');
    if(faults.length)issues.push(`Photo #${id}: needs ${[...new Set(faults)].join(', ')}.`);
  }
  if(byId.size>10)issues.push('More than ten original photos; Etsy permits at most ten listing images in this workflow.');
  return {ready:issues.length===0,count:byId.size,ids:[...byId.keys()],issues};
}

export function assessProductDraft523({productId,product,images,channel,authorityReady,dirty,channelSelected}){
  const issues=[];
  if(!Number.isSafeInteger(Number(productId))||Number(productId)<1)issues.push('Save this Product first, then attach its original images.');
  if(!authorityReady||dirty)issues.push('Save changes and wait for the authoritative Product readback.');
  if(!channelSelected)issues.push(`Check ${channel==='etsy'?'Etsy':'Facebook Marketplace'} and save the destination preference.`);
  if(!String(product?.name||'').trim())issues.push('Enter a Product name.');
  if(!String(product?.description||'').trim())issues.push('Enter a complete item description.');
  if(!Number.isFinite(Number(product?.price))||Number(product.price)<=0)issues.push('Enter a positive CAD price.');
  if(!Number.isInteger(Number(product?.quantity))||Number(product.quantity)<1)issues.push('Enter an available inventory quantity.');
  if(!Number.isFinite(Number(product?.weight_grams))||Number(product.weight_grams)<=0)issues.push('Enter the actual weight in grams.');
  const gallery=assessCanonicalGallery523(images);
  return {ready:issues.length===0&&gallery.ready,issues:[...issues,...gallery.issues],gallery};
}
