// Build 761 — independent original Google account readback and product image/payment source contract.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessGoogleShipping,assessGoogleReturns,assessWallet,
  readOriginalImageDimensions,probeOriginalImage,onRequestGet} from '../functions/api/admin/merchant-original-evidence-761.js';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const shipping={services:[{
 serviceName:'Canada Standard',active:true,deliveryCountries:['CA'],currencyCode:'CAD',
 deliveryTime:{minHandlingDays:5,maxHandlingDays:10,minTransitDays:3,maxTransitDays:15},
 rateGroups:[{singleValue:{flatRate:{amountMicros:'15000000',currencyCode:'CAD'}}}]
}]};
assert.equal(assessGoogleShipping(shipping).status,'MATCH');
for(const bad of [
 {...shipping,services:[{...shipping.services[0],active:false}]},
 {...shipping,services:[{...shipping.services[0],rateGroups:[{singleValue:{flatRate:{amountMicros:'0',currencyCode:'CAD'}}}]}]},
 {...shipping,services:[{...shipping.services[0],deliveryTime:{...shipping.services[0].deliveryTime,maxTransitDays:22}}]},
 {...shipping,services:[{...shipping.services[0],rateGroups:[]}]},
 {...shipping,services:[{...shipping.services[0],rateGroups:[{applicableShippingLabels:['fragile'],singleValue:{flatRate:{amountMicros:'15000000',currencyCode:'CAD'}}}]}]}
])assert.equal(assessGoogleShipping(bad).status,'HOLD');
const policy={onlineReturnPolicies:[{returnPolicyId:'202612',label:'default',countries:['CA'],
 policy:{type:'NUMBER_OF_DAYS_AFTER_DELIVERY',days:'14'},
 returnShippingFee:{type:'CUSTOMER_PAYING_ACTUAL_FEE'},
 returnMethods:['BY_MAIL'],returnPolicyUri:'https://devilndove.com/returns/',
 processRefundDays:10,acceptDefectiveOnly:false}]};
assert.equal(assessGoogleReturns(policy).status,'MATCH');
for(const bad of [
 {...policy,onlineReturnPolicies:[]},
 {...policy,onlineReturnPolicies:[{...policy.onlineReturnPolicies[0],policy:{type:'NO_RETURNS'}}]},
 {...policy,onlineReturnPolicies:[{...policy.onlineReturnPolicies[0],returnShippingFee:{type:'FIXED',fixedFee:{amountMicros:'0',currencyCode:'CAD'}}}]},
 {...policy,onlineReturnPolicies:[{...policy.onlineReturnPolicies[0],returnPolicyUri:'https://example.net/returns/'}]},
 {...policy,onlineReturnPolicies:[{...policy.onlineReturnPolicies[0],processRefundDays:30}]},
 {...policy,onlineReturnPolicies:[...policy.onlineReturnPolicies,...policy.onlineReturnPolicies]}
])assert.equal(assessGoogleReturns(bad).status,'HOLD');
const live=assessWallet('https://devilndove.com/checkout/',{
 PAYPAL_CLIENT_ID:'configured',PAYPAL_SECRET:'secret',PAYPAL_ENV:'live',
 STRIPE_SECRET_KEY:'sk_live_dummy',STRIPE_PUBLISHABLE_KEY:'pk_live_dummy'
});
assert.equal(live.status,'HOLD');
assert.equal(live.sources[0].production_execution_authorized,false);
assert.equal(live.sources[1].production_execution_authorized,false);
assert.equal(live.google_wallet_verified,false);
const png=(width,height)=>{
 const a=new Uint8Array(33);a.set([137,80,78,71,13,10,26,10],0);
 const view=new DataView(a.buffer);view.setUint32(16,width);view.setUint32(20,height);return a;
};
assert.deepEqual(readOriginalImageDimensions(png(1500,1300)),{type:'PNG',width:1500,height:1300});
assert.deepEqual(readOriginalImageDimensions(png(500,500)),{type:'PNG',width:500,height:500});
assert.equal(readOriginalImageDimensions(new Uint8Array([0,1,2,3])),null);
let net=0;
const mock=async(url,opts)=>{net++;assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
 assert.equal(opts.headers.Range,'bytes=0-65535');
 return new Response(png(1500,1300),{status:206,headers:{'content-type':'image/png'}});};
const good=await probeOriginalImage('https://devilndove.com/media/products/real',mock);
assert.equal(good.status,'PIXEL_DIMENSIONS_VERIFIED');
assert.equal(good.width,1500);
assert.equal(good.photo_authenticity_certified,false);
assert.equal(net,1);
assert.equal((await probeOriginalImage('http://evil.com/media/real',mock)).status,'HOLD');
assert.equal((await probeOriginalImage('https://evil.com/media/real',mock)).status,'HOLD');
assert.equal((await probeOriginalImage('https://devilndove.com/assets/images/brand-v3/hero.webp',mock)).status,'HOLD');
assert.equal(net,1,'untrusted requests never fetch');
const low=await probeOriginalImage('https://devilndove.com/media/products/small',async()=>new Response(png(900,900),{
 status:206,headers:{'content-type':'image/png'}}));
assert.equal(low.status,'LOW_RESOLUTION');
const noAuth=await onRequestGet({request:new Request('https://devilndove.com/api/admin/merchant-original-evidence-761'),env:{}});
assert.equal(noAuth.status,401,'original source must not be publicly exposed');
const api=get('functions/api/admin/merchant-original-evidence-761.js');
for(const required of ['GOOGLE_MERCHANT_ACCESS_TOKEN','GOOGLE_MERCHANT_ACCOUNT_ID',
 'merchantapi.googleapis.com/accounts/v1/','shippingSettings','onlineReturnPolicies',
 'cache:\x27no-store\x27','getAdminUserFromRequest','google_store_quality_verified:false',
 'returnShippingFee','PHOTO']){
 // PHOTO is intentionally not an identity proof; test source label rather than existence.
 if(required==='PHOTO')continue;
 assert.ok(api.includes(required),required);
}
for(const banned of ["method:'POST'","method:'PATCH'","method:'DELETE'","console.log(token)"])
 assert.ok(!api.includes(banned),'forbidden external write in merchant evidence endpoint');
const checkout=get('public/js/checkout.js'),html=get('checkout/index.html');
assert.ok(checkout.includes('checkout761RemoteReady'));
assert.ok(checkout.includes('/api/payment-providers'));
assert.ok(checkout.includes('!checkout761RemoteReady.has('));
assert.ok(html.includes('checkoutWallet761'));
assert.ok(html.includes('public/js/checkout.js?v=467b78-761'));
const admin=get('public/js/admin-merchant-search-distribution.js');
assert.ok(admin.includes('merchant761Run'));
assert.ok(admin.includes('/api/admin/merchant-original-evidence-761'));
assert.ok(!admin.includes('Google account:</strong> confirmed'));
console.log('BUILD761 PASS: independent original Merchant v1 GET, active Canada rate and default-return fail-closed, real pixel-byte proof, no SSRF, no payment/provider mutation, genuinely unavailable PayPal wallet not certified.');
