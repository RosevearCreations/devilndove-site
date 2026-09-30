import fs from 'node:fs';
const [input,sha,output]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==6)throw new Error('Unexpected Build 323 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const rows=i=>Array.isArray(sets[i]?.results)?sets[i].results:[];
const row=i=>rows(i)[0]||{};
const projects=rows(0),summary=row(1),rights=row(2),completion=row(3),social=row(4),integrity=row(5);
if(projects.length!==5)throw new Error('Expected exactly five active Creative Projects; observed '+projects.length);
const ids=new Set(projects.map(p=>Number(p.creative_work_project_id||0)));
if(ids.size!==projects.length)throw new Error('Duplicate active Creative Project identity in Build 323 measurement');
for(const p of projects){
 if(Number(p.caip_workspaces||0)!==1)throw new Error('CAIP workspace identity drift for project '+p.creative_work_project_id);
 if(Number(p.content_packages||0)!==1)throw new Error('Content package identity drift for project '+p.creative_work_project_id);
}
for(const k of ['duplicate_caip_source_identities','duplicate_content_source_identities','duplicate_maker_story_profiles','foreign_key_violations'])if(Number(integrity[k]||0)!==0)throw new Error('Integrity drift '+k+'='+integrity[k]);
if(Number(summary.active_projects||0)!==5)throw new Error('Aggregate active-project count drift');
if(Number(summary.published_workshop_journal_stories||0)!==Number(summary.human_traceable_published_stories||0))throw new Error('Published Workshop Journal story lacks explicit human publication traceability');

function classify(p){
 const profile=Number(p.maker_story_profiles||0)>0&&String(p.story_kind||'')!=='ordinary_project';
 const reviewed=String(p.story_review_status||'')==='reviewed';
 const factual=Number(p.core_story_complete||0)>0&&String(p.outcome_status||'unknown')!=='unknown';
 const publicCandidate=Number(p.public_story_candidate||0)===1;
 const copyReady=Number(p.approved_deliverables||0)>0&&Number(p.locked_deliverables||0)>0;
 const published=Number(p.published_journal_rows||0)>0&&Number(p.human_published_journal_rows||0)>0;
 if(published&&profile&&reviewed&&factual&&publicCandidate&&copyReady)return 'PUBLISHED_REVIEWED_STORY';
 if(!profile)return 'MAKER_STORY_EVIDENCE_REQUIRED';
 if(!factual)return 'FACTUAL_OUTCOME_EVIDENCE_REQUIRED';
 if(!reviewed)return 'MAKER_STORY_HUMAN_REVIEW_REQUIRED';
 if(!publicCandidate)return 'PUBLIC_CANDIDATE_REVIEW_REQUIRED';
 if(!copyReady)return 'CONTENT_STUDIO_REVIEW_REQUIRED';
 return 'PUBLICATION_REVIEW_READY';
}
const projectReadiness=projects.map(p=>({
 creative_work_project_id:Number(p.creative_work_project_id||0),
 project_key:String(p.project_key||''),
 project_title:String(p.project_title||''),
 readiness_state:classify(p),
 maker_story_profiles:Number(p.maker_story_profiles||0),
 story_review_status:String(p.story_review_status||''),
 public_story_candidate:Number(p.public_story_candidate||0),
 outcome_status:String(p.outcome_status||''),
 core_story_complete:Number(p.core_story_complete||0)>0,
 selected_evidence_rows:Number(p.selected_evidence_rows||0),
 approved_source_evidence:Number(p.approved_source_evidence||0),
 reviewed_story_plans:Number(p.reviewed_story_plans||0),
 source_backed_story_items:Number(p.source_backed_story_items||0),
 approved_deliverables:Number(p.approved_deliverables||0),
 locked_deliverables:Number(p.locked_deliverables||0),
 published_journal_rows:Number(p.published_journal_rows||0),
 public_media_rights:{
  public_allowed_caip_assets:Number(p.public_allowed_caip_assets||0),
  public_allowed_private_uploads:Number(p.public_allowed_private_uploads||0),
  non_public_caip_assets:Number(p.non_public_caip_assets||0),
  state:(Number(p.public_allowed_caip_assets||0)+Number(p.public_allowed_private_uploads||0))>0?'EXPLICIT_PUBLIC_MEDIA_RIGHTS_PRESENT':'NO_PUBLIC_MEDIA_RIGHTS_EVIDENCE'
 },
 review_first_social_ready:Number(p.review_first_social_ready||0),
 provider_posted_social_rows:Number(p.provider_posted_social_rows||0)
}));
const counts={};
for(const p of projectReadiness)counts[p.readiness_state]=(counts[p.readiness_state]||0)+1;
const publicationReady=projectReadiness.filter(p=>['PUBLICATION_REVIEW_READY','PUBLISHED_REVIEWED_STORY'].includes(p.readiness_state)).length;
const published=projectReadiness.filter(p=>p.readiness_state==='PUBLISHED_REVIEWED_STORY').length;
let decision='COVERAGE_GAPS_REMAIN_HUMAN_REVIEW_REQUIRED';
if(publicationReady===projects.length)decision='ALL_ACTIVE_PROJECTS_FACTUALLY_READY_OR_PUBLISHED';
else if(publicationReady>published)decision='NEW_FACTUAL_PUBLICATION_REVIEW_READY_PROJECT_PRESENT';
else if(published>0)decision='PUBLISHED_BASELINE_STABLE_REMAINING_PROJECTS_NOT_READY';
const evidence={release:467,build:323,exact_development_sha:sha,statement_count:6,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 project_readiness:projectReadiness,readiness_counts:counts,summary,media_public_rights_boundary:rights,evidence_completion_lanes:completion,social_provider_boundary:social,integrity,decision,
 policy:{publication_readiness_is_read_only_classification:true,explicit_human_review_required:true,public_media_rights_separate_from_story_text_readiness:true,private_media_never_public_by_inference:true,provider_posting_independent:true},
 maker_story_profile_mutation:false,story_review_mutation:false,public_candidate_mutation:false,content_copy_mutation:false,publication_mutation:false,social_posting:false,media_rights_inference:false,provider_execution:false,provider_publication:false,production_d1_contact:false,d1_mutation:false,r2_mutation:false};
fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD323_PROJECT_READINESS=',JSON.stringify(projectReadiness));
console.log('BUILD323_READINESS_COUNTS=',JSON.stringify(counts));
console.log('BUILD323_SUMMARY=',JSON.stringify(summary));
console.log('BUILD323_MEDIA_RIGHTS=',JSON.stringify(rights));
console.log('BUILD323_COMPLETION_LANES=',JSON.stringify(completion));
console.log('BUILD323_SOCIAL=',JSON.stringify(social));
console.log('BUILD323_DECISION=',decision);
console.log('BUILD323_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD323_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD323_MAKER_STORY_COVERAGE_PUBLICATION_READINESS=GREEN');
