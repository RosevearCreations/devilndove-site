import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditAftercare477,auditPayload477} from '../public/js/maker-aftercare-independent-audit-policy-477.mjs';

const order={order_id:477,order_number:'DN-477',order_status:'processing',payment_status:'paid',fulfillment_type:'shipping',shipping_country:'CA',currency:'CAD'};
const evidence=[
 {evidence_id:31,event_kind:'damage_hold',actor_user_id:11,created_at:'2026-10-01 00:00:00',review_note:'Trial II case ref=source-case-477; evidence source=owner_inspection; condition=observed_damage;'},
 {evidence_id:32,event_kind:'aftercare_followup',actor_user_id:12,created_at:'2026-10-15 00:00:00',review_note:'Build 476 escalation review; source hold #31; case=source-case-477; owner level=priority;'}
];
const sources=(reviewer=13,items=evidence)=>({detail:{ok:true,order:{...order},diagnostics:{warnings:[]}},fulfillment:{ok:true,order:{...order},evidence:items,reviewer_actor_id:reviewer,history_truncated:false}});
const form=()=>({route:'independent_audit',owner_observed:true,review_note:'Independent reviewer checked the original HOLD and follow-up evidence.',consent_state:'verified',consent_reference:'original-consent-reference-477',case_reference:'source-case-477',audit_source_hold_id:31,audit_followup_id:32,audit_evidence_reference:'independent-case-check-477',audit_disposition:'independent_review_complete',audit_observed:true});
test('Build 477 requires a third authenticated actor and exact linked original evidence',()=>{
 const d=auditAftercare477({...sources(),form:form()});
 assert.equal(d.can_append_existing_receipt,true);
 assert.equal(d.independent_actor_checked,true);
 const payload=auditPayload477({decision:d,form:form(),orderId:477,requestKey:'abcdef0123456789abcdef'});
 assert.equal(payload.audit_mode,'independent_aftercare_477');
 assert.equal(payload.audit_source_hold_id,31);assert.equal(payload.audit_followup_id,32);
 assert.equal(payload.event_kind,'aftercare_followup');
 assert.match(payload.review_note,/Build 477 independent audit; source hold #31; follow-up #32; case=source-case-477;/);
 for(const flag of ['case_closed','refund_authorized','customer_message','external_action'])assert.equal(d[flag],false);
 for(const reviewer of [0,11,12])assert.equal(auditAftercare477({...sources(reviewer),form:form()}).can_append_existing_receipt,false);
});
test('Independent review HOLDs absent, inconsistent, duplicate and unaudited sources',()=>{
 for(const change of [{audit_source_hold_id:999},{audit_followup_id:999},{case_reference:'different-case-477'},{audit_evidence_reference:'short'},{audit_disposition:'case_closed'},{audit_observed:false}])
  assert.equal(auditAftercare477({...sources(),form:{...form(),...change}}).can_append_existing_receipt,false);
 assert.equal(auditAftercare477({...sources(13,[evidence[0]]),form:form()}).can_append_existing_receipt,false);
 const duplicate={evidence_id:33,event_kind:'aftercare_followup',actor_user_id:13,review_note:'Build 477 independent audit; source hold #31; follow-up #32; case=source-case-477;'};
 assert.equal(auditAftercare477({...sources(14,[...evidence,duplicate]),form:form()}).can_append_existing_receipt,false);
 const truncated=sources();truncated.fulfillment.history_truncated=true;
 assert.equal(auditAftercare477({...truncated,form:form()}).can_append_existing_receipt,false);
});
test('Build 477 server validates current actor and original case linkage before append-only audit',()=>{
 const server=readFileSync(new URL('../functions/api/admin/maker-fulfillment-evidence.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const id of ['fpAuditSource','fpAuditFollowup','fpAuditEvidence','fpAuditDisposition','fpAuditObserved'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b(47[89]|48[012345])/);assert.match(ui,/auditAftercare477/);assert.match(ui,/auditPayload477/);
 assert.match(server,/reviewer_actor_id:positive\(a\.admin\.user_id\)/);
 assert.match(server,/INDEPENDENT_AUDIT_HOLD/);assert.match(server,/AUDIT_ALREADY_RECORDED/);
 assert.match(server,/x>0&&x!==actor/);assert.match(server,/audit_mode==='independent_aftercare_477'/);
 assert.doesNotMatch(ui,/\/api\/admin\/update-order-status|\/api\/admin\/order-payments|\/api\/admin\/order-fulfillment-workflow/);
});
