// Release 467 Build 219 — Manufacturing Work Order & Job Traveler.
// Generates reviewed traveler snapshots from existing authorities. It never edits source authorities.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD=219;
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const id=(v)=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const clean=(v,n=1800)=>normalizeText(v||'').slice(0,n);
const json=(value,status=200)=>jsonResponse({release:467,build:BUILD,...value},status,{'Cache-Control':'no-store'});
const STAGES=['concept','prototype','prototype_failed_rework','sample_candidate','approved_sample','production_authorized','production_run','qa_rework','completed'];

function stableJson(value){
  if(Array.isArray(value))return '['+value.map(stableJson).join(',')+']';
  if(value&&typeof value==='object'){
    const keys=Object.keys(value).sort();
    return '{'+keys.map((k)=>JSON.stringify(k)+':'+stableJson(value[k])).join(',')+'}';
  }
  return JSON.stringify(value);
}
async function sha256(value){
  const bytes=new TextEncoder().encode(stableJson(value));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),(b)=>b.toString(16).padStart(2,'0')).join('');
}
async function tableExists(db,name){
  return Boolean(await db.prepare("SELECT 1 ok FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null));
}
async function access(context){
  const admin=await getAdminUserFromRequest(context.request,context.env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(context.env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const required=['custom_requests','creative_work_projects','creative_project_manufacturing_lifecycles','creative_project_operations','creative_project_operation_resources','inventory_processes','site_item_inventory','creative_project_job_travelers','creative_project_job_traveler_events'];
  const missing=[];
  for(const name of required)if(!(await tableExists(db,name)))missing.push(name);
  if(missing.length)return {error:json({ok:false,error:'Build 219 canonical migration or predecessor authority is required.',code:'build219_schema_required',missing_tables:missing},503)};
  return {admin,db};
}
async function lifecycleChoices(db){
  return rows(await db.prepare("SELECT l.creative_project_manufacturing_lifecycle_id,l.current_stage,l.creative_work_project_id,l.custom_request_id,l.updated_at,w.project_key,w.project_title,w.project_status,r.request_key,r.product_interest,r.status request_status,r.quantity FROM creative_project_manufacturing_lifecycles l LEFT JOIN creative_work_projects w ON w.creative_work_project_id=l.creative_work_project_id LEFT JOIN custom_requests r ON r.custom_request_id=l.custom_request_id WHERE l.creative_work_project_id IS NOT NULL ORDER BY datetime(l.updated_at) DESC,l.creative_project_manufacturing_lifecycle_id DESC LIMIT 100").all().catch(()=>({results:[]})));
}
async function lifecycleBy(db,values={}){
  const lifecycleId=id(values.lifecycleId),requestId=id(values.requestId),projectId=id(values.projectId);
  if(lifecycleId)return db.prepare("SELECT * FROM creative_project_manufacturing_lifecycles WHERE creative_project_manufacturing_lifecycle_id=? LIMIT 1").bind(lifecycleId).first().catch(()=>null);
  if(requestId)return db.prepare("SELECT * FROM creative_project_manufacturing_lifecycles WHERE custom_request_id=? LIMIT 1").bind(requestId).first().catch(()=>null);
  if(projectId)return db.prepare("SELECT * FROM creative_project_manufacturing_lifecycles WHERE creative_work_project_id=? LIMIT 1").bind(projectId).first().catch(()=>null);
  return null;
}
async function sourceBundle(db,lifecycle){
  const projectId=id(lifecycle.creative_work_project_id),requestId=id(lifecycle.custom_request_id);
  const project=projectId?await db.prepare("SELECT creative_work_project_id,project_key,project_title,project_type,project_status,summary,objective,updated_at FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1").bind(projectId).first().catch(()=>null):null;
  const request=requestId?await db.prepare("SELECT custom_request_id,request_key,name,email,request_type,product_interest,status,quantity,project_intent,intended_use,organization_name,event_context_structured,desired_material,desired_finish,personalization_text,tolerance_size_notes,message,supplied_item,updated_at FROM custom_requests WHERE custom_request_id=? LIMIT 1").bind(requestId).first().catch(()=>null):null;

  let proof=null,creativeEvent=null;
  if(String(lifecycle.approved_sample_evidence_kind||'')==='proof_version'&&id(lifecycle.approved_sample_proof_version_id)&&await tableExists(db,'custom_request_proof_versions')){
    proof=await db.prepare("SELECT custom_request_proof_version_id,custom_request_id,version_number,proof_title,customer_message,proof_status,source_kind,packaging_project_id,packaging_project_version_id,internal_production_approval_required,internal_production_approval_status,approved_at,updated_at FROM custom_request_proof_versions WHERE custom_request_proof_version_id=? LIMIT 1").bind(id(lifecycle.approved_sample_proof_version_id)).first().catch(()=>null);
  }
  if(String(lifecycle.approved_sample_evidence_kind||'')==='creative_work_event'&&id(lifecycle.approved_sample_creative_work_event_id)&&await tableExists(db,'creative_work_events')){
    creativeEvent=await db.prepare("SELECT creative_work_event_id,event_type,event_title,event_notes,occurred_at,entry_status FROM creative_work_events WHERE creative_work_event_id=? LIMIT 1").bind(id(lifecycle.approved_sample_creative_work_event_id)).first().catch(()=>null);
  }

  const operations=projectId?rows(await db.prepare("SELECT o.creative_project_operation_id,o.operation_order,o.operation_title,o.plan_status,o.responsible_workspace,o.planned_setup_notes,o.planned_duration_minutes,o.output_evidence_requirement,o.notes,o.updated_at,p.inventory_process_id,p.process_key,p.process_name FROM creative_project_operations o JOIN inventory_processes p ON p.inventory_process_id=o.inventory_process_id WHERE o.creative_work_project_id=? ORDER BY o.operation_order,o.creative_project_operation_id").bind(projectId).all().catch(()=>({results:[]}))):[];
  const resources=projectId?rows(await db.prepare("SELECT r.creative_project_operation_resource_id,r.creative_project_operation_id,r.site_item_inventory_id,r.resource_role,r.planned_quantity,r.planned_unit,r.requirement_notes,r.updated_at,i.item_name,i.source_type,i.external_key FROM creative_project_operation_resources r JOIN creative_project_operations o ON o.creative_project_operation_id=r.creative_project_operation_id JOIN site_item_inventory i ON i.site_item_inventory_id=r.site_item_inventory_id WHERE o.creative_work_project_id=? ORDER BY o.operation_order,r.resource_role,LOWER(COALESCE(i.item_name,'')),r.creative_project_operation_resource_id").bind(projectId).all().catch(()=>({results:[]}))):[];

  let quote=null,terms=null;
  if(requestId&&await tableExists(db,'custom_request_quote_drafts')){
    quote=await db.prepare("SELECT * FROM custom_request_quote_drafts WHERE custom_request_id=? ORDER BY custom_request_quote_draft_id DESC LIMIT 1").bind(requestId).first().catch(()=>null);
    if(quote&&await tableExists(db,'custom_request_quote_batch_terms'))terms=await db.prepare("SELECT * FROM custom_request_quote_batch_terms WHERE quote_draft_id=? LIMIT 1").bind(id(quote.custom_request_quote_draft_id)).first().catch(()=>null);
  }

  let suppliedItems=[],suppliedReviews=[],suppliedAcks=[];
  if(requestId&&await tableExists(db,'custom_request_supplied_items')){
    suppliedItems=rows(await db.prepare("SELECT * FROM custom_request_supplied_items WHERE custom_request_id=? ORDER BY custom_request_supplied_item_id LIMIT 40").bind(requestId).all().catch(()=>({results:[]})));
    if(await tableExists(db,'custom_request_supplied_item_reviews')){
      suppliedReviews=rows(await db.prepare("SELECT r.* FROM custom_request_supplied_item_reviews r JOIN (SELECT custom_request_supplied_item_id,MAX(custom_request_supplied_item_review_id) latest_id FROM custom_request_supplied_item_reviews WHERE custom_request_id=? GROUP BY custom_request_supplied_item_id) x ON x.latest_id=r.custom_request_supplied_item_review_id ORDER BY r.custom_request_supplied_item_id").bind(requestId).all().catch(()=>({results:[]})));
    }
    if(await tableExists(db,'custom_request_supplied_item_acknowledgements')){
      suppliedAcks=rows(await db.prepare("SELECT * FROM custom_request_supplied_item_acknowledgements WHERE custom_request_id=? ORDER BY custom_request_supplied_item_acknowledgement_id DESC LIMIT 80").bind(requestId).all().catch(()=>({results:[]})));
    }
  }
  return {project,request,proof,creative_event:creativeEvent,operations,resources,quote,terms,supplied_items:suppliedItems,supplied_reviews:suppliedReviews,supplied_acknowledgements:suppliedAcks};
}
function generateTraveler(lifecycle,source){
  const blockers=[],warnings=[],resourceMap=new Map();
  const activeOps=(source.operations||[]).filter((o)=>String(o.plan_status||'')!=='retired');
  for(const r of source.resources||[]){const key=id(r.creative_project_operation_id);if(!resourceMap.has(key))resourceMap.set(key,[]);resourceMap.get(key).push(r);}
  const operations=activeOps.map((o)=>({
    creative_project_operation_id:id(o.creative_project_operation_id),operation_order:Number(o.operation_order||0),
    process_key:o.process_key||null,process_name:o.process_name||null,operation_title:o.operation_title||o.process_name||null,
    plan_status:o.plan_status||null,responsible_workspace:o.responsible_workspace||null,setup_notes:o.planned_setup_notes||null,
    planned_duration_minutes:o.planned_duration_minutes===null?null:Number(o.planned_duration_minutes),
    output_evidence_requirement:o.output_evidence_requirement||null,notes:o.notes||null,source_updated_at:o.updated_at||null,
    materials_tools:(resourceMap.get(id(o.creative_project_operation_id))||[]).map((r)=>({
      creative_project_operation_resource_id:id(r.creative_project_operation_resource_id),site_item_inventory_id:id(r.site_item_inventory_id),
      resource_role:r.resource_role||null,item_name:r.item_name||null,source_type:r.source_type||null,external_key:r.external_key||null,
      planned_quantity:r.planned_quantity===null?null:Number(r.planned_quantity),planned_unit:r.planned_unit||null,
      requirement_notes:r.requirement_notes||null,source_updated_at:r.updated_at||null
    }))
  }));

  const quantity=Number(source.terms?.quote_quantity||source.request?.quantity||0);
  const quantitySource=Number(source.terms?.quote_quantity||0)>0?'custom_request_quote_batch_terms.quote_quantity':Number(source.request?.quantity||0)>0?'custom_requests.quantity':'unknown';
  if(!source.project)blockers.push('A linked Creative Project is required.');
  if(STAGES.indexOf(String(lifecycle.current_stage||'concept'))<STAGES.indexOf('production_authorized'))blockers.push('Manufacturing lifecycle must be explicitly production_authorized or later.');
  if(String(lifecycle.approved_sample_evidence_kind||'')==='proof_version'){
    if(!source.proof||String(source.proof.proof_status||'')!=='approved')blockers.push('The exact approved proof version is no longer approved.');
    if(Number(source.proof?.internal_production_approval_required||0)===1&&String(source.proof?.internal_production_approval_status||'')!=='approved')blockers.push('Internal production approval for the exact proof version is incomplete.');
  }else if(String(lifecycle.approved_sample_evidence_kind||'')==='creative_work_event'){
    if(!source.creative_event||String(source.creative_event.entry_status||'active')!=='active')blockers.push('The exact approved-sample Creative Process event is no longer active.');
  }else blockers.push('Exact approved-sample evidence is missing.');
  if(!(quantity>0))blockers.push('Production quantity is unknown.');
  if(!operations.length)blockers.push('At least one active Build 212 operation is required.');
  for(const op of operations)if(['draft','blocked'].includes(String(op.plan_status||'')))blockers.push('Operation '+op.operation_order+' is '+String(op.plan_status||'draft')+'.');

  const reviewMap=new Map((source.supplied_reviews||[]).map((r)=>[id(r.custom_request_supplied_item_id),r]));
  const limitations=[];
  for(const item of source.supplied_items||[]){
    const review=reviewMap.get(id(item.custom_request_supplied_item_id))||null;
    if(!review){blockers.push('Customer-supplied item '+String(item.item_label||item.item_key||'item')+' has no current suitability review.');continue;}
    const acks=(source.supplied_acknowledgements||[]).filter((a)=>id(a.custom_request_supplied_item_review_id)===id(review.custom_request_supplied_item_review_id));
    const acknowledged=acks.find((a)=>String(a.acknowledgement_status||'')==='acknowledged')||null;
    if(String(review.decision||'')==='declined')blockers.push('Customer-supplied item '+String(item.item_label||'item')+' is declined.');
    if(String(review.decision||'')==='needs_review')blockers.push('Customer-supplied item '+String(item.item_label||'item')+' still needs review.');
    if(String(review.decision||'')==='accepted_with_limitations'&&!acknowledged)blockers.push('Customer-supplied item limitations require acknowledgement for '+String(item.item_label||'item')+'.');
    limitations.push({custom_request_supplied_item_id:id(item.custom_request_supplied_item_id),item_key:item.item_key||null,item_label:item.item_label||null,workflow_status:item.workflow_status||null,decision:review.decision||null,limitations_text:review.limitations_text||null,material_unknowns:review.material_unknowns||null,safety_unknowns:review.safety_unknowns||null,acknowledgement_status:acknowledged?'acknowledged':acks[0]?.acknowledgement_status||null,current_review_id:id(review.custom_request_supplied_item_review_id)});
  }

  const packaging={packaging_choice:source.terms?.packaging_choice||null,packaging_charge_cents:source.terms?.packaging_charge_cents===undefined?null:Number(source.terms.packaging_charge_cents),handoff_method:source.terms?.handoff_method||null,handoff_notes:source.terms?.handoff_notes||null,proof_packaging_project_id:id(source.proof?.packaging_project_id)||null,proof_packaging_project_version_id:id(source.proof?.packaging_project_version_id)||null};
  if(!packaging.packaging_choice)warnings.push('Packaging choice is not recorded in the current quote terms.');
  if(!packaging.handoff_method||packaging.handoff_method==='tbd')warnings.push('Handoff method is still TBD.');

  const approvedSample=String(lifecycle.approved_sample_evidence_kind||'')==='proof_version'
    ?{evidence_kind:'proof_version',proof_version_id:id(source.proof?.custom_request_proof_version_id)||null,version_number:Number(source.proof?.version_number||0)||null,proof_title:source.proof?.proof_title||null,proof_status:source.proof?.proof_status||null,approved_at:source.proof?.approved_at||null}
    :{evidence_kind:'creative_work_event',creative_work_event_id:id(source.creative_event?.creative_work_event_id)||null,event_title:source.creative_event?.event_title||null,occurred_at:source.creative_event?.occurred_at||null,entry_status:source.creative_event?.entry_status||null};

  const checkpoints=[
    {checkpoint:'Exact approved sample/proof evidence remains valid',authority:'creative_project_manufacturing_lifecycles + proof/sample authority'},
    {checkpoint:'Explicit production authorization remains recorded',authority:'creative_project_manufacturing_lifecycles'},
    ...operations.filter((o)=>o.output_evidence_requirement).map((o)=>({checkpoint:'Operation '+o.operation_order+': '+o.output_evidence_requirement,authority:'creative_project_operations'})),
    ...limitations.filter((x)=>x.limitations_text).map((x)=>({checkpoint:'Supplied item '+String(x.item_label||x.item_key)+': '+x.limitations_text,authority:'custom_request_supplied_item_reviews'}))
  ];
  const evidenceChecklist=[
    ...operations.map((o)=>({operation_order:o.operation_order,label:o.output_evidence_requirement||('Capture reviewed output evidence for '+String(o.operation_title||o.process_name||'operation')),authority:'Creative Process / existing media authorities'})),
    ...(limitations.length?[{operation_order:null,label:'Capture post-work condition evidence for every customer-supplied item before return or closure.',authority:'custom_order_stage_photos + custom_request_supplied_item_evidence'}]:[]),
    {operation_order:null,label:'Confirm packaging and handoff against the existing quote/Packaging authority before release.',authority:'custom_request_quote_batch_terms + Packaging Studio'},
    {operation_order:null,label:'Keep CAIP originals private; only approved evidence may be promoted by existing media/publication authorities.',authority:'CAIP / Media Studio'}
  ];

  return {
    readiness:{state:blockers.length?'blocked':warnings.length?'review':'ready',blockers,warnings},
    snapshot:{
      snapshot_schema:'release467-build219-job-traveler-v1',
      identity:{lifecycle_id:id(lifecycle.creative_project_manufacturing_lifecycle_id),project_id:id(source.project?.creative_work_project_id),project_key:source.project?.project_key||null,project_title:source.project?.project_title||null,custom_request_id:id(source.request?.custom_request_id)||null,request_key:source.request?.request_key||null,product_interest:source.request?.product_interest||null},
      approved_sample:approvedSample,quantity:{value:quantity>0?quantity:null,source:quantitySource},
      customer_wording:{personalization_text:source.request?.personalization_text||null,customer_message:source.proof?.customer_message||null,request_message:source.request?.message||null,intended_use:source.request?.intended_use||null,organization_name:source.request?.organization_name||null,event_context:source.request?.event_context_structured||null,tolerance_size_notes:source.request?.tolerance_size_notes||null},
      operations,checkpoints,customer_supplied_item_limitations:limitations,packaging_handoff:packaging,evidence_capture_checklist:evidenceChecklist,
      source_authorities:{request:'custom_requests',project:'creative_work_projects',lifecycle:'creative_project_manufacturing_lifecycles',operations:'creative_project_operations + creative_project_operation_resources',proof_sample:'custom_request_proof_versions / creative_work_events',supplied_items:'custom_request_supplied_items + reviews + acknowledgements',packaging_handoff:'custom_request_quote_batch_terms + Packaging Studio',inventory:'site_item_inventory reference only',media:'Creative Process / CAIP / Media Studio reference only'},
      boundaries:{orchestration_only:true,product_mutation:false,inventory_mutation:false,packaging_mutation:false,caip_mutation:false,quote_mutation:false,proof_mutation:false,finance_mutation:false,accounting_posting:false,payment_execution:false,provider_execution:false,publication:false}
    }
  };
}
async function history(db,lifecycleId){
  return rows(await db.prepare("SELECT creative_project_job_traveler_id,traveler_key,creative_project_manufacturing_lifecycle_id,creative_work_project_id,custom_request_id,version_number,traveler_status,snapshot_sha256,review_note,reviewed_by_user_id,reviewed_at,supersedes_job_traveler_id,void_reason,voided_at,created_at,updated_at FROM creative_project_job_travelers WHERE creative_project_manufacturing_lifecycle_id=? ORDER BY version_number DESC,creative_project_job_traveler_id DESC LIMIT 40").bind(lifecycleId).all().catch(()=>({results:[]})));
}
async function bundle(db,lifecycle){
  const source=await sourceBundle(db,lifecycle),generated=generateTraveler(lifecycle,source);
  const checksum=await sha256(generated.snapshot),travelerHistory=await history(db,id(lifecycle.creative_project_manufacturing_lifecycle_id));
  const latest=travelerHistory.find((x)=>String(x.traveler_status||'')==='reviewed')||travelerHistory[0]||null;
  return {lifecycle,source,generated_traveler:generated.snapshot,readiness:generated.readiness,current_snapshot_sha256:checksum,traveler_history:travelerHistory,latest_traveler:latest,latest_traveler_is_current:Boolean(latest&&String(latest.snapshot_sha256||'')===checksum)};
}
async function reviewTraveler(context,ctx,lifecycle,current,body){
  if(current.readiness.blockers.length)throw Object.assign(new Error('Traveler review is blocked until all source-authority blockers are resolved.'),{status:409});
  const note=clean(body.review_note,1800);if(!note)throw new Error('Add a traveler review note.');
  const lifecycleId=id(lifecycle.creative_project_manufacturing_lifecycle_id),projectId=id(lifecycle.creative_work_project_id),requestId=id(lifecycle.custom_request_id)||null,userId=id(ctx.admin.user_id)||null;
  const max=await ctx.db.prepare("SELECT COALESCE(MAX(version_number),0) m FROM creative_project_job_travelers WHERE creative_project_manufacturing_lifecycle_id=?").bind(lifecycleId).first();
  const version=Number(max?.m||0)+1;
  const prior=await ctx.db.prepare("SELECT creative_project_job_traveler_id FROM creative_project_job_travelers WHERE creative_project_manufacturing_lifecycle_id=? AND traveler_status='reviewed' ORDER BY version_number DESC LIMIT 1").bind(lifecycleId).first().catch(()=>null);
  if(prior){
    await ctx.db.prepare("UPDATE creative_project_job_travelers SET traveler_status='superseded',updated_at=CURRENT_TIMESTAMP WHERE creative_project_job_traveler_id=? AND traveler_status='reviewed'").bind(id(prior.creative_project_job_traveler_id)).run();
    await ctx.db.prepare("INSERT INTO creative_project_job_traveler_events(creative_project_job_traveler_id,event_type,event_note,actor_user_id,created_at) VALUES(?,'superseded',?,?,CURRENT_TIMESTAMP)").bind(id(prior.creative_project_job_traveler_id),'Superseded by reviewed traveler version '+version,userId).run();
  }
  const key='traveler_'+lifecycleId+'_v'+version+'_'+Date.now().toString(36);
  const result=await ctx.db.prepare("INSERT INTO creative_project_job_travelers(traveler_key,creative_project_manufacturing_lifecycle_id,creative_work_project_id,custom_request_id,version_number,traveler_status,snapshot_json,snapshot_sha256,review_note,reviewed_by_user_id,reviewed_at,supersedes_job_traveler_id,created_at,updated_at) VALUES(?,?,?,?,?,'reviewed',?,?,?,?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(key,lifecycleId,projectId,requestId,version,JSON.stringify(current.generated_traveler),current.current_snapshot_sha256,note,userId,id(prior?.creative_project_job_traveler_id)||null).run();
  const travelerId=id(result?.meta?.last_row_id);
  await ctx.db.prepare("INSERT INTO creative_project_job_traveler_events(creative_project_job_traveler_id,event_type,event_note,actor_user_id,created_at) VALUES(?,'reviewed',?,?,CURRENT_TIMESTAMP)").bind(travelerId,note,userId).run();
  await auditAdminAction(context.env,context.request,ctx.admin,{action_type:'build219_job_traveler_reviewed',target_type:'creative_project_job_traveler',target_id:travelerId,target_key:key,details:{lifecycle_id:lifecycleId,project_id:projectId,custom_request_id:requestId,version_number:version,snapshot_sha256:current.current_snapshot_sha256,orchestration_only:true,product_mutation:false,inventory_mutation:false,packaging_mutation:false,caip_mutation:false,finance_mutation:false,provider_execution:false}});
}
async function voidTraveler(context,ctx,body){
  const travelerId=id(body.creative_project_job_traveler_id),reason=clean(body.void_reason,1200);
  if(!travelerId||!reason)throw new Error('Choose a traveler and provide a void reason.');
  const row=await ctx.db.prepare("SELECT * FROM creative_project_job_travelers WHERE creative_project_job_traveler_id=? LIMIT 1").bind(travelerId).first().catch(()=>null);
  if(!row)throw Object.assign(new Error('Traveler was not found.'),{status:404});
  if(String(row.traveler_status||'')==='void')return;
  await ctx.db.prepare("UPDATE creative_project_job_travelers SET traveler_status='void',void_reason=?,voided_by_user_id=?,voided_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE creative_project_job_traveler_id=?").bind(reason,id(ctx.admin.user_id)||null,travelerId).run();
  await ctx.db.prepare("INSERT INTO creative_project_job_traveler_events(creative_project_job_traveler_id,event_type,event_note,actor_user_id,created_at) VALUES(?,'void',?,?,CURRENT_TIMESTAMP)").bind(travelerId,reason,id(ctx.admin.user_id)||null).run();
  await auditAdminAction(context.env,context.request,ctx.admin,{action_type:'build219_job_traveler_voided',target_type:'creative_project_job_traveler',target_id:travelerId,target_key:row.traveler_key||null,details:{reason,source_authority_mutation:false,inventory_mutation:false,provider_execution:false}});
}

export async function onRequestGet(context){
  const ctx=await access(context);if(ctx.error)return ctx.error;
  const url=new URL(context.request.url);
  const lifecycle=await lifecycleBy(ctx.db,{lifecycleId:id(url.searchParams.get('lifecycle_id')),requestId:id(url.searchParams.get('request_id')),projectId:id(url.searchParams.get('project_id'))});
  if(!lifecycle)return json({ok:true,lifecycle_choices:await lifecycleChoices(ctx.db),selected:null,boundaries:{orchestration_only:true,source_authority_mutation:false,inventory_mutation:false,provider_execution:false}});
  return json({ok:true,lifecycle_choices:await lifecycleChoices(ctx.db),selected:await bundle(ctx.db,lifecycle)});
}
export async function onRequestPost(context){
  const ctx=await access(context);if(ctx.error)return ctx.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,80).toLowerCase();
  try{
    if(action==='void_traveler'){
      await voidTraveler(context,ctx,body);
      const lifecycle=await lifecycleBy(ctx.db,{lifecycleId:id(body.lifecycle_id)});
      return json({ok:true,message:'Traveler voided. Source authorities were not changed.',lifecycle_choices:await lifecycleChoices(ctx.db),selected:lifecycle?await bundle(ctx.db,lifecycle):null});
    }
    if(action!=='review_traveler')return json({ok:false,error:'Unsupported Build 219 action.'},400);
    const lifecycle=await lifecycleBy(ctx.db,{lifecycleId:id(body.lifecycle_id),requestId:id(body.request_id),projectId:id(body.project_id)});
    if(!lifecycle)return json({ok:false,error:'Choose an existing manufacturing lifecycle with a linked Creative Project.'},404);
    const current=await bundle(ctx.db,lifecycle);
    await reviewTraveler(context,ctx,lifecycle,current,body);
    return json({ok:true,message:'Reviewed traveler version created from existing source authorities. No source authority was edited.',lifecycle_choices:await lifecycleChoices(ctx.db),selected:await bundle(ctx.db,lifecycle)});
  }catch(error){return json({ok:false,error:String(error?.message||error)},Number(error?.status||400));}
}
