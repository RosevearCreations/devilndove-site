/* Build 531: local manual Marketplace readiness from the original Product
 * gallery. A local/export-ready record is NEVER Meta API posting permission. */
const MESSAGE={channel_switch_off:'Check Facebook Marketplace on the Product and save that destination preference.',
 cad_positive_price_required:'Save a positive CAD Product price.',inventory_unavailable:'Confirm available Product inventory.',
 product_not_reviewable:'Keep the saved Product in draft or active status.',
 invalid_canonical_image_selection:'Select 1–10 approved original photos in the Product distribution controls.',
 image_not_owned_by_product:'A selected photo no longer belongs to this Product.',
 image_not_cleared_or_under_800px:'Approve the original Product photos for public use, alt text and dimensions in Media.',
 owner_us_shipping_review_required:'Complete local destination review with U.S. shipping disabled.',
 source_or_media_changed_reapprove:'The Product/photos changed; review the original image selection again.',
 canonical_product_not_found:'Load a real saved Product first.',unsupported_destination:'Choose the Facebook destination.'};
export function marketplaceManualReadiness531(response,productId){
 const reasons=[],id=Number(productId),evidence=response?.current_evidence||{};
 if(response?.ok!==true||Number(response?.product_id)!==id||response?.channel!=='facebook')
  reasons.push('The read-only Facebook destination record does not match this saved Product.');
 const gallery=Array.isArray(response?.gallery)?response.gallery:[];
 const selected=Array.isArray(response?.selected_image_ids)?response.selected_image_ids.map(Number):[];
 if(!gallery.length)reasons.push('No original Product gallery photos were returned.');
 if(!selected.length||selected.length>10||new Set(selected).size!==selected.length)
  reasons.push('Select between one and ten distinct original Product photos.');
 const map=new Map(gallery.map(row=>[Number(row.product_image_id),row]));
 for(const imageId of selected){const row=map.get(imageId);
  if(!row||row.approved_for_distribution!==true||row.hold_reasons?.length)
   reasons.push(`Original photo #${imageId} needs public-use, alt text and quality approval.`);}
 if(evidence.ready_for_local_export!==true)for(const code of evidence.blockers||[])
  reasons.push(MESSAGE[code]||`Local destination check: ${String(code).slice(0,100)}.`);
 const ready=reasons.length===0;
 return {state:ready?'MANUAL_DRAFT_READY':'HOLD',issues:[...new Set(reasons)],
  selected_image_ids:selected,approved_gallery_count:gallery.filter(row=>row.approved_for_distribution===true&&!(row.hold_reasons||[]).length).length,
  provider_api_authorized:false,provider_called:false,publication_allowed:false,
  next:'Manual copy to Facebook Marketplace only. No direct Marketplace API permission was proved.'};
}
export function ownerTrialDisposition531({productId,closure,save,marketplace,failedReason}={}){
 const accepted=closure?.state==='OWNER_RECEIPT_CURRENT';
 const issues=[];
 if(failedReason)issues.push(`Etsy readback unavailable: ${String(failedReason).slice(0,200)}`);
 if(!accepted)issues.push(closure?.state==='READY_FOR_EXPLICIT_OWNER_ACCEPTANCE'?
  'Awaiting explicit Product-specific owner acceptance.':'Etsy draft/photo/tag review remains on HOLD.');
 if(!accepted)for(const detail of (closure?.issues||[]).slice(0,3))
  issues.push(`Etsy discrepancy: ${String(detail).replace(/[\r\n\t]+/g,' ').slice(0,180)}`);
 if(save?.state==='REVIEW_SAVED_FIELDS')issues.push('Review the prior failed Save field differences before closure.');
 if(marketplace?.state!=='MANUAL_DRAFT_READY')issues.push('Marketplace local/manual draft readiness is not complete.');
 if(marketplace?.state!=='MANUAL_DRAFT_READY')for(const detail of (marketplace?.issues||[]).slice(0,3))
  issues.push(`Marketplace: ${String(detail).replace(/[\r\n\t]+/g,' ').slice(0,180)}`);
 return {product_id:Number(productId),etsy_owner_state:accepted?'ACCEPTED_CURRENT':'NOT_ACCEPTED',
  save_state:save?.state||'NO_VALID_BROWSER_RECEIPT',marketplace_state:marketplace?.state||'HOLD',
  state:issues.length?'FOLLOW_UP_REQUIRED':'CURRENT_OWNER_TRIAL_ACCEPTED',issues,
  no_etsy_write:true,no_facebook_post:true};
}
