/* Build 464 — explicit Admin-only real-order pilot using canonical Build 454 append-only receipts. */
import {PILOT_ROUTES_464,evaluatePilot464,pilotPayload464} from './maker-fulfillment-pilot-policy-464.mjs?v=464';
import {evaluateTrial474,trialPayload474} from './maker-fulfillment-trial-policy-474.mjs?v=474';
import {reconcileClosure475,closurePayload475} from './maker-fulfillment-closure-policy-475.mjs?v=475';
import {agingBand476,reviewEscalation476,escalationPayload476} from './maker-aftercare-aging-policy-476.mjs?v=476';
import {auditAftercare477,auditPayload477} from './maker-aftercare-independent-audit-policy-477.mjs?v=477';
const el=id=>document.getElementById(id),api=(...args)=>(window.DDAuth?.apiFetch||fetch)(...args);
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const route=el('fpRoute'),record=el('fpRecord'),decisionEl=el('fpDecision'),receiptEl=el('fpReceipt');
for(const v of PILOT_ROUTES_464){const o=make('option',v.label);o.value=v.key;route.append(o);}
{const o=make('option','Owner exception reconciliation & closure evidence review (no closure)');o.value='closure_review';route.append(o);}
{const o=make('option','Aftercare exception aging & owner escalation review (no notification)');o.value='escalation_review';route.append(o);}
{const o=make('option','Independent aftercare follow-up audit (different authenticated reviewer)');o.value='independent_audit';route.append(o);}
let active=null,requestKey=null,posting=false;
function lockForm(locked){for(const control of el('fpReview').querySelectorAll('input,select,textarea,button'))control.disabled=locked;}
function snapshot(s){return JSON.stringify([s?.detail?.order?.order_id,s?.detail?.order?.order_status,s?.detail?.order?.payment_status,s?.detail?.order?.fulfillment_type,s?.detail?.order?.shipping_country,s?.detail?.order?.currency,s?.fulfillment?.evidence?.[0]?.evidence_id||0,s?.fulfillment?.evidence?.length||0]);}
function pilotForm(){return{route:route.value,consent_state:el('fpConsent').value,consent_reference:el('fpConsentReference').value,receipt_reference:el('fpReceiptReference').value,carrier:el('fpCarrier').value,tracking_reference:el('fpTracking').value,package_instructions:el('fpPacking').value,review_note:el('fpNote').value,owner_observed:el('fpObserved').checked,case_reference:el('fpCaseReference').value,evidence_source:el('fpEvidenceSource').value,condition_state:el('fpCondition').value,source_hold_receipt_id:el('fpSourceHold').value,closure_reference:el('fpClosureReference').value,closure_disposition:el('fpClosureDisposition').value,closure_observed:el('fpClosureObserved').checked,escalation_source_id:el('fpEscalationSource').value,escalation_level:el('fpEscalationLevel').value,escalation_evidence_reference:el('fpEscalationEvidence').value,followup_state:el('fpFollowupState').value,escalation_observed:el('fpEscalationObserved').checked,audit_source_hold_id:el('fpAuditSource').value,audit_followup_id:el('fpAuditFollowup').value,audit_evidence_reference:el('fpAuditEvidence').value,audit_disposition:el('fpAuditDisposition').value,audit_observed:el('fpAuditObserved').checked};}
function invalidate(){requestKey=null;record.disabled=true;decisionEl.textContent='HOLD — changed inputs require a new local source review.';}
for(const id of ['fpRoute','fpConsent','fpConsentReference','fpReceiptReference','fpCarrier','fpTracking','fpPacking','fpNote','fpObserved','fpCaseReference','fpEvidenceSource','fpCondition','fpSourceHold','fpClosureReference','fpClosureDisposition','fpClosureObserved','fpEscalationSource','fpEscalationLevel','fpEscalationEvidence','fpFollowupState','fpEscalationObserved','fpAuditSource','fpAuditFollowup','fpAuditEvidence','fpAuditDisposition','fpAuditObserved'])el(id).addEventListener('change',invalidate);
for(const id of ['fpConsentReference','fpReceiptReference','fpCarrier','fpTracking','fpPacking','fpNote','fpCaseReference','fpSourceHold','fpClosureReference','fpEscalationSource','fpEscalationEvidence','fpAuditSource','fpAuditFollowup','fpAuditEvidence'])el(id).addEventListener('input',invalidate);
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
 const holdCount=s.fulfillment.evidence.filter(e=>['damage_hold','return_hold','repair_followup'].includes(e.event_kind)).length;
 const closureSummary=make('p',`Build 475 source reconciliation: ${holdCount} original damage/return/repair HOLD receipts among ${s.fulfillment.evidence.length} fetched entries. A HOLD does not prove resolution. ${s.fulfillment.history_truncated?'History incomplete — closure review blocked.':'Select the source receipt ID and confirm original case reference.'}`);area.append(closureSummary);
 const aging=make('div');const title=make('h3','Build 476 · Advisory exception age review');aging.append(title);
 aging.append(make('p','7 / 14 / 30-day bands are review prompts only, not a contractual SLA or automatic escalation. The browser estimates elapsed UTC days from original receipt timestamps.'));
 const agedList=make('ul');for(const item of s.fulfillment.evidence.filter(e=>['damage_hold','return_hold','repair_followup'].includes(e.event_kind)).slice(0,20)){
  const band=agingBand476(item.created_at);agedList.append(make('li',`HOLD receipt #${item.evidence_id} · ${band.age_days===null?'age unknown':`${band.age_days} days`} · ${band.band}`));
 }aging.append(agedList);if(s.fulfillment.history_truncated)aging.append(make('p','HOLD: history truncated; age summary is incomplete.'));area.append(aging);
 el('fpLoadStatus').textContent=source?.order_id===order.order_id?'Original Orders and Build 454 evidence loaded (still subject to owner verification).':'HOLD — order and ledger identity disagree; do not record a receipt.';
}
async function openOrder(id){if(!Number.isSafeInteger(id)||id<1){el('fpLoadStatus').textContent='HOLD — select an existing positive numeric order ID.';return;}
 const button=el('fpLoad');button.disabled=true;active=null;record.disabled=true;requestKey=null;el('fpLoadStatus').textContent='Reading original order and Build 454 evidence on explicit request…';
 try{const s=await read(id);active=s;render(s);receiptEl.textContent='No new receipt recorded for this review.';decisionEl.textContent='HOLD — enter actual proof and evaluate.';}
 catch(error){el('fpLoadStatus').textContent='HOLD — '+String(error.message||'Source unavailable').slice(0,200);el('fpOrderSummary').replaceChildren();el('fpEvidence').replaceChildren();}
 finally{button.disabled=false;}
}
el('fpLookup').addEventListener('submit',e=>{e.preventDefault();openOrder(Number(el('fpOrderId').value));});
function evaluate(){const review=auditAftercare477({detail:active?.detail,fulfillment:active?.fulfillment,form:pilotForm()});record.disabled=!review.can_append_existing_receipt||posting;
 const list=el('fpHolds');list.replaceChildren();for(const text of review.holds)list.append(make('li','HOLD: '+text));
 decisionEl.textContent=review.can_append_existing_receipt?'READY for an explicit append-only owner receipt. This is not delivery, customer consent or refund verification.':`HOLD — ${review.holds.length} required source/owner checks are incomplete. Nothing submitted.`;
 return review;}
el('fpEvaluate').addEventListener('click',evaluate);
el('fpReview').addEventListener('submit',async e=>{e.preventDefault();if(posting||!active)return;
 const review=evaluate(),form=pilotForm(),id=Number(active.detail.order.order_id);if(!review.can_append_existing_receipt)return;
 posting=true;lockForm(true);receiptEl.textContent='Rechecking original records before append-only submission…';
 try{const fresh=await read(id);if(snapshot(fresh)!==snapshot(active)){active=fresh;render(fresh);invalidate();throw Error('Original order or evidence changed. Review latest records and evaluate again.');}
  const final=auditAftercare477({detail:fresh.detail,fulfillment:fresh.fulfillment,form});if(!final.can_append_existing_receipt)throw Error('Original source failed final owner checks.');
  requestKey=requestKey||crypto.randomUUID().replaceAll('-','');const payload=form.route==='independent_audit'?auditPayload477({decision:final,form,orderId:id,requestKey}):form.route==='escalation_review'?escalationPayload476({decision:final,form,orderId:id,requestKey}):form.route==='closure_review'?closurePayload475({decision:final,form,orderId:id,requestKey}):trialPayload474({decision:final,form,orderId:id,requestKey});if(!payload)throw Error('Unable to construct an original-source evidence receipt.');
  const response=await api('/api/admin/maker-fulfillment-evidence',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid receipt response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  receiptEl.textContent=`Build 454 append-only receipt #${result.receipt_id||'unknown'} ${result.replayed?'replayed safely':'recorded'} against original order #${id}. Route ${form.route}. All real-world acceptance, payment, shipment, exchanges and customer consent remain separately controlled.`;
  requestKey=null;active=await read(id);render(active);el('fpNote').value='';el('fpObserved').checked=false;invalidate();
 }catch(error){receiptEl.textContent='HOLD: '+String(error.message||'Save outcome unknown').slice(0,250)+' If a network response was lost, retry the unchanged form to reconcile the same request key; do not fabricate a new receipt.';}
 finally{posting=false;lockForm(false);record.disabled=!auditAftercare477({detail:active?.detail,fulfillment:active?.fulfillment,form:pilotForm()}).can_append_existing_receipt;}
});
const fromUrl=Number(new URLSearchParams(location.search).get('order_id'));if(Number.isSafeInteger(fromUrl)&&fromUrl>0)el('fpOrderId').value=String(fromUrl);
