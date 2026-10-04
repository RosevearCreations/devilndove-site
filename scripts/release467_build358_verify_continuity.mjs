import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==9)throw new Error('Unexpected Build 358 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=i=>(sets[i]?.results||[])[0]||{};
const schema=row(0),batches=row(1),audit=row(2),population=row(3),freshness=row(4),eligible=row(5),attribution=row(6),queue=row(7),integrity=row(8);
for(const key of ['search_console_import_batches_ready','search_console_page_queries_ready','seo_opportunity_actions_ready','seo_page_overrides_ready','admin_action_audit_ready'])if(Number(schema[key]||0)!==1)throw new Error('Canonical intake schema not ready: '+key);
if(Number(integrity.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations='+integrity.foreign_key_violations);
if(Number(batches.mismatched_batches||0)!==0)throw new Error('Search Console batch/live-row mismatch='+batches.mismatched_batches);
if(Number(batches.orphan_rows||0)!==0)throw new Error('Orphan Search Console rows='+batches.orphan_rows);
const batchCount=Number(batches.import_batches||0),liveRows=Number(batches.live_rows||0),declared=Number(batches.declared_rows||0),recent=Number(freshness.recent_search_rows||0),eligiblePairs=Number(eligible.eligible_pairs||0);
if(declared!==liveRows||Number(population.total_rows||0)!==liveRows)throw new Error('Search Console declared/live/population mismatch');
if(Number(population.invalid_metric_rows||0)!==0)throw new Error('Invalid negative Search Console metrics present');
if(Number(population.invalid_report_date_rows||0)!==0)throw new Error('Invalid/missing report dates make freshness untrustworthy');
let state='EVIDENCE_PENDING_NO_REAL_EXPORT';
if(batchCount===0&&liveRows===0){
 state='EVIDENCE_PENDING_NO_REAL_EXPORT';
}else{
 if(batchCount<1||liveRows<1)throw new Error('Partial Search Console intake state requires review');
 if(Number(batches.operator_bound_batches||0)!==batchCount)throw new Error('Every batch must remain operator-bound');
 if(Number(batches.csv_named_batches||0)!==batchCount)throw new Error('Every batch must retain a CSV source filename');
 if(Number(audit.import_audits||0)<batchCount)throw new Error('Current evidence lacks per-batch import audit traceability');
 if(Number(population.rows_with_page||0)!==liveRows)throw new Error('Current evidence contains rows without a page');
 if(recent===0)state='REAL_EVIDENCE_STALE_NON_ACTIONABLE';
 else if(eligiblePairs===0)state='REAL_EVIDENCE_FRESH_NO_SUPPORTED_SEO_OPPORTUNITY';
 else state='REAL_EVIDENCE_FRESH_REVIEW_QUEUE_ELIGIBLE';
}
const evidence={release:467,build:358,exact_development_sha:sha,statement_count:9,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 schema,batches,audit,population,freshness,eligible_review_pairs:eligible,route_attribution:attribution,seo_review_queue:queue,integrity,interpretation:state,
 freshness_window_days:30,fallback_report_date_required_when_date_column_absent:true,query_level_attribution_requires_real_search_console:true,
 stale_or_unsupported_pending_rows_non_actionable:true,real_export_confirmation_required:true,explicit_report_date_only:true,imported_at_freshness_fallback:false,created_at_freshness_fallback:false,synthetic_rows:false,automatic_import:false,
 queue_mutation:false,automatic_queue_generation:false,automatic_seo_apply:false,indexnow_execution:false,provider_execution:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD358_INTERPRETATION=',state);
console.log('BUILD358_BATCHES=',JSON.stringify(batches));
console.log('BUILD358_FRESHNESS=',JSON.stringify(freshness));
console.log('BUILD358_ELIGIBLE=',JSON.stringify(eligible));
console.log('BUILD358_QUEUE=',JSON.stringify(queue));
console.log('BUILD358_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD358_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD358_SEARCH_CONSOLE_FRESH_DISCOVERY_INTAKE=GREEN');
