import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewOriginalClosureEscalation718} from '../functions/api/admin/_cameraField702.mjs';
import {reviewOriginalExternalSlaContinuity718} from '../functions/api/admin/social-post-queue.js';

const now=Date.now(),h=3600000,iso=x=>new Date(now+x*h).toISOString();
const latest=(age)=>({admin_action_audit_id:41,data:{issued_at:iso(-age)}});
const closure=(age)=>({status:age<=24?'ORIGINAL_CLOSURE_SIGNED_R2_FRESH_RECHECK_ON_DEMAND_717':
 'HOLD_717_OWNER_CLOSURE_REATTEST_FRESHNESS_EXPIRED',
 closure_fresh:age<=24,age_hours:age,original_owner_reattest_receipt_id:41});
const outcome={source_reconciled:true};
const media=age=>reviewOriginalClosureEscalation718(closure(age),outcome,latest(age),now);
assert.equal(media(2).priority,'CURRENT');
assert.equal(media(20).priority,'WATCH');
assert.equal(media(24).priority,'DUE');
assert.equal(media(48).priority,'HIGH');
assert.equal(media(72).priority,'CRITICAL');
assert.equal(media(80).owner_followup_due,true);
assert.equal(media(72).external_escalation_dispatched,false);
assert.equal(media(72).independent_phone_witness,false);
assert.equal(media(72).automated_media_repair,false);
assert.equal(media(72).background_watcher,false);
assert.equal(reviewOriginalClosureEscalation718(
 {status:'NO_ORIGINAL_RECORDED_RECURRENCE_717'},outcome,null,now).priority,'NONE');
assert.equal(reviewOriginalClosureEscalation718(closure(24),
 {source_reconciled:false},latest(24),now).priority,'HOLD');
assert.equal(reviewOriginalClosureEscalation718(closure(24),outcome,
 {data:{issued_at:iso(1)}},now).priority,'HOLD');
assert.equal(reviewOriginalClosureEscalation718({...closure(24),age_hours:25},outcome,
 latest(24),now).priority,'HOLD');
assert.equal(reviewOriginalClosureEscalation718({...closure(26),status:'FAKE_CLOSURE_OK'},outcome,
 latest(26),now).priority,'HOLD');

const id=8,sha=x=>String(x).repeat(64);
const original={renewal_receipt_id_711:120,review_706_receipt_id:80,
 original_711_renewal_recorded_at:iso(-90),provenance_710_digest_sha256:sha(4),
 renewal_manifest_sha256_711:sha(5)};
const ownerRow={renewal_receipt_id_711:120,original_ninth_receipt_id:80,
 original_custody_evidence_receipt_id:140,owner_followup_evidence_verified:true};
const signed={receipt_id:150,original_711_renewal_receipt_id:120,
 original_712_owner_custody_receipt_id:140,
 independent_signature_verified:true,received_at:iso(-30)};
const ext={receipt_id:170,original_711_renewal_receipt_id:120,
 original_716_ninth_receipt_id:150,original_712_custody_receipt_id:140,
 independent_external_signature_verified:true,
 custody_sla_followup_attested:true,external_verifier_id:'independent-outside-717',
 signed_issued_at:iso(-3),received_at:iso(-2)};
const a717={history_complete:true,invalid_count:0,campaign_queue_id:id,
 independent_external_verifier_configured:true,receipts:[ext]};
const a716={history_complete:true,invalid_count:0,campaign_queue_id:id,receipts:[signed]};
const a715={history_complete:true,campaign_queue_id:id,items:[ownerRow]};
const a712={history_complete:true,campaign_queue_id:id,items:[original]};
const current={queue_id:id,master_fresh:true,history_complete:true,open_cases:[],
 source_revision:'original-source',fingerprint_sha256:sha(3)};
const audit=(a=a717,b=a716,c=a715,d=a712,e=current)=>
 reviewOriginalExternalSlaContinuity718(a,b,c,d,e,now);
const good=audit();
assert.equal(good.history_complete,true);
assert.equal(good.outside_sla_signed_followup_confirmation_count,1);
assert.equal(good.original_ninth_signed_24h_review_due,1);
assert.equal(good.original_ninth_signed_48h_review_due,0);
assert.equal(good.outstanding_outside_signed_source_count,0);
assert.equal(good.items[0].external_followup_independently_signed,true);
assert.equal(good.items[0].actual_financial_close,false);
assert.equal(good.actual_bookkeeping_closed,false);
assert.equal(good.independent_outside_contact_sent,false);
assert.equal(good.continuous_background_monitoring,false);
assert.equal(audit({...a717,receipts:[]}).outstanding_outside_signed_source_count,1);
assert.match(audit({...a717,receipts:[]}).status,/PENDING_HOLD_718/);
const missing=audit({...a717,receipts:[]},{...a716,receipts:[]});
assert.equal(missing.history_complete,true);
assert.equal(missing.outstanding_original_ninth_signed_source_count,1);
assert.match(missing.status,/SIGNATURE_PENDING/);
assert.equal(audit({...a717,independent_external_verifier_configured:false,receipts:[]}).history_complete,true);
assert.match(audit({...a717,independent_external_verifier_configured:false,receipts:[]}).status,/NOT_CONFIGURED/);
const aged=audit({...a717,receipts:[]},
 {...a716,receipts:[{...signed,received_at:iso(-75)}]});
assert.equal(aged.original_ninth_signed_72h_review_due,1);
assert.equal(aged.original_ninth_signed_48h_review_due,1);
assert.equal(aged.original_ninth_signed_24h_review_due,1);
assert.equal(audit({...a717,invalid_count:1}).history_complete,false);
assert.equal(audit({...a717,receipts:[ext,ext]}).history_complete,false);
assert.equal(audit({...a717,receipts:[{...ext,independent_external_signature_verified:false}]}).history_complete,false);
assert.equal(audit({...a717,receipts:[{...ext,original_716_ninth_receipt_id:152}]}).history_complete,false);
assert.equal(audit({...a717,receipts:[{...ext,original_712_custody_receipt_id:141}]}).history_complete,false);
assert.equal(audit({...a717,receipts:[{...ext,received_at:iso(2)}]}).history_complete,false);
assert.equal(audit({...a717,receipts:[{...ext,signed_issued_at:iso(-32)}]}).history_complete,false);
assert.equal(audit({...a717,receipts:[{...ext,original_711_renewal_receipt_id:121}]}).history_complete,false);
assert.equal(audit(a717,{...a716,receipts:[{...signed,independent_signature_verified:false}]}).history_complete,false);
assert.equal(audit(a717,{...a716,receipts:[{...signed,received_at:iso(2)}]}).history_complete,false);
assert.equal(audit(a717,a716,{...a715,items:[{...ownerRow,original_custody_evidence_receipt_id:139}]}).history_complete,false);
assert.equal(audit(a717,a716,a715,{...a712,items:[]}).history_complete,false);
assert.equal(audit(a717,a716,a715,a712,{...current,master_fresh:false}).history_complete,false);
for(const [path,needle] of [
 ['functions/api/admin/mobile-create-product.js','camera718_inspect'],
 ['functions/api/admin/social-post-queue.js','financial718'],
 ['public/js/admin-mobile-product-augment.js','dd718MediaRefresh'],
 ['public/js/admin-social-platform-preflight.js','dd718FinanceRefresh'],
 ['admin/mobile-product/index.html','dd718MediaEscalation'],
 ['admin/social-publishing/index.html','dd718-finance']]){
 const value=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.ok(value.includes(needle),'Build 718 missing original source-bound owner route: '+path);
}
console.log('Build 718 original independent signed outside SLA continuity, ninth renewal horizons and media closure escalation: PASS');
