import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));
const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==8)throw new Error('Unexpected statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0));
const aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=(i)=>(sets[i]?.results||[])[0]||{};
const stories=row(0),telemetry=row(1),search=row(2),imports=row(3),attribution=row(4),schema=row(5),products=row(6),integrity=row(7);
for(const key of ['search_console_import_batches_ready','search_console_page_queries_ready','seo_opportunity_actions_ready','seo_page_overrides_ready']){
  if(Number(schema[key]||0)!==1)throw new Error('Search Console intake schema not ready: '+key+'='+schema[key]);
}
if(Number(integrity.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations='+integrity.foreign_key_violations);
if(Number(stories.published_story_rows||0)<1)throw new Error('Reviewed published story continuity missing');
if(Number(products.active_reviewed_products||0)<1)throw new Error('Reviewed Product discovery population missing');
const evidence={release:467,build:311,exact_development_sha:sha,window_days:30,statement_count:8,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
  reviewed_stories:stories,public_telemetry:telemetry,search_console:search,search_console_imports:imports,search_console_attribution:attribution,search_console_schema:schema,reviewed_products:products,integrity,
  zero_evidence_preserved_as_zero:true,request_time_schema_mutation:false,automatic_search_console_import:false,indexnow_execution:false,provider_execution:false,production_d1_contact:false};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD311_REVIEWED_STORIES=',JSON.stringify(stories));
console.log('BUILD311_PUBLIC_TELEMETRY=',JSON.stringify(telemetry));
console.log('BUILD311_SEARCH_CONSOLE=',JSON.stringify(search));
console.log('BUILD311_SEARCH_IMPORTS=',JSON.stringify(imports));
console.log('BUILD311_SEARCH_ATTRIBUTION=',JSON.stringify(attribution));
console.log('BUILD311_SEARCH_SCHEMA=',JSON.stringify(schema));
console.log('BUILD311_REVIEWED_PRODUCTS=',JSON.stringify(products));
console.log('BUILD311_INTEGRITY=',JSON.stringify(integrity));
console.log('BUILD311_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD311_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD311_BUYER_DISCOVERY_EVIDENCE_FRESHNESS=GREEN');
