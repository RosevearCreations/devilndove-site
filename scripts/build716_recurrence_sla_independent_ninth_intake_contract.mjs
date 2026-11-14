import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileOriginalRecurrenceOutcome716} from '../functions/api/admin/_cameraField702.mjs';
import {claimIndependentNinth716,assessIndependentNinthIntake716} from '../functions/api/admin/social-post-queue.js';

const now=Date.now(),iso=x=>new Date(now+x*3600000).toISOString();
const recurrence={admin_action_audit_id:20,created_at:iso(-90)},
 escalation={admin_action_audit_id:21,data:{recurrence_receipt_id:20}},
 resolution={admin_action_audit_id:22,data:{recurrence_receipt_id:20}},
 triage={priority:'REVIEW',recurrence_receipt_id:20},trend={stable:true};
const media=(a=triage,b=recurrence,c=escalation,d=resolution,e=trend)=>
 reconcileOriginalRecurrenceOutcome716(a,b,c,d,e);
assert.equal(media().source_reconciled,true);
assert.equal(media().external_escalation_confirmed,false);
assert.equal(media().continuous_monitoring,false);
assert.equal(media().automatic_repair,false);
assert.equal(media(triage,null).outcome,'NO_ORIGINAL_CASE');
assert.equal(media({...triage,priority:'HOLD'}).outcome,'HOLD');
assert.equal(media(triage,recurrence,escalation,resolution,{stable:false}).outcome,'HOLD');
assert.equal(media(triage,recurrence,{...escalation,data:{recurrence_receipt_id:19}}).outcome,'HOLD');
assert.match(media({...triage,priority:'HIGH'},recurrence,escalation,null).status,/UNRESOLVED_OWNER_FOLLOWUP_DUE/);

const kp=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=Buffer.from(await crypto.subtle.exportKey('raw',kp.publicKey)).toString('base64');
const signerId='ninth-independent-original';
const sha=n=>String(n).repeat(64);
const original={renewal_receipt_id_711:120,review_706_receipt_id:80,
 original_711_renewal_recorded_at:iso(-30),provenance_710_digest_sha256:sha(4),
 renewal_manifest_sha256_711:sha(5)};
const a715={history_complete:true,campaign_queue_id:8,original_ninth_reviewer_id:signerId,
 original_owner_followup_due_count:0,original_owner_evidence_verified_count:1,
 source_reattest_request_ready_count:1,
 items:[{renewal_receipt_id_711:120,original_custody_evidence_receipt_id:140,
 owner_followup_evidence_verified:true}]};
const a712={history_complete:true,campaign_queue_id:8,items:[original]};
const current={queue_id:8,master_fresh:true,history_complete:true,
 open_cases:[],source_revision:'rev716',fingerprint_sha256:sha(3)};
const claim=claimIndependentNinth716({queue_id:8,original_706_review_receipt_id:80,
 original_711_renewal_receipt_id:120,original_712_owner_custody_receipt_id:140,
 original_710_provenance_sha256:sha(4),original_711_renewal_sha256:sha(5),
 source_revision:'rev716',fingerprint_sha256:sha(3),independent_reviewer_id:signerId,
 disposition:'reconfirm_original_ninth_source_under_hold',
 nonce:'fresh-original-source-nonce-716-123456789',issued_at:iso(-0.01)});
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',kp.privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64');
const data={claim,signature,owner_user_id:5,
 owner_reviewed_original_source:true,financial_books_closed:false,
 external_sla_closed:false,new_signature_generated_by_owner:false};
const row={social_post_attempt_id:150,attempt_status:'independent_ninth_source_signed_intake_716',
 attempted_at:iso(0),response_json:JSON.stringify(data)};
const assess=(a=a715,b=a712,c=current,s=signerId,key=pub,rows=[row])=>
 assessIndependentNinthIntake716(a,b,c,s,key,rows,now);
const verified=await assess();
assert.equal(verified.history_complete,true);
assert.equal(verified.signed_evidence_verified_count,1);
assert.equal(verified.receipts[0].independent_signature_verified,true);
assert.equal(verified.financial_books_closed,false);
assert.equal(verified.independent_external_sla_closure_verified,false);
const notSigned=await assess(a715,a712,current,signerId,pub,[]);
assert.equal(notSigned.history_complete,true);
assert.equal(notSigned.signed_evidence_verified_count,0);
assert.match(notSigned.status,/HOLD_716_FRESH/);
const mutate=(changes)=>[{...row,response_json:JSON.stringify({...data,...changes})}];
assert.equal((await assess(a715,a712,current,signerId,pub,mutate({signature:'bogus'}))).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,mutate({claim:{...claim,original_712_owner_custody_receipt_id:139}}))).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,mutate({claim:{...claim,fingerprint_sha256:sha(6)}}))).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,mutate({claim:{...claim,extra_claim:'fake'}}))).history_complete,false);
assert.equal((await assess(a715,a712,current,'different-independent',pub)).history_complete,false);
assert.equal((await assess(a715,{...a712,items:[]},current,signerId,pub)).history_complete,false);
assert.equal((await assess(a715,a712,{...current,master_fresh:false},signerId,pub)).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,[row,row])).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,[{...row,social_post_attempt_id:130}])).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,[{...row,attempted_at:iso(-2)}])).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,[{...row,attempted_at:iso(25)}])).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,mutate({external_sla_closed:true}))).history_complete,false);
assert.equal((await assess(a715,a712,current,signerId,pub,mutate({new_signature_generated_by_owner:true}))).history_complete,false);
for(const [path,needle] of [
 ['functions/api/admin/mobile-create-product.js','camera716_inspect'],
 ['functions/api/admin/social-post-queue.js','independent_ninth_source_intake_716'],
 ['functions/api/admin/social-post-queue.js','financial716'],
 ['public/js/admin-mobile-product-augment.js','dd716MediaRefresh'],
 ['public/js/admin-social-platform-preflight.js','dd716SignedSubmit'],
 ['admin/mobile-product/index.html','dd716MediaOutcome'],
 ['admin/social-publishing/index.html','dd716SignedEnvelope']]){
 const value=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.ok(value.includes(needle),'Missing protected Build 716 binding '+path);
}
console.log('Build 716 signed Ed25519 ninth source, D1 replay, custody SLA and media triage negative regression: PASS');
