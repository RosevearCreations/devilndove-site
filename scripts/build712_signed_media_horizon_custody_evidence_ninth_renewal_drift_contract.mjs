import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {signedMediaHorizonAge712,canReviewSignedMediaHorizon712,
 signedMediaHorizonReadback712} from '../functions/api/admin/_cameraField702.mjs';
import {originalNinthRenewalAge712,assessFinance712}
 from '../functions/api/admin/social-post-queue.js';
const now=Date.now(),h=3600000,iso=offset=>new Date(now+offset).toISOString();
const signed={admin_action_audit_id:800,data:{r2_key:'products/original-media/photo.jpg',verified_r2_bytes:4096}};
const recurrence={admin_action_audit_id:900,data:{build:709,original_signed_r2_key:signed.data.r2_key,
 original_signed_r2_bytes:4096}};
const resolution={admin_action_audit_id:930,data:{build:710,
 owner_resolution_decision:'accept_original_signed_source_only',
 physical_phone_independently_witnessed:false,unrecorded_uploads_closed:false,
 automatic_publication:false,recurrence_receipt_id:900,original_signoff_receipt_id:800,
 original_signed_r2_key:signed.data.r2_key,original_signed_r2_bytes:4096,
 restored_source_status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'}};
const stability={admin_action_audit_id:950,created_at:iso(-50*h),data:{build:711,
 original_inspection_type:'signed_media_post_resolution_stability',
 original_710_resolution_receipt_id:930,original_709_recurrence_receipt_id:900,
 original_signoff_receipt_id:800,original_signed_r2_key:signed.data.r2_key,
 original_signed_r2_bytes:4096,
 current_source_status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707',
 server_side_r2_head_confirmed:true,
 independent_physical_phone_witnessed:false,unrecorded_uploads_closed:false,
 automatic_publication:false}};
const latest={admin_action_audit_id:980,data:{issued_at:iso(-3*h),owner_re_attested:true}};
const stable={stable:true,status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'};
const drift={stable:false,status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'};
assert.equal(signedMediaHorizonAge712(stability,now).age_hours,50);
assert.match(signedMediaHorizonAge712(stability,now).status,/48H/);
assert.match(signedMediaHorizonAge712({...stability,created_at:iso(-74*h)},now).status,/72H/);
assert.match(signedMediaHorizonAge712({...stability,created_at:iso(-25*h)},now).status,/24H/);
assert.equal(signedMediaHorizonAge712({...stability,created_at:iso(-23*h)},now).due,false);
assert.equal(signedMediaHorizonAge712({...stability,created_at:'invalid'},now).due,false);
assert.equal(signedMediaHorizonAge712({...stability,created_at:iso(h)},now).due,false);
assert.equal(canReviewSignedMediaHorizon712(stability,resolution,recurrence,signed,latest,stable,now),true);
assert.equal(canReviewSignedMediaHorizon712(stability,resolution,recurrence,signed,latest,drift,now),false);
assert.equal(canReviewSignedMediaHorizon712(stability,resolution,recurrence,signed,
 {...latest,admin_action_audit_id:940},stable,now),false);
assert.equal(canReviewSignedMediaHorizon712(stability,resolution,recurrence,signed,
 {...latest,data:{...latest.data,owner_re_attested:false}},stable,now),false);
assert.equal(canReviewSignedMediaHorizon712(stability,resolution,recurrence,signed,
 {...latest,data:{...latest.data,issued_at:iso(-51*h)}},stable,now),false);
assert.equal(canReviewSignedMediaHorizon712({...stability,created_at:iso(-22*h)},
 resolution,recurrence,signed,latest,stable,now),false);
const horizonReceipt={admin_action_audit_id:1000,data:{build:712,
 source_recheck:'independent_server_d1_r2_head_on_demand',
 original_711_stability_receipt_id:950,original_710_resolution_receipt_id:930,
 original_709_recurrence_receipt_id:900,original_706_signoff_receipt_id:800,
 original_signed_r2_key:signed.data.r2_key,original_signed_r2_bytes:4096,
 observed_current_r2_key:signed.data.r2_key,observed_current_r2_bytes:4096,
 observed_stability_horizon_hours:50,observed_horizon_status:
  'ORIGINAL_SIGNED_MEDIA_HORIZON_48H_RECHECK_DUE_712',
 rechecked_source_status:stable.status,automatic_media_repair:false,
 continuous_monitoring_enabled:false,independent_physical_phone_witness:false,
 unrecorded_uploads_closed:false,publication_performed:false}};
assert.equal(signedMediaHorizonReadback712(horizonReceipt,stability,resolution,recurrence,signed,stable),true);
assert.equal(signedMediaHorizonReadback712(horizonReceipt,stability,resolution,recurrence,signed,drift),false);
for(const patch of [{original_711_stability_receipt_id:9},{original_710_resolution_receipt_id:9},
 {original_709_recurrence_receipt_id:9},{original_706_signoff_receipt_id:9},
 {original_signed_r2_key:'another.jpg'},{original_signed_r2_bytes:0},
 {observed_current_r2_key:'forged'},{observed_current_r2_bytes:0},
 {observed_stability_horizon_hours:2},{observed_horizon_status:'UNVERIFIED'},
 {rechecked_source_status:'forged'}, {automatic_media_repair:true},
 {continuous_monitoring_enabled:true},{independent_physical_phone_witness:true},
 {unrecorded_uploads_closed:true},{publication_performed:true}]){
 assert.equal(signedMediaHorizonReadback712({...horizonReceipt,
  data:{...horizonReceipt.data,...patch}},stability,resolution,recurrence,signed,stable),false,
  'Original signed source tampering must HOLD '+JSON.stringify(patch));
}
const sha='a'.repeat(64),m706='b'.repeat(64),m708='c'.repeat(64),
 m710='d'.repeat(64),m711='e'.repeat(64);
const current={queue_id:71,master_fresh:true,history_complete:true,open_cases:[],
 source_revision:'original-712-revision',fingerprint_sha256:sha};
const base706={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'ninth-ed25519-original-706'};
const item={provenance_renewed_711:true,renewal_receipt_id_711:320,
 outcome_receipt_id_711:300,followup_710_receipt_id:270,
 provenance_710_receipt_id:280,review_706_receipt_id:201,
 retention_manifest_sha256:m706,custody_708_digest_sha256:m708,
 provenance_710_digest_sha256:m710,renewal_manifest_sha256_711:m711};
const prior711={history_complete:true,items:[item]};
const renewal={social_post_attempt_id:320,
 attempt_status:'owner_ninth_provenance_renewal_audit_711',attempted_at:iso(-50*h),
 response_json:JSON.stringify({queue_id:71,original_ninth_review_receipt_id:201,
 original_710_provenance_receipt_id:280,original_711_reconciliation_receipt_id:300,
 original_706_manifest_sha256:m706,original_708_custody_digest_sha256:m708,
 original_710_provenance_sha256:m710,renewal_manifest_sha256:m711,
 ninth_reviewer_id:base706.ninth_signer_id,
 source_revision:current.source_revision,fingerprint_sha256:sha,
 original_ninth_signature_source_reverified:true,
 new_independent_signature_obtained:false,external_contact_confirmed:false,
 bookkeeping_closed:false,financial_certified:false})};
assert.equal(originalNinthRenewalAge712(renewal,now).age_hours,50);
assert.match(originalNinthRenewalAge712(renewal,now).status,/48H/);
assert.match(originalNinthRenewalAge712({...renewal,attempted_at:iso(-73*h)},now).status,/72H/);
assert.equal(originalNinthRenewalAge712({...renewal,attempted_at:'broken'},now).due,false);
assert.equal(originalNinthRenewalAge712({...renewal,attempted_at:iso(-23*h)},now).due,false);
const evidenceTime=now-60000;
const ageAt=originalNinthRenewalAge712(renewal,evidenceTime);
const evidence={queue_id:71,original_711_renewal_receipt_id:320,
 original_711_outcome_receipt_id:300,original_710_followup_receipt_id:270,
 original_710_provenance_receipt_id:280,original_ninth_review_receipt_id:201,
 original_706_manifest_sha256:m706,original_708_custody_digest_sha256:m708,
 original_710_provenance_sha256:m710,original_711_renewal_sha256:m711,
 ninth_reviewer_id:base706.ninth_signer_id,source_revision:current.source_revision,
 fingerprint_sha256:sha,observed_original_renewal_age_hours:ageAt.age_hours,
 observed_original_renewal_age_status:ageAt.status,
 manual_evidence_disposition:'owner_documented_custody_source_review_pending',
 manual_evidence_reference:'internal-original-review-712-001',
 owner_reviewed_original_source:true,owner_user_id:7,
 resolution_note:'Owner inspected the exact original signed source and retained custody receipts for follow-up.',
 independent_reviewer_response_confirmed:false,
 external_financial_source_verified:false,new_independent_signature_obtained:false,
 financial_certified:false,bookkeeping_closed:false};
const evidenceRow=(patch={},id=340)=>({social_post_attempt_id:id,
 attempt_status:'owner_custody_followup_evidence_712',attempted_at:new Date(evidenceTime).toISOString(),
 response_json:JSON.stringify({...evidence,...patch})});
let report=await assessFinance712(current,base706,prior711,[renewal],[],now);
assert.equal(report.history_complete,true);
assert.equal(report.renewed_source_drift_count,0);
assert.equal(report.horizon_due_count,1);
assert.equal(report.status,'ORIGINAL_NINTH_RENEWAL_HORIZON_FOLLOWUP_EVIDENCE_DUE_712');
report=await assessFinance712(current,base706,prior711,[renewal],[evidenceRow()],now);
assert.equal(report.history_complete,true);
assert.equal(report.evidence_recorded_count,1);
assert.equal(report.status,'ORIGINAL_CUSTODY_FOLLOWUP_EVIDENCE_RECORDED_SOURCE_STABLE_BOOKS_HOLD_712');
assert.equal(report.bookkeeping_closed,false);
assert.equal(report.independent_reviewer_response_confirmed,false);
for(const patch of [
 {original_ninth_review_receipt_id:202},{original_710_provenance_receipt_id:279},
 {original_711_reconciliation_receipt_id:301},
 {original_706_manifest_sha256:'f'.repeat(64)},
 {original_708_custody_digest_sha256:'f'.repeat(64)},
 {original_710_provenance_sha256:'f'.repeat(64)},
 {renewal_manifest_sha256:'f'.repeat(64)},{ninth_reviewer_id:'fake'},
 {source_revision:'stale'},{fingerprint_sha256:'f'.repeat(64)},
 {original_ninth_signature_source_reverified:false},
 {new_independent_signature_obtained:true},{external_contact_confirmed:true},
 {bookkeeping_closed:true},{financial_certified:true}]){
 const changed={...renewal,response_json:JSON.stringify({...JSON.parse(renewal.response_json),...patch})};
 const q=await assessFinance712(current,base706,prior711,[changed],[],now);
 assert.equal(q.history_complete,false,'Original ninth renewal drift must HOLD '+JSON.stringify(patch));
}
for(const patch of [
 {queue_id:72},{original_711_renewal_receipt_id:321},
 {original_711_outcome_receipt_id:301},{original_710_followup_receipt_id:271},
 {original_710_provenance_receipt_id:281},{original_ninth_review_receipt_id:202},
 {original_706_manifest_sha256:'f'.repeat(64)},
 {original_708_custody_digest_sha256:'f'.repeat(64)},
 {original_710_provenance_sha256:'f'.repeat(64)},
 {original_711_renewal_sha256:'f'.repeat(64)},
 {ninth_reviewer_id:'fake'},{source_revision:'stale'},
 {fingerprint_sha256:'f'.repeat(64)},
 {observed_original_renewal_age_hours:1},
 {observed_original_renewal_age_status:'forged'},
 {manual_evidence_disposition:'outside_reviewer_cleared_books'},
 {manual_evidence_reference:'short'},
 {owner_reviewed_original_source:false},{owner_user_id:0},{resolution_note:'short'},
 {independent_reviewer_response_confirmed:true},{external_financial_source_verified:true},
 {new_independent_signature_obtained:true},{financial_certified:true},{bookkeeping_closed:true}]){
 const q=await assessFinance712(current,base706,prior711,[renewal],[evidenceRow(patch)],now);
 assert.equal(q.history_complete,false,'Owner evidence/false external proof must HOLD '+JSON.stringify(patch));
}
assert.equal((await assessFinance712(current,base706,prior711,[renewal],[evidenceRow(),evidenceRow()],now)).history_complete,false);
assert.equal((await assessFinance712(current,base706,prior711,[renewal,renewal],[],now)).history_complete,false);
assert.equal((await assessFinance712(current,base706,prior711,[],[],now)).history_complete,false);
assert.equal((await assessFinance712({...current,master_fresh:false},base706,prior711,[renewal],[evidenceRow()],now)).history_complete,false);
assert.equal((await assessFinance712({...current,open_cases:[{id:1}]},base706,prior711,[renewal],[evidenceRow()],now)).history_complete,false);
assert.equal((await assessFinance712(current,{...base706,ninth_signer_configured:false},prior711,[renewal],[evidenceRow()],now)).history_complete,false);
assert.equal((await assessFinance712(current,base706,{...prior711,history_complete:false},[renewal],[evidenceRow()],now)).history_complete,false);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const required={
 'functions/api/admin/_cameraField702.mjs':[/export function signedMediaHorizonAge712/,
  /export function canReviewSignedMediaHorizon712/,/export function signedMediaHorizonReadback712/,
  /camera712_media_stability_horizon_review/],
 'functions/api/admin/mobile-create-product.js':[/camera712_inspect/,/camera712_signed_horizon_review/],
 'functions/api/admin/social-post-queue.js':[/export function originalNinthRenewalAge712/,
  /export async function assessFinance712/,/financial712:await finance712/,
  /params.get\('export'\)==='financial712'/,/owner_custody_followup_evidence_712/],
 'admin/mobile-product/index.html':[/id="dd712MediaHorizon"/,/id="dd712HorizonRecord"/],
 'admin/social-publishing/index.html':[/id="dd712-finance"/,/id="dd712CustodyForm"/],
 'public/js/admin-mobile-product-augment.js':[/function draw712\(/,/camera712_signed_horizon_review/],
 'public/js/admin-social-platform-preflight.js':[/function draw712\(/,/owner_custody_followup_evidence_712/,/export=financial712/],
 '.github/workflows/current-application-quality.yml':
  [/build712_signed_media_horizon_custody_evidence_ninth_renewal_drift_contract.mjs/]
};
for(const [file,checks] of Object.entries(required))
 for(const check of checks)assert.match(read(file),check,'Missing original Build 712 '+file);
console.log('BUILD 712 PASS: on-demand signed 24/48/72h D1/R2 horizon, authentic ninth-renewal drift detection, owner evidence replay and false external closure HOLD.');
