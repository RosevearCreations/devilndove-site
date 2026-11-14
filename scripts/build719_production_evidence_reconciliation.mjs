// Build 719: independent, fail-closed exact-commit production release evidence reconciliation.
// Usage: node scripts/build719_production_evidence_reconciliation.mjs evidence.json
// The evidence file must be independently retrieved; this script never fabricates workflow outcomes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

export function reconcile719(e) {
  const failures=[];
  const sha=e?.main_sha;
  if(typeof sha!=='string'||!/^[0-9a-f]{40}$/i.test(sha)) failures.push('INVALID_MAIN_SHA');
  if(e?.main_merge?.merged!==true||e.main_merge.sha!==sha) failures.push('MAIN_MERGE_UNVERIFIED');
  const checks=[
    ['production_pages_deploy','PAGES_DEPLOY'],
    ['public_smoke','PUBLIC_SMOKE'],
    ['production_live_resource_integrity','LIVE_RESOURCE_INTEGRITY']
  ];
  for(const [field,label] of checks) {
    const v=e?.[field];
    if(!v||v.conclusion!=='success'||v.status!=='completed'||
       v.head_sha!==sha||!Number.isSafeInteger(v.run_id)||v.run_id<=0)
       failures.push(label+'_NOT_EXACT_SHA_SUCCESS');
  }
  if(e?.production_live_resource_integrity?.run_id===e?.production_pages_deploy?.run_id)
    failures.push('INTEGRITY_NOT_INDEPENDENT');
  if(e?.source_718?.main_sha!==sha||e?.source_718?.confirmed!==true)
    failures.push('BUILD_718_BASELINE_NOT_RECONCILED');
  // External owner custody and media are separate from deploy success.
  const external=e?.external_sla;
  const media=e?.media_closure;
  const ninth=e?.ninth_reviewer;
  const independentlyVerified=(x)=>x?.source_verified===true&&
    x?.signature_verified===true&&x?.freshness_verified===true&&
    typeof x?.receipt_id==='string'&&x.receipt_id.length>0;
  const outstanding={
    external_sla:!independentlyVerified(external),
    ninth_reviewer:!independentlyVerified(ninth),
    original_media:media?.signed_source_verified!==true||
      media?.r2_head_verified!==true||media?.owner_attestation_fresh!==true
  };
  return {
    build:719,main_sha:sha||null,
    production_green:failures.length===0,
    production_gate_failures:failures,
    independent_business_closure_certified:failures.length===0&&
      !Object.values(outstanding).some(Boolean),
    outstanding,
    no_automatic_external_contact:true,
    no_automatic_financial_close:true
  };
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(!process.argv[2]) {console.error('Provide a separately retrieved evidence JSON file');process.exitCode=2;}
 else {
  try {
   const result=reconcile719(JSON.parse(readFileSync(process.argv[2],'utf8')));
   console.log(JSON.stringify(result,null,2));
   if(!result.production_green)process.exitCode=1;
  } catch(error) {console.error(error.message);process.exitCode=2;}
 }
}
