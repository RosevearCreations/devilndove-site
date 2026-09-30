import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==6)throw new Error('Unexpected Build 316 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=(i)=>(sets[i]?.results||[])[0]||{};
const search=row(0),eligible=row(1),queue=row(2),telemetry=row(3),population=row(4),integrity=row(5);
if(Number(integrity.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations='+integrity.foreign_key_violations);
if(Number(integrity.orphan_search_rows||0)!==0)throw new Error('Orphan Search Console rows='+integrity.orphan_search_rows);
if(Number(population.published_reviewed_stories||0)<1||Number(population.active_reviewed_products||0)<1)throw new Error('Reviewed public population missing');
const searchRows=Number(search.search_rows||0),eligiblePairs=Number(eligible.eligible_pairs||0);
let interpretation='EVIDENCE_PENDING_NO_SEARCH_QUERY_DATA';
if(searchRows>0&&eligiblePairs===0)interpretation='REAL_EVIDENCE_NO_SUPPORTED_SEO_OPPORTUNITY';
if(searchRows>0&&eligiblePairs>0)interpretation='REAL_EVIDENCE_REVIEW_QUEUE_ELIGIBLE';
const evidence={release:467,build:316,exact_development_sha:sha,statement_count:6,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 search,eligible_review_pairs:eligible,seo_review_queue:queue,public_telemetry:telemetry,public_population:population,integrity,interpretation,
 query_level_actions_require_real_search_console_evidence:true,public_telemetry_observation_only:true,generated_seo_copy:false,queue_mutation:false,
 automatic_queue_generation:false,automatic_seo_apply:false,indexnow_execution:false,provider_execution:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD316_INTERPRETATION=',interpretation);
console.log('BUILD316_SEARCH=',JSON.stringify(search));
console.log('BUILD316_ELIGIBLE=',JSON.stringify(eligible));
console.log('BUILD316_QUEUE=',JSON.stringify(queue));
console.log('BUILD316_TELEMETRY=',JSON.stringify(telemetry));
console.log('BUILD316_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD316_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD316_BUYER_DISCOVERY_INTERPRETATION=GREEN');
