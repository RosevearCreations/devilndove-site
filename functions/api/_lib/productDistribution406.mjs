// Release 467 Build 406 — one canonical Product and approved gallery across local destination previews.
import {normalizeChannelPrefs} from './etsyPublicationPacket405.mjs';
export const DESTINATIONS=Object.freeze(['etsy','facebook']);
export const outboundChannel=c=>DESTINATIONS.includes(String(c||'').toLowerCase());
export const productIdValid=x=>/^[1-9]\d{0,14}$/.test(String(x??''))&&Number.isSafeInteger(Number(x));
export const imageIdValid=x=>productIdValid(x);
export const ownerKeyValid=x=>/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(String(x||''));
export const auditJSON=row=>{try{return JSON.parse(row?.details_json||'{}')}catch{return {}}};
export const allowedImage=image=>Boolean(image&&imageIdValid(image.product_image_id)&&
 typeof image.image_url==='string'&&/^https:\/\//i.test(image.image_url)&&
 !/\/placeholders?\/|placeholder\.(?:svg|png|webp)|\/fallbacks?\//i.test(image.image_url)&&
 // An on-site-only or social-only approval is not consent for an Etsy / Meta
 // listing. Cross-channel export requires a separate explicit owner grant.
 String(image.public_use_status||'').toLowerCase()==='all_public_ok'&&
 String(image.alt_text||'').trim().length>=5&&Number(image.width_px||0)>=800&&Number(image.height_px||0)>=800);
export const reviewedSourceSignature=(product,imageIds)=>{
 const value=JSON.stringify([String(product?.product_id||''),String(product?.name||''),String(product?.description||''),
 Number(product?.price_cents||0),Number(product?.inventory_quantity||0),String(product?.currency||''),
 String(product?.status||''),imageIds.map(Number)]);
 let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(16).padStart(8,'0');
};
export const channelOn=(row,channel)=>outboundChannel(channel)&&normalizeChannelPrefs(row)[channel]===true;
export function reviewEvidence({channel,product,images,selectedIds,preference,policyReceipt}){
 const issues=[];
 if(!outboundChannel(channel))issues.push('unsupported_destination');
 if(!productIdValid(product?.product_id))issues.push('canonical_product_not_found');
 if(!channelOn(preference,channel))issues.push('channel_switch_off');
 if(String(product?.currency||'').toUpperCase()!=='CAD'||Number(product?.price_cents||0)<=0)issues.push('cad_positive_price_required');
 if(Number(product?.inventory_quantity||0)<1)issues.push('inventory_unavailable');
 if(!['active','draft'].includes(String(product?.status||'')))issues.push('product_not_reviewable');
 const ids=Array.isArray(selectedIds)?selectedIds.map(Number):[];
 if(!ids.length||ids.length>10||new Set(ids).size!==ids.length||ids.some(id=>!imageIdValid(id)))issues.push('invalid_canonical_image_selection');
 const lookup=new Map((Array.isArray(images)?images:[]).map(im=>[Number(im.product_image_id),im]));
 const chosen=ids.map(id=>lookup.get(id)).filter(Boolean);
 if(chosen.length!==ids.length)issues.push('image_not_owned_by_product');
 if(chosen.some(im=>!allowedImage(im)))issues.push('image_not_cleared_or_under_800px');
 const att=auditJSON(policyReceipt);
 if(!policyReceipt||att.channel!==channel||att.product_id!==Number(product?.product_id)||
    att.us_shipping_disabled!==true||att.owner_verified_destinations!==true)issues.push('owner_us_shipping_review_required');
 if(policyReceipt&&(att.image_ids?.map(Number).join(',')!==ids.join(',')||
     att.source_signature!==reviewedSourceSignature(product,ids)))issues.push('source_or_media_changed_reapprove');
 return {destination:channel,source_product_id:product?.product_id||null,
   source_image_ids:ids,source_images:chosen.map(im=>({product_image_id:Number(im.product_image_id),image_url:im.image_url,
     alt_text:im.alt_text,width_px:Number(im.width_px),height_px:Number(im.height_px),image_role:im.image_role||''})),
   shipping_policy:'US_SHIPPING_SUSPENDED_OWNER_ATTESTED_ONLY',blockers:[...new Set(issues)],
   ready_for_local_export:issues.length===0,external_execution_allowed:false,publication_allowed:false};
}
export const imageSelectionValid=ids=>Array.isArray(ids)&&ids.length>0&&ids.length<=10&&
 ids.every(imageIdValid)&&new Set(ids.map(String)).size===ids.length;
