import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewOriginalMediaTrend714} from '../functions/api/admin/_cameraField702.mjs';
import {reviewOriginalCustodyDrift714} from '../functions/api/admin/social-post-queue.js';
const now=Date.now(),h=3600000,iso=x=>new Date(now+x*h).toISOString();
const recurrence={admin_action_audit_id:101,created_at:iso(-128)},
 resolution={admin_action_audit_id:102,created_at:iso(-125)},
 stability={admin_action_audit_id:103,created_at:iso(-100)},
 horizon={admin_action_audit_id:104,created_at:iso(-25)},
 proof={source_stable:true,original_712_horizon_receipt_id:104};
const media=(a=recurrence,b=resolution,c=stability,d=horizon,e=proof)=>
 reviewOriginalMediaTrend714(a,b,c,d,e,now);
assert.equal(media().stable,true);assert.equal(media().trend_window,'72H');
assert.equal(media().continuous_watch,false);
assert.match(media(null).status,/HOLD/);
assert.match(media({...recurrence,created_at:iso(2)}).status,/HOLD/);
assert.match(media(recurrence,{...resolution,admin_action_audit_id:99}).status,/HOLD/);
assert.match(media(recurrence,resolution,stability,horizon,{source_stable:false}).status,/HOLD/);
const ninth={history_complete:true,ninth_signer_configured:true,ninth_signer_id:'original-nine'};
const origin={renewal_receipt_id_711:110,review_706_receipt_id:80,
 original_711_renewal_recorded_at:iso(-90),source_stable_712:true,
 renewal_manifest_sha256_711:'a'.repeat(64),provenance_710_digest_sha256:'b'.repeat(64),
 custody_followup_evidence_recorded_712:true,custody_followup_evidence_receipt_id_712:130};
const previous={history_complete:true,campaign_queue_id:7,original_ninth_reviewer_id:'original-nine',
 independent_external_reply_verified:false,owner_financial_close_verified:false,invalid_count:0,
 items:[{renewal_receipt_id_711:110,original_ninth_review_receipt_id:80,
 ninth_reviewer_id:'original-nine',custody_evidence_receipt_id_712:130,
 authority_continuity_stable:true}]};
const source={history_complete:true,campaign_queue_id:7,invalid_count:0,
 renewed_source_drift_count:0,items:[origin]};
const check=(a=previous,b=source,n=ninth)=>reviewOriginalCustodyDrift714(a,b,n,now);
assert.equal(check().history_complete,true);
assert.equal(check().owner_evidence_revalidated_count,1);
assert.equal(check().financial_books_closed,false);
assert.equal(check({...previous,original_ninth_reviewer_id:'changed'}).history_complete,false);
assert.equal(check({...previous,independent_external_reply_verified:true}).history_complete,false);
assert.equal(check({...previous,items:[previous.items[0],previous.items[0]]}).history_complete,false);
assert.equal(check(previous,{...source,items:[{...origin,source_stable_712:false}]}).history_complete,false);
assert.equal(check(previous,source,{...ninth,ninth_signer_configured:false}).history_complete,false);
assert.equal(check(previous,{...source,items:[{...origin,original_711_renewal_recorded_at:iso(9)}]}).history_complete,false);
const due=check({...previous,items:[{...previous.items[0],custody_evidence_receipt_id_712:null}]},
 {...source,items:[{...origin,custody_followup_evidence_recorded_712:false,custody_followup_evidence_receipt_id_712:null}]});
assert.equal(due.followup_72h_count,1);
assert.match(due.status,/FOLLOWUP_REQUIRED/);
for(const [path,needle] of [
 ['functions/api/admin/mobile-create-product.js','camera714_inspect'],
 ['functions/api/admin/social-post-queue.js','financial714'],
 ['public/js/admin-mobile-product-augment.js','dd714MediaRefresh'],
 ['public/js/admin-social-platform-preflight.js','dd714FinanceRefresh'],
 ['admin/mobile-product/index.html','dd714MediaTrend'],
 ['admin/social-publishing/index.html','dd714-finance']]){
 const s=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.ok(s.includes(needle),path);
}
console.log('Build 714 original multi-horizon trend, custody source and ninth-authority drift regression: PASS');
