import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==7)throw new Error('Unexpected Build 322 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=(i)=>(sets[i]?.results||[])[0]||{};
const search=row(0),eligible=row(1),attribution=row(2),queue=row(3),telemetry=row(4),trace=row(5),population=row(6);
if(Number(population.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations='+population.foreign_key_violations);
if(Number(trace.orphan_search_rows||0)!==0)throw new Error('Orphan Search Console rows='+trace.orphan_search_rows);
if(Number(trace.mismatched_batches||0)!==0)throw new Error('Search Console batch row-count mismatches='+trace.mismatched_batches);
if(Number(population.published_reviewed_stories||0)<1||Number(population.active_reviewed_products||0)<1)throw new Error('Reviewed public population missing');
const allRows=Number(search.all_search_rows||0),recentRows=Number(search.recent_search_rows||0),eligiblePairs=Number(eligible.eligible_pairs||0);
let interpretation='EVIDENCE_PENDING_NO_REAL_SEARCH_CONSOLE_ATTRIBUTION';
if(allRows>0&&recentRows===0)interpretation='REAL_EVIDENCE_STALE_NON_ACTIONABLE';
if(recentRows>0&&eligiblePairs===0)interpretation='REAL_EVIDENCE_NO_SUPPORTED_SEO_OPPORTUNITY';
if(recentRows>0&&eligiblePairs>0)interpretation='REAL_EVIDENCE_REVIEW_QUEUE_ELIGIBLE';
const evidence={release:467,build:322,exact_development_sha:sha,statement_count:7,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 search_console:search,eligible_review_pairs:eligible,route_attribution:attribution,seo_review_queue:queue,public_telemetry:telemetry,search_intake_traceability:trace,public_population:population,interpretation,
 attribution_mode:'QUERY_LEVEL_ATTRIBUTION_ONLY_FROM_REAL_SEARCH_CONSOLE',query_level_attribution_requires_real_search_console:true,public_telemetry_observation_only:true,
 unsupported_or_stale_pending_rows_non_actionable:true,generated_seo_copy:false,queue_mutation:false,automatic_queue_generation:false,automatic_seo_apply:false,
 indexnow_execution:false,provider_execution:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD322_INTERPRETATION=',interpretation);
console.log('BUILD322_SEARCH=',JSON.stringify(search));
console.log('BUILD322_ELIGIBLE=',JSON.stringify(eligible));
console.log('BUILD322_ATTRIBUTION=',JSON.stringify(attribution));
console.log('BUILD322_QUEUE=',JSON.stringify(queue));
console.log('BUILD322_TELEMETRY=',JSON.stringify(telemetry));
console.log('BUILD322_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD322_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD322_BUYER_DISCOVERY_ATTRIBUTION_CONTINUITY=GREEN');
