import test from 'node:test';
import assert from 'node:assert/strict';
import {TRIALS,CHECKS,BOUNDARY,normalizeTrial,summarizeTrial} from '../functions/api/_lib/makerOwnerTrial456.mjs';

const input={scenario_key:'jewellery_metal',checkpoint_key:'source_identity',project_id:1,
 source_kind:'project',source_id:1,decision:'accepted',personally_observed:true,
 review_note:'Owner examined their actual jewellery source project.',request_key:'test456-human-source-00001'};

test('six user journeys, real source classes and no publication/financial authority',()=>{
 assert.equal(Object.keys(TRIALS).length,6);
 for(const [key,{checks}] of Object.entries(TRIALS)){
  assert.ok(checks.includes('source_identity'),key);
  assert.equal(new Set(checks).size,checks.length);
  for(const check of checks)assert.ok(CHECKS[check]?.sources.length,`${key}: ${check}`);
 }
 assert.equal(BOUNDARY.publishes_product,false);
 assert.equal(BOUNDARY.creates_payment,false);
 assert.equal(BOUNDARY.production_product_safety_certified,false);
});
test('human attestation, original scope and 24-character facts are mandatory',()=>{
 const result=normalizeTrial(input);assert.equal(result.observed,1);assert.equal(result.project,1);
 assert.throws(()=>normalizeTrial({...input,personally_observed:false}),/personal observation/);
 assert.throws(()=>normalizeTrial({...input,source_kind:'none',source_id:null}),/personal observation/);
 assert.throws(()=>normalizeTrial({...input,source_kind:'customer_proof',source_id:91}),/valid existing record type/);
 assert.throws(()=>normalizeTrial({...input,custom_request_id:11}),/exactly the actual/);
 assert.throws(()=>normalizeTrial({...input,review_note:'Not enough facts'}),/24/);
 assert.throws(()=>normalizeTrial({...input,checkpoint_key:'customer_approval'}),/supported scenario/);
});
test('HOLD works with no source, and the latest receipt controls the checklist',()=>{
 const hold=normalizeTrial({...input,source_kind:'none',source_id:null,decision:'hold',personally_observed:false});
 assert.equal(hold.sourceId,null);assert.equal(hold.decision,'hold');
 const rows=[{checkpoint_key:'source_identity',decision:'hold'},{checkpoint_key:'source_identity',decision:'accepted'}];
 const s=summarizeTrial('jewellery_metal',rows);assert.equal(s.accepted,0);assert.equal(s.held.length,5);
 assert.equal(s.external_acceptance,'HOLD_UNVERIFIED_OWNER_PROVIDER_FACTS');
});
test('commission requires original request and commission-specific linked sources',()=>{
 const base={...input,scenario_key:'custom_commission',project_id:null,custom_request_id:11,source_kind:'customer_proof',source_id:91,checkpoint_key:'customer_approval'};
 assert.equal(normalizeTrial(base).request,11);
 assert.throws(()=>normalizeTrial({...base,source_kind:'quality_attempt',source_id:61}),/valid existing record type/);
 assert.throws(()=>normalizeTrial({...base,checkpoint_key:'process_quality',source_kind:'quality_attempt',source_id:61}),/original project QA or commission/);
 assert.throws(()=>normalizeTrial({...base,custom_request_id:0}),/exactly the actual/);
});
