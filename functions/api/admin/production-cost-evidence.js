// Release 467 Build 217 — Production Cost Evidence v2.
// Creative Project source evidence only. Inventory owns material usage/cost; Finance/Accounting owns profitability/posting.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const rows=r=>Array.isArray(r?.results)?r.results:[];
const id=v=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const text=(v,max=1600)=>normalizeText(v||'').slice(0,max);
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const COST_FIELDS=['consumables_cost_cents','packaging_cost_cents','prototype_waste_cost_cents','rework_cost_cents','finishing_cost_cents','outside_service_cost_cents'];
const MINUTE_FIELDS=['design_setup_minutes','machine_minutes','hands_on_labour_minutes','rework_minutes'];

function optionalNumber(value,{integer=false}={}){
  if(value===null||value===undefined||value==='')return null;
  const n=Number(value);
  if(!Number.isFinite(n)||n<0)throw new Error('Evidence numbers must be zero or greater when supplied.');
  return integer?Math.round(n):n;
}
async function tableExists(db,name){
  return Boolean(await db.prepare("SELECT 1 ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null));
}
function summarizeEvidence(evidence){
  const active=evidence.filter(r=>String(r.evidence_status||'active')==='active');
  const totals={design_setup_minutes:0,machine_minutes:0,hands_on_labour_minutes:0,rework_minutes:0,failed_prototype_count:0,quantity_produced:0,quantity_accepted:0};
  let knownCostComponents=0,knownDirectCost=0,hasProduced=false,hasAccepted=false;
  for(const row of active){
    for(const key of MINUTE_FIELDS)if(row[key]!==null&&row[key]!==undefined)totals[key]+=Number(row[key]||0);
    if(row.failed_prototype_count!==null&&row.failed_prototype_count!==undefined)totals.failed_prototype_count+=Number(row.failed_prototype_count||0);
    if(row.quantity_produced!==null&&row.quantity_produced!==undefined){totals.quantity_produced+=Number(row.quantity_produced||0);hasProduced=true;}
    if(row.quantity_accepted!==null&&row.quantity_accepted!==undefined){totals.quantity_accepted+=Number(row.quantity_accepted||0);hasAccepted=true;}
    for(const key of COST_FIELDS)if(row[key]!==null&&row[key]!==undefined){knownCostComponents++;knownDirectCost+=Number(row[key]||0);}
  }
  const states=new Set(active.map(r=>String(r.cost_evidence_state||'unknown')));
  const evidenceState=!active.length?'unknown':states.size===1&&states.has('reviewed')?'reviewed':knownCostComponents?'partial':'unknown';
  return {...totals,quantity_produced:hasProduced?totals.quantity_produced:null,quantity_accepted:hasAccepted?totals.quantity_accepted:null,
    active_evidence_rows:active.length,known_cost_component_count:knownCostComponents,
    known_direct_cost_cents:knownCostComponents?Math.round(knownDirectCost):null,cost_evidence_state:evidenceState,
    unknown_cost_is_zero:false};
}

async function loadSnapshot(db,projectId=0){
  const schemaReady=await tableExists(db,'creative_project_production_cost_evidence');
  const projects=rows(await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status,updated_at
    FROM creative_work_projects ORDER BY datetime(updated_at) DESC,creative_work_project_id DESC LIMIT 160`).all().catch(()=>({results:[]})));
  if(!projectId)return {schema_ready:schemaReady,projects,project:null,operations:[],evidence:[],inventory_material_usage:[],creative_material_events:[],summary:summarizeEvidence([])};
  const project=await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status,actual_cost_cents,sales_revenue_cents,updated_at
    FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1`).bind(projectId).first();
  if(!project)throw Object.assign(new Error('Creative Project was not found.'),{status:404});

  const operations=await tableExists(db,'creative_project_operations')?rows(await db.prepare(`SELECT o.creative_project_operation_id,o.operation_order,o.operation_title,o.plan_status,o.responsible_workspace,
    p.process_key,p.process_name FROM creative_project_operations o LEFT JOIN inventory_processes p ON p.inventory_process_id=o.inventory_process_id
    WHERE o.creative_work_project_id=? ORDER BY o.operation_order,o.creative_project_operation_id`).bind(projectId).all()):[];

  const evidence=schemaReady?rows(await db.prepare(`SELECT * FROM creative_project_production_cost_evidence
    WHERE creative_work_project_id=? ORDER BY datetime(recorded_at) DESC,creative_project_production_cost_evidence_id DESC LIMIT 240`).bind(projectId).all()):[];

  const inventoryReady=(await tableExists(db,'creative_project_inventory_posts'))&&(await tableExists(db,'site_item_inventory'));
  const inventoryMaterialUsage=inventoryReady?rows(await db.prepare(`SELECT ip.creative_project_inventory_post_id,ip.creative_work_event_id,ip.site_item_inventory_id,
    ip.stock_quantity_consumed,ip.posting_status,sii.item_name,sii.stock_unit_label,sii.usage_unit_label,sii.unit_cost_cents,
    COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed) usage_quantity_consumed,
    COALESCE(iud.usage_unit_label,sii.usage_unit_label,sii.stock_unit_label) posted_usage_unit_label,
    CASE WHEN COALESCE(sii.unit_cost_cents,0)>0 THEN ROUND(sii.unit_cost_cents*ip.stock_quantity_consumed) ELSE NULL END allocated_cost_cents
    FROM creative_project_inventory_posts ip JOIN site_item_inventory sii ON sii.site_item_inventory_id=ip.site_item_inventory_id
    LEFT JOIN creative_project_inventory_usage_details iud ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
    WHERE ip.creative_work_project_id=? AND COALESCE(ip.posting_status,'posted')<>'reversed'
    ORDER BY ip.creative_project_inventory_post_id DESC LIMIT 160`).bind(projectId).all().catch(()=>({results:[]}))):[];

  const creativeMaterialEvents=await tableExists(db,'creative_work_events')?rows(await db.prepare(`SELECT creative_work_event_id,event_title,material_name,material_quantity,material_unit,
    CASE WHEN COALESCE(material_cost_cents,0)>0 THEN material_cost_cents ELSE NULL END material_cost_cents,occurred_at
    FROM creative_work_events WHERE creative_work_project_id=? AND COALESCE(entry_status,'active')='active'
      AND (TRIM(COALESCE(material_name,''))<>'' OR material_quantity IS NOT NULL OR COALESCE(material_cost_cents,0)>0)
    ORDER BY datetime(occurred_at) DESC,creative_work_event_id DESC LIMIT 160`).bind(projectId).all().catch(()=>({results:[]}))):[];

  const summary=summarizeEvidence(evidence);
  const inventoryKnown=inventoryMaterialUsage.filter(r=>r.allocated_cost_cents!==null&&r.allocated_cost_cents!==undefined);
  const materialKnown=creativeMaterialEvents.filter(r=>r.material_cost_cents!==null&&r.material_cost_cents!==undefined);
  summary.inventory_post_count=inventoryMaterialUsage.length;
  summary.inventory_known_cost_cents=inventoryKnown.length?Math.round(inventoryKnown.reduce((a,r)=>a+Number(r.allocated_cost_cents||0),0)):null;
  summary.creative_material_event_count=creativeMaterialEvents.length;
  summary.creative_material_cost_cents=materialKnown.length?Math.round(materialKnown.reduce((a,r)=>a+Number(r.material_cost_cents||0),0)):null;
  return {schema_ready:schemaReady,projects,project,operations,evidence,inventory_material_usage:inventoryMaterialUsage,creative_material_events:creativeMaterialEvents,summary};
}

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  try{
    const projectId=id(new URL(context.request.url).searchParams.get('project_id'));
    const data=await loadSnapshot(db,projectId);
    return json({ok:true,release:467,build:217,authority:'creative_project_production_cost_evidence',...data,
      finance_handoff:{route:'/admin/project-profitability-reconciliation/',mode:'read_only_source_evidence',accounting_owner:true},
      boundaries:{inventory_material_usage_owner:'Inventory',profitability_owner:'Finance/Accounting',accounting_posting:false,inventory_mutation:false,
        automatic_cost_rollup:false,unknown_cost_is_zero:false,request_time_schema_mutation:false,provider_execution:false,production_start:false}});
  }catch(error){return json({ok:false,error:String(error?.message||error)},Number(error?.status||500));}
}

export async function onRequestPost(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  if(!(await tableExists(db,'creative_project_production_cost_evidence')))return json({ok:false,error:'Build 217 schema is not ready.'},503);
  try{
    const body=await context.request.json().catch(()=>({})),action=text(body.action,80),projectId=id(body.project_id||body.creative_work_project_id);
    if(!projectId)throw new Error('Choose a Creative Project.');
    const project=await db.prepare('SELECT creative_work_project_id FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1').bind(projectId).first();
    if(!project)throw Object.assign(new Error('Creative Project was not found.'),{status:404});

    if(action==='record_evidence'){
      const operationId=id(body.creative_project_operation_id)||null;
      if(operationId){
        const op=await db.prepare('SELECT creative_project_operation_id FROM creative_project_operations WHERE creative_project_operation_id=? AND creative_work_project_id=? LIMIT 1').bind(operationId,projectId).first();
        if(!op)throw new Error('The selected operation does not belong to this Creative Project.');
      }
      const state=String(body.cost_evidence_state||'unknown').toLowerCase();
      if(!['unknown','partial','reviewed'].includes(state))throw new Error('Choose unknown, partial or reviewed cost evidence state.');
      const values={
        design_setup_minutes:optionalNumber(body.design_setup_minutes,{integer:true}),machine_minutes:optionalNumber(body.machine_minutes,{integer:true}),
        hands_on_labour_minutes:optionalNumber(body.hands_on_labour_minutes,{integer:true}),rework_minutes:optionalNumber(body.rework_minutes,{integer:true}),
        consumables_cost_cents:optionalNumber(body.consumables_cost_cents,{integer:true}),packaging_cost_cents:optionalNumber(body.packaging_cost_cents,{integer:true}),
        prototype_waste_cost_cents:optionalNumber(body.prototype_waste_cost_cents,{integer:true}),rework_cost_cents:optionalNumber(body.rework_cost_cents,{integer:true}),
        finishing_cost_cents:optionalNumber(body.finishing_cost_cents,{integer:true}),outside_service_cost_cents:optionalNumber(body.outside_service_cost_cents,{integer:true}),
        failed_prototype_count:optionalNumber(body.failed_prototype_count,{integer:true}),quantity_produced:optionalNumber(body.quantity_produced),
        quantity_accepted:optionalNumber(body.quantity_accepted)
      };
      if(values.quantity_produced!==null&&values.quantity_accepted!==null&&values.quantity_accepted>values.quantity_produced)throw new Error('Accepted quantity cannot exceed produced quantity.');
      const notes=text(body.notes,2000);
      if(!notes&&!Object.values(values).some(v=>v!==null))throw new Error('Record at least one time, cost, quantity, failure count or note.');
      const created=await db.prepare(`INSERT INTO creative_project_production_cost_evidence(
        creative_work_project_id,creative_project_operation_id,cost_evidence_state,design_setup_minutes,machine_minutes,hands_on_labour_minutes,rework_minutes,
        consumables_cost_cents,packaging_cost_cents,prototype_waste_cost_cents,rework_cost_cents,finishing_cost_cents,outside_service_cost_cents,
        failed_prototype_count,quantity_produced,quantity_accepted,notes,recorded_by_user_id)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING creative_project_production_cost_evidence_id`).bind(
        projectId,operationId,state,values.design_setup_minutes,values.machine_minutes,values.hands_on_labour_minutes,values.rework_minutes,
        values.consumables_cost_cents,values.packaging_cost_cents,values.prototype_waste_cost_cents,values.rework_cost_cents,values.finishing_cost_cents,
        values.outside_service_cost_cents,values.failed_prototype_count,values.quantity_produced,values.quantity_accepted,notes||null,adminUser.user_id
      ).first();
      await auditAdminAction(db,adminUser,'creative_project.production_cost_evidence.record',{creative_work_project_id:projectId,evidence_id:id(created?.creative_project_production_cost_evidence_id),cost_evidence_state:state});
      return json({ok:true,message:'Production cost source evidence recorded. Finance/Accounting remains the profitability owner.',...(await loadSnapshot(db,projectId))});
    }

    if(action==='void_evidence'){
      const evidenceId=id(body.evidence_id||body.creative_project_production_cost_evidence_id),reason=text(body.void_reason,800);
      if(!evidenceId||!reason)throw new Error('Choose an evidence row and give a void reason.');
      const changed=await db.prepare(`UPDATE creative_project_production_cost_evidence SET evidence_status='void',void_reason=?,voided_by_user_id=?,voided_at=CURRENT_TIMESTAMP
        WHERE creative_project_production_cost_evidence_id=? AND creative_work_project_id=? AND evidence_status='active'`).bind(reason,adminUser.user_id,evidenceId,projectId).run();
      if(Number(changed?.meta?.changes||0)!==1)throw Object.assign(new Error('Active evidence row was not found.'),{status:404});
      await auditAdminAction(db,adminUser,'creative_project.production_cost_evidence.void',{creative_work_project_id:projectId,evidence_id:evidenceId,reason});
      return json({ok:true,message:'Evidence row voided; history was retained.',...(await loadSnapshot(db,projectId))});
    }
    throw new Error('Unsupported Build 217 action.');
  }catch(error){return json({ok:false,error:String(error?.message||error)},Number(error?.status||400));}
}
