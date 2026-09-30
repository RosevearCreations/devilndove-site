import fs from 'node:fs';
const [input,sha,output]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==16)throw new Error('Unexpected statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=i=>(sets[i]?.results||[])[0]||{};
const maker=row(0),identity=row(1),media=row(2),bridge=row(3),deliverables=row(4),journal=row(5),social=row(6),engagement=row(7),runtimeSearch=row(8),merchant=row(9),friction=row(10),underSea=row(11),promo=row(12),coverage=row(13),searchSchema=row(14),fk=row(15);
for(const key of ['duplicate_caip_source_identities','duplicate_content_source_identities','duplicate_workstation_memberships'])if(Number(identity[key]||0)!==0)throw new Error('Duplicate identity drift '+key);
if(Number(fk.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations');
if(Number(coverage.projects_with_caip_workspace||0)!==Number(coverage.active_projects||0)||Number(coverage.projects_with_content_package||0)!==Number(coverage.active_projects||0))throw new Error('Bridge identity coverage drift');
if(Number(underSea.maker_story_profile||0)!==1||Number(underSea.reviewed_profile||0)!==1||Number(underSea.public_candidate||0)!==1||Number(underSea.published_journal||0)!==1||Number(underSea.social_ready_review_first||0)!==1||Number(underSea.social_posted||0)!==0)throw new Error('Under the Sea continuity drift');
if(Number(promo.maker_story_profile||0)!==1||Number(promo.content_package||0)!==1||Number(promo.publications||0)!==0||Number(promo.social_rows||0)!==0)throw new Error('35th promo continuity drift');
for(const key of ['search_console_import_batches_ready','search_console_page_queries_ready','seo_opportunity_actions_ready','seo_page_overrides_ready'])if(Number(searchSchema[key]||0)!==1)throw new Error('Search Console schema drift '+key);
const evidence={release:467,build:312,exact_development_sha:sha,statement_count:sets.length,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 maker_story:maker,identity,private_media:media,bridge,deliverables,workshop_journal:journal,social,engagement_30d:engagement,runtime_search:runtimeSearch,merchant,friction,
 under_the_sea:underSea,second_story_35th_promo:promo,coverage,search_console_schema:searchSchema,foreign_keys:fk,
 comparison_baselines:{build300:{maker_profiles:0,selected_evidence_rows:0,approved_deliverables:0,published_journal_rows:0,approved_social_rows:0,search_console_rows:0},build306:{maker_profiles:1,selected_evidence_rows:3,approved_deliverables:2,copy_locked_deliverables:2,published_journal_rows:1,approved_social_rows:1,search_console_rows:0,active_project_maker_story_coverage:'1/5'}},
 provider_execution:false,provider_publication:false,indexnow_execution:false,automatic_publication:false,traffic_fabrication:false,production_d1_contact:false,d1_mutation:false,r2_mutation:false};
fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
for(const [label,value] of Object.entries({MAKER_STORY:maker,IDENTITY:identity,PRIVATE_MEDIA:media,BRIDGE:bridge,DELIVERABLES:deliverables,JOURNAL:journal,SOCIAL:social,ENGAGEMENT:engagement,RUNTIME_SEARCH:runtimeSearch,MERCHANT:merchant,FRICTION:friction,UNDER_SEA:underSea,SECOND_STORY:promo,COVERAGE:coverage,SEARCH_SCHEMA:searchSchema}))console.log('BUILD312_'+label+'=',JSON.stringify(value));
console.log('BUILD312_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD312_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD312_OUTCOMES_RENEWAL_II=GREEN');
