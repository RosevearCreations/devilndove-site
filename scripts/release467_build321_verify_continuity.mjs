import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==6)throw new Error('Unexpected continuity statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=(i)=>(sets[i]?.results||[])[0]||{};
const schema=row(0),batches=row(1),audit=row(2),population=row(3),coverage=row(4),integrity=row(5);
for(const key of ['search_console_import_batches_ready','search_console_page_queries_ready','seo_opportunity_actions_ready','seo_page_overrides_ready','admin_action_audit_ready'])if(Number(schema[key]||0)!==1)throw new Error('Canonical intake schema not ready: '+key);
if(Number(integrity.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations='+integrity.foreign_key_violations);
if(Number(batches.mismatched_batches||0)!==0)throw new Error('Search Console batch/live-row mismatch='+batches.mismatched_batches);
if(Number(batches.orphan_rows||0)!==0)throw new Error('Orphan Search Console rows='+batches.orphan_rows);
const batchCount=Number(batches.import_batches||0),liveRows=Number(batches.live_rows||0),declared=Number(batches.declared_rows||0);
if(declared!==liveRows)throw new Error('Declared/live Search Console row mismatch');
if(Number(population.total_rows||0)!==liveRows)throw new Error('Population/live row mismatch');
if(Number(population.invalid_metric_rows||0)!==0)throw new Error('Invalid negative Search Console metrics present');
let acceptance_state='EVIDENCE_PENDING_NO_REAL_EXPORT';
if(batchCount===0&&liveRows===0){
  acceptance_state='EVIDENCE_PENDING_NO_REAL_EXPORT';
}else{
  if(batchCount<1||liveRows<1)throw new Error('Partial Search Console intake state requires review');
  if(Number(batches.operator_bound_batches||0)!==batchCount)throw new Error('Every current batch must remain operator-bound');
  if(Number(batches.csv_named_batches||0)!==batchCount)throw new Error('Every current batch must retain a CSV source filename');
  if(Number(audit.import_audits||0)<1)throw new Error('Current staged evidence lacks import audit traceability');
  if(Number(population.rows_with_page||0)!==liveRows)throw new Error('Current staged evidence contains rows without a page');
  acceptance_state='REAL_OPERATOR_EVIDENCE_ACCEPTED';
}
const evidence={release:467,build:321,exact_development_sha:sha,phase:'search_console_real_export_intake_continuity_ii',
 statement_count:6,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 schema,batches,audit,population,coverage,integrity,acceptance_state,
 real_export_confirmation_required:true,real_export_header_validation:true,
 synthetic_rows:false,automatic_import:false,request_time_schema_mutation:false,
 automatic_seo_action_generation:false,automatic_seo_apply:false,indexnow_execution:false,provider_execution:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD321_SEARCH_CONSOLE_CONTINUITY_STATE=',acceptance_state);
console.log('BUILD321_BATCHES=',JSON.stringify(batches));
console.log('BUILD321_AUDIT=',JSON.stringify(audit));
console.log('BUILD321_POPULATION=',JSON.stringify(population));
console.log('BUILD321_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD321_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD321_SEARCH_CONSOLE_REAL_EXPORT_CONTINUITY=GREEN');
