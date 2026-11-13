import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canResolveOriginalRecurrence710,recurrenceResolutionReadback710}
 from '../functions/api/admin/_cameraField702.mjs';
import {custodyEscalationFollowupAge710,ninthProvenanceManifest710,assessFinance710}
 from '../functions/api/admin/social-post-queue.js';
const now=Date.now(),iso=x=>new Date(now+x).toISOString(),h=3600000;
const signed={admin_action_audit_id:900,data:{r2_key:'product/original/media.jpg',verified_r2_bytes:4512}};
const recovered={admin_action_audit_id:950,data:{build:708}};
const recurrence={admin_action_audit_id:990,created_at:iso(-2*h),data:{build:709,
 status:'RECURRENT_SIGNED_ORIGINAL_MEDIA_DRIFT_OPEN_OWNER_HOLD_709',
 recurrence_observed_status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT',
 recovered_708_receipt_id:950,original_signoff_receipt_id:900,
 original_signed_r2_key:signed.data.r2_key,original_signed_r2_bytes:4512}};
const latest={admin_action_audit_id:1003,data:{issued_at:iso(-h),owner_re_attested:true}};
const stable={stable:true,status:'SIGNED_LINKED_MEDIA_SOURCE_STABLE_ON_DEMAND_707'},
 drift={stable:false,status:'HOLD_707_SIGNED_MEDIA_D1_R2_DRIFT'};
assert.equal(canResolveOriginalRecurrence710(recurrence,recovered,signed,latest,stable,now),true);
for(const source of [
 {...recurrence,admin_action_audit_id:945},
 {...recurrence,data:{...recurrence.data,build:708}},
 {...recurrence,data:{...recurrence.data,recovered_708_receipt_id:951}},
 {...recurrence,data:{...recurrence.data,original_signoff_receipt_id:901}},
 {...recurrence,data:{...recurrence.data,original_signed_r2_key:'other'}},
 {...recurrence,data:{...recurrence.data,original_signed_r2_bytes:0}},
 {...recurrence,data:{...recurrence.data,status:'HOLD_INVALID_ORIGINAL'}}
 ])assert.equal(canResolveOriginalRecurrence710(source,recovered,signed,latest,stable,now),false);
assert.equal(canResolveOriginalRecurrence710(recurrence,recovered,signed,latest,drift,now),false);
assert.equal(canResolveOriginalRecurrence710(recurrence,recovered,signed,
 {...latest,admin_action_audit_id:980},stable,now),false);
assert.equal(canResolveOriginalRecurrence710(recurrence,recovered,signed,
 {...latest,data:{...latest.data,issued_at:iso(-3*h)}},stable,now),false);
assert.equal(canResolveOriginalRecurrence710(recurrence,recovered,signed,
 {...latest,data:{...latest.data,owner_re_attested:false}},stable,now),false);
const resolution={admin_action_audit_id:1011,data:{build:710,
 owner_resolution_decision:'accept_original_signed_source_only',
 physical_phone_independently_witnessed:false,unrecorded_uploads_closed:false,
 automatic_publication:false,recurrence_receipt_id:990,
 original_signoff_receipt_id:900,original_signed_r2_key:signed.data.r2_key,
 original_signed_r2_bytes:4512,restored_source_status:stable.status}};
assert.equal(recurrenceResolutionReadback710(resolution,recurrence,signed,stable),true);
assert.equal(recurrenceResolutionReadback710(resolution,recurrence,signed,drift),false);
for(const patch of [{physical_phone_independently_witnessed:true},
 {unrecorded_uploads_closed:true},{automatic_publication:true},
 {recurrence_receipt_id:999},{original_signed_r2_bytes:20},
 {restored_source_status:'forged'}])
 assert.equal(recurrenceResolutionReadback710({...resolution,data:{...resolution.data,...patch}},
  recurrence,signed,stable),false);
const sha='a'.repeat(64),manifest='b'.repeat(64),digest='c'.repeat(64),packet='d'.repeat(64);
const current={queue_id:25,master_fresh:true,history_complete:true,open_cases:[],
 source_revision:'original-finance-710',fingerprint_sha256:sha};
const base={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'original-ed25519-ninth-706'};
const item={custody_exception_escalated_709:true,
 custody_exception_escalation_receipt_id_709:300,
 review_706_receipt_id:240,retention_706_receipt_id:245,
 field_707_receipt_id:250,custody_707_receipt_id:260,
 continuity_708_receipt_id:280,custody_708_receipt_id:290,
 retention_manifest_sha256:manifest,custody_708_digest_sha256:digest,
 review_packet_sha256:packet};
const prior={history_complete:true,items:[item]};
const escalation={social_post_attempt_id:300,attempt_status:'owner_financial_custody_exception_escalation_709',
 attempted_at:iso(-50*h),response_json:JSON.stringify({
 original_708_continuity_receipt_id:280,original_ninth_review_receipt_id:240,
 original_706_manifest_sha256:manifest,original_708_custody_digest_sha256:digest,
 ninth_reviewer_id:base.ninth_signer_id})};
assert.equal(custodyEscalationFollowupAge710(escalation,now).due,true);
assert.equal(custodyEscalationFollowupAge710(escalation,now).age_hours,50);
assert.equal(custodyEscalationFollowupAge710({attempted_at:iso(-23*h)},now).due,false);
assert.equal(custodyEscalationFollowupAge710({attempted_at:'invalid'},now).due,false);
const followAt=now-60*1000,followAge=custodyEscalationFollowupAge710(escalation,followAt);
const follow={original_709_escalation_receipt_id:300,
 original_ninth_review_receipt_id:240,original_708_continuity_receipt_id:280,
 original_708_custody_receipt_id:290,original_706_manifest_sha256:manifest,
 original_708_custody_digest_sha256:digest,ninth_reviewer_id:base.ninth_signer_id,
 source_revision:current.source_revision,fingerprint_sha256:sha,
 followup_age_hours:followAge.age_hours,followup_age_status:followAge.status,
 followup_disposition:'owner_manual_source_followup_pending',
 owner_followup_reviewed:true,owner_user_id:7,
 resolution_note:'Owner read exact overdue source ledger evidence and chose documented manual reviewer follow-up.',
 external_contact_confirmed:false,new_independent_signature_obtained:false,
 bookkeeping_closed:false,financial_certified:false};
const followRow=(patch={},id=312)=>({social_post_attempt_id:id,
 attempt_status:'owner_custody_escalation_followup_710',
 attempted_at:new Date(followAt).toISOString(),
 response_json:JSON.stringify({...follow,...patch})});
const evidence={queue_id:25,original_ninth_review_receipt_id:240,
 original_706_retention_receipt_id:245,original_707_field_receipt_id:250,
 original_707_custody_receipt_id:260,original_708_continuity_receipt_id:280,
 original_708_custody_receipt_id:290,original_709_escalation_receipt_id:300,
 original_710_followup_receipt_id:312,original_706_manifest_sha256:manifest,
 original_708_custody_digest_sha256:digest,review_packet_sha256:packet,
 ninth_reviewer_id:base.ninth_signer_id,source_revision:current.source_revision,
 fingerprint_sha256:sha};
const digestBytes=await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(JSON.stringify(ninthProvenanceManifest710(evidence))));
const provenance_manifest_sha256=[...new Uint8Array(digestBytes)]
 .map(x=>x.toString(16).padStart(2,'0')).join('');
const provenance={...evidence,provenance_manifest_sha256,owner_provenance_reviewed:true,
 owner_user_id:7,resolution_note:'Owner verified the original independent ninth signer and canonical 706 to 710 custody chain.',
 original_ninth_signature_source_reverified:true,new_independent_signature_obtained:false,
 external_contact_confirmed:false,bookkeeping_closed:false,financial_certified:false};
const auditRow=(patch={},id=315)=>({social_post_attempt_id:id,
 attempt_status:'owner_ninth_reviewer_provenance_audit_710',attempted_at:iso(-30000),
 response_json:JSON.stringify({...provenance,...patch})});
let report=await assessFinance710(current,base,prior,[escalation],[],[],now);
assert.equal(report.status,'ORIGINAL_OVERDUE_CUSTODY_ESCALATION_FOLLOWUP_REQUIRED_710');
assert.equal(report.due_followup_count,1);
report=await assessFinance710(current,base,prior,[escalation],[followRow()],[],now);
assert.equal(report.history_complete,true);
assert.equal(report.completed_followup_count,1);
assert.equal(report.status,'OWNER_CUSTODY_FOLLOWUP_RECORDED_NINTH_PROVENANCE_AUDIT_REQUIRED_710');
report=await assessFinance710(current,base,prior,[escalation],[followRow()],[auditRow()],now);
assert.equal(report.history_complete,true);
assert.equal(report.status,'OWNER_NINTH_SOURCE_PROVENANCE_STABLE_BOOKS_HOLD_710');
assert.equal(report.provenance_audited_count,1);
assert.equal(report.items[0].provenance_710_digest_sha256,provenance_manifest_sha256);
assert.equal(report.bookkeeping_closed,false);
assert.equal(report.independent_ninth_new_signature_generated,false);
for(const patch of [{original_709_escalation_receipt_id:301},
 {original_ninth_review_receipt_id:241},{original_708_continuity_receipt_id:281},
 {original_708_custody_receipt_id:291},{original_706_manifest_sha256:'x'.repeat(64)},
 {original_708_custody_digest_sha256:'x'.repeat(64)},{ninth_reviewer_id:'forged'},
 {source_revision:'stale'},{fingerprint_sha256:'f'.repeat(64)},
 {followup_age_hours:1},{followup_age_status:'forged'},
 {followup_disposition:'external_contact_completed'},
 {owner_followup_reviewed:false},{owner_user_id:0},{resolution_note:'short'},
 {external_contact_confirmed:true},{new_independent_signature_obtained:true},
 {bookkeeping_closed:true},{financial_certified:true}]){
 const result=await assessFinance710(current,base,prior,[escalation],[followRow(patch)],[],now);
 assert.equal(result.history_complete,false,'Invalid original follow-up must HOLD '+JSON.stringify(patch));
}
for(const patch of [{queue_id:99},{original_ninth_review_receipt_id:99},
 {original_706_retention_receipt_id:99},{original_707_field_receipt_id:99},
 {original_707_custody_receipt_id:99},{original_708_continuity_receipt_id:99},
 {original_708_custody_receipt_id:99},{original_709_escalation_receipt_id:99},
 {original_710_followup_receipt_id:99},{original_706_manifest_sha256:'x'.repeat(64)},
 {original_708_custody_digest_sha256:'x'.repeat(64)},
 {review_packet_sha256:'x'.repeat(64)},{ninth_reviewer_id:'forged'},
 {source_revision:'stale'},{fingerprint_sha256:'f'.repeat(64)},
 {provenance_manifest_sha256:'f'.repeat(64)},{owner_provenance_reviewed:false},
 {owner_user_id:0},{resolution_note:'short'},{original_ninth_signature_source_reverified:false},
 {new_independent_signature_obtained:true},{external_contact_confirmed:true},
 {bookkeeping_closed:true},{financial_certified:true}]){
 const result=await assessFinance710(current,base,prior,[escalation],[followRow()],[auditRow(patch)],now);
 assert.equal(result.history_complete,false,'Forged provenance digest or source must HOLD '+JSON.stringify(patch));
}
assert.equal((await assessFinance710(current,base,prior,[escalation],[followRow(),followRow()],[],now)).history_complete,false);
assert.equal((await assessFinance710(current,base,prior,[escalation],[followRow()],[auditRow(),auditRow()],now)).history_complete,false);
assert.equal((await assessFinance710(current,base,prior,[{...escalation,attempted_at:'invalid'}],[],[],now)).history_complete,false);
assert.equal((await assessFinance710({...current,master_fresh:false},base,prior,[escalation],[followRow()],[auditRow()],now)).history_complete,false);
assert.equal((await assessFinance710({...current,open_cases:[{id:1}]},base,prior,[escalation],[followRow()],[auditRow()],now)).history_complete,false);
assert.equal((await assessFinance710(current,{...base,ninth_signer_configured:false},prior,[escalation],[followRow()],[auditRow()],now)).history_complete,false);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const required={
 'functions/api/admin/_cameraField702.mjs':[/export function canResolveOriginalRecurrence710/,/export function recurrenceResolutionReadback710/,/camera710_signed_media_recurrence_resolved/],
 'functions/api/admin/mobile-create-product.js':[/camera710_inspect/,/camera710_signed_recurrence_resolve/],
 'functions/api/admin/social-post-queue.js':[/export function custodyEscalationFollowupAge710/,
  /export function ninthProvenanceManifest710/,/export async function assessFinance710/,
  /financial710:await finance710/,/params.get\('export'\)==='financial710'/,
  /owner_custody_escalation_followup_710/,/owner_ninth_reviewer_provenance_audit_710/],
 'admin/mobile-product/index.html':[/id="dd710MediaResolution"/,/id="dd710ResolutionRecord"/],
 'admin/social-publishing/index.html':[/id="dd710-finance"/,/id="dd710FollowupForm"/,/id="dd710ProvenanceForm"/],
 'public/js/admin-mobile-product-augment.js':[/function draw710\(/,/camera710_signed_recurrence_resolve/],
 'public/js/admin-social-platform-preflight.js':[/function draw710\(/,/owner_custody_escalation_followup_710/,/owner_ninth_reviewer_provenance_audit_710/,/export=financial710/],
 '.github/workflows/current-application-quality.yml':[/build710_media_recurrence_resolution_custody_followup_ninth_provenance_contract.mjs/]
};
for(const [file,checks] of Object.entries(required))
 for(const check of checks)assert.match(read(file),check,'Missing original Build 710 contract '+file);
console.log('BUILD 710 PASS: original signed media recurrence resolution, 24-hour aged custody follow-up, canonical ninth provenance SHA256, tamper/replay/false close HOLD.');
