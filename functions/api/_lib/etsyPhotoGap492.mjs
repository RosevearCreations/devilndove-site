// Build 492: bounded, read-only existing-draft photo gap classification.
// A provider photo ID is not evidence that an uncertain local upload succeeded.
const valid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
export function assessExistingDraftPhotoGap492(remote, receipts, images, claims, productId){
  if(!Array.isArray(remote)||!Array.isArray(receipts)||!Array.isArray(images)||
    !remote.every(r=>valid(r?.listing_image_id)))return {state:'hold',reason:'provider_inventory_unverified',actions:[],provider_write_allowed:false};
  const known=new Set(receipts.map(r=>String(r.etsy_image_id||'')).filter(valid));
  const actual=new Set(remote.map(r=>String(r.listing_image_id)));
  const unexpected=[...actual].filter(id=>!known.has(id)).sort();
  const absent=[...known].filter(id=>!actual.has(id)).sort();
  const confirmed=new Set(receipts.map(r=>Number(r.product_image_id)).filter(valid));
  const uncertain=images.filter(i=>claims.has(`${productId}:${i.product_image_id}`)&&!confirmed.has(i.product_image_id))
    .map(i=>i.product_image_id);
  const pending=images.filter(i=>!confirmed.has(i.product_image_id)&&!uncertain.includes(i.product_image_id))
    .map(i=>({product_image_id:i.product_image_id,transferable:i.transferable,alt_text_ready:!!i.alt_text}));
  const hold=unexpected.length>0||absent.length>0||uncertain.length>0;
  return {state:hold?'hold':pending.length?'ready_for_separate_owner_approval':'matched',
    reason:unexpected.length?'untracked_remote_photos':absent.length?'confirmed_photos_absent_from_etsy':uncertain.length?'unconfirmed_upload_claim':'verified_inventory',
    unexpected_etsy_image_ids:unexpected.slice(0,10),missing_etsy_image_ids:absent.slice(0,10),
    uncertain_product_image_ids:uncertain.slice(0,10),pending_local_images:pending.slice(0,10),
    tracked_remote_count:known.size,verified_remote_count:actual.size,provider_write_allowed:false,
    next_step:hold?'Inspect the original Etsy draft and audit receipts. Do not retry or overwrite; resolve identity/evidence with the owner.':
      pending.length?'Use the existing one-photo approval control for each eligible original; this diagnostic never uploads.':
      'No verified photo gap remains. Review product/image scores separately.'};
}
