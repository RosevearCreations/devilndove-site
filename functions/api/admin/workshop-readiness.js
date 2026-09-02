// Release 467 Build 20 — read-only Workshop Tool & Equipment Readiness projection.
// Durable Tool identity/reuse stays in site_item_inventory; lifecycle profiles/events remain the only maintenance authority.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 20;
const SERVICE_DUE_SOON_DAYS = 30;
const WARRANTY_DUE_SOON_DAYS = 30;

function json(data, status = 200) { return jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function n(value) { const x = Number(value || 0); return Number.isFinite(x) ? x : 0; }
function text(value) { return String(value ?? '').trim(); }
function lower(value) { return text(value).toLowerCase(); }
function daysUntil(value) { const raw=text(value); if(!raw)return null; const stamp=Date.parse(raw.length<=10?`${raw}T12:00:00Z`:raw); return Number.isFinite(stamp)?Math.ceil((stamp-Date.now())/86400000):null; }
function rank(value) { return ({ critical:4,high:3,medium:2,low:1 })[value] || 0; }
function attention({ key, severity='medium', lane, title, detail, owner_href, owner_label, tool_id, updated_at=null }) { return { key,severity,lane,title,detail,owner_href,owner_label,tool_id,updated_at }; }
async function safeAll(db, sql) { try { return rows(await db.prepare(sql).all()); } catch { return []; } }
async function schemaReady(db) { const found=await safeAll(db,"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events')"); return found.length===2; }

async function toolFacts(db) {
  return safeAll(db, `
    SELECT sii.site_item_inventory_id,sii.item_name,sii.external_key,sii.category,
      COALESCE(sii.on_hand_quantity,0) on_hand_quantity,COALESCE(sii.do_not_reuse,0) do_not_reuse,
      COALESCE(sii.is_on_reorder_list,0) is_on_reorder_list,sii.updated_at inventory_updated_at,
      p.inventory_tool_lifecycle_profile_id,p.lifecycle_status,p.condition_status,p.acquired_at,p.warranty_expires_at,
      p.last_service_at,p.next_service_at,p.service_interval_days,p.replacement_priority,p.replacement_cost_cents,
      p.replacement_site_item_inventory_id,p.evidence_reference,p.reviewed_at,p.updated_at lifecycle_updated_at,
      (SELECT COUNT(*) FROM inventory_tool_lifecycle_events e WHERE e.site_item_inventory_id=sii.site_item_inventory_id) event_count,
      (SELECT MAX(e.occurred_at) FROM inventory_tool_lifecycle_events e WHERE e.site_item_inventory_id=sii.site_item_inventory_id) last_event_at,
      (SELECT MAX(e.occurred_at) FROM inventory_tool_lifecycle_events e WHERE e.site_item_inventory_id=sii.site_item_inventory_id AND e.event_type='inspection') last_inspection_at,
      (SELECT MAX(e.occurred_at) FROM inventory_tool_lifecycle_events e WHERE e.site_item_inventory_id=sii.site_item_inventory_id AND e.event_type='calibration') last_calibration_at,
      (SELECT MAX(e.occurred_at) FROM inventory_tool_lifecycle_events e WHERE e.site_item_inventory_id=sii.site_item_inventory_id AND e.event_type IN ('maintenance','repair','calibration')) last_service_event_at
    FROM site_item_inventory sii
    LEFT JOIN inventory_tool_lifecycle_profiles p ON p.site_item_inventory_id=sii.site_item_inventory_id
    WHERE COALESCE(sii.is_active,1)=1 AND lower(trim(COALESCE(sii.source_type,'')))='tool'
    ORDER BY CASE COALESCE(p.condition_status,'unverified') WHEN 'unsafe' THEN 0 WHEN 'damaged' THEN 1 WHEN 'service_due' THEN 2 ELSE 3 END,
      CASE COALESCE(p.replacement_priority,'normal') WHEN 'urgent' THEN 0 WHEN 'plan' THEN 1 WHEN 'watch' THEN 2 ELSE 3 END,
      lower(COALESCE(sii.item_name,'')),sii.site_item_inventory_id
    LIMIT 500
  `);
}

async function recentEventFacts(db) {
  return safeAll(db, `
    SELECT e.inventory_tool_lifecycle_event_id,e.site_item_inventory_id,sii.item_name,e.event_type,e.occurred_at,
      e.condition_before,e.condition_after,e.service_cost_cents,e.evidence_reference,e.notes,e.created_at
    FROM inventory_tool_lifecycle_events e
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=e.site_item_inventory_id
    WHERE lower(trim(COALESCE(sii.source_type,'')))='tool'
    ORDER BY datetime(e.occurred_at) DESC,e.inventory_tool_lifecycle_event_id DESC
    LIMIT 100
  `);
}

function deriveTool(row) {
  const id=n(row.site_item_inventory_id),name=text(row.item_name)||`Tool ${id}`;
  const lifecycle=lower(row.lifecycle_status),condition=lower(row.condition_status),replacement=lower(row.replacement_priority)||'normal';
  const serviceDays=daysUntil(row.next_service_at),warrantyDays=daysUntil(row.warranty_expires_at),doNotReuse=n(row.do_not_reuse)===1;
  const owner=`/admin/tool-lifecycle/?site_item_inventory_id=${id}`;
  const inventoryOwner=`/admin/inventory-operations/?site_item_inventory_id=${id}`;
  const queue=[];
  if(doNotReuse) queue.push(attention({key:`tool-${id}-reuse`,severity:'critical',lane:'safety',title:`${name} — Inventory blocks reuse`,detail:'Inventory is marked do-not-reuse. Build 20 cannot clear that authority or return the Tool to service.',owner_href:inventoryOwner,owner_label:'Open Inventory owner',tool_id:id,updated_at:row.inventory_updated_at}));
  if(condition==='unsafe') queue.push(attention({key:`tool-${id}-unsafe`,severity:'critical',lane:'safety',title:`${name} — unsafe condition`,detail:'The durable lifecycle profile records this Tool as unsafe. Keep lifecycle action in the existing Tool Lifecycle owner.',owner_href:owner,owner_label:'Open Tool Lifecycle',tool_id:id,updated_at:row.lifecycle_updated_at}));
  else if(condition==='damaged'||lifecycle==='out_of_service') queue.push(attention({key:`tool-${id}-out`,severity:'high',lane:'safety',title:`${name} — out of service / damaged`,detail:'The existing lifecycle authority indicates the Tool is damaged or out of service.',owner_href:owner,owner_label:'Review lifecycle',tool_id:id,updated_at:row.lifecycle_updated_at}));
  if(serviceDays!=null&&serviceDays<0) queue.push(attention({key:`tool-${id}-service-overdue`,severity:'high',lane:'service',title:`${name} — scheduled service overdue`,detail:`next_service_at is ${Math.abs(serviceDays)} day(s) past its recorded schedule. Build 20 does not record maintenance itself.`,owner_href:owner,owner_label:'Open service owner',tool_id:id,updated_at:row.next_service_at}));
  else if(serviceDays===0) queue.push(attention({key:`tool-${id}-service-today`,severity:'high',lane:'service',title:`${name} — scheduled service due today`,detail:'The durable next_service_at schedule is due today.',owner_href:owner,owner_label:'Open service owner',tool_id:id,updated_at:row.next_service_at}));
  else if(serviceDays!=null&&serviceDays<=SERVICE_DUE_SOON_DAYS) queue.push(attention({key:`tool-${id}-service-soon`,severity:'medium',lane:'service',title:`${name} — scheduled service due soon`,detail:`The durable next_service_at schedule is due in ${serviceDays} day(s).`,owner_href:owner,owner_label:'Review service schedule',tool_id:id,updated_at:row.next_service_at}));
  if(doNotReuse&&lifecycle==='active') queue.push(attention({key:`tool-${id}-align-reuse`,severity:'high',lane:'alignment',title:`${name} — Inventory/lifecycle mismatch`,detail:'Inventory blocks reuse while the lifecycle profile still says active. The two authorities must be reviewed in their existing owners.',owner_href:owner,owner_label:'Review lifecycle alignment',tool_id:id,updated_at:row.lifecycle_updated_at}));
  if(condition==='unsafe'&&lifecycle==='active') queue.push(attention({key:`tool-${id}-align-unsafe`,severity:'high',lane:'alignment',title:`${name} — unsafe but active`,detail:'Unsafe condition and active lifecycle state conflict. Build 20 surfaces the mismatch without changing either record.',owner_href:owner,owner_label:'Resolve in Tool Lifecycle',tool_id:id,updated_at:row.lifecycle_updated_at}));
  if(['retired','replaced'].includes(lifecycle)&&!doNotReuse) queue.push(attention({key:`tool-${id}-align-closed`,severity:'medium',lane:'alignment',title:`${name} — closed lifecycle / reusable Inventory`,detail:'Lifecycle is retired or replaced while Inventory is not marked do-not-reuse. Review the durable authorities before reuse.',owner_href:inventoryOwner,owner_label:'Review Inventory owner',tool_id:id,updated_at:row.lifecycle_updated_at}));
  if(replacement==='urgent') queue.push(attention({key:`tool-${id}-replacement-urgent`,severity:'high',lane:'replacement',title:`${name} — urgent replacement planning`,detail:`The lifecycle profile replacement priority is urgent${n(row.replacement_cost_cents)>0?` with an estimate of ${(n(row.replacement_cost_cents)/100).toLocaleString('en-CA',{style:'currency',currency:'CAD'})}`:''}. No replacement is purchased or created here.`,owner_href:owner,owner_label:'Open replacement owner',tool_id:id,updated_at:row.lifecycle_updated_at}));
  else if(replacement==='plan') queue.push(attention({key:`tool-${id}-replacement-plan`,severity:'medium',lane:'replacement',title:`${name} — replacement planning`,detail:'The durable replacement priority is plan. Review lifecycle evidence and cost before any procurement decision.',owner_href:owner,owner_label:'Review replacement plan',tool_id:id,updated_at:row.lifecycle_updated_at}));
  else if(replacement==='watch') queue.push(attention({key:`tool-${id}-replacement-watch`,severity:'low',lane:'replacement',title:`${name} — replacement watch`,detail:'The durable replacement priority is watch.',owner_href:owner,owner_label:'Review replacement watch',tool_id:id,updated_at:row.lifecycle_updated_at}));
  if(!row.inventory_tool_lifecycle_profile_id) queue.push(attention({key:`tool-${id}-profile`,severity:'medium',lane:'evidence',title:`${name} — lifecycle profile missing`,detail:'This active Tool has no durable lifecycle profile yet. Build 20 does not create one automatically.',owner_href:owner,owner_label:'Open Tool Lifecycle',tool_id:id,updated_at:row.inventory_updated_at}));
  else {
    if(!text(row.reviewed_at)) queue.push(attention({key:`tool-${id}-review`,severity:'medium',lane:'evidence',title:`${name} — lifecycle review pending`,detail:'The lifecycle profile has no reviewed_at evidence.',owner_href:owner,owner_label:'Review lifecycle profile',tool_id:id,updated_at:row.lifecycle_updated_at}));
    if(condition==='unverified') queue.push(attention({key:`tool-${id}-condition`,severity:'low',lane:'evidence',title:`${name} — condition unverified`,detail:'Condition remains unverified in the durable lifecycle profile. No inspection interval is inferred.',owner_href:owner,owner_label:'Review condition evidence',tool_id:id,updated_at:row.lifecycle_updated_at}));
  }
  if(warrantyDays!=null&&warrantyDays>=0&&warrantyDays<=WARRANTY_DUE_SOON_DAYS) queue.push(attention({key:`tool-${id}-warranty`,severity:'low',lane:'warranty',title:`${name} — warranty date approaching`,detail:`The recorded warranty_expires_at date is in ${warrantyDays} day(s). This is a factual date reminder, not a service requirement.`,owner_href:owner,owner_label:'Review warranty record',tool_id:id,updated_at:row.warranty_expires_at}));
  let readiness_state='ready';
  if(['retired','replaced'].includes(lifecycle)) readiness_state='closed';
  else if(doNotReuse||condition==='unsafe') readiness_state='blocked';
  else if(condition==='damaged'||lifecycle==='out_of_service') readiness_state='out_of_service';
  else if(serviceDays!=null&&serviceDays<=0) readiness_state='service_due';
  else if(replacement==='urgent') readiness_state='replacement_urgent';
  else if(queue.length) readiness_state='attention';
  return {...row,service_days:serviceDays,warranty_days:warrantyDays,readiness_state,attention_count:queue.length,queue};
}

export async function onRequestGet(context) {
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  if(!await schemaReady(db)) return json({ok:true,schema_ready:false,read_only:true,tools:[],queue:[],recent_events:[],summary:{},calibration_history_only:true,calibration_due_schedule:false});
  try {
    const [rawTools,recentEvents]=await Promise.all([toolFacts(db),recentEventFacts(db)]);
    const tools=rawTools.map(deriveTool);
    const queue=tools.flatMap(x=>x.queue).sort((a,b)=>rank(b.severity)-rank(a.severity)||String(a.updated_at||'').localeCompare(String(b.updated_at||'')));
    const summary={total_tools:tools.length,ready:tools.filter(x=>x.readiness_state==='ready').length,blocked:tools.filter(x=>x.readiness_state==='blocked').length,out_of_service:tools.filter(x=>x.readiness_state==='out_of_service').length,service_due:tools.filter(x=>x.readiness_state==='service_due').length,service_due_soon:tools.filter(x=>x.service_days!=null&&x.service_days>0&&x.service_days<=SERVICE_DUE_SOON_DAYS).length,replacement_planning:tools.filter(x=>['watch','plan','urgent'].includes(lower(x.replacement_priority))).length,review_pending:tools.filter(x=>!x.inventory_tool_lifecycle_profile_id||!text(x.reviewed_at)||lower(x.condition_status)==='unverified').length,attention_total:queue.length,critical:queue.filter(x=>x.severity==='critical').length,high:queue.filter(x=>x.severity==='high').length};
    return json({ok:true,schema_ready:true,read_only:true,automatic_tool_status_change:false,automatic_inventory_change:false,automatic_lifecycle_event_recording:false,automatic_replacement_procurement:false,provider_execution:false,calibration_history_only:true,calibration_due_schedule:false,requested_by:{user_id:adminUser.user_id,email:adminUser.email,display_name:adminUser.display_name},summary,queue,tools,recent_events:recentEvents,owners:{tool_lifecycle:'/admin/tool-lifecycle/',inventory:'/admin/inventory-operations/',creator:'/admin/creator/'}});
  } catch(error) {
    return json({ok:false,read_only:true,error:'Workshop Tool & Equipment Readiness could not be loaded.',detail:String(error?.message||error)},503);
  }
}
