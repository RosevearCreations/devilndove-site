// Build 244 — project-first Creative Process Engine with fractional/log-only material usage posting and no request-time schema DDL.
import { createOrRefreshContentProjectForCreativeProject, createOrRefreshContentProjectForProduct, ensureContentAutomationSchema } from '../_lib/contentAutomationStudio.js';
import { ensureCreativeAssetIntelligenceSchema, syncCreativeProjectFromContentProject } from '../_lib/creativeAssetIntelligence.js';
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '264';
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
  const materials=await db.prepare(`SELECT e.creative_work_event_id,e.event_title,e.material_name,e.material_quantity,e.material_unit,e.material_cost_cents,r.creative_project_material_review_id,r.review_status,r.actual_quantity,r.waste_quantity,r.reusable_quantity,r.approved_cost_cents,r.review_notes,r.inventory_consumed,ip.creative_project_inventory_post_id,ip.site_item_inventory_id,ip.stock_quantity_consumed,ip.previous_on_hand_quantity,ip.new_on_hand_quantity,ip.posting_status,ip.posted_at,COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed,0) usage_quantity_consumed,COALESCE(iud.usage_unit_label,'unit') usage_unit_label,COALESCE(iud.tracking_mode,'exact') usage_tracking_mode FROM creative_work_events e LEFT JOIN creative_project_material_reviews r ON r.creative_work_event_id=e.creative_work_event_id AND r.creative_work_project_id=e.creative_work_project_id LEFT JOIN creative_project_inventory_posts ip ON ip.creative_project_material_review_id=r.creative_project_material_review_id LEFT JOIN creative_project_inventory_usage_details iud ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id WHERE e.creative_work_project_id=?1 AND TRIM(COALESCE(e.material_name,''))<>'' ORDER BY e.occurred_at,e.creative_work_event_id`).bind(id).all();
  const profitability=await db.prepare(`SELECT p.*,COALESCE(x.channel_fee_percent,0) channel_fee_percent,COALESCE(x.fixed_channel_fee_cents,p.channel_fee_cents,0) fixed_channel_fee_cents FROM creative_project_profitability p LEFT JOIN creative_project_profitability_extensions x ON x.creative_work_project_id=p.creative_work_project_id WHERE p.creative_work_project_id=?1`).bind(id).first();
  const handoffs=await db.prepare(`SELECT creative_project_content_handoff_id,content_project_id,handoff_status,evidence_count,created_at FROM creative_project_content_handoffs WHERE creative_work_project_id=?1 ORDER BY creative_project_content_handoff_id DESC`).bind(id).all();
  const inventoryItems=await db.prepare(`SELECT sii.site_item_inventory_id,sii.item_name,sii.source_type,sii.on_hand_quantity,sii.reserved_quantity,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit,sii.unit_cost_cents,sii.do_not_reuse,sii.is_active,COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,COALESCE(siup.minimum_usage_increment,0.001) minimum_usage_increment FROM site_item_inventory sii LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id WHERE sii.is_active=1 ORDER BY LOWER(sii.item_name),sii.site_item_inventory_id`).all().catch(()=>({results:[]}));
  const caipMirrors=await db.prepare(`SELECT * FROM creative_project_caip_mirrors WHERE creative_work_project_id=?1 ORDER BY mirrored_at DESC`).bind(id).all();
  const costTemplates=await db.prepare(`SELECT * FROM creative_project_cost_templates WHERE is_active=1 ORDER BY LOWER(template_name)`).all();
  const allocations=await db.prepare(`SELECT a.*,p.name product_name,p.product_number FROM creative_project_cost_allocations a JOIN products p ON p.product_id=a.product_id WHERE a.creative_work_project_id=?1 ORDER BY LOWER(p.name)`).bind(id).all();
  const reversals=await db.prepare(`SELECT * FROM creative_project_inventory_reversals WHERE creative_work_project_id=?1 ORDER BY authorized_at DESC`).bind(id).all();
  const summaries=await db.prepare(`SELECT * FROM creative_project_knowledge_summaries WHERE creative_work_project_id=?1 ORDER BY summary_type`).bind(id).all();
  const costContext=await db.prepare(`SELECT * FROM creative_project_cost_context WHERE creative_work_project_id=?1`).bind(id).first().catch(()=>null);
  return {project,events:events.results||[],outputs:outputs.results||[],totals:totals||{},linked_products:linked.results||[],selected_evidence:evidence.results||[],material_reviews:materials.results||[],profitability:profitability||{},content_handoffs:handoffs.results||[],inventory_items:inventoryItems.results||[],caip_mirrors:caipMirrors.results||[],cost_templates:costTemplates.results||[],cost_allocations:allocations.results||[],inventory_reversals:reversals.results||[],knowledge_summaries:summaries.results||[],cost_context:costContext||{}};
}
async function seedOutputs(db,id,projectType='maker_project'){
  const productless=['content_only','education','research','archive'].includes(String(projectType||'').toLowerCase());
  const excluded=productless?new Set(['etsy_listing','website_product']):new Set();
  for(const [key,label,group] of OUTPUTS){
    if(excluded.has(key)) continue;
    await db.prepare(`INSERT OR IGNORE INTO creative_work_outputs (creative_work_project_id,output_key,output_label,output_group) VALUES (?1,?2,?3,?4)`).bind(id,key,label,group).run();
  }
}
export async function onRequestGet(context){
  const access=await requireAdmin(context); if(access.error) return access.error;
  try{
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

async function ensureCaipProjectForWork(db,projectId,userId){
  const work=await db.prepare(`SELECT * FROM creative_work_projects WHERE creative_work_project_id=?1`).bind(projectId).first();
  if(!work) throw new Error('Creative Project was not found.');
  const primary=await db.prepare(`SELECT product_id FROM creative_project_product_links WHERE creative_work_project_id=?1 ORDER BY is_primary DESC,creative_project_product_link_id LIMIT 1`).bind(projectId).first().catch(()=>null);
  const key=`CAIP-WORK-${projectId}`;
  await db.prepare(`INSERT INTO creative_projects(creative_project_key,source_type,source_id,product_id,project_title,project_status,governance_status,lifecycle_stage,source_snapshot_json,policy_profile_json,created_by_user_id,created_at,updated_at)
    VALUES(?1,'creative_work_project',?2,?3,?4,'intake','needs_review','intake',?5,'{}',?6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(source_type,source_id) DO UPDATE SET product_id=COALESCE(excluded.product_id,creative_projects.product_id),project_title=excluded.project_title,source_snapshot_json=excluded.source_snapshot_json,updated_at=CURRENT_TIMESTAMP`)
    .bind(key,String(projectId),Number(primary?.product_id||work.product_id||0)||null,work.project_title||`Creative Project ${projectId}`,JSON.stringify({creative_work_project_id:projectId,project_key:work.project_key,project_type:work.project_type,summary:work.summary||'',objective:work.objective||'',story_angle:work.story_angle||''}),userId||null).run();
  const caip=await db.prepare(`SELECT creative_project_id FROM creative_projects WHERE source_type='creative_work_project' AND source_id=?1 LIMIT 1`).bind(String(projectId)).first();
  if(!caip?.creative_project_id) throw new Error('CAIP workspace could not be created.');
  await db.prepare(`INSERT INTO creative_project_caip_mirrors(creative_work_project_id,creative_project_id,evidence_count,mirror_status,mirrored_by,mirrored_at,notes)
    VALUES(?1,?2,0,'workspace_ready',?3,CURRENT_TIMESTAMP,'CAIP workspace available for project media, including research/experiment projects without products.')
    ON CONFLICT(creative_work_project_id,creative_project_id) DO UPDATE SET mirror_status=CASE WHEN creative_project_caip_mirrors.mirror_status='needs_review' THEN creative_project_caip_mirrors.mirror_status ELSE 'workspace_ready' END,mirrored_by=excluded.mirrored_by,mirrored_at=CURRENT_TIMESTAMP`)
    .bind(projectId,caip.creative_project_id,userId||null).run();
  return Number(caip.creative_project_id);
}

async function postInventoryUsage(db,{projectId,eventId,inventoryId,usageQuantity,userId,notes=''}){
  const review=await db.prepare(`SELECT * FROM creative_project_material_reviews WHERE creative_work_project_id=?1 AND creative_work_event_id=?2`).bind(projectId,eventId).first();
  if(!review||review.review_status!=='approved') throw new Error('Approve the material review before posting inventory.');
  if(Number(review.inventory_consumed||0)===1) throw new Error('This reviewed material has already been posted to inventory.');
  const existing=await db.prepare(`SELECT creative_project_inventory_post_id FROM creative_project_inventory_posts WHERE creative_project_material_review_id=?1`).bind(review.creative_project_material_review_id).first();
  if(existing) throw new Error('This reviewed material already has an inventory posting.');
  const item=await db.prepare(`SELECT sii.*,COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,COALESCE(siup.minimum_usage_increment,0.001) minimum_usage_increment FROM site_item_inventory sii LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id WHERE sii.site_item_inventory_id=?1 AND sii.is_active=1`).bind(inventoryId).first();
  if(!item) throw new Error('The selected inventory item was not found or is inactive.');
  const trackingMode=['exact','estimated','log_only','reusable'].includes(String(item.usage_tracking_mode||'').toLowerCase())?String(item.usage_tracking_mode).toLowerCase():(String(item.source_type||'').toLowerCase()==='tool'?'reusable':'exact');
  const perStock=Math.max(0.001,Number(item.usage_units_per_stock_unit||1)||1);
  const stockQuantity=['log_only','reusable'].includes(trackingMode)?0:(usageQuantity/perStock);
  const previous=Math.max(0,Number(item.on_hand_quantity||0));
  if(stockQuantity>previous+1e-9) throw new Error(`Only ${previous} ${item.stock_unit_label||'unit'} are on hand.`);
  const next=Math.max(0,previous-stockQuantity);
  await db.batch([
    db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?2,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?1 AND on_hand_quantity=?3`).bind(inventoryId,next,previous),
    db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES(?1,?2,?3,?4,'consume',?5,?6,?7,?8,?8,?9,?9,?10,?11,CURRENT_TIMESTAMP)`).bind(inventoryId,item.source_type||null,item.external_key||null,item.item_name,-stockQuantity,previous,next,Number(item.reserved_quantity||0),Number(item.incoming_quantity||0),`Creative Project ${projectId}, event ${eventId}. Reviewed usage ${usageQuantity} ${item.usage_unit_label||'unit'}; tracking ${trackingMode}.`,userId),
    db.prepare(`INSERT INTO creative_project_inventory_posts(creative_work_project_id,creative_work_event_id,creative_project_material_review_id,site_item_inventory_id,stock_quantity_consumed,previous_on_hand_quantity,new_on_hand_quantity,posted_by,notes) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)`).bind(projectId,eventId,review.creative_project_material_review_id,inventoryId,stockQuantity,previous,next,userId,text(notes,500)||null),
    db.prepare(`UPDATE creative_project_material_reviews SET inventory_consumed=1 WHERE creative_project_material_review_id=?1`).bind(review.creative_project_material_review_id)
  ]);
  const post=await db.prepare(`SELECT creative_project_inventory_post_id FROM creative_project_inventory_posts WHERE creative_project_material_review_id=?1 LIMIT 1`).bind(review.creative_project_material_review_id).first();
  if(post?.creative_project_inventory_post_id){
    await db.batch([
      db.prepare(`INSERT INTO creative_project_inventory_usage_details(creative_project_inventory_post_id,usage_quantity_consumed,usage_unit_label,stock_quantity_consumed,stock_unit_label,tracking_mode,is_estimated,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(post.creative_project_inventory_post_id,usageQuantity,item.usage_unit_label||'unit',stockQuantity,item.stock_unit_label||'unit',trackingMode,trackingMode==='estimated'?1:0),
      db.prepare(`INSERT INTO site_inventory_usage_movements(site_item_inventory_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,CURRENT_TIMESTAMP)`).bind(inventoryId,-usageQuantity,item.usage_unit_label||'unit',-stockQuantity,item.stock_unit_label||'unit',trackingMode,trackingMode==='estimated'?1:0,`Creative Project ${projectId}, event ${eventId}.`,userId)
    ]);
  }
  return {item,trackingMode,perStock,stockQuantity,previous,next,allocatedCostCents:Math.max(0,Math.round(Number(item.unit_cost_cents||0)*(usageQuantity/perStock)))};
}

export async function onRequestPost(context){
  const access=await requireAdmin(context); if(access.error) return access.error;
  let body={}; try{body=await context.request.json();}catch{}
  const action=text(body.action,80).toLowerCase();
  try{
    let projectId=num(body.creative_work_project_id||body.project_id); let message='Saved.';
    if(action==='create_project'){
      const title=text(body.project_title,180); if(!title) throw new Error('Project title is required.');
      const key=`CP-${Date.now().toString(36).toUpperCase()}`;
      const projectType=text(body.project_type,60)||'maker_project';
      const result=await access.db.prepare(`INSERT INTO creative_work_projects (project_key,project_title,project_type,project_status,summary,objective,story_angle,product_id,privacy_status,rights_status,created_by,updated_by) VALUES (?1,?2,?3,'idea',?4,?5,?6,?7,'internal','needs_review',?8,?8)`).bind(key,title,projectType,text(body.summary),text(body.objective),text(body.story_angle),num(body.product_id)||null,access.adminUser.user_id).run();
      projectId=num(result.meta?.last_row_id); await seedOutputs(access.db,projectId,projectType); await ensureCaipProjectForWork(access.db,projectId,access.adminUser.user_id);
      const initialProductId=num(body.product_id);
      if(initialProductId) await access.db.prepare(`INSERT OR IGNORE INTO creative_project_product_links (creative_work_project_id,product_id,relationship_type,is_primary,created_by) VALUES (?1,?2,'project_output',1,?3)`).bind(projectId,initialProductId,access.adminUser.user_id).run();
      message=projectType==='content_only'?'Content-only Creative Project created with a non-commerce content blueprint.':'Creative Project created with the complete output blueprint.';
    }else if(action==='update_project'){
      if(!projectId) throw new Error('Project is required.');
      await access.db.prepare(`UPDATE creative_work_projects SET project_title=?2,project_type=?3,project_status=?4,summary=?5,objective=?6,story_angle=?7,product_id=?8,started_at=?9,completed_at=?10,total_minutes=?11,estimated_cost_cents=?12,actual_cost_cents=?13,privacy_status=?14,rights_status=?15,updated_by=?16,updated_at=CURRENT_TIMESTAMP WHERE creative_work_project_id=?1`).bind(projectId,text(body.project_title,180),text(body.project_type,60)||'maker_project',text(body.project_status,40)||'idea',text(body.summary),text(body.objective),text(body.story_angle),num(body.product_id)||null,text(body.started_at,40)||null,text(body.completed_at,40)||null,Math.max(0,Number(body.total_minutes||0)),Math.max(0,Number(body.estimated_cost_cents||0)),Math.max(0,Number(body.actual_cost_cents||0)),text(body.privacy_status,40)||'internal',text(body.rights_status,40)||'needs_review',access.adminUser.user_id).run();
      const legacyProductId=num(body.product_id);
      if(legacyProductId) await access.db.prepare(`INSERT OR IGNORE INTO creative_project_product_links (creative_work_project_id,product_id,relationship_type,is_primary,created_by) VALUES (?1,?2,'project_output',CASE WHEN EXISTS(SELECT 1 FROM creative_project_product_links WHERE creative_work_project_id=?1) THEN 0 ELSE 1 END,?3)`).bind(projectId,legacyProductId,access.adminUser.user_id).run();
      await seedOutputs(access.db,projectId,text(body.project_type,60)||'maker_project'); await ensureCaipProjectForWork(access.db,projectId,access.adminUser.user_id);
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
      const revenueCents=Math.max(0,Number(body.revenue_cents||0));
      const feePercent=Math.max(0,Math.min(100,Number(body.channel_fee_percent||0)));
      const fixedFee=Math.max(0,Number(body.channel_fee_cents||0));
      const calculatedFee=Math.round(revenueCents*feePercent/100);
      await access.db.batch([
        access.db.prepare(`INSERT INTO creative_project_profitability (creative_work_project_id,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,channel_fee_cents,shipping_cost_cents,revenue_cents,estimated_content_value_cents,notes,updated_by,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id) DO UPDATE SET labour_rate_cents=excluded.labour_rate_cents,packaging_cost_cents=excluded.packaging_cost_cents,overhead_cost_cents=excluded.overhead_cost_cents,channel_fee_cents=excluded.channel_fee_cents,shipping_cost_cents=excluded.shipping_cost_cents,revenue_cents=excluded.revenue_cents,estimated_content_value_cents=excluded.estimated_content_value_cents,notes=excluded.notes,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).bind(projectId,Math.max(0,Number(body.labour_rate_cents||0)),Math.max(0,Number(body.packaging_cost_cents||0)),Math.max(0,Number(body.overhead_cost_cents||0)),fixedFee+calculatedFee,Math.max(0,Number(body.shipping_cost_cents||0)),revenueCents,Math.max(0,Number(body.estimated_content_value_cents||0)),text(body.notes,1000)||null,access.adminUser.user_id),
        access.db.prepare(`INSERT INTO creative_project_profitability_extensions (creative_work_project_id,channel_fee_percent,fixed_channel_fee_cents,updated_at) VALUES (?1,?2,?3,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id) DO UPDATE SET channel_fee_percent=excluded.channel_fee_percent,fixed_channel_fee_cents=excluded.fixed_channel_fee_cents,updated_at=CURRENT_TIMESTAMP`).bind(projectId,feePercent,fixedFee)
      ]);
      message=`Project profitability saved. Marketplace fees include ${feePercent}% of revenue plus any fixed fee.`;
    }else if(action==='create_content_handoff'){
      if(!projectId) throw new Error('Project is required.');
      const current=await detail(access.db,projectId); if(!current) throw new Error('Project was not found.');
      if(!current.selected_evidence.length) throw new Error('Select at least one reviewed timeline entry first.');
      const primary=current.linked_products.find(row=>Number(row.is_primary)===1)||current.linked_products[0];
      let contentProjectId=null;
      await ensureContentAutomationSchema(access.db);
      if(primary?.product_id){
        const created=await createOrRefreshContentProjectForProduct(access.db,Number(primary.product_id),access.adminUser.user_id,{refresh_copy:false});
        contentProjectId=created?.project?.content_project_id||null;
      }else{
        const created=await createOrRefreshContentProjectForCreativeProject(access.db,current.project,current.selected_evidence,access.adminUser.user_id,{refresh_copy:false});
        contentProjectId=created?.project?.content_project_id||null;
      }
      const pkg={build:BUILD,creative_work_project_id:projectId,project_key:current.project.project_key,project_title:current.project.project_title,summary:current.project.summary,objective:current.project.objective,story_angle:current.project.story_angle,primary_product_id:primary?.product_id||null,evidence:current.selected_evidence.map(row=>({event_id:row.creative_work_event_id,type:row.event_type,title:row.event_title,notes:row.event_notes,media_url:row.media_url,role:row.evidence_role})),lessons:current.selected_evidence.filter(row=>['lesson','mistake','repair','result'].includes(row.event_type)).map(row=>row.event_notes||row.event_title)};
      await access.db.prepare(`INSERT INTO creative_project_content_handoffs (creative_work_project_id,content_project_id,handoff_status,evidence_count,package_json,created_by) VALUES (?1,?2,'ready_for_review',?3,?4,?5)`).bind(projectId,contentProjectId,current.selected_evidence.length,JSON.stringify(pkg),access.adminUser.user_id).run();
      message=primary?.product_id?'Reviewed evidence package created and linked to a product-backed Content Studio project.':'Reviewed evidence package created as a content-only Content Studio project. No store product is required.';
    }else if(action==='post_material_inventory'){
      const eventId=num(body.creative_work_event_id); const inventoryId=num(body.site_item_inventory_id); const usageQuantity=Math.max(0,Number(body.usage_quantity_consumed ?? body.stock_quantity_consumed ?? 0)||0);
      if(!projectId||!eventId||!inventoryId||usageQuantity<=0) throw new Error('Project, approved material, inventory item and a usage amount greater than zero are required.');
      const posted=await postInventoryUsage(access.db,{projectId,eventId,inventoryId,usageQuantity,userId:access.adminUser.user_id,notes:body.notes});
      message=['log_only','reusable'].includes(posted.trackingMode)?`Usage logged in ${posted.item.usage_unit_label||'usage units'} without reducing stock (${posted.trackingMode}).`:`Inventory consumed using ${posted.perStock} ${posted.item.usage_unit_label||'usage units'} per ${posted.item.stock_unit_label||'stock unit'}.`;
    }else if(action==='record_inventory_use'){
      const inventoryId=num(body.site_item_inventory_id); const usageQuantity=Math.max(0,Number(body.usage_quantity_consumed||0)||0); if(!projectId||!inventoryId||usageQuantity<=0) throw new Error('Choose an inventory item and enter the amount actually used.');
      const item=await access.db.prepare(`SELECT sii.*,COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode FROM site_item_inventory sii LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id WHERE sii.site_item_inventory_id=?1 AND sii.is_active=1`).bind(inventoryId).first();
      if(!item) throw new Error('Inventory item was not found.');
      const perStock=Math.max(0.001,Number(item.usage_units_per_stock_unit||1)||1); const allocatedCost=Math.max(0,Math.round(Number(item.unit_cost_cents||0)*(usageQuantity/perStock)));
      const eventResult=await access.db.prepare(`INSERT INTO creative_work_events(creative_work_project_id,event_type,event_title,event_notes,occurred_at,material_name,material_quantity,material_unit,material_cost_cents,is_public_candidate,created_by) VALUES(?1,'material',?2,?3,CURRENT_TIMESTAMP,?4,?5,?6,?7,0,?8)`).bind(projectId,`Used ${item.item_name}`,text(body.notes,1000)||'Direct inventory usage recorded for this project.',item.item_name,usageQuantity,item.usage_unit_label||'unit',allocatedCost,access.adminUser.user_id).run();
      const eventId=num(eventResult.meta?.last_row_id); await access.db.prepare(`INSERT INTO creative_project_material_reviews(creative_work_project_id,creative_work_event_id,review_status,actual_quantity,waste_quantity,reusable_quantity,approved_cost_cents,review_notes,inventory_consumed,reviewed_by,reviewed_at) VALUES(?1,?2,'approved',?3,0,0,?4,?5,0,?6,CURRENT_TIMESTAMP)`).bind(projectId,eventId,usageQuantity,allocatedCost,text(body.notes,500)||'Direct project inventory usage.',access.adminUser.user_id).run();
      const posted=await postInventoryUsage(access.db,{projectId,eventId,inventoryId,usageQuantity,userId:access.adminUser.user_id,notes:body.notes});
      message=`Recorded ${usageQuantity} ${posted.item.usage_unit_label||'unit'} of ${posted.item.item_name} for this project; allocated cost ${Math.max(0,posted.allocatedCostCents)/100} CAD.`;
    }else if(action==='ensure_caip_workspace'){
      if(!projectId) throw new Error('Project is required.'); const caipId=await ensureCaipProjectForWork(access.db,projectId,access.adminUser.user_id); message=`CAIP workspace ${caipId} is ready for project media.`;
    }else if(action==='save_cost_context'){
      if(!projectId) throw new Error('Project is required.'); const purpose=text(body.cost_purpose,60)||'research_experiment'; const allowed=new Set(['content_marketing','research_experiment','product_development','education_training','internal_other']); if(!allowed.has(purpose)) throw new Error('Choose a valid internal cost purpose.');
      await access.db.prepare(`INSERT INTO creative_project_cost_context(creative_work_project_id,cost_purpose,internal_notes,updated_by,updated_at) VALUES(?1,?2,?3,?4,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id) DO UPDATE SET cost_purpose=excluded.cost_purpose,internal_notes=excluded.internal_notes,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).bind(projectId,purpose,text(body.internal_notes,1000)||null,access.adminUser.user_id).run(); message='Internal project cost purpose saved.';
    }else if(action==='reverse_material_inventory'){
      const postId=num(body.creative_project_inventory_post_id);
      const reason=text(body.reason,500);
      if(!projectId||!postId||reason.length<8) throw new Error('A posted inventory record and a clear reversal reason are required.');
      const post=await access.db.prepare(`SELECT ip.*,i.*,COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed,0) usage_quantity_consumed,COALESCE(iud.usage_unit_label,i.usage_unit_label,'unit') posted_usage_unit_label,COALESCE(iud.tracking_mode,'exact') posted_tracking_mode FROM creative_project_inventory_posts ip JOIN site_item_inventory i ON i.site_item_inventory_id=ip.site_item_inventory_id LEFT JOIN creative_project_inventory_usage_details iud ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id WHERE ip.creative_project_inventory_post_id=?1 AND ip.creative_work_project_id=?2`).bind(postId,projectId).first();
      if(!post) throw new Error('The inventory posting was not found.');
      if(post.posting_status==='reversed') throw new Error('This inventory posting has already been reversed.');
      const prior=await access.db.prepare(`SELECT creative_project_inventory_reversal_id FROM creative_project_inventory_reversals WHERE creative_project_inventory_post_id=?1`).bind(postId).first();
      if(prior) throw new Error('This inventory posting already has a reversal.');
      const previous=Math.max(0,Number(post.on_hand_quantity||0));
      const restored=Math.max(0,Number(post.stock_quantity_consumed||0));
      const next=previous+restored;
      await access.db.batch([
        access.db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?2,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?1 AND on_hand_quantity=?3`).bind(post.site_item_inventory_id,next,previous),
        access.db.prepare(`INSERT INTO site_inventory_movements (site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?1,?2,?3,?4,'adjustment',?5,?6,?7,?8,?8,?9,?9,?10,?11,CURRENT_TIMESTAMP)`).bind(post.site_item_inventory_id,post.source_type||null,post.external_key||null,post.item_name,restored,previous,next,Number(post.reserved_quantity||0),Number(post.incoming_quantity||0),`Creative Project ${projectId} inventory reversal. Reason: ${reason}`,access.adminUser.user_id),
        access.db.prepare(`INSERT INTO creative_project_inventory_reversals (creative_project_inventory_post_id,creative_work_project_id,site_item_inventory_id,stock_quantity_restored,previous_on_hand_quantity,new_on_hand_quantity,reason,authorized_by) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)`).bind(postId,projectId,post.site_item_inventory_id,restored,previous,next,reason,access.adminUser.user_id),
        access.db.prepare(`UPDATE creative_project_inventory_posts SET posting_status='reversed',notes=TRIM(COALESCE(notes,'') || ?2) WHERE creative_project_inventory_post_id=?1`).bind(postId,` | Reversed: ${reason}`),
        access.db.prepare(`UPDATE creative_project_material_reviews SET inventory_consumed=0 WHERE creative_project_material_review_id=?1`).bind(post.creative_project_material_review_id)
      ]);
      const usageRestored=Math.max(0,Number(post.usage_quantity_consumed||0));
      if(usageRestored>0) await access.db.prepare(`INSERT INTO site_inventory_usage_movements (site_item_inventory_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,CURRENT_TIMESTAMP)`).bind(post.site_item_inventory_id,usageRestored,post.posted_usage_unit_label||'unit',restored,post.stock_unit_label||'unit',post.posted_tracking_mode||'exact',post.posted_tracking_mode==='estimated'?1:0,`Creative Project ${projectId} usage reversal. Reason: ${reason}`,access.adminUser.user_id).run();
      message=restored>0?`Inventory reversal posted: ${restored} ${post.stock_unit_label||'unit'} restored to ${post.item_name}.`:`Usage-only reversal recorded for ${post.item_name}; no stock quantity required restoration.`;
    }else if(action==='apply_cost_template'){
      const templateId=num(body.creative_project_cost_template_id);
      if(!projectId||!templateId) throw new Error('Project and cost template are required.');
      const t=await access.db.prepare(`SELECT * FROM creative_project_cost_templates WHERE creative_project_cost_template_id=?1 AND is_active=1`).bind(templateId).first();
      if(!t) throw new Error('Cost template was not found.');
      const current=await access.db.prepare(`SELECT revenue_cents,estimated_content_value_cents,notes FROM creative_project_profitability WHERE creative_work_project_id=?1`).bind(projectId).first()||{};
      const fee=Math.round(Math.max(0,Number(current.revenue_cents||0))*Math.max(0,Number(t.channel_fee_percent||0))/100);
      await access.db.batch([
        access.db.prepare(`INSERT INTO creative_project_profitability (creative_work_project_id,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,channel_fee_cents,shipping_cost_cents,revenue_cents,estimated_content_value_cents,notes,updated_by,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id) DO UPDATE SET labour_rate_cents=excluded.labour_rate_cents,packaging_cost_cents=excluded.packaging_cost_cents,overhead_cost_cents=excluded.overhead_cost_cents,channel_fee_cents=excluded.channel_fee_cents,shipping_cost_cents=excluded.shipping_cost_cents,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).bind(projectId,t.labour_rate_cents,t.packaging_cost_cents,t.overhead_cost_cents,fee,t.shipping_cost_cents,Number(current.revenue_cents||0),Number(current.estimated_content_value_cents||0),current.notes||null,access.adminUser.user_id),
        access.db.prepare(`INSERT INTO creative_project_profitability_extensions (creative_work_project_id,channel_fee_percent,fixed_channel_fee_cents,updated_at) VALUES (?1,?2,0,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id) DO UPDATE SET channel_fee_percent=excluded.channel_fee_percent,fixed_channel_fee_cents=0,updated_at=CURRENT_TIMESTAMP`).bind(projectId,Number(t.channel_fee_percent||0))
      ]);
      message=`Cost template “${t.template_name}” applied.`;
    }else if(action==='save_cost_allocations'){
      if(!projectId) throw new Error('Project is required.');
      const allocations=Array.isArray(body.allocations)?body.allocations:[];
      const totalPercent=allocations.reduce((sum,row)=>sum+Math.max(0,Number(row.allocation_percent||0)),0);
      if(Math.abs(totalPercent-100)>0.01) throw new Error('Linked-product allocation percentages must total 100%.');
      const current=await detail(access.db,projectId);
      const p=current.profitability||{};
      const materialCost=(current.material_reviews||[]).reduce((sum,row)=>sum+Number(row.approved_cost_cents||row.material_cost_cents||0),0);
      const minutes=Number(current.totals?.tracked_minutes||0)+Number(current.project?.total_minutes||0);
      const labour=Math.round(minutes/60*Number(p.labour_rate_cents||0));
      const totalCost=materialCost+labour+Number(p.packaging_cost_cents||0)+Number(p.overhead_cost_cents||0)+Number(p.channel_fee_cents||0)+Number(p.shipping_cost_cents||0);
      for(const row of allocations){
        const productId=num(row.product_id); if(!productId) continue;
        const percent=Math.max(0,Number(row.allocation_percent||0));
        await access.db.prepare(`INSERT INTO creative_project_cost_allocations (creative_work_project_id,product_id,allocation_percent,allocated_cost_cents,notes,updated_by,updated_at) VALUES (?1,?2,?3,?4,?5,?6,CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id,product_id) DO UPDATE SET allocation_percent=excluded.allocation_percent,allocated_cost_cents=excluded.allocated_cost_cents,notes=excluded.notes,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).bind(projectId,productId,percent,Math.round(totalCost*percent/100),text(row.notes,300)||null,access.adminUser.user_id).run();
      }
      message='Shared project costs allocated across linked products.';
    }else if(action==='generate_knowledge_summary'){
      if(!projectId) throw new Error('Project is required.');
      const summaryType=['lessons_learned','future_recommendations'].includes(text(body.summary_type,50))?text(body.summary_type,50):'lessons_learned';
      const mirror=await access.db.prepare(`SELECT creative_project_id FROM creative_project_caip_mirrors WHERE creative_work_project_id=?1 ORDER BY mirrored_at DESC LIMIT 1`).bind(projectId).first();
      if(!mirror?.creative_project_id) throw new Error('Mirror selected evidence into CAIP before generating a reviewed knowledge summary.');
      const evidence=await access.db.prepare(`SELECT evidence_type,claim_text,review_status FROM creative_story_evidence WHERE creative_project_id=?1 AND visibility='internal' AND verification_status='source_record' ORDER BY updated_at,creative_story_evidence_id`).bind(mirror.creative_project_id).all();
      const allowed=summaryType==='lessons_learned'?['lesson','mistake','repair','result']:['lesson','result','research','planning','milestone','process'];
      const rows=(evidence.results||[]).filter(row=>allowed.includes(String(row.evidence_type||'')) && text(row.claim_text,500));
      if(!rows.length) throw new Error('CAIP does not yet contain relevant source evidence for this summary.');
      const heading=summaryType==='lessons_learned'?'Reviewed lessons learned':'Reviewed future-project recommendations';
      const summary=`${heading}:\n${rows.map((row,index)=>`${index+1}. ${text(row.claim_text,500)}`).join('\n')}`;
      await access.db.prepare(`INSERT INTO creative_project_knowledge_summaries (creative_work_project_id,summary_type,summary_text,source_evidence_count,review_status,updated_at) VALUES (?1,?2,?3,?4,'needs_review',CURRENT_TIMESTAMP) ON CONFLICT(creative_work_project_id,summary_type) DO UPDATE SET summary_text=excluded.summary_text,source_evidence_count=excluded.source_evidence_count,review_status='needs_review',reviewed_by=NULL,reviewed_at=NULL,updated_at=CURRENT_TIMESTAMP`).bind(projectId,summaryType,summary,rows.length).run();
      message='Knowledge summary generated as an internal draft requiring review.';
    }else if(action==='review_knowledge_summary'){
      const summaryType=text(body.summary_type,50); const reviewStatus=['needs_review','approved','rejected'].includes(text(body.review_status,30))?text(body.review_status,30):'needs_review';
      if(!projectId||!summaryType) throw new Error('Project and summary type are required.');
      await access.db.prepare(`UPDATE creative_project_knowledge_summaries SET summary_text=?3,review_status=?4,reviewed_by=?5,reviewed_at=CASE WHEN ?4='approved' THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE creative_work_project_id=?1 AND summary_type=?2`).bind(projectId,summaryType,text(body.summary_text,5000),reviewStatus,access.adminUser.user_id).run();
      message='Knowledge summary review saved.';
    }else if(action==='mirror_caip_evidence'){
      if(!projectId) throw new Error('Project is required.');
      const current=await detail(access.db,projectId);
      if(!current?.selected_evidence?.length) throw new Error('Select reviewed timeline evidence first.');
      const handoff=current.content_handoffs.find(row=>Number(row.content_project_id||0)>0)||null;
      await ensureCreativeAssetIntelligenceSchema(access.db);
      const caipProjectId=await ensureCaipProjectForWork(access.db,projectId,access.adminUser.user_id);
      let count=0;
      for(const row of current.selected_evidence){
        if(!['lesson','mistake','repair','result','research','planning','process','milestone'].includes(String(row.event_type||''))) continue;
        const evidenceKey=`creative-work-${projectId}-event-${row.creative_work_event_id}`;
        const claim=text(row.event_notes||row.event_title,2000);
        if(!claim) continue;
        await access.db.prepare(`INSERT INTO creative_story_evidence (creative_project_id,evidence_key,evidence_type,source_reference,claim_text,visibility,verification_status,review_status,evidence_json,copy_locked,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,'internal','source_record','needs_review',?6,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(creative_project_id,evidence_key) DO UPDATE SET evidence_type=excluded.evidence_type,source_reference=excluded.source_reference,claim_text=excluded.claim_text,evidence_json=excluded.evidence_json,review_status='needs_review',updated_at=CURRENT_TIMESTAMP`).bind(caipProjectId,evidenceKey,String(row.event_type||'source_fact'),`creative_work_event:${row.creative_work_event_id}`,claim,JSON.stringify({creative_work_project_id:projectId,creative_work_event_id:row.creative_work_event_id,title:row.event_title,media_url:row.media_url||null,evidence_role:row.evidence_role||'process_evidence'})).run();
        count++;
      }
      await access.db.prepare(`INSERT INTO creative_project_caip_mirrors (creative_work_project_id,creative_project_id,source_handoff_id,evidence_count,mirror_status,mirrored_by,mirrored_at,notes) VALUES (?1,?2,?3,?4,'needs_review',?5,CURRENT_TIMESTAMP,?6) ON CONFLICT(creative_work_project_id,creative_project_id) DO UPDATE SET source_handoff_id=excluded.source_handoff_id,evidence_count=excluded.evidence_count,mirror_status='needs_review',mirrored_by=excluded.mirrored_by,mirrored_at=CURRENT_TIMESTAMP,notes=excluded.notes`).bind(projectId,caipProjectId,handoff?.creative_project_content_handoff_id||null,count,access.adminUser.user_id,'Mirrored as internal, review-required CAIP evidence. Research/experiment projects do not require a product.').run();
      message=`${count} selected evidence record${count===1?'':'s'} mirrored into CAIP for review.`;
    }else if(action==='save_cost_template'){
      const name=text(body.template_name,120);
      if(!name) throw new Error('Template name is required.');
      await access.db.prepare(`INSERT INTO creative_project_cost_templates (template_name,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,channel_fee_percent,shipping_cost_cents,is_active,created_by,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,1,?7,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(template_name) DO UPDATE SET labour_rate_cents=excluded.labour_rate_cents,packaging_cost_cents=excluded.packaging_cost_cents,overhead_cost_cents=excluded.overhead_cost_cents,channel_fee_percent=excluded.channel_fee_percent,shipping_cost_cents=excluded.shipping_cost_cents,is_active=1,updated_at=CURRENT_TIMESTAMP`).bind(name,Math.max(0,Number(body.labour_rate_cents||0)),Math.max(0,Number(body.packaging_cost_cents||0)),Math.max(0,Number(body.overhead_cost_cents||0)),Math.max(0,Number(body.channel_fee_percent||0)),Math.max(0,Number(body.shipping_cost_cents||0)),access.adminUser.user_id).run();
      message='Project cost template saved.';
    }else if(action==='seed_outputs'){
      if(!projectId) throw new Error('Project is required.'); const project=await access.db.prepare(`SELECT project_type FROM creative_work_projects WHERE creative_work_project_id=?1`).bind(projectId).first(); await seedOutputs(access.db,projectId,project?.project_type||'maker_project'); message='Missing applicable output plans restored.';
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
