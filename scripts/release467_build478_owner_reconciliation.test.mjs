import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileAudit478,reconciliationPayload478} from '../public/js/maker-aftercare-owner-reconciliation-policy-478.mjs';
const order={order_id:478,order_number:'DN-478',order_status:'processing',payment_status:'paid',fulfillment_type:'shipping',shipping_country:'CA',currency:'CAD'};
const receipts=[
 {evidence_id:31,event_kind:'damage_hold',actor_user_id:11,review_note:'Trial II case ref=source-case-478; evidence source=owner_inspection; condition=observed_damage;'},
 {evidence_id:32,event_kind:'aftercare_followup',actor_user_id:12,review_note:'Build 476 escalation review; source hold #31; case=source-case-478;'},
 {evidence_id:33,event_kind:'aftercare_followup',actor_user_id:13,review_note:'Build 477 independent audit; source hold #31; follow-up #32; case=source-case-478; evidence=independent-audit-478;'}
];
const sources=(reviewer=14,items=receipts)=>({detail:{ok:true,order:{...order},diagnostics:{warnings:[]}},fulfillment:{ok:true,order:{...order},evidence:items,reviewer_actor_id:reviewer,history_truncated:false}});
const form=()=>({route:'audit_reconciliation',owner_observed:true,review_note:'Owner read the original exception and the independent audit receipt.',consent_state:'verified',consent_reference:'original-consent-reference-478',case_reference:'source-case-478',audit_source_hold_id:31,audit_followup_id:32,reconcile_audit_id:33,reconcile_evidence_reference:'owner-evidence-478',reconcile_disposition:'owner_followup_needed',reconcile_observed:true});
test('Build 478 accepts only source-linked manual owner audit reconciliation',()=>{
 const review=reconcileAudit478({...sources(),form:form()});assert.equal(review.can_append_existing_receipt,true);
 const payload=reconciliationPayload478({decision:review,form:form(),orderId:478,requestKey:'abcdef0123456789abcdef'});
 assert.equal(payload.reconciliation_mode,'owner_aftercare_478');assert.equal(payload.reconcile_audit_id,33);
 assert.match(payload.review_note,/Build 478 owner reconciliation; audit #33; source hold #31; follow-up #32; case=source-case-478;/);
 for(const key of ['case_closed','refund_authorized','customer_message','external_action'])assert.equal(review[key],false);
});
test('Build 478 HOLDs missing audit, mismatched case, self-review, duplicates and truncated history',()=>{
 for(const change of [{reconcile_audit_id:999},{audit_source_hold_id:999},{case_reference:'wrong-case-478'},{reconcile_evidence_reference:'short'},{reconcile_disposition:'closed'},{reconcile_observed:false}])
  assert.equal(reconcileAudit478({...sources(),form:{...form(),...change}}).can_append_existing_receipt,false);
 assert.equal(reconcileAudit478({...sources(13),form:form()}).can_append_existing_receipt,false);
 assert.equal(reconcileAudit478({...sources(14,receipts.slice(0,2)),form:form()}).can_append_existing_receipt,false);
 const duplicate={evidence_id:34,event_kind:'aftercare_followup',actor_user_id:14,review_note:'Build 478 owner reconciliation; audit #33; source hold #31; follow-up #32; case=source-case-478;'};
 assert.equal(reconcileAudit478({...sources(14,[...receipts,duplicate]),form:form()}).can_append_existing_receipt,false);
 const truncated=sources();truncated.fulfillment.history_truncated=true;
 assert.equal(reconcileAudit478({...truncated,form:form()}).can_append_existing_receipt,false);
});
test('Build 478 server and page demand protected owner audit evidence',()=>{
 const server=readFileSync(new URL('../functions/api/admin/maker-fulfillment-evidence.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const id of ['fpReconcileAudit','fpReconcileEvidence','fpReconcileDisposition','fpReconcileObserved'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b(47[89]|48[01])/);assert.match(ui,/reconciliationPayload478/);
 assert.match(server,/OWNER_RECONCILIATION_HOLD/);assert.match(server,/OWNER_RECONCILIATION_ALREADY_RECORDED/);
 assert.match(server,/positive\(audit\.actor_user_id\)===actor/);
 assert.doesNotMatch(ui,/\/api\/admin\/update-order-status|\/api\/admin\/order-payments|\/api\/admin\/order-fulfillment-workflow/);
});
