// Devil n Dove Build 440 — Tool condition/service/inspection lifecycle + completeness authority.
// Inventory remains authoritative for Tool identity/stock/do-not-reuse and reusable usage evidence.
// catalog_items is publication linkage only. No request-time DDL, polling, retry, R2 or provider work.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 440;
const MAX_LIMIT = 80;
const CONDITIONS = new Set(['good','needs_attention','out_of_service','retired']);
const ACTIONS = new Set(['record_inspection','record_service','record_repair','set_condition','set_service_schedule','retire','reactivate']);
const json = (data,status=200) => jsonResponse(data,status,{'Cache-Control':'no-store'});
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const id = (value) => { const n=Number(value||0); return Number.isInteger(n)&&n>0?n:0; };
const text = (value,max=500) => normalizeText(value).slice(0,max);
const condition = (value,fallback='good') => { const v=text(value,40).toLowerCase(); return CONDITIONS.has(v)?v:fallback; };
const integer = (value,fallback=null) => { if(value==null||value==='') return fallback; const n=Number(value); return Number.isInteger(n)?n:fallback; };
const iso = (value) => { const d=value?new Date(value):new Date(); return Number.isFinite(d.getTime())?d.toISOString():new Date().toISOString(); };
const nextDue = (eventAt,days) => { if(!days) return null; const d=new Date(eventAt); d.setUTCDate(d.getUTCDate()+days); return d.toISOString(); };

async function access({request,env}) {
  const adminUser=await getAdminUserFromRequest(request,env);
  if(!adminUser) return {response:json({ok:false,build:BUILD,error:'Admin access required.'},401)};
  const db=getDb(env);
  if(!db) return {response:json({ok:false,build:BUILD,error:'Database binding is not configured.'},500)};
  return {adminUser,db};
}

const TOOL_FROM_SQL = `
  FROM site_item_inventory sii
  LEFT JOIN inventory_item_profiles iip ON iip.site_item_inventory_id=sii.site_item_inventory_id
  LEFT JOIN site_tool_lifecycle_profiles tlp ON tlp.site_item_inventory_id=sii.site_item_inventory_id
  LEFT JOIN catalog_items ci ON ci.catalog_item_id=(
    SELECT ci2.catalog_item_id
    FROM catalog_items ci2
    WHERE LOWER(TRIM(COALESCE(ci2.item_kind,'')))='tool'
      AND LOWER(TRIM(COALESCE(ci2.source_key,'')))=LOWER(TRIM(COALESCE(sii.external_key,'')))
    ORDER BY CASE WHEN COALESCE(ci2.status,'active')='active' THEN 0 ELSE 1 END,
             COALESCE(ci2.visible_public,1) DESC,ci2.catalog_item_id DESC
    LIMIT 1
  )`;

const TOOL_SELECT_SQL = `
  SELECT sii.site_item_inventory_id,sii.external_key,sii.item_name,sii.category,sii.image_url,
         COALESCE(sii.on_hand_quantity,0) AS on_hand_quantity,
         COALESCE(sii.reserved_quantity,0) AS reserved_quantity,
         COALESCE(sii.incoming_quantity,0) AS incoming_quantity,
         COALESCE(sii.stock_unit_label,'unit') AS stock_unit_label,
         COALESCE(sii.usage_unit_label,'unit') AS usage_unit_label,
         COALESCE(sii.supplier_name,'') AS supplier_name,
         COALESCE(sii.supplier_sku,'') AS supplier_sku,
         COALESCE(sii.do_not_reuse,0) AS do_not_reuse,COALESCE(sii.is_active,1) AS is_active,
         COALESCE(iip.inventory_class,'reusable_equipment') AS inventory_class,
         COALESCE(iip.lifecycle_mode,'reusable') AS lifecycle_mode,
         COALESCE(tlp.condition_status,'good') AS condition_status,
         tlp.service_interval_days,tlp.last_service_at,tlp.next_service_due_at,tlp.last_inspected_at,
         COALESCE(tlp.profile_notes,'') AS profile_notes,COALESCE(tlp.version,0) AS lifecycle_version,
         (SELECT MAX(u.created_at) FROM site_inventory_usage_movements u WHERE u.site_item_inventory_id=sii.site_item_inventory_id) AS last_usage_at,
         (SELECT COUNT(*) FROM site_inventory_usage_movements u WHERE u.site_item_inventory_id=sii.site_item_inventory_id) AS usage_event_count,
         ci.catalog_item_id,COALESCE(ci.name,'') AS publication_name,COALESCE(ci.slug,'') AS publication_slug,
         COALESCE(ci.visible_public,0) AS visible_public,COALESCE(ci.status,'') AS publication_status`;

function shapeTool(row={}) {
  const catalogItemId=id(row.catalog_item_id);
  const visible=Number(row.visible_public||0)===1 && String(row.publication_status||'').toLowerCase()==='active';
  return {
    ...row,
    site_item_inventory_id:id(row.site_item_inventory_id),
    catalog_item_id:catalogItemId||null,
    publication_linked:catalogItemId?1:0,
    publication_public:visible?1:0,
    publication_url:visible?`/tools/?q=${encodeURIComponent(row.external_key||row.item_name||'')}`:null,
    inventory_owner_url:`/admin/inventory-operations/?inventory_id=${id(row.site_item_inventory_id)}#siteInventoryForm`,
  };
}

async function loadTool(db,toolId) {
  const row=await db.prepare(`${TOOL_SELECT_SQL} ${TOOL_FROM_SQL} WHERE sii.site_item_inventory_id=? AND LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' LIMIT 1`).bind(toolId).first();
  return row?shapeTool(row):null;
}

async function listTools(db,{q='',filter='all',limit=40,offset=0,historyToolId=0}={}) {
  const needle=text(q,120).toLowerCase(); const like=`%${needle}%`;
  const allowed=new Set(['all','attention','service_due','do_not_reuse','never_inspected','unpublished']);
  const mode=allowed.has(filter)?filter:'all';
  const where={
    all:'1=1',
    attention:"(COALESCE(tlp.condition_status,'good') IN ('needs_attention','out_of_service','retired') OR COALESCE(sii.do_not_reuse,0)=1)",
    service_due:"tlp.next_service_due_at IS NOT NULL AND datetime(tlp.next_service_due_at)<=datetime('now')",
    do_not_reuse:'COALESCE(sii.do_not_reuse,0)=1',
    never_inspected:'tlp.last_inspected_at IS NULL',
    unpublished:"(ci.catalog_item_id IS NULL OR COALESCE(ci.visible_public,0)<>1 OR COALESCE(ci.status,'')<>'active')",
  }[mode];
  const result=await db.prepare(`
    ${TOOL_SELECT_SQL}
    ${TOOL_FROM_SQL}
    WHERE LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' AND COALESCE(sii.is_active,1)=1
      AND (?='' OR LOWER(COALESCE(sii.item_name,'')) LIKE ? OR LOWER(COALESCE(sii.category,'')) LIKE ? OR LOWER(COALESCE(sii.external_key,'')) LIKE ?)
      AND ${where}
    ORDER BY CASE WHEN COALESCE(tlp.condition_status,'good') IN ('out_of_service','retired') THEN 0 WHEN COALESCE(tlp.condition_status,'good')='needs_attention' THEN 1 ELSE 2 END,
             COALESCE(tlp.next_service_due_at,'9999-12-31') ASC,LOWER(COALESCE(sii.item_name,'')) ASC
    LIMIT ? OFFSET ?
  `).bind(needle,like,like,like,limit+1,offset).all();
  const all=rows(result); const hasMore=all.length>limit; const tools=all.slice(0,limit).map(shapeTool);
  const summary=await db.prepare(`
    SELECT COUNT(*) AS active_tools,
      SUM(CASE WHEN tlp.next_service_due_at IS NOT NULL AND datetime(tlp.next_service_due_at)<=datetime('now') THEN 1 ELSE 0 END) AS service_due,
      SUM(CASE WHEN COALESCE(tlp.condition_status,'good')='needs_attention' THEN 1 ELSE 0 END) AS needs_attention,
      SUM(CASE WHEN COALESCE(tlp.condition_status,'good')='out_of_service' THEN 1 ELSE 0 END) AS out_of_service,
      SUM(CASE WHEN COALESCE(tlp.condition_status,'good')='retired' THEN 1 ELSE 0 END) AS retired,
      SUM(CASE WHEN COALESCE(sii.do_not_reuse,0)=1 THEN 1 ELSE 0 END) AS do_not_reuse,
      SUM(CASE WHEN tlp.last_inspected_at IS NULL THEN 1 ELSE 0 END) AS never_inspected,
      SUM(CASE WHEN ci.catalog_item_id IS NULL OR COALESCE(ci.visible_public,0)<>1 OR COALESCE(ci.status,'')<>'active' THEN 1 ELSE 0 END) AS unpublished
    ${TOOL_FROM_SQL}
    WHERE LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' AND COALESCE(sii.is_active,1)=1
  `).first();
  let history=[]; let usage_history=[]; let selected_tool=null;
  if(historyToolId) {
    selected_tool=await loadTool(db,historyToolId);
    const [life,usage]=await Promise.all([
      db.prepare(`SELECT site_tool_lifecycle_event_id,event_type,event_at,condition_before,condition_after,service_interval_days,do_not_reuse_before,do_not_reuse_after,notes,actor_user_id,created_at FROM site_tool_lifecycle_events WHERE site_item_inventory_id=? ORDER BY datetime(event_at) DESC,site_tool_lifecycle_event_id DESC LIMIT 60`).bind(historyToolId).all(),
      db.prepare(`SELECT site_inventory_usage_movement_id,site_inventory_movement_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at FROM site_inventory_usage_movements WHERE site_item_inventory_id=? ORDER BY datetime(created_at) DESC,site_inventory_usage_movement_id DESC LIMIT 60`).bind(historyToolId).all(),
    ]);
    history=rows(life); usage_history=rows(usage);
  }
  return {
    tools,
    summary:{active_tools:Number(summary?.active_tools||0),service_due:Number(summary?.service_due||0),needs_attention:Number(summary?.needs_attention||0),out_of_service:Number(summary?.out_of_service||0),retired:Number(summary?.retired||0),do_not_reuse:Number(summary?.do_not_reuse||0),never_inspected:Number(summary?.never_inspected||0),unpublished:Number(summary?.unpublished||0)},
    filter:mode,limit,offset,next_offset:hasMore?offset+limit:null,history,usage_history,selected_tool
  };
}

async function mutate(context,granted,body) {
  const toolId=id(body.site_item_inventory_id); const action=text(body.action,60).toLowerCase(); const note=text(body.note,500);
  if(!toolId||!ACTIONS.has(action)) return json({ok:false,build:BUILD,code:'tool_lifecycle_action_invalid',error:'Choose a Tool and a supported lifecycle action.'},400);
  if(note.length<6) return json({ok:false,build:BUILD,code:'tool_lifecycle_note_required',error:'Add a lifecycle note/reason of at least 6 characters.'},400);
  const tool=await loadTool(granted.db,toolId);
  if(!tool||Number(tool.is_active||0)!==1) return json({ok:false,build:BUILD,code:'tool_lifecycle_tool_missing',error:'The active Tool was not found.'},404);
  await granted.db.prepare(`INSERT INTO site_tool_lifecycle_profiles(site_item_inventory_id,condition_status,updated_by_user_id,created_at,updated_at) VALUES(?,'good',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO NOTHING`).bind(toolId,granted.adminUser.user_id).run();
  const current=await loadTool(granted.db,toolId); const before=condition(current.condition_status,'good'); const oldDoNot=Number(current.do_not_reuse||0)===1?1:0;
  let after=condition(body.condition_after,before); let eventType='condition_change'; let interval=integer(body.service_interval_days,current.service_interval_days==null?null:Number(current.service_interval_days));
  if(interval!=null&&(interval<1||interval>3650)) return json({ok:false,build:BUILD,code:'tool_lifecycle_interval_invalid',error:'Service interval must be between 1 and 3650 days.'},400);
  if(action==='record_inspection') eventType='inspection';
  if(action==='record_service') eventType='service';
  if(action==='record_repair') eventType='repair';
  if(action==='set_service_schedule') { eventType='service_schedule'; after=before; if(!interval) return json({ok:false,build:BUILD,code:'tool_lifecycle_interval_required',error:'Choose a service interval before saving the schedule.'},400); }
  if(action==='retire') { eventType='retired'; after='retired'; }
  if(action==='reactivate') { eventType='reactivated'; after=condition(body.condition_after,'good'); if(!['good','needs_attention'].includes(after)) after='good'; }
  const eventAt=iso(body.event_at); const lastService=action==='record_service'?eventAt:(current.last_service_at||null); const lastInspected=action==='record_inspection'?eventAt:(current.last_inspected_at||null); const due=lastService&&interval?nextDue(lastService,interval):null;
  const newDoNot=(after==='out_of_service'||after==='retired')?1:(action==='reactivate'?0:oldDoNot);
  const version=Math.max(1,Number(current.lifecycle_version||1)); const profileNotes=text(body.profile_notes,500)||current.profile_notes||null;
  const statements=[
    granted.db.prepare(`UPDATE site_tool_lifecycle_profiles SET condition_status=?,service_interval_days=?,last_service_at=?,next_service_due_at=?,last_inspected_at=?,profile_notes=?,version=version+1,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND version=?`).bind(after,interval,lastService,due,lastInspected,profileNotes,granted.adminUser.user_id,toolId,version),
    granted.db.prepare(`INSERT INTO site_tool_lifecycle_events(site_item_inventory_id,event_type,event_at,condition_before,condition_after,service_interval_days,do_not_reuse_before,do_not_reuse_after,notes,actor_user_id,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP FROM site_tool_lifecycle_profiles WHERE site_item_inventory_id=? AND version=?`).bind(toolId,eventType,eventAt,before,after,interval,oldDoNot,newDoNot,note,granted.adminUser.user_id,toolId,version+1),
    granted.db.prepare(`UPDATE site_item_inventory SET do_not_reuse=?,reuse_status=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(newDoNot,after,toolId),
  ];
  if(action==='retire'||action==='reactivate') statements.push(granted.db.prepare(`INSERT INTO inventory_item_profiles(site_item_inventory_id,inventory_class,lifecycle_mode,updated_by_user_id,created_at,updated_at) VALUES(?,'reusable_equipment',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET lifecycle_mode=excluded.lifecycle_mode,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(toolId,action==='retire'?'retired':'reusable',granted.adminUser.user_id));
  const result=await granted.db.batch(statements);
  if(Number(result?.[0]?.meta?.changes||0)!==1||Number(result?.[1]?.meta?.changes||0)!==1) return json({ok:false,build:BUILD,code:'tool_lifecycle_concurrent_change',error:'Tool lifecycle state changed while saving. Refresh and try again.'},409);
  await auditAdminAction(context.env,context.request,granted.adminUser,{action_type:`tool_lifecycle_${eventType}`,target_type:'inventory_tool',target_id:toolId,target_key:current.external_key||null,details:{condition_before:before,condition_after:after,service_interval_days:interval,do_not_reuse_before:oldDoNot,do_not_reuse_after:newDoNot,note}});
  return json({ok:true,build:BUILD,message:`Tool lifecycle ${eventType.replaceAll('_',' ')} recorded.`,tool:await loadTool(granted.db,toolId)});
}

export async function onRequestGet(context) {
  const granted=await access(context); if(granted.response) return granted.response;
  const url=new URL(context.request.url); const limit=Math.max(10,Math.min(MAX_LIMIT,integer(url.searchParams.get('limit'),40)||40)); const offset=Math.max(0,integer(url.searchParams.get('offset'),0)||0);
  try { return json({ok:true,build:BUILD,identity_authority:'site_item_inventory',usage_authority:'site_inventory_usage_movements',publication_authority:'catalog_items (publication eligibility only)',lifecycle_authority:'site_tool_lifecycle_profiles + site_tool_lifecycle_events',...(await listTools(granted.db,{q:url.searchParams.get('q')||'',filter:url.searchParams.get('filter')||'all',limit,offset,historyToolId:id(url.searchParams.get('tool_id'))}))}); }
  catch(error){ await captureRuntimeIncident(context.env,context.request,{incident_scope:'tool_lifecycle',incident_code:'tool_lifecycle_read_failed',message:error?.message||'Tool lifecycle read failed.',related_user_id:granted.adminUser.user_id}); return json({ok:false,build:BUILD,code:'tool_lifecycle_read_failed',error:'Tool lifecycle review could not be loaded.'},500); }
}

export async function onRequestPost(context) {
  const granted=await access(context); if(granted.response) return granted.response;
  let body={}; try{body=await context.request.json();}catch{return json({ok:false,build:BUILD,code:'tool_lifecycle_json_required',error:'A JSON request body is required.'},400);}
  try{return await mutate(context,granted,body);}catch(error){await captureRuntimeIncident(context.env,context.request,{incident_scope:'tool_lifecycle',incident_code:'tool_lifecycle_write_failed',message:error?.message||'Tool lifecycle write failed.',related_user_id:granted.adminUser.user_id});return json({ok:false,build:BUILD,code:'tool_lifecycle_write_failed',error:'Tool lifecycle action failed safely.'},500);}
}
