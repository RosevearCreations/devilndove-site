// Release 467 Build 448 — canonical shared Tool state, explicit safety and conflict reviews.
// This endpoint never creates or mutates bookings, Inventory, lifecycle, traveler evidence,
// provider listings, or financial postings. Bookings remain the Build 381 calendar authority.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {keyValid} from './_lib/writeReceipts.js';
import {validateWindow} from './_lib/calendarRules.js';

const rows=r=>Array.isArray(r?.results)?r.results:[];
const id=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0;
const clean=(v,max=1200)=>String(v??'').trim().slice(0,max);
const respond=(value,status=200)=>jsonResponse({release:467,build:448,...value},status,{'Cache-Control':'no-store'});
const safety={tool_authority:'site_item_inventory',membership_authority:'inventory_workstation_memberships',location_authority:'inventory_current_locations',lifecycle_authority:'inventory_tool_lifecycle_profiles',booking_authority:'creative_resource_calendar_entries',physical_presence_unverified:true,checks_never_inferred:true,automatic_maintenance_signoff:false,automatic_inventory_mutation:false,automatic_finance_posting:false,provider_publication:false};
const digest=async value=>{const bytes=new TextEncoder().encode(JSON.stringify(value));const sha=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(sha)].map(n=>n.toString(16).padStart(2,'0')).join('')};
const reviewKinds=new Set(['guards_and_ppe','condition_inspection','calibration','maintenance_release','location_verification']);
async function grant({request,env}){
 const admin=await getAdminUserFromRequest(request,env);
 if(!admin)return {error:respond({ok:false,error:'Admin sign-in required.'},401)};
 const db=getDb(env);if(!db)return {error:respond({ok:false,error:'Canonical D1 unavailable.'},503)};
 const ready=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name IN ('maker_tool_safety_checks','maker_tool_booking_decisions')").first().catch(()=>null);
 if(Number(ready?.n)!==2)return {error:respond({ok:false,error:'Build 448 canonical D1 migration is not yet applied.',code:'MIGRATION_REQUIRED'},503)};
 return {admin,db};
}
async function toolState(db,toolId){return db.prepare(`SELECT i.site_item_inventory_id,i.item_name,i.source_type,i.is_active,i.do_not_reuse,
 p.lifecycle_status,p.condition_status,p.next_service_at,p.last_service_at,p.reviewed_at,
 loc.current_location_site_item_inventory_id,place.item_name AS current_location_name,
 (SELECT GROUP_CONCAT(st.item_name,', ') FROM inventory_workstation_memberships m
  JOIN site_item_inventory st ON st.site_item_inventory_id=m.workstation_site_item_inventory_id
  WHERE m.site_item_inventory_id=i.site_item_inventory_id) AS workstation_names,
 (SELECT GROUP_CONCAT(m.workstation_site_item_inventory_id) FROM inventory_workstation_memberships m
  WHERE m.site_item_inventory_id=i.site_item_inventory_id) AS workstation_ids,
 (SELECT c.result FROM maker_tool_safety_checks c WHERE c.site_item_inventory_id=i.site_item_inventory_id
  ORDER BY c.maker_tool_safety_check_id DESC LIMIT 1) AS latest_check_result,
 (SELECT c.created_at FROM maker_tool_safety_checks c WHERE c.site_item_inventory_id=i.site_item_inventory_id
  ORDER BY c.maker_tool_safety_check_id DESC LIMIT 1) AS latest_check_at
 FROM site_item_inventory i LEFT JOIN inventory_tool_lifecycle_profiles p ON p.site_item_inventory_id=i.site_item_inventory_id
 LEFT JOIN inventory_current_locations loc ON loc.site_item_inventory_id=i.site_item_inventory_id
 LEFT JOIN site_item_inventory place ON place.site_item_inventory_id=loc.current_location_site_item_inventory_id
 WHERE i.site_item_inventory_id=? AND COALESCE(i.is_active,1)=1 AND lower(trim(COALESCE(i.source_type,'')))='tool' LIMIT 1`).bind(toolId).first()}
function blocker(t){if(!t)return 'Tool was not found in active Inventory.';
 if(Number(t.do_not_reuse||0)===1)return 'Inventory explicitly marks this Tool do-not-reuse.';
 if(t.lifecycle_status&&t.lifecycle_status!=='active')return 'Tool lifecycle is '+t.lifecycle_status+'.';
 if(['unsafe','damaged','service_due'].includes(t.condition_status))return 'Tool condition is '+t.condition_status+'.';
 if(t.next_service_at&&Date.parse(String(t.next_service_at).slice(0,10)+'T23:59:59Z')<Date.now())return 'Reviewed maintenance or calibration service date is overdue.';
 return null;
}
async function windowConflicts(db,resource,start,end){return rows(await db.prepare(`SELECT e.creative_resource_calendar_entry_id,e.creative_work_project_id,e.entry_kind,e.title,
 e.starts_at_utc,e.ends_at_utc,e.entry_status,p.project_title
 FROM creative_resource_calendar_entries e LEFT JOIN creative_work_projects p ON p.creative_work_project_id=e.creative_work_project_id
 WHERE e.resource_site_item_inventory_id=? AND e.entry_status='active'
 AND e.starts_at_utc<? AND e.ends_at_utc>?
 ORDER BY e.starts_at_utc,e.creative_resource_calendar_entry_id LIMIT 31`).bind(resource,end,start).all())}
async function snapshot(db,toolId,start,end,projectId,calendarKey){
 const [tools,projects,tool]=await Promise.all([
  db.prepare(`SELECT i.site_item_inventory_id,i.item_name,COALESCE(w.workstation_role,'associated') station_role
   FROM site_item_inventory i LEFT JOIN inventory_workstation_roles w ON w.site_item_inventory_id=i.site_item_inventory_id
   WHERE COALESCE(i.is_active,1)=1 AND lower(trim(COALESCE(i.source_type,'')))='tool'
   ORDER BY CASE WHEN w.workstation_role='station' THEN 0 ELSE 1 END,lower(i.item_name),i.site_item_inventory_id LIMIT 161`).all(),
  db.prepare(`SELECT creative_work_project_id,project_title FROM creative_work_projects
   WHERE COALESCE(project_status,'active')<>'archived' ORDER BY creative_work_project_id DESC LIMIT 101`).all(),
  toolId?toolState(db,toolId):null
 ]);
 const conflicts=tool&&start&&end?await windowConflicts(db,toolId,start,end):[];
 const [checks,decisions]=tool?await Promise.all([
  db.prepare(`SELECT maker_tool_safety_check_id,creative_work_project_id,maker_traveler_run_step_id,
   check_kind,result,check_note,evidence_reference,reviewed_by_user_id,created_at FROM maker_tool_safety_checks
   WHERE site_item_inventory_id=? ORDER BY maker_tool_safety_check_id DESC LIMIT 31`).bind(toolId).all(),
  db.prepare(`SELECT maker_tool_booking_decision_id,creative_work_project_id,conflicting_calendar_entry_id,
   calendar_request_key,starts_at_utc,ends_at_utc,decision,decision_note,reviewed_by_user_id,created_at
   FROM maker_tool_booking_decisions WHERE site_item_inventory_id=? ORDER BY maker_tool_booking_decision_id DESC LIMIT 31`).bind(toolId).all()
 ]):[{results:[]},{results:[]}];
 const approvals=calendarKey&&projectId?rows(decisions).filter(d=>d.calendar_request_key===calendarKey&&Number(d.creative_work_project_id)===projectId&&d.starts_at_utc===start&&d.ends_at_utc===end&&d.decision==='approved_overlap').map(d=>d.conflicting_calendar_entry_id):[];
 return {tools:rows(tools).slice(0,160),tools_truncated:rows(tools).length>160,projects:rows(projects).slice(0,100),projects_truncated:rows(projects).length>100,
  selected_tool:tool||null,tool_blocker:blocker(tool),conflicts:conflicts.slice(0,30),conflicts_truncated:conflicts.length>30,
  approvals,checks:rows(checks).slice(0,30),decisions:rows(decisions).slice(0,30),safety};
}
export async function onRequestGet(context){
 const a=await grant(context);if(a.error)return a.error;
 const q=new URL(context.request.url).searchParams,toolId=id(q.get('tool_id')),projectId=id(q.get('project_id')),
 start=clean(q.get('starts_at_utc'),40),end=clean(q.get('ends_at_utc'),40),calendarKey=clean(q.get('calendar_request_key'),80);
 if((q.has('tool_id')&&!toolId)||(q.has('project_id')&&!projectId)||((start||end)&&validateWindow(start,end,31)))
  return respond({ok:false,error:'Use real positive IDs and exact positive UTC start/end (maximum 31 days).'},400);
 try{return respond({ok:true,...await snapshot(a.db,toolId,start,end,projectId,calendarKey)})}
 catch(error){console.error('BUILD448_READ_FAILED',error?.name);return respond({ok:false,error:'Tool scheduling state could not be verified.'},503)}
}
export async function onRequestPost(context){
 const a=await grant(context);if(a.error)return a.error;
 if(context.request.headers.get('Origin')!==new URL(context.request.url).origin)return respond({ok:false,error:'Same-origin admin operation required.'},403);
 let body;try{body=await context.request.json()}catch{return respond({ok:false,error:'Valid JSON required.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({ok:false,error:'Operator action must be an object.'},400);
 const actor=id(a.admin.user_id),toolId=id(body.tool_id),action=clean(body.action,40),note=clean(body.note),requestKey=clean(body.request_key,80);
 if(!actor||!toolId||!keyValid(requestKey))return respond({ok:false,error:'Real Tool, admin identity and unique request key required.'},400);
 if(!['safety_check','review_conflict'].includes(action))return respond({ok:false,error:'Unsupported review action.'},400);
 try{
  let payload,table,kind,fields,params;
  if(action==='safety_check'){
   const checkKind=clean(body.check_kind,50),result=clean(body.result,20),projectId=id(body.project_id),stepId=id(body.traveler_step_id),evidence=clean(body.evidence_reference,400);
   if(!reviewKinds.has(checkKind)||!['passed','failed','held'].includes(result)||note.length<12||stepId&&!projectId)
    return respond({ok:false,error:'Choose the actual check, outcome, optional matching project/step, and 12+ character factual notes.'},400);
   const item=await toolState(a.db,toolId);
   if(!item)return respond({ok:false,error:'Active canonical Inventory Tool not found.'},404);
   if(result==='passed'&&blocker(item))return respond({ok:false,error:'A blocked Tool cannot pass a safety check. Resolve Inventory/lifecycle status through its owner first.',code:'TOOL_BLOCKED'},409);
   payload={action,toolId,projectId,stepId,checkKind,result,note,evidence};kind='safety';table='maker_tool_safety_checks';
   fields=`(site_item_inventory_id,creative_work_project_id,maker_traveler_run_step_id,check_kind,result,check_note,evidence_reference,reviewed_by_user_id,request_key,payload_sha256)`;
   params=[toolId,projectId||null,stepId||null,checkKind,result,note,evidence||null,actor,requestKey];
  }else{
   const projectId=id(body.project_id),conflictingId=id(body.conflicting_entry_id),start=clean(body.starts_at_utc,40),end=clean(body.ends_at_utc,40),calendarKey=clean(body.calendar_request_key,80),decision=clean(body.decision,25);
   if(!projectId||!conflictingId||!keyValid(calendarKey)||validateWindow(start,end,31)||!['approved_overlap','declined'].includes(decision)||note.length<20)
    return respond({ok:false,error:'Choose exact competing booking, project, UTC window and explicit 20+ character decision notes.'},400);
   const collision=await a.db.prepare(`SELECT creative_resource_calendar_entry_id,entry_kind FROM creative_resource_calendar_entries
    WHERE creative_resource_calendar_entry_id=? AND resource_site_item_inventory_id=? AND entry_status='active'
    AND starts_at_utc<? AND ends_at_utc>?`).bind(conflictingId,toolId,end,start).first();
   if(!collision)return respond({ok:false,error:'That competing booking is no longer active in the requested window. Refresh.'},409);
   if(decision==='approved_overlap'&&collision.entry_kind!=='project_booking')return respond({ok:false,error:'Recorded maintenance and resource holds cannot be approved away. Reschedule or resolve the hold.',code:'MAINTENANCE_BLOCK'},409);
   payload={action,toolId,projectId,conflictingId,start,end,calendarKey,decision,note};kind='decision';table='maker_tool_booking_decisions';
   fields=`(site_item_inventory_id,creative_work_project_id,conflicting_calendar_entry_id,calendar_request_key,starts_at_utc,ends_at_utc,decision,decision_note,reviewed_by_user_id,request_key,payload_sha256)`;
   params=[toolId,projectId,conflictingId,calendarKey,start,end,decision,note,actor,requestKey];
  }
  const hash=await digest({actor,payload});
  const prior=await a.db.prepare(`SELECT ${kind==='safety'?'maker_tool_safety_check_id':'maker_tool_booking_decision_id'} receipt_id,payload_sha256,reviewed_by_user_id FROM ${table} WHERE request_key=?`).bind(requestKey).first();
  if(prior)return prior.payload_sha256===hash&&Number(prior.reviewed_by_user_id)===actor
   ?respond({ok:true,replayed:true,receipt_id:prior.receipt_id,safety})
   :respond({ok:false,error:'The original request key belongs to a different review.',code:'REQUEST_KEY_REUSED'},409);
  const result=await a.db.prepare(`INSERT INTO ${table} ${fields} VALUES(${params.map(()=>'?').join(',')},?)`).bind(...params,hash).run();
  if(Number(result.meta?.changes||0)!==1)return respond({ok:false,error:'Review write not confirmed; refresh first.'},503);
  const receiptId=id(result.meta.last_row_id)||id((await a.db.prepare(`SELECT ${kind==='safety'?'maker_tool_safety_check_id':'maker_tool_booking_decision_id'} receipt_id FROM ${table} WHERE request_key=?`).bind(requestKey).first())?.receipt_id);
  await auditAdminAction(context.env,context.request,a.admin,{action_type:'build448_'+action,target_type:'site_item_inventory',target_id:toolId,details:{receipt_id:receiptId,action,calendar_writes:false,inventory_writes:false,provider_execution:false}});
  return respond({ok:true,receipt_id:receiptId,replayed:false,message:'Human review recorded without modifying the source calendar or Tool lifecycle.',safety});
 }catch(error){
  const value=String(error?.message||'');const code=value.includes('maintenance_or_hold')?'MAINTENANCE_BLOCK':value.includes('safety_check_step')?'TRAVELER_TOOL_MISMATCH':value.includes('blocked_equipment')?'TOOL_BLOCKED':/UNIQUE|constraint|conflict_not_current/i.test(value)?'STALE_OR_DUPLICATE':'WRITE_UNCONFIRMED';
  console.error('BUILD448_WRITE_FAILED',error?.name,code);
  return respond({ok:false,code,error:'Review was not confirmed ('+code+'). Refresh the latest state before retrying; preserve the request key.'},code==='WRITE_UNCONFIRMED'?503:409);
 }
}
