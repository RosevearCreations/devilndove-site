import fs from 'node:fs';
const [input,sha,output]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==14)throw new Error('Unexpected statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=i=>(sets[i]?.results||[])[0]||{};
const maker=row(0),identity=row(1),media=row(2),bridge=row(3),deliverables=row(4),journal=row(5),social=row(6),engagement=row(7),runtimeSearch=row(8),merchant=row(9),friction=row(10),target=row(11),coverage=row(12),fk=row(13);
for(const key of ['duplicate_caip_source_identities','duplicate_content_source_identities','duplicate_workstation_memberships'])if(Number(identity[key]||0)!==0)throw new Error('Duplicate identity drift '+key);
if(Number(fk.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations');
if(Number(target.maker_story_profile||0)!==1||Number(target.content_package||0)!==1||Number(target.published_journal||0)!==1||Number(target.social_ready_review_first||0)!==1||Number(target.social_posted||0)!==0)throw new Error('Under the Sea adoption path drift');
if(Number(target.selected_evidence||0)!==3||Number(target.approved_deliverables||0)!!==2||Number(target.locked_deliverables||0)!==2)throw new Error('Under the Sea review state drift');
if(Number(coverage.projects_with_caip_workspace||0)!==Number(coverage.active_projects||0)||Number(coverage.projects_with_content_package||0)!==Number(coverage.active_projects||0))throw new Error('Bridge identity coverage drift');
const evidence={release:467,build:306,exact_development_sha:sha,statement_count:sets.length,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 maker_story:maker,identity,private_media:media,bridge,deliverables,journal,social,engagement_30d:engagement,runtime_search:runtimeSearch,merchant,friction,target_path:target,coverage,foreign_keys:fk,
 provider_execution:false,provider_publication:false,indexnow_submission:false,automatic_publication:false,production_d1_contact:false,d1_mutation:false,r2_mutation:false};
fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
for(const [label,value] of Object.entries({MAKER_STORY:maker,IDENTITY:identity,PRIVATE_MEDIA:media,BRIDGE:bridge,DELIVERABLES:deliverables,JOURNAL:journal,SOCIAL:social,ENGAGEMENT:engagement,RUNTIME_SEARCH:runtimeSearch,MERCHANT:merchant,FRICTION:friction,TARGET_PATH:target,COVERAGE:coverage}))console.log('BUILD306_'+label+'=',JSON.stringify(value));
console.log('BUILD306_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD306_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD306_OUTCOME_REMEASUREMENT=GREEN');
