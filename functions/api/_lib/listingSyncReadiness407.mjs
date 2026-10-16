// Release 467 Build 407 — provider-neutral listing-sync readiness, no external writes.
import {reviewEvidence,reviewedSourceSignature,outboundChannel} from './productDistribution406.mjs';
const ADAPTERS=Object.freeze({
 etsy:Object.freeze({mode:'draft_only',requires:['etsy_oauth_connected','shop_identity_verified','provider_draft_permission','owner_draft_approval']}),
 facebook:Object.freeze({mode:'review_only',requires:['meta_app_configured','marketplace_listing_permission_verified','owner_destination_approval']})
});
export const adapterContract=destination=>ADAPTERS[String(destination||'').toLowerCase()]||null;
export function listingSyncReadiness({destination,product,images,selectedIds,preference,policyReceipt,providerEvidence={},ownerAcceptance={},lastSyncedSignature=null}={}){
 const channel=String(destination||'').toLowerCase();
 const local=reviewEvidence({channel,product,images,selectedIds,preference,policyReceipt});
 const contract=adapterContract(channel);
 const blockers=[...local.blockers];
 if(!contract||!outboundChannel(channel))blockers.push('adapter_unavailable');
 const required=contract?.requires||[];
 for(const key of required)if(providerEvidence[key]!==true&&ownerAcceptance[key]!==true)blockers.push('acceptance_missing_'+key);
 if(ownerAcceptance.destination!==channel||ownerAcceptance.product_id!==Number(product?.product_id)||ownerAcceptance.accepted!==true)
   blockers.push('explicit_product_destination_acceptance_required');
 const signature=reviewedSourceSignature(product,Array.isArray(selectedIds)?selectedIds:[]);
 if(ownerAcceptance.source_signature!==signature)blockers.push('acceptance_stale_reapprove');
 const unchanged=lastSyncedSignature===signature;
 return Object.freeze({
  destination:channel,source_product_id:local.source_product_id,source_image_ids:local.source_image_ids,
  source_signature:signature,adapter_mode:contract?.mode||'unsupported',
  blockers:[...new Set(blockers)],acceptance_complete:blockers.length===0,
  sync_action:unchanged?'no_change':'requires_operator_review',
  safe_to_prepare_draft:blockers.length===0&&channel==='etsy'&&!unchanged,
  external_execution_allowed:false,publication_allowed:false,
  us_shipping_suspended:true
 });
}
