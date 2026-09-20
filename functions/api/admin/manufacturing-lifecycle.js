// Release 467 Build 214 — Prototype → Sample → Production Run admin authority.
// Explicit human transitions only. Existing Creative Process, Custom Work, Build 213 proof,
// Inventory, Product production-run, CAIP/media and Finance authorities remain owners.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { allowedManufacturingTransitions, loadManufacturingMaturityReadiness } from '../_lib/manufacturingMaturity.js';

const BUILD=214;
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const clean=(v,n=1600)=>normalizeText(v).slice(0,n);
const id=v=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};
const rows=r=>Array.isArray(r?.results)?r.results:[];
const STAGE_LABELS=Object.freeze({
  concept:'Concept',prototype:'Prototype',prototype_failed_rework:'Prototype failed / rework',
  sample_candidate:'Sample candidate',approved_sample:'Approved sample',
  production_authorized:'Production authorized',production_run:'Production run',
  qa_rework:'QA / rework',completed:'Completed'
});

async function access(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const ready=await db.prepare("SELECT COUNT(*) c FROM sqlite_master WHERE type='table' AND name IN ('creative_project_manufacturing_lifecycles','creative_project_manufacturing_lifecycle_events')").first().catch(()=>({c:0}));
  if(Number(ready?.c||0)!==2)return {error:json({ok:false,error:'Build 214 canonical migration is required.',code:'build214_schema_required'},503)};
  return {admin,db};
}
async function project(db,projectId){
  return id(projectId)?db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status,updated_at
    FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1`).bind(id(projectId)).first().catch(()=>null):null;
}
async function customRequest(db,requestId){
  return id(requestId)?db.prepare(`SELECT custom_request_id,request_key,name,email,request_type,product_interest,status,quantity,project_intent,updated_at
    FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(id(requestId)).first().catch(()=>null):null;
}
async function findLifecycle(db,{lifecycleId=0,projectId=0,requestId=0}={}){
  if(id(lifecycleId))return db.prepare('SELECT * FROM creative_project_manufacturing_lifecycles WHERE creative_project_manufacturing_lifecycle_id=? LIMIT 1').bind(id(lifecycleId)).first().catch(()=>null);
  if(id(projectId)){
    const row=await db.prepare('SELECT * FROM creative_project_manufacturing_lifecycles WHERE creative_work_project_id=? LIMIT 1').bind(id(projectId)).first().catch(()=>null);
    if(row)return row;
  }
  if(id(requestId))return db.prepare('SELECT * FROM creative_project_manufacturing_lifecycles WHERE custom_request_id=? LIMIT 1').bind(id(requestId)).first().catch(()=>null);
  return null;
}
async function event(db,lifecycle,{fromStage=null,toStage,kind='advance',note=null,proofVersionId=null,creativeEventId=null,userId=null}){
  await db.prepare(`INSERT INTO creative_project_manufacturing_lifecycle_events(
    creative_project_manufacturing_lifecycle_id,from_stage,to_stage,transition_kind,event_note,proof_version_id,creative_work_event_id,actor_user_id,created_at)
    VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(id(lifecycle.creative_project_manufacturing_lifecycle_id),fromStage,toStage,kind,note,proofVersionId,creativeEventId,userId).run();
}
async function bundle(db,{projectId=0,requestId=0,lifecycleId=0}={}){
  const projects=rows(await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status,updated_at
    FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived'
    ORDER BY datetime(updated_at) DESC,creative_work_project_id DESC LIMIT 80`).all());
  const requests=rows(await db.prepare(`SELECT custom_request_id,request_key,name,request_type,product_interest,status,quantity,project_intent,updated_at
    FROM custom_requests ORDER BY datetime(updated_at) DESC,custom_request_id DESC LIMIT 80`).all());
  const lifecycle=await findLifecycle(db,{lifecycleId,projectId,requestId});
  let currentProject=null,currentRequest=null,history=[],proofVersions=[],creativeEvents=[],readiness=null;
  if(lifecycle){
    currentProject=await project(db,lifecycle.creative_work_project_id);
    currentRequest=await customRequest(db,lifecycle.custom_request_id);
    history=rows(await db.prepare(`SELECT * FROM creative_project_manufacturing_lifecycle_events
      WHERE creative_project_manufacturing_lifecycle_id=? ORDER BY creative_project_manufacturing_lifecycle_event_id DESC LIMIT 120`)
      .bind(id(lifecycle.creative_project_manufacturing_lifecycle_id)).all());
    if(id(lifecycle.custom_request_id)){
      proofVersions=rows(await db.prepare(`SELECT custom_request_proof_version_id,version_number,proof_status,proof_title,approved_at,
          internal_production_approval_required,internal_production_approval_status,created_at
        FROM custom_request_proof_versions WHERE custom_request_id=?
        ORDER BY version_number DESC,custom_request_proof_version_id DESC LIMIT 40`).bind(id(lifecycle.custom_request_id)).all().catch(()=>({results:[]})));
    }
    if(id(lifecycle.creative_work_project_id)){
      creativeEvents=rows(await db.prepare(`SELECT creative_work_event_id,event_type,event_title,event_notes,occurred_at,entry_status
        FROM creative_work_events WHERE creative_work_project_id=? AND COALESCE(entry_status,'active')='active'
        ORDER BY datetime(occurred_at) DESC,creative_work_event_id DESC LIMIT 80`).bind(id(lifecycle.creative_work_project_id)).all().catch(()=>({results:[]})));
    }
    readiness=await loadManufacturingMaturityReadiness(db,id(lifecycle.creative_project_manufacturing_lifecycle_id));
  }
  return {
    projects,requests,lifecycle,project:currentProject,custom_request:currentRequest,history,
    proof_versions:proofVersions,creative_events:creativeEvents,readiness,
    stage_labels:STAGE_LABELS,
    actual_project_events_owned_by:'creative_work_events',
    product_production_runs_owned_by:'product_production_runs',
    inventory_mutation:false,automatic_production_start:false,publication_authorized:false
  };
}
async function audit(env,request,admin,lifecycle,action,details={}){
  await auditAdminAction(env,request,admin,{
    action_type:`manufacturing_maturity_${action}`,
    target_type:'creative_project_manufacturing_lifecycle',
    target_id:id(lifecycle?.creative_project_manufacturing_lifecycle_id),
    target_key:String(lifecycle?.creative_project_manufacturing_lifecycle_id||''),
    details:{
      automatic_production_start:false,inventory_mutation:false,product_production_run_mutation:false,
      publication_authorized:false,payment_execution:false,provider_execution:false,...details
    }
  });
}
async function validateApprovedSampleEvidence(db,lifecycle,body){
  const kind=clean(body.approved_sample_evidence_kind,40);
  if(id(lifecycle.custom_request_id)&&kind!=='proof_version'){
    throw new Error('A linked Custom Request requires its exact approved Build 213 proof version as approved-sample evidence.');
  }
  if(kind==='proof_version'){
    const proofId=id(body.approved_sample_proof_version_id);
    if(!proofId||!id(lifecycle.custom_request_id))throw new Error('Link a Custom Request and choose its exact approved proof version.');
    const proof=await db.prepare(`SELECT custom_request_proof_version_id,custom_request_id,version_number,proof_status,
      internal_production_approval_required,internal_production_approval_status
      FROM custom_request_proof_versions WHERE custom_request_proof_version_id=? AND custom_request_id=? LIMIT 1`)
      .bind(proofId,id(lifecycle.custom_request_id)).first();
    if(!proof||String(proof.proof_status||'')!=='approved')throw new Error('Approved-sample proof evidence must be an exact approved Build 213 proof version.');
    return {kind,proofVersionId:proofId,creativeEventId:null,note:`Approved sample references proof version ${Number(proof.version_number||0)}.`};
  }
  if(kind==='creative_work_event'){
    if(id(lifecycle.custom_request_id))throw new Error('Creative Process event evidence is only available when no Custom Request is linked.');
    const eventId=id(body.approved_sample_creative_work_event_id);
    if(!eventId||!id(lifecycle.creative_work_project_id))throw new Error('Link a Creative Project and choose an exact active Creative Process event.');
    const row=await db.prepare(`SELECT creative_work_event_id,event_title FROM creative_work_events
      WHERE creative_work_event_id=? AND creative_work_project_id=? AND COALESCE(entry_status,'active')='active' LIMIT 1`)
      .bind(eventId,id(lifecycle.creative_work_project_id)).first();
    if(!row)throw new Error('Approved-sample event evidence must belong to this Creative Project and remain active.');
    return {kind,proofVersionId:null,creativeEventId:eventId,note:`Approved sample references Creative Process event #${eventId}.`};
  }
  throw new Error('Approved sample requires an exact approved proof version or exact Creative Process event.');
}

export async function onRequestGet({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  const u=new URL(request.url);
  const projectId=id(u.searchParams.get('project_id')),requestId=id(u.searchParams.get('request_id')),lifecycleId=id(u.searchParams.get('lifecycle_id'));
  return json({ok:true,...await bundle(a.db,{projectId,requestId,lifecycleId})});
}

export async function onRequestPost({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  let body={};try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=clean(body.action,60).toLowerCase(),userId=id(a.admin.user_id)||null;

  if(action==='save_link'){
    const projectId=id(body.creative_work_project_id),requestId=id(body.custom_request_id);
    if(!projectId&&!requestId)return json({ok:false,error:'Choose an existing Creative Project, Custom Request, or both.'},400);
    if(projectId&&!(await project(a.db,projectId)))return json({ok:false,error:'Creative Project was not found.'},404);
    if(requestId&&!(await customRequest(a.db,requestId)))return json({ok:false,error:'Custom Request was not found.'},404);
    const byProject=projectId?await findLifecycle(a.db,{projectId}):null,byRequest=requestId?await findLifecycle(a.db,{requestId}):null;
    if(byProject&&byRequest&&id(byProject.creative_project_manufacturing_lifecycle_id)!==id(byRequest.creative_project_manufacturing_lifecycle_id)){
      return json({ok:false,error:'The selected Creative Project and Custom Request already belong to different manufacturing lifecycle records.'},409);
    }
    let lifecycle=byProject||byRequest;
    if(!lifecycle){
      const ins=await a.db.prepare(`INSERT INTO creative_project_manufacturing_lifecycles(
        creative_work_project_id,custom_request_id,current_stage,created_by_user_id,updated_by_user_id,created_at,updated_at)
        VALUES(?,?,'concept',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(projectId||null,requestId||null,userId,userId).run();
      lifecycle=await findLifecycle(a.db,{lifecycleId:id(ins.meta?.last_row_id)});
      await event(a.db,lifecycle,{toStage:'concept',kind:'created',note:'Manufacturing maturity lifecycle created over existing authority.',userId});
    }else{
      await a.db.prepare(`UPDATE creative_project_manufacturing_lifecycles
        SET creative_work_project_id=COALESCE(?,creative_work_project_id),custom_request_id=COALESCE(?,custom_request_id),
            updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
        WHERE creative_project_manufacturing_lifecycle_id=?`)
        .bind(projectId||null,requestId||null,userId,id(lifecycle.creative_project_manufacturing_lifecycle_id)).run();
      lifecycle=await findLifecycle(a.db,{lifecycleId:id(lifecycle.creative_project_manufacturing_lifecycle_id)});
    }
    await audit(env,request,a.admin,lifecycle,'link',{creative_work_project_id:projectId||null,custom_request_id:requestId||null});
    return json({ok:true,message:'Manufacturing lifecycle linked to the existing authorities.',...await bundle(a.db,{lifecycleId:id(lifecycle.creative_project_manufacturing_lifecycle_id)})});
  }

  if(action!=='transition')return json({ok:false,error:'Unsupported Build 214 action.'},400);
  let lifecycle=await findLifecycle(a.db,{lifecycleId:id(body.creative_project_manufacturing_lifecycle_id)});
  if(!lifecycle)return json({ok:false,error:'Choose an existing manufacturing lifecycle.'},404);
  const from=String(lifecycle.current_stage||'concept'),to=clean(body.to_stage,60);
  if(!allowedManufacturingTransitions(from).includes(to))return json({ok:false,error:`Transition from ${STAGE_LABELS[from]||from} to ${STAGE_LABELS[to]||to} is not allowed.`},409);
  const note=clean(body.event_note,1600)||null;
  if(['prototype_failed_rework','qa_rework'].includes(to)&&(!note||note.length<4))return json({ok:false,error:'Failure/rework transitions require a short evidence note.'},400);

  let kind='advance',proofVersionId=null,creativeEventId=null;
  if(to==='prototype_failed_rework')kind='failure_rework';
  if(to==='qa_rework')kind='qa_rework';
  if(to==='completed')kind='completion';

  if(to==='approved_sample'){
    const ev=await validateApprovedSampleEvidence(a.db,lifecycle,body);
    proofVersionId=ev.proofVersionId;creativeEventId=ev.creativeEventId;kind='sample_approval';
    await a.db.prepare(`UPDATE creative_project_manufacturing_lifecycles SET
      current_stage='approved_sample',approved_sample_evidence_kind=?,approved_sample_proof_version_id=?,
      approved_sample_creative_work_event_id=?,approved_sample_note=?,approved_sample_at=CURRENT_TIMESTAMP,
      production_authorization_note=NULL,production_authorized_by_user_id=NULL,production_authorized_at=NULL,
      updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
      WHERE creative_project_manufacturing_lifecycle_id=?`)
      .bind(ev.kind,proofVersionId,creativeEventId,note||ev.note,userId,id(lifecycle.creative_project_manufacturing_lifecycle_id)).run();
  }else if(to==='production_authorized'){
    const readiness=await loadManufacturingMaturityReadiness(a.db,id(lifecycle.creative_project_manufacturing_lifecycle_id));
    if(!readiness?.approved_sample_evidence_present)return json({ok:false,error:'Production cannot be authorized without exact approved-sample evidence.'},409);
    if(readiness.custom_request_proof_readiness?.proof_required&&!readiness.custom_request_proof_readiness.production_ready){
      return json({ok:false,error:'Production authorization is blocked by the Build 213 proof-readiness gate.',blockers:readiness.custom_request_proof_readiness.blockers||[]},409);
    }
    kind='production_authorization';
    await a.db.prepare(`UPDATE creative_project_manufacturing_lifecycles SET current_stage='production_authorized',
      production_authorization_note=?,production_authorized_by_user_id=?,production_authorized_at=CURRENT_TIMESTAMP,
      updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_project_manufacturing_lifecycle_id=?`)
      .bind(note||'Explicit human production authorization.',userId,userId,id(lifecycle.creative_project_manufacturing_lifecycle_id)).run();
  }else if(to==='sample_candidate'&&['approved_sample','production_authorized'].includes(from)){
    kind='sample_superseded';
    proofVersionId=id(lifecycle.approved_sample_proof_version_id)||null;
    creativeEventId=id(lifecycle.approved_sample_creative_work_event_id)||null;
    await a.db.prepare(`UPDATE creative_project_manufacturing_lifecycles SET current_stage='sample_candidate',
      approved_sample_evidence_kind=NULL,approved_sample_proof_version_id=NULL,approved_sample_creative_work_event_id=NULL,
      approved_sample_note=NULL,approved_sample_at=NULL,production_authorization_note=NULL,
      production_authorized_by_user_id=NULL,production_authorized_at=NULL,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
      WHERE creative_project_manufacturing_lifecycle_id=?`).bind(userId,id(lifecycle.creative_project_manufacturing_lifecycle_id)).run();
  }else{
    await a.db.prepare(`UPDATE creative_project_manufacturing_lifecycles SET current_stage=?,completed_at=CASE WHEN ?='completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
      updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_project_manufacturing_lifecycle_id=?`)
      .bind(to,to,userId,id(lifecycle.creative_project_manufacturing_lifecycle_id)).run();
  }

  lifecycle=await findLifecycle(a.db,{lifecycleId:id(lifecycle.creative_project_manufacturing_lifecycle_id)});
  await event(a.db,lifecycle,{fromStage:from,toStage:to,kind,note,proofVersionId,creativeEventId,userId});
  await audit(env,request,a.admin,lifecycle,'transition',{from_stage:from,to_stage:to,transition_kind:kind,proof_version_id:proofVersionId,creative_work_event_id:creativeEventId});
  return json({ok:true,message:`Manufacturing maturity moved to ${STAGE_LABELS[to]||to}. No production, Inventory, Product-run, payment or publication action was executed.`,...await bundle(a.db,{lifecycleId:id(lifecycle.creative_project_manufacturing_lifecycle_id)})});
}
