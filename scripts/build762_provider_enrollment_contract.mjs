import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestPost as createOrder} from '../functions/api/checkout-create-order.js';
import {assessStripeAccount762, originalGuestPaymentEvidence762, onRequestGet as merchantAdmin} from '../functions/api/admin/merchant-original-evidence-761.js';
import {paymentExecutionStatus} from '../functions/api/_lib/paymentExecution.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original={id:'acct_AABBCCDDEEFF112233',country:'CA',charges_enabled:true,payouts_enabled:true,details_submitted:true};
assert.equal(assessStripeAccount762(original,original.id,true).status,'ACCOUNT_CONFIGURATION_READ');
for(const bad of [
  assessStripeAccount762(original,'acct_anotheroriginal12345',true),
  assessStripeAccount762({...original,charges_enabled:false},original.id,true),
  assessStripeAccount762({...original,country:'US'},original.id,true),
  assessStripeAccount762(original,original.id,false),
  assessStripeAccount762(original,'',true)
])assert.equal(bad.status,'HOLD','unverified seller/account/webhook/country must fail closed');
const liveWitness={
 provider:'stripe',event_type:'checkout.session.completed',verification_status:'verified',
 process_status:'processed',payload_json:JSON.stringify({id:'evt_mock',livemode:true}),
 related_order_id:25,related_payment_id:67,payment_status:'paid',order_payment_status:'paid',
 currency:'CAD',amount_cents:2765,total_cents:2765,provider_order_id:'cs_live_example'
};
assert.equal(originalGuestPaymentEvidence762(liveWitness).status,'ORIGINAL_LIVE_GUEST_PAYMENT_LEDGER_MATCH');
for(const bad of [
 {...liveWitness,payload_json:JSON.stringify({livemode:false})},
 {...liveWitness,verification_status:'unverified'},
 {...liveWitness,process_status:'received'},
 {...liveWitness,payment_status:'pending'},
 {...liveWitness,order_payment_status:'pending'},
 {...liveWitness,amount_cents:1400},
 {...liveWitness,provider_order_id:''},
 {...liveWitness,event_type:'checkout.session.created'},
 {...liveWitness,related_payment_id:0},
 {...liveWitness,payload_json:'NOT_JSON'}
])assert.equal(originalGuestPaymentEvidence762(bad).status,'HOLD','missing original payment or webhook');
const db={prepare(){throw Error('D1 must not be touched before unavailable provider rejection');}};
const cases=[
 {hostname:'https://devilndove.com',method:'paypal'},
 {hostname:'https://www.devilndove.com',method:'stripe'},
 {hostname:'https://devilndove-site.pages.dev',method:'square'},
 {hostname:'https://devilndove.com',method:'stripe'}
];
for(const {hostname,method} of cases){
 const req=new Request(hostname+'/api/checkout-create-order',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({customer_name:'Build762 Mock Guest',customer_email:'test@example.invalid',payment_method:method,items:[{product_id:1,quantity:1}],currency:'CAD'})});
 const res=await createOrder({request:req,env:{DB:db,DND_ENVIRONMENT:'production',
   STRIPE_SECRET_KEY:'sk_live_mock',STRIPE_PUBLISHABLE_KEY:'pk_live_mock',
   PAYPAL_CLIENT_ID:'mock',PAYPAL_SECRET:'mock',PAYPAL_ENV:'live'}});
 assert.equal(res.status,423,'unavailable payment must be blocked before order mutation');
 const body=await res.json();
 assert.equal(body.code,'checkout_payment_provider_unavailable');
 assert.equal(body.local_order_mutation_performed,false);
 assert.equal(body.provider_network_call_performed,false);
 assert.equal(body.provider,method);
}
assert.equal(paymentExecutionStatus('https://devilndove.com/api/checkout-prepare-payment',{
 STRIPE_SECRET_KEY:'sk_live_dnd',
 PAYMENT_PROVIDER_EXECUTION_MODE:'development-explicit',DND_ENVIRONMENT:'production'
},'stripe').execution_authorized,false,'an enrollment report cannot activate money movement');
const unauthorized=await merchantAdmin({request:new Request('https://devilndove.com/api/admin/merchant-original-evidence-761'),env:{}});
assert.equal(unauthorized.status,401,'private Google/provider/source evidence remains Admin-only');
const admin=file('public/js/admin-merchant-search-distribution.js');
assert.match(admin,/provider_enrollment_762/);
assert.match(admin,/Google Store Quality \/ guest eWallet scorecard: NOT independently accepted/);
const source=file('functions/api/admin/merchant-original-evidence-761.js');
assert.match(source,/https:\/\/api\.stripe\.com\/v1\/account/);
assert.match(source,/method:'GET'/);
assert.doesNotMatch(source,/method:'POST'|method:'PATCH'|method:'DELETE'/);
assert.match(source,/automatic_live_activation:false/);
assert.match(file('functions/api/checkout-create-order.js'),/checkout_payment_provider_unavailable/);
assert.match(file('public/js/checkout.js'),/checkout761RemoteReady/);
console.log('BUILD762 PASS: original production API preflight 423/no D1, verified live Stripe account mismatches HOLD, webhook+same-order settled payment must be live/verified, no automatic charging, private Merchant status and guest wallet remain fail-closed.');
