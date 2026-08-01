// Build 228 — master Creative Automation Studio orchestration layer.
// Existing project, CAIP, Content Studio, publication and social records remain
// authoritative; this endpoint stores only cross-stage ownership/review state.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText
} from '../_lib/adminAudit.js';

const BUILD='228';
const STAGES=[
  {key:'process',order:10,label:'1. Creative process',route:'/admin/creative-process/',authority:'Creative Process Engine',description:'Idea, scope, timeline, tools, experiments, mistakes, repairs, lessons and intended outputs.',pass:'The project summary and at least one factual timeline entry are saved.',correction:'Open Creative Process, add the missing project facts or timeline evidence, save, and reload this master workflow.'},
  {key:'materials_cost',order:20,label:'2. Materials, inventory and cost',route:'/admin/creative-process/',authority:'Creative Process Engine',description:'Material review, explicit inventory posting/reversal, time, packaging, channel fees, shared cost and profitability.',pass:'Every recorded material is reviewed or the stage is deliberately marked not applicable, and cost assumptions are documented.',correction:'Review each material row, correct quantities/costs, use only audited inventory posting or reversal, then recalculate profitability.'},
  {key:'assets_evidence',order:30,label:'3. Assets, rights and evidence',route:'/admin/creative-assets/',authority:'Creative Asset Intelligence Platform',description:'Source-safe references, rights, privacy, selected evidence, technical observations, derivative plans and story roles.',pass:'Selected evidence exists and rights/privacy are cleared for the intended use.',correction:'Remove or restrict unsafe assets, correct rights/privacy and evidence selection, then repeat the CAIP review without moving source files.'},
  {key:'content_package',order:40,label:'4. Content package',route:'/admin/content-studio/',authority:'Content Automation Studio',description:'Review-first package for long video, shorts, Facebook, Instagram, TikTok, Pinterest, gallery, GBP, SEO, blog, thumbnails and captions.',pass:'A source-linked Content Studio project and its required deliverable plan exist.',correction:'Create or refresh the reviewed handoff from Creative Process, restore missing deliverables, and correct source links before approval.'},
  {key:'channel_review',order:50,label:'5. Channel drafts and approvals',route:'/admin/content-studio/',authority:'Content Studio and Social Publishing',description:'Channel-specific formats, captions, media, privacy, UTM links, approval states and provider-ready drafts.',pass:'Every intended channel deliverable is approved or explicitly not applicable; no provider action is falsely shown as published.',correction:'Return inaccurate or incomplete drafts to changes requested, correct facts/media/privacy, and repeat human approval.'},
  {key:'public_release',order:60,label:'6. Public release',route:'/admin/content-publications/',authority:'Content Release Board',description:'Workshop Journal/gallery draft, public-cleared media, factual copy, slug, explicit publish/unpublish and release history.',pass:'The intended public record passed its own release checks and has an observable publish or approved-draft result.',correction:'Unpublish or keep the draft private, correct the failed release requirement in its source authority, then reapprove deliberately.'},
  {key:'measure_repurpose',order:70,label:'7. Measure, learn and repurpose',route:'/admin/social-publishing/',authority:'Analytics, project outputs and reviewed knowledge',description:'Record public URLs/provider IDs, results, lessons, recommendations and safe repurpose decisions without inventing performance.',pass:'At least one finished output has factual result evidence and reviewed lessons or next-use notes.',correction:'Correct missing tracking or result evidence, avoid inferred success, record the actual outcome, and update the next experiment.'}
];
const STAGE_KEYS=new Set(STAGES.map((stage)=>stage.key));
const WORKFLOW_STATUSES=new Set(['planning','in_progress','blocked','ready_for_release','released','archived']);
const REVIEW_STATUSES=new Set(['not_started','in_progress','blocked','needs_review','complete','not_applicable']);

function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function id(value){const n=Number(value||0);return Number.isInteger(n)&&n>0?n:0;}
function text(value,max=5000){return normalizeText(value).slice(0,max);}

async function ensureSchema(db){
  const statements=[
    `CREATE TABLE IF NOT EXISTS creative_automation_workflows (
      creative_automation_workflow_id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_key TEXT NOT NULL UNIQUE,
      creative_work_project_id INTEGER NOT NULL UNIQUE,
      workflow_status TEXT NOT NULL DEFAULT 'planning',
      current_stage_key TEXT NOT NULL DEFAULT 'process',
      owner_user_id INTEGER, due_date TEXT, blocked_reason TEXT, operator_notes TEXT,
      created_by_user_id INTEGER, updated_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_automation_stage_reviews (
      creative_automation_stage_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_automation_workflow_id INTEGER NOT NULL,
      stage_key TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'not_started',
      evidence_reference TEXT, review_notes TEXT, reviewed_by_user_id INTEGER, reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(creative_automation_workflow_id,stage_key),
      FOREIGN KEY(creative_automation_workflow_id) REFERENCES creative_automation_workflows(creative_automation_workflow_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_automation_events (
      creative_automation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_automation_workflow_id INTEGER NOT NULL,
      event_type TEXT NOT NULL, stage_key TEXT, previous_status TEXT, next_status TEXT,
      details_json TEXT, created_by_user_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creative_automation_workflow_id) REFERENCES creative_automation_workflows(creative_automation_workflow_id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_creative_automation_workflows_status ON creative_automation_workflows(workflow_status,current_stage_key,updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_automation_stage_reviews_workflow ON creative_automation_stage_reviews(creative_automation_workflow_id,stage_key,review_status)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_automation_events_workflow ON creative_automation_events(creative_automation_workflow_id,created_at DESC)`
  ];
  for(const statement of statements) await db.prepare(statement).run();
}

async function safeFirst(db,sql,bindings=[]){
  try{return await db.prepare(sql).bind(...bindings).first();}
  catch{return null;}
}
async function safeAll(db,sql,bindings=[]){
  try{return (await db.prepare(sql).bind(...bindings).all()).results||[];}
  catch{return [];}
}
async function safeCount(db,table,column,value,extra=''){
  const allowed=new Set([
    'creative_work_events','creative_work_outputs','creative_project_material_reviews','creative_project_evidence_selections',
    'content_project_media','content_project_deliverables','content_publications','content_publication_events'
  ]);
  if(!allowed.has(table)) return 0;
  const row=await safeFirst(db,`SELECT COUNT(*) total FROM ${table} WHERE ${column}=?1 ${extra}`,[value]);
  return Number(row?.total||0);
}

async function ensureWorkflow(db,projectId,userId){
  const project=await safeFirst(db,'SELECT creative_work_project_id FROM creative_work_projects WHERE creative_work_project_id=?1',[projectId]);
  if(!project) throw Object.assign(new Error('Creative project was not found.'),{code:'NOT_FOUND'});
  await db.prepare(`INSERT OR IGNORE INTO creative_automation_workflows (
    workflow_key,creative_work_project_id,created_by_user_id,updated_by_user_id,created_at,updated_at
  ) VALUES (?1,?2,?3,?3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(`creative-${projectId}`,projectId,userId||null).run();
  return db.prepare('SELECT * FROM creative_automation_workflows WHERE creative_work_project_id=?1').bind(projectId).first();
}

async function projectDetail(db,project){
  const projectId=id(project.creative_work_project_id);
  const workflow=project.creative_automation_workflow_id?project:null;
  const handoff=await safeFirst(db,'SELECT content_project_id,handoff_status,evidence_count FROM creative_project_content_handoffs WHERE creative_work_project_id=?1 ORDER BY creative_project_content_handoff_id DESC LIMIT 1',[projectId]);
  const mirror=await safeFirst(db,'SELECT creative_project_id,mirror_status,evidence_count FROM creative_project_caip_mirrors WHERE creative_work_project_id=?1 ORDER BY creative_project_caip_mirror_id DESC LIMIT 1',[projectId]);
  const contentId=id(handoff?.content_project_id);
  const caipId=id(mirror?.creative_project_id);
  const eventCount=await safeCount(db,'creative_work_events','creative_work_project_id',projectId);
  const materialCount=await safeCount(db,'creative_work_events','creative_work_project_id',projectId,"AND TRIM(COALESCE(material_name,''))<>''");
  const reviewedMaterials=await safeCount(db,'creative_project_material_reviews','creative_work_project_id',projectId,"AND review_status='approved'");
  const evidenceCount=await safeCount(db,'creative_project_evidence_selections','creative_work_project_id',projectId,'AND selected=1');
  const outputCount=await safeCount(db,'creative_work_outputs','creative_work_project_id',projectId);
  const completedOutputs=await safeCount(db,'creative_work_outputs','creative_work_project_id',projectId,"AND output_status='complete'");
  const mediaCount=contentId?await safeCount(db,'content_project_media','content_project_id',contentId):0;
  const deliverableCount=contentId?await safeCount(db,'content_project_deliverables','content_project_id',contentId):0;
  const approvedDeliverables=contentId?await safeCount(db,'content_project_deliverables','content_project_id',contentId,"AND approval_status='approved'"):0;
  const publicationCount=contentId?await safeCount(db,'content_publications','content_project_id',contentId):0;
  const releasedCount=contentId?await safeCount(db,'content_publications','content_project_id',contentId,"AND publication_status IN ('published','approved')"):0;
  const reviews=workflow?await safeAll(db,'SELECT * FROM creative_automation_stage_reviews WHERE creative_automation_workflow_id=?1',[workflow.creative_automation_workflow_id]):[];
  const reviewMap=Object.fromEntries(reviews.map((row)=>[row.stage_key,row]));
  const facts={event_count:eventCount,material_count:materialCount,reviewed_material_count:reviewedMaterials,evidence_count:evidenceCount,output_count:outputCount,completed_output_count:completedOutputs,content_project_id:contentId,content_media_count:mediaCount,deliverable_count:deliverableCount,approved_deliverable_count:approvedDeliverables,caip_project_id:caipId,caip_mirror_status:mirror?.mirror_status||'',publication_count:publicationCount,released_publication_count:releasedCount};
  const sourceReady={
    process:!!text(project.summary,10)&&eventCount>0,
    materials_cost:materialCount===0||reviewedMaterials>=materialCount,
    assets_evidence:evidenceCount>0&&project.rights_status==='cleared',
    content_package:contentId>0&&deliverableCount>0,
    channel_review:deliverableCount>0&&approvedDeliverables>=deliverableCount,
    public_release:publicationCount>0&&releasedCount>0,
    measure_repurpose:completedOutputs>0&&releasedCount>0
  };
  const stages=STAGES.map((stage)=>{
    const review=reviewMap[stage.key]||{review_status:'not_started',evidence_reference:'',review_notes:''};
    const complete=review.review_status==='complete'&&sourceReady[stage.key];
    return {...stage,...review,source_ready:sourceReady[stage.key]?1:0,effective_status:complete?'complete':review.review_status==='complete'?'needs_source_evidence':review.review_status};
  });
  return {project,workflow:workflow?.creative_automation_workflow_id?workflow:null,handoff,mirror,facts,stages};
}

async function payload(db,selectedId=0){
  const projects=await safeAll(db,`SELECT p.*,w.creative_automation_workflow_id,w.workflow_key,w.workflow_status,w.current_stage_key,
    w.owner_user_id,w.due_date,w.blocked_reason,w.operator_notes,w.updated_at workflow_updated_at
    FROM creative_work_projects p
    LEFT JOIN creative_automation_workflows w ON w.creative_work_project_id=p.creative_work_project_id
    ORDER BY p.updated_at DESC,p.creative_work_project_id DESC LIMIT 150`);
  const chosen=selectedId?projects.find((row)=>id(row.creative_work_project_id)===selectedId):projects[0];
  const detail=chosen?await projectDetail(db,chosen):null;
  const events=detail?.workflow?await safeAll(db,'SELECT * FROM creative_automation_events WHERE creative_automation_workflow_id=?1 ORDER BY created_at DESC,creative_automation_event_id DESC LIMIT 30',[detail.workflow.creative_automation_workflow_id]):[];
  const tracked=projects.filter((row)=>row.creative_automation_workflow_id).length;
  return {ok:true,build:BUILD,mode:'one_master_process_specialist_authorities_preserved',stage_definitions:STAGES,projects,detail,recent_events:events,stats:{projects:projects.length,tracked,untracked:projects.length-tracked,blocked:projects.filter((row)=>row.workflow_status==='blocked').length,ready:projects.filter((row)=>row.workflow_status==='ready_for_release').length,released:projects.filter((row)=>row.workflow_status==='released').length}};
}

async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser) return {error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env);
  if(!db) return {error:json({ok:false,error:'Database binding is not configured.'},503)};
  return {adminUser,db};
}

export async function onRequestGet(context){
  const granted=await access(context);if(granted.error)return granted.error;
  try{
    await ensureSchema(granted.db);
    const selected=id(new URL(context.request.url).searchParams.get('project_id'));
    return json(await payload(granted.db,selected));
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'creative_automation',incident_code:'creative_automation_load_failed',severity:'error',message:error?.message||'Creative Automation Studio failed to load.',related_user_id:granted.adminUser.user_id,details:{build:BUILD}});
    return json({ok:false,error:'Creative Automation Studio could not load. Existing specialist workspaces remain available.',fallback_routes:STAGES.map(({key,label,route})=>({key,label,route}))},503);
  }
}

export async function onRequestPost(context){
  const granted=await access(context);if(granted.error)return granted.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Expected a JSON request body.'},400);}
  try{
    await ensureSchema(granted.db);
    const projectId=id(body.project_id);
    if(!projectId) return json({ok:false,error:'Choose a Creative Project first.'},400);
    const workflow=await ensureWorkflow(granted.db,projectId,granted.adminUser.user_id);
    const action=text(body.action,80);
    if(action==='ensure_workflow'){
      await granted.db.prepare(`INSERT INTO creative_automation_events (creative_automation_workflow_id,event_type,stage_key,next_status,details_json,created_by_user_id) VALUES (?1,'workflow_linked','process','planning',?2,?3)`).bind(workflow.creative_automation_workflow_id,JSON.stringify({project_id:projectId}),granted.adminUser.user_id).run();
    }else if(action==='save_workflow'){
      const workflowStatus=text(body.workflow_status,40);const currentStage=text(body.current_stage_key,80);
      if(!WORKFLOW_STATUSES.has(workflowStatus)||!STAGE_KEYS.has(currentStage)) return json({ok:false,error:'Choose a valid workflow status and stage.'},400);
      const blockedReason=text(body.blocked_reason,2000);if(workflowStatus==='blocked'&&!blockedReason)return json({ok:false,error:'A blocked workflow requires the exact blocker and next action.'},400);
      await granted.db.prepare(`UPDATE creative_automation_workflows SET workflow_status=?1,current_stage_key=?2,due_date=?3,blocked_reason=?4,operator_notes=?5,owner_user_id=?6,updated_by_user_id=?6,updated_at=CURRENT_TIMESTAMP WHERE creative_automation_workflow_id=?7`).bind(workflowStatus,currentStage,text(body.due_date,30)||null,blockedReason||null,text(body.operator_notes,5000)||null,granted.adminUser.user_id,workflow.creative_automation_workflow_id).run();
      await granted.db.prepare(`INSERT INTO creative_automation_events (creative_automation_workflow_id,event_type,stage_key,previous_status,next_status,details_json,created_by_user_id) VALUES (?1,'workflow_updated',?2,?3,?4,?5,?6)`).bind(workflow.creative_automation_workflow_id,currentStage,workflow.workflow_status,workflowStatus,JSON.stringify({due_date:text(body.due_date,30),blocked:!!blockedReason}),granted.adminUser.user_id).run();
    }else if(action==='save_stage_review'){
      const stageKey=text(body.stage_key,80);const reviewStatus=text(body.review_status,40);const evidence=text(body.evidence_reference,1000);const notes=text(body.review_notes,5000);
      if(!STAGE_KEYS.has(stageKey)||!REVIEW_STATUSES.has(reviewStatus)) return json({ok:false,error:'Choose a valid stage and review status.'},400);
      if(reviewStatus==='complete'&&!evidence)return json({ok:false,error:'A completed stage requires a safe evidence reference or URL.'},400);
      if(reviewStatus==='blocked'&&!notes)return json({ok:false,error:'A blocked stage requires the failure and next corrective action in Review notes.'},400);
      const previous=await safeFirst(granted.db,'SELECT review_status FROM creative_automation_stage_reviews WHERE creative_automation_workflow_id=?1 AND stage_key=?2',[workflow.creative_automation_workflow_id,stageKey]);
      await granted.db.prepare(`INSERT INTO creative_automation_stage_reviews (creative_automation_workflow_id,stage_key,review_status,evidence_reference,review_notes,reviewed_by_user_id,reviewed_at,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(creative_automation_workflow_id,stage_key) DO UPDATE SET review_status=excluded.review_status,evidence_reference=excluded.evidence_reference,review_notes=excluded.review_notes,reviewed_by_user_id=excluded.reviewed_by_user_id,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(workflow.creative_automation_workflow_id,stageKey,reviewStatus,evidence||null,notes||null,granted.adminUser.user_id).run();
      await granted.db.prepare(`INSERT INTO creative_automation_events (creative_automation_workflow_id,event_type,stage_key,previous_status,next_status,details_json,created_by_user_id) VALUES (?1,'stage_reviewed',?2,?3,?4,?5,?6)`).bind(workflow.creative_automation_workflow_id,stageKey,previous?.review_status||'not_started',reviewStatus,JSON.stringify({evidence_recorded:!!evidence}),granted.adminUser.user_id).run();
    }else return json({ok:false,error:'Unsupported Creative Automation action.'},400);
    await auditAdminAction(context.env,context.request,granted.adminUser,{action_type:`creative_automation_${action}`,target_type:'creative_automation_workflow',target_id:workflow.creative_automation_workflow_id,target_key:workflow.workflow_key,details:{project_id:projectId,stage_key:text(body.stage_key,80)||null}});
    return json({...await payload(granted.db,projectId),message:action==='ensure_workflow'?'Project added to the master Creative Automation workflow.':'Creative Automation workflow saved.'});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'creative_automation',incident_code:'creative_automation_save_failed',severity:'error',message:error?.message||'Creative Automation Studio could not save.',related_user_id:granted.adminUser.user_id,details:{action:text(body.action,80),project_id:id(body.project_id)}});
    return json({ok:false,error:error?.message||'Creative Automation Studio could not save.'},error?.code==='NOT_FOUND'?404:500);
  }
}
