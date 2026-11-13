import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditSignoffDrift707,canOpenSignedDrift708,canReconcileSignedDrift708}
 from '../functions/api/admin/_cameraField702.mjs';
import {assessFinance708,custodyRenewalManifest708}
 from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.now(),time=delta=>new Date(now+delta).toISOString();
const media={kind:'photo',attachment_id:4,r2_key:'product/554/original.jpg',
 r2_bytes:4096,confirmed:true,publication_status:'draft'};
const open={receipt_id:520,kind:'linked',closed:true,media_kind:'photo',
 attachment_id:4,r2_key:media.r2_key,original_701_receipt_id:111};
const recovery={admin_action_audit_id:850,created_at:time(-3300000),
 data:{open_receipt_id:520,recovery_kind:'LINKED_D1_ATTACHMENT_R2_HEAD_VERIFIED_ONLY',
 followup_receipt_id:770,original_reattest_receipt_id:840,r2_key:media.r2_key,
 r2_bytes:4096,media_kind:'photo',attachment_id:4}};
const closure={admin_action_audit_id:950,created_at:time(-2500000),
 data:{open_receipt_id:520,status:'CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY',
 reattest_receipt_id:845,r2_key:media.r2_key,verified_r2_bytes:4096,
 media_kind:'photo',attachment_id:4}};
const signoff={admin_action_audit_id:980,created_at:time(-2200000),
 data:{open_receipt_id:520,recovery_receipt_id:850,closure_receipt_id:950,
 owner_signoff_decision:'accept_verified_linked_recovery_only',
 original_issue_closed_by_explicit_owner_action:true,
 physical_device_independently_witnessed:false,unrecorded_upload_recovery_certified:false,
 financial_closed:false,media_kind:'photo',attachment_id:4,
 r2_key:media.r2_key,verified_r2_bytes:4096}};
const latest={admin_action_audit_id:1030,data:{owner_re_attested:true,
 original_701_receipt_id:111,media_snapshot:[media],issued_at:time(-60000)}};
const live={media:[media]};
const stable=auditSignoffDrift707(open,recovery,closure,signoff,latest,media,live,now);
assert.equal(stable.stable,true);
assert.equal(canOpenSignedDrift708(open,signoff,stable),false);
const damaged={...media,confirmed:false,r2_bytes:0};
const observed=auditSignoffDrift707(open,recovery,closure,signoff,latest,damaged,{media:[damaged]},now);
assert.equal(canOpenSignedDrift708(open,signoff,observed),true);
assert.equal(canOpenSignedDrift708({...open,kind:'unrecorded'},signoff,observed),false);
const drift={admin_action_audit_id:1020,created_at:time(-160000),
 data:{build:708,open_receipt_id:520,original_signoff_receipt_id:980,
 drift_observed_status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT',
 original_signed_r2_key:media.r2_key,original_signed_r2_bytes:4096}};
assert.equal(canReconcileSignedDrift708(drift,signoff,latest,stable,now),true);
for(const [d,s,t,proof] of [
 [{...drift,data:{...drift.data,build:707}},signoff,latest,stable],
 [{...drift,data:{...drift.data,original_signoff_receipt_id:981}},signoff,latest,stable],
 [{...drift,data:{...drift.data,original_signed_r2_key:'different'}},signoff,latest,stable],
 [{...drift,data:{...drift.data,original_signed_r2_bytes:8000}},signoff,latest,stable],
 [{...drift,admin_action_audit_id:900},signoff,latest,stable],
 [drift,signoff,{...latest,admin_action_audit_id:1010},stable],
 [drift,signoff,{...latest,data:{...latest.data,issued_at:time(-300000)}},stable],
 [drift,signoff,{...latest,data:{...latest.data,owner_re_attested:false}},stable],
 [drift,signoff,latest,observed]
 ]){
  assert.equal(canReconcileSignedDrift708(d,s,t,proof,now),false,
    'Original drift recovery must fail closed on tamper/stale/no R2 recovery');
 }
const sha='a'.repeat(64),digest='c'.repeat(64),packet='d'.repeat(64);
const current={queue_id:17,source_revision:'src-708',fingerprint_sha256:sha,
 master_fresh:true,history_complete:true,open_cases:[]};
const base={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'original-independent-ninth-706'};
const item={review_706_receipt_id:615,retention_706_receipt_id:616,
 field_707_receipt_id:620,custody_707_receipt_id:625,
 field_707_recorded_at:time(-3600000),review_706_verified:true,
 retention_706_verified:true,field_707_verified:true,custody_707_verified:true,
 review_packet_sha256:packet,retention_manifest_sha256:digest};
const prior={history_complete:true,items:[item]};
const a={original_707_field_receipt_id:620,original_707_custody_receipt_id:625,
 original_ninth_review_receipt_id:615,original_706_retention_receipt_id:616,
 original_706_manifest_sha256:digest,review_packet_sha256:packet,
 ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
 fingerprint_sha256:sha,renewal_nonce:'finance708-independent-review-unique-test-nonce',
 original_ninth_signature_reverified:true,new_independent_signature_claimed:false,
 owner_continuity_reviewed:true,owner_user_id:3,
 resolution_note:'Original owner checked the independent ninth signature and exact prior custody SHA source again.',
 physical_device_independently_witnessed:false,bookkeeping_closed:false,
 financial_certified:false,continuous_connection_verified:false};
const acceptance=(changes={},id=630)=>({social_post_attempt_id:id,
 attempt_status:'owner_ninth_reviewer_continuity_708',
 attempted_at:time(-18000),response_json:JSON.stringify({...a,...changes})});
const manifest={queue_id:17,original_ninth_review_receipt_id:615,
 original_706_retention_receipt_id:616,original_707_field_receipt_id:620,
 original_707_custody_receipt_id:625,owner_continuity_receipt_id:630,
 original_706_manifest_sha256:digest,review_packet_sha256:packet,
 ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
 fingerprint_sha256:sha};
const hashed=bytes=>[...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
const renewal_manifest_sha256=hashed(await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(JSON.stringify(custodyRenewalManifest708(manifest)))));
const c={...manifest,renewal_manifest_sha256,owner_custody_rechecked:true,
 owner_user_id:3,resolution_note:'Original owner rechecked the retained independent signed source and canonical SHA evidence chain.',
 auto_delete_scheduled:false,bookkeeping_closed:false,
 financial_certified:false,continuous_connection_verified:false};
const custody=(changes={},id=635)=>({social_post_attempt_id:id,
 attempt_status:'owner_financial_custody_renewal_708',
 attempted_at:time(-5000),response_json:JSON.stringify({...c,...changes})});
let x=await assessFinance708(current,base,prior,[],[],now);
assert.equal(x.status,'HOLD_708_NINTH_REVIEWER_ACCEPTANCE_CONTINUITY_REQUIRED');
x=await assessFinance708(current,base,prior,[acceptance()],[],now);
assert.equal(x.history_complete,true);
assert.equal(x.status,'NINTH_ACCEPTANCE_CONTINUITY_RENEWED_CUSTODY_RECHECK_HOLD');
x=await assessFinance708(current,base,prior,[acceptance()],[custody()],now);
assert.equal(x.status,'SOURCE_BOUND_FINANCIAL_CUSTODY_RENEWED_MANUAL_BOOK_CLOSE_HOLD');
assert.equal(x.renewed_acceptance_count,1);
assert.equal(x.renewed_custody_count,1);
assert.equal(x.items[0].custody_708_digest_sha256,renewal_manifest_sha256);
assert.equal(x.bookkeeping_closed,false);
assert.equal(x.financial_certified,false);
assert.equal(x.new_independent_signature_generated,false);
for(const bad of [
 {original_707_field_receipt_id:999},{original_707_custody_receipt_id:999},
 {original_ninth_review_receipt_id:999},{original_706_retention_receipt_id:999},
 {original_706_manifest_sha256:'f'.repeat(64)},{review_packet_sha256:'f'.repeat(64)},
 {ninth_reviewer_id:'forged'},{source_revision:'stale'},
 {fingerprint_sha256:'f'.repeat(64)},{renewal_nonce:'too-short'},
 {original_ninth_signature_reverified:false},{new_independent_signature_claimed:true},
 {owner_continuity_reviewed:false},{owner_user_id:0},{resolution_note:'short'},
 {physical_device_independently_witnessed:true},{bookkeeping_closed:true},
 {financial_certified:true},{continuous_connection_verified:true}
 ]){
 const result=await assessFinance708(current,base,prior,[acceptance(bad)],[],now);
 assert.equal(result.history_complete,false,'Original signature acceptance drift must HOLD '+JSON.stringify(bad));
}
for(const bad of [
 {queue_id:999},{original_ninth_review_receipt_id:999},
 {original_706_retention_receipt_id:999},{original_707_field_receipt_id:999},
 {original_707_custody_receipt_id:999},{owner_continuity_receipt_id:999},
 {original_706_manifest_sha256:'f'.repeat(64)},{review_packet_sha256:'f'.repeat(64)},
 {ninth_reviewer_id:'forged'},{source_revision:'stale'},
 {fingerprint_sha256:'f'.repeat(64)},{renewal_manifest_sha256:'f'.repeat(64)},
 {owner_custody_rechecked:false},{owner_user_id:0},{resolution_note:'short'},
 {auto_delete_scheduled:true},{bookkeeping_closed:true},{financial_certified:true},
 {continuous_connection_verified:true}
 ]){
 const result=await assessFinance708(current,base,prior,[acceptance()],[custody(bad)],now);
 assert.equal(result.history_complete,false,'Source-custody renewal drift must HOLD '+JSON.stringify(bad));
}
assert.equal((await assessFinance708(current,base,prior,[acceptance(),acceptance()],[],now)).history_complete,false);
assert.equal((await assessFinance708(current,base,prior,[acceptance()],[custody(),custody()],now)).history_complete,false);
assert.equal((await assessFinance708({...current,master_fresh:false},base,prior,[acceptance()],[custody()],now)).history_complete,false);
assert.equal((await assessFinance708({...current,open_cases:[{id:1}]},base,prior,[acceptance()],[custody()],now)).history_complete,false);
assert.equal((await assessFinance708(current,{...base,ninth_signer_configured:false},prior,[acceptance()],[custody()],now)).history_complete,false);
assert.equal((await assessFinance708(current,base,{...prior,history_complete:false},[acceptance()],[custody()],now)).history_complete,false);
for(const [path,patterns] of Object.entries({
 'functions/api/admin/_cameraField702.mjs':[/export function canOpenSignedDrift708/,
  /export function canReconcileSignedDrift708/,/camera708_signed_media_drift_open/,
  /camera708_signed_media_drift_recovered/,/signed_drift_recovery_ready_708/],
 'functions/api/admin/mobile-create-product.js':[/camera708_inspect/,/camera708_signed_drift_open/,/camera708_signed_drift_revalidate/],
 'admin/mobile-product/index.html':[/id="dd708MediaRecovery"/,/id="dd708DriftRecord"/,/id="dd708RecoveryRecord"/],
 'public/js/admin-mobile-product-augment.js':[/function draw708\(/,/camera708_signed_drift_open/,/camera708_signed_drift_revalidate/],
 'functions/api/admin/social-post-queue.js':[/export async function assessFinance708/,
  /export function custodyRenewalManifest708/,/async function ownerNinthAcceptanceContinuity708/,
  /async function ownerCustodyRenewal708/,/financial708:await finance708/,
  /params.get\('export'\)==='financial708'/],
 'admin/social-publishing/index.html':[/id="dd708-finance"/,/id="dd708ContinuityForm"/,/id="dd708CustodyForm"/],
 'public/js/admin-social-platform-preflight.js':[/function draw708\(/,/owner_ninth_reviewer_continuity_708/,
  /owner_financial_custody_renewal_708/,/export=financial708/],
 '.github/workflows/current-application-quality.yml':[/build708_signed_media_recovery_ninth_continuity_custody_contract.mjs/]
 })){
 for(const pattern of patterns)assert.match(read(path),pattern,'Build 708 source contract '+path);
}
console.log('BUILD 708 PASS: original D1/R2 signed drift source-only recovery, protected ninth signature continuity, SHA-256 custody renewal, replay/tamper HOLD and no fabricated financial close.');
