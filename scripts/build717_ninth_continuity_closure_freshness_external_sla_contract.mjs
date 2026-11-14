import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewOriginalClosureFreshness717} from '../functions/api/admin/_cameraField702.mjs';
import {claimExternalCustodySla717,assessExternalCustodySla717} from '../functions/api/admin/social-post-queue.js';

const now=Date.now(),h=3600000,iso=x=>new Date(now+x*h).toISOString(),hash=n=>String(n).repeat(64);
const recurrence={admin_action_audit_id:20,created_at:iso(-100)},
 resolution={admin_action_audit_id:25,created_at:iso(-70)},
 horizon={admin_action_audit_id:30,created_at:iso(-30)},
 latest={admin_action_audit_id:35,created_at:iso(-2),data:{issued_at:iso(-2)}},
 stable={stable:true},outcome={source_reconciled:true};
const closure=(o=outcome,r=recurrence,v=resolution,h=horizon,l=latest,t=stable)=>
 reviewOriginalClosureFreshness717(o,r,v,h,l,t,now);
assert.equal(closure().closure_fresh,true);
assert.equal(closure().physical_phone_witness,false);
assert.equal(closure().external_closure_confirmed,false);
assert.equal(closure(outcome,null).closure_fresh,false);
assert.match(closure({...outcome,source_reconciled:false}).status,/HOLD/);
assert.match(closure(outcome,recurrence,resolution,horizon,latest,{stable:false}).status,/HOLD/);
assert.match(closure(outcome,recurrence,resolution,horizon,{...latest,data:{issued_at:iso(-26)}}).status,/HOLD/);
assert.match(closure(outcome,recurrence,resolution,horizon,{...latest,admin_action_audit_id:29}).status,/HOLD/);
assert.match(closure(outcome,recurrence,resolution,horizon,{...latest,data:{issued_at:iso(2)}}).status,/HOLD/);

const outsideKeypair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const ninthKeypair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const outsideKey=Buffer.from(await crypto.subtle.exportKey('raw',outsideKeypair.publicKey)).toString('base64'),
 ninthKey=Buffer.from(await crypto.subtle.exportKey('raw',ninthKeypair.publicKey)).toString('base64');
const external='independent-custody-sla-717',ninth='independent-ninth-706';
const original={renewal_receipt_id_711:120,review_706_receipt_id:80,
 original_711_renewal_recorded_at:iso(-80),
 provenance_710_digest_sha256:hash(4),renewal_manifest_sha256_711:hash(5)};
const a712={history_complete:true,campaign_queue_id:8,items:[original]};
const a715={history_complete:true,campaign_queue_id:8,
 original_owner_followup_due_count:0,
 items:[{renewal_receipt_id_711:120,original_ninth_receipt_id:80,
 owner_followup_evidence_verified:true,original_custody_evidence_receipt_id:140}]};
const signed={receipt_id:150,original_711_renewal_receipt_id:120,
 original_712_owner_custody_receipt_id:140,
 independent_signature_verified:true,received_at:iso(-18)};
const a716={history_complete:true,campaign_queue_id:8,invalid_count:0,receipts:[signed]};
const current={queue_id:8,master_fresh:true,history_complete:true,open_cases:[],
 source_revision:'stable-source-717',fingerprint_sha256:hash(3)};
const claim=claimExternalCustodySla717({
 queue_id:8,original_706_ninth_review_receipt_id:80,
 original_711_renewal_receipt_id:120,original_712_owner_custody_receipt_id:140,
 original_716_independent_ninth_receipt_id:150,
 original_710_provenance_sha256:hash(4),original_711_renewal_sha256:hash(5),
 source_revision:'stable-source-717',fingerprint_sha256:hash(3),
 external_verifier_id:external,
 disposition:'confirm_independent_manual_custody_sla_followup',
 nonce:'outside-independently-signed-nonce-717-0123456',issued_at:iso(-0.1)});
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',outsideKeypair.privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64');
const data={claim,signature,owner_user_id:5,owner_reviewed_original_source:true,
 financial_books_closed:false,provider_posting_closed:false,auto_escalation_sent:false};
const row={social_post_attempt_id:170,attempt_status:'independent_external_custody_sla_ack_717',
 attempted_at:iso(0),response_json:JSON.stringify(data)};
const audit=(a=a716,b=a715,c=a712,cur=current,ei=external,ek=outsideKey,ni=ninth,nk=ninthKey,rows=[row])=>
 assessExternalCustodySla717(a,b,c,cur,ei,ek,ni,nk,rows,now);
const good=await audit();
assert.equal(good.history_complete,true);
assert.equal(good.original_ninth_signature_continuity_count,1);
assert.equal(good.signed_external_receipt_verified_count,1);
assert.equal(good.independently_attested_sla_followup_count,1);
assert.equal(good.actual_bookkeeping_closed,false);
assert.equal(good.provider_posting_closed,false);
assert.equal(good.automatic_external_contact,false);
const waiting=await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,[]);
assert.equal(waiting.history_complete,true);
assert.equal(waiting.signed_external_receipt_verified_count,0);
assert.match(waiting.status,/HOLD_717_EXTERNAL_SLA_SIGNED/);
assert.match((await audit(a716,a715,a712,current,'','',ninth,ninthKey,[])).status,/HOLD_717_DISTINCT/);
const alter=change=>[{...row,response_json:JSON.stringify({...data,...change})}];
assert.equal((await audit(a716,a715,a712,current,external,ninthKey,ninth,ninthKey)).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,external,ninthKey)).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,alter({signature:'bogus'}))).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,alter({claim:{...claim,original_712_owner_custody_receipt_id:139}}))).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,alter({claim:{...claim,extra:'spoof'}}))).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,[row,row])).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,[{...row,social_post_attempt_id:149}])).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,[{...row,attempted_at:iso(-3)}])).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,[{...row,attempted_at:iso(2)}])).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,alter({financial_books_closed:true}))).history_complete,false);
assert.equal((await audit(a716,a715,a712,current,external,outsideKey,ninth,ninthKey,
 [{...row,response_json:JSON.stringify({...data,claim:{...claim,issued_at:iso(-25)}})}])).history_complete,false);
assert.equal((await audit({...a716,invalid_count:1})).history_complete,false);
assert.equal((await audit({...a716,receipts:[{...signed,independent_signature_verified:false}]})).history_complete,false);
assert.equal((await audit({...a716,receipts:[{...signed,received_at:iso(1)}]})).history_complete,false);
assert.equal((await audit(a716,{...a715,items:[]})).history_complete,false);
assert.equal((await audit(a716,a715,{...a712,items:[]})).history_complete,false);
assert.equal((await audit(a716,a715,a712,{...current,master_fresh:false})).history_complete,false);
const aged=await audit({...a716,receipts:[{...signed,received_at:iso(-90)}]},a715,a712,current,
 external,outsideKey,ninth,ninthKey,[]);
assert.equal(aged.original_ninth_signed_72h_renewal_due_count,1);
for(const [path,needle] of [
 ['functions/api/admin/mobile-create-product.js','camera717_inspect'],
 ['functions/api/admin/social-post-queue.js','independent_external_custody_sla_intake_717'],
 ['functions/api/admin/social-post-queue.js','financial717'],
 ['public/js/admin-mobile-product-augment.js','dd717MediaRefresh'],
 ['public/js/admin-social-platform-preflight.js','dd717SignedSubmit'],
 ['admin/mobile-product/index.html','dd717MediaClosure'],
 ['admin/social-publishing/index.html','dd717-finance']]){
 const text=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.ok(text.includes(needle),'Missing original signed source binding '+path);
}
console.log('Build 717 original closure freshness, ninth continuity and separately signed custody SLA anti-replay: PASS');
