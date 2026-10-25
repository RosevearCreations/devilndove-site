import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {TRIAL_PATHS_466,SOURCE_KINDS_466,reconcileMakerTrial466,summarizeDebriefCases466} from '../public/js/maker-trial-debrief-policy-466.mjs';
import {TRIALS,CHECKS} from '../functions/api/_lib/makerOwnerTrial456.mjs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scenario='jewellery_metal',sourceId=17;
function receipt(checkpoint,id,n=1,extra={}){return {scenario_key:scenario,checkpoint_key:checkpoint,maker_owner_trial_review_id:n,
 decision:'accepted',personally_observed:1,source_kind:id.kind,source_id:id.id,...extra}}
const project={kind:'project',id:17},event={kind:'event',id:51},run={kind:'traveler_run',id:43},qa={kind:'quality_attempt',id:48},story={kind:'media_story',id:62};
function fullTrial(){const history=[
 receipt('source_identity',project,101),receipt('actual_materials',event,102),receipt('process_quality',run,103),
 receipt('physical_safety',qa,104),receipt('media_rights',story,105)];
 return {ok:true,selected:{creative_work_project_id:17},sources:[project,event,run,qa,story],history,history_truncated:false};}
const debrief={outcome:'observed_complete',observation:'I personally inspected the actual repaired jewellery sample and its source receipts.',
 nextAction:'Review the original physical label and safety check.',personallyObserved:true};

test('Build 466 scenario and source-kind registry matches Build 456 canonical intake',()=>{
 assert.deepEqual(Object.keys(TRIAL_PATHS_466),Object.keys(TRIALS));
 for(const [key,scenario] of Object.entries(TRIALS))assert.deepEqual(TRIAL_PATHS_466[key],scenario.checks);
 for(const [key,checkpoint] of Object.entries(CHECKS))assert.deepEqual(SOURCE_KINDS_466[key],checkpoint.sources);
});
test('Build 466 starts HOLD; false, missing, cross-scoped, forged receipts never promote',()=>{
 const empty=reconcileMakerTrial466();assert.equal(empty.state,'HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE');
 assert.equal(empty.caseReceiptsReconciled,false);assert.equal(empty.debriefStatus,'HOLD_DEBRIEF_INCOMPLETE');
 assert.equal(empty.releaseApproved,false);assert.equal(empty.externalAction,false);assert.equal(empty.productSafetyCertified,false);
 const scoped=reconcileMakerTrial466({scenario,sourceId,trial:fullTrial(),debrief});
 assert.equal(scoped.caseReceiptsReconciled,true);assert.equal(scoped.acceptedSourceCount,5);
 assert.equal(scoped.debriefStatus,'OWNER_DEBRIEF_IN_SESSION_UNVERIFIED');assert.equal(scoped.state,'HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE');
 const otherProject=reconcileMakerTrial466({scenario,sourceId:18,trial:fullTrial(),debrief});
 assert.equal(otherProject.caseReceiptsReconciled,false);assert.equal(otherProject.scopeStatus,'HOLD_CASE_UNVERIFIED');
 const forged={...fullTrial(),history:[...fullTrial().history.slice(0,4),receipt('media_rights',{kind:'media_story',id:999},105)]};
 assert.equal(reconcileMakerTrial466({scenario,sourceId,trial:forged}).checks.at(-1).status,'HOLD_SOURCE_OUTSIDE_BOUNDED_LIST');
 const wrongKind={...fullTrial(),history:fullTrial().history.map(x=>x.checkpoint_key==='actual_materials'?{...x,source_kind:'project',source_id:17}:x)};
 assert.equal(reconcileMakerTrial466({scenario,sourceId,trial:wrongKind}).checks[1].status,'HOLD_INVALID_SOURCE_LINK');
});
test('Build 466 latest decision overrides older acceptance, rejects changed origin and truncated ledgers',()=>{
 const newerHold=receipt('physical_safety',qa,119,{decision:'hold',personally_observed:0});
 const x=reconcileMakerTrial466({scenario,sourceId,trial:{...fullTrial(),history:[...fullTrial().history,newerHold]}});
 assert.equal(x.checks.find(r=>r.checkpoint==='physical_safety').status,'HOLD_LATEST_OWNER_DECISION');
 assert.equal(x.checks.find(r=>r.checkpoint==='physical_safety').receiptId,119);
 assert.equal(x.caseReceiptsReconciled,false);
 const differentJourney={...fullTrial(),history:fullTrial().history.map(r=>({...r,scenario_key:'resin_clay'}))};
 assert.equal(reconcileMakerTrial466({scenario,sourceId,trial:differentJourney}).acceptedSourceCount,0);
 const truncated=reconcileMakerTrial466({scenario,sourceId,trial:{...fullTrial(),history_truncated:true}});
 assert.equal(truncated.acceptedSourceCount,0);assert.equal(truncated.checks.every(r=>r.status==='HOLD_HISTORY_TRUNCATED'),true);
 const unobserved={...fullTrial(),history:fullTrial().history.map(r=>r.checkpoint_key==='media_rights'?{...r,personally_observed:0}:r)};
 assert.equal(reconcileMakerTrial466({scenario,sourceId,trial:unobserved}).checks.at(-1).status,'HOLD_NOT_PERSONALLY_ACCEPTED');
});
test('Build 466 order receipts never certify delivery, relation or customer consent',()=>{
 const order={ok:true,order:{order_id:9},history_truncated:false,evidence:[{evidence_id:12,event_kind:'shipping_receipt'}]};
 const unreviewed=reconcileMakerTrial466({scenario,sourceId,trial:fullTrial(),orderId:9,fulfillment:order});
 assert.equal(unreviewed.orderStatus,'HOLD_CASE_ORDER_RELATION_UNVERIFIED');assert.equal(unreviewed.delivered,false);
 assert.equal(unreviewed.customerConsentVerified,false);
 const reviewed=reconcileMakerTrial466({scenario,sourceId,trial:fullTrial(),orderId:9,fulfillment:order,orderLinkReviewed:true});
 assert.equal(reviewed.orderStatus,'OWNER_REVIEWED_ORDER_RELATION_DELIVERY_UNVERIFIED');
 assert.deepEqual(reviewed.orderReceipts,[{receiptId:12,kind:'shipping_receipt'}]);assert.equal(reviewed.delivered,false);
 assert.equal(reconcileMakerTrial466({scenario,sourceId,trial:fullTrial(),orderId:10,fulfillment:order,orderLinkReviewed:true}).orderStatus,'HOLD_ORDER_SOURCE_UNAVAILABLE');
 assert.equal(reconcileMakerTrial466({scenario,sourceId,trial:fullTrial(),orderId:9,fulfillment:{...order,history_truncated:true},orderLinkReviewed:true}).orderStatus,'HOLD_ORDER_LEDGER_TRUNCATED');
});
test('Build 466 commission never treats a project as a commission request',()=>{
 const commission={ok:true,selected:{custom_request_id:25},history_truncated:false,sources:[{kind:'custom_request',id:25}],history:[]};
 assert.equal(reconcileMakerTrial466({scenario:'custom_commission',sourceId:25,trial:commission}).scopeStatus,'REAL_CASE_SELECTED');
 assert.equal(reconcileMakerTrial466({scenario:'custom_commission',sourceId:17,trial:fullTrial()}).scopeStatus,'HOLD_CASE_UNVERIFIED');
 assert.equal(reconcileMakerTrial466({scenario:'private_therapeutic',sourceId:17,trial:fullTrial()}).checks.length,4);
});
test('Build 466 session rollup remains HOLD and counts genuine case selections by journey',()=>{
 const one=reconcileMakerTrial466({scenario,sourceId,trial:fullTrial(),debrief});
 const summary=summarizeDebriefCases466([one,one,{...one,scenario:'fake_case'},
  reconcileMakerTrial466({scenario:'private_therapeutic',sourceId:42,trial:{ok:true,selected:{creative_work_project_id:42},sources:[],history:[]}})]);
 assert.equal(summary.totalCases,2);assert.equal(summary.coverage.find(x=>x.scenario===scenario).reconciled,1);
 assert.equal(summary.unreviewedJourneys.length,4);assert.equal(summary.independentApproval,false);
 assert.equal(summary.state,'HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE');
 assert.equal(summarizeDebriefCases466([reconcileMakerTrial466({scenario,sourceId,trial:null})]).totalCases,0);
});
test('Build 466 has Admin-only explicit bounded GETs, accessibility, source navigation, no mutations',()=>{
 const page=file('admin/maker-trial-debrief/index.html'),ui=file('public/js/admin-maker-trial-debrief-466.js'),links=file('public/js/maker-workbench-policy-457.mjs'),workbench=file('admin/maker-workbench/index.html');
 assert.match(page,/data-admin-module="creator"/);assert.match(page,/auth\.js/);
 assert.match(page,/aria-live="polite"/);assert.match(page,/ⓘ/);assert.match(page,/mdExport/);
 assert.match(ui,/api\/admin\/maker-owner-trials/);assert.match(ui,/api\/admin\/maker-fulfillment-evidence/);
 assert.match(ui,/Promise\.allSettled/);assert.match(ui,/credentials:'same-origin'/);
 assert.doesNotMatch(ui,/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|localStorage|sessionStorage/);
 assert.match(links,/key:'trial-debrief'/);assert.match(workbench,/\/admin\/maker-trial-debrief\//);
});
