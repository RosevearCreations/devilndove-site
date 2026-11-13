import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditSignoffDrift707} from '../functions/api/admin/_cameraField702.mjs';
import {assessFinance707} from '../functions/api/admin/social-post-queue.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.now(),stamp=offset=>new Date(now+offset).toISOString(),sha='a'.repeat(64);
const media={kind:'photo',attachment_id:4,r2_key:'product/554/original.jpg',
 r2_bytes:4096,confirmed:true,publication_status:'draft'};
const linked={receipt_id:520,kind:'linked',closed:true,media_kind:'photo',attachment_id:4,
 r2_key:media.r2_key,original_701_receipt_id:111};
const recovery={admin_action_audit_id:850,created_at:stamp(-3000000),
 data:{open_receipt_id:520,recovery_kind:'LINKED_D1_ATTACHMENT_R2_HEAD_VERIFIED_ONLY',
  followup_receipt_id:770,original_reattest_receipt_id:840,r2_key:media.r2_key,
  r2_bytes:4096,media_kind:'photo',attachment_id:4}};
const closure={admin_action_audit_id:950,created_at:stamp(-2000000),
 data:{open_receipt_id:520,status:'CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY',
  reattest_receipt_id:845,r2_key:media.r2_key,verified_r2_bytes:4096,
  media_kind:'photo',attachment_id:4}};
const latest={data:{owner_re_attested:true,original_701_receipt_id:111,
 media_snapshot:[media],issued_at:stamp(-100000)}};
const live={media:[media]};
const signoff={admin_action_audit_id:980,created_at:stamp(-1500000),
 data:{open_receipt_id:520,recovery_receipt_id:850,closure_receipt_id:950,
  owner_signoff_decision:'accept_verified_linked_recovery_only',
  original_issue_closed_by_explicit_owner_action:true,
  physical_device_independently_witnessed:false,
  unrecorded_upload_recovery_certified:false,financial_closed:false,
  media_kind:'photo',attachment_id:4,r2_key:media.r2_key,verified_r2_bytes:4096}};
assert.equal(auditSignoffDrift707(linked,recovery,closure,signoff,latest,media,live,now).stable,true);
for(const bad of [
 {o:{...linked,closed:false}},{o:{...linked,kind:'unrecorded'}},
 {r:{...recovery,admin_action_audit_id:849}},
 {c:{...closure,admin_action_audit_id:981}},
 {s:{...signoff,data:{...signoff.data,open_receipt_id:521}}},
 {s:{...signoff,data:{...signoff.data,verified_r2_bytes:9999}}},
 {s:{...signoff,data:{...signoff.data,physical_device_independently_witnessed:true}}},
 {s:{...signoff,data:{...signoff.data,financial_closed:true}}},
 {s:{...signoff,created_at:stamp(-99999999)}},
 {m:{...media,confirmed:false}},{m:{...media,r2_bytes:3000}},
 {m:{...media,r2_key:'different'}},
 {l:{media:[]}},{t:{data:{...latest.data,issued_at:stamp(-90000000)}}}
]){
 const args=[bad.o||linked,bad.r||recovery,bad.c||closure,bad.s||signoff,bad.t||latest,
  bad.m||media,bad.l||live,now];
 const result=auditSignoffDrift707(...args);
 assert.equal(result.stable,false,'Original sign-off drift must HOLD '+JSON.stringify(bad));
 assert.match(result.status,/^HOLD_707_/);
}
const current={queue_id:17,source_revision:'src-707',fingerprint_sha256:sha,
 master_fresh:true,history_complete:true,open_cases:[]};
const source={review_706_receipt_id:615,retention_706_receipt_id:616,
 continuity_receipt_id:613,review_706_verified:true,retention_706_verified:true,
 review_packet_sha256:'b'.repeat(64),retention_manifest_sha256:'c'.repeat(64)};
const base={history_complete:true,ninth_signer_id:'independent_ninth_706',items:[source]};
const f={original_ninth_review_receipt_id:615,original_retention_receipt_id:616,
 continuity_receipt_id:613,review_packet_sha256:source.review_packet_sha256,
 retention_manifest_sha256:source.retention_manifest_sha256,ninth_reviewer_id:base.ninth_signer_id,
 source_revision:current.source_revision,fingerprint_sha256:sha,
 owner_original_field_reviewed:true,owner_user_id:3,
 resolution_note:'Original owner reviewed the independent signed ninth source evidence in the field.',
 independent_ninth_signature_source_verified:true,
 physical_device_independently_witnessed:false,bookkeeping_closed:false,
 financial_certified:false,continuous_connection_verified:false};
const field=(changes={},id=620)=>({social_post_attempt_id:id,
 attempt_status:'owner_ninth_reviewer_field_acceptance_707',
 attempted_at:stamp(-20000),response_json:JSON.stringify({...f,...changes})});
const c={field_acceptance_receipt_id:620,original_ninth_review_receipt_id:615,
 original_retention_receipt_id:616,retention_manifest_sha256:source.retention_manifest_sha256,
 review_packet_sha256:source.review_packet_sha256,ninth_reviewer_id:base.ninth_signer_id,
 source_revision:current.source_revision,fingerprint_sha256:sha,owner_custody_reviewed:true,
 owner_user_id:3,source_manifest_digest_revalidated:true,
 resolution_note:'Original owner reconciled the retained SHA-256 manifest to ninth signed source evidence.',
 auto_delete_requested:false,bookkeeping_closed:false,financial_certified:false,
 continuous_connection_verified:false};
const custody=(changes={},id=625)=>({social_post_attempt_id:id,
 attempt_status:'owner_financial_custody_audit_707',
 attempted_at:stamp(-10000),response_json:JSON.stringify({...c,...changes})});
let x=assessFinance707(current,base,[],[],now);
assert.equal(x.status,'HOLD_707_ORIGINAL_NINTH_REVIEW_FIELD_ACCEPTANCE_REQUIRED');
x=assessFinance707(current,base,[field()],[],now);
assert.equal(x.status,'OWNER_NINTH_REVIEW_FIELD_ACCEPTED_CUSTODY_AUDIT_HOLD');
assert.equal(x.field_accepted_count,1);
x=assessFinance707(current,base,[field()],[custody()],now);
assert.equal(x.status,'OWNER_SOURCE_BOUND_NINTH_REVIEW_AND_CUSTODY_AUDITED_BOOKS_HOLD');
assert.equal(x.history_complete,true);
assert.equal(x.audited_custody_count,1);
assert.equal(x.bookkeeping_closed,false);assert.equal(x.financial_certified,false);
assert.equal(x.independent_physical_device_witnessed,false);
for(const tamper of [
 {original_ninth_review_receipt_id:999},{original_retention_receipt_id:999},
 {continuity_receipt_id:999},{review_packet_sha256:'x'.repeat(64)},
 {retention_manifest_sha256:'x'.repeat(64)},{ninth_reviewer_id:'forged'},
 {source_revision:'stale'},{fingerprint_sha256:'a'.repeat(63)+'b'},
 {owner_original_field_reviewed:false},{owner_user_id:0},
 {independent_ninth_signature_source_verified:false},
 {physical_device_independently_witnessed:true},
 {bookkeeping_closed:true},{financial_certified:true},
 {continuous_connection_verified:true},{resolution_note:'short'}
]){
 const y=assessFinance707(current,base,[field(tamper)],[],now);
 assert.equal(y.history_complete,false,'Field evidence tamper must HOLD '+JSON.stringify(tamper));
}
for(const tamper of [
 {field_acceptance_receipt_id:999},{original_ninth_review_receipt_id:999},
 {original_retention_receipt_id:999},{retention_manifest_sha256:'d'.repeat(64)},
 {review_packet_sha256:'d'.repeat(64)},{ninth_reviewer_id:'forged'},
 {source_revision:'stale'},{fingerprint_sha256:'d'.repeat(64)},
 {owner_custody_reviewed:false},{owner_user_id:0},
 {source_manifest_digest_revalidated:false},
 {auto_delete_requested:true},{bookkeeping_closed:true},
 {financial_certified:true},{continuous_connection_verified:true},
 {resolution_note:'short'}
]){
 const y=assessFinance707(current,base,[field()],[custody(tamper)],now);
 assert.equal(y.history_complete,false,'Custody source drift must HOLD '+JSON.stringify(tamper));
}
assert.equal(assessFinance707(current,base,[field(),field()],[],now).history_complete,false);
assert.equal(assessFinance707(current,base,[field()],[custody(),custody()],now).history_complete,false);
assert.equal(assessFinance707({...current,master_fresh:false},base,[field()],[custody()],now).history_complete,false);
assert.equal(assessFinance707({...current,open_cases:[{id:1}]},base,[field()],[custody()],now).history_complete,false);
assert.equal(assessFinance707(current,{...base,history_complete:false},[field()],[custody()],now).history_complete,false);
assert.equal(assessFinance707(current,{...base,items:[{...source,retention_706_verified:false}]},[field()],[custody()],now).history_complete,false);
const contract={
 'functions/api/admin/_cameraField702.mjs':[/export function auditSignoffDrift707/,
  /camera707_inspect/,/signed_media_recheck_hold_count_707/,/SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707/],
 'functions/api/admin/mobile-create-product.js':[/camera707_inspect/],
 'admin/mobile-product/index.html':[/id="dd707MediaAudit"/,/id="dd707MediaAuditRefresh"/],
 'public/js/admin-mobile-product-augment.js':[/function draw707\(/,/camera707_inspect/],
 'functions/api/admin/social-post-queue.js':[/export function assessFinance707/,
  /async function originalNinthFieldAcceptance707/,/async function originalFinancialCustodyAudit707/,
  /financial707:await finance707/,/export'\)==='financial707'/],
 'admin/social-publishing/index.html':[/id="dd707-finance"/,/id="dd707FieldForm"/,/id="dd707CustodyForm"/],
 'public/js/admin-social-platform-preflight.js':[/function draw707\(/,/owner_ninth_reviewer_field_acceptance_707/,
  /owner_financial_custody_audit_707/,/export=financial707/],
 '.github/workflows/current-application-quality.yml':[/build707_ninth_field_media_drift_custody_contract.mjs/]
};
for(const [path,patterns] of Object.entries(contract)){
 for(const pattern of patterns)assert.match(read(path),pattern,'Missing Build 707 contract '+path);
}
console.log('BUILD 707 PASS: field review source pins, protected ninth-signer chain, D1/R2 on-demand signoff drift, custody digest mismatch HOLD, no fabricated book closure.');
