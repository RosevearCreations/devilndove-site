import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {postResolutionStabilityAge711,canRecordPostResolutionStability711,
 stabilityReceiptReadback711} from '../functions/api/admin/_cameraField702.mjs';
import {originalProvenanceAge711,ninthProvenanceRenewalManifest711,assessFinance711}
 from '../functions/api/admin/social-post-queue.js';
const now=Date.now(),h=3600000,iso=x=>new Date(now+x).toISOString();
const signoff={admin_action_audit_id:900,data:{r2_key:'products/original/linked.jpg',verified_r2_bytes:4865}};
const recurrence={admin_action_audit_id:1010,data:{build:709,original_signed_r2_key:signoff.data.r2_key,
 original_signed_r2_bytes:4865}};
const resolution={admin_action_audit_id:1040,created_at:iso(-26*h),data:{build:710,
 owner_resolution_decision:'accept_original_signed_source_only',
 physical_phone_independently_witnessed:false,unrecorded_uploads_closed:false,
 automatic_publication:false,recurrence_receipt_id:1010,
 original_signoff_receipt_id:900,original_signed_r2_key:signoff.data.r2_key,
 original_signed_r2_bytes:4865,
 restored_source_status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707',
 server_side_r2_head_rechecked:true}};
const latest={admin_action_audit_id:1060,data:{owner_re_attested:true,issued_at:iso(-h)}};
const stable={stable:true,status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'};
const drift={stable:false,status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'};
assert.equal(postResolutionStabilityAge711(resolution,now).age_hours,26);
assert.equal(postResolutionStabilityAge711(resolution,now).due,true);
assert.equal(postResolutionStabilityAge711({...resolution,created_at:iso(-23*h)},now).due,false);
assert.equal(postResolutionStabilityAge711({...resolution,created_at:'broken'},now).due,false);
assert.equal(postResolutionStabilityAge711({...resolution,created_at:iso(h)},now).due,false);
assert.equal(canRecordPostResolutionStability711(resolution,recurrence,signoff,latest,stable,now),true);
assert.equal(canRecordPostResolutionStability711(resolution,recurrence,signoff,latest,drift,now),false);
assert.equal(canRecordPostResolutionStability711(resolution,recurrence,signoff,
 {...latest,admin_action_audit_id:1030},stable,now),false);
assert.equal(canRecordPostResolutionStability711(resolution,recurrence,signoff,
 {...latest,data:{...latest.data,owner_re_attested:false}},stable,now),false);
assert.equal(canRecordPostResolutionStability711({...resolution,
 created_at:iso(-23*h)},recurrence,signoff,latest,stable,now),false);
assert.equal(canRecordPostResolutionStability711({...resolution,
 data:{...resolution.data,server_side_r2_head_rechecked:false}},
 recurrence,signoff,latest,stable,now),false);
const receipt={admin_action_audit_id:1080,data:{build:711,
 original_inspection_type:'signed_media_post_resolution_stability',
 original_710_resolution_receipt_id:1040,original_709_recurrence_receipt_id:1010,
 original_signoff_receipt_id:900,original_signed_r2_key:signoff.data.r2_key,
 original_signed_r2_bytes:4865,current_source_status:stable.status,
 independent_physical_phone_witnessed:false,unrecorded_uploads_closed:false,
 automatic_publication:false}};
assert.equal(stabilityReceiptReadback711(receipt,resolution,recurrence,signoff,stable),true);
assert.equal(stabilityReceiptReadback711(receipt,resolution,recurrence,signoff,drift),false);
for(const patch of [
 {original_710_resolution_receipt_id:1},{original_709_recurrence_receipt_id:3},
 {original_signoff_receipt_id:2},{original_signed_r2_key:'forged'},
 {original_signed_r2_bytes:0},{current_source_status:'NO_LIVE_HEAD'},
 {independent_physical_phone_witnessed:true},{unrecorded_uploads_closed:true},
 {automatic_publication:true}]){
 assert.equal(stabilityReceiptReadback711({...receipt,data:{...receipt.data,...patch}},
  resolution,recurrence,signoff,stable),false,'Forged signed-media evidence must HOLD '+JSON.stringify(patch));
}
const sha='a'.repeat(64),m706='b'.repeat(64),m708='c'.repeat(64),
 m710='d'.repeat(64),packet='e'.repeat(64);
const current={queue_id:55,master_fresh:true,history_complete:true,
 open_cases:[],source_revision:'original-711-source',fingerprint_sha256:sha};
const base={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'original-ed25519-706'};
const owner={review_706_receipt_id:201,retention_706_receipt_id:207,
 field_707_receipt_id:215,custody_707_receipt_id:223,
 continuity_708_receipt_id:231,custody_708_receipt_id:240,
 custody_exception_escalation_receipt_id_709:250,
 followup_710_receipt_id:270,provenance_710_receipt_id:280,
 provenance_710_digest_sha256:m710,provenance_710_recorded_at:iso(-31*h),
 retention_manifest_sha256:m706,custody_708_digest_sha256:m708,
 review_packet_sha256:packet,followup_710_verified:true,provenance_710_verified:true};
const prior={history_complete:true,items:[owner]};
assert.equal(originalProvenanceAge711(owner,now).age_hours,31);
assert.equal(originalProvenanceAge711({...owner,provenance_710_recorded_at:'invalid'},now).age_hours,null);
const outcome={queue_id:55,original_710_provenance_receipt_id:280,
 original_710_followup_receipt_id:270,original_709_escalation_receipt_id:250,
 original_ninth_review_receipt_id:201,original_706_manifest_sha256:m706,
 original_708_custody_digest_sha256:m708,original_710_provenance_sha256:m710,
 ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
 fingerprint_sha256:sha,followup_outcome:'owner_original_source_review_documented',
 original_ninth_provenance_rechecked:true,owner_reconciliation_reviewed:true,
 owner_user_id:7,resolution_note:'Original signed ninth reviewer and retained custody evidence reviewed by the owner.',
 external_contact_confirmed:false,new_independent_signature_obtained:false,
 bookkeeping_closed:false,financial_certified:false};
const outcomeRow=(patch={},id=300)=>({social_post_attempt_id:id,
 attempt_status:'owner_custody_followup_outcome_reconciliation_711',
 attempted_at:iso(-60000),response_json:JSON.stringify({...outcome,...patch})});
const manifest={queue_id:55,original_ninth_review_receipt_id:201,
 original_706_retention_receipt_id:207,original_707_field_receipt_id:215,
 original_707_custody_receipt_id:223,original_708_continuity_receipt_id:231,
 original_708_custody_receipt_id:240,original_709_escalation_receipt_id:250,
 original_710_followup_receipt_id:270,original_710_provenance_receipt_id:280,
 original_711_reconciliation_receipt_id:300,
 original_706_manifest_sha256:m706,original_708_custody_digest_sha256:m708,
 original_710_provenance_sha256:m710,review_packet_sha256:packet,
 ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
 fingerprint_sha256:sha};
const bytes=await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(JSON.stringify(ninthProvenanceRenewalManifest711(manifest))));
const renewal_manifest_sha256=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
const renewal={...manifest,renewal_manifest_sha256,
 original_ninth_signature_source_reverified:true,owner_provenance_reviewed:true,
 owner_user_id:7,resolution_note:'Independently signed original ninth review and all provenance receipts reverified.',
 external_contact_confirmed:false,new_independent_signature_obtained:false,
 bookkeeping_closed:false,financial_certified:false};
const renewalRow=(patch={},id=320)=>({social_post_attempt_id:id,
 attempt_status:'owner_ninth_provenance_renewal_audit_711',
 attempted_at:iso(-30000),response_json:JSON.stringify({...renewal,...patch})});
let q=await assessFinance711(current,base,prior,[],[],now);
assert.equal(q.status,'OWNER_CUSTODY_FOLLOWUP_OUTCOME_RECONCILIATION_REQUIRED_711');
assert.equal(q.eligible_count,1);
q=await assessFinance711(current,base,prior,[outcomeRow()],[],now);
assert.equal(q.history_complete,true);
assert.equal(q.outcome_reconciled_count,1);
assert.equal(q.status,'OWNER_CUSTODY_OUTCOME_RECORDED_PROVENANCE_RENEWAL_REQUIRED_711');
q=await assessFinance711(current,base,prior,[outcomeRow()],[renewalRow()],now);
assert.equal(q.history_complete,true);
assert.equal(q.status,'ORIGINAL_NINTH_REVIEWER_PROVENANCE_RENEWED_BOOKS_HOLD_711');
assert.equal(q.provenance_renewed_count,1);
assert.equal(q.items[0].renewal_manifest_sha256_711,renewal_manifest_sha256);
assert.equal(q.bookkeeping_closed,false);
assert.equal(q.external_contact_verified,false);
for(const patch of [
 {queue_id:99},{original_710_provenance_receipt_id:99},
 {original_710_followup_receipt_id:99},{original_709_escalation_receipt_id:99},
 {original_ninth_review_receipt_id:99},{original_706_manifest_sha256:'f'.repeat(64)},
 {original_708_custody_digest_sha256:'f'.repeat(64)},
 {original_710_provenance_sha256:'f'.repeat(64)},{ninth_reviewer_id:'fake'},
 {source_revision:'old'},{fingerprint_sha256:'f'.repeat(64)},
 {followup_outcome:'independently_contacted_and_books_closed'},
 {original_ninth_provenance_rechecked:false},{owner_reconciliation_reviewed:false},
 {owner_user_id:0},{resolution_note:'too short'},{external_contact_confirmed:true},
 {new_independent_signature_obtained:true},{bookkeeping_closed:true},
 {financial_certified:true}]){
 assert.equal((await assessFinance711(current,base,prior,[outcomeRow(patch)],[],now)).history_complete,false,
  'Tampered source outcome must HOLD '+JSON.stringify(patch));
}
for(const patch of [
 {queue_id:99},{original_ninth_review_receipt_id:99},
 {original_706_retention_receipt_id:99},{original_707_field_receipt_id:99},
 {original_707_custody_receipt_id:99},{original_708_continuity_receipt_id:99},
 {original_708_custody_receipt_id:99},{original_709_escalation_receipt_id:99},
 {original_710_followup_receipt_id:99},{original_710_provenance_receipt_id:99},
 {original_711_reconciliation_receipt_id:99},
 {original_706_manifest_sha256:'f'.repeat(64)},
 {original_708_custody_digest_sha256:'f'.repeat(64)},
 {original_710_provenance_sha256:'f'.repeat(64)},
 {review_packet_sha256:'f'.repeat(64)},{ninth_reviewer_id:'forged'},
 {source_revision:'stale'},{fingerprint_sha256:'f'.repeat(64)},
 {renewal_manifest_sha256:'f'.repeat(64)},{owner_provenance_reviewed:false},
 {original_ninth_signature_source_reverified:false},{owner_user_id:0},
 {resolution_note:'short'},{external_contact_confirmed:true},
 {new_independent_signature_obtained:true},{bookkeeping_closed:true},
 {financial_certified:true}]){
 assert.equal((await assessFinance711(current,base,prior,[outcomeRow()],[renewalRow(patch)],now)).history_complete,false,
  'Tampered reviewer renewal must HOLD '+JSON.stringify(patch));
}
assert.equal((await assessFinance711(current,base,prior,[outcomeRow(),outcomeRow()],[],now)).history_complete,false);
assert.equal((await assessFinance711(current,base,prior,[outcomeRow()],[renewalRow(),renewalRow()],now)).history_complete,false);
assert.equal((await assessFinance711({...current,master_fresh:false},base,prior,[outcomeRow()],[renewalRow()],now)).history_complete,false);
assert.equal((await assessFinance711({...current,open_cases:[{id:1}]},base,prior,[outcomeRow()],[renewalRow()],now)).history_complete,false);
assert.equal((await assessFinance711(current,{...base,ninth_signer_configured:false},prior,[outcomeRow()],[renewalRow()],now)).history_complete,false);
assert.equal((await assessFinance711(current,base,{...prior,history_complete:false},[outcomeRow()],[renewalRow()],now)).history_complete,false);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const required={
 'functions/api/admin/_cameraField702.mjs':[/export function postResolutionStabilityAge711/,
  /export function canRecordPostResolutionStability711/,
  /export function stabilityReceiptReadback711/,/camera711_post_resolution_stability_receipt/],
 'functions/api/admin/mobile-create-product.js':[/camera711_inspect/,/camera711_post_resolution_stability/],
 'functions/api/admin/social-post-queue.js':[/export function originalProvenanceAge711/,
  /export function ninthProvenanceRenewalManifest711/,/export async function assessFinance711/,
  /financial711:await finance711/,/params.get\('export'\)==='financial711'/,
  /owner_custody_followup_outcome_reconciliation_711/,/owner_ninth_provenance_renewal_audit_711/],
 'admin/mobile-product/index.html':[/id="dd711MediaStability"/,/id="dd711StabilityRecord"/],
 'admin/social-publishing/index.html':[/id="dd711-finance"/,/id="dd711OutcomeForm"/,/id="dd711RenewalForm"/],
 'public/js/admin-mobile-product-augment.js':[/function draw711\(/,/camera711_post_resolution_stability/],
 'public/js/admin-social-platform-preflight.js':[/function draw711\(/,/owner_custody_followup_outcome_reconciliation_711/,/owner_ninth_provenance_renewal_audit_711/,/export=financial711/],
 '.github/workflows/current-application-quality.yml':
  [/build711_post_resolution_stability_custody_outcome_ninth_renewal_contract.mjs/]
};
for(const [file,checks] of Object.entries(required))
 for(const check of checks)assert.match(read(file),check,'Missing Build 711 contract '+file);
console.log('BUILD 711 PASS: source-confirmed post-resolution stability, protected original custody outcome, SHA-256 ninth-source renewal, replay/drift/false closure HOLD.');
