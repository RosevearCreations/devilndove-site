// Build 409 explicit operator-only Etsy trial authorization; never auto-sends or publishes.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const e={product:$('etsy399ProductId'),draft:$('etsy399DraftSelect'),shipping:$('etsy399Shipping'),
button:$('etsy409Authorize'),read:$('etsy409Read'),ack:$('etsy409Acknowledge'),shippingConsent:$('etsy409ShippingConfirmed'),
consent:$('etsy409TrialConsent'),receipt:$('etsy409TrialReceipt'),status:$('etsy409Status')};
if(!e.button||!e.product||!e.draft||!window.DDAuth?.apiFetch)return;
let snapshot=null,busy=false;
const say=m=>{e.status.textContent=m};
const reset=()=>{snapshot=null;e.receipt.value='';say('No Build 409 authorization. Load current Product and staged draft before any remote attempt.');buttons()};
function buttons(){e.button.disabled=busy||!snapshot?.ready_for_operator_trial||!e.consent.checked||!e.shippingConsent.checked||!Number(e.shipping.value);e.read.disabled=busy||!Number(e.product.value)||!e.draft.value;
e.ack.disabled=busy||!snapshot?.provider_reconciliation_receipt||!!snapshot?.reconciliation_409_receipt;}
async function call(url,opt){const r=await window.DDAuth.apiFetch(url,{cache:'no-store',...opt}),x=await r.json().catch(()=>null);
if(!r.ok||!x?.ok)throw Error((x?.error||'Request failed')+(x?.blockers?.length?': '+x.blockers.join(', '):''));return x;}
async function read(){if(busy)return;busy=true;buttons();try{
const product=Number(e.product.value),draft=e.draft.value;
snapshot=await call('/api/admin/etsy-trial-409?product_id='+encodeURIComponent(product)+'&draft_id='+encodeURIComponent(draft));
e.receipt.value='';
say('Readiness: '+(snapshot.blockers.length?'HOLD — '+snapshot.blockers.join(', '):'READY FOR SEPARATE OPERATOR TRIAL')+
'. 409 receipt #'+snapshot.trial_receipt+', Build 399 remote claim #'+snapshot.remote_attempt_claim+
', Build 400 verified evidence #'+snapshot.provider_reconciliation_receipt+'. No remote call made.');
}catch(err){snapshot=null;e.receipt.value='';say('Cannot verify: '+err.message)}finally{busy=false;buttons()}}
async function act(action){if(busy||!snapshot||!globalThis.crypto?.randomUUID)return;
busy=true;buttons();say('Recording explicit operator decision in D1; no Etsy API request is made by this control.');
try{
const x=await call('/api/admin/etsy-trial-409',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
action,product_id:Number(e.product.value),draft_id:e.draft.value,request_key:globalThis.crypto.randomUUID(),
shipping_profile_id:Number(e.shipping.value),confirmed_no_publish:true,confirmed_one_attempt:true,
confirmed_us_shipping_disabled:true,owner_verified_shipping_profile_us_excluded:e.shippingConsent.checked,
confirmed_read_only_provider_reconciliation:true,
expected_source_fingerprint:snapshot.source_fingerprint,expected_draft_fingerprint:snapshot.draft_fingerprint,
expected_review_receipt:snapshot.review_receipt})});
e.receipt.value=action==='authorize_unpublished_etsy_trial'?String(x.receipt):'';
say(x.message+' Receipt #'+x.receipt+'. '+(e.receipt.value?'Review BOTH Build 399 confirmations and click Create separately.':''));
snapshot=null;
}catch(err){snapshot=null;e.receipt.value='';say('No confirmed authorization: '+err.message+'. Reload before another action.')}
finally{busy=false;buttons()}}
e.read.addEventListener('click',()=>void read());
e.button.addEventListener('click',()=>void act('authorize_unpublished_etsy_trial'));
e.ack.addEventListener('click',()=>void act('record_verified_draft_reconciliation'));
for(const control of [e.product,e.draft,e.shipping])control.addEventListener('change',reset);
for(const control of [e.consent,e.shippingConsent])control.addEventListener('change',buttons);
reset();
})();
