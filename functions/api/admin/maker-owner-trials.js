// Release 467 Build 456: private source-verified, append-only OWNER trial receipts.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {TRIALS,CHECKS,BOUNDARY,normalizeTrial,summarizeTrial} from '../_lib/makerOwnerTrial456.mjs';

const id=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
const list=result=>Array.isArray(result?.results)?result.results:[];
const answer=(data,status=200)=>jsonResponse({release:467,build:456,...data},status,{'Cache-Control':'private, no-store'});
const sha256=async obj=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(obj)))),b=>b.toString(16).padStart(2,'0')).join('');

async function access(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return {error:answer({ok:false,error:'Admin sign-in required.'},401)};
 const db=getDb(ctx.env);
 if(!db)return {error:answer({ok:false,error:'D1 unavailable.'},503)};
 const ready=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='maker_owner_trial_reviews'").first().catch(()=>null);
 if(Number(ready?.n)!==1)return {error:answer({ok:false,code:'MIGRATION_REQUIRED',error:'Canonical migration 0050 must be applied before collecting owner evidence.'},503)};
 return {admin,db};
}

async function readSources(db,scenario,project,request){
 if(!scenario)return {selected:null,sources:[]};
 if(scenario==='custom_commission'){
  if(!request)return {selected:null,sources:[]};
  const selected=await db.prepare('SELECT custom_request_id,request_type,status,product_interest,created_at FROM custom_requests WHERE custom_request_id=?').bind(request).first();
  if(!selected)return {selected:null,sources:[]};
  const [proofs,reviews]=await Promise.all([
   db.prepare('SELECT custom_request_proof_version_id id,version_number,proof_status FROM custom_request_proof_versions WHERE custom_request_id=? ORDER BY custom_request_proof_version_id DESC LIMIT 35').bind(request).all(),
   db.prepare('SELECT maker_commission_completion_review_id id,decision FROM maker_commission_completion_reviews WHERE custom_request_id=? ORDER BY maker_commission_completion_review_id DESC LIMIT 35').bind(request).all()
  ]);
  return {selected,sources:[{kind:'custom_request',id:request,label:`Custom Request #${request}`},
   ...list(proofs).map(p=>({kind:'customer_proof',id:p.id,label:`Proof #${p.id}, version ${p.version_number} (${p.proof_status})`})),
   ...list(reviews).map(r=>({kind:'commission_review',id:r.id,label:`Maker handoff #${r.id} (${r.decision})`}))]};
 }
 if(!project)return {selected:null,sources:[]};
 const selected=await db.prepare('SELECT creative_work_project_id,project_title,project_status,privacy_status,rights_status FROM creative_work_projects WHERE creative_work_project_id=?').bind(project).first();
 if(!selected)return {selected:null,sources:[]};
 const specs=[
  ['event','SELECT creative_work_event_id id,event_title label FROM creative_work_events WHERE creative_work_project_id=? AND entry_status=\'active\' ORDER BY creative_work_event_id DESC LIMIT 30'],
  ['design_revision','SELECT maker_design_file_revision_id id,design_title label FROM maker_design_file_revisions WHERE creative_work_project_id=? ORDER BY maker_design_file_revision_id DESC LIMIT 25'],
  ['traveler_run','SELECT maker_traveler_run_id id,run_note label FROM maker_traveler_runs WHERE creative_work_project_id=? ORDER BY maker_traveler_run_id DESC LIMIT 25'],
  ['quality_attempt','SELECT maker_quality_attempt_id id,outcome label FROM maker_quality_attempts WHERE creative_work_project_id=? ORDER BY maker_quality_attempt_id DESC LIMIT 25'],
  ['cost_review','SELECT maker_project_cost_review_id id,review_label label FROM maker_project_cost_reviews WHERE creative_work_project_id=? ORDER BY maker_project_cost_review_id DESC LIMIT 25'],
  ['media_story','SELECT maker_media_story_revision_id id,story_title label FROM maker_media_story_revisions WHERE creative_work_project_id=? ORDER BY maker_media_story_revision_id DESC LIMIT 25']
 ];
 const groups=await Promise.all(specs.map(async([kind,sql])=>({kind,items:list(await db.prepare(sql).bind(project).all())})));
 return {selected,sources:[{kind:'project',id:project,label:`Project #${project}: ${selected.project_title}`},
  ...groups.flatMap(g=>g.items.map(r=>({kind:g.kind,id:r.id,label:`${g.kind.replace('_',' ')} #${r.id}: ${String(r.label||'').slice(0,100)}`})))]};
}

async function view(db,scenario,project,request){
 const [projects,requests]=await Promise.all([
  db.prepare('SELECT creative_work_project_id,project_title,project_status FROM creative_work_projects ORDER BY creative_work_project_id DESC LIMIT 100').all(),
  db.prepare('SELECT custom_request_id,request_type,status,product_interest FROM custom_requests ORDER BY custom_request_id DESC LIMIT 60').all()
 ]);
 const {selected,sources}=await readSources(db,scenario,project,request);
 let history=[];let truncated=false;
 if(selected){const result=await db.prepare(`SELECT maker_owner_trial_review_id,scenario_key,checkpoint_key,source_kind,source_id,
   decision,personally_observed,review_note,recorded_by_user_id,created_at
   FROM maker_owner_trial_reviews WHERE scenario_key=? AND ${scenario==='custom_commission'?'custom_request_id':'creative_work_project_id'}=?
   ORDER BY maker_owner_trial_review_id DESC LIMIT 121`).bind(scenario,scenario==='custom_commission'?request:project).all();
  history=list(result);truncated=history.length>120;history=history.slice(0,120);
 }
 return {ok:true,scenarios:TRIALS,checkpoints:CHECKS,projects:list(projects),requests:list(requests),
  selected,sources,history,history_truncated:truncated,
  summary:summarizeTrial(scenario,history),policy:BOUNDARY};
}

export async function onRequestGet(ctx){const a=await access(ctx);if(a.error)return a.error;
 const search=new URL(ctx.request.url).searchParams,scenario=search.get('scenario')||'';
 const lookupKey=search.get('lookup_key');
 if(lookupKey!==null){
  if(!/^[a-zA-Z0-9_-]{16,80}$/.test(lookupKey))return answer({ok:false,error:'Invalid receipt lookup key.'},400);
  const actor=id(a.admin.user_id);if(!actor)return answer({ok:false,error:'Verified Admin actor required.'},401);
  try{const receipt=await a.db.prepare(`SELECT maker_owner_trial_review_id,scenario_key,checkpoint_key,decision,created_at
   FROM maker_owner_trial_reviews WHERE request_key=? AND recorded_by_user_id=? LIMIT 1`).bind(lookupKey,actor).first();
   return answer({ok:true,found:Boolean(receipt),receipt:receipt||null,manual_replay_required:false});
  }catch(error){console.error('BUILD458_LOOKUP',error?.name);return answer({ok:false,error:'Receipt lookup unavailable; do not start a new key.'},503)}
 }
 if(scenario&&!TRIALS[scenario])return answer({ok:false,error:'Invalid owner trial scenario.'},400);
 const project=id(search.get('project_id')),request=id(search.get('custom_request_id'));
 if(scenario==='custom_commission'&&project||scenario&&scenario!=='custom_commission'&&request)return answer({ok:false,error:'Scope conflicts with selected scenario.'},400);
 try{return answer(await view(a.db,scenario,project,request))}
 catch(error){console.error('BUILD456_READ',error?.name);return answer({ok:false,error:'Owner trial sources unavailable. Check existing migrations and sign-in.'},503)}
}

export async function onRequestPost(ctx){const a=await access(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return answer({ok:false,error:'Same-origin Admin submission required.'},403);
 let body;try{body=await ctx.request.json()}catch{return answer({ok:false,error:'Valid JSON body required.'},400)};
 let trial;try{trial=normalizeTrial(body)}catch(error){return answer({ok:false,error:error.message},400)}
 const actor=id(a.admin.user_id);if(!actor)return answer({ok:false,error:'Verified Admin actor required.'},401);
 const digest=await sha256({actor,trial:{...trial,key:undefined}});
 const find=()=>a.db.prepare('SELECT maker_owner_trial_review_id,recorded_by_user_id,payload_sha256 FROM maker_owner_trial_reviews WHERE request_key=?').bind(trial.key).first();
 const previous=await find();
 if(previous)return Number(previous.recorded_by_user_id)===actor&&previous.payload_sha256===digest
   ?answer({ok:true,replayed:true,receipt_id:previous.maker_owner_trial_review_id,policy:BOUNDARY})
   :answer({ok:false,code:'IDEMPOTENCY_CONFLICT',error:'Request key already belongs to a different owner review.'},409);
 try{
  const result=await a.db.prepare(`INSERT INTO maker_owner_trial_reviews
   (scenario_key,checkpoint_key,creative_work_project_id,custom_request_id,source_kind,source_id,decision,personally_observed,review_note,recorded_by_user_id,request_key,payload_sha256)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(trial.scenario,trial.checkpoint,trial.project,trial.request,trial.sourceKind,trial.sourceId,
    trial.decision,trial.observed,trial.note,actor,trial.key,digest).run();
  const receipt=id(result.meta?.last_row_id);
  await auditAdminAction(ctx.env,ctx.request,a.admin,{action_type:'build456_owner_trial_'+trial.decision,
   target_type:'maker_owner_trial_review',target_id:receipt,
   details:{scenario:trial.scenario,checkpoint:trial.checkpoint,private:true,canonical_sources_only:true}});
  return answer({ok:true,receipt_id:receipt,policy:BOUNDARY});
 }catch(error){
  const replay=await find().catch(()=>null);
  if(replay&&Number(replay.recorded_by_user_id)===actor&&replay.payload_sha256===digest)return answer({ok:true,replayed:true,receipt_id:replay.maker_owner_trial_review_id,policy:BOUNDARY});
  console.error('BUILD456_WRITE',error?.name);
  return answer({ok:false,code:'SOURCE_OR_SCOPE_HOLD',error:'HOLD: this source is missing, private scope does not match, or the review could not be recorded. Nothing else was changed.'},409);
 }
}
