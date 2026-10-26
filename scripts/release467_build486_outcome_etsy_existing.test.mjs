import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeAftercarePortfolio480} from '../public/js/maker-aftercare-portfolio-policy-480.mjs';
import {assessOutcome486,outcomePayload486} from '../public/js/maker-aftercare-outcome-policy-486.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const receipt=(id,note)=>({evidence_id:id,order_id:81,event_kind:'aftercare_followup',created_at:'2026-10-13 12:00:00',review_note:note});
const source=receipt(401,'Build 479 outstanding review; owner #90; audit #89; source hold #82; follow-up #84; case=case-private-reference-81; evidence=original-source-evidence-81; state=awaiting_owner_action; case remains open, no external action.');
const priority=receipt(402,'Build 481 priority review; source follow-up #401; priority=urgent_manual_review; next=collect_missing_evidence; evidence=owner-review-evidence-481; owner observed; case remains open; no customer action.');
const handoff=receipt(403,'Build 482 owner handoff; source follow-up #401; priority receipt #402; disposition=accepted_for_manual_review; evidence=receiving-owner-evidence-482; receiver independently verified; case remains open; no external action.');
const reassessment=receipt(404,'Build 483 handoff reassessment; source follow-up #401; priority receipt #402; handoff receipt #403; finding=further_evidence_required; evidence=independent-review-483; independently reassessed; case remains open; no external action.');
const decision=receipt(405,'Build 484 follow-up decision; source follow-up #401; priority receipt #402; handoff receipt #403; reassessment receipt #404; decision=continue_evidence_collection; evidence=owner-decision-review-484; owner separately reviewed; case remains open; no external action.');
const independent=receipt(406,'Build 485 independent decision handoff; source follow-up #401; priority receipt #402; handoff receipt #403; reassessment receipt #404; decision receipt #405; disposition=needs_original_evidence; evidence=independent-owner-review-485; receiver independently verified; case remains open; no external action.');
const outcome=receipt(407,'Build 486 independent handoff outcome; source follow-up #401; priority receipt #402; handoff receipt #403; reassessment receipt #404; decision receipt #405; independent receipt #406; outcome=more_source_evidence_required; evidence=owner-outcome-review-486; owner independently reconciled; case remains open; no external action.');
const records=[independent,decision,reassessment,handoff,priority,source],form=()=>({order_id:81,source_receipt_id:401,priority_receipt_id:402,handoff_receipt_id:403,reassessment_receipt_id:404,decision_receipt_id:405,independent_decision_handoff_receipt_id:406,outcome:'more_source_evidence_required',evidence_reference:'owner-outcome-review-486',observed:true});
test('Build 486 outcome is source-bound and does not close a case',()=>{
 const portfolio=summarizeAftercarePortfolio480(records),assessment=assessOutcome486({form:form(),portfolio});assert.equal(assessment.ready,true);
 const payload=outcomePayload486({assessment,form:form(),requestKey:'uniqueowneroutcome486key'});
 assert.equal(payload.independent_decision_handoff_receipt_id,406);assert.equal(assessment.case_closed,false);assert.equal(assessment.external_action,false);
 for(const change of [{independent_decision_handoff_receipt_id:999},{outcome:'refund_now'},{evidence_reference:'bad'},{observed:false}])assert.equal(assessOutcome486({form:{...form(),...change},portfolio}).ready,false);
 const after=summarizeAftercarePortfolio480([outcome,...records]);assert.equal(after.outcome_receipts,1);assert.equal(after.cases[0].outcome_receipt_id,407);assert.equal(after.exception_ledger[0].case_closed,false);
 assert.equal(JSON.stringify(after.exception_ledger).includes('owner-outcome-review-486'),false);assert.equal(assessOutcome486({form:form(),portfolio:after}).ready,false);
});
test('Build 486 aftercare is independently reviewed, original source bound and append-only',()=>{
 const server=read('../functions/api/admin/maker-aftercare-handoff-outcome.js'),page=read('../admin/maker-fulfillment-pilot/index.html'),ui=read('../public/js/admin-maker-fulfillment-pilot-464.js');
 for(const pattern of [/getAdminUserFromRequest/,/Number\(rows\[5\]\.actor_user_id\)===actor/,/WHERE NOT EXISTS/,/payload_sha256/,/no external action/])assert.match(server,pattern);
 for(const n of ['479','481','482','483','484','485','486'])assert.match(server,new RegExp(`Build ${n}`));
 for(const id of ['fpOutcomeForm','fpOutcomeOrder','fpOutcomeSource','fpOutcomePriority','fpOutcomeHandoff','fpOutcomeReassessment','fpOutcomeDecision','fpOutcomeIndependent','fpOutcomeChoice','fpOutcomeEvidence','fpOutcomeObserved','fpOutcomeSubmit','fpOutcomeStatus'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b486/);assert.match(ui,/outcomePayload486/);
});
test('Build 486 Etsy controls reconcile an actual existing draft without duplicate creation or publication',()=>{
 const server=read('../functions/api/admin/product-etsy-existing-draft.js'),page=read('../admin/product-editor/index.html'),client=read('../public/js/admin-product-existing-etsy-draft-v486.js');
 for(const pattern of [/verifiedAdminFromModule/,/Same-origin required/,/canadaOnlyShippingProfile/,/String\(listing.state\|\|''\)/,/===?'draft'/,/link_existing/,/inspect_listing/,/update_saved_fields/,/state:\s*'draft'|state\|\|''/,/method:'PATCH'/,/publication_performed:false/,/automatic_retry:false/,/update_claimed/,/update_confirmed/])assert.match(server,pattern);
 assert.doesNotMatch(server,/method:'POST'.*shops\/.*listings/);
 for(const id of ['dd486EtsyExistingLoad','dd486EtsyListingId','dd486EtsyLinkConfirm','dd486EtsyInspect','dd486EtsyPreview','dd486EtsyOlderTitle','dd486EtsyLink','dd486EtsyUpdateConfirm','dd486EtsyUpdate','dd486EtsyUpdateStatus'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(client,/state\.inspected/);assert.match(client,/state\.uncertain/);assert.match(page,/admin-product-existing-etsy-draft-v486\.js\?v=486/);
});
test('Blocked gallery checkbox reasons are explicitly distinguishable and protections are retained',()=>{
 const endpoint=read('../functions/api/admin/product-distribution-406.js'),gallery=read('../public/js/admin-product-distribution-v406.js'),photos=read('../functions/api/admin/product-etsy-images.js');
 assert.match(endpoint,/imageHolds/);assert.match(endpoint,/public-use approval missing/);assert.match(endpoint,/descriptive alt text missing/);assert.match(endpoint,/verified dimensions below 800×800 or missing/);
 assert.match(gallery,/hold_reasons/);assert.match(photos,/checkedEtsyBytes/);assert.match(photos,/remote\.length!==receipts\.length/);
});
