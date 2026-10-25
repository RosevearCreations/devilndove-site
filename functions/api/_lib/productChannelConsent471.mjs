// Build 471 keeps owner preparation consent separate from any external provider publication.
export function verifyProductChannelConsent471(body){
  if(body?.intent_source_build!==471)return {ok:true,legacy:true};
  const approved=body.owner_confirmed_preparation===true&&
    body.confirmed_no_provider_publication===true&&
    body.canada_only===true&&body.us_shipping_disabled===true&&
    typeof body.etsy==='boolean'&&typeof body.facebook==='boolean';
  return approved?{ok:true,legacy:false}:{ok:false,legacy:false,
    error:'Build 471 requires explicit owner preparation consent and Canada-only/no-publication confirmations.'};
}

export function channelPreparationState471({productSaved,etsy,facebook,consent,canonicalMediaReviewed}){
  const channels=[...(etsy?['etsy']:[]),...(facebook?['facebook']:[])];
  const blockers=[];
  if(!productSaved)blockers.push('canonical_product_must_be_saved');
  if(channels.length&&!consent)blockers.push('owner_preparation_consent_required');
  if(channels.length&&!canonicalMediaReviewed)blockers.push('canonical_media_review_separate');
  return {channels,blockers,product_created:!!productSaved,
    provider_draft_created:false,provider_media_transferred:false,
    provider_publication_authorized:false,provider_publication_performed:false,
    us_shipping_enabled:false,local_preparation_only:true};
}
