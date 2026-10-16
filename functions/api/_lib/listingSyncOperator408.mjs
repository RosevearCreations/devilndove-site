// Release 467 Build 408 — deterministic LOCAL operator preparation and evidence.
import {reviewedSourceSignature} from './productDistribution406.mjs';
const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return (n>>>0).toString(16).padStart(8,'0')};
export function parseReceipt(row){try{return JSON.parse(row?.details_json||'{}')}catch{return {}}}
export function evidenceFingerprint({channel,product,images,selectedIds,preference,policyReceipt}){
 const ids=Array.isArray(selectedIds)?selectedIds.map(Number):[];
 const chosen=ids.map(id=>(images||[]).find(i=>Number(i.product_image_id)===id));
 return hash(JSON.stringify([
 channel,reviewedSourceSignature(product,ids),Number(preference?.admin_action_audit_id||0),
 Number(policyReceipt?.admin_action_audit_id||0),
 chosen.map(i=>i?[i.product_image_id,i.image_url,i.alt_text,i.image_role,i.public_use_status,i.width_px,i.height_px]:null)
 ]));
}
export function localDraftPayload({channel,product,images,selectedIds}){
 const ids=Array.isArray(selectedIds)?selectedIds.map(Number):[];
 const chosen=ids.map(id=>(images||[]).find(im=>Number(im.product_image_id)===id));
 if(chosen.some(im=>!im))throw Error('canonical_image_missing');
 return {destination:channel,source_product_id:Number(product.product_id),
 title:String(product.name||'').slice(0,140),description:String(product.description||'').slice(0,15000),
 currency:'CAD',price_cents:Number(product.price_cents),quantity:Number(product.inventory_quantity),
 canonical_images:chosen.map(im=>({product_image_id:Number(im.product_image_id),image_url:im.image_url,alt_text:im.alt_text})),
 shipping_policy:'US_SHIPPING_DISABLED',state:'LOCAL_DRAFT_PREPARATION_ONLY',
 provider_listing_id:null,provider_updated:false,publication_performed:false};
}
export function reconciliation({currentFingerprint,acceptance,preparation,latestReviewReceipt}){
 const a=parseReceipt(acceptance),p=parseReceipt(preparation),blockers=[];
 if(!acceptance||a.fingerprint!==currentFingerprint)blockers.push('owner_acceptance_missing_or_stale');
 if(!preparation||p.fingerprint!==currentFingerprint)blockers.push('prepared_draft_missing_or_stale');
 if(p.owner_acceptance_receipt!==Number(acceptance?.admin_action_audit_id||0))blockers.push('preparation_acceptance_mismatch');
 if(p.review_receipt!==Number(latestReviewReceipt||0))blockers.push('source_review_changed');
 return {status:blockers.length?'HOLD_REPREPARE':'LOCAL_PREPARATION_MATCHED',
 blockers:[...new Set(blockers)],provider_reconciled:false,provider_listing_verified:false,
 local_only:true,publication_performed:false,external_execution_allowed:false};
}
