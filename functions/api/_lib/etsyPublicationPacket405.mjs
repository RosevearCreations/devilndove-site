// Build 405: owner decision packet and one canonical Product's channel-intent policy.
import {validId} from './etsyListingEvidence400.mjs';
import {parseReceipt,imageId} from './etsyImageReconciliation402.mjs';
import {gateFreshDraft,finalRevalidation,fullConsent} from './etsyExceptionResolution404.mjs';
export const CHANNELS=Object.freeze(['etsy','facebook']);
export const channelPrefsValid=b=>!!b&&CHANNELS.every(k=>typeof b[k]==='boolean')&&
 b.confirmed_no_provider_publication===true&&/^[0-9a-f-]{32,50}$/i.test(String(b.request_key||''));
export const normalizeChannelPrefs=r=>{
 const o=parseReceipt(r);return {etsy:o?.etsy===true,facebook:o?.facebook===true,configured:!!r,
  receipt:r?.admin_action_audit_id||null,canonical_product_only:true,provider_publication:false};
};
export const connectionRecovery=connection=>{
 const expiration=Date.parse(String(connection?.access_expires_at||''));
 const needsReconnect=!Number.isFinite(expiration)||expiration<=Date.now()+120000;
 return {needs_reconnect:needsReconnect,blocker:needsReconnect?'oauth_access_expired_or_near_expiry':null,
  reconnect_url:'/admin/it-integrations/#etsy-oauth-acceptance',get_only:false,
  instruction:needsReconnect?'Use Reconnect Etsy in the OAuth acceptance panel, then retry Read live options. No remote draft was sent.':
 'The saved OAuth access expiry is valid at this moment; check Etsy read scopes and shipping profiles if options are missing.'};
};
export const decisionPacket=({snapshot,activeHolds,lastDecision,lastHold,selectedImage,acceptance,revalidation,channelPreference})=>{
 const status=finalRevalidation({snapshot,activeHolds,lastDecision,lastHold,selectedImage,acceptance});
 const last=parseReceipt(revalidation);
 const blockers=[...status.blockers];
 if(!revalidation)blockers.push('build404_revalidation_receipt_missing');
 if(last?.decision!=='REVALIDATED_FOR_SEPARATE_MANUAL_ETSY_DECISION')blockers.push('build404_revalidation_not_ready');
 if(last?.listing_id!==snapshot.listing_id)blockers.push('build404_listing_mismatch');
 if(last?.image_id!==imageId(selectedImage))blockers.push('build404_image_mismatch');
 if(last?.latest_403_receipt!==lastDecision?.admin_action_audit_id)blockers.push('build404_decision_stale');
 if(channelPreference?.configured&&channelPreference.etsy!==true)blockers.push('etsy_channel_explicitly_disabled');
 return {status:blockers.length?'OWNER_HOLD_NO_PUBLICATION':'READY_FOR_SEPARATE_OWNER_ETSY_DECISION',
  blockers:[...new Set(blockers)],listing_id:snapshot.listing_id,image_id:imageId(selectedImage),
  shop_and_product_verified:snapshot.blockers.length===0,
  owner_403_decision_receipt:lastDecision?.admin_action_audit_id||null,
  owner_404_revalidation_receipt:revalidation?.admin_action_audit_id||null,
  source:'canonical_product_plus_existing_image_gallery',
  published:false,provider_write:false,publication_authorized:false};
};
export const ownerPacketConsent=b=>fullConsent(b)&&b?.owner_confirmed_packet_nonpublishing===true;
