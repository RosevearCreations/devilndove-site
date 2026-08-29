// Release 451 marketplace/provider calibration. Read-only derivation; no provider execution.
export const MARKETPLACE_CALIBRATION_RELEASE = 451;
export const MARKETPLACE_CALIBRATION_CONTRACT = 'release451-marketplace-calibration';

export const CALIBRATION_CHECKS = Object.freeze([
  ['provider_setup','Provider setup authority recorded'],
  ['provider_disabled','Provider execution remains disabled'],
  ['publication_disabled','Publication remains disabled'],
  ['title_ready','Channel title prepared'],
  ['description_ready','Channel description prepared'],
  ['price_ready','Positive price available'],
  ['quantity_ready','Positive quantity available'],
  ['sku_ready','SKU/reference available'],
  ['image_ready','At least one public-ready image'],
  ['image_depth','Useful multi-image coverage prepared'],
  ['alt_text_ready','Public image alt text available'],
  ['canonical_ready','Canonical Product URL/slug available'],
  ['taxonomy_ready','Marketplace taxonomy/category mapped'],
  ['tags_ready','Search tags/keywords prepared'],
  ['materials_ready','Materials prepared'],
  ['shipping_ready','Shipping profile/method prepared'],
  ['processing_ready','Processing/readiness state prepared'],
  ['returns_ready','Return-policy reference prepared'],
  ['personalization_ready','Personalization data valid or not required'],
  ['variations_ready','Variation data valid or not required'],
  ['fee_model_ready','Marketplace/provider fee model recorded'],
  ['payout_reconciliation_ready','Payout reconciliation evidence available'],
  ['tax_handling_ready','Marketplace tax handling reviewed'],
  ['currency_ready','Currency handling reviewed'],
  ['channel_compliance_ready','Channel-specific compliance evidence reviewed'],
  ['seo_ready','Public SEO/canonical/structured-data gate protected'],
]);

function text(v){ return String(v ?? '').trim(); }
function yes(v){ return Boolean(v === true || Number(v || 0) > 0 || text(v).toLowerCase() === 'yes'); }
function result(id, ok, note=''){ const def=CALIBRATION_CHECKS.find((x)=>x[0]===id); return { id, label:def?.[1] || id, ok:Boolean(ok), note:text(note) }; }

export function evaluateMarketplaceCalibration(input={}){
  const channel=text(input.channel).toLowerCase() || 'manual';
  const profile=input.profile || {};
  const policy=input.policy || {};
  const product=input.product || {};
  const commerce=input.commerce || {};
  const provider=input.provider || {};
  const selectedImages=Array.isArray(input.selected_images) ? input.selected_images : [];
  const tags=Array.isArray(input.tags) ? input.tags : [];
  const materials=Array.isArray(input.materials) ? input.materials : [];
  const checks=[];
  const providerLocked=Number(policy.provider_execution_allowed || 0) === 0;
  const publicationLocked=Number(policy.publication_allowed || 0) === 0;

  checks.push(result('provider_setup', Boolean(provider.setup_authority || provider.provider_key), provider.setup_status || 'not recorded'));
  checks.push(result('provider_disabled', providerLocked, providerLocked ? 'locked' : 'must be disabled during calibration'));
  checks.push(result('publication_disabled', publicationLocked, publicationLocked ? 'locked' : 'must be disabled during calibration'));
  checks.push(result('title_ready', Boolean(text(profile.title_override || product.name))));
  checks.push(result('description_ready', text(profile.description_override || product.description || product.short_description).length >= 40, 'minimum local calibration depth: 40 characters'));
  checks.push(result('price_ready', Number(product.price_cents || 0) > 0));
  checks.push(result('quantity_ready', Number(profile.quantity_override || product.quantity || 1) > 0));
  checks.push(result('sku_ready', Boolean(text(product.sku || product.id))));
  checks.push(result('image_ready', selectedImages.length >= 1));
  checks.push(result('image_depth', selectedImages.length >= Math.min(3, Math.max(1, Number(policy.max_images || 3))), `${selectedImages.length} selected`));
  checks.push(result('alt_text_ready', !selectedImages.length || selectedImages.every((x)=>text(x.alt_text || x.image_url || x).length > 0)));
  checks.push(result('canonical_ready', Boolean(text(product.slug || profile.canonical_url))));

  if(channel === 'etsy'){
    checks.push(result('taxonomy_ready', Number(profile.taxonomy_id || 0) > 0));
    checks.push(result('tags_ready', tags.length > 0 && tags.length <= Number(policy.max_tags || 13), `${tags.length} tag(s)`));
    checks.push(result('materials_ready', materials.length > 0));
    checks.push(result('shipping_ready', Boolean(text(profile.shipping_profile_reference))));
    checks.push(result('processing_ready', Boolean(text(profile.readiness_state_reference))));
    checks.push(result('returns_ready', Boolean(text(profile.return_policy_reference))));
    checks.push(result('personalization_ready', yes(input.personalization_valid ?? true), 'up to 5 typed questions; provider execution still locked'));
    checks.push(result('variations_ready', yes(input.variations_valid ?? true), 'up to 3 variations supported by current local model'));
  } else {
    checks.push(result('taxonomy_ready', Boolean(text(profile.taxonomy_id || profile.category_reference || input.category_reference)), 'channel category mapping'));
    checks.push(result('tags_ready', tags.length > 0 || channel === 'manual'));
    checks.push(result('materials_ready', materials.length > 0 || channel !== 'etsy'));
    checks.push(result('shipping_ready', yes(input.shipping_reviewed) || channel === 'tiktok'));
    checks.push(result('processing_ready', yes(input.processing_reviewed) || channel !== 'etsy'));
    checks.push(result('returns_ready', yes(input.returns_reviewed) || channel === 'tiktok'));
    checks.push(result('personalization_ready', true, 'not an active blocker for this channel'));
    checks.push(result('variations_ready', true, 'not an active blocker for this channel'));
  }

  checks.push(result('fee_model_ready', Number(commerce.cost_row_count || 0) > 0, `${Number(commerce.cost_row_count || 0)} cost row(s)`));
  checks.push(result('payout_reconciliation_ready', Number(commerce.payout_reference_count || 0) > 0 || Number(commerce.cost_row_count || 0) === 0, 'required once provider transactions exist'));
  checks.push(result('tax_handling_ready', yes(input.tax_handling_reviewed), 'review marketplace-collected/remitted tax before go-live'));
  checks.push(result('currency_ready', yes(input.currency_reviewed) || text(product.currency || 'CAD') === 'CAD', text(product.currency || 'CAD')));

  let compliance=false;
  if(channel === 'tiktok') compliance = yes(input.creator_info_reviewed) && yes(input.verified_media_domain) && yes(input.consent_reviewed);
  else if(channel === 'pinterest') compliance = yes(input.business_account_reviewed) && yes(input.domain_claim_reviewed);
  else if(channel === 'facebook') compliance = yes(input.commerce_account_reviewed) || yes(input.catalog_reviewed);
  else if(channel === 'etsy') compliance = yes(input.etsy_shop_reviewed) && yes(input.api_terms_reviewed);
  else compliance = true;
  checks.push(result('channel_compliance_ready', compliance));
  checks.push(result('seo_ready', yes(input.seo_gate_passed), 'public SEO depth gate must remain green'));

  const passed=checks.filter((x)=>x.ok).length;
  const failed=checks.length-passed;
  return {
    release: MARKETPLACE_CALIBRATION_RELEASE,
    contract: MARKETPLACE_CALIBRATION_CONTRACT,
    channel,
    provider_execution_allowed: false,
    publication_allowed: false,
    checks,
    summary:{ total:checks.length, passed, failed, readiness_percent:checks.length ? Math.round((passed/checks.length)*100) : 0 },
    state: failed ? 'needs_calibration' : 'calibrated_local_draft',
  };
}
