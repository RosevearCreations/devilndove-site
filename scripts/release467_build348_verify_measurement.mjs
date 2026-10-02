import fs from 'node:fs';
const [input,sha,output]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==18)throw new Error('Unexpected Build 348 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=i=>(sets[i]?.results||[])[0]||{};
const maker=row(0),identity=row(1),media=row(2),bridge=row(3),deliverables=row(4),journal=row(5),social=row(6),engagement=row(7),runtimeSearch=row(8),merchant=row(9),friction=row(10),underSea=row(11),promo=row(12),coverage=row(13),searchSchema=row(14),fk=row(15),seoQueue=row(16),third=row(17);
for(const key of ['duplicate_caip_source_identities','duplicate_content_source_identities','duplicate_workstation_memberships'])if(Number(identity[key]||0)!==0)throw new Error('Duplicate identity drift '+key);
if(Number(fk.foreign_key_violations||0)!==0)throw new Error('Foreign-key violations');
if(Number(coverage.projects_with_caip_workspace||0)!==Number(coverage.active_projects||0)||Number(coverage.projects_with_content_package||0)!==Number(coverage.active_projects||0))throw new Error('Bridge identity coverage drift');
if(Number(coverage.active_projects||0)!==5)throw new Error('Expected five active Creative Projects');
if(Number(underSea.maker_story_profile||0)!==1||Number(underSea.reviewed_profile||0)!==1||Number(underSea.public_candidate||0)!==1||Number(underSea.published_journal||0)!==1||Number(underSea.social_ready_review_first||0)!==1||Number(underSea.social_posted||0)!==0)throw new Error('Under the Sea continuity drift');
if(Number(promo.maker_story_profile||0)!==1||Number(promo.content_package||0)!==1)throw new Error('35th promo identity continuity drift');
for(const key of ['search_console_import_batches_ready','search_console_page_queries_ready','seo_opportunity_actions_ready','seo_page_overrides_ready'])if(Number(searchSchema[key]||0)!==1)throw new Error('Search Console schema drift '+key);

const current={maker_profiles:Number(maker.maker_profiles||0),reviewed_maker_stories:Number(maker.reviewed_maker_stories||0),public_story_candidates:Number(maker.public_story_candidates||0),selected_evidence_rows:Number(media.selected_evidence_rows||0),approved_deliverables:Number(deliverables.approved_deliverables||0),copy_locked_deliverables:Number(deliverables.copy_locked_deliverables||0),published_journal_rows:Number(journal.published_journal_rows||0),approved_social_rows:Number(social.approved_social_rows||0),posted_social_rows:Number(social.posted_social_rows||0),search_console_rows:Number(runtimeSearch.search_console_rows_30d||0),search_console_clicks:Number(runtimeSearch.search_console_clicks_30d||0),search_console_impressions:Number(runtimeSearch.search_console_impressions_30d||0),coverage:Number(coverage.projects_with_maker_story_profile||0)+'/'+Number(coverage.active_projects||0),page_views_30d:Number(engagement.total_page_views_30d||0),unique_visitors_30d:Number(engagement.unique_visitors_30d||0),runtime_errors_7d:Number(runtimeSearch.runtime_errors_7d||0),seo_supported_rows:Number(seoQueue.currently_supported_rows||0),third_story_ready_projects:Number(third.third_story_ready_projects||0)};
const build342={maker_profiles:2,reviewed_maker_stories:1,public_story_candidates:1,selected_evidence_rows:4,approved_deliverables:4,copy_locked_deliverables:4,published_journal_rows:1,approved_social_rows:1,search_console_rows:0,coverage:'2/5',rows_read:2847,page_views_30d:22,unique_visitors_30d:22,runtime_errors_7d:0,decision:'ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST'};
const delta={};for(const k of ['maker_profiles','reviewed_maker_stories','public_story_candidates','selected_evidence_rows','approved_deliverables','copy_locked_deliverables','published_journal_rows','approved_social_rows','search_console_rows','page_views_30d','unique_visitors_30d','runtime_errors_7d'])delta[k]=current[k]-build342[k];
const promoReviewed=Number(promo.reviewed_profile||0)===1&&Number(promo.public_candidate||0)===1&&Number(promo.unknown_outcome||0)===0;
let decision='ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST';
if(current.third_story_ready_projects>0||promoReviewed||current.maker_profiles>2||current.reviewed_maker_stories>1||current.published_journal_rows>1)decision='ADOPTION_PROGRESS_OBSERVED';
else if(current.search_console_rows>0||current.seo_supported_rows>0)decision='REAL_DISCOVERY_EVIDENCE_OBSERVED';
const historical={
 build300:{maker_profiles:0,reviewed_maker_stories:0,public_story_candidates:0,selected_evidence_rows:0,approved_deliverables:0,copy_locked_deliverables:0,published_journal_rows:0,approved_social_rows:0,search_console_rows:0,coverage:'0/5',rows_read:471},
 build306:{maker_profiles:1,reviewed_maker_stories:0,public_story_candidates:0,selected_evidence_rows:3,approved_deliverables:2,copy_locked_deliverables:2,published_journal_rows:1,approved_social_rows:1,search_console_rows:0,coverage:'1/5',rows_read:1067},
 build312:{...build342,rows_read:2820},build318:build342,build324:build342,build330:build342,build336:build342,build342,
 build347:{readiness_counts:{MAKER_STORY_EVIDENCE_REQUIRED:3,FACTUAL_OUTCOME_EVIDENCE_REQUIRED:1,PUBLISHED_REVIEWED_STORY:1},rows_read:672,decision:'PUBLISHED_BASELINE_STABLE_REMAINING_PROJECTS_NOT_READY',measurement_scope:'NARROWER_BUILD347_READINESS_CONTRACT'}
};
const evidence={
 release:467,build:348,exact_development_sha:sha,statement_count:18,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 maker_story:maker,identity,private_media:media,bridge,deliverables,workshop_journal:journal,social,engagement_30d:engagement,runtime_search:runtimeSearch,merchant,friction,under_the_sea:underSea,second_story_35th_promo:promo,coverage,search_console_schema:searchSchema,foreign_keys:fk,seo_review_queue:seoQueue,third_project_readiness:third,current,
 comparison_baselines:historical,comparison_to_build342:delta,decision,
 roadmap_signal:{second_story_needs_execution_result_lesson:!promoReviewed,search_console_real_fresh_evidence_present:current.search_console_rows>0,evidence_backed_fresh_seo_rows_present:current.seo_supported_rows>0,third_project_factually_ready:current.third_story_ready_projects>0,grey_hair_approved_source_evidence:Number(third.grey_hair_approved_source_evidence||0),grey_hair_execution_events:Number(third.grey_hair_execution_events||0),grey_hair_reviewed_story_plans:Number(third.grey_hair_reviewed_story_plans||0),renewal_contract_rows_read_delta_vs_build342:aggregate-build342.rows_read},
 provider_execution:false,provider_publication:false,indexnow_execution:false,automatic_publication:false,automatic_story_generation:false,automatic_seo_apply:false,traffic_fabrication:false,production_d1_contact:false,d1_mutation:false,r2_mutation:false
};
fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD348_CURRENT=',JSON.stringify(current));
console.log('BUILD348_DELTA_VS_BUILD342=',JSON.stringify(delta));
console.log('BUILD348_MAKER_STORY=',JSON.stringify(maker));
console.log('BUILD348_ENGAGEMENT=',JSON.stringify(engagement));
console.log('BUILD348_RUNTIME_SEARCH=',JSON.stringify(runtimeSearch));
console.log('BUILD348_SECOND_STORY=',JSON.stringify(promo));
console.log('BUILD348_THIRD_PROJECT=',JSON.stringify(third));
console.log('BUILD348_DECISION=',decision);
console.log('BUILD348_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD348_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD348_OUTCOMES_RENEWAL_VIII=GREEN');
