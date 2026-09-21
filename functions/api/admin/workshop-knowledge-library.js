// Release 467 Build 221 — Workshop Knowledge Library Foundation.
// Reviewed, source-backed knowledge only. No AI-generated "best settings", source-authority mutation, media copy, R2 mutation or provider execution.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=221;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const clean=(v,n=2400)=>normalizeText(v).slice(0,n);
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const CONFIDENCE=new Set(['unrated','single_observation','repeated_observation','measured','owner_confirmed']);
const INV_ROLES=new Set(['material','machine_tool','fixture_workholding','consumable','finishing_supply','other']);
const EVIDENCE_KINDS=new Set(['creative_project','creative_operation','production_run','creative_asset','media_asset','external_reference','note']);
const APPROVAL=new Set(['internal_source','reviewed','approved']);

async function access(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const required=['workshop_knowledge_entries','workshop_knowledge_entry_processes','workshop_knowledge_entry_inventory_refs','workshop_knowledge_entry_settings','workshop_knowledge_entry_evidence_refs','workshop_knowledge_entry_events','inventory_processes','site_item_inventory','creative_work_projects'];
  const q=required.map(()=>'?').join(',');
  const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${q})`).bind(...required).all());
  const names=new Set(found.map(x=>String(x.name||'')));
  const missing=required.filter(x=>!names.has(x));
  if(missing.length)return {error:json({ok:false,error:'Build 221 canonical migration is required.',code:'build221_schema_required',missing_tables:missing},503)};
  return {admin,db};
}
async function listSnapshot(db){
  const entries=rows(await db.prepare(`SELECT k.workshop_knowledge_entry_id,k.entry_key,k.title,k.scope_text,k.observed_result,
      k.safety_constraint_notes,k.confidence_status,k.review_status,k.source_creative_work_project_id,
      k.source_creative_project_operation_id,k.provenance_note,k.reviewed_at,k.void_reason,k.updated_at,
      p.project_title,
      (SELECT COUNT(*) FROM workshop_knowledge_entry_processes x WHERE x.workshop_knowledge_entry_id=k.workshop_knowledge_entry_id) AS process_count,
      (SELECT COUNT(*) FROM workshop_knowledge_entry_inventory_refs x WHERE x.workshop_knowledge_entry_id=k.workshop_knowledge_entry_id) AS inventory_ref_count,
      (SELECT COUNT(*) FROM workshop_knowledge_entry_settings x WHERE x.workshop_knowledge_entry_id=k.workshop_knowledge_entry_id) AS setting_count,
      (SELECT COUNT(*) FROM workshop_knowledge_entry_evidence_refs x WHERE x.workshop_knowledge_entry_id=k.workshop_knowledge_entry_id) AS evidence_count
    FROM workshop_knowledge_entries k
    LEFT JOIN creative_work_projects p ON p.creative_work_project_id=k.source_creative_work_project_id
    ORDER BY datetime(k.updated_at) DESC,k.workshop_knowledge_entry_id DESC LIMIT 80`).all());
  const processes=rows(await db.prepare(`SELECT inventory_process_id,process_key,process_name,description FROM inventory_processes
    WHERE is_active=1 ORDER BY sort_order,process_name LIMIT 80`).all());
  const inventory=rows(await db.prepare(`SELECT site_item_inventory_id,item_name,source_type,external_key,category
    FROM site_item_inventory WHERE COALESCE(is_active,1)=1 ORDER BY item_name LIMIT 160`).all());
  const projects=rows(await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_status
    FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived'
    ORDER BY datetime(updated_at) DESC,creative_work_project_id DESC LIMIT 80`).all());
  return {entries,processes,inventory,projects};
}
async function detail(db,entryId){
  const entry=await db.prepare('SELECT * FROM workshop_knowledge_entries WHERE workshop_knowledge_entry_id=? LIMIT 1').bind(entryId).first();
  if(!entry)return null;
  const [processes,inventoryRefs,settings,evidenceRefs,events]=await Promise.all([
    db.prepare(`SELECT x.*,p.process_key,p.process_name FROM workshop_knowledge_entry_processes x JOIN inventory_processes p ON p.inventory_process_id=x.inventory_process_id WHERE x.workshop_knowledge_entry_id=? ORDER BY x.workshop_knowledge_entry_process_id`).bind(entryId).all(),
    db.prepare(`SELECT x.*,i.item_name,i.source_type,i.external_key FROM workshop_knowledge_entry_inventory_refs x JOIN site_item_inventory i ON i.site_item_inventory_id=x.site_item_inventory_id WHERE x.workshop_knowledge_entry_id=? ORDER BY x.workshop_knowledge_entry_inventory_ref_id`).bind(entryId).all(),
    db.prepare('SELECT * FROM workshop_knowledge_entry_settings WHERE workshop_knowledge_entry_id=? ORDER BY workshop_knowledge_entry_setting_id').bind(entryId).all(),
    db.prepare('SELECT * FROM workshop_knowledge_entry_evidence_refs WHERE workshop_knowledge_entry_id=? ORDER BY workshop_knowledge_entry_evidence_ref_id').bind(entryId).all(),
    db.prepare('SELECT * FROM workshop_knowledge_entry_events WHERE workshop_knowledge_entry_id=? ORDER BY workshop_knowledge_entry_event_id DESC LIMIT 40').bind(entryId).all()
  ]);
  return {entry,processes:rows(processes),inventory_refs:rows(inventoryRefs),settings:rows(settings),evidence_refs:rows(evidenceRefs),events:rows(events)};
}
function payload(raw){
  const processIds=[...new Set((Array.isArray(raw.process_ids)?raw.process_ids:[]).map(id).filter(Boolean))].slice(0,12);
  const inventoryRefs=(Array.isArray(raw.inventory_refs)?raw.inventory_refs:[]).map(x=>({site_item_inventory_id:id(x?.site_item_inventory_id),relationship_role:INV_ROLES.has(String(x?.relationship_role||''))?String(x.relationship_role):'other',evidence_note:clean(x?.evidence_note,800)})).filter(x=>x.site_item_inventory_id).slice(0,20);
  const settings=(Array.isArray(raw.settings)?raw.settings:[]).map(x=>({setting_name:clean(x?.setting_name,120),observed_value:clean(x?.observed_value,200),observed_unit:clean(x?.observed_unit,80),setting_context:clean(x?.setting_context,800),evidence_note:clean(x?.evidence_note,1000),observation_status:['observed','measured','owner_confirmed'].includes(String(x?.observation_status||''))?String(x.observation_status):'observed'})).filter(x=>x.setting_name&&x.observed_value).slice(0,30);
  const evidenceRefs=(Array.isArray(raw.evidence_refs)?raw.evidence_refs:[]).map(x=>({reference_kind:EVIDENCE_KINDS.has(String(x?.reference_kind||''))?String(x.reference_kind):'note',reference_id:id(x?.reference_id)||null,reference_label:clean(x?.reference_label,240),approval_state:APPROVAL.has(String(x?.approval_state||''))?String(x.approval_state):'internal_source',source_note:clean(x?.source_note,1200)})).filter(x=>x.reference_label&&x.source_note).slice(0,30);
  return {entry_id:id(raw.entry_id),title:clean(raw.title,200),scope_text:clean(raw.scope_text,1200),observed_result:clean(raw.observed_result,2400),safety_constraint_notes:clean(raw.safety_constraint_notes,1800),safety_evidence_note:clean(raw.safety_evidence_note,1200),confidence_status:CONFIDENCE.has(String(raw.confidence_status||''))?String(raw.confidence_status):'unrated',source_project_id:id(raw.source_project_id)||null,source_operation_id:id(raw.source_operation_id)||null,provenance_note:clean(raw.provenance_note,1800),processIds,inventoryRefs,settings,evidenceRefs};
}
async function validate(db,p,reviewing){
  if(!p.title||!p.scope_text||!p.observed_result||!p.provenance_note)throw Object.assign(new Error('Title, scope, observed result and provenance are required.'),{status:400});
  if(p.safety_constraint_notes&&!p.safety_evidence_note)throw Object.assign(new Error('Safety/constraint notes require an evidence note.'),{status:400});
  if(p.settings.some(x=>!x.evidence_note))throw Object.assign(new Error('Every observed setting requires an evidence note.'),{status:400});
  if(p.evidenceRefs.some(x=>(x.reference_kind==='creative_asset'||x.reference_kind==='media_asset')&&x.approval_state!=='approved'))throw Object.assign(new Error('Media references must already be approved; raw/private media is never copied into the Knowledge Library.'),{status:400});
  if(reviewing && p.processIds.length+p.inventoryRefs.length===0)throw Object.assign(new Error('Reviewed knowledge needs at least one structured process/material/tool relationship.'),{status:400});
  if(reviewing && p.evidenceRefs.length===0)throw Object.assign(new Error('Reviewed knowledge needs at least one source evidence reference.'),{status:400});
  if(p.source_project_id){
    const project=await db.prepare('SELECT creative_work_project_id FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1').bind(p.source_project_id).first();
    if(!project)throw Object.assign(new Error('Source Creative Project was not found.'),{status:400});
  }
  if(p.source_operation_id){
    const op=await db.prepare('SELECT creative_project_operation_id,creative_work_project_id FROM creative_project_operations WHERE creative_project_operation_id=? LIMIT 1').bind(p.source_operation_id).first().catch(()=>null);
    if(!op||(p.source_project_id&&Number(op.creative_work_project_id)!==p.source_project_id))throw Object.assign(new Error('Source operation is not valid for the selected Creative Project.'),{status:400});
  }
}
async function writeChildren(db,entryId,p){
  const statements=[
    db.prepare('DELETE FROM workshop_knowledge_entry_processes WHERE workshop_knowledge_entry_id=?').bind(entryId),
    db.prepare('DELETE FROM workshop_knowledge_entry_inventory_refs WHERE workshop_knowledge_entry_id=?').bind(entryId),
    db.prepare('DELETE FROM workshop_knowledge_entry_settings WHERE workshop_knowledge_entry_id=?').bind(entryId),
    db.prepare('DELETE FROM workshop_knowledge_entry_evidence_refs WHERE workshop_knowledge_entry_id=?').bind(entryId)
  ];
  p.processIds.forEach(processId=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_entry_processes(workshop_knowledge_entry_id,inventory_process_id,relationship_role,evidence_note) VALUES(?,?,'primary',?)`).bind(entryId,processId,p.provenance_note)));
  p.inventoryRefs.forEach(x=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_entry_inventory_refs(workshop_knowledge_entry_id,site_item_inventory_id,relationship_role,evidence_note) VALUES(?,?,?,?)`).bind(entryId,x.site_item_inventory_id,x.relationship_role,x.evidence_note||p.provenance_note)));
  p.settings.forEach(x=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_entry_settings(workshop_knowledge_entry_id,setting_name,observed_value,observed_unit,setting_context,evidence_note,observation_status) VALUES(?,?,?,?,?,?,?)`).bind(entryId,x.setting_name,x.observed_value,x.observed_unit||null,x.setting_context||null,x.evidence_note,x.observation_status)));
  p.evidenceRefs.forEach(x=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_entry_evidence_refs(workshop_knowledge_entry_id,reference_kind,reference_id,reference_label,approval_state,copy_mode,source_note) VALUES(?,?,?,?,?,'reference_only',?)`).bind(entryId,x.reference_kind,x.reference_id,x.reference_label,x.approval_state,x.source_note)));
  await db.batch(statements);
}
export async function onRequestGet({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  const url=new URL(request.url),entryId=id(url.searchParams.get('entry_id'));
  const snapshot=await listSnapshot(a.db);
  return json({ok:true,...snapshot,detail:entryId?await detail(a.db,entryId):null,policy:{reviewed_source_backed_only:true,ai_generated_best_settings:false,unknown_settings_remain_unknown:true,media_copy:false,r2_mutation:false,provider_execution:false}});
}
export async function onRequestPost({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  try{
    const raw=await request.json().catch(()=>({})),action=String(raw.action||'save_draft');
    if(!['save_draft','review_entry','void_entry'].includes(action))return json({ok:false,error:'Unsupported Build 221 action.'},400);
    const userId=id(a.admin?.user_id||a.admin?.id);
    if(!userId)return json({ok:false,error:'Admin user identity is unavailable.'},401);
    if(action==='void_entry'){
      const entryId=id(raw.entry_id),reason=clean(raw.void_reason,1200);
      if(!entryId||!reason)return json({ok:false,error:'Entry and void reason are required.'},400);
      const existing=await a.db.prepare('SELECT review_status FROM workshop_knowledge_entries WHERE workshop_knowledge_entry_id=? LIMIT 1').bind(entryId).first();
      if(!existing)return json({ok:false,error:'Knowledge entry not found.'},404);
      await a.db.batch([
        a.db.prepare(`UPDATE workshop_knowledge_entries SET review_status='void',void_reason=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE workshop_knowledge_entry_id=?`).bind(reason,userId,entryId),
        a.db.prepare(`INSERT INTO workshop_knowledge_entry_events(workshop_knowledge_entry_id,event_type,event_note,actor_user_id) VALUES(?,'voided',?,?)`).bind(entryId,reason,userId)
      ]);
      await auditAdminAction(env,request,a.admin,{action_type:'workshop_knowledge_void',target_type:'workshop_knowledge_entry',target_id:entryId,details:{build:BUILD,reason}}).catch(()=>null);
      return json({ok:true,message:'Knowledge entry voided; source authorities were not changed.',detail:await detail(a.db,entryId)});
    }
    const p=payload(raw),reviewing=action==='review_entry';await validate(a.db,p,reviewing);
    let entryId=p.entry_id;
    if(entryId){
      const existing=await a.db.prepare('SELECT review_status FROM workshop_knowledge_entries WHERE workshop_knowledge_entry_id=? LIMIT 1').bind(entryId).first();
      if(!existing)return json({ok:false,error:'Knowledge entry not found.'},404);
      if(existing.review_status!=='draft')return json({ok:false,error:'Reviewed/void knowledge is immutable here. Record correction history in the successor workflow instead of overwriting it.'},409);
      await a.db.prepare(`UPDATE workshop_knowledge_entries SET title=?,scope_text=?,observed_result=?,safety_constraint_notes=?,safety_evidence_note=?,confidence_status=?,source_creative_work_project_id=?,source_creative_project_operation_id=?,provenance_note=?,review_status=?,reviewed_by_user_id=?,reviewed_at=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE workshop_knowledge_entry_id=?`).bind(p.title,p.scope_text,p.observed_result,p.safety_constraint_notes||null,p.safety_evidence_note||null,p.confidence_status,p.source_project_id,p.source_operation_id,p.provenance_note,reviewing?'reviewed':'draft',reviewing?userId:null,reviewing?new Date().toISOString():null,userId,entryId).run();
    }else{
      const key='wk-'+crypto.randomUUID();
      const result=await a.db.prepare(`INSERT INTO workshop_knowledge_entries(entry_key,title,scope_text,observed_result,safety_constraint_notes,safety_evidence_note,confidence_status,review_status,source_creative_work_project_id,source_creative_project_operation_id,provenance_note,reviewed_by_user_id,reviewed_at,created_by_user_id,updated_by_user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(key,p.title,p.scope_text,p.observed_result,p.safety_constraint_notes||null,p.safety_evidence_note||null,p.confidence_status,reviewing?'reviewed':'draft',p.source_project_id,p.source_operation_id,p.provenance_note,reviewing?userId:null,reviewing?new Date().toISOString():null,userId,userId).run();
      entryId=id(result?.meta?.last_row_id);
      if(!entryId)throw Object.assign(new Error('Knowledge entry could not be created.'),{status:500});
    }
    await writeChildren(a.db,entryId,p);
    await a.db.prepare(`INSERT INTO workshop_knowledge_entry_events(workshop_knowledge_entry_id,event_type,event_note,actor_user_id) VALUES(?,?,?,?)`).bind(entryId,reviewing?'reviewed':'draft_saved',reviewing?'Human review completed; observed evidence retained.':'Draft saved for review.',userId).run();
    await auditAdminAction(env,request,a.admin,{action_type:reviewing?'workshop_knowledge_review':'workshop_knowledge_draft',target_type:'workshop_knowledge_entry',target_id:entryId,details:{build:BUILD,source_project_id:p.source_project_id,process_count:p.processIds.length,inventory_ref_count:p.inventoryRefs.length,setting_count:p.settings.length,evidence_count:p.evidenceRefs.length,ai_generated_best_settings:false,media_copy:false}}).catch(()=>null);
    return json({ok:true,message:reviewing?'Knowledge entry reviewed. No “best setting” claim was generated.':'Knowledge draft saved.',entry_id:entryId,detail:await detail(a.db,entryId)});
  }catch(error){return json({ok:false,error:String(error?.message||error)},Number(error?.status||500));}
}
