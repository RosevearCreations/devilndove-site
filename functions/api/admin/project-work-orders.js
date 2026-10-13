// Release 467 Build 379. All reads bounded; writes human initiated, append-only and audited.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {NEXT,canTransition,positive,dateValid} from './_lib/workOrderRules.js';
import {keyValid,payloadHash,readReceiptState,receiptInsert,atomicWriteReceipt} from './_lib/writeReceipts.js';
const list=r=>Array.isArray(r?.results)?r.results:[];
const out=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const clean=(x,max=900)=>String(x??'').trim().slice(0,max);
const safety={automatic_completion:false,inventory_mutation:false,caip_media_mutation:false,finance_posting:false,provider_publication:false,request_time_schema_mutation:false};
async function access(ctx) {
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return {error:out({ok:false,error:'Admin access required',code:'AUTH_REQUIRED'},401)};
 const db=getDb(ctx.env);
 if(!db)return {error:out({ok:false,error:'Database unavailable',code:'DB_UNAVAILABLE'},503)};
 return {admin,db};
}
const project=(db,id)=>db.prepare("SELECT creative_work_project_id,project_title,project_key FROM creative_work_projects WHERE creative_work_project_id=? AND COALESCE(project_status,'active')<>'archived' LIMIT 1").bind(id).first();
const operation=(db,p,id)=>db.prepare(`SELECT o.creative_project_operation_id,o.operation_title,o.plan_status,
 COALESCE((SELECT e.to_status FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id AND e.event_kind='transition' ORDER BY e.creative_work_order_event_id DESC LIMIT 1),'not_started') status,
 (SELECT COUNT(*) FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id AND e.event_kind='milestone') milestones
 FROM creative_project_operations o WHERE o.creative_work_project_id=? AND o.creative_project_operation_id=? LIMIT 1`).bind(p,id).first();
async function snapshot(db,id){
 const p=await project(db,id);if(!p)return null;
 const [ops,deps,hist]=await Promise.all([
 db.prepare(`SELECT o.creative_project_operation_id,o.operation_title,o.operation_order,o.plan_status,o.planned_duration_minutes,
 COALESCE((SELECT e.to_status FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id AND e.event_kind='transition' ORDER BY e.creative_work_order_event_id DESC LIMIT 1),'not_started') status,
 COALESCE((SELECT SUM(e.minutes_worked) FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id AND e.event_kind='time'),0) actual_minutes,
 (SELECT COUNT(*) FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id AND e.event_kind='milestone') milestone_count
 FROM creative_project_operations o WHERE o.creative_work_project_id=? ORDER BY o.operation_order,o.creative_project_operation_id LIMIT 81`).bind(id).all(),
 db.prepare(`SELECT d.creative_project_operation_id,d.predecessor_operation_id,d.dependency_type
 FROM creative_project_operation_dependencies d JOIN creative_project_operations o ON o.creative_project_operation_id=d.creative_project_operation_id
 WHERE o.creative_work_project_id=? ORDER BY d.creative_project_operation_id,d.predecessor_operation_id LIMIT 301`).bind(id).all(),
 db.prepare(`SELECT creative_work_order_event_id,creative_project_operation_id,event_kind,from_status,to_status,minutes_worked,work_date,event_title,notes,creative_work_event_id,actor_user_id,created_at
 FROM creative_work_order_events WHERE creative_work_project_id=? ORDER BY creative_work_order_event_id DESC LIMIT 101`).bind(id).all()
 ]);
 if(list(ops).length>80||list(deps).length>300)return {error:'Project plan too large for bounded work-order view',code:'SCOPE_TOO_LARGE'};
 return {project:p,operations:list(ops),dependencies:list(deps),history:list(hist).slice(0,100),history_has_more:list(hist).length>100};
}
export async function onRequestGet(ctx) {
 const a=await access(ctx);if(a.error)return a.error;
 const raw=new URL(ctx.request.url).searchParams.get('project_id');
 try{
  if(!raw){const p=list(await a.db.prepare("SELECT creative_work_project_id,project_key,project_title FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived' ORDER BY creative_work_project_id LIMIT 101").all());
   return out({ok:true,build:379,projects:p.slice(0,100),projects_truncated:p.length>100,safety});}
  if(!positive(raw)||String(positive(raw))!==raw)return out({ok:false,error:'Invalid project ID'},400);
  const d=await snapshot(a.db,positive(raw));
  if(!d)return out({ok:false,error:'Project not found'},404);
  return out(d.error?{ok:false,...d}:{ok:true,build:379,...d,safety},d.error?409:200);
 }catch(e){console.error('WORK_ORDER_READ',e?.name);return out({ok:false,error:'Work orders unavailable',code:'READ_FAILED'},503)}
}
export async function onRequestPost(ctx){
 const a=await access(ctx);if(a.error)return a.error;
 const origin=ctx.request.headers.get('Origin');
 if(origin!==new URL(ctx.request.url).origin)return out({ok:false,error:'Same-origin operator request required'},403);
 let body;try{body=await ctx.request.json()}catch{return out({ok:false,error:'Invalid JSON'},400)}
 const p=positive(body.project_id),id=positive(body.operation_id),action=clean(body.action,30),notes=clean(body.notes,1200),key=clean(body.request_key,80);
 if(!p||!id||notes.length<12||!keyValid(key)||!['transition','time','milestone'].includes(action))return out({ok:false,error:'Project, operation, event type, factual notes and a unique receipt key are required'},400);
 try{
  const actor=positive(a.admin.user_id),title=clean(body.title,140)||'Operator work update',scope='work_order_event';
  const payload={action,operation_id:id,title,notes,expected_status:action==='transition'?clean(body.expected_status,30):null,
   to_status:action==='transition'?clean(body.to_status,30):null,minutes:action==='time'?Number(body.minutes):null,
   work_date:action==='time'?clean(body.work_date,10):null,
   creative_work_event_id:action==='milestone'?positive(body.creative_work_event_id):null};
  const hash=await payloadHash(scope,actor,p,payload);
  const prior=await readReceiptState(a.db,{scope,key,actor,target:p,hash});
  if(prior)return out(prior.ok?{...prior,build:386,event_id:prior.source_record_id,...(await snapshot(a.db,p)),safety}:{...prior,build:386},prior.status||200);
  const proj=await project(a.db,p),op=proj&&await operation(a.db,p,id);
  if(!op||op.plan_status==='retired')return out({ok:false,error:'Active operation not found for this project'},404);
  let sourceWrite;
  if(action==='transition'){
   const expected=clean(body.expected_status,30),next=clean(body.to_status,30);
   if(op.status!==expected)return out({ok:false,error:'Status changed; refresh',code:'STALE_STATUS'},409);
   const predecessors=list(await a.db.prepare(`SELECT COALESCE((SELECT e.to_status FROM creative_work_order_events e WHERE e.creative_project_operation_id=d.predecessor_operation_id AND e.event_kind='transition' ORDER BY e.creative_work_order_event_id DESC LIMIT 1),'not_started') status
   FROM creative_project_operation_dependencies d WHERE d.creative_project_operation_id=? LIMIT 301`).bind(id).all());
   if(predecessors.length>300)return out({ok:false,error:'Dependency scope too large'},409);
   const blocked=canTransition(expected,next,predecessors.map(x=>x.status),op.milestones);
   if(blocked)return out({ok:false,error:blocked,code:blocked},409);
   sourceWrite=a.db.prepare(`INSERT INTO creative_work_order_events
   (creative_work_project_id,creative_project_operation_id,event_kind,from_status,to_status,event_title,notes,actor_user_id,request_key)
   SELECT o.creative_work_project_id,o.creative_project_operation_id,'transition',?,?,?,?,?,?
   FROM creative_project_operations o WHERE o.creative_work_project_id=? AND o.creative_project_operation_id=? AND o.plan_status<>'retired'
   AND COALESCE((SELECT e.to_status FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id AND e.event_kind='transition' ORDER BY e.creative_work_order_event_id DESC LIMIT 1),'not_started')=?
   AND (? NOT IN ('ready','in_progress','completed') OR NOT EXISTS(SELECT 1 FROM creative_project_operation_dependencies d WHERE d.creative_project_operation_id=o.creative_project_operation_id AND COALESCE((SELECT e.to_status FROM creative_work_order_events e WHERE e.creative_project_operation_id=d.predecessor_operation_id AND e.event_kind='transition' ORDER BY e.creative_work_order_event_id DESC LIMIT 1),'not_started')<>'completed'))
   AND (?<>'completed' OR EXISTS(SELECT 1 FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id AND e.event_kind='milestone'))`)
   .bind(expected,next,title,notes,actor,key,p,id,expected,next,next);
  }else if(action==='time'){
   const minutes=Number(body.minutes),day=clean(body.work_date,10);
   if(op.status!=='in_progress')return out({ok:false,error:'Work order must be in progress'},409);
   if(!Number.isSafeInteger(minutes)||minutes<1||minutes>720||!dateValid(day))return out({ok:false,error:'Minutes must be 1–720 and date valid'},400);
   sourceWrite=a.db.prepare(`INSERT INTO creative_work_order_events
   (creative_work_project_id,creative_project_operation_id,event_kind,minutes_worked,work_date,event_title,notes,actor_user_id,request_key)
   SELECT ?,?,'time',?,?,?,?,?,? FROM creative_project_operations o
   WHERE o.creative_project_operation_id=? AND o.creative_work_project_id=? AND o.plan_status<>'retired'
   AND COALESCE((SELECT e.to_status FROM creative_work_order_events e WHERE e.creative_project_operation_id=o.creative_project_operation_id
    AND e.event_kind='transition' ORDER BY e.creative_work_order_event_id DESC LIMIT 1),'not_started')='in_progress'`)
   .bind(p,id,minutes,day,title,notes,actor,key,id,p);
  }else if(action==='milestone'){
   const eventId=positive(body.creative_work_event_id);
   if(!eventId)return out({ok:false,error:'Real event required'},400);
   const real=await a.db.prepare('SELECT creative_work_event_id FROM creative_work_events WHERE creative_work_event_id=? AND creative_work_project_id=? LIMIT 1').bind(eventId,p).first();
   if(!real)return out({ok:false,error:'Evidence does not belong to this project'},400);
   sourceWrite=a.db.prepare(`INSERT INTO creative_work_order_events
    (creative_work_project_id,creative_project_operation_id,event_kind,creative_work_event_id,event_title,notes,actor_user_id,request_key)
    VALUES (?,?,'milestone',?,?,?,?,?)`).bind(p,id,eventId,title,notes,actor,key);
  }else return out({ok:false,error:'Unknown action'},400);
  const receipt=await atomicWriteReceipt(a.db,sourceWrite,
   receiptInsert(a.db,scope,key,actor,'creative_work_project',p,hash,'creative_work_order_events','creative_work_order_event_id'),
   {scope,key,actor,target:p,hash});
  if(!receipt.ok)return out(receipt.code==='SOURCE_CONSTRAINT'?{...receipt,code:'STALE_OR_SOURCE_CONSTRAINT'}:receipt,receipt.status||503);
  if(!receipt.replayed)await auditAdminAction(ctx.env,ctx.request,a.admin,{action_type:'creative_work_order_'+action,target_type:'creative_project_operation',target_id:id,
    target_key:String(p),details:{project_id:p,operation_id:id,actor_user_id:actor,automatic_completion:false,inventory_mutation:false}});
  return out({ok:true,build:386,...receipt,event_id:receipt.source_record_id,
   message:receipt.replayed?'OK — original work action already committed.':'OK — work action saved with permanent receipt.',...(await snapshot(a.db,p)),safety});
 }catch(e){console.error('WORK_ORDER_WRITE',e?.name);return out({ok:false,error:'Update could not be verified',code:'WRITE_FAILED'},503)}
}
