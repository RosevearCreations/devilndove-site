import fs from 'node:fs';
const [input,sha,out]=process.argv.slice(2);
const raw=JSON.parse(fs.readFileSync(input,'utf8'));const sets=Array.isArray(raw)?raw:(raw.results||[]);
if(sets.length!==4)throw new Error('Unexpected Build 326 statement count '+sets.length);
const reads=sets.map(x=>Number(x?.meta?.rows_read||0)),aggregate=reads.reduce((a,b)=>a+b,0);
if(aggregate>20000)throw new Error('Rows-read ceiling exceeded '+aggregate);
const row=i=>(sets[i]?.results||[])[0]||{},target=row(0),events=sets[1]?.results||[],trace=row(2),integrity=row(3);
if(Number(target.creative_work_project_id||0)!==5||String(target.project_key)!=='CP-MSC1SUG2'||String(target.project_title)!=='35th promo')throw new Error('35th promo identity drift');
for(const [k,v] of Object.entries({exact_project_identity:1,maker_profiles:1,caip_workspaces:1,content_packages:1,foreign_key_violations:0}))if(Number(integrity[k]||0)!==v)throw new Error('Build 326 integrity '+k+'='+integrity[k]);
if(Number(target.approved_locked_deliverables||0)!==2)throw new Error('35th promo approved/locked Content Studio continuity drift');
if(Number(target.publications||0)!==0||Number(target.social_rows||0)!==0)throw new Error('35th promo publication/social boundary drift');
const execution=Number(target.execution_events||0),results=Number(target.result_events||0),lessons=Number(target.lesson_events||0);
const placeholderGuard=/\b(no (?:execution|completed-result|result|lesson|outcome)|not recorded|does not claim|evidence is required|pending execution)\b/i;
const substantiveFact=v=>String(v||'').trim().length>0&&!placeholderGuard.test(String(v||''));
const textComplete=String(target.what_we_are_trying||'').trim().length>0&&String(target.why_we_are_trying_it||'').trim().length>0&&substantiveFact(target.actual_result)&&substantiveFact(target.lesson_learned);
const outcomeResolved=['win','partial_win','failure'].includes(String(target.outcome_status||''));
const eventComplete=execution>0&&results>0&&lessons>0;
const ready=eventComplete&&textComplete&&outcomeResolved;
let state='REAL_OUTCOME_EVIDENCE_STILL_REQUIRED';
if((execution+results+lessons)>0&&!eventComplete)state='REAL_OUTCOME_EVIDENCE_PARTIAL';
else if(eventComplete&&!ready)state='REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED';
else if(ready)state='REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW';
if(ready&&(String(target.story_review_status||'')==='reviewed'||Number(target.public_story_candidate||0)===1))state='REAL_OUTCOME_FACTS_COMPLETE_HUMAN_REVIEW_ALREADY_RECORDED';
const evidence={release:467,build:326,exact_development_sha:sha,statement_count:4,rows_read_by_statement:reads,aggregate_rows_read:aggregate,rows_read_ceiling:20000,
 target,evidence_events:events,trace,closure_state:state,
 readiness:{event_complete:eventComplete,profile_facts_complete:textComplete,outcome_resolved:outcomeResolved,ready_for_explicit_human_review:ready,execution_events:execution,result_events:results,lesson_events:lessons},
 boundaries:{read_only:true,synthetic_evidence:false,evidence_mutation:false,automatic_evidence_selection:false,automatic_story_review:false,automatic_public_candidate:false,publication_mutation:false,social_mutation:false,media_rights_inference:false,provider_execution:false,production_d1_contact:false},
 integrity};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log('BUILD326_CLOSURE_STATE=',state);
console.log('BUILD326_TARGET=',JSON.stringify(target));
console.log('BUILD326_READINESS=',JSON.stringify(evidence.readiness));
console.log('BUILD326_TRACE=',JSON.stringify(trace));
console.log('BUILD326_EVIDENCE_EVENTS=',JSON.stringify(events));
console.log('BUILD326_ROWS_READ=',JSON.stringify(reads));
console.log('BUILD326_AGGREGATE_ROWS_READ=',aggregate);
console.log('BUILD326_35TH_PROMO_REAL_OUTCOME_CLOSURE=GREEN');
