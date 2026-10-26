import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeAftercarePortfolio480} from '../public/js/maker-aftercare-portfolio-policy-480.mjs';
import {assessDecision484,decisionPayload484} from '../public/js/maker-aftercare-decision-policy-484.mjs';
const receipt=(evidence_id,note)=>({evidence_id,order_id:81,event_kind:'aftercare_followup',created_at:`2026-10-13 12:00:00`,review_note:note});
const source=receipt(401,'Build 479 outstanding review; owner #90; audit #89; source hold #82; follow-up #84; case=case-private-reference-81; evidence=original-source-evidence-81; state=awaiting_owner_action; case remains open, no external action.');
const priority=receipt(402,'Build 481 priority review; source follow-up #401; priority=urgent_manual_review; next=collect_missing_evidence; evidence=owner-review-evidence-481; owner observed; case remains open; no customer action.');
const handoff=receipt(403,'Build 482 owner handoff; source follow-up #401; priority receipt #402; disposition=accepted_for_manual_review; evidence=receiving-owner-evidence-482; receiver independently verified; case remains open; no external action.');
const reassessment=receipt(404,'Build 483 handoff reassessment; source follow-up #401; priority receipt #402; handoff receipt #403; finding=further_evidence_required; evidence=independent-review-483; independently reassessed; case remains open; no external action.');
const decision=receipt(405,'Build 484 follow-up decision; source follow-up #401; priority receipt #402; handoff receipt #403; reassessment receipt #404; decision=continue_evidence_collection; evidence=owner-decision-review-484; owner separately reviewed; case remains open; no external action.');
const form=()=>({order_id:81,source_receipt_id:401,priority_receipt_id:402,handoff_receipt_id:403,reassessment_receipt_id:404,decision:'continue_evidence_collection',evidence_reference:'owner-decision-review-484',observed:true});
test('Build 484 owner decision requires verified source-linked reassessment and cannot execute closure',()=>{
 const p=summarizeAftercarePortfolio480([reassessment,handoff,priority,source]);const review=assessDecision484({portfolio:p,form:form()});assert.equal(review.ready,true);
 const payload=decisionPayload484({decision:review,form:form(),requestKey:'originalownerdecision484key'});
 assert.deepEqual([payload.order_id,payload.source_receipt_id,payload.priority_receipt_id,payload.handoff_receipt_id,payload.reassessment_receipt_id],[81,401,402,403,404]);
 assert.equal(review.case_closed,false);assert.equal(review.external_action,false);
});
test('Build 484 fails closed for mismatched evidence, unknown decisions, missing attestation or repeated source',()=>{
 const p=summarizeAftercarePortfolio480([reassessment,handoff,priority,source]);
 for(const change of [{reassessment_receipt_id:999},{decision:'case_closed'},{evidence_reference:'bad'},{observed:false}])assert.equal(assessDecision484({portfolio:p,form:{...form(),...change}}).ready,false);
 assert.equal(assessDecision484({portfolio:null,form:form()}).ready,false);
 const already=summarizeAftercarePortfolio480([decision,reassessment,handoff,priority,source]);assert.equal(already.decision_receipts,1);
 assert.equal(already.cases[0].decision_receipt_id,405);assert.equal(already.cases[0].owner_decision,'continue_evidence_collection');
 assert.equal(assessDecision484({portfolio:already,form:form()}).ready,false);
});
test('Build 484 ledger contains no raw private note and is bounded, non-closing and source-derived',()=>{
 const p=summarizeAftercarePortfolio480([decision,reassessment,handoff,priority,source]);
 assert.equal(p.exception_ledger.length,1);assert.equal(p.exception_ledger[0].source_receipt_id,401);
 assert.equal(p.exception_ledger[0].reassessment_receipt_id,404);assert.equal(p.exception_ledger[0].decision_receipt_id,405);
 assert.equal(p.exception_ledger[0].case_closed,false);assert.equal(p.exception_ledger[0].external_action,false);
 assert.equal(JSON.stringify(p.exception_ledger).includes('owner-decision-review-484'),false);
 assert.equal(p.recognized_receipts,1);assert.equal(p.bounded_sample,true);assert.equal(p.case_closure_verified,false);
});
test('Build 484 endpoint and Admin UI enforce separate actor, append-only idempotency and source safety',()=>{
 const server=readFileSync(new URL('../functions/api/admin/maker-aftercare-decision.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 assert.match(server,/getAdminUserFromRequest/);assert.match(server,/Same-origin request required/);
 assert.match(server,/Number\(review.actor_user_id\)===actor/);assert.match(server,/WHERE NOT EXISTS/);assert.match(server,/payload_sha256/);
 for(const build of ['479','481','482','483'])assert.match(server,new RegExp(`Build ${build}`));
 for(const id of ['fpExceptionLedger','fpDecisionForm','fpDecisionOrder','fpDecisionSource','fpDecisionPriority','fpDecisionHandoff','fpDecisionReassessment','fpDecisionChoice','fpDecisionEvidence','fpDecisionObserved','fpDecisionSubmit','fpDecisionStatus'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b486/);assert.match(ui,/assessDecision484/);assert.match(ui,/decisionPayload484/);
});
