/* Build 532: Facebook source-photo selection must agree with the saved, owner-
 * reviewed distribution record. A manual handoff is not a provider API action. */
import {marketplaceManualReadiness531} from './marketplace-owner-trial-531.mjs';

export function selectedMarketplacePhotos532(response,productId){
 const readiness=marketplaceManualReadiness531(response,productId);
 const issues=[...readiness.issues];
 const gallery=new Map((Array.isArray(response?.gallery)?response.gallery:[])
  .map(row=>[Number(row.product_image_id),row]));
 const photos=[];
 if(readiness.state==='MANUAL_DRAFT_READY')for(const imageId of readiness.selected_image_ids){
  const row=gallery.get(imageId);
  if(!row||!/^https:\/\//i.test(String(row.image_url||''))||
   String(row.alt_text||'').trim().length<5||Number(row.width_px)<800||Number(row.height_px)<800){
   issues.push(`Original photo #${imageId} lacks a verified HTTPS image, description or 800 × 800 dimensions.`);
  }else photos.push(row);
 }
 return {ready:readiness.state==='MANUAL_DRAFT_READY'&&issues.length===0,
  photos:issues.length?[]:photos,issues,source_image_ids:issues.length?[]:photos.map(row=>Number(row.product_image_id)),
  provider_api_authorized:false,provider_post_performed:false};
}
