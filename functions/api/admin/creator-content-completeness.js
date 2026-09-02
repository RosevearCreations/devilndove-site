// Release 467 Build 17 — read-only Creator & Content Completeness projection.
// Existing project, CAIP and Media Studio authorities remain the owners of all writes.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function number(value){const n=Number(value||0);return Number.isFinite(n)?n:0;}
function text(value,max=1200){return normalizeText(value||'').slice(0,max);}
async function tableExists(db,name){const row=await db.prepare("SELECT 1 ok FROM sqlite_schema WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);return Boolean(row?.ok);}
async function grouped(db,sql,key){const result=rows(await db.prepare(sql).all().catch(()=>({results:[]})));return new Map(result.map(row=>[Number(row[key]||0),row]));}

function projectReadiness(project, facts={}){
  const missing=[];
  const materialCount=number(facts.material_count);
  const outputCount=number(facts.output_count);
  const completedOutputCount=number(facts.completed_output_count);
  const handoffCount=number(facts.handoff_count);
  const knowledgeCount=number(facts.knowledge_count);
  const trackedCost=number(facts.tracked_material_cost_cents);
  const actualCost=number(project.actual_cost_cents);
  const revenue=number(project.sales_revenue_cents);
  if(!materialCount) missing.push('material usage');
  if(!(actualCost>0||trackedCost>0||facts.profitability_present)) missing.push('costing');
  if(!(outputCount>0&&completedOutputCount>0)) missing.push('finished output');
  if(!(text(project.lessons,300)||knowledgeCount)) missing.push('lessons learned');
  if(!handoffCount) missing.push('Content Studio handoff');
  const checks=5-missing.length;
  return {
    score:Math.round((checks/5)*100),missing,
    rough_project_result_cents:revenue-(actualCost||trackedCost),
    material_count:materialCount,output_count:outputCount,completed_output_count:completedOutputCount,
    handoff_count:handoffCount,knowledge_count:knowledgeCount,tracked_material_cost_cents:trackedCost,
  };
}

function storyScore(row){
  let score=0; const reasons=[];
  if(String(row.review_status||'').toLowerCase()==='approved'){score+=30;reasons.push('review approved');}
  else if(String(row.review_status||'').toLowerCase()==='needs_review'){score+=10;reasons.push('awaiting review');}
  const verification=String(row.verification_status||'').toLowerCase();
  if(verification&& !['unverified','unknown',''].includes(verification)){score+=15;reasons.push('source verification recorded');}
  const confidence=Math.max(0,Math.min(100,number(row.confidence_score)));score+=Math.round(confidence*.25);if(confidence>=70)reasons.push('strong confidence');
  if(text(row.transcript_excerpt,20)){score+=10;reasons.push('transcript evidence');}
  if(text(row.note_text,20)){score+=5;reasons.push('review note');}
  if(number(row.linked_story_evidence_id)){score+=10;reasons.push('linked story evidence');}
  if(number(row.end_seconds)>number(row.start_seconds)){score+=5;reasons.push('bounded evidence range');}
  return {score:Math.min(100,score),reasons};
}
function recommendMedia(row){
  const type=String(row.media_type||'photo').toLowerCase();
  if(type==='logo'||type==='icon') return 'Review for @site brand/static slots';
  if(type==='banner') return 'Review for public banner/header slots';
  if(type==='background') return 'Review for public background slots';
  if(['proof','process','technique','evidence','materials'].includes(type)) return 'Review for Gallery, About or educational static-page evidence';
  return 'Review for Gallery or an unfilled public/static image slot';
}

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  try{
    const required=['creative_work_projects','creative_work_events','creative_work_outputs','creative_project_content_handoffs','creative_project_knowledge_summaries','creative_project_profitability','creative_media_evidence_ranges','creative_assets','creative_projects','media_assets','managed_media_metadata','media_content_assignments','media_content_slots'];
    const readiness={}; for(const name of required) readiness[name]=await tableExists(db,name);

    let projects=[];
    if(readiness.creative_work_projects){
      const source=rows(await db.prepare('SELECT * FROM creative_work_projects ORDER BY datetime(updated_at) DESC,creative_work_project_id DESC LIMIT 120').all());
      const events=readiness.creative_work_events?await grouped(db,"SELECT creative_work_project_id,COUNT(CASE WHEN TRIM(COALESCE(material_name,''))<>'' THEN 1 END) material_count,COALESCE(SUM(material_cost_cents),0) tracked_material_cost_cents,COALESCE(SUM(duration_minutes),0) tracked_minutes FROM creative_work_events WHERE COALESCE(entry_status,'active')='active' GROUP BY creative_work_project_id",'creative_work_project_id'):new Map();
      const outputs=readiness.creative_work_outputs?await grouped(db,"SELECT creative_work_project_id,COUNT(*) output_count,SUM(CASE WHEN output_status='complete' THEN 1 ELSE 0 END) completed_output_count FROM creative_work_outputs GROUP BY creative_work_project_id",'creative_work_project_id'):new Map();
      const handoffs=readiness.creative_project_content_handoffs?await grouped(db,"SELECT creative_work_project_id,COUNT(*) handoff_count,MAX(content_project_id) content_project_id FROM creative_project_content_handoffs GROUP BY creative_work_project_id",'creative_work_project_id'):new Map();
      const knowledge=readiness.creative_project_knowledge_summaries?await grouped(db,"SELECT creative_work_project_id,COUNT(*) knowledge_count FROM creative_project_knowledge_summaries GROUP BY creative_work_project_id",'creative_work_project_id'):new Map();
      const profit=readiness.creative_project_profitability?await grouped(db,"SELECT creative_work_project_id,1 profitability_present FROM creative_project_profitability",'creative_work_project_id'):new Map();
      projects=source.map(project=>{
        const id=Number(project.creative_work_project_id||0);const facts={...(events.get(id)||{}),...(outputs.get(id)||{}),...(handoffs.get(id)||{}),...(knowledge.get(id)||{}),...(profit.get(id)||{})};
        return {creative_work_project_id:id,project_key:project.project_key||'',project_title:project.project_title||`Creative Project ${id}`,project_type:project.project_type||'',project_status:project.project_status||'',updated_at:project.updated_at||'',actual_cost_cents:number(project.actual_cost_cents),estimated_cost_cents:number(project.estimated_cost_cents),sales_revenue_cents:number(project.sales_revenue_cents),time_spent_minutes:number(project.time_spent_minutes),lessons:text(project.lessons,600),next_actions:text(project.next_actions,600),content_project_id:Number(facts.content_project_id||0)||null,readiness:projectReadiness(project,facts)};
      }).sort((a,b)=>a.readiness.score-b.readiness.score||String(b.updated_at).localeCompare(String(a.updated_at)));
    }

    let storyCandidates=[];
    if(readiness.creative_media_evidence_ranges&&readiness.creative_assets&&readiness.creative_projects){
      const candidateRows=rows(await db.prepare(`SELECT r.creative_media_evidence_range_id,r.creative_project_id,r.creative_asset_id,r.evidence_category,r.start_seconds,r.end_seconds,r.title,r.note_text,r.transcript_excerpt,r.confidence_score,r.verification_status,r.review_status,r.visibility,r.story_candidate,r.marker_status,r.linked_story_evidence_id,r.updated_at,ca.original_filename,ca.media_type,cp.project_title FROM creative_media_evidence_ranges r JOIN creative_assets ca ON ca.creative_asset_id=r.creative_asset_id JOIN creative_projects cp ON cp.creative_project_id=r.creative_project_id WHERE r.marker_status='active' AND r.story_candidate=1 ORDER BY datetime(r.updated_at) DESC,r.creative_media_evidence_range_id DESC LIMIT 160`).all().catch(()=>({results:[]})));
      storyCandidates=candidateRows.map(row=>({...row,rank:storyScore(row),handoff_href:`/admin/content/?creative_project_id=${Number(row.creative_project_id||0)}`,review_href:`/admin/caip/?creative_project_id=${Number(row.creative_project_id||0)}`})).sort((a,b)=>b.rank.score-a.rank.score||Number(b.creative_media_evidence_range_id)-Number(a.creative_media_evidence_range_id));
    }

    let unassignedMedia=[],unfilledSlots=[];
    if(readiness.media_assets&&readiness.managed_media_metadata&&readiness.media_content_assignments){
      const mediaRows=rows(await db.prepare(`SELECT ma.media_asset_id,ma.object_key,ma.public_url,ma.original_filename,ma.updated_at,mm.display_name,mm.alt_text,COALESCE(mm.media_type,'photo') media_type,COALESCE(mm.source_type,'') source_type,(SELECT COUNT(*) FROM media_content_assignments a WHERE a.media_asset_id=ma.media_asset_id AND a.active=1) assignment_count FROM media_assets ma LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id WHERE ma.deleted_at IS NULL AND ma.product_id IS NULL AND LOWER(COALESCE(mm.source_type,'')) NOT IN ('product','products','inventory','supply','supplies','tool','tools') ORDER BY ma.media_asset_id DESC LIMIT 180`).all().catch(()=>({results:[]})));
      unassignedMedia=mediaRows.filter(row=>number(row.assignment_count)===0).slice(0,60).map(row=>({...row,recommended_target:recommendMedia(row),assignment_action:'explicit_admin_review_required'}));
    }
    if(readiness.media_content_slots&&readiness.media_content_assignments){
      unfilledSlots=rows(await db.prepare(`SELECT s.media_content_slot_id,s.page_path,s.slot_key,s.slot_label,s.slot_type,s.is_required FROM media_content_slots s LEFT JOIN media_content_assignments a ON a.media_content_slot_id=s.media_content_slot_id AND a.active=1 WHERE s.is_active=1 AND s.slot_type IN ('image','background') AND a.media_content_assignment_id IS NULL AND s.page_path NOT LIKE '/admin%' AND s.page_path NOT LIKE '/shop/product%' AND s.page_path NOT LIKE '/tools%' AND s.page_path NOT LIKE '/supplies%' ORDER BY s.is_required DESC,s.page_path,s.media_content_slot_id LIMIT 80`).all().catch(()=>({results:[]})));
    }

    return json({ok:true,release:467,build:17,authority:'read_only_projection',schema_ready:Object.values(readiness).every(Boolean),table_readiness:readiness,projects,story_candidates:storyCandidates,media_diagnostics:{unassigned_media:unassignedMedia,unfilled_slots:unfilledSlots,automatic_assignment:false,raw_r2_deletion:false},policy:{existing_write_authorities_preserved:true,automatic_publication:false,provider_execution:false,provider_publication:false,invented_story_claims:false,request_time_schema_mutation:false}});
  }catch(error){return json({ok:false,error:'Creator & Content completeness data could not be loaded.',detail:String(error?.message||error),request_time_schema_mutation:false},500);}
}
