import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {triageOriginalMediaRecurrence715} from '../functions/api/admin/_cameraField702.mjs';
import {assessOriginalCustodySla715} from '../functions/api/admin/social-post-queue.js';

const now=Date.now(),h=3600000,iso=x=>new Date(now+x*h).toISOString();
const original={receipt_id:10,opened_at:iso(-100)},
 recurrence={admin_action_audit_id:20,created_at:iso(-90),data:{open_receipt_id:10}},
 escalation={admin_action_audit_id:21,created_at:iso(-75),data:{recurrence_receipt_id:20}},
 resolution={admin_action_audit_id:22,created_at:iso(-50),data:{recurrence_receipt_id:20}},
 trend={stable:true};
const triage=(a=original,b=recurrence,c=resolution,d=escalation,e=trend)=>
 triageOriginalMediaRecurrence715(a,b,c,d,e,now);
assert.equal(triage().priority,'REVIEW');
assert.match(triage().status,/RESOLUTION_SOURCE_RECHECKED/);
assert.equal(triage().external_escalation_confirmed,false);
assert.equal(triage().automatic_media_repair,false);
assert.equal(triage(original,null).priority,'NONE');
assert.equal(triage(original,recurrence,null).priority,'HIGH');
assert.equal(triage(original,recurrence,resolution,escalation,{stable:false}).priority,'HOLD');
assert.match(triage(original,{...recurrence,created_at:iso(10)}).status,/HOLD/);
assert.match(triage(original,{...recurrence,data:{open_receipt_id:9}}).status,/HOLD/);
assert.match(triage(original,recurrence,resolution,{...escalation,data:{recurrence_receipt_id:15}}).status,/HOLD/);
assert.match(triage(original,recurrence,{...resolution,admin_action_audit_id:18}).status,/HOLD/);

const ninth={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'signed-original-ninth'};
const source={
 renewal_receipt_id_711:120,review_706_receipt_id:80,
 original_711_renewal_recorded_at:iso(-90),source_stable_712:true,
 retention_manifest_sha256:'a'.repeat(64),
 provenance_710_digest_sha256:'b'.repeat(64),
 renewal_manifest_sha256_711:'c'.repeat(64),
 custody_followup_evidence_recorded_712:true,
 custody_followup_evidence_receipt_id_712:140
};
const rec={receipt_id:140,verified:true,original_711_renewal_receipt_id:120};
const a712={history_complete:true,campaign_queue_id:8,items:[source],
 evidence_receipts:[rec],invalid_count:0};
const a713={history_complete:true,campaign_queue_id:8,original_ninth_reviewer_id:'signed-original-ninth'};
const item={renewal_receipt_id_711:120,original_ninth_receipt_id:80,
 original_custody_receipt_id:140,signed_source_stable:true};
const a714={history_complete:true,campaign_queue_id:8,original_ninth_reviewer_id:'signed-original-ninth',
 drift_count:0,items:[item]};
const audit=(a=a714,b=a713,c=a712,d=ninth)=>assessOriginalCustodySla715(a,b,c,d,now);
assert.equal(audit().history_complete,true);
assert.equal(audit().original_owner_evidence_verified_count,1);
assert.equal(audit().source_reattest_request_ready_count,1);
assert.equal(audit().independently_signed_new_source_available,false);
assert.equal(audit().external_sla_outcome_confirmed,false);
assert.equal(audit().items[0].independent_external_outcome_verified,false);
assert.equal(audit().items[0].new_independent_signature_obtained,false);
assert.match(audit().items[0].ninth_re_attestation_readiness,/REQUEST_FRESH/);
assert.equal(audit({...a714,original_ninth_reviewer_id:'different'}).history_complete,false);
assert.equal(audit(a714,a713,a712,{...ninth,ninth_signer_configured:false}).history_complete,false);
assert.equal(audit(a714,a713,{...a712,evidence_receipts:[]}).history_complete,false);
assert.equal(audit(a714,a713,{...a712,evidence_receipts:[rec,rec]}).history_complete,false);
assert.equal(audit(a714,a713,{...a712,items:[{...source,original_711_renewal_recorded_at:iso(9)}]}).history_complete,false);
assert.equal(audit({...a714,items:[item,item]}).history_complete,false);
const missingSource={...source,custody_followup_evidence_recorded_712:false,
 custody_followup_evidence_receipt_id_712:null};
const due=audit({...a714,items:[{...item,original_custody_receipt_id:null}]},
 a713,{...a712,items:[missingSource],evidence_receipts:[]});
assert.equal(due.history_complete,true);
assert.equal(due.original_owner_followup_due_count,1);
assert.equal(due.source_reattest_request_ready_count,0);
assert.match(due.items[0].status,/FOLLOWUP_DUE_72H/);

const files=[
 ['functions/api/admin/mobile-create-product.js','camera715_inspect'],
 ['functions/api/admin/social-post-queue.js','financial715'],
 ['public/js/admin-mobile-product-augment.js','dd715MediaRefresh'],
 ['public/js/admin-social-platform-preflight.js','dd715FinanceRefresh'],
 ['admin/mobile-product/index.html','dd715MediaTriage'],
 ['admin/social-publishing/index.html','dd715-finance']
];
for(const [file,needle] of files){
 const s=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 assert.ok(s.includes(needle),'Missing original source binding '+file);
 assert.doesNotMatch(s,/autoReattestNinth715|autoCloseCustodySla715|startBackgroundMediaWatcher715/);
}
console.log('Build 715 original recurrence, custody SLA and ninth source readiness: PASS');
