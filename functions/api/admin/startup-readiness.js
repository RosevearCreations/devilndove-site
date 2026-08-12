// File: /functions/api/admin/startup-readiness.js
// Build 254 — low-CPU Startup Readiness status API. The full 46-gate operating guide lives in the browser bundle;
// this endpoint moves only mutable D1 status/evidence fields and compact history.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '254';
const EXPECTED_TOTAL = 46;
const CONTRACT = 'startup_status_v2';
const STATUS_VALUES = new Set(['not_started','in_progress','blocked','needs_review','passed','failed','not_applicable']);

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control':'no-store' }); }
function text(value, max = 5000) { return normalizeText(value).slice(0, max); }
function records(result) { return Array.isArray(result?.results) ? result.results : []; }
function normalizeStatus(value) { const raw=text(value,40).toLowerCase(); return STATUS_VALUES.has(raw)?raw:'not_started'; }
function validationError(message) { const error=new Error(message); error.code='VALIDATION'; return error; }
function safeUrl(value) {
  const raw=text(value,1000); if(!raw) return '';
  if(raw.startsWith('/')) return raw;
  try { const url=new URL(raw); return ['http:','https:'].includes(url.protocol)?url.toString():''; } catch { return ''; }
}
function deferIncident(context, payload) {
  if (typeof context.waitUntil === 'function') context.waitUntil(captureRuntimeIncident(context.env,context.request,payload).catch(()=>false));
}
function deferAudit(context, adminUser, payload) {
  if (typeof context.waitUntil === 'function') context.waitUntil(auditAdminAction(context.env,context.request,adminUser,payload).catch(()=>null));
}
async function requireAdmin(context) {
  try {
    const adminUser=await getAdminUserFromRequest(context.request,context.env);
    if(!adminUser) return {error:json({ok:false,error:'Admin access required.'},401)};
    const db=getDb(context.env);
    if(!db) return {error:json({ok:false,error:'Database binding is not configured.'},500)};
    return {adminUser,db};
  } catch(error) {
    deferIncident(context,{incident_scope:'startup_readiness',incident_code:'startup_readiness_access_failed',severity:'error',message:error?.message||'Startup readiness access check failed.',details:{error:String(error?.stack||error)}});
    return {error:json({ok:false,error:'Startup readiness access could not be verified.'},503)};
  }
}
function compactItem(row) {
  return {
    startup_readiness_item_id:Number(row?.startup_readiness_item_id||0)||null,
    item_key:text(row?.item_key,120),
    item_status:normalizeStatus(row?.item_status),
    owner_name:text(row?.owner_name,180),
    due_date:text(row?.due_date,20),
    evidence_url:text(row?.evidence_url,1000),
    evidence_notes:text(row?.evidence_notes,5000),
    blocked_reason:text(row?.blocked_reason,2000),
    completed_at:row?.completed_at||null,
    updated_at:row?.updated_at||null
  };
}
async function readData(db) {
  const items=records(await db.prepare(`
    SELECT startup_readiness_item_id,item_key,item_status,owner_name,due_date,evidence_url,evidence_notes,blocked_reason,completed_at,updated_at
    FROM startup_readiness_items
    WHERE is_active=1
    ORDER BY sort_order,item_key
  `).all()).map(compactItem);
  const history=records(await db.prepare(`
    SELECT startup_readiness_history_id,item_key,previous_status,next_status,owner_name,due_date,evidence_url,evidence_notes,blocked_reason,changed_at
    FROM startup_readiness_history
    ORDER BY startup_readiness_history_id DESC
    LIMIT 40
  `).all());
  return {
    ok:true,build:BUILD,contract:CONTRACT,guide_included:false,expected_total:EXPECTED_TOTAL,
    degraded:items.length!==EXPECTED_TOTAL,
    backend_warning:items.length===EXPECTED_TOTAL?'':`D1 returned ${items.length} of ${EXPECTED_TOTAL} readiness status rows. The browser guide remains complete; missing status rows stay unsynced until the migration/data issue is corrected.`,
    items,recent_history:history
  };
}
function normalizedSave(body, current, action='save_item') {
  const itemKey=text(body?.item_key,120);
  if(!itemKey || itemKey!==text(current?.item_key,120)) throw validationError('Startup readiness item was not found.');
  let nextStatus=action==='mark_complete'?'passed':action==='reopen_item'?'in_progress':normalizeStatus(body?.item_status);
  const ownerName=text(body?.owner_name,180);
  const dueRaw=text(body?.due_date,20);
  const dueDate=/^\d{4}-\d{2}-\d{2}$/.test(dueRaw)?dueRaw:'';
  const evidenceUrl=safeUrl(body?.evidence_url);
  const evidenceNotes=text(body?.evidence_notes,5000);
  const blockedReason=text(body?.blocked_reason,2000);
  if(nextStatus==='blocked'&&blockedReason.length<5) throw validationError('Add a clear blocked reason before saving this item as Blocked.');
  if(['passed','not_applicable'].includes(nextStatus)&&!evidenceNotes&&!evidenceUrl) throw validationError('Add evidence notes or an evidence link before marking this item complete or not applicable.');
  return {itemKey,nextStatus,ownerName,dueDate,evidenceUrl,evidenceNotes,blockedReason};
}
function writeStatements(db, current, save, userId) {
  return [
    db.prepare(`UPDATE startup_readiness_items SET item_status=?2,owner_name=?3,due_date=?4,evidence_url=?5,evidence_notes=?6,blocked_reason=?7,
      completed_at=CASE WHEN ?2 IN ('passed','not_applicable') THEN CURRENT_TIMESTAMP ELSE NULL END,
      completed_by_user_id=CASE WHEN ?2 IN ('passed','not_applicable') THEN ?8 ELSE NULL END,
      last_updated_by_user_id=?8,updated_at=CURRENT_TIMESTAMP WHERE startup_readiness_item_id=?1`)
      .bind(current.startup_readiness_item_id,save.nextStatus,save.ownerName||null,save.dueDate||null,save.evidenceUrl||null,save.evidenceNotes||null,save.blockedReason||null,userId),
    db.prepare(`INSERT INTO startup_readiness_history (startup_readiness_item_id,item_key,previous_status,next_status,owner_name,due_date,evidence_url,evidence_notes,blocked_reason,changed_by_user_id)
      VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`)
      .bind(current.startup_readiness_item_id,save.itemKey,current.item_status,save.nextStatus,save.ownerName||null,save.dueDate||null,save.evidenceUrl||null,save.evidenceNotes||null,save.blockedReason||null,userId)
  ];
}
function patchItem(current, save) {
  return compactItem({
    ...current,item_status:save.nextStatus,owner_name:save.ownerName,due_date:save.dueDate,evidence_url:save.evidenceUrl,
    evidence_notes:save.evidenceNotes,blocked_reason:save.blockedReason,
    completed_at:['passed','not_applicable'].includes(save.nextStatus)?new Date().toISOString():null,
    updated_at:new Date().toISOString()
  });
}

export async function onRequestGet(context) {
  const access=await requireAdmin(context); if(access.error) return access.error;
  try { return json(await readData(access.db)); }
  catch(error) {
    deferIncident(context,{incident_scope:'startup_readiness',incident_code:'startup_readiness_get_degraded',severity:'warning',message:error?.message||'Startup readiness status query failed.',related_user_id:access.adminUser.user_id,details:{error:String(error?.stack||error)}});
    return json({ok:true,build:BUILD,contract:CONTRACT,guide_included:false,expected_total:EXPECTED_TOTAL,degraded:true,backend_warning:`D1 readiness status is temporarily unavailable: ${text(error?.message||'query failed',300)}`,items:[],recent_history:[]});
  }
}

export async function onRequestPost(context) {
  const access=await requireAdmin(context); if(access.error) return access.error;
  const declaredLength=Number(context.request.headers.get('Content-Length')||0);
  if(declaredLength>131072) return json({ok:false,error:'Startup readiness request body is too large.'},413);
  let body={}; try{body=await context.request.json();}catch{return json({ok:false,error:'Expected a JSON request body.'},400);}
  const action=text(body.action,80).toLowerCase();
  try {
    if(action==='seed_items'||action==='export_markdown') return json(await readData(access.db));

    if(action==='sync_items') {
      const incoming=Array.isArray(body.items)?body.items:[];
      if(!incoming.length) return json({ok:true,build:BUILD,contract:CONTRACT,mode:'batch_patch',saved_items:[],message:'No browser-only readiness changes needed synchronization.'});
      if(incoming.length>EXPECTED_TOTAL) throw validationError(`A maximum of ${EXPECTED_TOTAL} readiness changes can be synchronized at once.`);
      const currentRows=records(await access.db.prepare(`SELECT startup_readiness_item_id,item_key,item_status FROM startup_readiness_items WHERE is_active=1`).all());
      const currentByKey=new Map(currentRows.map((row)=>[text(row.item_key,120),row]));
      const statements=[]; const savedItems=[]; const keys=[];
      for(const row of incoming) {
        const key=text(row?.item_key,120); const current=currentByKey.get(key);
        if(!current) throw validationError(`Startup readiness item ${key||'(blank)'} was not found in D1.`);
        const save=normalizedSave(row,current,'save_item');
        statements.push(...writeStatements(access.db,current,save,access.adminUser.user_id));
        savedItems.push(patchItem(current,save)); keys.push(key);
      }
      await access.db.batch(statements);
      deferAudit(context,access.adminUser,{action_type:'startup_readiness_batch_synced',target_type:'startup_readiness',target_key:'browser_recovery',details:{item_count:keys.length,item_keys:keys}});
      return json({ok:true,build:BUILD,contract:CONTRACT,mode:'batch_patch',saved_items:savedItems,message:`Synchronized ${savedItems.length} browser-only readiness change${savedItems.length===1?'':'s'} to D1.`});
    }

    if(!['save_item','mark_complete','reopen_item'].includes(action)) return json({ok:false,error:'Unsupported startup readiness action.'},400);
    const itemKey=text(body.item_key,120);
    const current=await access.db.prepare(`SELECT startup_readiness_item_id,item_key,item_status FROM startup_readiness_items WHERE item_key=?1 AND is_active=1 LIMIT 1`).bind(itemKey).first();
    if(!current) return json({ok:false,error:'Startup readiness item was not found.'},404);
    const save=normalizedSave(body,current,action);
    await access.db.batch(writeStatements(access.db,current,save,access.adminUser.user_id));
    deferAudit(context,access.adminUser,{action_type:'startup_readiness_updated',target_type:'startup_readiness_item',target_id:current.startup_readiness_item_id,target_key:itemKey,details:{previous_status:current.item_status,next_status:save.nextStatus,has_evidence:!!(save.evidenceUrl||save.evidenceNotes),owner_name:save.ownerName||null,due_date:save.dueDate||null}});
    return json({ok:true,build:BUILD,contract:CONTRACT,mode:'patch',item:patchItem(current,save),message:save.nextStatus==='passed'?'Readiness item marked complete.':'Readiness item saved.'});
  } catch(error) {
    deferIncident(context,{incident_scope:'startup_readiness',incident_code:'startup_readiness_post_failed',severity:'warning',message:error?.message||'Startup readiness save failed.',related_user_id:access.adminUser.user_id,details:{action,error:String(error?.stack||error)}});
    return json({ok:false,error:error?.message||'Startup readiness save failed.'},error?.code==='VALIDATION'?400:503);
  }
}
