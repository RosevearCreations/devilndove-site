import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeAftercarePortfolio480} from '../public/js/maker-aftercare-portfolio-policy-480.mjs';
import {handoffAge483,assessReassessment483,reassessmentPayload483} from '../public/js/maker-aftercare-reassessment-policy-483.mjs';
const source={evidence_id:401,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 12:00:00',review_note:'Build 479 outstanding review; owner #90; audit #89; source hold #82; follow-up #84; case=case-private-reference-81; evidence=original-source-evidence-81; state=awaiting_owner_action; case remains open, no external action.'};
const priority={evidence_id:402,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 13:00:00',review_note:'Build 481 priority review; source follow-up #401; priority=urgent_manual_review; next=collect_missing_evidence; evidence=owner-review-evidence-481; owner observed; case remains open; no customer action.'};
const handoff={evidence_id:403,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 14:00:00',review_note:'Build 482 owner handoff; source follow-up #401; priority receipt #402; disposition=accepted_for_manual_review; evidence=receiving-owner-evidence-482; receiver independently verified; case remains open; no external action.'};
const reassessment={evidence_id:404,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-14 14:00:00',review_note:'Build 483 handoff reassessment; source follow-up #401; priority receipt #402; handoff receipt #403; finding=further_evidence_required; evidence=independent-review-483; independently reassessed; case remains open; no external action.'};
const form=()=>({order_id:81,source_receipt_id:401,priority_receipt_id:402,handoff_receipt_id:403,finding:'further_evidence_required',evidence_reference:'independent-review-483',observed:true});
test('Build 483 handoff age buckets are advisory, UTC-bounded and fail closed for missing or future time',()=>{
 const now=new Date('2026-10-31T14:00:00Z');
 for(const [days,band] of [[0,'0–6 days'],[7,'7–13 days'],[14,'14–29 days'],[30,'30+ days']]){
  const when=new Date(now.getTime()-days*86400000).toISOString().slice(0,19).replace('T',' ');
  assert.deepEqual(handoffAge483(when,now),{days,band,advisory:true});
 }
 assert.equal(handoffAge483('bad',now).band,'unknown');assert.equal(handoffAge483('2027-01-01 00:00:00',now).days,null);
});
test('Build 483 reassessment requires existing handoff and explicit independent manual attestation',()=>{
 const p=summarizeAftercarePortfolio480([handoff,priority,source]);
 assert.equal(p.cases[0].handoff_created_at,'2026-10-13 14:00:00');
 const decision=assessReassessment483({portfolio:p,form:form()});assert.equal(decision.ready,true);
 const payload=reassessmentPayload483({decision,form:form(),requestKey:'independentreview483key'});
 assert.deepEqual([payload.order_id,payload.source_receipt_id,payload.priority_receipt_id,payload.handoff_receipt_id],[81,401,402,403]);
 assert.equal(decision.case_closed,false);assert.equal(decision.external_action,false);
 for(const change of [{handoff_receipt_id:999},{finding:'case_closed'},{evidence_reference:'bad'},{observed:false}])
  assert.equal(assessReassessment483({portfolio:p,form:{...form(),...change}}).ready,false);
 assert.equal(assessReassessment483({portfolio:null,form:form()}).ready,false);
});
test('Build 483 append-only reassessment is separately counted and blocks duplicate source reassessment',()=>{
 const p=summarizeAftercarePortfolio480([reassessment,handoff,priority,source]);
 assert.equal(p.reassessment_receipts,1);assert.equal(p.handoff_receipts,1);assert.equal(p.recognized_receipts,1);
 assert.equal(p.cases[0].reassessment_receipt_id,404);assert.equal(p.cases[0].reassessment_finding,'further_evidence_required');
 assert.equal(assessReassessment483({portfolio:p,form:form()}).ready,false);
 assert.equal(p.case_closure_verified,false);assert.equal(p.customer_consent_verified,false);
});
test('Build 483 protected endpoint proves source chain, distinct actor, atomic first-write and safe retry',()=>{
 const server=readFileSync(new URL('../functions/api/admin/maker-aftercare-reassessment.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 assert.match(server,/getAdminUserFromRequest/);assert.match(server,/Same-origin request required/);
 assert.match(server,/Number\(handoff.actor_user_id\)===actor/);assert.match(server,/WHERE NOT EXISTS/);assert.match(server,/payload_sha256/);
 for(const build of ['479','481','482'])assert.match(server,new RegExp(`Build ${build}`));
 for(const id of ['fpReassessmentForm','fpReassessmentOrder','fpReassessmentSource','fpReassessmentPriority','fpReassessmentHandoff','fpReassessmentFinding','fpReassessmentEvidence','fpReassessmentObserved','fpReassessmentSubmit','fpReassessmentStatus'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b483/);assert.match(ui,/assessReassessment483/);assert.match(ui,/reassessmentPayload483/);
});
