// Build 561 — source-verified local TikTok draft handoff. Never implies a remote draft or post.
import {allowedImage} from './productDistribution406.mjs';

const clean=value=>String(value??'').trim();
const parseScopes=value=>{try{const list=JSON.parse(value||'[]');return Array.isArray(list)?list.filter(x=>typeof x==='string'):[];}catch{return [];}};
const descriptionText=value=>clean(value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const PHOTO_LIMIT=35;
export const TIKTOK_CAPTION_LIMIT_561=4000; // TikTok photo description is measured in UTF-16 code units.

export function prepareTikTokCaption561(product={}){
  const name=clean(product.name),description=descriptionText(product.short_description||product.description);
  const price=Number(product.price_cents);
  const priceText=Number.isSafeInteger(price)&&price>0&&clean(product.currency).toUpperCase()==='CAD'
    ?`CAD $${(price/100).toFixed(2)}`:'';
  return [name,description,priceText].filter(Boolean).join('\n\n');
}

export function projectTikTokHandoff561({product,oauth,platforms,images,annotationUnavailable=false,
  oauthUnavailable=false,now=Date.now()}={}){
  const saved=Number.isSafeInteger(Number(product?.product_id))&&Number(product.product_id)>0;
  const candidates=Array.isArray(images)?images:[];
  const allApproved=candidates.filter(allowedImage);
  const photos=allApproved.slice(0,PHOTO_LIMIT).map(image=>({product_image_id:Number(image.product_image_id),
    image_url:image.image_url,alt_text:clean(image.alt_text),width_px:Number(image.width_px),height_px:Number(image.height_px)}));
  const record=(Array.isArray(oauth)?oauth:[]).find(row=>row.provider_key==='tiktok');
  const expiresAt=record?.access_expires_at?Date.parse(String(record.access_expires_at)):NaN;
  const expired=Number.isFinite(expiresAt)&&expiresAt<=now;
  const connected=record?.connection_status==='connected'&&!expired;
  const granted=new Set(parseScopes(record?.scopes_json));
  const platform=(Array.isArray(platforms)?platforms:[]).find(row=>row.platform_key==='tiktok');
  const title=clean(product?.name),caption=prepareTikTokCaption561(product);
  const warnings=[];
  if(!saved)warnings.push('Save this Product first.');
  if(!title)warnings.push('Add the actual Product name.');
  if(!descriptionText(product?.short_description||product?.description))warnings.push('Add a truthful saved Product description before preparing the caption.');
  if(!Number.isSafeInteger(Number(product?.price_cents))||Number(product.price_cents)<=0||clean(product.currency).toUpperCase()!=='CAD')
    warnings.push('Review and save a positive CAD Product price.');
  if(!['draft','active'].includes(clean(product?.status)))warnings.push('Archived or missing Products are not ready for a new social draft.');
  if(!photos.length)warnings.push('No original Product photo has cross-channel public-use approval, alt text and verified dimensions.');
  if(annotationUnavailable)warnings.push('Photo approval annotations are unavailable; approvals were not inferred.');
  if(allApproved.length>PHOTO_LIMIT)warnings.push(`Only the first ${PHOTO_LIMIT} approved originals are included in this photo handoff.`);
  if(caption.length>TIKTOK_CAPTION_LIMIT_561)warnings.push('Caption exceeds TikTok’s 4,000 UTF-16-character photo description limit. Shorten it before copying.');
  const accountChecks=[];
  if(oauthUnavailable)accountChecks.push('Saved TikTok OAuth status could not be read. Manual handoff remains possible.');
  else if(!record)accountChecks.push('No saved TikTok OAuth connection.');
  else if(record.connection_status!=='connected')accountChecks.push(`Saved TikTok OAuth status is ${clean(record.connection_status)||'unavailable'}.`);
  else if(expired)accountChecks.push('Saved TikTok OAuth access is expired.');
  if(!granted.has('video.upload'))accountChecks.push('TikTok upload scope video.upload is not confirmed in saved authorization.');
  if(!granted.has('video.publish'))accountChecks.push('TikTok direct-post scope video.publish is not confirmed in saved authorization.');
  accountChecks.push('TikTok app audit, current creator/privacy settings and verified photo-host domain are not independently confirmed.');
  accountChecks.push('This Product has no verified TikTok upload, provider draft or published post receipt.');
  return {
    product_id:saved?Number(product.product_id):null,product_name:title,product_status:clean(product?.status),
    caption,caption_length:caption.length,caption_limit:TIKTOK_CAPTION_LIMIT_561,
    approved_photo_count:allApproved.length,reviewed_photo_count:candidates.length,photos,
    manual_handoff_ready:warnings.length===0,manual_handoff_warnings:warnings,
    mode:'manual_draft_handoff',local_packet_state:'prepared_on_request_not_saved_on_tiktok',
    connection_state:oauthUnavailable?'unavailable':!record?'not_connected':connected?'local_oauth_only':'needs_attention',
    upload_scope_saved:granted.has('video.upload'),publish_scope_saved:granted.has('video.publish'),
    local_api_ready_claim:platform?.api_ready===1||platform?.api_ready===true,
    account_checks:accountChecks,creator_live_verified:false,app_audit_verified:false,media_domain_verified:false,
    api_upload_allowed:false,api_publish_allowed:false,remote_draft_id:null,remote_post_id:null,
    provider_contacted:false,publication_performed:false,automatic_provider_action:false
  };
}
