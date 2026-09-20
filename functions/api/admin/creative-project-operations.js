// Release 467 Build 212 — Hybrid Creative Project Operations.
// Planning-only extension of existing Creative Process projects.
// No request-time DDL. Inventory and CAIP/media remain their existing mutation authorities.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=212;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const clean=(v,n=1600)=>normalizeText(v).slice(0,n);
const positive=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const PLAN_STATES=new Set(['draft','planned','ready','blocked','retired']);
const DEP_TYPES=new Set(['finish_to_start','review_before_start','material_output','evidence_required']);
const RESOURCE_ROLES=new Set(['material','tool','consumable','fixture','other']);

async function access(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const result=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('creative_work_projects','inventory_processes','site_item_inventory','creative_project_operations','creative_project_operation_dependencies','creative_project_operation_resources')").all();
  const names=new Set(rows(result).map(x=>String(x.name||'')));
  const required=['creative_work_projects','inventory_processes','site_item_inventory','creative_project_operations','creative_project_operation_dependencies','creative_project_operation_resources'];
  const missing=required.filter(x=>!names.has(x));
  if(missing.length)return {error:json({ok:false,error:'Build 212 canonical migration is required.',code:'build212_schema_required',missing_tables:missing},503)};
  return {admin,db};
}
async function projectRow(db,projectId){
  return db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status,summary,objective,story_angle,product_id,updated_at
    FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1`).bind(projectId).first();
}
async function projectList(db){
  return rows(await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status,updated_at
    FROM creative_work_projects
    WHERE COALESCE(project_status,'active')<>'archived'
    ORDER BY datetime(updated_at) DESC,creative_work_project_id DESC LIMIT 80`).all());
}
async function snapshot(db,projectId,inventoryQuery=''){
  const projects=await projectList(db);
  const processes=rows(await db.prepare(`SELECT inventory_process_id,process_key,process_name,description,sort_order
    FROM inventory_processes WHERE is_active=1 ORDER BY sort_order,process_name`).all());
  let project=null,operations=[],dependencies=[],resources=[];
  if(projectId){
    project=await projectRow(db,projectId);
    if(project){
      operations=rows(await db.prepare(`SELECT o.creative_project_operation_id,o.creative_work_project_id,o.inventory_process_id,
        o.operation_order,o.operation_title,o.plan_status,o.responsible_workspace,o.planned_setup_notes,o.planned_duration_minutes,
        o.output_evidence_requirement,o.notes,o.created_at,o.updated_at,p.process_key,p.process_name
        FROM creative_project_operations o
        JOIN inventory_processes p ON p.inventory_process_id=o.inventory_process_id
        WHERE o.creative_work_project_id=? ORDER BY o.operation_order,o.creative_project_operation_id`).bind(projectId).all());
      dependencies=rows(await db.prepare(`SELECT d.creative_project_operation_dependency_id,d.creative_project_operation_id,
        d.predecessor_operation_id,d.dependency_type,d.dependency_notes,d.created_at
        FROM creative_project_operation_dependencies d
        JOIN creative_project_operations o ON o.creative_project_operation_id=d.creative_project_operation_id
        WHERE o.creative_work_project_id=?
        ORDER BY d.creative_project_operation_id,d.predecessor_operation_id`).bind(projectId).all());
      resources=rows(await db.prepare(`SELECT r.creative_project_operation_resource_id,r.creative_project_operation_id,
        r.site_item_inventory_id,r.resource_role,r.planned_quantity,r.planned_unit,r.requirement_notes,r.created_at,r.updated_at,
        i.item_name,i.source_type,i.external_key,i.on_hand_quantity,i.stock_unit_label,i.usage_unit_label,
        ipa.inventory_process_id AS assigned_inventory_process_id,ip.process_name AS assigned_process_name
        FROM creative_project_operation_resources r
        JOIN creative_project_operations o ON o.creative_project_operation_id=r.creative_project_operation_id
        JOIN site_item_inventory i ON i.site_item_inventory_id=r.site_item_inventory_id
        LEFT JOIN inventory_process_assignments ipa ON ipa.site_item_inventory_id=i.site_item_inventory_id
        LEFT JOIN inventory_processes ip ON ip.inventory_process_id=ipa.inventory_process_id
        WHERE o.creative_work_project_id=?
        ORDER BY r.creative_project_operation_id,r.resource_role,LOWER(i.item_name)`).bind(projectId).all());
    }
  }
  const q=clean(inventoryQuery,120).toLowerCase();
  let inventory_matches=[];
  if(q.length>=2){
    const like=`%${q.replace(/[%_]/g,'')}%`;
    inventory_matches=rows(await db.prepare(`SELECT i.site_item_inventory_id,i.item_name,i.source_type,i.external_key,i.on_hand_quantity,
      i.stock_unit_label,i.usage_unit_label,i.unit_cost_cents,
      ipa.inventory_process_id AS assigned_inventory_process_id,ip.process_name AS assigned_process_name
      FROM site_item_inventory i
      LEFT JOIN inventory_process_assignments ipa ON ipa.site_item_inventory_id=i.site_item_inventory_id
      LEFT JOIN inventory_processes ip ON ip.inventory_process_id=ipa.inventory_process_id
      WHERE COALESCE(i.is_active,1)=1
        AND (LOWER(COALESCE(i.item_name,'')) LIKE ? OR LOWER(COALESCE(i.external_key,'')) LIKE ? OR LOWER(COALESCE(i.source_type,'')) LIKE ?)
      ORDER BY CASE LOWER(COALESCE(i.source_type,'')) WHEN 'tool' THEN 0 WHEN 'supply' THEN 1 ELSE 2 END,LOWER(COALESCE(i.item_name,'')),i.site_item_inventory_id
      LIMIT 30`).bind(like,like,like).all());
  }
  return {projects,project,processes,operations,dependencies,resources,inventory_matches,inventory_query:q};
}
async function ownedOperation(db,projectId,operationId){
  return db.prepare(`SELECT * FROM creative_project_operations
    WHERE creative_project_operation_id=? AND creative_work_project_id=? LIMIT 1`).bind(operationId,projectId).first();
}
async function audit(env,request,admin,projectId,action,details={}){
  await auditAdminAction(env,request,admin,{action_type:`creative_project_operation_${action}`,target_type:'creative_work_project',
    target_id:projectId,target_key:String(projectId),details:{
      planning_only:true,inventory_mutation:false,caip_media_mutation:false,actual_event_creation:false,finance_posting:false,...details
    }});
}

export async function onRequestGet({request,env}){
  const ctx=await access(request,env);if(ctx.error)return ctx.error;
  const url=new URL(request.url);
  const projectId=positive(url.searchParams.get('project_id'));
  if(projectId && !(await projectRow(ctx.db,projectId)))return json({ok:false,error:'Creative Project not found.'},404);
  return json({ok:true,...await snapshot(ctx.db,projectId,url.searchParams.get('inventory_q')||''),
    project_authority:'creative_work_projects',process_authority:'inventory_processes',inventory_authority:'site_item_inventory',
    operation_authority:'creative_project_operations',caip_media_authority:'creative_projects / creative_assets',
    planning_only:true,actual_events_owned_by:'creative_work_events',inventory_mutation:false,caip_media_mutation:false});
}

export async function onRequestPost({request,env}){
  const ctx=await access(request,env);if(ctx.error)return ctx.error;
  let body={};try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,80).toLowerCase();
  const projectId=positive(body.creative_work_project_id||body.project_id);
  if(!projectId || !(await projectRow(ctx.db,projectId)))return json({ok:false,error:'Choose an existing Creative Process project.'},400);
  const userId=positive(ctx.admin.user_id)||null;
  let message='Operation plan saved.';

  if(action==='save_operation'){
    const operationId=positive(body.creative_project_operation_id);
    const processId=positive(body.inventory_process_id);
    const process=await ctx.db.prepare('SELECT inventory_process_id,process_key,process_name FROM inventory_processes WHERE inventory_process_id=? AND is_active=1 LIMIT 1').bind(processId).first();
    if(!process)return json({ok:false,error:'Choose an active canonical workshop process.'},400);
    const status=PLAN_STATES.has(String(body.plan_status||''))?String(body.plan_status):'planned';
    const title=clean(body.operation_title,180)||process.process_name;
    const workspace=clean(body.responsible_workspace,160)||null;
    const setup=clean(body.planned_setup_notes,1600)||null;
    const durationRaw=body.planned_duration_minutes;
    const duration=durationRaw===null||durationRaw===undefined||durationRaw===''?null:Math.max(0,Math.round(Number(durationRaw)||0));
    const evidence=clean(body.output_evidence_requirement,1200)||null;
    const notes=clean(body.notes,1600)||null;
    if(operationId){
      const existing=await ownedOperation(ctx.db,projectId,operationId);
      if(!existing)return json({ok:false,error:'Operation does not belong to this Creative Project.'},404);
      await ctx.db.prepare(`UPDATE creative_project_operations SET inventory_process_id=?,operation_title=?,plan_status=?,responsible_workspace=?,
        planned_setup_notes=?,planned_duration_minutes=?,output_evidence_requirement=?,notes=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
        WHERE creative_project_operation_id=? AND creative_work_project_id=?`)
        .bind(processId,title,status,workspace,setup,duration,evidence,notes,userId,operationId,projectId).run();
      message=`Operation ${existing.operation_order} updated.`;
    }else{
      const max=await ctx.db.prepare('SELECT COALESCE(MAX(operation_order),0) m FROM creative_project_operations WHERE creative_work_project_id=?').bind(projectId).first();
      const order=Number(max?.m||0)+1;
      await ctx.db.prepare(`INSERT INTO creative_project_operations(
        creative_work_project_id,inventory_process_id,operation_order,operation_title,plan_status,responsible_workspace,
        planned_setup_notes,planned_duration_minutes,output_evidence_requirement,notes,created_by_user_id,updated_by_user_id,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
        .bind(projectId,processId,order,title,status,workspace,setup,duration,evidence,notes,userId,userId).run();
      message=`Operation ${order} added from canonical process ${process.process_name}.`;
    }
    await audit(env,request,ctx.admin,projectId,'save',{process_key:process.process_key,plan_status:status});
  } else if(action==='save_sequence'){
    const ids=(Array.isArray(body.operation_ids)?body.operation_ids:[]).map(positive).filter(Boolean);
    const current=rows(await ctx.db.prepare('SELECT creative_project_operation_id FROM creative_project_operations WHERE creative_work_project_id=? ORDER BY operation_order').bind(projectId).all()).map(x=>Number(x.creative_project_operation_id));
    if(ids.length!==current.length || new Set(ids).size!==ids.length || current.some(id=>!ids.includes(id)))return json({ok:false,error:'Sequence must include every operation in this Creative Project exactly once.'},400);
    const statements=[];
    ids.forEach((id,index)=>statements.push(ctx.db.prepare('UPDATE creative_project_operations SET operation_order=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_project_operation_id=? AND creative_work_project_id=?').bind(10000+index+1,userId,id,projectId)));
    ids.forEach((id,index)=>statements.push(ctx.db.prepare('UPDATE creative_project_operations SET operation_order=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_project_operation_id=? AND creative_work_project_id=?').bind(index+1,userId,id,projectId)));
    await ctx.db.batch(statements);await audit(env,request,ctx.admin,projectId,'sequence',{operation_count:ids.length});message='Operation sequence saved.';
  } else if(action==='save_dependency'){
    const operationId=positive(body.creative_project_operation_id),predecessorId=positive(body.predecessor_operation_id);
    if(!operationId||!predecessorId||operationId===predecessorId)return json({ok:false,error:'Choose two different operations.'},400);
    const [operation,predecessor]=await Promise.all([ownedOperation(ctx.db,projectId,operationId),ownedOperation(ctx.db,projectId,predecessorId)]);
    if(!operation||!predecessor)return json({ok:false,error:'Both dependency operations must belong to this Creative Project.'},400);
    if(Number(predecessor.operation_order)>=Number(operation.operation_order))return json({ok:false,error:'A predecessor must appear earlier in the ordered operation plan.'},400);
    const type=DEP_TYPES.has(String(body.dependency_type||''))?String(body.dependency_type):'finish_to_start';
    await ctx.db.prepare(`INSERT INTO creative_project_operation_dependencies(
      creative_project_operation_id,predecessor_operation_id,dependency_type,dependency_notes,created_by_user_id,created_at)
      VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(creative_project_operation_id,predecessor_operation_id)
      DO UPDATE SET dependency_type=excluded.dependency_type,dependency_notes=excluded.dependency_notes`)
      .bind(operationId,predecessorId,type,clean(body.dependency_notes,800)||null,userId).run();
    await audit(env,request,ctx.admin,projectId,'dependency_save',{operation_id:operationId,predecessor_operation_id:predecessorId,dependency_type:type});message='Operation dependency saved.';
  } else if(action==='remove_dependency'){
    const dependencyId=positive(body.creative_project_operation_dependency_id);
    const dep=await ctx.db.prepare(`SELECT d.creative_project_operation_dependency_id
      FROM creative_project_operation_dependencies d JOIN creative_project_operations o ON o.creative_project_operation_id=d.creative_project_operation_id
      WHERE d.creative_project_operation_dependency_id=? AND o.creative_work_project_id=?`).bind(dependencyId,projectId).first();
    if(!dep)return json({ok:false,error:'Dependency not found for this project.'},404);
    await ctx.db.prepare('DELETE FROM creative_project_operation_dependencies WHERE creative_project_operation_dependency_id=?').bind(dependencyId).run();
    await audit(env,request,ctx.admin,projectId,'dependency_remove',{dependency_id:dependencyId});message='Operation dependency removed.';
  } else if(action==='save_resource'){
    const operationId=positive(body.creative_project_operation_id),inventoryId=positive(body.site_item_inventory_id);
    const operation=await ownedOperation(ctx.db,projectId,operationId);
    const item=await ctx.db.prepare('SELECT site_item_inventory_id,item_name,source_type FROM site_item_inventory WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1 LIMIT 1').bind(inventoryId).first();
    if(!operation||!item)return json({ok:false,error:'Choose a project operation and an active Inventory item.'},400);
    const role=RESOURCE_ROLES.has(String(body.resource_role||''))?String(body.resource_role):'other';
    const qtyRaw=body.planned_quantity,qty=qtyRaw===null||qtyRaw===undefined||qtyRaw===''?null:Math.max(0,Number(qtyRaw)||0);
    await ctx.db.prepare(`INSERT INTO creative_project_operation_resources(
      creative_project_operation_id,site_item_inventory_id,resource_role,planned_quantity,planned_unit,requirement_notes,
      created_by_user_id,updated_by_user_id,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(creative_project_operation_id,site_item_inventory_id,resource_role)
      DO UPDATE SET planned_quantity=excluded.planned_quantity,planned_unit=excluded.planned_unit,
        requirement_notes=excluded.requirement_notes,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`)
      .bind(operationId,inventoryId,role,qty,clean(body.planned_unit,80)||null,clean(body.requirement_notes,800)||null,userId,userId).run();
    await audit(env,request,ctx.admin,projectId,'resource_save',{operation_id:operationId,site_item_inventory_id:inventoryId,resource_role:role,planned_only:true});message=`Planned ${role} reference saved for ${item.item_name}.`;
  } else if(action==='remove_resource'){
    const resourceId=positive(body.creative_project_operation_resource_id);
    const resource=await ctx.db.prepare(`SELECT r.creative_project_operation_resource_id FROM creative_project_operation_resources r
      JOIN creative_project_operations o ON o.creative_project_operation_id=r.creative_project_operation_id
      WHERE r.creative_project_operation_resource_id=? AND o.creative_work_project_id=?`).bind(resourceId,projectId).first();
    if(!resource)return json({ok:false,error:'Planned resource not found for this project.'},404);
    await ctx.db.prepare('DELETE FROM creative_project_operation_resources WHERE creative_project_operation_resource_id=?').bind(resourceId).run();
    await audit(env,request,ctx.admin,projectId,'resource_remove',{resource_id:resourceId});message='Planned resource reference removed. Inventory was not changed.';
  } else if(action==='retire_operation'){
    const operationId=positive(body.creative_project_operation_id);
    const operation=await ownedOperation(ctx.db,projectId,operationId);if(!operation)return json({ok:false,error:'Operation not found.'},404);
    const dependent=await ctx.db.prepare('SELECT COUNT(*) c FROM creative_project_operation_dependencies WHERE predecessor_operation_id=?').bind(operationId).first();
    if(Number(dependent?.c||0)>0)return json({ok:false,error:'Remove downstream dependencies before retiring this operation.'},409);
    await ctx.db.prepare("UPDATE creative_project_operations SET plan_status='retired',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_project_operation_id=? AND creative_work_project_id=?").bind(userId,operationId,projectId).run();
    await audit(env,request,ctx.admin,projectId,'retire',{operation_id:operationId});message='Operation retired. Planning history and resource references remain visible.';
  } else {
    return json({ok:false,error:'Unsupported Build 212 operation action.'},400);
  }

  return json({ok:true,message,...await snapshot(ctx.db,projectId,''),
    planning_only:true,inventory_mutation:false,caip_media_mutation:false,actual_event_creation:false,finance_posting:false});
}
