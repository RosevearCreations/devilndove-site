// Build 213 — project-first Creative Process Engine foundation.
import { createOrRefreshContentProjectForProduct, ensureContentAutomationSchema } from '../_lib/contentAutomationStudio.js';
import { ensureCreativeAssetIntelligenceSchema, syncCreativeProjectFromContentProject } from '../_lib/creativeAssetIntelligence.js';
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '216';
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
    `CREATE INDEX IF NOT EXISTS idx_creative_work_outputs_project ON creative_work_outputs(creative_work_project_id, output_status)`,
    `CREATE TABLE IF NOT EXISTS creative_project_product_links (
      creative_project_product_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL, product_id INTEGER NOT NULL,
      relationship_type TEXT NOT NULL DEFAULT 'project_output',
      is_primary INTEGER NOT NULL DEFAULT 0, notes TEXT,
      created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(creative_work_project_id, product_id),
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_creative_project_product_links_project ON creative_project_product_links(creative_work_project_id, is_primary)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_project_product_links_product ON creative_project_product_links(product_id)`,
    `CREATE TABLE IF NOT EXISTS creative_project_evidence_selections (
      creative_project_evidence_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL, creative_work_event_id INTEGER NOT NULL,
      evidence_role TEXT NOT NULL DEFAULT 'process_evidence', selected INTEGER NOT NULL DEFAULT 1,
      review_notes TEXT, reviewed_by INTEGER, reviewed_at TEXT,
      UNIQUE(creative_work_project_id, creative_work_event_id),
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
      FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_project_material_reviews (
      creative_project_material_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL, creative_work_event_id INTEGER NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'pending', actual_quantity REAL, waste_quantity REAL,
      reusable_quantity REAL, approved_cost_cents INTEGER NOT NULL DEFAULT 0, review_notes TEXT,
      inventory_consumed INTEGER NOT NULL DEFAULT 0, reviewed_by INTEGER, reviewed_at TEXT,
      UNIQUE(creative_work_project_id, creative_work_event_id),
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
      FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_project_profitability (
      creative_work_project_id INTEGER PRIMARY KEY, labour_rate_cents INTEGER NOT NULL DEFAULT 0,
      packaging_cost_cents INTEGER NOT NULL DEFAULT 0, overhead_cost_cents INTEGER NOT NULL DEFAULT 0,
      channel_fee_cents INTEGER NOT NULL DEFAULT 0, shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
      revenue_cents INTEGER NOT NULL DEFAULT 0, estimated_content_value_cents INTEGER NOT NULL DEFAULT 0,
      notes TEXT, updated_by INTEGER, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_project_content_handoffs (
      creative_project_content_handoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL, content_project_id INTEGER,
      handoff_status TEXT NOT NULL DEFAULT 'draft', evidence_count INTEGER NOT NULL DEFAULT 0,
      package_json TEXT NOT NULL, created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_project_inventory_posts (
      creative_project_inventory_post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL,
      creative_work_event_id INTEGER NOT NULL,
      creative_project_material_review_id INTEGER NOT NULL,
      site_item_inventory_id INTEGER NOT NULL,
      stock_quantity_consumed INTEGER NOT NULL,
      previous_on_hand_quantity INTEGER NOT NULL,
      new_on_hand_quantity INTEGER NOT NULL,
      posting_status TEXT NOT NULL DEFAULT 'posted',
      reversal_post_id INTEGER,
      posted_by INTEGER,
      posted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(creative_project_material_review_id),
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
      FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE,
      FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_creative_project_inventory_posts_project ON creative_project_inventory_posts(creative_work_project_id, posted_at DESC)`,
    `CREATE TABLE IF NOT EXISTS creative_project_caip_mirrors (
      creative_project_caip_mirror_id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_work_project_id INTEGER NOT NULL,
      creative_project_id INTEGER NOT NULL,
      source_handoff_id INTEGER,
      evidence_count INTEGER NOT NULL DEFAULT 0,
      mirror_status TEXT NOT NULL DEFAULT 'needs_review',
      mirrored_by INTEGER,
      mirrored_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(creative_work_project_id, creative_project_id),
      FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS creative_project_cost_templates (
      creative_project_cost_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_name TEXT NOT NULL UNIQUE,
      labour_rate_cents INTEGER NOT NULL DEFAULT 0,
      packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
      overhead_cost_cents INTEGER NOT NULL DEFAULT 0,
      channel_fee_percent REAL NOT NULL DEFAULT 0,
      shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
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
  const linked=await db.prepare(`SELECT l.creative_project_product_link_id,l.product_id,l.relationship_type,l.is_primary,l.notes,p.product_number,p.name,p.slug,p.sku,p.status,p.review_status,p.featured_image_url FROM creative_project_product_links l JOIN products p ON p.product_id=l.product_id WHERE l.creative_work_project_id=?1 ORDER BY l.is_primary DESC,p.updated_at DESC,p.product_id DESC`).bind(id).all();
  const evidence=await db.prepare(`SELECT s.*,e.event_type,e.event_title,e.event_notes,e.media_url,e.material_name,e.material_quantity,e.material_unit,e.material_cost_cents FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=?1 AND s.selected=1 ORDER BY e.occurred_at,e.creative_work_event_id`).bind(id).all();
  const materials=await db.prepare(`SELECT e.creative_work_event_id,e.event_title,e.material_name,e.material_quantity,e.material_unit,e.material_cost_cents,r.creative_project_material_review_id,r.review_status,r.actual_quantity,r.waste_quantity,r.reusable_quantity,r.approved_cost_cents,r.review_notes,r.inventory_consumed,ip.site_item_inventory_id,ip.stock_quantity_consumed,ip.previous_on_hand_quantity,ip.new_on_hand_quantity,ip.posted_at FROM creative_work_events e LEFT JOIN creative_project_material_reviews r ON r.creative_work_event_id=e.creative_work_event_id AND r.creative_work_project_id=e.creative_work_project_id LEFT JOIN creative_project_inventory_posts ip ON ip.creative_project_material_review_id=r.creative_project_material_review_id WHERE e.creative_work_project_id=?1 AND TRIM(COALESCE(e.material_name,''))<>'' ORDER BY e.occurred_at,e.creative_work_event_id`).bind(id).all();
  const profitability=await db.prepare(`SELECT * FROM creative_project_profitability WHERE creative_work_project_id=?1`).bind(id).first();
  const handoffs=await db.prepare(`SELECT creative_project_content_handoff_id,content_project_id,handoff_status,evidence_count,created_at FROM creative_project_content_handoffs WHERE creative_work_project_id=?1 ORDER BY creative_project_content_handoff_id DESC`).bind(id).all();
  const inventoryItems=await db.prepare(`SELECT site_item_inventory_id,item_name,on_hand_quantity,reserved_quantity,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,unit_cost_cents,do_not_reuse,is_active FROM site_item_inventory WHERE is_active=1 ORDER BY LOWER(item_name),site_item_inventory_id`).all().catch(()=>({results:[]}));
  const caipMirrors=await db.prepare(`SELECT * FROM creative_project_caip_mirrors WHERE creative_work_project_id=?1 ORDER BY mirrored_at DESC`).bind(id).all();
  const costTemplates=await db.prepare(`SELECT * FROM creative_project_cost_templates WHERE is_active=1 ORDER BY LOWER(template_name)`).all();
  return {project,events:events.results||[],outputs:outputs.results||[],totals:totals||{},linked_products:linked.results||[],selected_evidence:evidence.results||[],material_reviews:materials.results||[],profitability:profitability||{},content_handoffs:handoffs.results||[],inventory_items:inventoryItems.results||[],caip_mirrors:caipMirrors.results||[],cost_templates:costTemplates.results||[]};
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
    const url=new URL(context.request.url);
    const id=num(url.searchParams.get('project_id'));
    const productId=num(url.searchParams.get('product_id'));
    let productProjectIds=[];
    if(productId){
      const linked=await access.db.prepare(`SELECT creative_work_project_id FROM creative_project_product_links WHERE product_id=?1 ORDER BY is_primary DESC,creative_work_project_id DESC`).bind(productId).all();
      productProjectIds=(linked.results||[]).map(row=>Number(row.creative_work_project_id||0)).filter(Boolean);
    }
    return json({ok:true,build:BUILD,projects:await listProjects(access.db),detail:id?await detail(access.db,id):null,product_project_ids:productProjectIds,output_blueprint:OUTPUTS.map(([key,label,group])=>({key,label,group})),mode:'project_first_optional_product_links'});
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
      projectId=num(result.meta?.last_row_id); await seedOutputs(access.db,projectId);
      const initialProductId=num(body.product_id);
      if(initialProductId) await access.db.prepare(`INSERT OR IGNORE INTO creative_project_product_links (creative_work_project_id,product_id,relationship_type,is_primary,created_by) VALUES (?1,?2,'project_output',1,?3)`).bind(projectId,initialProductId,access.adminUser.user_id).run();
      message='Creative Project created with the complete output blueprint.';
    }else if(action==='update_project'){
      if(!projectId) throw new Error('Project is required.');
      await access.db.prepare(`UPDATE creative_work_projects SET project_title=?2,project_type=?3,project_status=?4,summary=?5,objective=?6,story_angle=?7,product_id=?8,started_at=?9,completed_at=?10,total_minutes=?11,estimated_cost_cents=?12,actual_cost_cents=?13,privacy_status=?14,rights_status=?15,updated_by=?16,updated_at=CURRENT_TIMESTAMP WHERE creative_work_project_id=?1`).bind(projectId,text(body.project_title,180),text(body.project_type,60)||'maker_project',text(body.project_status,40)||'idea',text(body.summary),text(body.objective),text(body.story_angle),num(body.product_id)||null,text(body.started_at,40)||null,text(body.completed_at,40)||null,Math.max(0,Number(body.total_minutes||0)),Math.max(0,Number(body.estimated_cost_cents||0)),Math.max(0,Number(body.actual_cost_cents||0)),text(body.privacy_status,40)||'internal',text(body.rights_status,40)||'needs_review',access.adminUser.user_id).run();
      const legacyProductId=num(body.product_id);
      if(legacyProductId) await access.db.prepare(`INSERT OR IGNORE INTO creative_project_product_links (creative_work_project_id,product_id,relationship_type,is_primary,created_by) VALUES (?1,?2,'project_output',CASE WHEN EXISTS(SELECT 1 FROM creative_project_product_links WHERE creative_work_project_id=?1) THEN 0 ELSE 1 END,?3)`).bind(projectId,legacyProductId,access.adminUser.user_id).run();
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
    }else if(action==='toggle_evidence'){
      const eventId=num(body.creative_work_event_id); if(!projectId||!eventId) throw new Error('Project event is required.');
      await access.db.prepare(`INSERT INTO creative_project_evidence_selections (creative_work_project_id,creative_work_event_id,evidence_role,selected,review_notes,reviewed_by,reviewed_at) VALUES (?1,?2,?3,?4,?5,?6,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id,creative_work_event_id) DO UPDATE SET evidence_role=excluded.evidence_role,selected=excluded.selected,review_notes=excluded.review_notes,reviewed_by=excluded.reviewed_by,reviewed_at=CURRENT_TIMESTAMP`).bind(projectId,eventId,text(body.evidence_role,60)||'process_evidence',Number(body.selected)===1?1:0,text(body.review_notes,500)||null,access.adminUser.user_id).run();
      message=Number(body.selected)===1?'Timeline evidence selected.':'Timeline evidence removed from the package.';
    }else if(action==='review_material'){
      const eventId=num(body.creative_work_event_id); if(!projectId||!eventId) throw new Error('Material timeline entry is required.');
      await access.db.prepare(`INSERT INTO creative_project_material_reviews (creative_work_project_id,creative_work_event_id,review_status,actual_quantity,waste_quantity,reusable_quantity,approved_cost_cents,review_notes,reviewed_by,reviewed_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id,creative_work_event_id) DO UPDATE SET review_status=excluded.review_status,actual_quantity=excluded.actual_quantity,waste_quantity=excluded.waste_quantity,reusable_quantity=excluded.reusable_quantity,approved_cost_cents=excluded.approved_cost_cents,review_notes=excluded.review_notes,reviewed_by=excluded.reviewed_by,reviewed_at=CURRENT_TIMESTAMP`).bind(projectId,eventId,text(body.review_status,30)||'pending',Number(body.actual_quantity||0),Number(body.waste_quantity||0),Number(body.reusable_quantity||0),Math.max(0,Number(body.approved_cost_cents||0)),text(body.review_notes,500)||null,access.adminUser.user_id).run();
      message='Material usage review saved. Inventory has not been consumed.';
    }else if(action==='save_profitability'){
      if(!projectId) throw new Error('Project is required.');
      await access.db.prepare(`INSERT INTO creative_project_profitability (creative_work_project_id,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,channel_fee_cents,shipping_cost_cents,revenue_cents,estimated_content_value_cents,notes,updated_by,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id) DO UPDATE SET labour_rate_cents=excluded.labour_rate_cents,packaging_cost_cents=excluded.packaging_cost_cents,overhead_cost_cents=excluded.overhead_cost_cents,channel_fee_cents=excluded.channel_fee_cents,shipping_cost_cents=excluded.shipping_cost_cents,revenue_cents=excluded.revenue_cents,estimated_content_value_cents=excluded.estimated_content_value_cents,notes=excluded.notes,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).bind(projectId,Math.max(0,Number(body.labour_rate_cents||0)),Math.max(0,Number(body.packaging_cost_cents||0)),Math.max(0,Number(body.overhead_cost_cents||0)),Math.max(0,Number(body.channel_fee_cents||0)),Math.max(0,Number(body.shipping_cost_cents||0)),Math.max(0,Number(body.revenue_cents||0)),Math.max(0,Number(body.estimated_content_value_cents||0)),text(body.notes,1000)||null,access.adminUser.user_id).run();
      message='Project profitability assumptions saved.';
    }else if(action==='create_content_handoff'){
      if(!projectId) throw new Error('Project is required.');
      const current=await detail(access.db,projectId); if(!current) throw new Error('Project was not found.');
      if(!current.selected_evidence.length) throw new Error('Select at least one reviewed timeline entry first.');
      const primary=current.linked_products.find(row=>Number(row.is_primary)===1)||current.linked_products[0];
      let contentProjectId=null;
      if(primary?.product_id){ await ensureContentAutomationSchema(access.db); const created=await createOrRefreshContentProjectForProduct(access.db,Number(primary.product_id),access.adminUser.user_id,{refresh_copy:false}); contentProjectId=created?.project?.content_project_id||null; }
      const pkg={build:BUILD,creative_work_project_id:projectId,project_key:current.project.project_key,project_title:current.project.project_title,summary:current.project.summary,objective:current.project.objective,story_angle:current.project.story_angle,primary_product_id:primary?.product_id||null,evidence:current.selected_evidence.map(row=>({event_id:row.creative_work_event_id,type:row.event_type,title:row.event_title,notes:row.event_notes,media_url:row.media_url,role:row.evidence_role})),lessons:current.selected_evidence.filter(row=>['lesson','mistake','repair','result'].includes(row.event_type)).map(row=>row.event_notes||row.event_title)};
      await access.db.prepare(`INSERT INTO creative_project_content_handoffs (creative_work_project_id,content_project_id,handoff_status,evidence_count,package_json,created_by) VALUES (?1,?2,'ready_for_review',?3,?4,?5)`).bind(projectId,contentProjectId,current.selected_evidence.length,JSON.stringify(pkg),access.adminUser.user_id).run();
      message=contentProjectId?'Reviewed evidence package created and linked to Content Studio.':'Reviewed evidence package created. Link a primary product later to create the Content Studio record.';
    }else if(action==='post_material_inventory'){
      const eventId=num(body.creative_work_event_id);
      const inventoryId=num(body.site_item_inventory_id);
      const stockQuantity=Math.max(0,Math.floor(Number(body.stock_quantity_consumed||0)));
      if(!projectId||!eventId||!inventoryId||stockQuantity<1) throw new Error('Project, approved material, inventory item and whole stock quantity are required.');
      const review=await access.db.prepare(`SELECT * FROM creative_project_material_reviews WHERE creative_work_project_id=?1 AND creative_work_event_id=?2`).bind(projectId,eventId).first();
      if(!review||review.review_status!=='approved') throw new Error('Approve the material review before posting inventory.');
      if(Number(review.inventory_consumed||0)===1) throw new Error('This reviewed material has already been posted to inventory.');
      const existing=await access.db.prepare(`SELECT creative_project_inventory_post_id FROM creative_project_inventory_posts WHERE creative_project_material_review_id=?1`).bind(review.creative_project_material_review_id).first();
      if(existing) throw new Error('This reviewed material already has an inventory posting.');
      const item=await access.db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id=?1 AND is_active=1`).bind(inventoryId).first();
      if(!item) throw new Error('The selected inventory item was not found or is inactive.');
      const previous=Math.max(0,Number(item.on_hand_quantity||0));
      if(previous<stockQuantity) throw new Error(`Only ${previous} ${item.stock_unit_label||'unit'} are on hand.`);
      const next=previous-stockQuantity;
      await access.db.batch([
        access.db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?2,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?1 AND on_hand_quantity=?3`).bind(inventoryId,next,previous),
        access.db.prepare(`INSERT INTO site_inventory_movements (site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?1,?2,?3,?4,'consume',?5,?6,?7,?8,?8,?9,?9,?10,?11,CURRENT_TIMESTAMP)`).bind(inventoryId,item.source_type||null,item.external_key||null,item.item_name,-stockQuantity,previous,next,Number(item.reserved_quantity||0),Number(item.incoming_quantity||0),`Creative Project ${projectId}, event ${eventId}. Explicit reviewed material posting.`,access.adminUser.user_id),
        access.db.prepare(`INSERT INTO creative_project_inventory_posts (creative_work_project_id,creative_work_event_id,creative_project_material_review_id,site_item_inventory_id,stock_quantity_consumed,previous_on_hand_quantity,new_on_hand_quantity,posted_by,notes) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`).bind(projectId,eventId,review.creative_project_material_review_id,inventoryId,stockQuantity,previous,next,access.adminUser.user_id,text(body.notes,500)||null),
        access.db.prepare(`UPDATE creative_project_material_reviews SET inventory_consumed=1 WHERE creative_project_material_review_id=?1`).bind(review.creative_project_material_review_id)
      ]);
      message=`Inventory posted: ${stockQuantity} ${item.stock_unit_label||'unit'} consumed from ${item.item_name}.`;
    }else if(action==='mirror_caip_evidence'){
      if(!projectId) throw new Error('Project is required.');
      const current=await detail(access.db,projectId);
      if(!current?.selected_evidence?.length) throw new Error('Select reviewed timeline evidence first.');
      const handoff=current.content_handoffs.find(row=>Number(row.content_project_id||0)>0);
      if(!handoff) throw new Error('Create a Content Studio handoff linked to a primary product first.');
      await ensureCreativeAssetIntelligenceSchema(access.db);
      const synced=await syncCreativeProjectFromContentProject(access.db,Number(handoff.content_project_id),access.adminUser.user_id,{});
      const caipProjectId=Number(synced?.project?.creative_project_id||0);
      if(!caipProjectId) throw new Error('CAIP project could not be resolved.');
      let count=0;
      for(const row of current.selected_evidence){
        if(!['lesson','mistake','repair','result','research','planning','process','milestone'].includes(String(row.event_type||''))) continue;
        const evidenceKey=`creative-work-${projectId}-event-${row.creative_work_event_id}`;
        const claim=text(row.event_notes||row.event_title,2000);
        if(!claim) continue;
        await access.db.prepare(`INSERT INTO creative_story_evidence (creative_project_id,evidence_key,evidence_type,source_reference,claim_text,visibility,verification_status,review_status,evidence_json,copy_locked,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,'internal','source_record','needs_review',?6,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(creative_project_id,evidence_key) DO UPDATE SET evidence_type=excluded.evidence_type,source_reference=excluded.source_reference,claim_text=excluded.claim_text,evidence_json=excluded.evidence_json,review_status='needs_review',updated_at=CURRENT_TIMESTAMP`).bind(caipProjectId,evidenceKey,String(row.event_type||'source_fact'),`creative_work_event:${row.creative_work_event_id}`,claim,JSON.stringify({creative_work_project_id:projectId,creative_work_event_id:row.creative_work_event_id,title:row.event_title,media_url:row.media_url||null,evidence_role:row.evidence_role||'process_evidence'})).run();
        count++;
      }
      await access.db.prepare(`INSERT INTO creative_project_caip_mirrors (creative_work_project_id,creative_project_id,source_handoff_id,evidence_count,mirror_status,mirrored_by,mirrored_at,notes) VALUES (?1,?2,?3,?4,'needs_review',?5,CURRENT_TIMESTAMP,?6) ON CONFLICT(creative_work_project_id,creative_project_id) DO UPDATE SET source_handoff_id=excluded.source_handoff_id,evidence_count=excluded.evidence_count,mirror_status='needs_review',mirrored_by=excluded.mirrored_by,mirrored_at=CURRENT_TIMESTAMP,notes=excluded.notes`).bind(projectId,caipProjectId,handoff.creative_project_content_handoff_id,count,access.adminUser.user_id,'Mirrored as internal, review-required CAIP evidence.').run();
      message=`${count} selected evidence record${count===1?'':'s'} mirrored into CAIP for review.`;
    }else if(action==='save_cost_template'){
      const name=text(body.template_name,120);
      if(!name) throw new Error('Template name is required.');
      await access.db.prepare(`INSERT INTO creative_project_cost_templates (template_name,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,channel_fee_percent,shipping_cost_cents,is_active,created_by,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,1,?7,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(template_name) DO UPDATE SET labour_rate_cents=excluded.labour_rate_cents,packaging_cost_cents=excluded.packaging_cost_cents,overhead_cost_cents=excluded.overhead_cost_cents,channel_fee_percent=excluded.channel_fee_percent,shipping_cost_cents=excluded.shipping_cost_cents,is_active=1,updated_at=CURRENT_TIMESTAMP`).bind(name,Math.max(0,Number(body.labour_rate_cents||0)),Math.max(0,Number(body.packaging_cost_cents||0)),Math.max(0,Number(body.overhead_cost_cents||0)),Math.max(0,Number(body.channel_fee_percent||0)),Math.max(0,Number(body.shipping_cost_cents||0)),access.adminUser.user_id).run();
      message='Project cost template saved.';
    }else if(action==='seed_outputs'){
      if(!projectId) throw new Error('Project is required.'); await seedOutputs(access.db,projectId); message='Missing output plans restored.';
    }else if(action==='link_product'){
      const productId=num(body.product_id); if(!projectId||!productId) throw new Error('Project and product are required.');
      const product=await access.db.prepare(`SELECT product_id FROM products WHERE product_id=?1`).bind(productId).first(); if(!product) throw new Error('Product was not found.');
      const hasPrimary=await access.db.prepare(`SELECT 1 found FROM creative_project_product_links WHERE creative_work_project_id=?1 AND is_primary=1 LIMIT 1`).bind(projectId).first();
      await access.db.prepare(`INSERT INTO creative_project_product_links (creative_work_project_id,product_id,relationship_type,is_primary,notes,created_by) VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT(creative_work_project_id,product_id) DO UPDATE SET relationship_type=excluded.relationship_type,notes=excluded.notes`).bind(projectId,productId,text(body.relationship_type,50)||'project_output',hasPrimary?0:1,text(body.notes,500)||null,access.adminUser.user_id).run();
      message='Product linked to the Creative Project. Products may also remain unlinked.';
    }else if(action==='unlink_product'){
      const productId=num(body.product_id); if(!projectId||!productId) throw new Error('Project and product are required.');
      await access.db.prepare(`DELETE FROM creative_project_product_links WHERE creative_work_project_id=?1 AND product_id=?2`).bind(projectId,productId).run();
      message='Product link removed. The product itself was not changed.';
    }else if(action==='set_primary_product'){
      const productId=num(body.product_id); if(!projectId||!productId) throw new Error('Project and product are required.');
      await access.db.prepare(`UPDATE creative_project_product_links SET is_primary=CASE WHEN product_id=?2 THEN 1 ELSE 0 END WHERE creative_work_project_id=?1`).bind(projectId,productId).run();
      await access.db.prepare(`UPDATE creative_work_projects SET product_id=?2,updated_at=CURRENT_TIMESTAMP WHERE creative_work_project_id=?1`).bind(projectId,productId).run();
      message='Primary product updated.';
    }else throw new Error('Unsupported Creative Process action.');
    const current=await detail(access.db,projectId);
    await auditAdminAction(context.env,context.request,access.adminUser,{action_type:`creative_process_${action}`,target_type:'creative_work_project',target_id:projectId,target_key:current?.project?.project_key||null,details:{review_first:true,automatic_publish:false}});
    return json({ok:true,message,build:BUILD,projects:await listProjects(access.db),detail:current,mode:'project_first_review_first'});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'creative_process_engine',incident_code:'creative_process_post_failed',severity:'warning',message:error?.message||'Creative Process save failed.',related_user_id:access.adminUser.user_id,details:{action,error:String(error?.stack||error)}});
    return json({ok:false,error:error?.message||'Creative Process save failed.'},400);
  }
}
