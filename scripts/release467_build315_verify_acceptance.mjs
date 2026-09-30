import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==6)throw new Error('Unexpected acceptance statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=(i)=>(sets[i]?.results||[])[0]||{};
const schema=row(0),batches=row(1),audit=row(2),attribution=row(3),population=row(4),integrity=row(5);
for(const key of ['search_console_import_batches_ready','search_console_page_queries_ready','seo_opportunity_actions_ready','seo_page_overrides_ready','admin_action_audit_ready'])if(Number(schema[key]||0)!==1)throw new Error('Canonical intake schema not ready: '+key);
if(Number(integrity.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations='+integrity.foreign_key_violations);
if(Number(batches.mismatched_batches||0)!==0)throw new Error('Search Console batch/live-row mismatch='+batches.mismatched_batches);
if(Number(batches.orphan_rows||0)!==0)throw new Error('Orphan Search Console rows='+batches.orphan_rows);
if(Number(attribution.total_rows||0)!==Number(batches.live_rows||0))throw new Error('Attribution/live-row total mismatch');
if(Number(attribution.reviewed_story_rows||0)+Number(attribution.reviewed_product_rows||0)+Number(attribution.other_public_rows||0)!==Number(attribution.total_rows||0))throw new Error('Attribution categories do not reconcile');
if(Number(population.published_reviewed_stories||0)<1||Number(population.active_reviewed_products||0)<1)throw new Error('Reviewed public attribution population missing');
let acceptance_state='EVIDENCE_PENDING_NO_REAL_EXPORT';
const batchCount=Number(batches.import_batches||0),liveRows=Number(batches.live_rows||0);
if(batchCount===0&&liveRows===0){
  acceptance_state='EVIDENCE_PENDING_NO_REAL_EXPORT';
}else{
  if(batchCount<1||liveRows<1)throw new Error('Partial Search Console intake state requires review');
  if(Number(batches.operator_bound_batches||0)!==batchCount)throw new Error('Current batch is not operator-bound');
  if(Number(audit.import_audits||0)<1)throw new Error('Real staged evidence lacks import audit traceability');
  acceptance_state='REAL_OPERATOR_EVIDENCE_ACCEPTED';
}
const evidence={release:467,build:315,exact_development_sha:sha,phase:'operator_intake_acceptance',statement_count:6,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 schema,batches,audit,attribution,population,integrity,acceptance_state,
 real_export_required_for_discovery_claims:true,synthetic_rows:false,automatic_import:false,request_time_schema_mutation:false,
 automatic_seo_action_generation:false,automatic_seo_apply:false,indexnow_execution:false,provider_execution:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD315_SEARCH_CONSOLE_ACCEPTANCE_STATE=',acceptance_state);
console.log('BUILD315_BATCHES=',JSON.stringify(batches));
console.log('BUILD315_AUDIT=',JSON.stringify(audit));
console.log('BUILD315_ATTRIBUTION=',JSON.stringify(attribution));
console.log('BUILD315_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD315_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD315_SEARCH_CONSOLE_OPERATOR_INTAKE=GREEN');
