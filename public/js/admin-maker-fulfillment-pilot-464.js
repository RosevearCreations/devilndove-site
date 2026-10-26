/* Build 464 — explicit Admin-only real-order pilot using canonical Build 454 append-only receipts. */
import {PILOT_ROUTES_464,evaluatePilot464,pilotPayload464} from './maker-fulfillment-pilot-policy-464.mjs?v=464';
import {evaluateTrial474,trialPayload474} from './maker-fulfillment-trial-policy-474.mjs?v=474';
import {reconcileClosure475,closurePayload475} from './maker-fulfillment-closure-policy-475.mjs?v=475';
import {agingBand476,reviewEscalation476,escalationPayload476} from './maker-aftercare-aging-policy-476.mjs?v=476';
import {auditAftercare477,auditPayload477} from './maker-aftercare-independent-audit-policy-477.mjs?v=477';
import {reconcileAudit478,reconciliationPayload478} from './maker-aftercare-owner-reconciliation-policy-478.mjs?v=478';
import {followupOutstanding479,outstandingPayload479} from './maker-aftercare-outstanding-case-policy-479.mjs?v=479';
import {assessPriority481,priorityPayload481} from './maker-aftercare-priority-policy-481.mjs?v=481';
import {assessHandoff482,handoffPayload482} from './maker-aftercare-handoff-policy-482.mjs?v=482';
import {handoffAge483,assessReassessment483,reassessmentPayload483} from './maker-aftercare-reassessment-policy-483.mjs?v=483';
import {assessDecision484,decisionPayload484} from './maker-aftercare-decision-policy-484.mjs?v=484';
import {assessDecisionHandoff485,decisionHandoffPayload485,decisionAge485} from './maker-aftercare-decision-handoff-policy-485.mjs?v=485';
import {assessOutcome486,outcomePayload486} from './maker-aftercare-outcome-policy-486.mjs?v=486';
const el=id=>document.getElementById(id),api=(...args)=>(window.DDAuth?.apiFetch||fetch)(...args);
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const route=el('fpRoute'),record=el('fpRecord'),decisionEl=el('fpDecision'),receiptEl=el('fpReceipt');
for(const v of PILOT_ROUTES_464){const o=make('option',v.label);o.value=v.key;route.append(o);}
{const o=make('option','Owner exception reconciliation & closure evidence review (no closure)');o.value='closure_review';route.append(o);}
{const o=make('option','Aftercare exception aging & owner escalation review (no notification)');o.value='escalation_review';route.append(o);}
{const o=make('option','Independent aftercare follow-up audit (different authenticated reviewer)');o.value='independent_audit';route.append(o);}
{const o=make('option','Owner audit exception & evidence reconciliation (no case closure)');o.value='audit_reconciliation';route.append(o);}
{const o=make('option','Outstanding aftercare case follow-up review (case stays open)');o.value='outstanding_followup';route.append(o);}
let active=null,requestKey=null,posting=false;
function lockForm(locked){for(const control of el('fpReview').querySelectorAll('input,select,textarea,button'))control.disabled=locked;}
function snapshot(s){return JSON.stringify([s?.detail?.order?.order_id,s?.detail?.order?.order_status,s?.detail?.order?.payment_status,s?.detail?.order?.fulfillment_type,s?.detail?.order?.shipping_country,s?.detail?.order?.currency,s?.fulfillment?.evidence?.[0]?.evidence_id||0,s?.fulfillment?.evidence?.length||0]);}
function pilotForm(){return{route:route.value,consent_state:el('fpConsent').value,consent_reference:el('fpConsentReference').value,receipt_reference:el('fpReceiptReference').value,carrier:el('fpCarrier').value,tracking_reference:el('fpTracking').value,package_instructions:el('fpPacking').value,review_note:el('fpNote').value,owner_observed:el('fpObserved').checked,case_reference:el('fpCaseReference').value,evidence_source:el('fpEvidenceSource').value,condition_state:el('fpCondition').value,source_hold_receipt_id:el('fpSourceHold').value,closure_reference:el('fpClosureReference').value,closure_disposition:el('fpClosureDisposition').value,closure_observed:el('fpClosureObserved').checked,escalation_source_id:el('fpEscalationSource').value,escalation_level:el('fpEscalationLevel').value,escalation_evidence_reference:el('fpEscalationEvidence').value,followup_state:el('fpFollowupState').value,escalation_observed:el('fpEscalationObserved').checked,audit_source_hold_id:el('fpAuditSource').value,audit_followup_id:el('fpAuditFollowup').value,audit_evidence_reference:el('fpAuditEvidence').value,audit_disposition:el('fpAuditDisposition').value,audit_observed:el('fpAuditObserved').checked,reconcile_audit_id:el('fpReconcileAudit').value,reconcile_evidence_reference:el('fpReconcileEvidence').value,reconcile_disposition:el('fpReconcileDisposition').value,reconcile_observed:el('fpReconcileObserved').checked,outstanding_owner_id:el('fpOutstandingOwner').value,outstanding_evidence_reference:el('fpOutstandingEvidence').value,outstanding_state:el('fpOutstandingState').value,outstanding_observed:el('fpOutstandingObserved').checked};}
function invalidate(){requestKey=null;record.disabled=true;decisionEl.textContent='HOLD — changed inputs require a new local source review.';}
for(const id of ['fpRoute','fpConsent','fpConsentReference','fpReceiptReference','fpCarrier','fpTracking','fpPacking','fpNote','fpObserved','fpCaseReference','fpEvidenceSource','fpCondition','fpSourceHold','fpClosureReference','fpClosureDisposition','fpClosureObserved','fpEscalationSource','fpEscalationLevel','fpEscalationEvidence','fpFollowupState','fpEscalationObserved','fpAuditSource','fpAuditFollowup','fpAuditEvidence','fpAuditDisposition','fpAuditObserved','fpReconcileAudit','fpReconcileEvidence','fpReconcileDisposition','fpReconcileObserved','fpOutstandingOwner','fpOutstandingEvidence','fpOutstandingState','fpOutstandingObserved'])el(id).addEventListener('change',invalidate);
for(const id of ['fpConsentReference','fpReceiptReference','fpCarrier','fpTracking','fpPacking','fpNote','fpCaseReference','fpSourceHold','fpClosureReference','fpEscalationSource','fpEscalationEvidence','fpAuditSource','fpAuditFollowup','fpAuditEvidence','fpReconcileAudit','fpReconcileEvidence','fpOutstandingOwner','fpOutstandingEvidence'])el(id).addEventListener('input',invalidate);
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
function evaluate(){const review=followupOutstanding479({detail:active?.detail,fulfillment:active?.fulfillment,form:pilotForm()});record.disabled=!review.can_append_existing_receipt||posting;
 const list=el('fpHolds');list.replaceChildren();for(const text of review.holds)list.append(make('li','HOLD: '+text));
 decisionEl.textContent=review.can_append_existing_receipt?'READY for an explicit append-only owner receipt. This is not delivery, customer consent or refund verification.':`HOLD — ${review.holds.length} required source/owner checks are incomplete. Nothing submitted.`;
 return review;}
el('fpEvaluate').addEventListener('click',evaluate);
el('fpReview').addEventListener('submit',async e=>{e.preventDefault();if(posting||!active)return;
 const review=evaluate(),form=pilotForm(),id=Number(active.detail.order.order_id);if(!review.can_append_existing_receipt)return;
 posting=true;lockForm(true);receiptEl.textContent='Rechecking original records before append-only submission…';
 try{const fresh=await read(id);if(snapshot(fresh)!==snapshot(active)){active=fresh;render(fresh);invalidate();throw Error('Original order or evidence changed. Review latest records and evaluate again.');}
  const final=followupOutstanding479({detail:fresh.detail,fulfillment:fresh.fulfillment,form});if(!final.can_append_existing_receipt)throw Error('Original source failed final owner checks.');
  requestKey=requestKey||crypto.randomUUID().replaceAll('-','');const payload=form.route==='outstanding_followup'?outstandingPayload479({decision:final,form,orderId:id,requestKey}):form.route==='audit_reconciliation'?reconciliationPayload478({decision:final,form,orderId:id,requestKey}):form.route==='independent_audit'?auditPayload477({decision:final,form,orderId:id,requestKey}):form.route==='escalation_review'?escalationPayload476({decision:final,form,orderId:id,requestKey}):form.route==='closure_review'?closurePayload475({decision:final,form,orderId:id,requestKey}):trialPayload474({decision:final,form,orderId:id,requestKey});if(!payload)throw Error('Unable to construct an original-source evidence receipt.');
  const response=await api('/api/admin/maker-fulfillment-evidence',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid receipt response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  receiptEl.textContent=`Build 454 append-only receipt #${result.receipt_id||'unknown'} ${result.replayed?'replayed safely':'recorded'} against original order #${id}. Route ${form.route}. All real-world acceptance, payment, shipment, exchanges and customer consent remain separately controlled.`;
  requestKey=null;active=await read(id);render(active);el('fpNote').value='';el('fpObserved').checked=false;invalidate();
 }catch(error){receiptEl.textContent='HOLD: '+String(error.message||'Save outcome unknown').slice(0,250)+' If a network response was lost, retry the unchanged form to reconcile the same request key; do not fabricate a new receipt.';}
 finally{posting=false;lockForm(false);record.disabled=!followupOutstanding479({detail:active?.detail,fulfillment:active?.fulfillment,form:pilotForm()}).can_append_existing_receipt;}
});
const fromUrl=Number(new URLSearchParams(location.search).get('order_id'));if(Number.isSafeInteger(fromUrl)&&fromUrl>0)el('fpOrderId').value=String(fromUrl);
/* Build 480 — read-only portfolio summary; no background polls or customer details. */
let portfolio481=null,priorityKey481=null,priorityPosting481=false,handoffKey482=null,handoffPosting482=false,reassessmentKey483=null,reassessmentPosting483=false,decisionKey484=null,decisionPosting484=false,decisionHandoffKey485=null,decisionHandoffPosting485=false,outcomeKey486=null,outcomePosting486=false;
function priorityForm481(){return {order_id:el('fpPriorityOrder').value,source_receipt_id:el('fpPrioritySource').value,
 priority:el('fpPriorityLevel').value,next_action:el('fpPriorityAction').value,evidence_reference:el('fpPriorityEvidence').value,observed:el('fpPriorityObserved').checked};}
for(const id of ['fpPriorityLevel','fpPriorityAction','fpPriorityEvidence','fpPriorityObserved']){
 el(id).addEventListener('change',()=>{priorityKey481=null;el('fpPriorityStatus').textContent='HOLD — recheck selected source and new priority before submitting.';});
}
el('fpPortfolioLoad').addEventListener('click',async()=>{
 const button=el('fpPortfolioLoad');button.disabled=true;el('fpPortfolioStatus').textContent='Reading a bounded sample of original private evidence…';
 portfolio481=null;priorityKey481=null;handoffKey482=null;reassessmentKey483=null;decisionKey484=null;decisionHandoffKey485=null;outcomeKey486=null;el('fpPrioritySubmit').disabled=true;el('fpHandoffSubmit').disabled=true;el('fpReassessmentSubmit').disabled=true;el('fpDecisionSubmit').disabled=true;el('fpDecisionHandoffSubmit').disabled=true;el('fpOutcomeSubmit').disabled=true;el('fpExceptionLedger').textContent='HOLD — refreshing the bounded exception ledger.';
 for(const id of ['fpPortfolioSummary','fpPortfolioTrend','fpPortfolioCases'])el(id).replaceChildren();
 try{
  const response=await api('/api/admin/maker-aftercare-portfolio',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid portfolio response.'}));
  if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  const p=result.portfolio;if(!p||p.bounded_sample!==true||result.read_only!==true)throw Error('Invalid bounded portfolio response.');portfolio481=p;
  el('fpPortfolioStatus').textContent=`Sample only: ${p.sampled_receipts} recent aftercare receipts; ${p.recognized_receipts} Build 479 follow-ups; ${p.priority_annotation_receipts||0} priority annotations; ${p.handoff_receipts||0} independent handoffs; ${p.reassessment_receipts||0} independent reassessments; ${p.decision_receipts||0} owner decisions; ${p.independent_decision_handoff_receipts||0} independent decision handoffs; ${p.outcome_receipts||0} independent owner reconciliations; ${p.unclassified_receipts} other receipts. ${p.history_incomplete?'Older receipts omitted.':'History beyond this sample is not verified.'}`;
  const ledger=el('fpExceptionLedger');ledger.replaceChildren();ledger.append(make('p',`Sample-limited exception ledger: ${p.exception_ledger?.length||0} latest recognized orders. Missing older receipts can make this incomplete; no closure is implied.`));
  const ledgerList=make('ul');for(const row of p.exception_ledger||[]){const age=row.decision_receipt_id?decisionAge485(row.decision_created_at):null;const item=make('li',`Order #${row.order_id} · source #${row.source_receipt_id} · ${String(row.state).replaceAll('_',' ')} · priority ${row.priority} · ${row.recurrence_count_in_sample} Build 479 receipts in sample (not proven repeat incident) · reassessment ${row.reassessment_receipt_id||'not recorded'} · owner decision ${row.owner_decision.replaceAll('_',' ')}${row.decision_receipt_id?` (#${row.decision_receipt_id}; ${age.days===null?'age unknown':`${age.days} days, ${age.band}`} advisory, not SLA)`:''} · independent decision handoff ${row.independent_decision_handoff_receipt_id?`#${row.independent_decision_handoff_receipt_id}`:'not recorded'} · owner evidence reconciliation ${row.outcome_receipt_id?`${row.owner_reconciliation_outcome} (#${row.outcome_receipt_id})`:'not recorded'} · case OPEN (not independently verified)`);ledgerList.append(item);}ledger.append(ledgerList);
  const s=el('fpPortfolioSummary');s.append(make('h3','Latest recognized case finding per order (sample only)'));
  s.append(make('p',`Distinct orders in the sample: ${p.distinct_orders_in_sample}. These are not verified open-case totals.`));
  s.append(make('p',`Orders with two or more Build 479 follow-up receipts in this sample: ${p.orders_with_repeated_followups_in_sample||0}. Repetition of receipts does not establish recurrence of the same incident, missed deadline or ongoing consent.`));
  for(const [state,count] of Object.entries(p.states||{}))s.append(make('p',`${state.replaceAll('_',' ')}: ${count}`));
  const trend=el('fpPortfolioTrend');trend.append(make('h3','Follow-up evidence receipts by UTC month (sample only)'));
  const trendList=make('ul');for(const item of p.trend||[])trendList.append(make('li',`${item.month}: ${item.count} receipts`));trend.append(trendList);
  const cases=el('fpPortfolioCases');cases.append(make('h3','Latest sample cases — original Orders for manual review'));
  const list=make('ul');for(const item of p.cases||[]){const age=item.handoff_receipt_id?handoffAge483(item.handoff_created_at):null;const decisionAge=item.decision_receipt_id?decisionAge485(item.decision_created_at):null;const li=make('li',`Order #${item.order_id}: ${String(item.state).replaceAll('_',' ')} · receipt #${item.evidence_id} · ${item.created_at||'date unknown'} · ${item.recurrence_count_in_sample||1} follow-up receipt(s) in sample · ${item.priority?`Owner priority: ${item.priority.replaceAll('_',' ')} · `:''}${item.handoff_receipt_id?`Independent handoff #${item.handoff_receipt_id} · ${age.days===null?'age unknown':`${age.days} days (${age.band})`} advisory only · `:''}${item.reassessment_receipt_id?`Reassessment #${item.reassessment_receipt_id} (${String(item.reassessment_finding).replaceAll('_',' ')}) · `:''}${item.decision_receipt_id?`Owner decision #${item.decision_receipt_id} (${decisionAge.days===null?'age unknown':`${decisionAge.days} days, ${decisionAge.band}`} advisory) · `:''}${item.independent_decision_handoff_receipt_id?`Independent decision handoff #${item.independent_decision_handoff_receipt_id} · `:''}`);
   const link=make('a','Inspect original order');link.href=`/admin/orders/?order_id=${Number(item.order_id)}`;li.append(link);
   const select=make('button',item.priority_receipt_id?'Priority already recorded':'Select receipt for priority review');select.type='button';select.disabled=Boolean(item.priority_receipt_id);
   select.addEventListener('click',()=>{el('fpPriorityOrder').value=String(item.order_id);el('fpPrioritySource').value=String(item.evidence_id);
    el('fpPriorityObserved').checked=false;priorityKey481=null;el('fpPrioritySubmit').disabled=false;
    el('fpPriorityStatus').textContent=`Selected order #${item.order_id}, Build 479 receipt #${item.evidence_id}. Review the original order and complete owner attestation.`;});
   li.append(select);
   if(item.priority_receipt_id){const handoff=make('button',item.handoff_receipt_id?'Handoff already recorded':'Select priority for independent handoff');handoff.type='button';handoff.disabled=Boolean(item.handoff_receipt_id);
    handoff.addEventListener('click',()=>{el('fpHandoffOrder').value=String(item.order_id);el('fpHandoffSource').value=String(item.evidence_id);el('fpHandoffPriorityReceipt').value=String(item.priority_receipt_id);
     el('fpHandoffObserved').checked=false;handoffKey482=null;el('fpHandoffSubmit').disabled=false;
     el('fpHandoffStatus').textContent=`Selected order #${item.order_id}, source #${item.evidence_id}, priority #${item.priority_receipt_id}. A different Admin must inspect original evidence before receiving this handoff.`;});li.append(handoff);}
   if(item.handoff_receipt_id){const reassess=make('button',item.reassessment_receipt_id?'Reassessment already recorded':'Select handoff for independent reassessment');reassess.type='button';reassess.disabled=Boolean(item.reassessment_receipt_id);
    reassess.addEventListener('click',()=>{el('fpReassessmentOrder').value=String(item.order_id);el('fpReassessmentSource').value=String(item.evidence_id);el('fpReassessmentPriority').value=String(item.priority_receipt_id);el('fpReassessmentHandoff').value=String(item.handoff_receipt_id);
     el('fpReassessmentObserved').checked=false;reassessmentKey483=null;el('fpReassessmentSubmit').disabled=false;
     el('fpReassessmentStatus').textContent=`Selected handoff #${item.handoff_receipt_id}; advisory age ${age.days===null?'unknown':`${age.days} days, ${age.band}`}. A different authenticated Admin must inspect original evidence.`;});li.append(reassess);}
   if(item.reassessment_receipt_id){const choose=make('button',item.decision_receipt_id?'Owner decision already recorded':'Select reassessment for owner decision');choose.type='button';choose.disabled=Boolean(item.decision_receipt_id);
    choose.addEventListener('click',()=>{el('fpDecisionOrder').value=String(item.order_id);el('fpDecisionSource').value=String(item.evidence_id);el('fpDecisionPriority').value=String(item.priority_receipt_id);el('fpDecisionHandoff').value=String(item.handoff_receipt_id);el('fpDecisionReassessment').value=String(item.reassessment_receipt_id);
     el('fpDecisionObserved').checked=false;decisionKey484=null;el('fpDecisionSubmit').disabled=false;
     el('fpDecisionStatus').textContent=`Selected reassessment #${item.reassessment_receipt_id}. A different authenticated Admin must independently inspect the actual original order and receipts before deciding.`;});li.append(choose);}
   if(item.decision_receipt_id){const choose=make('button',item.independent_decision_handoff_receipt_id?'Independent decision handoff already recorded':'Select decision for independent handoff');choose.type='button';choose.disabled=Boolean(item.independent_decision_handoff_receipt_id);
    choose.addEventListener('click',()=>{for(const [target,value] of [['fpDecisionHandoffOrder',item.order_id],['fpDecisionHandoffSource',item.evidence_id],['fpDecisionHandoffPriority',item.priority_receipt_id],['fpDecisionHandoffOriginal',item.handoff_receipt_id],['fpDecisionHandoffReassessment',item.reassessment_receipt_id],['fpDecisionHandoffDecision',item.decision_receipt_id]])el(target).value=String(value);
     el('fpDecisionHandoffObserved').checked=false;decisionHandoffKey485=null;el('fpDecisionHandoffSubmit').disabled=false;el('fpDecisionHandoffStatus').textContent=`Selected Build 484 decision #${item.decision_receipt_id}. A different receiving Admin must inspect all original evidence.`;});li.append(choose);}
   if(item.independent_decision_handoff_receipt_id){const choose=make('button',item.outcome_receipt_id?'Outcome already reconciled':'Select independent handoff for outcome');choose.type='button';choose.disabled=Boolean(item.outcome_receipt_id);
    choose.addEventListener('click',()=>{for(const [target,value] of [['fpOutcomeOrder',item.order_id],['fpOutcomeSource',item.evidence_id],['fpOutcomePriority',item.priority_receipt_id],['fpOutcomeHandoff',item.handoff_receipt_id],['fpOutcomeReassessment',item.reassessment_receipt_id],['fpOutcomeDecision',item.decision_receipt_id],['fpOutcomeIndependent',item.independent_decision_handoff_receipt_id]])el(target).value=String(value);
     el('fpOutcomeObserved').checked=false;outcomeKey486=null;el('fpOutcomeSubmit').disabled=false;el('fpOutcomeStatus').textContent=`Selected Build 485 receipt #${item.independent_decision_handoff_receipt_id}; a different Admin must independently reconcile original evidence.`;});li.append(choose);}
   list.append(li);}cases.append(list);
 }catch(error){el('fpPortfolioStatus').textContent='HOLD — '+String(error.message||'Evidence unavailable').slice(0,180);el('fpExceptionLedger').textContent='HOLD — sampled owner exception ledger unavailable.';}
 finally{button.disabled=false;}
});
function reassessmentForm483(){return {order_id:el('fpReassessmentOrder').value,source_receipt_id:el('fpReassessmentSource').value,priority_receipt_id:el('fpReassessmentPriority').value,handoff_receipt_id:el('fpReassessmentHandoff').value,
 finding:el('fpReassessmentFinding').value,evidence_reference:el('fpReassessmentEvidence').value,observed:el('fpReassessmentObserved').checked};}
for(const id of ['fpReassessmentFinding','fpReassessmentEvidence','fpReassessmentObserved']){
 for(const eventName of ['change','input'])el(id).addEventListener(eventName,()=>{reassessmentKey483=null;el('fpReassessmentStatus').textContent='HOLD — recheck the selected handoff and original evidence before submitting.';});
}
el('fpReassessmentForm').addEventListener('submit',async e=>{
 e.preventDefault();if(reassessmentPosting483)return;
 const form=reassessmentForm483(),decision=assessReassessment483({form,portfolio:portfolio481});
 if(!decision.ready){el('fpReassessmentStatus').textContent='HOLD — '+decision.holds.join(' ');return;}
 reassessmentPosting483=true;el('fpReassessmentSubmit').disabled=true;
 try{
  reassessmentKey483=reassessmentKey483||crypto.randomUUID().replaceAll('-','');
  const payload=reassessmentPayload483({decision,form,requestKey:reassessmentKey483});if(!payload)throw Error('Original handoff reassessment not ready.');
  const response=await api('/api/admin/maker-aftercare-reassessment',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid reassessment response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  el('fpReassessmentStatus').textContent=`Independent reassessment receipt #${result.receipt_id} ${result.replayed?'replayed':'recorded'} for order #${decision.order_id}. The case stays open and no external action occurred; reload the sample for updated evidence.`;
  reassessmentKey483=null;portfolio481=null;
 }catch(error){el('fpReassessmentStatus').textContent='HOLD — '+String(error.message||'Reassessment response unknown').slice(0,200)+' Retry unchanged fields to preserve the original request key.';el('fpReassessmentSubmit').disabled=false;}
 finally{reassessmentPosting483=false;}
});
function handoffForm482(){return {order_id:el('fpHandoffOrder').value,source_receipt_id:el('fpHandoffSource').value,priority_receipt_id:el('fpHandoffPriorityReceipt').value,
 disposition:el('fpHandoffDisposition').value,evidence_reference:el('fpHandoffEvidence').value,observed:el('fpHandoffObserved').checked};}
for(const id of ['fpHandoffDisposition','fpHandoffEvidence','fpHandoffObserved']){
 for(const eventName of ['change','input'])el(id).addEventListener(eventName,()=>{handoffKey482=null;el('fpHandoffStatus').textContent='HOLD — verify original priority and independent receiving review before submission.';});
}
el('fpHandoffForm').addEventListener('submit',async e=>{
 e.preventDefault();if(handoffPosting482)return;
 const form=handoffForm482(),decision=assessHandoff482({form,portfolio:portfolio481});
 if(!decision.ready){el('fpHandoffStatus').textContent='HOLD — '+decision.holds.join(' ');return;}
 handoffPosting482=true;el('fpHandoffSubmit').disabled=true;
 try{
  handoffKey482=handoffKey482||crypto.randomUUID().replaceAll('-','');
  const payload=handoffPayload482({decision,form,requestKey:handoffKey482});if(!payload)throw Error('Handoff source check failed.');
  const response=await api('/api/admin/maker-aftercare-handoff',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid handoff receipt response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  el('fpHandoffStatus').textContent=`Independent handoff receipt #${result.receipt_id} ${result.replayed?'replayed':'recorded'} for order #${decision.order_id}. Case remains open. No customer contact or external action; reload portfolio to see updated evidence.`;
  handoffKey482=null;portfolio481=null;
 }catch(error){el('fpHandoffStatus').textContent='HOLD — '+String(error.message||'Unknown handoff response').slice(0,200)+' Retry unchanged fields with the original request key.';el('fpHandoffSubmit').disabled=false;}
 finally{handoffPosting482=false;}
});
function decisionForm484(){return {order_id:el('fpDecisionOrder').value,source_receipt_id:el('fpDecisionSource').value,priority_receipt_id:el('fpDecisionPriority').value,handoff_receipt_id:el('fpDecisionHandoff').value,reassessment_receipt_id:el('fpDecisionReassessment').value,
 decision:el('fpDecisionChoice').value,evidence_reference:el('fpDecisionEvidence').value,observed:el('fpDecisionObserved').checked};}
for(const id of ['fpDecisionChoice','fpDecisionEvidence','fpDecisionObserved']){
 for(const eventName of ['change','input'])el(id).addEventListener(eventName,()=>{decisionKey484=null;el('fpDecisionStatus').textContent='HOLD — recheck the actual independent reassessment and evidence before submitting.';});
}
el('fpDecisionForm').addEventListener('submit',async e=>{
 e.preventDefault();if(decisionPosting484)return;
 const form=decisionForm484(),decision=assessDecision484({form,portfolio:portfolio481});
 if(!decision.ready){el('fpDecisionStatus').textContent='HOLD — '+decision.holds.join(' ');return;}
 decisionPosting484=true;el('fpDecisionSubmit').disabled=true;
 try{
  decisionKey484=decisionKey484||crypto.randomUUID().replaceAll('-','');
  const payload=decisionPayload484({decision,form,requestKey:decisionKey484});if(!payload)throw Error('Original reassessment owner decision not ready.');
  const response=await api('/api/admin/maker-aftercare-decision',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid owner decision response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  el('fpDecisionStatus').textContent=`Append-only owner decision #${result.receipt_id} ${result.replayed?'replayed':'recorded'} for order #${decision.order_id}. Case remains open; no external action was performed. Reload the portfolio to see the updated exception ledger.`;
  decisionKey484=null;portfolio481=null;el('fpExceptionLedger').textContent='HOLD — owner decision just recorded; reload bounded portfolio to reconcile ledger.';
 }catch(error){el('fpDecisionStatus').textContent='HOLD — '+String(error.message||'Decision response unknown').slice(0,200)+' Retry unchanged fields to preserve the original request key.';el('fpDecisionSubmit').disabled=false;}
 finally{decisionPosting484=false;}
});
function decisionHandoffForm485(){return {order_id:el('fpDecisionHandoffOrder').value,source_receipt_id:el('fpDecisionHandoffSource').value,priority_receipt_id:el('fpDecisionHandoffPriority').value,handoff_receipt_id:el('fpDecisionHandoffOriginal').value,reassessment_receipt_id:el('fpDecisionHandoffReassessment').value,decision_receipt_id:el('fpDecisionHandoffDecision').value,
 disposition:el('fpDecisionHandoffDisposition').value,evidence_reference:el('fpDecisionHandoffEvidence').value,observed:el('fpDecisionHandoffObserved').checked};}
for(const id of ['fpDecisionHandoffDisposition','fpDecisionHandoffEvidence','fpDecisionHandoffObserved'])for(const eventName of ['change','input'])el(id).addEventListener(eventName,()=>{decisionHandoffKey485=null;el('fpDecisionHandoffStatus').textContent='HOLD — independently recheck original decision evidence before submitting.';});
el('fpDecisionHandoffForm').addEventListener('submit',async e=>{
 e.preventDefault();if(decisionHandoffPosting485)return;
 const form=decisionHandoffForm485(),assessment=assessDecisionHandoff485({form,portfolio:portfolio481});
 if(!assessment.ready){el('fpDecisionHandoffStatus').textContent='HOLD — '+assessment.holds.join(' ');return;}
 decisionHandoffPosting485=true;el('fpDecisionHandoffSubmit').disabled=true;
 try{
  decisionHandoffKey485=decisionHandoffKey485||crypto.randomUUID().replaceAll('-','');
  const payload=decisionHandoffPayload485({assessment,form,requestKey:decisionHandoffKey485});if(!payload)throw Error('Original decision handoff not ready.');
  const response=await api('/api/admin/maker-aftercare-decision-handoff',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid independent receipt response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  el('fpDecisionHandoffStatus').textContent=`Append-only independent decision handoff #${result.receipt_id} ${result.replayed?'replayed':'recorded'} for order #${assessment.order_id}. Case remains open; no external action. Reload the sample for an updated ledger.`;
  decisionHandoffKey485=null;portfolio481=null;el('fpExceptionLedger').textContent='HOLD — independent handoff recorded; reload sampled ledger.';
 }catch(error){el('fpDecisionHandoffStatus').textContent='HOLD — '+String(error.message||'Unknown independent receipt response').slice(0,200)+' Retry unchanged fields to preserve request key.';el('fpDecisionHandoffSubmit').disabled=false;}
 finally{decisionHandoffPosting485=false;}
});
function outcomeForm486(){return {order_id:el('fpOutcomeOrder').value,source_receipt_id:el('fpOutcomeSource').value,priority_receipt_id:el('fpOutcomePriority').value,handoff_receipt_id:el('fpOutcomeHandoff').value,reassessment_receipt_id:el('fpOutcomeReassessment').value,decision_receipt_id:el('fpOutcomeDecision').value,independent_decision_handoff_receipt_id:el('fpOutcomeIndependent').value,outcome:el('fpOutcomeChoice').value,evidence_reference:el('fpOutcomeEvidence').value,observed:el('fpOutcomeObserved').checked};}
for(const id of ['fpOutcomeChoice','fpOutcomeEvidence','fpOutcomeObserved'])for(const eventName of ['change','input'])el(id).addEventListener(eventName,()=>{outcomeKey486=null;el('fpOutcomeStatus').textContent='HOLD — recheck independent source evidence before submitting.';});
el('fpOutcomeForm').addEventListener('submit',async e=>{
 e.preventDefault();if(outcomePosting486)return;
 const form=outcomeForm486(),assessment=assessOutcome486({form,portfolio:portfolio481});if(!assessment.ready){el('fpOutcomeStatus').textContent='HOLD — '+assessment.holds.join(' ');return;}
 outcomePosting486=true;el('fpOutcomeSubmit').disabled=true;
 try{outcomeKey486=outcomeKey486||crypto.randomUUID().replaceAll('-','');const payload=outcomePayload486({assessment,form,requestKey:outcomeKey486});if(!payload)throw Error('Reconciliation payload not ready.');
  const response=await api('/api/admin/maker-aftercare-handoff-outcome',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Unreadable receipt response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  el('fpOutcomeStatus').textContent=`Independent outcome receipt #${result.receipt_id} ${result.replayed?'replayed':'recorded'} for order #${assessment.order_id}. Case remains open and no external action was performed. Reload sampled ledger.`;
  outcomeKey486=null;portfolio481=null;el('fpExceptionLedger').textContent='HOLD — owner reconciliation just recorded; reload bounded portfolio.';
 }catch(error){el('fpOutcomeStatus').textContent='HOLD — '+String(error.message||'Outcome unknown').slice(0,180)+' Retry unchanged fields with original key only.';el('fpOutcomeSubmit').disabled=false;}finally{outcomePosting486=false;}
});
el('fpPriorityForm').addEventListener('submit',async e=>{
 e.preventDefault();if(priorityPosting481)return;
 const form=priorityForm481(),decision=assessPriority481({form,portfolio:portfolio481});
 if(!decision.ready){el('fpPriorityStatus').textContent='HOLD — '+decision.holds.join(' ');return;}
 priorityPosting481=true;el('fpPrioritySubmit').disabled=true;
 try{
  priorityKey481=priorityKey481||crypto.randomUUID().replaceAll('-','');
  const payload=priorityPayload481({decision,form,requestKey:priorityKey481});if(!payload)throw Error('Original evidence annotation not ready.');
  const response=await api('/api/admin/maker-aftercare-priority',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({ok:false,error:'Invalid annotation response.'}));if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  el('fpPriorityStatus').textContent=`Append-only priority receipt #${result.receipt_id} ${result.replayed?'replayed':'recorded'} for order #${decision.order_id}. The case remains open; nothing was sent or booked. Reload portfolio to see the new priority.`;
  priorityKey481=null;portfolio481=null;
 }catch(error){el('fpPriorityStatus').textContent='HOLD — '+String(error.message||'Receipt response unknown').slice(0,200)+' Retry unchanged fields to safely reuse the same request key.';
  el('fpPrioritySubmit').disabled=false;}
 finally{priorityPosting481=false;}
});
