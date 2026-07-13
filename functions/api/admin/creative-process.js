// Build 213 — project-first Creative Process Engine foundation.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '213';
const OUTPUTS = [
  ['youtube_video','YouTube video','video'], ['youtube_shorts','YouTube Shorts','video'],
  ['instagram_reels','Instagram Reels','social'], ['tiktok_videos','TikToks','social'],
  ['facebook_videos','Facebook videos','social'], ['pinterest_pins','Pinterest Pins','social'],
  ['etsy_listing','Etsy listing draft','marketplace'], ['website_product','Website product page','commerce'],
  ['blog_article','Blog article','article'], ['photo_gallery','Photo gallery','gallery'],
  ['before_after','Before / After','gallery'], ['educational_article','Educational article','article'],
  ['project_archive','Project archive','archive'], ['material_usage','Material usage report','operations'],
  ['cost_analysis','Cost analysis','operations'], ['lessons_learned','Lessons learned','knowledge'],
  ['future_recommendations','Future project recommendations','knowledge']
];
function json(data,status=200){ return jsonResponse(data,status,{'Cache-Control':'no-store'}); }
function num(value){ const n=Number(value||0); return Number.isInteger(n)&&n>0?n:0; }
function text(value,max=4000){ return normalizeText(value).slice(0,max); }

async function ensureSchema(db){
  const statements = [
    `CREATE TABLE IF NOT EXISTS creative_work_projects (
      creative_work_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_key TEXT NOT NULL UNIQUE,
      project_title TEXT NOT NULL,
      project_type TEXT NOT NULL DEFAULT 'maker_project',
      project_status TEXT NOT NULL DEFAULT 'idea',
      summary TEXT, objective TEXT, story_angle TEXT, product_id INTEGER,
      started_at TEXT, completed_at TEXT, total_minutes INTEGER NOT NULL DEFAULT 0,
      estimated_cost_cents INTEGER NOT NULL DEFAULT 0, actual_cost_cents INTEGER NOT NULL DEFAULT 0,
      privacy_status TEXT NOT NULL DEFAULT 'internal', rights_status TEXT NOT NULL DEFAULT 'needs_review',
      created_by INTEGER, updated_by INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS creative_work_events (
      creative_work_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'note', event_title TEXT NOT NULL,
      event_notes TEXT, occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      material_name TEXT, material_quantity REAL, material_unit TEXT, material_cost_cents INTEGER NOT NULL DEFAULT 0,
      media_url TEXT, is_public_candidate INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_work_outputs (
      creative_work_output_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL,
      output_key TEXT NOT NULL, output_label TEXT NOT NULL, output_group TEXT NOT NULL,
      output_status TEXT NOT NULL DEFAULT 'planned', approval_status TEXT NOT NULL DEFAULT 'needs_review',
      linked_record_type TEXT, linked_record_id INTEGER, output_url TEXT, notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(creative_work_project_id, output_key),
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_creative_work_projects_status ON creative_work_projects(project_status)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_work_events_project ON creative_work_events(creative_work_project_id, occurred_at)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_work_outputs_project ON creative_work_outputs(creative_work_project_id, output_status)`
  ];
  for (const sql of statements) await db.prepare(sql).run();
}
async function requireAdmin(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser) return {error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env); if(!db) return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  return {adminUser,db};
}
async function listProjects(db){
  const rows=await db.prepare(`SELECT p.*, COUNT(DISTINCT e.creative_work_event_id) event_count,
    COUNT(DISTINCT o.creative_work_output_id) output_count,
    SUM(CASE WHEN o.output_status='complete' THEN 1 ELSE 0 END) completed_output_count
    FROM creative_work_projects p
    LEFT JOIN creative_work_events e ON e.creative_work_project_id=p.creative_work_project_id
    LEFT JOIN creative_work_outputs o ON o.creative_work_project_id=p.creative_work_project_id
    GROUP BY p.creative_work_project_id ORDER BY p.updated_at DESC, p.creative_work_project_id DESC`).all();
  return rows.results||[];
}
async function detail(db,id){
  const project=await db.prepare(`SELECT * FROM creative_work_projects WHERE creative_work_project_id=?1`).bind(id).first();
  if(!project) return null;
  const events=await db.prepare(`SELECT * FROM creative_work_events WHERE creative_work_project_id=?1 ORDER BY occurred_at DESC, creative_work_event_id DESC`).bind(id).all();
  const outputs=await db.prepare(`SELECT * FROM creative_work_outputs WHERE creative_work_project_id=?1 ORDER BY output_group, creative_work_output_id`).bind(id).all();
  const totals=await db.prepare(`SELECT COALESCE(SUM(duration_minutes),0) tracked_minutes, COALESCE(SUM(material_cost_cents),0) tracked_material_cost_cents FROM creative_work_events WHERE creative_work_project_id=?1`).bind(id).first();
  return {project,events:events.results||[],outputs:outputs.results||[],totals:totals||{}};
}
async function seedOutputs(db,id){
  for(const [key,label,group] of OUTPUTS){
    await db.prepare(`INSERT OR IGNORE INTO creative_work_outputs (creative_work_project_id,output_key,output_label,output_group) VALUES (?1,?2,?3,?4)`).bind(id,key,label,group).run();
  }
}
export async function onRequestGet(context){
  const access=await requireAdmin(context); if(access.error) return access.error;
  try{
    await ensureSchema(access.db);
    const id=num(new URL(context.request.url).searchParams.get('project_id'));
    return json({ok:true,build:BUILD,projects:await listProjects(access.db),detail:id?await detail(access.db,id):null,output_blueprint:OUTPUTS.map(([key,label,group])=>({key,label,group})),mode:'project_first_review_first'});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'creative_process_engine',incident_code:'creative_process_get_failed',severity:'error',message:error?.message||'Creative Process Engine failed to load.',related_user_id:access.adminUser.user_id,details:{error:String(error?.stack||error)}});
    return json({ok:false,error:'Creative Process Engine could not load.'},500);
  }
}
export async function onRequestPost(context){
  const access=await requireAdmin(context); if(access.error) return access.error;
  let body={}; try{body=await context.request.json();}catch{}
  const action=text(body.action,80).toLowerCase();
  try{
    await ensureSchema(access.db);
    let projectId=num(body.creative_work_project_id||body.project_id); let message='Saved.';
    if(action==='create_project'){
      const title=text(body.project_title,180); if(!title) throw new Error('Project title is required.');
      const key=`CP-${Date.now().toString(36).toUpperCase()}`;
      const result=await access.db.prepare(`INSERT INTO creative_work_projects (project_key,project_title,project_type,project_status,summary,objective,story_angle,product_id,privacy_status,rights_status,created_by,updated_by) VALUES (?1,?2,?3,'idea',?4,?5,?6,?7,'internal','needs_review',?8,?8)`).bind(key,title,text(body.project_type,60)||'maker_project',text(body.summary),text(body.objective),text(body.story_angle),num(body.product_id)||null,access.adminUser.user_id).run();
      projectId=num(result.meta?.last_row_id); await seedOutputs(access.db,projectId); message='Creative Project created with the complete output blueprint.';
    }else if(action==='update_project'){
      if(!projectId) throw new Error('Project is required.');
      await access.db.prepare(`UPDATE creative_work_projects SET project_title=?2,project_type=?3,project_status=?4,summary=?5,objective=?6,story_angle=?7,product_id=?8,started_at=?9,completed_at=?10,total_minutes=?11,estimated_cost_cents=?12,actual_cost_cents=?13,privacy_status=?14,rights_status=?15,updated_by=?16,updated_at=CURRENT_TIMESTAMP WHERE creative_work_project_id=?1`).bind(projectId,text(body.project_title,180),text(body.project_type,60)||'maker_project',text(body.project_status,40)||'idea',text(body.summary),text(body.objective),text(body.story_angle),num(body.product_id)||null,text(body.started_at,40)||null,text(body.completed_at,40)||null,Math.max(0,Number(body.total_minutes||0)),Math.max(0,Number(body.estimated_cost_cents||0)),Math.max(0,Number(body.actual_cost_cents||0)),text(body.privacy_status,40)||'internal',text(body.rights_status,40)||'needs_review',access.adminUser.user_id).run();
      message='Project overview saved.';
    }else if(action==='add_event'){
      if(!projectId) throw new Error('Project is required.');
      const title=text(body.event_title,180); if(!title) throw new Error('Event title is required.');
      await access.db.prepare(`INSERT INTO creative_work_events (creative_work_project_id,event_type,event_title,event_notes,occurred_at,duration_minutes,material_name,material_quantity,material_unit,material_cost_cents,media_url,is_public_candidate,created_by) VALUES (?1,?2,?3,?4,COALESCE(?5,CURRENT_TIMESTAMP),?6,?7,?8,?9,?10,?11,?12,?13)`).bind(projectId,text(body.event_type,50)||'note',title,text(body.event_notes),text(body.occurred_at,40)||null,Math.max(0,Number(body.duration_minutes||0)),text(body.material_name,180)||null,Number(body.material_quantity||0)||null,text(body.material_unit,40)||null,Math.max(0,Number(body.material_cost_cents||0)),text(body.media_url,1000)||null,Number(body.is_public_candidate||0)===1?1:0,access.adminUser.user_id).run();
      message='Timeline entry added.';
    }else if(action==='update_output'){
      if(!projectId||!num(body.creative_work_output_id)) throw new Error('Project output is required.');
      await access.db.prepare(`UPDATE creative_work_outputs SET output_status=?3,approval_status=?4,linked_record_type=?5,linked_record_id=?6,output_url=?7,notes=?8,updated_at=CURRENT_TIMESTAMP WHERE creative_work_project_id=?1 AND creative_work_output_id=?2`).bind(projectId,num(body.creative_work_output_id),text(body.output_status,40)||'planned',text(body.approval_status,40)||'needs_review',text(body.linked_record_type,80)||null,num(body.linked_record_id)||null,text(body.output_url,1000)||null,text(body.notes)).run();
      message='Output status saved.';
    }else if(action==='seed_outputs'){
      if(!projectId) throw new Error('Project is required.'); await seedOutputs(access.db,projectId); message='Missing output plans restored.';
    }else throw new Error('Unsupported Creative Process action.');
    const current=await detail(access.db,projectId);
    await auditAdminAction(context.env,context.request,access.adminUser,{action_type:`creative_process_${action}`,target_type:'creative_work_project',target_id:projectId,target_key:current?.project?.project_key||null,details:{review_first:true,automatic_publish:false}});
    return json({ok:true,message,build:BUILD,projects:await listProjects(access.db),detail:current,mode:'project_first_review_first'});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'creative_process_engine',incident_code:'creative_process_post_failed',severity:'warning',message:error?.message||'Creative Process save failed.',related_user_id:access.adminUser.user_id,details:{action,error:String(error?.stack||error)}});
    return json({ok:false,error:error?.message||'Creative Process save failed.'},400);
  }
}
