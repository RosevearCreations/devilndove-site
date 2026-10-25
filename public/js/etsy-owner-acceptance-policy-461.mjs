/* Build 461 — read-only operator projection, never a provider-write authorization. */
const integer=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const str=v=>String(v??'').trim();
const draftId=v=>/^[A-Za-z0-9-]{16,80}$/.test(str(v))?str(v):'';
export const OWNER_461_CHECKS=Object.freeze([
 {key:'shop',label:'Personally confirm the intended Devil n Dove Etsy shop and CAD currency',help:'Check the signed-in shop account at Etsy, not only its stored identifier.'},
 {key:'product',label:'Compare this exact Product, CAD price, quantity and selected public-cleared photos',help:'The owner must compare the real Product and gallery in both systems; no automatically copied image becomes approved.'},
 {key:'shipping',label:'Inspect the selected live Etsy shipping profile: Canada supported, United States excluded',help:'The stored US_SHIPPING_DISABLED label is policy intent, not proof of current remote destinations.'},
 {key:'draft',label:'Verify the actual Etsy listing ID, listing state DRAFT and never publish or activate',help:'Check Etsy directly using an authenticated read. A historic receipt can become stale.'},
 {key:'rights',label:'Confirm image rights, seller permission and distinct final owner sign-off',help:'A technical PREVIEW, source fingerprint or historical packet cannot substitute for our decision.'}
]);

export function evaluateEtsyOwner461({productId,localDraftId,oauth,trial,local,packet}={}){
 const product=integer(productId),draft=draftId(localDraftId),holds=[];
 if(!product||!draft)holds.push('Select the exact saved Product ID and local Etsy draft UUID.');
 if(!oauth?.ok||!oauth?.main_site_operator_acceptance)holds.push('Main-domain Etsy OAuth status was not verified.');
 const shopId=str(oauth?.shop?.shop_id),cad=str(oauth?.shop?.currency_code).toUpperCase()==='CAD';
 if(!oauth?.connection?.connected||!shopId||!cad||oauth?.shop?.acceptance_status!=='connected_verified')
  holds.push('The intended connected Etsy shop and Canadian-dollar currency have not been confirmed.');
 if(!trial?.ok||Number(trial.product_id)!==product||str(trial.draft_id)!==draft)holds.push('Current canonical Product/draft trial evidence is missing or mismatched.');
 if(trial?.shippingPolicy!=='US_SHIPPING_DISABLED')holds.push('Stored Canada-first/US-shipping-disabled policy is missing.');
 if(trial?.shop_id&&str(trial.shop_id)!==shopId)holds.push('Etsy shop identity differs across source receipts.');
 if(Array.isArray(trial?.blockers)&&trial.blockers.length)holds.push('Existing Etsy trial blockers need review in their original module: '+trial.blockers.slice(0,8).join(', '));
 if(!local?.ok||str(local.draft_id)!==draft||Number(local.product_id)!==product)
  holds.push('Local remote-draft evidence is absent or not linked to this exact Product.');
 const listingId=str(local?.linked_listing_id||trial?.existing_listing_id);
 if(local?.linked_listing_id&&trial?.existing_listing_id&&str(local.linked_listing_id)!==str(trial.existing_listing_id))
  holds.push('Stored listing IDs disagree; stop and reconcile without creating another draft.');
 if(!integer(local?.claim_receipt||trial?.remote_attempt_claim))holds.push('No verified one-attempt draft creation claim receipt was returned.');
 if(!/^\d+$/.test(listingId)||!integer(listingId))holds.push('No verified remote unpublished listing ID is linked; do not invent one or retry creation.');
 if(!trial?.provider_verified_receipt_present)holds.push('Historical provider draft-verification receipt is missing.');
 if(!packet?.ok||!packet?.packet_status)holds.push('The independent local publication packet is unavailable.');
 holds.push('Current live authenticated Etsy DRAFT state and Canada-only destination profile must be inspected by the owner.');
 holds.push('Final owner acceptance has not been recorded by this read-only view. No Etsy/Meta write is authorized here.');
 return {state:'HOLD_REAL_OWNER_ETSY_ACCEPTANCE',productId:product,draftId:draft,shopId,
  listingId:/^\d+$/.test(listingId)&&integer(listingId)?listingId:'',
  providerVerifiedPreviously:Boolean(trial?.provider_verified_receipt_present),
  locallyLinked:Boolean(local?.linked_listing_id),holds,ownerChecks:OWNER_461_CHECKS,
  shippingCountryPolicy:'CANADA_FIRST_US_SHIPPING_SUSPENDED',currency:'CAD',
  etsyWriteAllowed:false,publicationAllowed:false,automaticRetryAllowed:false,
  meta:{state:'HOLD_SUPPORTED_API_PERMISSION_UNVERIFIED',handoff:'MANUAL_COPY_IN_PRODUCT_EDITOR',providerWritesAllowed:false}};
}
