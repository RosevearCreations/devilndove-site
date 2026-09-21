// Release 467 Build 222 — Project-to-Knowledge Promotion & Recipe History.
// Promotes only human-approved Creative Project lessons into versioned Workshop Knowledge.
// No AI "best settings", source mutation, Inventory movement, media copy, R2/provider/Finance/publication execution.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=222;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const clean=(v,n=3000)=>normalizeText(v).slice(0,n);
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const CONFIDENCE=new Set(['unrated','single_observation','repeated_observation','measured','owner_confirmed']);
const GENERALIZATION=new Set(['worked_once','repeated_observation','measured','owner_confirmed']);
const INV_ROLES=new Set(['material','machine_tool','fixture_workholding','consumable','finishing_supply','other']);

async function access(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const required=['workshop_knowledge_entries','workshop_knowledge_entry_processes','workshop_knowledge_entry_inventory_refs','workshop_knowledge_entry_settings','workshop_knowledge_recipe_versions','workshop_knowledge_recipe_processes','workshop_knowledge_recipe_inventory_refs','workshop_knowledge_recipe_settings','workshop_knowledge_recipe_events','creative_work_projects','creative_project_operations','creative_project_knowledge_summaries','inventory_processes','site_item_inventory'];
  const q=required.map(()=>'?').join(',');
  const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${q})`).bind(...required).all());
  const names=new Set(found.map(x=>String(x.name||''))),missing=required.filter(x=>!names.has(x));
  if(missing.length)return {error:json({ok:false,error:'Build 222 canonical migration is required.',code:'build222_schema_required',missing_tables:missing},503)};
  return {admin,db};
}
async function snapshot(db,entryId=0){
  const entries=rows(await db.prepare(`SELECT k.workshop_knowledge_entry_id,k.entry_key,k.title,k.scope_text,k.observed_result,k.confidence_status,k.review_status,k.source_creative_work_project_id,k.source_creative_project_operation_id,k.updated_at,p.project_title,
    (SELECT COUNT(*) FROM workshop_knowledge_recipe_versions v WHERE v.workshop_knowledge_entry_id=k.workshop_knowledge_entry_id) recipe_version_count,
    (SELECT MAX(version_number) FROM workshop_knowledge_recipe_versions v WHERE v.workshop_knowledge_entry_id=k.workshop_knowledge_entry_id) latest_version
    FROM workshop_knowledge_entries k LEFT JOIN creative_work_projects p ON p.creative_work_project_id=k.source_creative_work_project_id
    WHERE k.review_status<>'void' ORDER BY datetime(k.updated_at) DESC,k.workshop_knowledge_entry_id DESC LIMIT 80`).all());
  const candidates=rows(await db.prepare(`SELECT p.creative_work_project_id,p.project_key,p.project_title,p.project_status,
    s.summary_text,s.source_evidence_count,s.review_status,s.reviewed_by,s.reviewed_at,s.updated_at
    FROM creative_work_projects p JOIN creative_project_knowledge_summaries s ON s.creative_work_project_id=p.creative_work_project_id
    WHERE s.summary_type='lessons_learned' AND s.review_status='approved'
    ORDER BY datetime(s.reviewed_at) DESC,datetime(s.updated_at) DESC,p.creative_work_project_id DESC LIMIT 60`).all());
  const operations=rows(await db.prepare(`SELECT o.creative_project_operation_id,o.creative_work_project_id,o.inventory_process_id,o.operation_order,o.operation_title,o.plan_status,p.process_name
    FROM creative_project_operations o JOIN inventory_processes p ON p.inventory_process_id=o.inventory_process_id
    WHERE EXISTS(SELECT 1 FROM creative_project_knowledge_summaries s WHERE s.creative_work_project_id=o.creative_work_project_id AND s.summary_type='lessons_learned' AND s.review_status='approved')
    ORDER BY o.creative_work_project_id,o.operation_order LIMIT 160`).all());
  const processes=rows(await db.prepare(`SELECT inventory_process_id,process_key,process_name FROM inventory_processes WHERE is_active=1 ORDER BY sort_order,process_name LIMIT 100`).all());
  const inventory=rows(await db.prepare(`SELECT site_item_inventory_id,item_name,source_type,external_key,category FROM site_item_inventory WHERE COALESCE(is_active,1)=1 ORDER BY item_name LIMIT 180`).all());
  let history=[];
  if(entryId)history=rows(await db.prepare(`SELECT v.*,p.project_title,o.operation_title,
    (SELECT COUNT(*) FROM workshop_knowledge_recipe_processes x WHERE x.workshop_knowledge_recipe_version_id=v.workshop_knowledge_recipe_version_id) process_count,
    (SELECT COUNT(*) FROM workshop_knowledge_recipe_inventory_refs x WHERE x.workshop_knowledge_recipe_version_id=v.workshop_knowledge_recipe_version_id) inventory_ref_count,
    (SELECT COUNT(*) FROM workshop_knowledge_recipe_settings x WHERE x.workshop_knowledge_recipe_version_id=v.workshop_knowledge_recipe_version_id) setting_count
    FROM workshop_knowledge_recipe_versions v
    JOIN creative_work_projects p ON p.creative_work_project_id=v.source_creative_work_project_id
    LEFT JOIN creative_project_operations o ON o.creative_project_operation_id=v.source_creative_project_operation_id
    WHERE v.workshop_knowledge_entry_id=? ORDER BY v.version_number DESC`).bind(entryId).all());
  return {entries,candidates,operations,processes,inventory,history};
}
function payload(raw){
  const processIds=[...new Set((Array.isArray(raw.process_ids)?raw.process_ids:[]).map(id).filter(Boolean))].slice(0,12);
  const inventoryRefs=(Array.isArray(raw.inventory_refs)?raw.inventory_refs:[]).map(x=>({site_item_inventory_id:id(x?.site_item_inventory_id),relationship_role:INV_ROLES.has(String(x?.relationship_role||''))?String(x.relationship_role):'other',evidence_note:clean(x?.evidence_note,1000)})).filter(x=>x.site_item_inventory_id).slice(0,24);
  const settings=(Array.isArray(raw.settings)?raw.settings:[]).map(x=>({setting_name:clean(x?.setting_name,120),observed_value:clean(x?.observed_value,200),observed_unit:clean(x?.observed_unit,80),setting_context:clean(x?.setting_context,800),evidence_note:clean(x?.evidence_note,1200),observation_status:['observed','measured','owner_confirmed'].includes(String(x?.observation_status||''))?String(x.observation_status):'observed'})).filter(x=>x.setting_name&&x.observed_value).slice(0,30);
  return {
    entry_id:id(raw.entry_id),source_project_id:id(raw.source_project_id),source_operation_id:id(raw.source_operation_id)||null,
    title:clean(raw.title,200),scope_text:clean(raw.scope_text,1400),observed_result:clean(raw.observed_result,3000),
    failure_notes:clean(raw.failure_notes,2400),provenance_note:clean(raw.provenance_note,2200),
    confidence_status:CONFIDENCE.has(String(raw.confidence_status||''))?String(raw.confidence_status):'single_observation',
    generalization_status:GENERALIZATION.has(String(raw.generalization_status||''))?String(raw.generalization_status):'worked_once',
    processIds,inventoryRefs,settings
  };
}
async function validate(db,p){
  if(!p.source_project_id||!p.title||!p.scope_text||!p.observed_result||!p.provenance_note)throw Object.assign(new Error('Approved source project, title, scope, observed result and provenance are required.'),{status:400});
  const summary=await db.prepare(`SELECT summary_text,source_evidence_count,review_status,reviewed_by,reviewed_at,updated_at FROM creative_project_knowledge_summaries WHERE creative_work_project_id=? AND summary_type='lessons_learned' LIMIT 1`).bind(p.source_project_id).first();
  if(!summary||summary.review_status!=='approved'||!clean(summary.summary_text,12000))throw Object.assign(new Error('The source Creative Project must have an approved lessons-learned summary.'),{status:409});
  if(p.processIds.length+p.inventoryRefs.length===0)throw Object.assign(new Error('Promotion needs an exact known process, material or tool identity.'),{status:400});
  if(p.inventoryRefs.some(x=>!x.evidence_note))throw Object.assign(new Error('Every material/tool relationship needs a source evidence note.'),{status:400});
  if(p.settings.some(x=>!x.evidence_note))throw Object.assign(new Error('Every observed setting needs an evidence note. Untested settings must remain absent.'),{status:400});
  if(p.source_operation_id){
    const op=await db.prepare(`SELECT creative_project_operation_id,creative_work_project_id,inventory_process_id FROM creative_project_operations WHERE creative_project_operation_id=? LIMIT 1`).bind(p.source_operation_id).first();
    if(!op||Number(op.creative_work_project_id)!==p.source_project_id)throw Object.assign(new Error('Source operation does not belong to the approved source project.'),{status:400});
    if(!p.processIds.includes(Number(op.inventory_process_id)))throw Object.assign(new Error('When an exact source operation is selected, its canonical process must be included in the promoted recipe.'),{status:400});
  }
  if(p.generalization_status==='worked_once' && !['unrated','single_observation'].includes(p.confidence_status))throw Object.assign(new Error('Worked-once history cannot carry a repeated/measured/owner-confirmed confidence claim.'),{status:400});
  if(p.generalization_status==='repeated_observation' && !['repeated_observation','measured','owner_confirmed'].includes(p.confidence_status))throw Object.assign(new Error('Repeated-observation status requires matching reviewed confidence evidence.'),{status:400});
  return summary;
}
async function replaceCurrentChildren(db,entryId,p){
  const statements=[
    db.prepare('DELETE FROM workshop_knowledge_entry_processes WHERE workshop_knowledge_entry_id=?').bind(entryId),
    db.prepare('DELETE FROM workshop_knowledge_entry_inventory_refs WHERE workshop_knowledge_entry_id=?').bind(entryId),
    db.prepare('DELETE FROM workshop_knowledge_entry_settings WHERE workshop_knowledge_entry_id=?').bind(entryId)
  ];
  p.processIds.forEach(processId=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_entry_processes(workshop_knowledge_entry_id,inventory_process_id,relationship_role,evidence_note) VALUES(?,?,'primary',?)`).bind(entryId,processId,p.provenance_note)));
  p.inventoryRefs.forEach(x=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_entry_inventory_refs(workshop_knowledge_entry_id,site_item_inventory_id,relationship_role,evidence_note) VALUES(?,?,?,?)`).bind(entryId,x.site_item_inventory_id,x.relationship_role,x.evidence_note)));
  p.settings.forEach(x=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_entry_settings(workshop_knowledge_entry_id,setting_name,observed_value,observed_unit,setting_context,evidence_note,observation_status) VALUES(?,?,?,?,?,?,?)`).bind(entryId,x.setting_name,x.observed_value,x.observed_unit||null,x.setting_context||null,x.evidence_note,x.observation_status)));
  await db.batch(statements);
}
async function writeRecipeChildren(db,versionId,p){
  const statements=[];
  p.processIds.forEach(processId=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_recipe_processes(workshop_knowledge_recipe_version_id,inventory_process_id,relationship_role,evidence_note) VALUES(?,?,'primary',?)`).bind(versionId,processId,p.provenance_note)));
  p.inventoryRefs.forEach(x=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_recipe_inventory_refs(workshop_knowledge_recipe_version_id,site_item_inventory_id,relationship_role,evidence_note) VALUES(?,?,?,?)`).bind(versionId,x.site_item_inventory_id,x.relationship_role,x.evidence_note)));
  p.settings.forEach(x=>statements.push(db.prepare(`INSERT INTO workshop_knowledge_recipe_settings(workshop_knowledge_recipe_version_id,setting_name,observed_value,observed_unit,setting_context,evidence_note,observation_status) VALUES(?,?,?,?,?,?,?)`).bind(versionId,x.setting_name,x.observed_value,x.observed_unit||null,x.setting_context||null,x.evidence_note,x.observation_status)));
  if(statements.length)await db.batch(statements);
}

export async function onRequestGet({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  const entryId=id(new URL(request.url).searchParams.get('entry_id'));
  return json({ok:true,...await snapshot(a.db,entryId),policy:{approved_lessons_only:true,version_history_immutable:true,worked_once_is_not_best:true,unknown_settings_remain_unknown:true,source_authority_mutation:false,inventory_mutation:false,media_copy:false,provider_execution:false}});
}
export async function onRequestPost({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  try{
    const raw=await request.json().catch(()=>({})),action=String(raw.action||'');
    if(action!=='promote_project_knowledge')return json({ok:false,error:'Unsupported Build 222 action.'},400);
    const userId=id(a.admin?.user_id||a.admin?.id);if(!userId)return json({ok:false,error:'Admin user identity is unavailable.'},401);
    const p=payload(raw),summary=await validate(a.db,p);
    let entryId=p.entry_id,previous=null;
    if(entryId){
      const entry=await a.db.prepare('SELECT workshop_knowledge_entry_id,review_status FROM workshop_knowledge_entries WHERE workshop_knowledge_entry_id=? LIMIT 1').bind(entryId).first();
      if(!entry||entry.review_status==='void')return json({ok:false,error:'Choose an active Workshop Knowledge entry to supersede.'},404);
      previous=await a.db.prepare(`SELECT workshop_knowledge_recipe_version_id,version_number FROM workshop_knowledge_recipe_versions WHERE workshop_knowledge_entry_id=? AND recipe_state='approved' LIMIT 1`).bind(entryId).first();
      if(previous)await a.db.prepare(`UPDATE workshop_knowledge_recipe_versions SET recipe_state='superseded',superseded_at=CURRENT_TIMESTAMP WHERE workshop_knowledge_recipe_version_id=? AND recipe_state='approved'`).bind(previous.workshop_knowledge_recipe_version_id).run();
      await a.db.prepare(`UPDATE workshop_knowledge_entries SET title=?,scope_text=?,observed_result=?,confidence_status=?,source_creative_work_project_id=?,source_creative_project_operation_id=?,provenance_note=?,review_status='reviewed',reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE workshop_knowledge_entry_id=?`).bind(p.title,p.scope_text,p.observed_result,p.confidence_status,p.source_project_id,p.source_operation_id,p.provenance_note,userId,userId,entryId).run();
    }else{
      const result=await a.db.prepare(`INSERT INTO workshop_knowledge_entries(entry_key,title,scope_text,observed_result,confidence_status,review_status,source_creative_work_project_id,source_creative_project_operation_id,provenance_note,reviewed_by_user_id,reviewed_at,created_by_user_id,updated_by_user_id) VALUES(?,?,?,?,?,'reviewed',?,?,?,?,CURRENT_TIMESTAMP,?,?)`).bind('wk-'+crypto.randomUUID(),p.title,p.scope_text,p.observed_result,p.confidence_status,p.source_project_id,p.source_operation_id,p.provenance_note,userId,userId,userId).run();
      entryId=id(result?.meta?.last_row_id);if(!entryId)throw Object.assign(new Error('Knowledge entry could not be created.'),{status:500});
    }
    const versionNo=Number((await a.db.prepare('SELECT COALESCE(MAX(version_number),0) m FROM workshop_knowledge_recipe_versions WHERE workshop_knowledge_entry_id=?').bind(entryId).first())?.m||0)+1;
    const created=await a.db.prepare(`INSERT INTO workshop_knowledge_recipe_versions(workshop_knowledge_entry_id,version_number,recipe_state,source_creative_work_project_id,source_creative_project_operation_id,source_knowledge_summary_type,source_summary_text,source_summary_reviewed_at,source_summary_reviewed_by_user_id,observed_result,failure_notes,confidence_status,generalization_status,provenance_note,supersedes_recipe_version_id,approved_by_user_id,approved_at) VALUES(?,?,'approved',?,?,'lessons_learned',?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(entryId,versionNo,p.source_project_id,p.source_operation_id,clean(summary.summary_text,12000),summary.reviewed_at||summary.updated_at||null,id(summary.reviewed_by)||null,p.observed_result,p.failure_notes||null,p.confidence_status,p.generalization_status,p.provenance_note,previous?.workshop_knowledge_recipe_version_id||null,userId).run();
    const versionId=id(created?.meta?.last_row_id);if(!versionId)throw Object.assign(new Error('Recipe version could not be created.'),{status:500});
    await replaceCurrentChildren(a.db,entryId,p);await writeRecipeChildren(a.db,versionId,p);
    const events=[a.db.prepare(`INSERT INTO workshop_knowledge_recipe_events(workshop_knowledge_entry_id,workshop_knowledge_recipe_version_id,event_type,event_note,actor_user_id) VALUES(?,?,'promoted',?,?)`).bind(entryId,versionId,`Version ${versionNo} promoted from approved Creative Project lessons. “Worked once” is not treated as universally safe or best.`,userId)];
    if(previous)events.unshift(a.db.prepare(`INSERT INTO workshop_knowledge_recipe_events(workshop_knowledge_entry_id,workshop_knowledge_recipe_version_id,event_type,event_note,actor_user_id) VALUES(?,?,'superseded',?,?)`).bind(entryId,previous.workshop_knowledge_recipe_version_id,`Superseded by version ${versionNo}; historical settings, failures and provenance are retained.`,userId));
    await a.db.batch(events);
    await auditAdminAction(env,request,a.admin,{action_type:'workshop_knowledge_project_promotion',target_type:'workshop_knowledge_entry',target_id:entryId,details:{build:BUILD,recipe_version_id:versionId,version_number:versionNo,source_project_id:p.source_project_id,source_operation_id:p.source_operation_id,generalization_status:p.generalization_status,process_count:p.processIds.length,inventory_ref_count:p.inventoryRefs.length,setting_count:p.settings.length,worked_once_is_not_best:true,source_authority_mutation:false,inventory_mutation:false,media_copy:false}}).catch(()=>null);
    return json({ok:true,message:previous?`Recipe version ${versionNo} approved; prior version preserved as superseded.`:`Recipe version ${versionNo} promoted from approved Creative Project lessons.`,entry_id:entryId,recipe_version_id:versionId,...await snapshot(a.db,entryId)});
  }catch(error){return json({ok:false,error:String(error?.message||error)},Number(error?.status||500));}
}
