/* Build 562: read-only, owner-prepared X and Pinterest handoff. */
import {allowedImage} from './productDistribution406.mjs';
const clean=x=>String(x??'').trim();
const plain=x=>clean(x).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export const LIMITS_562=Object.freeze({x:280,pinterest_title:100,pinterest_description:500});
export function projectSocialHandoff562({product,images,connections,annotationUnavailable=false,connectionUnavailable=false,now=Date.now()}={}){
  const id=Number(product?.product_id),saved=Number.isSafeInteger(id)&&id>0;
  const title=plain(product?.name),description=plain(product?.short_description||product?.description);
  const price=Number(product?.price_cents);
  const priceText=Number.isSafeInteger(price)&&price>0&&clean(product?.currency).toUpperCase()==='CAD'?`CAD $${(price/100).toFixed(2)}`:'';
  const candidates=Array.isArray(images)?images:[];
  const photos=candidates.filter(allowedImage).map(p=>({product_image_id:Number(p.product_image_id),image_url:p.image_url,alt_text:clean(p.alt_text),width_px:Number(p.width_px),height_px:Number(p.height_px)}));
  const warnings=[];
  if(!saved)warnings.push('Save this Product first.');
  if(!title)warnings.push('Add a saved Product name.');
  if(!description)warnings.push('Add a truthful saved Product description.');
  if(!priceText)warnings.push('Review and save a positive CAD Product price.');
  if(!['draft','active'].includes(clean(product?.status)))warnings.push('Archived Products are not ready for social handoff.');
  if(!photos.length)warnings.push('No original Product photo has public-use approval, alt text and verified dimensions.');
  if(annotationUnavailable)warnings.push('Photo approval annotations are unavailable.');
  const xText=[title,description,priceText].filter(Boolean).join(' — ');
  const pinTitle=title,pinDescription=[description,priceText].filter(Boolean).join(' — ');
  const accountChecks=key=>{
    const row=(Array.isArray(connections)?connections:[]).find(x=>x.provider_key===key);
    const expiry=row?.access_expires_at?Date.parse(String(row.access_expires_at)):NaN;
    const checks=[];
    if(connectionUnavailable)checks.push('Saved account connection status unavailable.');
    else if(!row)checks.push(`No saved ${key==='x'?'X':'Pinterest'} connection.`);
    else if(row.connection_status!=='connected')checks.push(`Saved connection status: ${clean(row.connection_status)||'unavailable'}.`);
    else if(Number.isFinite(expiry)&&expiry<=now)checks.push('Saved connection expired.');
    else checks.push('Local OAuth record only; posting permission not independently verified.');
    checks.push('Current account authorization, destination-specific permissions and provider acceptance are not verified.');
    checks.push('No external draft, Pin or post receipt exists for this handoff.');
    return checks;
  };
  return {product_id:saved?id:null,photos,approved_photo_count:photos.length,reviewed_photo_count:candidates.length,
    manual_handoff_warnings:warnings,manual_handoff_ready:warnings.length===0,
    destinations:{x:{text:xText,limit:LIMITS_562.x,within_limit:xText.length<=LIMITS_562.x,account_checks:accountChecks('x'),
      note:'Standard X posts use a 280-character composing limit. Verify the actual composer before posting.'},
    pinterest:{title:pinTitle,title_limit:LIMITS_562.pinterest_title,description:pinDescription,
      description_limit:LIMITS_562.pinterest_description,within_limit:pinTitle.length<=100&&pinDescription.length<=500,
      account_checks:accountChecks('pinterest'),note:'Select a board, original image and destination link manually on Pinterest.'}},
    mode:'manual_handoff',provider_contacted:false,publication_performed:false,automatic_provider_action:false,
    api_publish_allowed:false,remote_post_id:null,remote_pin_id:null};
}
