import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessPriority481,priorityPayload481} from '../public/js/maker-aftercare-priority-policy-481.mjs';
import {summarizeAftercarePortfolio480} from '../public/js/maker-aftercare-portfolio-policy-480.mjs';
const sourceNote='Build 479 outstanding review; owner #34; audit #33; source hold #31; follow-up #32; case=sample-case-481; evidence=original-reference-481; state=awaiting_owner_action; case remains open, no external action.';
const source={evidence_id:401,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-12 13:00:00',review_note:sourceNote};
const portfolio=()=>summarizeAftercarePortfolio480([source]);
const form=()=>({order_id:81,source_receipt_id:401,priority:'urgent_manual_review',next_action:'collect_missing_evidence',evidence_reference:'owner-review-evidence-481',observed:true});
test('Build 481 permits source-linked owner priority receipt, never a case closure',()=>{
 const d=assessPriority481({form:form(),portfolio:portfolio()});assert.equal(d.ready,true);
 const body=priorityPayload481({decision:d,form:form(),requestKey:'abcdef0123456789abcdef'});
 assert.equal(body.source_receipt_id,401);assert.equal(body.priority,'urgent_manual_review');assert.equal(body.owner_observed,true);
 for(const flag of ['case_closed','external_action','customer_message','refund_authorized'])assert.equal(d[flag],false);
});
test('Build 481 fails closed for nonexistent source, malformed evidence, unsupported priority and absent attestation',()=>{
 for(const change of [{order_id:80},{source_receipt_id:402},{priority:'case_closed'},{next_action:'refund'},{evidence_reference:'short'},{observed:false}])
  assert.equal(assessPriority481({form:{...form(),...change},portfolio:portfolio()}).ready,false);
 assert.equal(assessPriority481({form:form(),portfolio:null}).ready,false);
 assert.equal(priorityPayload481({decision:{ready:false},form:form(),requestKey:'abcdef0123456789abcdef'}),null);
});
test('Build 481 annotations enrich sampled cases without changing Build 479 trend or leaking references',()=>{
 const annotation={evidence_id:402,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 13:00:00',review_note:'Build 481 priority review; source follow-up #401; priority=urgent_manual_review; next=collect_missing_evidence; evidence=owner-review-evidence-481; owner observed; case remains open; no customer action.'};
 const p=summarizeAftercarePortfolio480([annotation,source]);
 assert.equal(p.recognized_receipts,1);assert.equal(p.priority_annotation_receipts,1);assert.equal(p.priority_annotations_in_sample,1);
 assert.deepEqual(p.trend,[{month:'2026-10',count:1}]);
 assert.equal(p.cases[0].priority,'urgent_manual_review');assert.equal(p.cases[0].priority_receipt_id,402);
 assert.equal(assessPriority481({form:form(),portfolio:p}).ready,false);
 assert.equal(JSON.stringify(p).includes('owner-review-evidence-481'),false);
});
test('Build 481 protected endpoint and Admin form enforce unique, private, append-only manual reviews',()=>{
 const api=readFileSync(new URL('../functions/api/admin/maker-aftercare-priority.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const id of ['fpPriorityForm','fpPriorityOrder','fpPrioritySource','fpPriorityLevel','fpPriorityAction','fpPriorityEvidence','fpPriorityObserved','fpPrioritySubmit','fpPriorityStatus'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b48[12]/);assert.match(ui,/assessPriority481/);assert.match(ui,/priorityPayload481/);
 assert.match(api,/getAdminUserFromRequest/);assert.match(api,/Same-origin request required/);
 assert.match(api,/PRIORITY_SOURCE_HOLD/);assert.match(api,/PRIORITY_ALREADY_RECORDED/);
 assert.match(api,/WHERE NOT EXISTS/);assert.match(api,/request_key/);
 assert.doesNotMatch(api,/customer_email|shipping_address|customer_phone|UPDATE orders|DELETE FROM maker_order_fulfillment_evidence/);
});
