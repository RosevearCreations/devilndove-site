// Release 467 Build 220 — Production Run, QA, Rework & Scrap Evidence.
// Records reviewed run evidence only. Inventory, order and Finance/Accounting authorities remain owners.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=220;
const RUN_STAGES=new Set(['production_run','qa_rework','completed']);
const RUN_OUTCOMES=new Set(['not_run','pass','rework','fail']);
const QA_STATUSES=new Set(['pass','rework','fail','not_applicable']);
const HANDOFF_KINDS=new Set(['pending','inventory','custom_order_draft','order','other']);
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const qty=(v)=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:NaN;};
const clean=(v,n=1800)=>normalizeText(v||'').slice(0,n);
const json=(value,status=200)=>jsonResponse({release:467,build:BUILD,...value},status,{'Cache-Control':'no-store'});

async function tableExists(db,name){
  return Boolean(await db.prepare("SELECT 1 ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null));
}
async function access(context){
  const admin=await getAdminUserFromRequest(context.request,context.env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(context.env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const required=['creative_work_projects','creative_project_manufacturing_lifecycles','creative_project_operations','creative_project_job_travelers','creative_project_inventory_posts','site_item_inventory','creative_project_production_runs','creative_project_production_run_operations','creative_project_production_run_qa_checks','creative_project_production_run_material_evidence','creative_project_production_run_handoffs','creative_project_production_run_events'];
  const missing=[];
  for(const name of required)if(!(await tableExists(db,name)))missing.push(name);
  if(missing.length)return {error:json({ok:false,error:'Build 220 canonical migration or predecessor authority is required.',code:'build220_schema_required',missing_tables:missing},503)};
  return {admin,db};
}
async function lifecycleChoices(db){
  return rows(await db.prepare(`
    SELECT l.creative_project_manufacturing_lifecycle_id,l.current_stage,l.creative_work_project_id,l.custom_request_id,l.updated_at,
           w.project_key,w.project_title,w.project_status,r.request_key,r.product_interest,r.status request_status
    FROM creative_project_manufacturing_lifecycles l
    JOIN creative_work_projects w ON w.creative_work_project_id=l.creative_work_project_id
    LEFT JOIN custom_requests r ON r.custom_request_id=l.custom_request_id
    WHERE l.current_stage IN ('production_authorized','production_run','qa_rework','completed')
    ORDER BY datetime(l.updated_at) DESC,l.creative_project_manufacturing_lifecycle_id DESC
    LIMIT 100
  `).all().catch(()=>({results:[]})));
}
async function lifecycleBy(db,values={}){
  const lifecycleId=id(values.lifecycleId),requestId=id(values.requestId),projectId=id(values.projectId);
  if(lifecycleId)return db.prepare("SELECT * FROM creative_project_manufacturing_lifecycles WHERE creative_project_manufacturing_lifecycle_id=? LIMIT 1").bind(lifecycleId).first().catch(()=>null);
  if(requestId)return db.prepare("SELECT * FROM creative_project_manufacturing_lifecycles WHERE custom_request_id=? ORDER BY creative_project_manufacturing_lifecycle_id DESC LIMIT 1").bind(requestId).first().catch(()=>null);
  if(projectId)return db.prepare("SELECT * FROM creative_project_manufacturing_lifecycles WHERE creative_work_project_id=? ORDER BY creative_project_manufacturing_lifecycle_id DESC LIMIT 1").bind(projectId).first().catch(()=>null);
  return null;
}
function safeJson(value,fallback=null){try{return JSON.parse(String(value||''));}catch{return fallback;}}
function checkpointTemplates(travelerSnapshot,operations){
  const out=[],seen=new Set();
  const add=(key,label,operationId=null,authority='Build 219 traveler')=>{
    const k=String(key||'').slice(0,120),l=clean(label,500);if(!k||!l||seen.has(k))return;seen.add(k);
    out.push({checkpoint_key:k,checkpoint_label:l,creative_project_operation_id:operationId,authority});
  };
  const travelerChecks=Array.isArray(travelerSnapshot?.checkpoints)?travelerSnapshot.checkpoints:[];
  travelerChecks.slice(0,30).forEach((x,i)=>add('traveler_'+i,x?.checkpoint||x?.label||String(x||''),null,x?.authority||'Build 219 traveler'));
  operations.forEach((op)=>{
    if(clean(op.output_evidence_requirement,500))add('operation_'+id(op.creative_project_operation_id),clean(op.output_evidence_requirement,500),id(op.creative_project_operation_id),'creative_project_operations');
  });
  add('final_quantity_reconciliation','Final quantity reconciliation: actual = accepted + rework + scrap/failure, or deviation is explained.',null,'Build 220 quantity evidence');
  return out.slice(0,60);
}
async function materialPosts(db,projectId){
  if(!projectId)return[];
  const usage=await tableExists(db,'creative_project_inventory_usage_details');
  if(usage){
    return rows(await db.prepare(`
      SELECT ip.creative_project_inventory_post_id,ip.creative_work_event_id,ip.site_item_inventory_id,ip.stock_quantity_consumed,
             ip.posting_status,ip.notes,si.item_name,si.source_type,si.external_key,si.stock_unit_label,si.usage_unit_label,
             COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed) usage_quantity_consumed,
             COALESCE(iud.usage_unit_label,si.usage_unit_label,'unit') posted_usage_unit_label,
             COALESCE(iud.tracking_mode,'exact') tracking_mode
      FROM creative_project_inventory_posts ip
      JOIN site_item_inventory si ON si.site_item_inventory_id=ip.site_item_inventory_id
      LEFT JOIN creative_project_inventory_usage_details iud ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
      WHERE ip.creative_work_project_id=? AND COALESCE(ip.posting_status,'posted')<>'reversed'
      ORDER BY ip.creative_project_inventory_post_id DESC LIMIT 100
    `).bind(projectId).all().catch(()=>({results:[]})));
  }
  return rows(await db.prepare(`
    SELECT ip.creative_project_inventory_post_id,ip.creative_work_event_id,ip.site_item_inventory_id,ip.stock_quantity_consumed,
           ip.posting_status,ip.notes,si.item_name,si.source_type,si.external_key,si.stock_unit_label,si.usage_unit_label,
           ip.stock_quantity_consumed usage_quantity_consumed,COALESCE(si.usage_unit_label,si.stock_unit_label,'unit') posted_usage_unit_label,
           'exact' tracking_mode
    FROM creative_project_inventory_posts ip
    JOIN site_item_inventory si ON si.site_item_inventory_id=ip.site_item_inventory_id
    WHERE ip.creative_work_project_id=? AND COALESCE(ip.posting_status,'posted')<>'reversed'
    ORDER BY ip.creative_project_inventory_post_id DESC LIMIT 100
  `).bind(projectId).all().catch(()=>({results:[]})));
}
async function sourceBundle(db,lifecycle){
  const projectId=id(lifecycle.creative_work_project_id),requestId=id(lifecycle.custom_request_id);
  const project=projectId?await db.prepare("SELECT creative_work_project_id,project_key,project_title,project_status,summary,objective,updated_at FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1").bind(projectId).first().catch(()=>null):null;
  const request=requestId?await db.prepare("SELECT custom_request_id,request_key,name,email,product_interest,status,quantity,updated_at FROM custom_requests WHERE custom_request_id=? LIMIT 1").bind(requestId).first().catch(()=>null):null;
  const traveler=await db.prepare(`
    SELECT creative_project_job_traveler_id,traveler_key,version_number,traveler_status,snapshot_json,snapshot_sha256,review_note,reviewed_at
    FROM creative_project_job_travelers
    WHERE creative_project_manufacturing_lifecycle_id=? AND traveler_status='reviewed'
    ORDER BY version_number DESC,creative_project_job_traveler_id DESC LIMIT 1
  `).bind(id(lifecycle.creative_project_manufacturing_lifecycle_id)).first().catch(()=>null);
  const travelerSnapshot=safeJson(traveler?.snapshot_json,{});
  const operations=rows(await db.prepare(`
    SELECT o.creative_project_operation_id,o.operation_order,o.operation_title,o.plan_status,o.responsible_workspace,
           o.planned_setup_notes,o.planned_duration_minutes,o.output_evidence_requirement,o.notes,o.updated_at,
           p.inventory_process_id,p.process_key,p.process_name
    FROM creative_project_operations o
    JOIN inventory_processes p ON p.inventory_process_id=o.inventory_process_id
    WHERE o.creative_work_project_id=?
    ORDER BY o.operation_order,o.creative_project_operation_id
  `).bind(projectId).all().catch(()=>({results:[]})));
  const posts=await materialPosts(db,projectId);
  let orderDraft=null,order=null;
  if(requestId&&await tableExists(db,'custom_request_order_drafts')){
    orderDraft=await db.prepare("SELECT custom_request_order_draft_id,order_draft_key,order_draft_status,order_id,total_cents,currency,fulfillment_notes,updated_at FROM custom_request_order_drafts WHERE custom_request_id=? ORDER BY custom_request_order_draft_id DESC LIMIT 1").bind(requestId).first().catch(()=>null);
    if(id(orderDraft?.order_id)&&await tableExists(db,'orders'))order=await db.prepare("SELECT order_id,order_number,order_status,payment_status,fulfillment_type,updated_at FROM orders WHERE order_id=? LIMIT 1").bind(id(orderDraft.order_id)).first().catch(()=>null);
  }
  return {project,request,traveler,traveler_snapshot:travelerSnapshot,operations,material_posts:posts,order_draft:orderDraft,order};
}
async function runHistory(db,lifecycleId){
  return rows(await db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM creative_project_production_run_operations o WHERE o.creative_project_production_run_id=r.creative_project_production_run_id) operation_evidence_count,
      (SELECT COUNT(*) FROM creative_project_production_run_qa_checks q WHERE q.creative_project_production_run_id=r.creative_project_production_run_id) qa_check_count,
      (SELECT COUNT(*) FROM creative_project_production_run_material_evidence m WHERE m.creative_project_production_run_id=r.creative_project_production_run_id) material_evidence_count,
      (SELECT handoff_kind FROM creative_project_production_run_handoffs h WHERE h.creative_project_production_run_id=r.creative_project_production_run_id ORDER BY h.creative_project_production_run_handoff_id DESC LIMIT 1) handoff_kind
    FROM creative_project_production_runs r
    WHERE r.creative_project_manufacturing_lifecycle_id=?
    ORDER BY r.run_sequence DESC,r.creative_project_production_run_id DESC LIMIT 40
  `).bind(lifecycleId).all().catch(()=>({results:[]})));
}
async function bundle(db,lifecycle){
  const source=await sourceBundle(db,lifecycle),history=await runHistory(db,id(lifecycle.creative_project_manufacturing_lifecycle_id));
  const blockers=[],warnings=[],stage=String(lifecycle.current_stage||'');
  if(!RUN_STAGES.has(stage))blockers.push('Manufacturing lifecycle must be in production_run, qa_rework or completed before reviewed run evidence is recorded.');
  if(!source.traveler)blockers.push('A reviewed Build 219 manufacturing traveler is required so the run is tied to an exact execution packet.');
  if(!source.operations.length)blockers.push('No Creative Project manufacturing operations are available for run evidence.');
  if(!source.material_posts.length)warnings.push('No active Inventory-owned Creative material postings are available yet; explain the material reconciliation in the run review.');
  if(!source.order_draft)warnings.push('No Custom Work order draft is linked yet; handoff may remain pending with an evidence note.');
  const max=await db.prepare("SELECT COALESCE(MAX(run_sequence),0) m FROM creative_project_production_runs WHERE creative_project_manufacturing_lifecycle_id=?").bind(id(lifecycle.creative_project_manufacturing_lifecycle_id)).first().catch(()=>({m:0}));
  const nextSequence=Number(max?.m||0)+1;
  const planned=qty(source.traveler_snapshot?.quantity?.value);
  return {
    lifecycle,source,run_history:history,
    qa_templates:checkpointTemplates(source.traveler_snapshot,source.operations),
    suggested_run_identifier:'RUN-'+id(lifecycle.creative_work_project_id)+'-'+String(nextSequence).padStart(3,'0'),
    suggested_planned_quantity:Number.isFinite(planned)?planned:null,
    readiness:{blockers,warnings,ready:blockers.length===0},
    boundaries:{run_evidence_only:true,inventory_mutation:false,inventory_movement_creation:false,order_mutation:false,finance_mutation:false,accounting_posting:false,provider_execution:false,publication:false}
  };
}
function parseDate(value,label){
  const text=clean(value,80);if(!text)return null;
  const stamp=Date.parse(text);if(!Number.isFinite(stamp))throw new Error(label+' is not a valid date/time.');
  return new Date(stamp).toISOString();
}
function validateQuantities(body){
  const planned=qty(body.planned_quantity),actual=qty(body.actual_quantity),accepted=qty(body.accepted_quantity),rework=qty(body.rework_quantity),scrap=qty(body.scrap_quantity);
  if(Number.isNaN(planned)||Number.isNaN(actual)||Number.isNaN(accepted)||Number.isNaN(rework)||Number.isNaN(scrap))throw new Error('Run quantities must be zero or greater.');
  if(actual===null||accepted===null||rework===null||scrap===null)throw new Error('Actual, accepted, rework and scrap/failure quantities are required.');
  if(accepted+rework+scrap>actual+1e-9)throw new Error('Accepted + rework + scrap/failure cannot exceed actual quantity.');
  return {planned,actual,accepted,rework,scrap};
}
async function validateHandoff(db,lifecycle,body){
  const handoff=body&&typeof body==='object'?body:{};
  const kind=clean(handoff.kind,40).toLowerCase()||'pending',note=clean(handoff.evidence_note,1200);
  if(!HANDOFF_KINDS.has(kind))throw new Error('Choose a valid handoff evidence kind.');
  if(!note)throw new Error('Add a finished-inventory/order handoff evidence note, including why handoff is pending when applicable.');
  let inventoryId=id(handoff.site_item_inventory_id)||null,draftId=id(handoff.custom_request_order_draft_id)||null,orderId=id(handoff.order_id)||null;
  if(kind==='inventory'){
    if(!inventoryId)throw new Error('Choose an existing finished Inventory item for Inventory handoff evidence.');
    const row=await db.prepare("SELECT site_item_inventory_id FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1").bind(inventoryId).first().catch(()=>null);
    if(!row)throw new Error('The selected Inventory handoff target was not found.');
    draftId=null;orderId=null;
  }else if(kind==='custom_order_draft'){
    if(!draftId)throw new Error('Choose an existing Custom Work order draft for handoff evidence.');
    const row=await db.prepare("SELECT custom_request_order_draft_id,custom_request_id,order_id FROM custom_request_order_drafts WHERE custom_request_order_draft_id=? LIMIT 1").bind(draftId).first().catch(()=>null);
    if(!row||id(row.custom_request_id)!==id(lifecycle.custom_request_id))throw new Error('The selected order draft does not belong to this Custom Request.');
    inventoryId=null;orderId=id(row.order_id)||null;
  }else if(kind==='order'){
    if(!orderId)throw new Error('Choose an existing order for handoff evidence.');
    const row=await db.prepare("SELECT order_id FROM orders WHERE order_id=? LIMIT 1").bind(orderId).first().catch(()=>null);
    if(!row)throw new Error('The selected order handoff target was not found.');
    inventoryId=null;draftId=null;
  }else{inventoryId=null;draftId=null;orderId=null;}
  return {kind,note,inventoryId,draftId,orderId};
}
async function recordRun(context,ctx,lifecycle,current,body){
  if(current.readiness.blockers.length)throw Object.assign(new Error('Run review is blocked until the lifecycle, traveler and operation source requirements are satisfied.'),{status:409});
  const runIdentifier=clean(body.run_identifier,120),reviewNote=clean(body.review_note,1800),materialNote=clean(body.material_reconciliation_note,1800),deviation=clean(body.deviation_summary,1800);
  if(!runIdentifier||!reviewNote||!materialNote)throw new Error('Run identifier, review note and material reconciliation note are required.');
  const q=validateQuantities(body),sum=q.accepted+q.rework+q.scrap;
  if((q.rework>0||q.scrap>0||Math.abs(sum-q.actual)>1e-9)&&!deviation)throw new Error('Explain rework, scrap/failure or any unreconciled actual quantity in the deviation summary.');
  const startedAt=parseDate(body.started_at,'Run start'),completedAt=parseDate(body.completed_at,'Run completion');
  if(startedAt&&completedAt&&Date.parse(completedAt)<Date.parse(startedAt))throw new Error('Run completion cannot be before run start.');
  const projectId=id(lifecycle.creative_work_project_id),requestId=id(lifecycle.custom_request_id)||null,lifecycleId=id(lifecycle.creative_project_manufacturing_lifecycle_id),travelerId=id(current.source.traveler?.creative_project_job_traveler_id),userId=id(ctx.admin.user_id)||null;
  const currentOps=new Map(current.source.operations.map((x)=>[id(x.creative_project_operation_id),x]));
  const operationEvidence=Array.isArray(body.operations)?body.operations.slice(0,60):[];
  const suppliedIds=new Set(operationEvidence.map((x)=>id(x.creative_project_operation_id)).filter(Boolean));
  if(suppliedIds.size!==currentOps.size||[...currentOps.keys()].some((x)=>!suppliedIds.has(x)))throw new Error('Record one operation evidence row for every current Creative Project operation.');
  const ops=operationEvidence.map((x)=>{
    const operationId=id(x.creative_project_operation_id),outcome=clean(x.operation_outcome,30).toLowerCase(),opStart=parseDate(x.started_at,'Operation start'),opEnd=parseDate(x.completed_at,'Operation completion'),checkpoint=clean(x.checkpoint_note,1200),opDeviation=clean(x.deviation_note,1200);
    if(!currentOps.has(operationId)||!RUN_OUTCOMES.has(outcome))throw new Error('Operation evidence contains an invalid operation or outcome.');
    if(outcome!=='not_run'&&(!opStart||!opEnd))throw new Error('Performed operations require start and completion timestamps.');
    if(opStart&&opEnd&&Date.parse(opEnd)<Date.parse(opStart))throw new Error('An operation completion time is before its start time.');
    if((outcome==='rework'||outcome==='fail')&&!opDeviation)throw new Error('Rework/failed operations require a reasoned deviation note.');
    return {operationId,outcome,opStart,opEnd,checkpoint,opDeviation};
  });
  const templates=new Map(current.qa_templates.map((x)=>[String(x.checkpoint_key),x]));
  if(q.actual>0&&!ops.some((o)=>o.outcome!=='not_run'))throw new Error('A run with actual output requires at least one performed operation with start/completion timestamps.');
  const qaInput=Array.isArray(body.qa_checks)?body.qa_checks.slice(0,80):[];
  const qaKeys=new Set(qaInput.map((x)=>String(x.checkpoint_key||'')));
  if(templates.size&&([...templates.keys()].some((x)=>!qaKeys.has(x))||qaKeys.size!==templates.size))throw new Error('Record a QA status for every current traveler/operation checkpoint.');
  const qa=qaInput.map((x)=>{
    const key=String(x.checkpoint_key||''),template=templates.get(key),status=clean(x.qa_status,30).toLowerCase(),observed=clean(x.observed_result,1200);
    if(!template||!QA_STATUSES.has(status))throw new Error('QA evidence contains an invalid checkpoint or status.');
    if((status==='rework'||status==='fail')&&!observed)throw new Error('Rework/failed QA checkpoints require an observed-result note.');
    return {key,label:template.checkpoint_label,operationId:id(template.creative_project_operation_id)||null,status,observed};
  });
  const availablePosts=new Set(current.source.material_posts.map((x)=>id(x.creative_project_inventory_post_id)));
  const selectedPosts=[...new Set((Array.isArray(body.material_post_ids)?body.material_post_ids:[]).slice(0,100).map(id).filter(Boolean))];
  if(selectedPosts.some((x)=>!availablePosts.has(x)))throw new Error('Material reconciliation references an Inventory posting that is not active for this project.');
  const handoff=await validateHandoff(ctx.db,lifecycle,body.handoff);
  const max=await ctx.db.prepare("SELECT COALESCE(MAX(run_sequence),0) m FROM creative_project_production_runs WHERE creative_project_manufacturing_lifecycle_id=?").bind(lifecycleId).first();
  const sequence=Number(max?.m||0)+1,runKey='run_'+lifecycleId+'_'+sequence+'_'+Date.now().toString(36);
  const statements=[
    ctx.db.prepare(`
      INSERT INTO creative_project_production_runs(
        run_key,creative_project_manufacturing_lifecycle_id,creative_work_project_id,custom_request_id,creative_project_job_traveler_id,
        run_sequence,run_identifier,run_status,planned_quantity,actual_quantity,accepted_quantity,rework_quantity,scrap_quantity,quantity_unit,
        started_at,completed_at,deviation_summary,material_reconciliation_note,review_note,reviewed_by_user_id,reviewed_at,created_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,'reviewed',?,?,?,?,?,'unit',?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `).bind(runKey,lifecycleId,projectId,requestId,travelerId,sequence,runIdentifier,q.planned,q.actual,q.accepted,q.rework,q.scrap,startedAt,completedAt,deviation||null,materialNote,reviewNote,userId)
  ];
  for(const op of ops)statements.push(ctx.db.prepare(`
    INSERT INTO creative_project_production_run_operations(
      creative_project_production_run_id,creative_project_operation_id,operation_outcome,started_at,completed_at,checkpoint_note,deviation_note,created_at
    ) SELECT creative_project_production_run_id,?,?,?,?,?,?,CURRENT_TIMESTAMP FROM creative_project_production_runs WHERE run_key=?
  `).bind(op.operationId,op.outcome,op.opStart,op.opEnd,op.checkpoint||null,op.opDeviation||null,runKey));
  for(const check of qa)statements.push(ctx.db.prepare(`
    INSERT INTO creative_project_production_run_qa_checks(
      creative_project_production_run_id,creative_project_operation_id,checkpoint_key,checkpoint_label,qa_status,observed_result,checked_by_user_id,checked_at,created_at
    ) SELECT creative_project_production_run_id,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM creative_project_production_runs WHERE run_key=?
  `).bind(check.operationId,check.key,check.label,check.status,check.observed||null,userId,runKey));
  for(const postId of selectedPosts)statements.push(ctx.db.prepare(`
    INSERT INTO creative_project_production_run_material_evidence(
      creative_project_production_run_id,creative_project_inventory_post_id,evidence_note,created_at
    ) SELECT creative_project_production_run_id,?, ?,CURRENT_TIMESTAMP FROM creative_project_production_runs WHERE run_key=?
  `).bind(postId,'Linked reviewed run to existing Inventory-owned Creative posting; no Inventory movement was created.',runKey));
  statements.push(ctx.db.prepare(`
    INSERT INTO creative_project_production_run_handoffs(
      creative_project_production_run_id,handoff_kind,site_item_inventory_id,custom_request_order_draft_id,order_id,evidence_note,recorded_by_user_id,recorded_at,created_at
    ) SELECT creative_project_production_run_id,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM creative_project_production_runs WHERE run_key=?
  `).bind(handoff.kind,handoff.inventoryId,handoff.draftId,handoff.orderId,handoff.note,userId,runKey));
  statements.push(ctx.db.prepare(`
    INSERT INTO creative_project_production_run_events(creative_project_production_run_id,event_type,event_note,actor_user_id,created_at)
    SELECT creative_project_production_run_id,'reviewed',?,?,CURRENT_TIMESTAMP FROM creative_project_production_runs WHERE run_key=?
  `).bind(reviewNote,userId,runKey));
  await ctx.db.batch(statements);
  const created=await ctx.db.prepare("SELECT creative_project_production_run_id FROM creative_project_production_runs WHERE run_key=? LIMIT 1").bind(runKey).first();
  const runId=id(created?.creative_project_production_run_id);
  await auditAdminAction(context.env,context.request,ctx.admin,{action_type:'build220_production_run_reviewed',target_type:'creative_project_production_run',target_id:runId,target_key:runKey,details:{lifecycle_id:lifecycleId,project_id:projectId,custom_request_id:requestId,traveler_id:travelerId,run_sequence:sequence,actual_quantity:q.actual,accepted_quantity:q.accepted,rework_quantity:q.rework,scrap_quantity:q.scrap,inventory_post_references:selectedPosts.length,handoff_kind:handoff.kind,inventory_mutation:false,inventory_movement_creation:false,order_mutation:false,finance_mutation:false,accounting_posting:false,provider_execution:false}});
}
async function voidRun(context,ctx,body){
  const runId=id(body.creative_project_production_run_id),reason=clean(body.void_reason,1200);
  if(!runId||!reason)throw new Error('Choose a production run and provide a void reason.');
  const row=await ctx.db.prepare("SELECT * FROM creative_project_production_runs WHERE creative_project_production_run_id=? LIMIT 1").bind(runId).first().catch(()=>null);
  if(!row)throw Object.assign(new Error('Production run was not found.'),{status:404});
  if(String(row.run_status||'')==='void')return row;
  await ctx.db.batch([
    ctx.db.prepare("UPDATE creative_project_production_runs SET run_status='void',void_reason=?,voided_by_user_id=?,voided_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE creative_project_production_run_id=? AND run_status='reviewed'").bind(reason,id(ctx.admin.user_id)||null,runId),
    ctx.db.prepare("INSERT INTO creative_project_production_run_events(creative_project_production_run_id,event_type,event_note,actor_user_id,created_at) VALUES(?,'void',?,?,CURRENT_TIMESTAMP)").bind(runId,reason,id(ctx.admin.user_id)||null)
  ]);
  await auditAdminAction(context.env,context.request,ctx.admin,{action_type:'build220_production_run_voided',target_type:'creative_project_production_run',target_id:runId,target_key:row.run_key||null,details:{reason,inventory_mutation:false,order_mutation:false,finance_mutation:false,provider_execution:false}});
  return row;
}

export async function onRequestGet(context){
  const ctx=await access(context);if(ctx.error)return ctx.error;
  const url=new URL(context.request.url),lifecycle=await lifecycleBy(ctx.db,{lifecycleId:id(url.searchParams.get('lifecycle_id')),requestId:id(url.searchParams.get('request_id')),projectId:id(url.searchParams.get('project_id'))});
  if(!lifecycle)return json({ok:true,lifecycle_choices:await lifecycleChoices(ctx.db),selected:null,boundaries:{run_evidence_only:true,inventory_mutation:false,finance_mutation:false,provider_execution:false}});
  return json({ok:true,lifecycle_choices:await lifecycleChoices(ctx.db),selected:await bundle(ctx.db,lifecycle)});
}
export async function onRequestPost(context){
  const ctx=await access(context);if(ctx.error)return ctx.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,80).toLowerCase();
  try{
    if(action==='void_run'){
      const prior=await voidRun(context,ctx,body);
      const lifecycle=await lifecycleBy(ctx.db,{lifecycleId:id(body.lifecycle_id)||id(prior?.creative_project_manufacturing_lifecycle_id)});
      return json({ok:true,message:'Reviewed production-run evidence voided. Inventory, order and Finance authorities were not changed.',lifecycle_choices:await lifecycleChoices(ctx.db),selected:lifecycle?await bundle(ctx.db,lifecycle):null});
    }
    if(action!=='record_run')return json({ok:false,error:'Unsupported Build 220 action.'},400);
    const lifecycle=await lifecycleBy(ctx.db,{lifecycleId:id(body.lifecycle_id),requestId:id(body.request_id),projectId:id(body.project_id)});
    if(!lifecycle)return json({ok:false,error:'Choose an existing manufacturing lifecycle with a linked Creative Project.'},404);
    const current=await bundle(ctx.db,lifecycle);
    await recordRun(context,ctx,lifecycle,current,body);
    return json({ok:true,message:'Reviewed production-run, QA, material-reconciliation and handoff evidence recorded. Inventory and Finance ledgers were not changed.',lifecycle_choices:await lifecycleChoices(ctx.db),selected:await bundle(ctx.db,lifecycle)});
  }catch(error){return json({ok:false,error:String(error?.message||error)},Number(error?.status||400));}
}
