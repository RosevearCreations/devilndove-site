import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {followupOutstanding479,outstandingPayload479} from '../public/js/maker-aftercare-outstanding-case-policy-479.mjs';
const order={order_id:479,order_number:'DN-479',order_status:'processing',payment_status:'paid',fulfillment_type:'shipping',shipping_country:'CA',currency:'CAD'};
const evidence=[
 {evidence_id:31,event_kind:'damage_hold',actor_user_id:11,review_note:'Trial II case ref=source-case-479; evidence source=owner_inspection; condition=observed_damage;'},
 {evidence_id:32,event_kind:'aftercare_followup',actor_user_id:12,review_note:'Build 476 escalation review; source hold #31; case=source-case-479;'},
 {evidence_id:33,event_kind:'aftercare_followup',actor_user_id:13,review_note:'Build 477 independent audit; source hold #31; follow-up #32; case=source-case-479;'},
 {evidence_id:34,event_kind:'aftercare_followup',actor_user_id:14,review_note:'Build 478 owner reconciliation; audit #33; source hold #31; follow-up #32; case=source-case-479;'}
];
const sources=(actor=15,rows=evidence)=>({detail:{ok:true,order:{...order},diagnostics:{warnings:[]}},fulfillment:{ok:true,order:{...order},evidence:rows,reviewer_actor_id:actor,history_truncated:false}});
const form=()=>({route:'outstanding_followup',owner_observed:true,review_note:'Independent owner follow-up inspected the outstanding exception evidence.',consent_state:'verified',consent_reference:'original-consent-reference-479',case_reference:'source-case-479',audit_source_hold_id:31,audit_followup_id:32,reconcile_audit_id:33,outstanding_owner_id:34,outstanding_evidence_reference:'actual-case-evidence-479',outstanding_state:'awaiting_owner_action',outstanding_observed:true});
test('Build 479 explicitly reconciles four original records without closing a case',()=>{
 const review=followupOutstanding479({...sources(),form:form()});assert.equal(review.can_append_existing_receipt,true);
 const payload=outstandingPayload479({decision:review,form:form(),orderId:479,requestKey:'abcdef0123456789abcdef'});
 assert.equal(payload.outstanding_mode,'aftercare_followup_479');assert.equal(payload.outstanding_owner_id,34);
 assert.match(payload.review_note,/Build 479 outstanding review; owner #34; audit #33; source hold #31; follow-up #32; case=source-case-479;/);
 for(const flag of ['case_closed','refund_authorized','customer_message','external_action'])assert.equal(review[flag],false);
});
test('Build 479 holds absent, wrong, duplicated or self-attested evidence',()=>{
 for(const change of [{outstanding_owner_id:999},{outstanding_owner_id:33},{reconcile_audit_id:999},{case_reference:'wrong-case-479'},{outstanding_evidence_reference:'short'},{outstanding_state:'closed'},{outstanding_observed:false}])
  assert.equal(followupOutstanding479({...sources(),form:{...form(),...change}}).can_append_existing_receipt,false);
 assert.equal(followupOutstanding479({...sources(14),form:form()}).can_append_existing_receipt,false);
 assert.equal(followupOutstanding479({...sources(15,evidence.slice(0,3)),form:form()}).can_append_existing_receipt,false);
 const duplicate={evidence_id:35,event_kind:'aftercare_followup',actor_user_id:15,review_note:'Build 479 outstanding review; owner #34; audit #33; source hold #31; follow-up #32; case=source-case-479;'};
 assert.equal(followupOutstanding479({...sources(15,[...evidence,duplicate]),form:form()}).can_append_existing_receipt,false);
 const incomplete=sources();incomplete.fulfillment.history_truncated=true;
 assert.equal(followupOutstanding479({...incomplete,form:form()}).can_append_existing_receipt,false);
});
test('Build 479 UI and server enforce original source and owner review, preserving manual operations',()=>{
 const server=readFileSync(new URL('../functions/api/admin/maker-fulfillment-evidence.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const id of ['fpOutstandingOwner','fpOutstandingEvidence','fpOutstandingState','fpOutstandingObserved'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b(479|480)/);assert.match(ui,/outstandingPayload479/);
 assert.match(server,/OUTSTANDING_CASE_SOURCE_HOLD/);assert.match(server,/OUTSTANDING_FOLLOWUP_ALREADY_RECORDED/);
 assert.match(server,/positive\(owner.actor_user_id\)===actor/);
 assert.doesNotMatch(ui,/\/api\/admin\/update-order-status|\/api\/admin\/order-payments|\/api\/admin\/order-fulfillment-workflow/);
});
