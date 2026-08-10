// Build 235 — server-computed stage readiness, overdue/blocker queue, evidence exports, and guarded duplicate cleanup.
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

const BUILD='235';
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
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function fileSafe(value){return String(value||'creative-project').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'creative-project';}
function response(body,status=200,headers={}){return new Response(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
function check(key,label,passed,actual,expected,correction,{eligibleNotApplicable=false}={}){
  return {key,label,passed:passed?1:0,actual,expected,correction,eligible_not_applicable:eligibleNotApplicable?1:0};
}
function stageReadiness(key,checks,{eligibleNotApplicable=false}={}){
  const blockers=checks.filter((item)=>!item.passed&&!item.eligible_not_applicable);
  return {stage_key:key,ready:blockers.length===0&&checks.some((item)=>item.passed)?1:0,eligible_not_applicable:eligibleNotApplicable?1:0,blocking_count:blockers.length,checks};
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
    'creative_project_profitability','creative_project_knowledge_summaries','creative_project_content_handoffs','creative_project_caip_mirrors',
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

async function projectDeletionPreview(db,projectId){
  const row=await db.prepare(`SELECT
    p.creative_work_project_id,p.project_key,p.project_title,p.project_status,p.product_id,
    COALESCE(w.creative_automation_workflow_id,0) workflow_id,
    COALESCE(w.workflow_status,'') workflow_status,COALESCE(w.current_stage_key,'') current_stage_key,
    COALESCE(w.due_date,'') due_date,COALESCE(w.blocked_reason,'') blocked_reason,COALESCE(w.operator_notes,'') operator_notes,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id) event_count,
    (SELECT COUNT(*) FROM creative_work_outputs o WHERE o.creative_work_project_id=p.creative_work_project_id) output_count,
    (SELECT COUNT(*) FROM creative_work_outputs o WHERE o.creative_work_project_id=p.creative_work_project_id AND (COALESCE(o.output_status,'planned')<>'planned' OR COALESCE(o.approval_status,'needs_review')<>'needs_review' OR o.linked_record_id IS NOT NULL OR TRIM(COALESCE(o.output_url,''))<>'' OR TRIM(COALESCE(o.notes,''))<>'')) modified_output_count,
    (SELECT COUNT(*) FROM creative_work_outputs o WHERE o.creative_work_project_id=p.creative_work_project_id AND (o.linked_record_id IS NOT NULL OR TRIM(COALESCE(o.output_url,''))<>'')) external_output_count,
    (SELECT COUNT(*) FROM creative_project_product_links x WHERE x.creative_work_project_id=p.creative_work_project_id) product_link_count,
    (SELECT COUNT(*) FROM creative_project_product_links x WHERE x.creative_work_project_id=p.creative_work_project_id AND (COALESCE(x.relationship_type,'project_output')<>'project_output' OR COALESCE(x.is_primary,0)<>1 OR TRIM(COALESCE(x.notes,''))<>'')) modified_product_link_count,
    (SELECT COUNT(*) FROM creative_project_evidence_selections x WHERE x.creative_work_project_id=p.creative_work_project_id) evidence_count,
    (SELECT COUNT(*) FROM creative_project_material_reviews x WHERE x.creative_work_project_id=p.creative_work_project_id) material_review_count,
    (SELECT COUNT(*) FROM creative_project_inventory_posts x WHERE x.creative_work_project_id=p.creative_work_project_id) inventory_post_count,
    (SELECT COUNT(*) FROM creative_project_inventory_reversals x WHERE x.creative_work_project_id=p.creative_work_project_id) inventory_reversal_count,
    (SELECT COUNT(*) FROM creative_project_content_handoffs x WHERE x.creative_work_project_id=p.creative_work_project_id) content_handoff_count,
    (SELECT COUNT(*) FROM creative_project_caip_mirrors x WHERE x.creative_work_project_id=p.creative_work_project_id) caip_mirror_count,
    (SELECT COUNT(*) FROM creative_project_profitability x WHERE x.creative_work_project_id=p.creative_work_project_id) profitability_count,
    (SELECT COUNT(*) FROM creative_project_profitability_extensions x WHERE x.creative_work_project_id=p.creative_work_project_id) profitability_extension_count,
    (SELECT COUNT(*) FROM creative_project_cost_allocations x WHERE x.creative_work_project_id=p.creative_work_project_id) allocation_count,
    (SELECT COUNT(*) FROM creative_project_knowledge_summaries x WHERE x.creative_work_project_id=p.creative_work_project_id) knowledge_count,
    (SELECT COUNT(*) FROM creative_automation_stage_reviews r WHERE r.creative_automation_workflow_id=w.creative_automation_workflow_id) stage_review_count,
    (SELECT COUNT(*) FROM creative_automation_events e WHERE e.creative_automation_workflow_id=w.creative_automation_workflow_id AND e.event_type<>'workflow_linked') meaningful_workflow_event_count,
    (SELECT COUNT(*) FROM creative_automation_events e WHERE e.creative_automation_workflow_id=w.creative_automation_workflow_id) workflow_event_count
    FROM creative_work_projects p
    LEFT JOIN creative_automation_workflows w ON w.creative_work_project_id=p.creative_work_project_id
    WHERE p.creative_work_project_id=?1`).bind(projectId).first();
  if(!row) throw Object.assign(new Error('Creative project was not found.'),{code:'NOT_FOUND'});

  const blockers=[];
  // Build 246: a Creative Work Project is user-owned working data. Timeline, material
  // review, costing, local output plans and inventory posting history are allowed to be
  // deleted after an explicit confirmation because inventory is compensated first and an
  // immutable deletion audit is retained. Only downstream/external release evidence blocks
  // this destructive action.
  if(Number(row.external_output_count)>0) blockers.push(`${row.external_output_count} output row(s) point to a linked/public output and must be detached or archived first.`);
  if(Number(row.content_handoff_count)>0) blockers.push(`${row.content_handoff_count} Content Studio handoff(s) exist. Remove the downstream handoff/package first or preserve the project.`);
  if(Number(row.caip_mirror_count)>0) blockers.push(`${row.caip_mirror_count} CAIP mirror link(s) exist. Remove the downstream CAIP mirror first or preserve the project.`);

  const cleanup=[];
  if(id(row.product_id)||Number(row.product_link_count)>0) cleanup.push('project/product link rows (the finished product itself is preserved)');
  if(Number(row.event_count)>0) cleanup.push(`${row.event_count} project timeline/evidence event row(s)`);
  if(Number(row.output_count)>0) cleanup.push(`${row.output_count} project-owned output-plan row(s) without external/public output`);
  if(Number(row.material_review_count)>0) cleanup.push(`${row.material_review_count} material review row(s) after inventory compensation`);
  if(Number(row.evidence_count)>0) cleanup.push(`${row.evidence_count} selected project evidence row(s)`);
  if(Number(row.profitability_count)>0||Number(row.profitability_extension_count)>0||Number(row.allocation_count)>0) cleanup.push('project-owned profitability/cost allocation rows');
  if(Number(row.knowledge_count)>0) cleanup.push(`${row.knowledge_count} project knowledge summary row(s)`);
  if(Number(row.workflow_id)>0) cleanup.push('the master workflow/review history after it is captured in the deletion audit');
  if(Number(row.inventory_post_count)>0) cleanup.push(`${row.inventory_post_count} inventory post row(s); every unreversed consumption is returned to raw inventory before deletion`);
  cleanup.push('the Creative Project record');
  const confirmation = Number(row.inventory_post_count)>0 ? `DELETE AND RETURN ${row.project_key}` : `DELETE ${row.project_key}`;
  return {allowed:blockers.length===0,project_id:projectId,project_key:row.project_key,project_title:row.project_title,blockers,cleanup,confirmation,
    inventory_post_count:Number(row.inventory_post_count||0),inventory_reversal_count:Number(row.inventory_reversal_count||0)};
}


async function projectInventoryReturnPlan(db, projectId) {
  const rows = await safeAll(db, `
    SELECT p.creative_project_inventory_post_id,p.site_item_inventory_id,
           COALESCE(p.stock_quantity_consumed,0) stock_quantity_consumed,
           COALESCE(p.posting_status,'posted') posting_status,
           sii.source_type,sii.external_key,sii.item_name,
           COALESCE(sii.on_hand_quantity,0) current_on_hand_quantity,
           COALESCE(sii.reserved_quantity,0) current_reserved_quantity,
           COALESCE(sii.incoming_quantity,0) current_incoming_quantity,
           COALESCE(iud.usage_quantity_consumed,p.stock_quantity_consumed,0) usage_quantity_consumed,
           COALESCE(iud.usage_unit_label,sii.usage_unit_label,'unit') posted_usage_unit_label,
           COALESCE(iud.stock_unit_label,sii.stock_unit_label,'unit') posted_stock_unit_label,
           COALESCE(iud.tracking_mode,'exact') posted_tracking_mode,
           p.creative_project_material_review_id,
           r.creative_project_inventory_reversal_id
    FROM creative_project_inventory_posts p
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id
    LEFT JOIN creative_project_inventory_usage_details iud ON iud.creative_project_inventory_post_id=p.creative_project_inventory_post_id
    LEFT JOIN creative_project_inventory_reversals r
      ON r.creative_project_inventory_post_id=p.creative_project_inventory_post_id
    WHERE p.creative_work_project_id=?1
    ORDER BY p.creative_project_inventory_post_id ASC
  `,[projectId]);
  const byInventory = new Map();
  for (const row of rows) {
    if (row.creative_project_inventory_reversal_id || String(row.posting_status || '').toLowerCase() === 'reversed') continue;
    const quantity = Math.max(0, Number(row.stock_quantity_consumed || 0));
    if (!(quantity > 0)) continue;
    const inventoryId = Number(row.site_item_inventory_id || 0);
    if (!inventoryId) continue;
    const current = byInventory.get(inventoryId) || {
      site_item_inventory_id: inventoryId,
      source_type: row.source_type || null,
      external_key: row.external_key || null,
      item_name: row.item_name || row.external_key || `Inventory ${inventoryId}`,
      current_on_hand_quantity: Number(row.current_on_hand_quantity || 0),
      restore_quantity: 0,
      post_ids: []
    };
    current.restore_quantity += quantity;
    current.post_ids.push(Number(row.creative_project_inventory_post_id || 0));
    byInventory.set(inventoryId,current);
  }
  return { rows, restore_rows:[...byInventory.values()] };
}

// Build 246: return project inventory post-by-post before destructive cleanup. Each post
// is marked reversed immediately after its guarded stock restoration. If deletion later
// fails, a retry sees the reversal and cannot return the same stock twice.
async function returnUnreversedProjectInventory(db, projectId, userId, projectKey) {
  const plan=await projectInventoryReturnPlan(db,projectId);
  const returned=[];
  for(const post of plan.rows){
    if(post.creative_project_inventory_reversal_id || String(post.posting_status||'').toLowerCase()==='reversed') continue;
    const restored=Math.max(0,Number(post.stock_quantity_consumed||0));
    if(!(restored>0)) continue;
    const inventoryId=Number(post.site_item_inventory_id||0);
    const postId=Number(post.creative_project_inventory_post_id||0);
    if(!inventoryId||!postId) throw Object.assign(new Error('A project inventory post is missing its inventory identity; deletion stopped before cleanup.'),{status:409});

    const live=await db.prepare(`SELECT site_item_inventory_id,source_type,external_key,item_name,
      COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,
      COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(stock_unit_label,'unit') stock_unit_label
      FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1`).bind(inventoryId).first();
    if(!live) throw Object.assign(new Error(`Inventory ${inventoryId} no longer exists; project deletion stopped without discarding the project.`),{status:409});
    const previous=Math.max(0,Number(live.on_hand_quantity||0));
    const next=Number((previous+restored).toFixed(6));
    const update=await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<0.000001`).bind(next,inventoryId,previous).run();
    if(Number(update?.meta?.changes||0)<1){
      throw Object.assign(new Error(`Inventory changed while returning ${live.item_name||post.item_name||inventoryId}. No project rows were deleted; reload and try again.`),{status:409});
    }

    const reason=`Creative Project ${projectKey} deleted; unreversed project consumption returned to raw inventory.`;
    const reversalStatements=[
      db.prepare(`INSERT INTO creative_project_inventory_reversals (
        creative_project_inventory_post_id,creative_work_project_id,site_item_inventory_id,stock_quantity_restored,
        previous_on_hand_quantity,new_on_hand_quantity,reason,authorized_by,authorized_at
      ) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(postId,projectId,inventoryId,restored,previous,next,reason,userId),
      db.prepare(`UPDATE creative_project_inventory_posts SET posting_status='reversed',notes=TRIM(COALESCE(notes,'') || ?)
        WHERE creative_project_inventory_post_id=? AND LOWER(COALESCE(posting_status,'posted'))<>'reversed'`).bind(` | Reversed on project deletion: ${reason}`,postId),
      db.prepare(`INSERT INTO site_inventory_movements(
        site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
        previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
        previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
      ) VALUES(?,?,?,?, 'correction', ?,?,?,?,?,?,?,?, ?,?,CURRENT_TIMESTAMP)`).bind(
        inventoryId,live.source_type||null,live.external_key||null,live.item_name||post.item_name||`Inventory ${inventoryId}`,restored,previous,next,
        Number(live.reserved_quantity||0),Number(live.reserved_quantity||0),Number(live.incoming_quantity||0),Number(live.incoming_quantity||0),reason,userId
      )
    ];
    if(Number(post.creative_project_material_review_id||0)>0){
      reversalStatements.push(db.prepare(`UPDATE creative_project_material_reviews SET inventory_consumed=0 WHERE creative_project_material_review_id=?`).bind(Number(post.creative_project_material_review_id)));
    }
    const usageRestored=Math.max(0,Number(post.usage_quantity_consumed||0));
    if(usageRestored>0){
      reversalStatements.push(db.prepare(`INSERT INTO site_inventory_usage_movements(
        site_item_inventory_id,usage_quantity_delta,usage_unit_label,stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at
      ) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(
        inventoryId,usageRestored,post.posted_usage_unit_label||'unit',restored,post.posted_stock_unit_label||live.stock_unit_label||'unit',
        post.posted_tracking_mode||'exact',String(post.posted_tracking_mode||'').toLowerCase()==='estimated'?1:0,reason,userId
      ));
    }
    try{
      await db.batch(reversalStatements);
    }catch(error){
      // The project remains intact. Restore the pre-return quantity only if stock is still
      // exactly at the value this attempt wrote; otherwise stop for manual review.
      await db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP
        WHERE site_item_inventory_id=? AND ABS(on_hand_quantity-?)<0.000001`).bind(previous,inventoryId,next).run().catch(()=>null);
      throw Object.assign(new Error(`Inventory return evidence could not be committed for ${live.item_name||post.item_name||inventoryId}; the project was not deleted. ${error?.message||''}`.trim()),{status:409});
    }
    returned.push({creative_project_inventory_post_id:postId,site_item_inventory_id:inventoryId,item_name:live.item_name||post.item_name,restore_quantity:restored,previous_on_hand_quantity:previous,new_on_hand_quantity:next});
  }
  return {planned_restore_rows:plan.restore_rows,returned_posts:returned,all_inventory_posts:plan.rows};
}

async function projectDetail(db,project){
  const projectId=id(project.creative_work_project_id);
  const workflow=project.creative_automation_workflow_id?project:null;
  const handoff=await safeFirst(db,'SELECT content_project_id,handoff_status,evidence_count FROM creative_project_content_handoffs WHERE creative_work_project_id=?1 ORDER BY creative_project_content_handoff_id DESC LIMIT 1',[projectId]);
  const mirror=await safeFirst(db,'SELECT creative_project_id,mirror_status,evidence_count FROM creative_project_caip_mirrors WHERE creative_work_project_id=?1 ORDER BY creative_project_caip_mirror_id DESC LIMIT 1',[projectId]);
  const contentId=id(handoff?.content_project_id);
  const caipId=id(mirror?.creative_project_id);
  const summary=await safeFirst(db,`SELECT
    (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=?1) event_count,
    (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=?1 AND TRIM(COALESCE(material_name,''))<>'') material_count,
    (SELECT COUNT(*) FROM creative_project_material_reviews WHERE creative_work_project_id=?1 AND review_status='approved') reviewed_material_count,
    (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=?1 AND selected=1) evidence_count,
    (SELECT COUNT(*) FROM creative_work_outputs WHERE creative_work_project_id=?1) output_count,
    (SELECT COUNT(*) FROM creative_work_outputs WHERE creative_work_project_id=?1 AND output_status='complete') completed_output_count,
    (SELECT COUNT(*) FROM creative_work_outputs WHERE creative_work_project_id=?1 AND output_status='complete' AND (TRIM(COALESCE(output_url,''))<>'' OR TRIM(COALESCE(notes,''))<>'')) result_output_count,
    (SELECT COUNT(*) FROM creative_project_profitability WHERE creative_work_project_id=?1) profitability_count,
    (SELECT COUNT(*) FROM creative_project_knowledge_summaries WHERE creative_work_project_id=?1 AND review_status='approved') approved_knowledge_count,
    (SELECT COUNT(*) FROM content_project_media WHERE content_project_id=?2) content_media_count,
    (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=?2) deliverable_count,
    (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=?2 AND approval_status='approved') approved_deliverable_count,
    (SELECT COUNT(*) FROM content_publications WHERE content_project_id=?2) publication_count,
    (SELECT COUNT(*) FROM content_publications WHERE content_project_id=?2 AND content_status IN ('published','approved')) released_publication_count`,[projectId,contentId])||{};
  const eventCount=Number(summary.event_count||0);
  const materialCount=Number(summary.material_count||0);
  const reviewedMaterials=Number(summary.reviewed_material_count||0);
  const evidenceCount=Number(summary.evidence_count||0);
  const outputCount=Number(summary.output_count||0);
  const completedOutputs=Number(summary.completed_output_count||0);
  const resultOutputs=Number(summary.result_output_count||0);
  const profitabilityCount=Number(summary.profitability_count||0);
  const approvedKnowledge=Number(summary.approved_knowledge_count||0);
  const mediaCount=Number(summary.content_media_count||0);
  const deliverableCount=Number(summary.deliverable_count||0);
  const approvedDeliverables=Number(summary.approved_deliverable_count||0);
  const publicationCount=Number(summary.publication_count||0);
  const releasedCount=Number(summary.released_publication_count||0);
  const reviews=workflow?await safeAll(db,'SELECT * FROM creative_automation_stage_reviews WHERE creative_automation_workflow_id=?1',[workflow.creative_automation_workflow_id]):[];
  const reviewMap=Object.fromEntries(reviews.map((row)=>[row.stage_key,row]));
  const facts={event_count:eventCount,material_count:materialCount,reviewed_material_count:reviewedMaterials,evidence_count:evidenceCount,output_count:outputCount,completed_output_count:completedOutputs,result_output_count:resultOutputs,profitability_count:profitabilityCount,approved_knowledge_count:approvedKnowledge,content_project_id:contentId,content_media_count:mediaCount,deliverable_count:deliverableCount,approved_deliverable_count:approvedDeliverables,caip_project_id:caipId,caip_mirror_status:mirror?.mirror_status||'',publication_count:publicationCount,released_publication_count:releasedCount};
  const readiness={
    process:stageReadiness('process',[
      check('summary','Project summary',text(project.summary,10).length>=10,text(project.summary,10).length>=10?'Saved':'Missing or too short','A factual summary of at least 10 characters','Add the factual project summary in Creative Process.'),
      check('timeline','Timeline evidence',eventCount>0,`${eventCount} timeline entr${eventCount===1?'y':'ies'}`,'At least one factual timeline entry','Add a dated process, experiment, repair, lesson, or result entry.')
    ]),
    materials_cost:stageReadiness('materials_cost',[
      check('material_review','Material review',materialCount>0&&reviewedMaterials>=materialCount,materialCount?`${reviewedMaterials} of ${materialCount} approved`:'No material rows',materialCount?'Every material row approved':'Mark the stage not applicable only after deliberate review','Review quantities, cost, waste/reuse, and inventory action for every material row.',{eligibleNotApplicable:materialCount===0}),
      check('profitability','Cost assumptions',profitabilityCount>0,profitabilityCount?'Profitability record saved':'No profitability record','Saved labour, packaging, overhead, channel, shipping, and revenue assumptions','Save the project profitability record or document why this stage is not applicable.',{eligibleNotApplicable:materialCount===0})
    ],{eligibleNotApplicable:materialCount===0}),
    assets_evidence:stageReadiness('assets_evidence',[
      check('evidence','Selected evidence',evidenceCount>0,`${evidenceCount} selected record${evidenceCount===1?'':'s'}`,'At least one selected source record','Select factual timeline evidence for the intended story.'),
      check('rights','Project rights',project.rights_status==='cleared',project.rights_status||'needs_review','Rights status cleared','Review ownership, consent, privacy, and intended public/internal use before completion.'),
      check('caip','CAIP handoff',caipId>0&&Number(mirror?.evidence_count||0)>0,caipId?`CAIP ${caipId}, ${Number(mirror?.evidence_count||0)} evidence`:'Not linked','A CAIP mirror containing reviewed source references','Mirror the selected evidence into CAIP and complete its rights/privacy review.')
    ]),
    content_package:stageReadiness('content_package',[
      check('handoff','Content handoff',contentId>0,contentId?`Content project ${contentId}`:'Not linked','A source-linked Content Studio project','Create or refresh the reviewed Creative Process → Content Studio handoff.'),
      check('deliverables','Deliverable plan',deliverableCount>0,`${deliverableCount} deliverable${deliverableCount===1?'':'s'}`,'At least one planned deliverable','Restore or create the required video, social, gallery, GBP, SEO, blog, thumbnail, and caption plan.')
    ]),
    channel_review:stageReadiness('channel_review',[
      check('channel_approvals','Channel approvals',deliverableCount>0&&approvedDeliverables>=deliverableCount,`${approvedDeliverables} of ${deliverableCount} approved`,'Every intended deliverable approved or removed as not applicable','Review channel facts, privacy, format, media, caption, and tracking one deliverable at a time.')
    ]),
    public_release:stageReadiness('public_release',[
      check('release_record','Release result',publicationCount>0&&releasedCount>0,`${releasedCount} of ${publicationCount} approved/published`,'At least one observable approved or published release record','Keep the draft private or correct the failed release requirement before deliberate approval/publish.')
    ]),
    measure_repurpose:stageReadiness('measure_repurpose',[
      check('result_evidence','Factual result evidence',resultOutputs>0,`${resultOutputs} completed output${resultOutputs===1?'':'s'} with URL/notes`,'At least one completed output with an observable result reference','Record the actual provider URL/ID or factual result notes; do not infer performance.'),
      check('reviewed_learning','Reviewed learning',approvedKnowledge>0,`${approvedKnowledge} approved knowledge summar${approvedKnowledge===1?'y':'ies'}`,'At least one approved lesson or future recommendation','Review and approve the lesson learned or future-project recommendation against source evidence.')
    ])
  };
  const stages=STAGES.map((stage)=>{
    const review=reviewMap[stage.key]||{review_status:'not_started',evidence_reference:'',review_notes:''};
    const source=readiness[stage.key];
    let effective=review.review_status;
    if(review.review_status==='not_applicable'&&source.eligible_not_applicable) effective='not_applicable';
    else if(review.review_status==='complete'&&source.ready) effective='complete';
    else if(review.review_status==='complete'&&!source.ready) effective='needs_source_evidence';
    else if(review.review_status==='not_applicable'&&!source.eligible_not_applicable) effective='needs_source_evidence';
    return {...stage,...review,readiness:source,source_ready:source.ready,effective_status:effective};
  });
  return {project,workflow:workflow?.creative_automation_workflow_id?workflow:null,handoff,mirror,facts,stages};
}

function buildWorkQueue(projects){
  const today=new Date().toISOString().slice(0,10);
  const soon=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  return projects.filter((row)=>row.creative_automation_workflow_id&&!['released','archived'].includes(row.workflow_status)).map((row)=>{
    const due=text(row.due_date,30);
    const blocked=row.workflow_status==='blocked'||!!text(row.blocked_reason,2000);
    const overdue=!!due&&due<today;
    const dueSoon=!!due&&due>=today&&due<=soon;
    const unowned=!id(row.owner_user_id);
    let priority='active';let priority_order=50;let reason=`Continue ${String(row.current_stage_key||'process').replaceAll('_',' ')}.`;
    if(blocked){priority='blocked';priority_order=10;reason=text(row.blocked_reason,300)||'Workflow is blocked and requires a documented correction.';}
    else if(overdue){priority='overdue';priority_order=20;reason=`Due ${due}; review the current stage and assign the next action.`;}
    else if(dueSoon){priority='due_soon';priority_order=30;reason=`Due ${due}; confirm evidence and the next owner action.`;}
    else if(unowned){priority='unassigned';priority_order=40;reason='Assign an owner before the workflow becomes time-sensitive.';}
    return {creative_work_project_id:id(row.creative_work_project_id),project_key:row.project_key,project_title:row.project_title,workflow_status:row.workflow_status,current_stage_key:row.current_stage_key,due_date:due,owner_user_id:id(row.owner_user_id)||null,blocked_reason:row.blocked_reason||'',priority,priority_order,reason};
  }).sort((a,b)=>a.priority_order-b.priority_order||String(a.due_date||'9999').localeCompare(String(b.due_date||'9999'))||a.project_title.localeCompare(b.project_title)).slice(0,50);
}

async function evidencePacket(db,projectId){
  const project=await safeFirst(db,`SELECT p.*,w.creative_automation_workflow_id,w.workflow_key,w.workflow_status,w.current_stage_key,w.owner_user_id,w.due_date,w.blocked_reason,w.operator_notes,w.updated_at workflow_updated_at
    FROM creative_work_projects p LEFT JOIN creative_automation_workflows w ON w.creative_work_project_id=p.creative_work_project_id
    WHERE p.creative_work_project_id=?1`,[projectId]);
  if(!project) throw Object.assign(new Error('Creative project was not found.'),{code:'NOT_FOUND'});
  const detail=await projectDetail(db,project);
  const contentId=id(detail.handoff?.content_project_id);
  const workflowId=id(detail.workflow?.creative_automation_workflow_id);
  const records={
    timeline:await safeAll(db,`SELECT e.creative_work_event_id,e.event_type,e.event_title,e.event_notes,e.occurred_at,e.duration_minutes,e.material_name,e.material_quantity,e.material_unit,e.material_cost_cents,e.media_url,e.is_public_candidate,
      COALESCE(s.selected,0) evidence_selected,COALESCE(s.evidence_role,'') evidence_role,COALESCE(r.review_status,'') material_review_status,COALESCE(r.actual_quantity,0) actual_quantity,COALESCE(r.waste_quantity,0) waste_quantity,COALESCE(r.reusable_quantity,0) reusable_quantity,COALESCE(r.approved_cost_cents,0) approved_cost_cents
      FROM creative_work_events e LEFT JOIN creative_project_evidence_selections s ON s.creative_work_event_id=e.creative_work_event_id AND s.creative_work_project_id=e.creative_work_project_id
      LEFT JOIN creative_project_material_reviews r ON r.creative_work_event_id=e.creative_work_event_id AND r.creative_work_project_id=e.creative_work_project_id
      WHERE e.creative_work_project_id=?1 ORDER BY e.occurred_at,e.creative_work_event_id`,[projectId]),
    outputs:await safeAll(db,'SELECT output_key,output_label,output_group,output_status,approval_status,linked_record_type,linked_record_id,output_url,notes,updated_at FROM creative_work_outputs WHERE creative_work_project_id=?1 ORDER BY output_group,output_label',[projectId]),
    inventory_posts:await safeAll(db,`SELECT p.creative_project_inventory_post_id,p.creative_work_event_id,p.site_item_inventory_id,p.stock_quantity_consumed,p.previous_on_hand_quantity,p.new_on_hand_quantity,p.posting_status,p.posted_at,p.notes,
      r.creative_project_inventory_reversal_id,r.stock_quantity_restored,r.reason reversal_reason,r.authorized_at reversal_authorized_at
      FROM creative_project_inventory_posts p LEFT JOIN creative_project_inventory_reversals r ON r.creative_project_inventory_post_id=p.creative_project_inventory_post_id
      WHERE p.creative_work_project_id=?1 ORDER BY p.posted_at`,[projectId]),
    content_handoffs:await safeAll(db,'SELECT creative_project_content_handoff_id,content_project_id,handoff_status,evidence_count,created_at FROM creative_project_content_handoffs WHERE creative_work_project_id=?1 ORDER BY created_at',[projectId]),
    caip_mirrors:await safeAll(db,'SELECT creative_project_id,source_handoff_id,evidence_count,mirror_status,mirrored_at,notes FROM creative_project_caip_mirrors WHERE creative_work_project_id=?1 ORDER BY mirrored_at',[projectId]),
    profitability:await safeAll(db,`SELECT p.*,COALESCE(x.channel_fee_percent,0) channel_fee_percent,COALESCE(x.fixed_channel_fee_cents,p.channel_fee_cents,0) fixed_channel_fee_cents FROM creative_project_profitability p LEFT JOIN creative_project_profitability_extensions x ON x.creative_work_project_id=p.creative_work_project_id WHERE p.creative_work_project_id=?1`,[projectId]),
    allocations:await safeAll(db,'SELECT product_id,allocation_percent,allocated_cost_cents,notes,updated_at FROM creative_project_cost_allocations WHERE creative_work_project_id=?1 ORDER BY product_id',[projectId]),
    knowledge:await safeAll(db,'SELECT summary_type,summary_text,source_evidence_count,review_status,reviewed_at,updated_at FROM creative_project_knowledge_summaries WHERE creative_work_project_id=?1 ORDER BY summary_type',[projectId]),
    stage_reviews:workflowId?await safeAll(db,'SELECT stage_key,review_status,evidence_reference,review_notes,reviewed_at,updated_at FROM creative_automation_stage_reviews WHERE creative_automation_workflow_id=?1 ORDER BY creative_automation_stage_review_id',[workflowId]):[],
    workflow_events:workflowId?await safeAll(db,'SELECT event_type,stage_key,previous_status,next_status,details_json,created_at FROM creative_automation_events WHERE creative_automation_workflow_id=?1 ORDER BY created_at,creative_automation_event_id',[workflowId]):[],
    deliverables:contentId?await safeAll(db,'SELECT deliverable_key,channel_key,deliverable_type,title,deliverable_status,approval_status,output_url,thumbnail_url,review_notes,approved_at,published_at,updated_at FROM content_project_deliverables WHERE content_project_id=?1 ORDER BY channel_key,deliverable_key',[contentId]):[],
    publications:contentId?await safeAll(db,'SELECT destination,publication_slug,title,canonical_path,content_status,hero_media_url,hero_alt_text,review_notes,approved_at,published_at,unpublished_at,updated_at FROM content_publications WHERE content_project_id=?1 ORDER BY destination,publication_slug',[contentId]):[]
  };
  return {schema:'devilndove.creative_evidence_packet.v1',build:BUILD,generated_at:new Date().toISOString(),statement:'Internal review export. It records saved facts and review states; it does not prove provider publication, rights clearance, physical production, or performance beyond the referenced evidence.',project:detail.project,workflow:detail.workflow,stage_readiness:detail.stages.map(({key,label,authority,review_status,effective_status,evidence_reference,review_notes,readiness})=>({key,label,authority,review_status,effective_status,evidence_reference,review_notes,readiness})),facts:detail.facts,records};
}

function tableHtml(rows,columns,empty='No saved records.'){if(!rows.length)return `<p class="muted">${escapeHtml(empty)}</p>`;return `<div class="table-wrap"><table><thead><tr>${columns.map(([key,label])=>`<th>${escapeHtml(label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row)=>`<tr>${columns.map(([key])=>`<td>${escapeHtml(row?.[key]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function evidencePacketHtml(packet){
  const p=packet.project||{};const w=packet.workflow||{};
  const readiness=(packet.stage_readiness||[]).map((stage)=>({stage:stage.label,review:stage.review_status,effective:stage.effective_status,source_ready:stage.readiness?.ready?'Yes':'No',blockers:stage.readiness?.blocking_count||0,evidence:stage.evidence_reference||''}));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(p.project_title||'Creative project')} — Evidence Packet</title><style>:root{font-family:Arial,sans-serif;color:#171717;background:#fff}body{max-width:1100px;margin:0 auto;padding:28px;line-height:1.45}h1,h2{line-height:1.2}h2{border-bottom:2px solid #444;padding-bottom:5px;margin-top:28px}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.meta div{border:1px solid #bbb;border-radius:8px;padding:10px}.notice{padding:12px;border:2px solid #765c18;background:#fff8dc}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #bbb;padding:7px;text-align:left;vertical-align:top}th{background:#eee}.muted{color:#555}.no-print{margin:0 0 18px}.no-print button{padding:10px 16px}@media print{body{max-width:none;padding:0}.no-print{display:none}h2{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid}}</style></head><body><div class="no-print"><button type="button" onclick="window.print()">Print or save as PDF</button></div><p class="notice"><strong>Internal evidence packet.</strong> ${escapeHtml(packet.statement)}</p><h1>${escapeHtml(p.project_title||'Creative project')}</h1><div class="meta"><div><strong>Project key</strong><br>${escapeHtml(p.project_key||'')}</div><div><strong>Project status</strong><br>${escapeHtml(p.project_status||'')}</div><div><strong>Workflow status</strong><br>${escapeHtml(w.workflow_status||'Not tracked')}</div><div><strong>Current stage</strong><br>${escapeHtml(w.current_stage_key||'')}</div><div><strong>Due date</strong><br>${escapeHtml(w.due_date||'Not set')}</div><div><strong>Generated</strong><br>${escapeHtml(packet.generated_at)}</div></div><h2>Project summary</h2><p>${escapeHtml(p.summary||'No summary saved.')}</p><p><strong>Objective:</strong> ${escapeHtml(p.objective||'Not saved.')}</p><p><strong>Story angle:</strong> ${escapeHtml(p.story_angle||'Not saved.')}</p><h2>Stage readiness</h2>${tableHtml(readiness,[['stage','Stage'],['review','Human review'],['effective','Effective status'],['source_ready','Source ready'],['blockers','Blocking checks'],['evidence','Evidence reference']])}<h2>Timeline and material evidence</h2>${tableHtml(packet.records.timeline,[['occurred_at','When'],['event_type','Type'],['event_title','Title'],['event_notes','Notes'],['material_name','Material'],['material_quantity','Planned quantity'],['material_review_status','Material review'],['approved_cost_cents','Approved cost (cents)'],['media_url','Media reference'],['evidence_selected','Selected evidence']])}<h2>Outputs</h2>${tableHtml(packet.records.outputs,[['output_group','Group'],['output_label','Output'],['output_status','Status'],['approval_status','Approval'],['output_url','Result URL'],['notes','Notes']])}<h2>Inventory postings and reversals</h2>${tableHtml(packet.records.inventory_posts,[['posted_at','Posted'],['site_item_inventory_id','Inventory item'],['stock_quantity_consumed','Consumed'],['posting_status','Status'],['new_on_hand_quantity','New on hand'],['reversal_reason','Reversal reason'],['reversal_authorized_at','Reversed']])}<h2>Content deliverables</h2>${tableHtml(packet.records.deliverables,[['channel_key','Channel'],['title','Deliverable'],['deliverable_status','Status'],['approval_status','Approval'],['output_url','Output URL'],['review_notes','Review notes']])}<h2>Publications</h2>${tableHtml(packet.records.publications,[['destination','Destination'],['title','Title'],['content_status','Status'],['canonical_path','Canonical path'],['published_at','Published'],['review_notes','Review notes']])}<h2>Reviewed lessons and recommendations</h2>${tableHtml(packet.records.knowledge,[['summary_type','Type'],['review_status','Review'],['source_evidence_count','Source count'],['summary_text','Summary'],['reviewed_at','Reviewed']])}<h2>Master workflow history</h2>${tableHtml(packet.records.workflow_events,[['created_at','When'],['stage_key','Stage'],['event_type','Event'],['previous_status','Previous'],['next_status','Next'],['details_json','Details']])}</body></html>`;
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
  const workQueue=buildWorkQueue(projects);
  return {ok:true,build:BUILD,mode:'server_readiness_queue_export_specialist_authorities_preserved',stage_definitions:STAGES,projects,detail,recent_events:events,work_queue:workQueue,stats:{projects:projects.length,tracked,untracked:projects.length-tracked,blocked:projects.filter((row)=>row.workflow_status==='blocked').length,overdue:workQueue.filter((row)=>row.priority==='overdue').length,unassigned:workQueue.filter((row)=>row.priority==='unassigned').length,ready:projects.filter((row)=>row.workflow_status==='ready_for_release').length,released:projects.filter((row)=>row.workflow_status==='released').length}};
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
    const url=new URL(context.request.url);
    const selected=id(url.searchParams.get('project_id'));
    const exportFormat=text(url.searchParams.get('export'),30);
    if(exportFormat){
      if(!selected)return json({ok:false,error:'Choose a Creative Project before exporting evidence.'},400);
      if(!['html','json'].includes(exportFormat))return json({ok:false,error:'Choose html or json evidence export format.'},400);
      const packet=await evidencePacket(granted.db,selected);
      const filename=`${fileSafe(packet.project?.project_key||packet.project?.project_title)}-evidence-packet`;
      if(exportFormat==='json')return response(JSON.stringify(packet,null,2),200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="${filename}.json"`});
      return response(evidencePacketHtml(packet),200,{'Content-Type':'text/html; charset=utf-8','Content-Disposition':`inline; filename="${filename}.html"`});
    }
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
    const projectId=id(body.project_id);
    if(!projectId) return json({ok:false,error:'Choose a Creative Project first.'},400);
    const action=text(body.action,80);
    if(action==='delete_project_preview'){
      const deletion=await projectDeletionPreview(granted.db,projectId);
      return json({...await payload(granted.db,projectId),deletion,message:deletion.allowed?'This appears to be an unused duplicate and is eligible for guarded deletion.':'This project contains work that must be preserved or corrected before deletion.'});
    }
    if(action==='delete_project'){
      const deletion=await projectDeletionPreview(granted.db,projectId);
      if(!deletion.allowed)return json({ok:false,error:'This project has downstream/public references that must be removed or preserved before permanent deletion.',deletion},409);
      if(text(body.confirmation,220)!==deletion.confirmation)return json({ok:false,error:`Type ${deletion.confirmation} exactly to confirm project deletion and any inventory return.`,deletion},400);

      const projectRow=await safeFirst(granted.db,'SELECT * FROM creative_work_projects WHERE creative_work_project_id=?1',[projectId]);
      const inventoryReturn=await returnUnreversedProjectInventory(granted.db,projectId,granted.adminUser.user_id,deletion.project_key);
      const statements=[];
      statements.push(granted.db.prepare(`INSERT INTO creative_project_deletion_audit(
        creative_work_project_id_deleted,project_key,project_title,product_id,project_snapshot_json,
        inventory_return_json,deletion_reason,deleted_by_user_id,deleted_at
      ) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,CURRENT_TIMESTAMP)`).bind(
        projectId,deletion.project_key,deletion.project_title,Number(projectRow?.product_id||0)||null,
        JSON.stringify({project:projectRow,deletion_preview:deletion}),
        JSON.stringify(inventoryReturn),
        text(body.deletion_reason,1000)||'Creative Project permanently deleted by administrator.',
        granted.adminUser.user_id
      ));
      // Reversal rows restrict inventory-post deletion. Their evidence is preserved in the
      // deletion audit above before these project-owned rows are removed.
      statements.push(granted.db.prepare('DELETE FROM creative_project_inventory_reversals WHERE creative_work_project_id=?1').bind(projectId));
      statements.push(granted.db.prepare('DELETE FROM creative_project_inventory_posts WHERE creative_work_project_id=?1').bind(projectId));
      statements.push(granted.db.prepare('DELETE FROM creative_automation_workflows WHERE creative_work_project_id=?1').bind(projectId));
      statements.push(granted.db.prepare('DELETE FROM creative_work_projects WHERE creative_work_project_id=?1').bind(projectId));
      await granted.db.batch(statements);
      await auditAdminAction(context.env,context.request,granted.adminUser,{action_type:'creative_automation_delete_project_with_inventory_return',target_type:'creative_work_project',target_id:projectId,target_key:deletion.project_key,details:{project_title:deletion.project_title,cleanup:deletion.cleanup,inventory_return:inventoryReturn.returned_posts}});
      return json({...await payload(granted.db,0),message:`Project “${deletion.project_title}” was deleted. ${inventoryReturn.returned_posts.length?`${inventoryReturn.returned_posts.length} raw inventory posting(s) were restored from unreversed project consumption.`:'No unreversed raw inventory consumption required restoration.'}`});
    }
    const workflow=await ensureWorkflow(granted.db,projectId,granted.adminUser.user_id);
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
    return json({ok:false,error:error?.message||'Creative Automation Studio could not save.'},Number(error?.status||(error?.code==='NOT_FOUND'?404:500)));
  }
}
