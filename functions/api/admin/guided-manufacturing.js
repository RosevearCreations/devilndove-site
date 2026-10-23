// Release 467 Build 446 — additive, human-reviewed manufacturing execution.
// No implicit work-order time, inventory, media, lifecycle, finance or publication writes.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';

const LIMIT=50;
const items=result=>Array.isArray(result?.results)?result.results:[];
const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
const clean=(value,max=1200)=>String(value??'').trim().slice(0,max);
const keyValid=value=>/^[a-zA-Z0-9_-]{16,80}$/.test(String(value||''));
const out=(data,status=200)=>jsonResponse({release:467,build:446,...data},status,{'Cache-Control':'no-store'});
const safety=Object.freeze({operator_owned:true,automatic_completion:false,work_order_time_posting:false,inventory_mutation:false,caip_mutation:false,finance_posting:false,provider_publication:false});
const eventKinds=new Set(['start','pause','resume','hold','complete','check','checkpoint','equipment','substitution','evidence_link','time_link']);
const idFrom=result=>validId(result?.meta?.last_row_id);
const hash=async(value)=>{const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')};

async function access(context){
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin)return {error:out({ok:false,error:'Admin sign-in required.'},401)};
 const db=getDb(context.env);
 if(!db)return {error:out({ok:false,error:'D1 unavailable.'},503)};
 const has=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name IN ('maker_traveler_runs','maker_traveler_run_steps','maker_traveler_step_events')").first().catch(()=>null);
 if(Number(has?.n||0)!==3)return {error:out({ok:false,error:'Build 446 canonical D1 migration 0042 is not applied.',code:'MIGRATION_REQUIRED'},503)};
 return {admin,db};
}
async function choices(db){return items(await db.prepare(`SELECT t.creative_project_job_traveler_id,t.traveler_key,t.version_number,t.creative_work_project_id,p.project_title,t.snapshot_sha256,
 r.maker_traveler_run_id FROM creative_project_job_travelers t JOIN creative_work_projects p ON p.creative_work_project_id=t.creative_work_project_id
 LEFT JOIN maker_traveler_runs r ON r.creative_project_job_traveler_id=t.creative_project_job_traveler_id
 WHERE t.traveler_status='reviewed' OR r.maker_traveler_run_id IS NOT NULL ORDER BY t.creative_project_job_traveler_id DESC LIMIT 81`).all()).slice(0,80)}
async function view(db,runId){
 const run=await db.prepare(`SELECT r.*,t.traveler_key,t.version_number,p.project_title
 FROM maker_traveler_runs r JOIN creative_project_job_travelers t ON t.creative_project_job_traveler_id=r.creative_project_job_traveler_id
 JOIN creative_work_projects p ON p.creative_work_project_id=r.creative_work_project_id
 WHERE r.maker_traveler_run_id=?`).bind(runId).first();
 if(!run)return null;
 const steps=items(await db.prepare(`SELECT s.*,
 COALESCE((SELECT CASE e.event_kind WHEN 'start' THEN 'active' WHEN 'resume' THEN 'active' WHEN 'pause' THEN 'paused' WHEN 'hold' THEN 'held' ELSE 'complete' END
 FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=s.maker_traveler_run_step_id AND e.event_kind IN ('start','resume','pause','hold','complete') ORDER BY e.maker_traveler_step_event_id DESC LIMIT 1),'ready') step_status,
 COALESCE((SELECT SUM(w.minutes_worked) FROM maker_traveler_step_events e JOIN creative_work_order_events w ON w.creative_work_order_event_id=e.creative_work_order_event_id WHERE e.maker_traveler_run_step_id=s.maker_traveler_run_step_id AND e.event_kind='time_link'),0) linked_actual_minutes,
 (SELECT COUNT(*) FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=s.maker_traveler_run_step_id AND e.event_kind IN ('check','evidence_link')) proof_count
 FROM maker_traveler_run_steps s WHERE s.maker_traveler_run_id=? ORDER BY s.operation_order,s.maker_traveler_run_step_id LIMIT 51`).bind(runId).all());
 if(steps.length>LIMIT)return {error:'Job traveler contains too many steps to display safely.'};
 const [events,times,evidence]=await Promise.all([
  db.prepare(`SELECT e.maker_traveler_step_event_id,e.maker_traveler_run_step_id,e.event_kind,e.event_note,e.checkpoint_due_at,e.equipment_state,e.substitute_site_item_inventory_id,e.creative_work_event_id,e.creative_work_order_event_id,e.actor_user_id,e.created_at
  FROM maker_traveler_step_events e JOIN maker_traveler_run_steps s ON s.maker_traveler_run_step_id=e.maker_traveler_run_step_id
  WHERE s.maker_traveler_run_id=? ORDER BY e.maker_traveler_step_event_id DESC LIMIT 151`).bind(runId).all(),
  db.prepare(`SELECT w.creative_work_order_event_id,w.creative_project_operation_id,w.minutes_worked,w.work_date,w.event_title
  FROM creative_work_order_events w WHERE w.creative_work_project_id=? AND w.event_kind='time' AND NOT EXISTS(SELECT 1 FROM maker_traveler_step_events e WHERE e.creative_work_order_event_id=w.creative_work_order_event_id)
  ORDER BY w.creative_work_order_event_id DESC LIMIT 81`).bind(run.creative_work_project_id).all(),
  db.prepare(`SELECT e.creative_work_event_id,e.event_title,e.occurred_at,CASE WHEN NULLIF(e.media_url,'') IS NOT NULL THEN 1 ELSE 0 END has_media
  FROM creative_work_events e WHERE e.creative_work_project_id=? AND e.entry_status='active' ORDER BY e.creative_work_event_id DESC LIMIT 81`).bind(run.creative_work_project_id).all()
 ]);
 return {run,steps,events:items(events).slice(0,150),events_truncated:items(events).length>150,
   available_time_receipts:items(times).slice(0,80),available_evidence_events:items(evidence).slice(0,80)};
}
async function selectedTraveler(db,travelerId){
 const t=await db.prepare(`SELECT creative_project_job_traveler_id,creative_work_project_id,traveler_status,snapshot_sha256,snapshot_json
 FROM creative_project_job_travelers WHERE creative_project_job_traveler_id=? LIMIT 1`).bind(travelerId).first();
 if(!t||t.traveler_status!=='reviewed')return null;
 let snapshot;try{snapshot=JSON.parse(t.snapshot_json);}catch{return null}
 const ops=snapshot?.operations;
 if(validId(snapshot?.identity?.project_id)!==validId(t.creative_work_project_id))return null;
 if(!Array.isArray(ops)||!ops.length||ops.length>LIMIT)return null;
 const ids=new Set(),orders=new Set();
 for(const op of ops){const oid=validId(op.creative_project_operation_id),ord=validId(op.operation_order);
  if(!oid||!ord||ids.has(oid)||orders.has(ord))return null;ids.add(oid);orders.add(ord);}
 return {t,ops};
}
async function startRun(context,a,body){
 const tid=validId(body.traveler_id),actor=validId(a.admin.user_id),note=clean(body.note),key=clean(body.request_key,80);
 if(!tid||!actor||note.length<12||!keyValid(key))return out({ok:false,error:'Reviewed traveler, factual note and unique request key are required.'},400);
 const digest=await hash({kind:'start_run',tid,actor,note});
 const previous=await a.db.prepare('SELECT maker_traveler_run_id,payload_sha256,started_by_user_id FROM maker_traveler_runs WHERE request_key=?').bind(key).first();
 if(previous)return previous.payload_sha256===digest&&Number(previous.started_by_user_id)===actor
  ?out({ok:true,replayed:true,...(await view(a.db,validId(previous.maker_traveler_run_id))),safety})
  :out({ok:false,error:'Request key already belongs to a different operator or run.',code:'KEY_REUSED'},409);
 const source=await selectedTraveler(a.db,tid);
 if(!source)return out({ok:false,error:'Choose a valid currently reviewed traveler with 1–50 canonical operation steps.'},409);
 const {t,ops}=source;
 const existing=await a.db.prepare('SELECT maker_traveler_run_id FROM maker_traveler_runs WHERE creative_project_job_traveler_id=?').bind(tid).first();
 if(existing)return out({ok:false,error:'This traveler already has an execution. Open and resume it; do not duplicate it.',existing_run_id:existing.maker_traveler_run_id},409);
 const writes=[a.db.prepare(`INSERT INTO maker_traveler_runs(creative_project_job_traveler_id,creative_work_project_id,snapshot_sha256,started_by_user_id,run_note,request_key,payload_sha256)
 VALUES(?,?,?,?,?,?,?)`).bind(tid,t.creative_work_project_id,t.snapshot_sha256,actor,note,key,digest)];
 for(const op of ops)writes.push(a.db.prepare(`INSERT INTO maker_traveler_run_steps(maker_traveler_run_id,creative_project_operation_id,operation_order,title_snapshot,workstation_snapshot,setup_snapshot,evidence_requirement_snapshot,planned_minutes_snapshot,resource_snapshot_json)
 SELECT maker_traveler_run_id,?,?,?,?,?,?,?,? FROM maker_traveler_runs WHERE request_key=?`)
 .bind(validId(op.creative_project_operation_id),validId(op.operation_order),clean(op.operation_title||op.process_name,220)||'Untitled operation',clean(op.responsible_workspace,220)||null,clean(op.setup_notes,1500)||null,clean(op.output_evidence_requirement,900)||null,op.planned_duration_minutes!=null&&Number.isSafeInteger(Number(op.planned_duration_minutes))&&Number(op.planned_duration_minutes)>=0?Number(op.planned_duration_minutes):null,JSON.stringify(op.materials_tools||[]),key));
 try{
  const results=await a.db.batch(writes);
  if(results.length!==writes.length||results.some(r=>Number(r.meta?.changes||0)!==1))return out({ok:false,error:'Run write was not confirmed; refresh before retrying.',code:'NOT_CONFIRMED'},503);
  const r=await a.db.prepare('SELECT maker_traveler_run_id FROM maker_traveler_runs WHERE request_key=?').bind(key).first();
  await auditAdminAction(context.env,context.request,a.admin,{action_type:'build446_traveler_run_created',target_type:'maker_traveler_run',target_id:idFrom(results[0])||validId(r?.maker_traveler_run_id),details:{traveler_id:tid,project_id:t.creative_work_project_id,operation_count:ops.length,safety}});
  return out({ok:true,message:'Reviewed traveler execution created. Every step is preserved across sessions.',...(await view(a.db,validId(r?.maker_traveler_run_id))),safety});
 }catch(err){
  const replay=await a.db.prepare('SELECT maker_traveler_run_id,payload_sha256,started_by_user_id FROM maker_traveler_runs WHERE request_key=?').bind(key).first().catch(()=>null);
  if(replay&&replay.payload_sha256===digest&&Number(replay.started_by_user_id)===actor)return out({ok:true,replayed:true,...(await view(a.db,validId(replay.maker_traveler_run_id))),safety});
  console.error('BUILD446_RUN_FAILED',err?.name);
  return out({ok:false,error:'Run creation was not confirmed; refresh before retrying.',code:'RUN_CONFLICT_OR_UNKNOWN'},409);
 }
}
async function recordEvent(context,a,body){
 const stepId=validId(body.step_id),actor=validId(a.admin.user_id),kind=clean(body.event_kind,32),note=clean(body.note),key=clean(body.request_key,80);
 if(!stepId||!actor||!eventKinds.has(kind)||note.length<12||!keyValid(key))return out({ok:false,error:'Choose a step, event, a factual note of 12+ characters and a unique request key.'},400);
 const step=await a.db.prepare(`SELECT s.maker_traveler_run_step_id,s.maker_traveler_run_id,r.creative_work_project_id FROM maker_traveler_run_steps s JOIN maker_traveler_runs r ON r.maker_traveler_run_id=s.maker_traveler_run_id WHERE s.maker_traveler_run_step_id=?`).bind(stepId).first();
 if(!step)return out({ok:false,error:'Traveler execution step was not found.'},404);
 const due=kind==='checkpoint'?clean(body.checkpoint_due_at,24):null,
   equipment=kind==='equipment'?clean(body.equipment_state,32):null,
   substitute=kind==='substitution'?validId(body.substitute_site_item_inventory_id):null,
   evidence=kind==='evidence_link'?validId(body.creative_work_event_id):null,
   time=kind==='time_link'?validId(body.creative_work_order_event_id):null;
 if((kind==='checkpoint'&&(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(due)||!Number.isFinite(Date.parse(due))))||
   (kind==='equipment'&&!['available','unavailable','maintenance','substituted'].includes(equipment))||
   (kind==='substitution'&&!substitute)||(kind==='evidence_link'&&!evidence)||(kind==='time_link'&&!time))
  return out({ok:false,error:'Choose a valid UTC cure deadline, equipment state or existing referenced receipt for this action.'},400);
 const digest=await hash({kind,stepId,actor,note,due,equipment,substitute,evidence,time});
 const prior=await a.db.prepare('SELECT maker_traveler_step_event_id,payload_sha256,actor_user_id FROM maker_traveler_step_events WHERE request_key=?').bind(key).first();
 if(prior)return prior.payload_sha256===digest&&Number(prior.actor_user_id)===actor
  ?out({ok:true,replayed:true,event_id:prior.maker_traveler_step_event_id,...(await view(a.db,step.maker_traveler_run_id)),safety})
  :out({ok:false,error:'Request key used for a different event.',code:'KEY_REUSED'},409);
 try{
  const result=await a.db.prepare(`INSERT INTO maker_traveler_step_events(maker_traveler_run_step_id,event_kind,event_note,checkpoint_due_at,equipment_state,substitute_site_item_inventory_id,creative_work_event_id,creative_work_order_event_id,actor_user_id,request_key,payload_sha256)
  VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(stepId,kind,note,due,equipment,substitute,evidence,time,actor,key,digest).run();
  if(Number(result.meta?.changes||0)!==1)return out({ok:false,error:'Event not confirmed. Refresh before retrying.'},503);
  await auditAdminAction(context.env,context.request,a.admin,{action_type:'build446_traveler_step_'+kind,target_type:'maker_traveler_run_step',target_id:stepId,details:{run_id:step.maker_traveler_run_id,event_id:idFrom(result),safety}});
  return out({ok:true,message:'Operator action permanently recorded.',event_id:idFrom(result),...(await view(a.db,step.maker_traveler_run_id)),safety});
 }catch(error){
  const replay=await a.db.prepare('SELECT maker_traveler_step_event_id,payload_sha256,actor_user_id FROM maker_traveler_step_events WHERE request_key=?').bind(key).first().catch(()=>null);
  if(replay&&replay.payload_sha256===digest&&Number(replay.actor_user_id)===actor)return out({ok:true,replayed:true,event_id:replay.maker_traveler_step_event_id,...(await view(a.db,step.maker_traveler_run_id)),safety});
  const reason=String(error?.message||'');
  const known=['step_not_started','step_started_twice','step_already_complete','step_not_active','step_not_paused_or_held','step_completion_requires_evidence','unresolved_cure_checkpoint','linked_time_wrong_project_or_step','linked_evidence_wrong_project','invalid_equipment_substitution'];
  const code=known.find(s=>reason.includes(s))||(/UNIQUE|constraint/i.test(reason)?'CONSTRAINT_OR_STALE':'WRITE_UNCONFIRMED');
  return out({ok:false,code,error:'Step action was not saved ('+code+'). Refresh and review the operator timeline before retrying.'},code==='WRITE_UNCONFIRMED'?503:409);
 }
}
export async function onRequestGet(context){
 const a=await access(context);if(a.error)return a.error;
 try{
  const runId=validId(new URL(context.request.url).searchParams.get('run_id'));
  const list=await choices(a.db);
  if(!runId)return out({ok:true,travelers:list,selected:null,safety});
  const selected=await view(a.db,runId);
  return selected&&!selected.error?out({ok:true,travelers:list,selected,safety}):out({ok:false,error:selected?.error||'No matching job traveler execution'},404);
 }catch(error){console.error('BUILD446_READ_FAILED',error?.name);return out({ok:false,error:'Execution read unavailable. Refresh safely.'},503)}
}
export async function onRequestPost(context){
 const a=await access(context);if(a.error)return a.error;
 if(context.request.headers.get('Origin')!==new URL(context.request.url).origin)return out({ok:false,error:'Same-origin operator request required.'},403);
 let body;try{body=await context.request.json()}catch{return out({ok:false,error:'Invalid JSON'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return out({ok:false,error:'Expected operator action object'},400);
 try{
  if(body.action==='start_run')return await startRun(context,a,body);
  if(body.action==='record_event')return await recordEvent(context,a,body);
  return out({ok:false,error:'Unsupported operator action'},400);
 }catch(error){console.error('BUILD446_POST_FAILED',error?.name);return out({ok:false,error:'Action unavailable; no success assumed. Refresh before retrying.'},503)}
}
