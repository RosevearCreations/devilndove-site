import assert from 'node:assert/strict';
import {reconcile719} from './build719_production_evidence_reconciliation.mjs';
const sha='a'.repeat(40);
const receipt=id=>({run_id:id,head_sha:sha,status:'completed',conclusion:'success'});
const good={
 main_sha:sha, main_merge:{merged:true,sha},
 production_pages_deploy:receipt(101),
 public_smoke:receipt(102),
 production_live_resource_integrity:receipt(103),
 source_718:{main_sha:sha,confirmed:true}
};
const ok=reconcile719(good);
assert.equal(ok.production_green,true);
assert.equal(ok.independent_business_closure_certified,false);
assert.deepEqual(ok.outstanding,{external_sla:true,ninth_reviewer:true,original_media:true});
const bad=[
 {main_sha:'not-a-sha'},
 {main_merge:{merged:false,sha}},
 {production_pages_deploy:{...receipt(101),conclusion:'failure'}},
 {public_smoke:{...receipt(102),status:'in_progress'}},
 {production_live_resource_integrity:{...receipt(103),head_sha:'b'.repeat(40)}},
 {production_live_resource_integrity:receipt(101)},
 {source_718:{main_sha:sha,confirmed:false}}
];
for(const b of bad){
 const result=reconcile719({...good,...b});
 assert.equal(result.production_green,false,JSON.stringify(b));
 assert.ok(result.production_gate_failures.length>0);
}
const verified={source_verified:true,signature_verified:true,
 freshness_verified:true,receipt_id:'original-signed-receipt'};
const media={signed_source_verified:true,r2_head_verified:true,owner_attestation_fresh:true};
assert.equal(reconcile719({...good,external_sla:verified,ninth_reviewer:verified,media_closure:media})
 .independent_business_closure_certified,true);
assert.equal(reconcile719({...good,external_sla:{...verified,signature_verified:false},
 ninth_reviewer:verified,media_closure:media}).independent_business_closure_certified,false);
assert.equal(reconcile719({...good,external_sla:verified,ninth_reviewer:verified,
 media_closure:{...media,r2_head_verified:false}}).independent_business_closure_certified,false);
console.log('Build 719 exact-SHA production evidence, independent signatures, media source HOLD regression: PASS');
