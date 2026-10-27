/* Build 500 — make the complete canonical gallery the transfer unit.
 * These pure checks are shared by the one-action Etsy Product Editor UI and tests.
 * Never interpret a partially approved gallery as authorization to send a subset. */
export function assessEtsyPackage500(distribution, media, tags) {
  const gallery=Array.isArray(distribution?.gallery)?distribution.gallery:[];
  const eligible=Array.isArray(media?.images)?media.images:[];
  const issues=[];
  if(!gallery.length)issues.push('Add Product photographs under Media first.');
  if(gallery.length>10)issues.push('Etsy allows up to ten listing photographs; review the Product gallery.');
  if(!gallery.every(x=>Number.isSafeInteger(Number(x.product_image_id))&&Number(x.product_image_id)>0))
    issues.push('Some gallery photographs do not have a saved Product image ID.');
  const ids=gallery.map(x=>Number(x.product_image_id));
  if(new Set(ids).size!==ids.length)issues.push('Duplicate Product gallery image IDs need review.');
  for(const row of gallery){
    const id=Number(row.product_image_id),photo=eligible.find(x=>Number(x.product_image_id)===id);
    if(row.approved_for_distribution!==true)
      issues.push(`Photo #${id}: ${(row.hold_reasons||['public-use approval is missing']).join('; ')}.`);
    if(!photo)issues.push(`Photo #${id}: original JPEG/PNG, minimum size or alt text is not ready.`);
    else if(!photo.transferable)issues.push(`Photo #${id}: an approved original R2 JPEG/PNG is unavailable.`);
    else if(photo.hold)issues.push(`Photo #${id}: an earlier Etsy transfer is unresolved.`);
  }
  if(eligible.some(x=>!ids.includes(Number(x.product_image_id))))issues.push('Canonical gallery and Etsy media identities differ.');
  if(Number(media?.hold_unconfirmed_claims||0)>0)issues.push('An earlier image transfer result is not confirmed.');
  if(tags?.unresolved_attempt)issues.push('An earlier Etsy native tag update is unresolved.');
  if(!tags?.ready)issues.push(...(tags?.blockers||['Save valid Product or Etsy search tags before sending.']));
  return {ready:issues.length===0,issues,image_ids:ids,
    pending:eligible.filter(x=>ids.includes(Number(x.product_image_id))&&!x.transferred).map(x=>Number(x.product_image_id)),
    transferred:eligible.filter(x=>ids.includes(Number(x.product_image_id))&&x.transferred).length,
    count:gallery.length};
}

export function verifiedEtsyPackage500(productId,link,photos,tags,expectedCount) {
  const id=String(link?.linked_listing_id||'');
  return /^[1-9]\d+$/.test(id)&&String(photos?.listing_id)===id&&String(tags?.listing_id)===id&&
    photos?.remote_reconciliation?.ready===true&&photos?.photo_gap_492?.state==='matched'&&
    Number(photos.transferred)===expectedCount&&Number(photos.pending)===0&&
    tags?.matching_tags===true&&tags?.verified_draft===true&&tags?.verified_canada_only===true&&
    !tags?.unresolved_attempt&&Number(link?.product_id)===Number(productId);
}
