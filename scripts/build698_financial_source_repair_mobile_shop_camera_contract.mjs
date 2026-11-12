import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance698,utcAttemptTime698} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const time=Date.parse('2026-11-12T15:00:00Z'),sourceFingerprint='a'.repeat(64),revision='source-698';
assert.equal(utcAttemptTime698('2026-11-12 14:59:00',time),Date.parse('2026-11-12T14:59:00Z'));
assert.equal(utcAttemptTime698('2026-11-12T14:59:00Z',time),Date.parse('2026-11-12T14:59:00Z'));
assert.equal(utcAttemptTime698('2026-11-12 15:10:00',time),null);
assert.equal(utcAttemptTime698('2026-11-12T14:59:00',time),null);
const current={queue_id:9,verified_master_receipt_id:920,master_fresh:true,
fingerprint_sha256:sourceFingerprint,source_revision:revision};
const prior={history_complete:true,master_accepted_now:true,
reconciliation:{original_mismatch_count:1,items:[{
older_receipt_id:11,newer_receipt_id:12,
reconciliation_receipt_id:510,custodian_attestation_receipt_id:480,
independent_reconciliation_recorded:true}]},
aging:{items:[{case_id:'original-case-698',original_resolution_receipt_id:620,
escalation_receipt_id:600,owner_review_receipt_id:610,owner_review_recorded:true}]},
master:{current_independent_master_receipt_id:919,
items:[{older_receipt_id:11,newer_receipt_id:12,
prior_continuity_receipt_id:690,renewal_receipt_id:710,renewal_review_recorded:true}]}};
const common={fingerprint_sha256:sourceFingerprint,source_revision:revision,
owner_reviewed:true,owner_user_id:4,resolution_note:
'We reviewed the exact original signed evidence and require independent external repair before closure.',
original_source_repaired:false,external_repair_verified:false,
financial_certified:false,continuous_connection_verified:false};
const statuses={intake_source_repair_proof:'owner_original_repair_proof_intake_698',
record_escalation_recovery:'owner_escalation_recovery_followup_698',
record_master_drift:'owner_master_renewal_drift_recheck_698'};
const make=(id,decision,parts={},at='2026-11-12T14:59:00Z')=>({
social_post_attempt_id:id,attempt_status:statuses[decision],attempted_at:at,
response_json:JSON.stringify({...common,decision,reference_receipt_id:11,
newer_receipt_id:12,prior_receipt_id:510,...parts})});
let v=assessFinance698(current,prior,[],time);
assert.equal(v.status,'HOLD_MASTER_RENEWAL_DRIFT');
assert.equal(v.source_repair.original_mismatch_count,1);
assert.equal(v.source_repair.eligible_reconciliation_count,1);
assert.equal(v.source_repair.pending_intake_count,1);
assert.equal(v.recovery.eligible_owner_cases,1);
assert.equal(v.recovery.pending_followup_count,1);
assert.equal(v.master.receipt_changed,true);
assert.equal(v.master.drift_detected,true);
assert.equal(v.master.pending_drift_review_count,1);
assert.equal(v.financial_certified,false);
assert.equal(v.original_source_repaired,false);
const repair=make(810,'intake_source_repair_proof',{
external_document_sha256:'b'.repeat(64),
external_reference:'custodian.case.698/a',
external_observed_at:'2026-11-12T14:50:00Z',
independent_source_repair_verification:false});
v=assessFinance698(current,prior,[{...repair,attempted_at:'2026-11-12 14:59:00'}],time);
assert.equal(v.history_complete,true);
v=assessFinance698(current,prior,[repair],time);
assert.equal(v.history_complete,true);
assert.equal(v.source_repair.pending_intake_count,0);
assert.equal(v.source_repair.items[0].repair_proof_receipt_id,810);
assert.equal(v.owner_evidence_history[0].state,'SOURCE_REPAIR_DOCUMENT_INTAKE_UNVERIFIED');
assert.equal(v.source_repair.independent_repair_verification_count,0);
assert.equal(v.original_source_repaired,false);
assert.equal(v.financial_certified,false);
for(const row of [
 make(811,'intake_source_repair_proof',{external_document_sha256:'b'.repeat(63),
external_reference:'custodian.case.698/a',external_observed_at:'2026-11-12T14:50:00Z',independent_source_repair_verification:false}),
 make(811,'intake_source_repair_proof',{external_document_sha256:'b'.repeat(64),
external_reference:'custodian.case.698/a',external_observed_at:'2026-11-12T14:50:00Z',independent_source_repair_verification:true}),
 make(811,'intake_source_repair_proof',{external_document_sha256:'b'.repeat(64),
external_reference:'custodian.case.698/a',external_observed_at:'2026-11-12T15:05:00Z',independent_source_repair_verification:false}),
 make(811,'intake_source_repair_proof',{prior_receipt_id:511,
external_document_sha256:'b'.repeat(64),external_reference:'custodian.case.698/a',
external_observed_at:'2026-11-12T14:50:00Z',independent_source_repair_verification:false}),
]){
assert.equal(assessFinance698(current,prior,[row],time).history_complete,false);
}
const follow=make(820,'record_escalation_recovery',{
reference_receipt_id:620,newer_receipt_id:null,prior_receipt_id:610,
case_id:'original-case-698',followup_disposition:'recovery_evidence_requested',
external_remediation_verified:false});
v=assessFinance698(current,prior,[follow],time);
assert.equal(v.history_complete,true);
assert.equal(v.recovery.pending_followup_count,0);
assert.equal(v.recovery.items[0].recovery_receipt_id,820);
assert.equal(v.recovery.items[0].external_incident_recovered,false);
assert.equal(v.owner_evidence_history[0].state,
'OWNER_RECOVERY_FOLLOWUP_RECORDED_EXTERNAL_RESOLUTION_HOLD');
for(const invalid of [
 make(821,'record_escalation_recovery',{reference_receipt_id:620,newer_receipt_id:null,
prior_receipt_id:610,case_id:'original-case-698',followup_disposition:'closed',
external_remediation_verified:false}),
 make(821,'record_escalation_recovery',{reference_receipt_id:620,newer_receipt_id:null,
prior_receipt_id:610,case_id:'original-case-698',followup_disposition:'followup_reissued',
external_remediation_verified:true}),
])assert.equal(assessFinance698(current,prior,[invalid],time).history_complete,false);
const drift=make(830,'record_master_drift',{
prior_receipt_id:710,observed_master_receipt_id:920,
prior_master_receipt_id:919,drift_detected:true,
new_external_master_signature_verified:false});
v=assessFinance698(current,prior,[drift],time);
assert.equal(v.history_complete,true);
assert.equal(v.master.items[0].drift_review_recorded,true);
assert.equal(v.master.items[0].drift_review_receipt_id,830);
assert.equal(v.master.pending_drift_review_count,0);
assert.equal(v.master.new_independent_signature_verified,false);
assert.equal(v.status,'HOLD_MASTER_RENEWAL_DRIFT');
assert.equal(assessFinance698(current,prior,[
make(830,'record_master_drift',{prior_receipt_id:710,observed_master_receipt_id:921,
prior_master_receipt_id:919,drift_detected:true,
new_external_master_signature_verified:false})],time).history_complete,false);
assert.equal(assessFinance698(current,prior,[
make(830,'record_master_drift',{prior_receipt_id:710,observed_master_receipt_id:920,
prior_master_receipt_id:919,drift_detected:false,
new_external_master_signature_verified:false})],time).history_complete,false);
assert.equal(assessFinance698(current,prior,[repair,repair],time).history_complete,false);
assert.equal(assessFinance698({...current,source_revision:'new'},prior,[repair],time).history_complete,false);
assert.equal(assessFinance698(current,prior,Array(61).fill(repair),time).history_complete,false);
assert.equal(assessFinance698(current,{...prior,history_complete:false},[],time).status,
'HOLD_FINANCIAL_698_EVIDENCE_DRIFT');
assert.equal(assessFinance698({queue_id:0},{history_complete:false},[],time).status,
'HOLD_SELECT_CAMPAIGN');
const noMaster=assessFinance698({...current,master_fresh:false},
{...prior,master_accepted_now:false},[],time);
assert.equal(noMaster.master.drift_detected,true);
assert.equal(noMaster.master.prior_master_acceptance_missing,true);
const server=read('functions/api/admin/social-post-queue.js'),
financial=read('admin/social-publishing/index.html'),
financialClient=read('public/js/admin-social-platform-preflight.js'),
shop=read('shop/index.html'),shopCss=read('css/shop-uniform-cards-489.css'),
mobile=read('admin/mobile-product/index.html'),mobileJs=read('public/js/admin-mobile-product-augment.js'),
mobileServer=read('functions/api/admin/mobile-create-product.js'),
products=read('admin/products/index.html'),editor=read('admin/product-editor/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const rx of [/export function assessFinance698\(/,/async function finance698\(/,
 /async function ownerReview698\(/,/finance_owner_review_698/,
 /financial698:await finance698/,/owner_finance_review_698/,
 /if\(params.get\('export'\)==='financial698'\)/,
 /original_source_repaired:false/,/financial_certified:false/])
assert.match(server,rx);
for(const id of ['dd698-finance','dd698-finance-title','dd698Refresh','dd698Export',
'dd698Status','dd698Stats','dd698Sources','dd698Recovery','dd698Master',
'dd698Form','dd698Decision','dd698Source','dd698Disposition','dd698Reference',
'dd698Digest','dd698Observed','dd698Note','dd698Reviewed','dd698Submit','dd698Result'])
assert.ok(financial.includes('id="'+id+'"'),id);
for(const rx of [/function draw698\(d\)/,/function chooseSources698\(\)/,
 /owner_finance_review_698/,/export=financial698/,/draw697\(d\);\s*draw698\(d\)/])
assert.match(financialClient,rx);
assert.ok(shop.indexOf('id="shop698SearchPanel"')>0);
assert.ok(shop.indexOf('id="shopResultsSection"')>shop.indexOf('id="shop698SearchPanel"'));
assert.ok(shop.indexOf('id="build208ShopCapabilityNavigation"')>shop.indexOf('id="shopResultsSection"'));
assert.ok(shop.indexOf('id="shopRecentlyViewedMount"')>shop.indexOf('id="shopResultsSection"'));
assert.ok(shop.indexOf('id="shopCollectionsMount"')>shop.indexOf('id="shopResultsSection"'));
assert.match(shop,/data-dd-shop-products-first="698"/);
assert.match(shopCss,/@media\(max-width:700px\)/);
assert.match(shopCss,/body\[data-dd-shop-products-first="698"\] #shop698SearchPanel/);
for(const id of ['dd698-camera-start','dd698CameraPhoto','dd698PhotoLibrary',
'dd698CameraVideo','dd698CameraName','dd698CameraSave','dd698CameraClear',
'dd698CameraPreview','dd698CameraStatus','dd698CameraSavedLink'])
assert.ok(mobile.includes('id="'+id+'"'),id);
assert.match(mobile,/accept="image\/\*" capture="environment"/);
assert.match(mobile,/accept="video\/mp4,video\/webm,video\/quicktime" capture="environment"/);
for(const rx of [/\/api\/admin\/mobile-create-product/,/\/api\/admin\/product-video-attachments/,
 /FormData\(/,/capture_entry_mode','camera'/,/isLoggedIn/,/internal review only/,
 /saved as/,/Check Product video attachments before retrying/])
assert.match(mobileJs,rx);
assert.match(mobileServer,/captureEntryMode === "camera" \? \`Temporary /);
assert.match(mobileServer,/\["full", "wizard", "camera"\]/);
assert.match(products,/\/admin\/mobile-product\/#dd698-camera-start/);
assert.match(editor,/\/admin\/mobile-product\/#dd698-camera-start/);
assert.match(ci,/build698_financial_source_repair_mobile_shop_camera_contract\.mjs/);
console.log('BUILD 698 PASS: fail-closed source proof, escalation recovery, Master drift, products-first Shop, ID-based camera and R2 media draft');
