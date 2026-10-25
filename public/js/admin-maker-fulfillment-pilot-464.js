/* Build 464 — explicit Admin-only real-order pilot using canonical Build 454 append-only receipts. */
import {PILOT_ROUTES_464,evaluatePilot464,pilotPayload464} from './maker-fulfillment-pilot-policy-464.mjs?v=464';
const el=id=>document.getElementById(id),api=(...args)=>(window.DDAuth?.apiFetch||fetch)(...args);
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const route=el('fpRoute'),record=el('fpRecord'),decisionEl=el('fpDecision'),receiptEl=el('fpReceipt');
for(const v of PILOT_ROUTES_464){const o=make('option',v.label);o.value=v.key;route.append(o);}
let active=null,requestKey=null,posting=false;
function lockForm(locked){for(const control of el('fpReview').querySelectorAll('input,select,textarea,button'))control.disabled=locked;}
function snapshot(s){return JSON.stringify([s?.detail?.order?.order_id,s?.detail?.order?.order_status,s?.detail?.order?.payment_status,s?.detail?.order?.fulfillment_type,s?.detail?.order?.shipping_country,s?.detail?.order?.currency,s?.fulfillment?.evidence?.[0]?.evidence_id||0,s?.fulfillment?.evidence?.length||0]);}
function pilotForm(){return{route:route.value,consent_state:el('fpConsent').value,consent_reference:el('fpConsentReference').value,receipt_reference:el('fpReceiptReference').value,carrier:el('fpCarrier').value,tracking_reference:el('fpTracking').value,package_instructions:el('fpPacking').value,review_note:el('fpNote').value,owner_observed:el('fpObserved').checked};}
function invalidate(){requestKey=null;record.disabled=true;decisionEl.textContent='HOLD — changed inputs require a new local source review.';}
for(const id of ['fpRoute','fpConsent','fpConsentReference','fpReceiptReference','fpCarrier','fpTracking','fpPacking','fpNote','fpObserved'])el(id).addEventListener('change',invalidate);
for(const id of ['fpConsentReference','fpReceiptReference','fpCarrier','fpTracking','fpPacking','fpNote'])el(id).addEventListener('input',invalidate);
async function read(id){const args={method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
 const responses=await Promise.all([api(`/api/admin/order-detail?order_id=${id}`,args),api(`/api/admin/maker-fulfillment-evidence?order_id=${id}`,args)]);
 const data=await Promise.all(responses.map(async r=>{const b=await r.json().catch(()=>({ok:false,error:'Invalid original source response.'}));if(!r.ok||b.ok!==true)throw Error(b.error||`Source status ${r.status}`);return b;}));
 return {detail:data[0],fulfillment:data[1]};
}
function render(s){const order=s.detail.order,source=s.fulfillment.order;
 el('fpOrderSummary').replaceChildren();const summary=make('p',`Original order #${order.order_number||order.order_id} · order ${order.order_status} · payment ${order.payment_status} · ${order.fulfillment_type} · ${order.shipping_country||'local pickup'} · ${order.currency}`);el('fpOrderSummary').append(summary);
 const original=make('p');const link=make('a','Open canonical order owner (verify source)');link.href=`/admin/orders/?order_id=${Number(order.order_id)}`;original.append(link);el('fpOrderSummary').append(original);
 const area=el('fpEvidence');area.replaceChildren();const head=make('h3',`Existing Build 454 receipts (${s.fulfillment.evidence.length}${s.fulfillment.history_truncated?'+; older rows exist':''})`);area.append(head);
 if(!s.fulfillment.evidence.length)area.append(make('p','No original delivery/return proof recorded here. Actual shipment/pickup and consent must be checked manually.'));
 const list=make('ol');for(const r of s.fulfillment.evidence.slice(0,12)){const item=make('li',`${r.event_kind} · #${r.evidence_id} · ${r.created_at} · ${r.review_note}`);list.append(item);}area.append(list);
 el('fpLoadStatus').textContent=source?.order_id===order.order_id?'Original Orders and Build 454 evidence loaded (still subject to owner verification).':'HOLD — order and ledger identity disagree; do not record a receipt.';
}
async function openOrder(id){if(!Number.isSafeInteger(id)||id<1){el('fpLoadStatus').textContent='HOLD — select an existing positive numeric order ID.';return;}
 const button=el('fpLoad');button.disabled=true;active=null;record.disabled=true;requestKey=null;el('fpLoadStatus').textContent='Reading original order and Build 454 evidence on explicit request…';
 try{const s=await read(id);active=s;render(s);receiptEl.textContent='No new receipt recorded for this review.';decisionEl.textContent='HOLD — enter actual proof and evaluate.';}
 catch(error){el('fpLoadStatus').textContent='HOLD — '+String(error.message||'Source unavailable').slice(0,200);el('fpOrderSummary').replaceChildren();el('fpEvidence').replaceChildren();}
 finally{button.disabled=false;}
}
el('fpLookup').addEventListener('submit',e=>{e.preventDefault();openOrder(Number(el('fpOrderId').value));});
function evaluate(){const review=evaluatePilot464({detail:active?.detail,fulfillment:active?.fulfillment,form:pilotForm()});record.disabled=!review.can_append_existing_receipt||posting;
 const list=el('fpHolds');list.replaceChildren();for(const text of review.holds)list.append(make('li','HOLD: '+text));
 decisionEl.textContent=review.can_append_existing_receipt?'READY for an explicit append-only owner receipt. This is not delivery, customer consent or refund verification.':`HOLD — ${review.holds.length} required source/owner checks are incomplete. Nothing submitted.`;
 return review;}
el('fpEvaluate').addEventListener('click',evaluate);
el('fpReview').addEventListener('submit',async e=>{e.preventDefault();if(posting||!active)return;
 const review=evaluate(),form=pilotForm(),id=Number(active.detail.order.order_id);if(!review.can_append_existing_receipt)return;
 posting=true;lockForm(true);receiptEl.textContent='Rechecking original records before append-only submission…';
 try{const fresh=await read(id);if(snapshot(fresh)!==snapshot(active)){active=fresh;render(fresh);invalidate();throw Error('Original order or evidence changed. Review latest records and evaluate again.');}
  const final=evaluatePilot464({detail:fresh.detail,fulfillment:fresh.fulfillment,form});if(!final.can_append_existing_receipt)throw Error('Original source failed final owner checks.');
  requestKey=requestKey||crypto.randomUUID().replaceAll('-','');const payload=pilotPayload464({decision:final,form,orderId:id,requestKey});if(!payload)throw Error('Unable to construct an original-source evidence receipt.');
  const response=await api('/api/admin/maker-fulfillment-evidence',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid receipt response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  receiptEl.textContent=`Build 454 append-only receipt #${result.receipt_id||'unknown'} ${result.replayed?'replayed safely':'recorded'} against original order #${id}. Route ${form.route}. All real-world acceptance, payment, shipment, exchanges and customer consent remain separately controlled.`;
  requestKey=null;active=await read(id);render(active);el('fpNote').value='';el('fpObserved').checked=false;invalidate();
 }catch(error){receiptEl.textContent='HOLD: '+String(error.message||'Save outcome unknown').slice(0,250)+' If a network response was lost, retry the unchanged form to reconcile the same request key; do not fabricate a new receipt.';}
 finally{posting=false;lockForm(false);record.disabled=!evaluatePilot464({detail:active?.detail,fulfillment:active?.fulfillment,form:pilotForm()}).can_append_existing_receipt;}
});
const fromUrl=Number(new URLSearchParams(location.search).get('order_id'));if(Number.isSafeInteger(fromUrl)&&fromUrl>0)el('fpOrderId').value=String(fromUrl);
