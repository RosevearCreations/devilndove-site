// Release 467 Build 381 — canonical, operator-confirmed scheduling; never physical availability inference.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {keyValid,payloadHash,readReceiptState,receiptInsert,atomicWriteReceipt} from './_lib/writeReceipts.js';
import {KINDS,isoUtc,validateWindow,conflictAssessment} from './_lib/calendarRules.js';
const rows=r=>Array.isArray(r?.results)?r.results:[];
const reply=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const whole=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const clean=(v,max=800)=>String(v??'').trim().slice(0,max);
const safety={authoritative_resource:'site_item_inventory',active_workstation_role:'inventory_workstation_roles',
  schedule_source:'creative_resource_calendar_entries',immutable_schedule_history:true,
  physical_presence_unverified:true,automatic_project_completion:false,inventory_consumption:false,
  automatic_maintenance_signoff:false,customer_publication:false,automatic_finance_posting:false};
async function grant({request,env}){
 const admin=await getAdminUserFromRequest(request,env);
 if(!admin)return {response:reply({ok:false,error:'Admin session required.',code:'AUTH_REQUIRED'},401)};
 const db=getDb(env);
 if(!db)return {response:reply({ok:false,error:'Canonical database binding unavailable.',code:'D1_UNAVAILABLE'},503)};
 return {admin,db};
}
const formatUTC=date=>new Date(date).toISOString().slice(0,19)+'Z';
const day=86400000;
async function snapshot(db,query){
 const from=query.get('from')||formatUTC(Date.now()),to=query.get('to')||formatUTC(Date.now()+7*day);
 const invalid=validateWindow(from,to,60);if(invalid)throw Object.assign(Error(invalid),{status:400,code:invalid});
 const resource=whole(query.get('resource_id')),project=whole(query.get('project_id'));
 const [resourceResult,projectResult,operationResult]=await Promise.all([
  db.prepare(`SELECT i.site_item_inventory_id,i.item_name,COALESCE(w.workstation_role,'associated') AS role,
    i.source_type,i.is_active FROM site_item_inventory i
    LEFT JOIN inventory_workstation_roles w ON w.site_item_inventory_id=i.site_item_inventory_id
    WHERE LOWER(TRIM(COALESCE(i.source_type,'')))='tool' AND COALESCE(i.is_active,1)=1
    ORDER BY CASE WHEN w.workstation_role='station' THEN 0 ELSE 1 END,i.item_name,i.site_item_inventory_id LIMIT 161`).all(),
  db.prepare(`SELECT creative_work_project_id,project_key,project_title FROM creative_work_projects
    WHERE COALESCE(project_status,'active')<>'archived' ORDER BY creative_work_project_id LIMIT 101`).all(),
  project?db.prepare(`SELECT creative_project_operation_id,operation_title,operation_order,plan_status
     FROM creative_project_operations WHERE creative_work_project_id=? AND plan_status<>'retired'
     ORDER BY operation_order,creative_project_operation_id LIMIT 101`).bind(project).all():Promise.resolve({results:[]})
 ]);
 const filters=[],values=[to,from];
 if(resource){filters.push('e.resource_site_item_inventory_id=?');values.push(resource);}
 if(project){filters.push('e.creative_work_project_id=?');values.push(project);}
 const filter=filters.length?' AND '+filters.join(' AND '):'';
 const events=rows(await db.prepare(`SELECT e.creative_resource_calendar_entry_id,e.resource_site_item_inventory_id,
 e.creative_work_project_id,e.creative_project_operation_id,e.entry_kind,e.title,e.starts_at_utc,e.ends_at_utc,
 e.entry_status,e.override_conflict,e.override_maintenance_ack,e.override_reason,e.operator_note,
 e.created_by_user_id,e.created_at,e.cancelled_by_user_id,e.cancelled_at,e.cancellation_reason,
 i.item_name AS resource_name,p.project_title AS project_title,
 o.operation_title AS operation_title
 FROM creative_resource_calendar_entries e
 LEFT JOIN site_item_inventory i ON i.site_item_inventory_id=e.resource_site_item_inventory_id
 LEFT JOIN creative_work_projects p ON p.creative_work_project_id=e.creative_work_project_id
 LEFT JOIN creative_project_operations o ON o.creative_project_operation_id=e.creative_project_operation_id
 WHERE e.starts_at_utc<? AND e.ends_at_utc>? ${filter}
 ORDER BY e.starts_at_utc,e.creative_resource_calendar_entry_id LIMIT 201`).bind(...values).all());
 return {from,to,resources:rows(resourceResult).slice(0,160),resources_truncated:rows(resourceResult).length>160,
  projects:rows(projectResult).slice(0,100),projects_truncated:rows(projectResult).length>100,
  operations:rows(operationResult).slice(0,100),operations_truncated:rows(operationResult).length>100,
  events:events.slice(0,200),events_truncated:events.length>200,
  calendar_interpretation:'RECORDED_ACTIVE_RESERVATIONS_ONLY',
  availability:'ABSENCE_OF_RECORDED_CONFLICT_DOES_NOT_PROVE_PHYSICAL_AVAILABILITY',
  safety};
}
export async function onRequestGet(ctx){
 const auth=await grant(ctx);if(auth.response)return auth.response;
 try{
  const q=new URL(ctx.request.url).searchParams;
  if(q.has('resource_id')&&(!whole(q.get('resource_id'))||String(whole(q.get('resource_id')))!==q.get('resource_id')))
   return reply({ok:false,error:'Invalid resource ID.',code:'BAD_RESOURCE'},400);
  if(q.has('project_id')&&(!whole(q.get('project_id'))||String(whole(q.get('project_id')))!==q.get('project_id')))
   return reply({ok:false,error:'Invalid project ID.',code:'BAD_PROJECT'},400);
  return reply({ok:true,build:381,...await snapshot(auth.db,q)});
 }catch(e){console.error('CALENDAR_READ_FAILED',e?.name||'Error');return reply({ok:false,error:e.status===400?'Invalid UTC calendar window.':'Calendar source not available.',code:e.code||'CALENDAR_READ_FAILED'},e.status||503);}
}
export async function onRequestPost(ctx){
 const auth=await grant(ctx);if(auth.response)return auth.response;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return reply({ok:false,error:'Same-origin operator POST required.',code:'ORIGIN_REQUIRED'},403);
 let body;try{body=await ctx.request.json()}catch{return reply({ok:false,error:'Invalid JSON.',code:'INVALID_JSON'},400)}
 const action=clean(body.action,20),note=clean(body.note,1000),actor=whole(auth.admin.user_id);
 if(note.length<12)return reply({ok:false,error:'Record an operator explanation of at least 12 characters.',code:'NOTE_REQUIRED'},400);
 try{
  if(action==='cancel'){
   const id=whole(body.entry_id);if(!id)return reply({ok:false,error:'Valid calendar entry required.'},400);
   const entry=await auth.db.prepare(`SELECT creative_resource_calendar_entry_id,entry_status FROM creative_resource_calendar_entries WHERE creative_resource_calendar_entry_id=? LIMIT 1`).bind(id).first();
   if(!entry)return reply({ok:false,error:'Entry not found.'},404);
   const result=await auth.db.prepare(`UPDATE creative_resource_calendar_entries
     SET entry_status='cancelled',cancelled_by_user_id=?,cancelled_at=CURRENT_TIMESTAMP,cancellation_reason=?
     WHERE creative_resource_calendar_entry_id=? AND entry_status='active'`).bind(actor,note,id).run();
   if(!Number(result.meta?.changes||0))return reply({ok:false,error:'Entry already cancelled or changed.',code:'STALE_ENTRY'},409);
   await auditAdminAction(ctx.env,ctx.request,auth.admin,{action_type:'creative_resource_calendar_cancel',target_type:'creative_resource_calendar_entry',target_id:id,target_key:String(id),
     details:{reason:note,automated_workflow:false,inventory_mutation:false}});
   return reply({ok:true,build:381,message:'Booking cancelled; history preserved.',entry_id:id});
  }
  if(action!=='schedule')return reply({ok:false,error:'Unsupported action.'},400);
  const kind=clean(body.kind,30),resource=whole(body.resource_id),project=whole(body.project_id),operation=whole(body.operation_id);
  const starts=body.starts_at_utc,ends=body.ends_at_utc,title=clean(body.title,160);
  if(!KINDS.includes(kind)||title.length<3)return reply({ok:false,error:'Kind and descriptive title required.'},400);
  const bad=validateWindow(starts,ends,31);
  if(bad)return reply({ok:false,error:'Supply exact UTC start/end with a positive window up to 31 days.',code:bad},400);
  if(Date.parse(ends)<Date.now()-day||Date.parse(starts)>Date.now()+2*366*day)
   return reply({ok:false,error:'Scheduling must be within the supported 2-year future horizon.',code:'WINDOW_OUTSIDE_HORIZON'},400);
  if((kind==='project_booking'&&(!resource||!project))||(kind==='project_deadline'&&(!project||resource))||
     (['maintenance','resource_hold'].includes(kind)&&(!resource||project||operation))||
     (operation&&!project))
   return reply({ok:false,error:'Project/resource identity does not match the selected entry type.',code:'BAD_SCHEDULE_IDENTITY'},400);
  const key=clean(body.request_key,80);
  if(!keyValid(key))return reply({ok:false,error:'Unique request key is required.'},400);
  const scope='calendar_schedule',target=project||resource,targetType=project?'creative_work_project':'site_item_inventory';
  const payload={action,kind,resource_id:resource||null,project_id:project||null,operation_id:operation||null,
   starts_at_utc:starts,ends_at_utc:ends,title,note,override_conflict:Boolean(body.override_conflict),
   override_maintenance_ack:Boolean(body.override_maintenance_ack),override_reason:clean(body.override_reason,800)};
  const hash=await payloadHash(scope,actor,target,payload);
  const prior=await readReceiptState(auth.db,{scope,key,actor,target,hash});
  if(prior)return reply({...prior,build:386,entry_id:prior.source_record_id},prior.status||200);
  if(resource){
   const real=await auth.db.prepare(`SELECT site_item_inventory_id FROM site_item_inventory WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,'')))='tool' LIMIT 1`).bind(resource).first();
   if(!real)return reply({ok:false,error:'Resource is not an active Inventory Tool.',code:'RESOURCE_NOT_AVAILABLE'},404);
   if(kind==='project_booking'){
    const state=await auth.db.prepare(`SELECT i.do_not_reuse,p.lifecycle_status,p.condition_status,p.next_service_at FROM site_item_inventory i
     LEFT JOIN inventory_tool_lifecycle_profiles p ON p.site_item_inventory_id=i.site_item_inventory_id
     WHERE i.site_item_inventory_id=?`).bind(resource).first();
    if(Number(state?.do_not_reuse||0)===1||(state?.lifecycle_status&&state.lifecycle_status!=='active')||
       ['unsafe','damaged','service_due'].includes(state?.condition_status)||
       (state?.next_service_at&&String(state.next_service_at).slice(0,10)<new Date().toISOString().slice(0,10)))
     return reply({ok:false,error:'This Tool is out of service, unsafe, marked do-not-reuse or overdue for service. Resolve its real lifecycle before scheduling.',code:'TOOL_OUT_OF_SERVICE',tool_id:resource},409);
   }
  }
  if(project){
   const p=await auth.db.prepare(`SELECT creative_work_project_id FROM creative_work_projects WHERE creative_work_project_id=? AND COALESCE(project_status,'active')<>'archived' LIMIT 1`).bind(project).first();
   if(!p)return reply({ok:false,error:'Project is not active.'},404);
   if(operation){
    const op=await auth.db.prepare(`SELECT creative_project_operation_id FROM creative_project_operations
      WHERE creative_project_operation_id=? AND creative_work_project_id=? AND plan_status<>'retired' LIMIT 1`).bind(operation,project).first();
    if(!op)return reply({ok:false,error:'Operation does not belong to this active project.',code:'PROJECT_OPERATION_MISMATCH'},409);
   }
  }
  const existing=resource?rows(await auth.db.prepare(`SELECT creative_resource_calendar_entry_id,resource_site_item_inventory_id,
     entry_kind,title,starts_at_utc,ends_at_utc,entry_status FROM creative_resource_calendar_entries
     WHERE resource_site_item_inventory_id=? AND entry_status='active' AND starts_at_utc<? AND ends_at_utc>?
     ORDER BY starts_at_utc LIMIT 51`).bind(resource,ends,starts).all()):[];
  if(existing.length>50)return reply({ok:false,error:'Too many conflicting records; narrow the window.',code:'CONFLICT_LIMIT_EXCEEDED'},409);
  const conflict=conflictAssessment(existing,{resource_site_item_inventory_id:resource,starts_at_utc:starts,ends_at_utc:ends});
  if(kind==='project_booking'&&existing.some(x=>['maintenance','resource_hold'].includes(x.entry_kind)))
   return reply({ok:false,error:'Maintenance or a resource hold blocks this Tool. Booking cannot override it; reschedule after the recorded block is resolved.',code:'MAINTENANCE_BLOCK',conflicts:existing},409);
  const override=Boolean(body.override_conflict),maintenanceAck=Boolean(body.override_maintenance_ack);
  const reason=clean(body.override_reason,800);
  if(conflict.requires_override&&(!override||reason.length<20))
   return reply({ok:false,error:'Existing booking conflicts. Explicit override and reason (20+ characters) required.',code:'RESOURCE_CONFLICT',conflicts:conflict.conflicts},409);
  if(conflict.maintenance_conflict&&!maintenanceAck)
   return reply({ok:false,error:'Maintenance conflicts require explicit acknowledgement.',code:'MAINTENANCE_BLOCK',conflicts:conflict.conflicts},409);
  if(override&&!conflict.requires_override)return reply({ok:false,error:'No recorded conflict to override. Refresh.',code:'UNNECESSARY_OVERRIDE'},409);
  if(kind==='project_booking'&&existing.some(x=>x.entry_kind==='project_booking')){
   const reviews=rows(await auth.db.prepare(`SELECT conflicting_calendar_entry_id FROM maker_tool_booking_decisions
    WHERE calendar_request_key=? AND site_item_inventory_id=? AND creative_work_project_id=?
    AND starts_at_utc=? AND ends_at_utc=? AND decision='approved_overlap' LIMIT 51`).bind(key,resource,project,starts,ends).all());
   const approved=new Set(reviews.map(r=>Number(r.conflicting_calendar_entry_id)));
   const pending=existing.filter(x=>x.entry_kind==='project_booking'&&!approved.has(Number(x.creative_resource_calendar_entry_id)));
   if(pending.length)return reply({ok:false,error:'Overlapping project Tool bookings need a recorded human owner decision for each conflicting calendar entry. Open Tools & Workstations to review.',code:'OWNER_CONFLICT_REVIEW_REQUIRED',conflicts:pending},409);
  }
  const write=auth.db.prepare(`INSERT INTO creative_resource_calendar_entries
    (resource_site_item_inventory_id,creative_work_project_id,creative_project_operation_id,entry_kind,title,
    starts_at_utc,ends_at_utc,override_conflict,override_maintenance_ack,override_reason,operator_note,
    created_by_user_id,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(resource||null,project||null,operation||null,kind,title,starts,ends,
     override?1:0,maintenanceAck?1:0,override?reason:null,note,actor,key);
  const receipt=await atomicWriteReceipt(auth.db,write,
   receiptInsert(auth.db,scope,key,actor,targetType,target,hash,'creative_resource_calendar_entries','creative_resource_calendar_entry_id'),
   {scope,key,actor,target,hash});
  if(!receipt.ok)return reply(receipt.code==='SOURCE_CONSTRAINT'?{...receipt,code:'DB_CONFLICT_OR_IDENTITY'}:receipt,receipt.status||503);
  const id=receipt.source_record_id;
  if(!receipt.replayed)  await auditAdminAction(ctx.env,ctx.request,auth.admin,{action_type:'creative_resource_calendar_schedule',target_type:'creative_resource_calendar_entry',target_id:id,target_key:key,
    details:{kind,resource_site_item_inventory_id:resource||null,creative_work_project_id:project||null,operation_id:operation||null,
     starts_at_utc:starts,ends_at_utc:ends,manual_override:override,maintenance_ack:maintenanceAck,
     operator_note:note,automatic_project_execution:false}});
  return reply({ok:true,build:386,...receipt,entry_id:id,recorded_conflicts:conflict.conflicts.length,
   message:receipt.replayed?'OK — original calendar entry already saved.':'OK — calendar entry saved with permanent receipt. Physical occupancy remains unverified.',safety});
 }catch(e){console.error('CALENDAR_WRITE_FAILED',e?.name||'Error');return reply({ok:false,error:'Calendar update could not be verified.',code:'CALENDAR_WRITE_FAILED'},503);}
}
