import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canOpenMediaRecurrence709,mediaRecurrenceAge709,canEscalateMediaRecurrence709} from '../functions/api/admin/_cameraField702.mjs';
import {renewalAge709,assessFinance709} from '../functions/api/admin/social-post-queue.js';
const now=Date.now(),iso=x=>new Date(now+x).toISOString(),h=3600000;
const signoff={admin_action_audit_id:870,data:{r2_key:'product/456/signed.jpg',verified_r2_bytes:4096}};
const recovered={admin_action_audit_id:960,data:{build:708,drift_receipt_id:925,original_signoff_receipt_id:870,
 original_signed_r2_key:signoff.data.r2_key,verified_current_r2_bytes:4096,
 status:'SOURCE_MATCHED_DRIFT_RECOVERY_REVALIDATED_UNRECORDED_HOLD_708'}};
const drift={stable:false,status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'};
const stable={stable:true,status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'};
assert.equal(canOpenMediaRecurrence709(recovered,signoff,drift),true);
assert.equal(canOpenMediaRecurrence709(recovered,signoff,stable),false);
assert.equal(canOpenMediaRecurrence709(null,signoff,drift),false);
for(const delta of [{original_signoff_receipt_id:999},{original_signed_r2_key:'different'},
 {verified_current_r2_bytes:999},{build:707},{status:'FAKE_RECOVERY'}])
 assert.equal(canOpenMediaRecurrence709({...recovered,data:{...recovered.data,...delta}},signoff,drift),false);
const recurrence={admin_action_audit_id:981,created_at:iso(-49*h),data:{build:709,
 recurrence_observed_status:drift.status,original_signoff_receipt_id:870,recovered_708_receipt_id:960}};
assert.equal(mediaRecurrenceAge709(recurrence,now).hours,49);
assert.equal(mediaRecurrenceAge709(recurrence,now).status,'CRITICAL_SIGNED_MEDIA_RECURRENCE_AGED_48H_709');
assert.equal(canEscalateMediaRecurrence709(recurrence,signoff,drift,now),true);
assert.equal(canEscalateMediaRecurrence709(recurrence,signoff,stable,now),false);
assert.equal(canEscalateMediaRecurrence709({...recurrence,created_at:iso(-23*h)},signoff,drift,now),false);
assert.equal(canEscalateMediaRecurrence709({...recurrence,data:{...recurrence.data,original_signoff_receipt_id:999}},signoff,drift,now),false);
assert.equal(canEscalateMediaRecurrence709({...recurrence,admin_action_audit_id:950},signoff,drift,now),false);
assert.equal(mediaRecurrenceAge709({created_at:iso(h)},now).escalation_due,false);
const sha='a'.repeat(64),digest='b'.repeat(64),manifest='c'.repeat(64);
const current={queue_id:19,source_revision:'source-709',fingerprint_sha256:sha,
 master_fresh:true,history_complete:true,open_cases:[]};
const base={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'original-ninth-706'};
const owner={review_706_receipt_id:610,retention_706_receipt_id:620,
 field_707_receipt_id:630,custody_707_receipt_id:640,
 continuity_708_receipt_id:670,custody_708_receipt_id:680,
 custody_708_digest_sha256:manifest,retention_manifest_sha256:digest,
 continuity_708_verified:true,custody_708_verified:true,
 continuity_708_recorded_at:iso(-70*h),custody_708_recorded_at:iso(-49.5*h)};
const prior={history_complete:true,items:[owner]};
assert.equal(renewalAge709(owner,now).age_hours,49);
assert.equal(renewalAge709(owner,now).escalation_due,true);
assert.equal(renewalAge709({...owner,custody_708_recorded_at:iso(-20*h)},now).escalation_due,false);
assert.equal(renewalAge709({...owner,custody_708_verified:false},now).age_hours,70);
assert.equal(renewalAge709({...owner,custody_708_recorded_at:'invalid'},now).escalation_due,false);
const at=now-10000,age=renewalAge709(owner,at);
const evidence={original_708_continuity_receipt_id:670,original_708_custody_receipt_id:680,
 original_ninth_review_receipt_id:610,original_706_retention_receipt_id:620,
 original_707_field_receipt_id:630,original_707_custody_receipt_id:640,
 original_706_manifest_sha256:digest,original_708_custody_digest_sha256:manifest,
 ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
 fingerprint_sha256:sha,observed_age_hours:age.age_hours,observed_age_status:age.status,
 independent_ninth_source_cryptographically_rechecked:true,
 owner_exception_reviewed:true,owner_user_id:3,
 resolution_note:'Original owner reviewed the independent ninth reviewer and source-bound custody escalation.',
 no_new_independent_signature_claimed:true,automatic_external_escalation_sent:false,
 bookkeeping_closed:false,financial_certified:false,auto_delete_scheduled:false};
const row=(patch={},id=693)=>({social_post_attempt_id:id,
 attempt_status:'owner_financial_custody_exception_escalation_709',
 attempted_at:new Date(at).toISOString(),response_json:JSON.stringify({...evidence,...patch})});
let report=await assessFinance709(current,base,prior,[],now);
assert.equal(report.status,'OWNER_FINANCIAL_RENEWAL_AGING_ESCALATION_DUE_709');
report=await assessFinance709(current,base,prior,[row()],now);
assert.equal(report.history_complete,true);
assert.equal(report.escalated_count,1);
assert.equal(report.bookkeeping_closed,false);
assert.equal(report.automated_external_escalation_sent,false);
for(const patch of [
 {original_708_continuity_receipt_id:999},{original_708_custody_receipt_id:999},
 {original_ninth_review_receipt_id:999},{original_706_retention_receipt_id:999},
 {original_707_field_receipt_id:999},{original_707_custody_receipt_id:999},
 {original_706_manifest_sha256:'f'.repeat(64)},{original_708_custody_digest_sha256:'f'.repeat(64)},
 {ninth_reviewer_id:'forged'},{source_revision:'stale'},{fingerprint_sha256:'f'.repeat(64)},
 {observed_age_hours:0},{observed_age_status:'forged'},
 {independent_ninth_source_cryptographically_rechecked:false},{owner_exception_reviewed:false},
 {owner_user_id:0},{resolution_note:'short'},{no_new_independent_signature_claimed:false},
 {automatic_external_escalation_sent:true},{bookkeeping_closed:true},{financial_certified:true},
 {auto_delete_scheduled:true}]){
 const v=await assessFinance709(current,base,prior,[row(patch)],now);
 assert.equal(v.history_complete,false,'Tampered escalation source must HOLD '+JSON.stringify(patch));
}
assert.equal((await assessFinance709(current,base,prior,[row(),row()],now)).history_complete,false);
assert.equal((await assessFinance709({...current,master_fresh:false},base,prior,[row()],now)).history_complete,false);
assert.equal((await assessFinance709({...current,open_cases:[{id:1}]},base,prior,[row()],now)).history_complete,false);
assert.equal((await assessFinance709(current,{...base,ninth_signer_configured:false},prior,[row()],now)).history_complete,false);
assert.equal((await assessFinance709(current,base,{...prior,history_complete:false},[row()],now)).history_complete,false);
assert.equal((await assessFinance709(current,base,{...prior,items:[{...owner,custody_708_recorded_at:iso(-1000000)}]},[row()],now)).history_complete,false);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const required={
 'functions/api/admin/_cameraField702.mjs':[/export function canOpenMediaRecurrence709/,/export function mediaRecurrenceAge709/,/export function canEscalateMediaRecurrence709/,/camera709_signed_media_recurrence_open/,/camera709_signed_media_recurrence_escalation/],
 'functions/api/admin/mobile-create-product.js':[/camera709_inspect/,/camera709_signed_recurrence_open/,/camera709_signed_recurrence_escalate/],
 'functions/api/admin/social-post-queue.js':[/export function renewalAge709/,/export async function assessFinance709/,/async function ownerCustodyExceptionEscalation709/,/financial709:await finance709/,/params.get\('export'\)==='financial709'/],
 'admin/mobile-product/index.html':[/id="dd709MediaRecurrence"/,/id="dd709RecurrenceRecord"/,/id="dd709EscalationRecord"/],
 'admin/social-publishing/index.html':[/id="dd709-finance"/,/id="dd709EscalationForm"/],
 'public/js/admin-mobile-product-augment.js':[/function draw709\(/,/camera709_signed_recurrence_open/,/camera709_signed_recurrence_escalate/],
 'public/js/admin-social-platform-preflight.js':[/function draw709\(/,/owner_financial_custody_exception_escalation_709/,/export=financial709/],
 '.github/workflows/current-application-quality.yml':[/build709_original_media_recurrence_ninth_aging_custody_escalation_contract.mjs/]
};
for(const [file,checks] of Object.entries(required))
 for(const pattern of checks)assert.match(read(file),pattern,'Build 709 missing '+file);
console.log('BUILD 709 PASS: original signed recurrence, renewal aging, independent source custody exception, all failed-closed boundaries and no automatic external escalation or financial close.');
