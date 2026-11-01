// Build 560 — local Meta handoff evidence, never a Meta Graph publishing grant.
// Only the canonical, explicitly cross-channel-approved originals may leave this projection.
import {allowedImage} from './productDistribution406.mjs';

const clean=value=>String(value??'').trim();
const safeScopes=value=>{
  try{const values=JSON.parse(value||'[]');return Array.isArray(values)?values.filter(v=>typeof v==='string'):[];}
  catch{return [];}
};
const PAGE_SCOPES=['pages_show_list','pages_manage_posts','pages_read_engagement'];
const META_DESTINATIONS=Object.freeze([
  {key:'facebook_marketplace',name:'Facebook Marketplace',url:'https://www.facebook.com/marketplace/create/item',
    steps:['Open Marketplace Create Item in the intended account.','Add the approved original Product photos and copied description.','Check price, category, location and availability; publish only in Marketplace.']},
  {key:'facebook',name:'Facebook Pages',url:'https://business.facebook.com/',
    steps:['Open the intended Facebook Page in Meta Business Suite.','Add the approved Product originals and copied text to a Page post.','Preview and publish or schedule on the Page itself.']},
  {key:'instagram',name:'Instagram',url:'https://business.facebook.com/',
    steps:['Open the intended professional Instagram account in Meta Business Suite.','Upload the approved Product originals, paste the caption and check the crop.','Preview and publish or schedule from that account.']}
]);

export function projectMetaReadiness560({product,oauth,platforms,images,annotationUnavailable=false,now=Date.now()}={}){
  const saved=Number.isSafeInteger(Number(product?.product_id))&&Number(product?.product_id)>0;
  const candidates=Array.isArray(images)?images:[];
  const photos=candidates.filter(allowedImage).map(image=>({product_image_id:Number(image.product_image_id),
    image_url:image.image_url,alt_text:clean(image.alt_text),width_px:Number(image.width_px),height_px:Number(image.height_px)}));
  const meta=(Array.isArray(oauth)?oauth:[]).find(row=>row.provider_key==='meta');
  const expiry=meta?.access_expires_at?Date.parse(String(meta.access_expires_at)):NaN;
  const connected=meta?.connection_status==='connected'&&(!Number.isFinite(expiry)||expiry>now);
  const granted=new Set(safeScopes(meta?.scopes_json));
  const configRows=Array.isArray(platforms)?platforms:[];
  const reasons=[];
  if(!saved)reasons.push('Save the Product before preparing an external handoff.');
  if(!photos.length)reasons.push('No original Product photo currently has verified cross-channel public-use approval, alt text and sufficient dimensions.');
  if(annotationUnavailable)reasons.push('Photo annotation records are unavailable; no image approval was assumed.');
  const destinations=META_DESTINATIONS.map(destination=>{
    const platform=configRows.find(row=>row.platform_key===(destination.key==='facebook_marketplace'?'facebook':destination.key));
    const pageMissing=PAGE_SCOPES.filter(scope=>!granted.has(scope));
    const blockers=[...reasons];
    if(destination.key==='facebook_marketplace'){
      blockers.push('Marketplace listing API posting is not independently supported or approved here. A Facebook login never grants Marketplace auto-posting.');
    }else{
      if(!meta)blockers.push('No saved Meta OAuth connection.');
      else if(meta.connection_status!=='connected')blockers.push(`Saved Meta OAuth status is ${clean(meta.connection_status)||'unavailable'}.`);
      else if(Number.isFinite(expiry)&&expiry<=now)blockers.push('Saved Meta OAuth access has expired.');
      if(destination.key==='facebook'){
        if(pageMissing.length)blockers.push(`Saved Meta consent lacks Page permissions: ${pageMissing.join(', ')}.`);
        blockers.push('Page identity, app permission review and a real provider posting readback have not been verified for this Product.');
      }else{
        blockers.push('Professional Instagram identity, Instagram publishing scopes, app review and provider posting readback have not been verified for this Product.');
      }
    }
    return {...destination,mode:'manual_handoff',handoff_ready:saved&&photos.length>0,
      connection_state:destination.key==='facebook_marketplace'?'manual_only':!meta?'not_connected':connected?'local_oauth_only':'needs_attention',
      local_platform_api_ready_claim:platform?.api_ready===1||platform?.api_ready===true,
      account_verified_for_publishing:false,api_publishing_allowed:false,external_publication_confirmed:false,
      remote_post_id:null,blockers};
  });
  return {product_id:saved?Number(product.product_id):null,product_name:saved?clean(product.name):'',
    product_status:saved?clean(product.status):'',approved_photo_count:photos.length,reviewed_photo_count:candidates.length,
    photos,meta_connection:!meta?'not_connected':connected?'local_oauth_only':'needs_attention',
    destinations,provider_contacted:false,publication_performed:false,automatic_provider_action:false};
}
