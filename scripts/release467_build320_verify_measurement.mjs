import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==4)throw new Error('Unexpected Build 320 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const target=(sets[0]?.results||[])[0]||{},evidence=sets[1]?.results||[],plans=sets[2]?.results||[],integrity=(sets[3]?.results||[])[0]||{};
if(Number(target.creative_work_project_id||0)!==6||String(target.project_key)!=='CP-MSUNAL8R'||String(target.project_title)!=='Grey Hair')throw new Error('Grey Hair identity drift');
for(const [k,v] of Object.entries({exact_work_identity:1,caip_workspaces:1,content_packages:1,maker_story_profiles:0,foreign_key_violations:0}))if(Number(integrity[k]||0)!==v)throw new Error('Build 320 integrity '+k+'='+integrity[k]);
if(Number(target.maker_story_profiles||0)!==0)throw new Error('Build 320 must not create a Grey Hair Maker Story profile');
if(Number(target.public_allowed_assets||0)!==0||Number(target.public_allowed_uploads||0)!==0)throw new Error('Grey Hair public-media boundary changed');
const approved=Number(target.approved_source_evidence||0),groups=Number(target.confirmed_capture_groups||0),reviewed=Number(target.reviewed_story_plans||0),items=Number(target.source_backed_story_items||0);
let state='SOURCE_EVIDENCE_REVIEW_REQUIRED';
if(approved>=2&&groups<1)state='STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED';
else if(approved>=2&&(reviewed<1||items<2))state='HUMAN_REVIEWED_STORY_PLAN_REQUIRED';
else if(approved>=2&&reviewed>=1&&items>=2)state='GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION';
const ready=state==='GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION';
const evidenceOut=evidence.map(r=>({creative_media_evidence_range_id:r.creative_media_evidence_range_id,evidence_category:r.evidence_category,title:r.title,note_text:r.note_text,transcript_excerpt:r.transcript_excerpt,start_seconds:r.start_seconds,end_seconds:r.end_seconds,confidence_score:r.confidence_score,verification_status:r.verification_status,review_status:r.review_status,visibility:r.visibility,story_candidate:r.story_candidate,marker_status:r.marker_status,reviewed_at:r.reviewed_at}));
const result={release:467,build:320,exact_development_sha:sha,statement_count:4,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,target,evidence:evidenceOut,story_plans:plans,readiness_state:state,reviewed_evidence_ready:ready,
 readiness_rule:{approved_source_evidence_min:2,reviewed_story_plans_min:1,source_backed_story_items_min:2},
 maker_story_profile_mutation:false,automatic_evidence_approval:false,automatic_story_plan_generation:false,automatic_story_plan_review:false,private_media_promoted:false,media_rights_inference:false,automatic_publication:false,production_d1_contact:false,integrity};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('BUILD320_READINESS_STATE=',state);
console.log('BUILD320_TARGET=',JSON.stringify(target));
console.log('BUILD320_EVIDENCE=',JSON.stringify(evidenceOut));
console.log('BUILD320_STORY_PLANS=',JSON.stringify(plans));
console.log('BUILD320_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD320_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD320_GREY_HAIR_READINESS=GREEN');
