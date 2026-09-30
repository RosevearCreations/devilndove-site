import fs from 'node:fs';
const [input,sha,output]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==6)throw new Error('Unexpected Build 325 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const rows=i=>Array.isArray(sets[i]?.results)?sets[i].results:[];
const row=i=>rows(i)[0]||{};
const promo=row(0),grey=row(1),search=row(2),unprofiled=rows(3),summary=row(4),integrity=row(5);
if(Number(promo.creative_work_project_id||0)!==5)throw new Error('35th promo identity missing');
if(Number(grey.creative_work_project_id||0)!==6)throw new Error('Grey Hair identity missing');
if(Number(summary.active_projects||0)!==5)throw new Error('Expected five active Creative Projects');
for(const k of ['duplicate_caip_source_identities','duplicate_content_source_identities','duplicate_maker_story_profiles','foreign_key_violations'])if(Number(integrity[k]||0)!==0)throw new Error('Integrity drift '+k+'='+integrity[k]);

const queue=[];
const push=(x)=>queue.push({...x,write_capability:'none',acknowledgement_persistence:false,owner_assignment_persistence:false,resolution_persistence:false});
const promoBlocked=String(promo.outcome_status||'unknown')==='unknown'||String(promo.story_review_status||'')!=='reviewed'||Number(promo.public_story_candidate||0)!==1;
if(promoBlocked)push({
 gap_key:'35th_promo_real_outcome_evidence',gap_family:'35TH_PROMO_REAL_OUTCOME_EVIDENCE',priority:1,owner_module:'creator',owner_label:'Creator / Creative Process',
 target_type:'creative_work_project',target_id:5,target_title:String(promo.project_title||'35th promo'),
 current_state:'FACTUAL_OUTCOME_EVIDENCE_REQUIRED',blocker:'Real execution, result and lesson evidence must exist before story review/public candidacy can advance.',
 action_text:'Record only the real execution/result/lesson evidence that actually happened, then remeasure the existing Maker Story.',
 workspace_href:'/admin/creative-process/?project_id=5',
 traceability_source:'creative_work_events + admin_action_audit',last_observed_at:String(promo.latest_execution_intake_audit_at||promo.latest_project_event_at||'')
});
const greyBlocked=Number(grey.source_evidence_needs_review||0)>0||Number(grey.reviewed_story_plans||0)===0||Number(grey.maker_story_profiles||0)===0;
if(greyBlocked)push({
 gap_key:'grey_hair_source_evidence_review',gap_family:'GREY_HAIR_SOURCE_EVIDENCE_REVIEW',priority:1,owner_module:'creator_caip',owner_label:'Creator / CAIP Review',
 target_type:'creative_work_project',target_id:6,target_title:String(grey.project_title||'Grey Hair'),
 current_state:Number(grey.source_evidence_needs_review||0)>0?'SOURCE_EVIDENCE_REVIEW_REQUIRED':'STORY_PLAN_OR_PROFILE_READINESS_REQUIRED',
 blocker:Number(grey.source_evidence_needs_review||0)+' active source-evidence range(s) still require explicit review; reviewed story planning/profile creation remains downstream.',
 action_text:'Review the existing source ranges explicitly in the Grey Hair readiness workspace; do not infer media rights or auto-create a Maker Story.',
 workspace_href:'/admin/grey-hair-story-readiness/',
 traceability_source:'creative_media_evidence_ranges + caip_story_builder_drafts',last_observed_at:String(grey.latest_evidence_review_at||'')
});
const searchBlocked=Number(search.import_batches||0)===0||Number(search.live_rows||0)===0;
if(searchBlocked)push({
 gap_key:'real_search_console_export',gap_family:'REAL_SEARCH_CONSOLE_EXPORT',priority:1,owner_module:'seo_discovery',owner_label:'SEO / Discovery',
 target_type:'search_console',target_id:null,target_title:'Google Search Console evidence',
 current_state:'EVIDENCE_PENDING_NO_REAL_EXPORT',blocker:'No real operator Search Console Performance export is staged.',
 action_text:'Import a genuine Search Console Performance CSV through the existing operator-controlled intake; do not synthesize clicks, impressions or queries.',
 workspace_href:'/admin/release-control/runtime-storefront-intelligence/',
 traceability_source:'search_console_import_batches + search_console_page_queries + admin_action_audit',last_observed_at:String(search.latest_search_console_audit_at||'')
});
for(const p of unprofiled){
 if(Number(p.creative_work_project_id||0)===6)continue;
 push({
  gap_key:'unprofiled_project_'+Number(p.creative_work_project_id||0),gap_family:'UNPROFILED_MAKER_STORY_EVIDENCE',priority:2,owner_module:'creator',owner_label:'Creator / Creative Process',
  target_type:'creative_work_project',target_id:Number(p.creative_work_project_id||0),target_title:String(p.project_title||'Unprofiled project'),
  current_state:'MAKER_STORY_EVIDENCE_REQUIRED',blocker:'No Maker Story profile exists and the project has not yet met the factual readiness rule.',
  action_text:'Capture/review real project events and evidence in Creative Process. Maker Story creation remains blocked until the factual prerequisites are satisfied.',
  workspace_href:'/admin/creative-process/?project_id='+Number(p.creative_work_project_id||0),
  traceability_source:'creative_work_events + creative_project_evidence_selections',last_observed_at:String(p.latest_project_event_at||'')
 });
}
queue.sort((a,b)=>a.priority-b.priority||a.target_title.localeCompare(b.target_title));
const families=[...new Set(queue.map(x=>x.gap_family))];
const evidence={release:467,build:325,exact_development_sha:sha,statement_count:6,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 queue,queue_summary:{active_queue_rows:queue.length,active_gap_families:families.length,gap_families:families,unprofiled_projects:unprofiled.length},
 source_state:{promo,grey_hair:grey,search_console:search,unprofiled_projects:unprofiled,summary,integrity},
 decision:queue.length?'ACTION_QUEUE_OPEN_REAL_EVIDENCE_REQUIRED':'NO_CURRENT_EVIDENCE_GAPS',
 boundaries:{read_only:true,shadow_task_table:false,owner_assignment_persistence:false,acknowledgement_persistence:false,resolution_persistence:false,no_completion_by_queue_state:true,business_data_mutation:false,evidence_mutation:false,story_mutation:false,search_console_mutation:false,seo_mutation:false,provider_execution:false,production_d1_contact:false}};
fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD325_QUEUE=',JSON.stringify(queue));
console.log('BUILD325_QUEUE_SUMMARY=',JSON.stringify(evidence.queue_summary));
console.log('BUILD325_SOURCE_STATE=',JSON.stringify(evidence.source_state));
console.log('BUILD325_DECISION=',evidence.decision);
console.log('BUILD325_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD325_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD325_EVIDENCE_GAP_OWNER_QUEUE=GREEN');
