import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewProviderBindingDrift720} from '../functions/api/admin/production-variable-audit-406.js';
const base={
 SESSION_SECRET:'sensitive-secret-please-dont-return-me',
 DB:{prepare:()=>{}},PRODUCT_MEDIA_BUCKET:{get:()=>{}},
 CAIP_PRIVATE_MEDIA_BUCKET:{head:()=>{}}
};
const review=(x={})=>reviewProviderBindingDrift720({...base,...x});
const baseline=review();
assert.equal(baseline.build,720);
assert.deepEqual(baseline.alerts,[]);
assert.equal(baseline.providers.find(x=>x.provider==='paypal').status,'NOT_CONFIGURED_OPTIONAL');
assert.equal(baseline.providers.find(x=>x.provider==='etsy').status,'NOT_CONFIGURED_OPTIONAL');
assert.equal(baseline.owner_ledger_approval,'HOLD_NO_PERSISTED_APPROVAL_ORIGINAL_SOURCE_REQUIRED');
assert.equal(baseline.signed_custody_recovery,'HOLD_REQUIRES_ORIGINAL_FINANCIAL_718_INDEPENDENT_SIGNATURE');
assert.equal(baseline.media_closure,'HOLD_REQUIRES_ORIGINAL_SIGNED_D1_AND_LIVE_R2_READBACK');
assert.equal(baseline.approval_recorded,false);
assert.equal(baseline.external_calls,0);
assert.equal(baseline.background_watcher,false);
assert.equal(baseline.automatic_financial_close,false);
assert.equal(baseline.source_renewal_freshness,'UNVERIFIED_NO_PROVIDER_RECEIPT');
const missing=review({SESSION_SECRET:'',DB:null,PRODUCT_MEDIA_BUCKET:null,CAIP_PRIVATE_MEDIA_BUCKET:null});
assert.ok(missing.alerts.includes('CORE_REQUIRED_MISSING'));
assert.ok(missing.alerts.includes('RESOURCE_BINDING_MISSING'));
assert.equal(missing.missing_binding_names.length,3);
const partial=review({ETSY_API_KEYSTRING:'Etsy-secret-marker'});
assert.ok(partial.alerts.includes('PARTIALLY_CONFIGURED_PROVIDER'));
assert.ok(partial.alerts.includes('ETSY_CALLBACK_MISSING_OR_MISMATCH'));
assert.equal(partial.providers.find(x=>x.provider==='etsy').status,'INCOMPLETE_REVIEW_HOLD');
const wrongCallback=review({ETSY_API_KEYSTRING:'marker-one',ETSY_SHARED_SECRET:'marker-two',
 ETSY_REDIRECT_URI:'https://wrong.example/oauth'});
assert.equal(wrongCallback.etsy_callback_status,'MISMATCH');
assert.ok(wrongCallback.alerts.includes('ETSY_CALLBACK_MISSING_OR_MISMATCH'));
const configured=review({ETSY_API_KEYSTRING:'marker-one',ETSY_SHARED_SECRET:'marker-two',
 ETSY_REDIRECT_URI:'https://devilndove.com/api/social/oauth/etsy/callback'});
assert.equal(configured.etsy_callback_status,'MATCH');
assert.equal(configured.providers.find(x=>x.provider==='etsy').status,'PRESENT_UNVERIFIED');
assert.equal(configured.providers.find(x=>x.provider==='etsy').credential_freshness,'UNVERIFIED');
const paypal=review({PAYPAL_CLIENT_SECRET:'legacy-paypal-secret-marker'});
assert.ok(paypal.alerts.includes('PAYPAL_LEGACY_NAME_NOT_USED_BY_RUNTIME'));
assert.equal(paypal.paypal_legacy_alias_only,true);
const completePaypal=review({PAYPAL_CLIENT_ID:'client-marker',PAYPAL_SECRET:'secret-marker',
 PAYPAL_WEBHOOK_ID:'webhook-marker'});
assert.equal(completePaypal.paypal_legacy_alias_only,false);
assert.equal(completePaypal.providers.find(x=>x.provider==='paypal').status,'PRESENT_UNVERIFIED');
for(const item of [baseline,missing,partial,wrongCallback,configured,paypal,completePaypal]){
 const payload=JSON.stringify(item);
 for(const forbidden of ['sensitive-secret-please-dont-return-me',
  'Etsy-secret-marker','marker-one','marker-two','legacy-paypal-secret-marker',
  'secret-marker','client-marker','webhook-marker','wrong.example']) {
  assert.ok(!payload.includes(forbidden),'Secret or untrusted URL exposed: '+forbidden);
 }
 assert.ok(!payload.includes('SUCCESS_FINANCIAL_CLOSE'));
}
const api=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(api.includes('verifiedAdminFromModule(c)'));
assert.ok(api.includes("'Cache-Control':'no-store'"));
assert.ok(api.includes("review720:reviewProviderBindingDrift720(env)"));
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
assert.ok(html.includes('dd720-provider-drift')&&html.includes('dd720Review'));
assert.ok(html.includes('/admin/social-publishing/#dd718-finance'));
assert.ok(client.includes('production-variable-audit-406?review=720'));
console.log('Build 720 provider config presence drift, secret-safe freshness HOLD and owner approval gate: PASS');
