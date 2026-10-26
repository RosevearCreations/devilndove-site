import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeAftercarePortfolio480} from '../public/js/maker-aftercare-portfolio-policy-480.mjs';
import {assessHandoff482,handoffPayload482} from '../public/js/maker-aftercare-handoff-policy-482.mjs';
const source=(id=401)=>({evidence_id:id,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 12:00:00',review_note:'Build 479 outstanding review; owner #90; audit #89; source hold #82; follow-up #84; case=case-private-reference-81; evidence=original-source-evidence-81; state=awaiting_owner_action; case remains open, no external action.'});
const priority={evidence_id:402,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 13:00:00',review_note:'Build 481 priority review; source follow-up #401; priority=urgent_manual_review; next=collect_missing_evidence; evidence=owner-review-evidence-481; owner observed; case remains open; no customer action.'};
const handoff={evidence_id:403,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 14:00:00',review_note:'Build 482 owner handoff; source follow-up #401; priority receipt #402; disposition=accepted_for_manual_review; evidence=receiving-owner-evidence-482; receiver independently verified; case remains open; no external action.'};
const form=()=>({order_id:81,source_receipt_id:401,priority_receipt_id:402,disposition:'accepted_for_manual_review',evidence_reference:'receiving-owner-evidence-482',observed:true});
test('Build 482 sources independent manual handoff from Build 481 priority, without case closure',()=>{
 const p=summarizeAftercarePortfolio480([priority,source()]);const d=assessHandoff482({portfolio:p,form:form()});assert.equal(d.ready,true);
 const payload=handoffPayload482({decision:d,form:form(),requestKey:'independenthandoff482key'});
 assert.deepEqual([payload.order_id,payload.source_receipt_id,payload.priority_receipt_id],[81,401,402]);
 assert.equal(d.case_closed,false);assert.equal(d.external_action,false);
});
test('Build 482 refuses missing priority, second handoff, bad evidence, no observation or invalid status',()=>{
 const p=summarizeAftercarePortfolio480([priority,source()]);
 for(const changed of [{priority_receipt_id:999},{disposition:'closed'},{evidence_reference:'bad'},{observed:false}])
  assert.equal(assessHandoff482({portfolio:p,form:{...form(),...changed}}).ready,false);
 assert.equal(assessHandoff482({portfolio:null,form:form()}).ready,false);
 const done=summarizeAftercarePortfolio480([handoff,priority,source()]);assert.equal(done.cases[0].handoff_receipt_id,403);
 assert.equal(assessHandoff482({portfolio:done,form:form()}).ready,false);
});
test('Build 482 portfolio recurrence is bounded and ignores handoff and priority receipts',()=>{
 const p=summarizeAftercarePortfolio480([handoff,priority,source(405),source()]);
 assert.equal(p.recognized_receipts,2);assert.equal(p.priority_annotation_receipts,1);assert.equal(p.handoff_receipts,1);
 assert.equal(p.orders_with_repeated_followups_in_sample,1);assert.equal(p.cases[0].recurrence_count_in_sample,2);
 assert.equal(p.case_closure_verified,false);assert.equal(p.customer_consent_verified,false);
 const original=summarizeAftercarePortfolio480([handoff,priority,source()]);
 assert.equal(original.cases[0].handoff_receipt_id,403);assert.equal(original.cases[0].handoff_disposition,'accepted_for_manual_review');
});
test('Build 482 endpoint requires different authenticated reviewer, source proof and atomic idempotent guard',()=>{
 const server=readFileSync(new URL('../functions/api/admin/maker-aftercare-handoff.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 assert.match(server,/getAdminUserFromRequest/);assert.match(server,/Same-origin request required/);
 assert.match(server,/Number\(priority.actor_user_id\)===actor/);assert.match(server,/WHERE NOT EXISTS/);assert.match(server,/payload_sha256/);
 assert.match(server,/Build 479 outstanding review/);assert.match(server,/Build 481 priority review/);assert.match(server,/case_closed:false/);
 for(const id of ['fpHandoffForm','fpHandoffOrder','fpHandoffSource','fpHandoffPriorityReceipt','fpHandoffDisposition','fpHandoffEvidence','fpHandoffObserved','fpHandoffSubmit','fpHandoffStatus'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b48[234]/);assert.match(ui,/assessHandoff482/);assert.match(ui,/handoffPayload482/);
});
