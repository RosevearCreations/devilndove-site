import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeAftercarePortfolio480} from '../public/js/maker-aftercare-portfolio-policy-480.mjs';
import {assessDecisionHandoff485,decisionHandoffPayload485,decisionAge485} from '../public/js/maker-aftercare-decision-handoff-policy-485.mjs';
const receipt=(id,note,order_id=81,created_at='2026-10-13 12:00:00')=>({evidence_id:id,order_id,event_kind:'aftercare_followup',created_at,review_note:note});
const source=receipt(401,'Build 479 outstanding review; owner #90; audit #89; source hold #82; follow-up #84; case=case-private-reference-81; evidence=original-source-evidence-81; state=awaiting_owner_action; case remains open, no external action.');
const older=receipt(400,'Build 479 outstanding review; owner #90; audit #89; source hold #82; follow-up #84; case=older-source-evidence-81; evidence=original-source-evidence-81; state=evidence_still_missing; case remains open, no external action.');
const priority=receipt(402,'Build 481 priority review; source follow-up #401; priority=urgent_manual_review; next=collect_missing_evidence; evidence=owner-review-evidence-481; owner observed; case remains open; no customer action.');
const handoff=receipt(403,'Build 482 owner handoff; source follow-up #401; priority receipt #402; disposition=accepted_for_manual_review; evidence=receiving-owner-evidence-482; receiver independently verified; case remains open; no external action.');
const review=receipt(404,'Build 483 handoff reassessment; source follow-up #401; priority receipt #402; handoff receipt #403; finding=further_evidence_required; evidence=independent-review-483; independently reassessed; case remains open; no external action.');
const decision=receipt(405,'Build 484 follow-up decision; source follow-up #401; priority receipt #402; handoff receipt #403; reassessment receipt #404; decision=continue_evidence_collection; evidence=owner-decision-review-484; owner separately reviewed; case remains open; no external action.');
const receipt485=receipt(406,'Build 485 independent decision handoff; source follow-up #401; priority receipt #402; handoff receipt #403; reassessment receipt #404; decision receipt #405; disposition=needs_original_evidence; evidence=independent-owner-review-485; receiver independently verified; case remains open; no external action.');
const data=[decision,review,handoff,priority,source,older];
const form=()=>({order_id:81,source_receipt_id:401,priority_receipt_id:402,handoff_receipt_id:403,reassessment_receipt_id:404,decision_receipt_id:405,disposition:'needs_original_evidence',evidence_reference:'independent-owner-review-485',observed:true});
test('Build 485 independently verifies original decision chain and restricts scope to evidence',()=>{
 const p=summarizeAftercarePortfolio480(data),assessment=assessDecisionHandoff485({form:form(),portfolio:p});
 assert.equal(assessment.ready,true);assert.equal(assessment.case_closed,false);assert.equal(assessment.external_action,false);
 const payload=decisionHandoffPayload485({assessment,form:form(),requestKey:'independenthandoff485key'});
 assert.deepEqual([payload.order_id,payload.source_receipt_id,payload.priority_receipt_id,payload.handoff_receipt_id,payload.reassessment_receipt_id,payload.decision_receipt_id],[81,401,402,403,404,405]);
 assert.equal(payload.receiver_observed,true);assert.equal(decisionHandoffPayload485({assessment,form:form(),requestKey:'short'}),null);
});
test('Build 485 holds stale, incomplete or mismatched sample handoffs',()=>{
 const p=summarizeAftercarePortfolio480(data);
 for(const change of [{decision_receipt_id:999},{reassessment_receipt_id:4044},{disposition:'refund_customer'},{evidence_reference:'bad'},{observed:false}])assert.equal(assessDecisionHandoff485({form:{...form(),...change},portfolio:p}).ready,false);
 assert.equal(assessDecisionHandoff485({form:form(),portfolio:null}).ready,false);
 const done=summarizeAftercarePortfolio480([receipt485,...data]);assert.equal(done.independent_decision_handoff_receipts,1);assert.equal(done.cases[0].independent_decision_handoff_receipt_id,406);
 assert.equal(done.exception_ledger[0].recurrence_count_in_sample,2);assert.equal(done.exception_ledger[0].independent_decision_handoff_disposition,'needs_original_evidence');
 assert.equal(done.exception_ledger[0].decision_created_at,'2026-10-13 12:00:00');
 assert.equal(done.exception_ledger[0].case_closed,false);assert.equal(done.exception_ledger[0].external_action,false);
 assert.equal(JSON.stringify(done.exception_ledger).includes('independent-owner-review-485'),false);
 assert.equal(assessDecisionHandoff485({form:form(),portfolio:done}).ready,false);
});
test('Build 485 advisory age bands cannot claim SLA or future timestamps',()=>{
 const now=Date.parse('2026-10-26T12:00:00Z');
 for(const [days,band] of [[0,'0–6 days'],[7,'7–13 days'],[14,'14–29 days'],[30,'30+ days']])assert.equal(decisionAge485(new Date(now-days*86400000).toISOString().slice(0,19),now).band,band);
 assert.equal(decisionAge485('bad',now).days,null);assert.equal(decisionAge485('2027-10-26 12:00:00',now).band,'unknown');assert.equal(decisionAge485('2026-10-13 12:00:00',now).not_sla,true);
});
test('Build 485 server and admin UI enforce independence, idempotence, chain and no external action',()=>{
 const server=readFileSync(new URL('../functions/api/admin/maker-aftercare-decision-handoff.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const pattern of [/getAdminUserFromRequest/,/Same-origin request required/,/Number\(decision.actor_user_id\)===actor/,/WHERE NOT EXISTS/,/payload_sha256/,/case_closed:false/,/external_actions:false/])assert.match(server,pattern);
 for(const build of ['479','481','482','483','484','485'])assert.match(server,new RegExp(`Build ${build}`));
 for(const id of ['fpDecisionHandoffForm','fpDecisionHandoffOrder','fpDecisionHandoffSource','fpDecisionHandoffPriority','fpDecisionHandoffOriginal','fpDecisionHandoffReassessment','fpDecisionHandoffDecision','fpDecisionHandoffDisposition','fpDecisionHandoffEvidence','fpDecisionHandoffObserved','fpDecisionHandoffSubmit','fpDecisionHandoffStatus'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b485/);assert.match(ui,/decisionAge485/);assert.match(ui,/decisionHandoffPayload485/);
});
