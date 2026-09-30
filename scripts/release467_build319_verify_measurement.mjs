import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==3)throw new Error('Unexpected Build 319 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const target=(sets[0]?.results||[])[0]||{},events=sets[1]?.results||[],integrity=(sets[2]?.results||[])[0]||{};
if(Number(target.creative_work_project_id||0)!==5||String(target.project_key)!=='CP-MSC1SUG2'||String(target.project_title)!=='35th promo')throw new Error('35th promo identity drift');
if(String(target.story_review_status)!=='needs_review'||Number(target.public_story_candidate||0)!==0)throw new Error('Build 319 must preserve review-blocked Maker Story state');
if(Number(target.content_packages||0)!==1||Number(target.approved_locked_deliverables||0)!==2)throw new Error('35th promo Content Studio continuity drift');
if(Number(target.publications||0)!==0||Number(target.social_rows||0)!==0)throw new Error('35th promo publication/social boundary drift');
for(const [k,v] of Object.entries({exact_project_identity:1,maker_profiles:1,caip_workspaces:1,content_packages:1,foreign_key_violations:0}))if(Number(integrity[k]||0)!==v)throw new Error('Build 319 integrity '+k+'='+integrity[k]);
const execution=Number(target.execution_events||0),results=Number(target.result_events||0),lessons=Number(target.lesson_events||0);
let state='INTAKE_READY_AWAITING_REAL_EXECUTION_RESULT_LESSON_EVIDENCE';
if(execution+results+lessons>0)state='REAL_EVIDENCE_PARTIAL_PENDING_COMPLETENESS_AND_HUMAN_REVIEW';
if(execution>0&&results>0&&lessons>0)state='REAL_EXECUTION_RESULT_LESSON_EVIDENCE_PRESENT_PENDING_HUMAN_REVIEW';
const intakeEvents=events.filter(e=>['setup','process','milestone','result','lesson','mistake','repair'].includes(String(e.event_type||'').toLowerCase()));
const evidence={release:467,build:319,exact_development_sha:sha,statement_count:3,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 target,evidence_events:intakeEvents,completeness_state:state,
 completeness:{execution_events:execution,result_events:results,lesson_events:lessons,complete:execution>0&&results>0&&lessons>0},
 review_state_preserved:true,evidence_auto_selected:false,automatic_story_review:false,automatic_publication:false,automatic_social_posting:false,
 synthetic_evidence:false,ci_evidence_mutation:false,production_d1_contact:false,integrity};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD319_COMPLETENESS_STATE=',state);
console.log('BUILD319_TARGET=',JSON.stringify(target));
console.log('BUILD319_EVIDENCE_EVENTS=',JSON.stringify(intakeEvents));
console.log('BUILD319_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD319_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD319_EXECUTION_EVIDENCE_INTAKE=GREEN');
