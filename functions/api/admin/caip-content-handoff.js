// Devil n Dove Release 458 — reviewed CAIP evidence -> Content Studio handoff.
// References approved evidence only. Never copies source media, invokes providers, or publishes content.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 458;
const PROVENANCE_RELEASE = 448;
const json = (data, status = 200) => jsonResponse({ release: RELEASE, provenance_release: PROVENANCE_RELEASE, ...data }, status, { 'Cache-Control':'no-store' });
const integer = (value) => { const n=Number(value||0); return Number.isInteger(n)&&n>0?n:0; };
const rows = (result) => Array.isArray(result?.results) ? result.results : [];

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok:false, error:'Admin access required.' },401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok:false, error:'Database binding is not configured.' },500) };
  return { adminUser, db };
}

async function schemaReady(db) {
  const required=['creative_media_evidence_ranges','creative_story_evidence','creative_story_segments','creative_story_segment_evidence_links','caip_content_handoffs','caip_content_handoff_evidence'];
  const missing=[];
  for (const name of required) {
    const row=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);
    if (!row?.name) missing.push(name);
  }
  return { schema_ready:!missing.length, missing_tables:missing };
}

async function project(db, projectId) {
  return db.prepare(`SELECT cp.creative_project_id,cp.creative_project_key,cp.project_title,cp.project_status,cp.governance_status,cp.content_project_id,cp.product_id,p.name AS product_name
    FROM creative_projects cp LEFT JOIN products p ON p.product_id=cp.product_id WHERE cp.creative_project_id=? LIMIT 1`).bind(projectId).first();
}

async function approvedEvidence(db, projectId) {
  return rows(await db.prepare(`SELECT r.creative_media_evidence_range_id,r.creative_asset_id,r.marker_key,r.evidence_category,r.title,r.note_text,r.transcript_excerpt,r.start_seconds,r.end_seconds,r.visibility,r.confidence_percent,
      r.linked_story_evidence_id AS creative_story_evidence_id,e.evidence_key,e.evidence_type,e.review_status AS story_review_status,e.verification_status AS story_verification_status,
      ca.asset_key,ca.original_filename,ca.media_type
    FROM creative_media_evidence_ranges r
    INNER JOIN creative_assets ca ON ca.creative_asset_id=r.creative_asset_id
    INNER JOIN creative_story_evidence e ON e.creative_story_evidence_id=r.linked_story_evidence_id
    WHERE r.creative_project_id=? AND r.marker_status='active' AND r.review_status='approved'
      AND e.review_status='approved' AND e.verification_status<>'rejected'
    ORDER BY r.start_seconds,r.creative_media_evidence_range_id`).bind(projectId).all());
}

async function approvedSegments(db, projectId) {
  return rows(await db.prepare(`SELECT s.creative_story_segment_id,s.segment_key,s.title,s.narrative_text,s.segment_status,s.sort_order,
      COUNT(l.creative_story_segment_evidence_link_id) AS evidence_link_count
    FROM creative_story_segments s
    LEFT JOIN creative_story_segment_evidence_links l ON l.creative_story_segment_id=s.creative_story_segment_id
    WHERE s.creative_project_id=? AND s.segment_status<>'archived'
    GROUP BY s.creative_story_segment_id
    ORDER BY s.sort_order,s.creative_story_segment_id`).bind(projectId).all());
}

function derivePackageState(data) {
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];
  const segments = Array.isArray(data.segments) ? data.segments : [];
  const current = {
    approved_marker_count: evidence.length,
    approved_story_evidence_count: new Set(evidence.map((row)=>integer(row.creative_story_evidence_id)).filter(Boolean)).size,
    approved_segment_count: segments.length,
  };
  const handoff = data.handoff || null;
  const packageStale = Boolean(handoff) && (
    integer(handoff.approved_marker_count) !== current.approved_marker_count ||
    integer(handoff.approved_story_evidence_count) !== current.approved_story_evidence_count ||
    integer(handoff.approved_segment_count) !== current.approved_segment_count
  );
  const blockers=[];
  if (!data.readiness?.schema_ready) blockers.push('CAIP handoff schema is unavailable.');
  if (!integer(data.project?.content_project_id)) blockers.push('Content Studio project is not linked.');
  if (!current.approved_marker_count) blockers.push('No approved temporal marker with approved linked story evidence is eligible.');
  if (!handoff) blockers.push('Handoff package has not been prepared.');
  if (packageStale) blockers.push('Prepared package is stale and must be refreshed before review.');
  const eligibleForReview = Boolean(
    data.readiness?.schema_ready && integer(data.project?.content_project_id) && handoff &&
    handoff.handoff_status !== 'archived' && current.approved_marker_count > 0 && !packageStale
  );
  return { current_counts:current, package_stale:packageStale, review_blockers:blockers, eligible_for_review:eligibleForReview };
}

async function load(db, projectId) {
  const readiness=await schemaReady(db);
  const projectRow=await project(db,projectId);
  if (!projectRow) return { readiness, project:null, evidence:[], segments:[], handoff:null, handoff_evidence:[], current_counts:{approved_marker_count:0,approved_story_evidence_count:0,approved_segment_count:0}, package_stale:false, review_blockers:['CAIP project was not found.'], eligible_for_review:false };
  const [evidence,segments,handoff]=await Promise.all([
    readiness.schema_ready ? approvedEvidence(db,projectId) : [],
    readiness.schema_ready ? approvedSegments(db,projectId) : [],
    readiness.schema_ready && integer(projectRow.content_project_id) ? db.prepare(`SELECT * FROM caip_content_handoffs WHERE creative_project_id=? AND content_project_id=? LIMIT 1`).bind(projectId,integer(projectRow.content_project_id)).first().catch(()=>null) : null,
  ]);
  const handoffEvidence=handoff ? rows(await db.prepare(`SELECT h.*,r.title,r.evidence_category,r.start_seconds,r.end_seconds,e.evidence_key,e.review_status,e.verification_status
      FROM caip_content_handoff_evidence h
      INNER JOIN creative_media_evidence_ranges r ON r.creative_media_evidence_range_id=h.creative_media_evidence_range_id
      INNER JOIN creative_story_evidence e ON e.creative_story_evidence_id=h.creative_story_evidence_id
      WHERE h.caip_content_handoff_id=? ORDER BY h.sort_order,h.caip_content_handoff_evidence_id`).bind(handoff.caip_content_handoff_id).all()) : [];
  const base={ readiness, project:projectRow, evidence, segments, handoff, handoff_evidence:handoffEvidence };
  return { ...base, ...derivePackageState(base) };
}

export async function onRequestGet(context) {
  const state=await access(context); if(state.error)return state.error;
  const url=new URL(context.request.url);
  const projectId=integer(url.searchParams.get('creative_project_id')||url.searchParams.get('project_id'));
  if(!projectId)return json({ok:false,error:'Choose a CAIP project first.'},400);
  try {
    const data=await load(state.db,projectId);
    if(!data.project)return json({ok:false,error:'CAIP project not found.'},404);
    return json({ok:true,schema_ready:data.readiness.schema_ready,missing_tables:data.readiness.missing_tables,source_media_unchanged:true,provider_execution_active:false,publication_active:false,...data});
  } catch(error) {
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'caip_content_handoff',incident_code:'caip_content_handoff_get_failed',severity:'warning',message:error?.message||'CAIP content handoff could not load.',related_user_id:state.adminUser.user_id,details:{release:RELEASE,provenance_release:PROVENANCE_RELEASE,creative_project_id:projectId,error:String(error?.stack||error)}});
    return json({ok:false,error:error?.message||'CAIP content handoff could not load.'},503);
  }
}

export async function onRequestPost(context) {
  const state=await access(context); if(state.error)return state.error;
  let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Expected a JSON request body.'},400);}
  const projectId=integer(body.creative_project_id||body.project_id); const action=normalizeText(body.action).toLowerCase();
  if(!projectId)return json({ok:false,error:'Choose a CAIP project first.'},400);
  try {
    const data=await load(state.db,projectId);
    if(!data.project)return json({ok:false,error:'CAIP project not found.'},404);
    if(!data.readiness.schema_ready)return json({ok:false,schema_ready:false,missing_tables:data.readiness.missing_tables,error:'Release 458 CAIP handoff authority is not fully installed.'},409);
    const contentProjectId=integer(data.project.content_project_id);
    if(!contentProjectId)return json({ok:false,error:'This CAIP project is not linked to a Content Studio project yet. Create or sync the Content Studio project first.'},409);
    if(action!=='prepare'&&action!=='review')return json({ok:false,error:'Unsupported Release 458 CAIP content-handoff action.'},400);

    if(action==='review') {
      if (!data.eligible_for_review) {
        return json({ok:false,error:'The CAIP handoff cannot be reviewed until current approved evidence is packaged and the package is not stale.',package_stale:data.package_stale,review_blockers:data.review_blockers,current_counts:data.current_counts},409);
      }
      const handoffId=integer(data.handoff?.caip_content_handoff_id||body.caip_content_handoff_id);
      if(!handoffId)return json({ok:false,error:'Prepare the CAIP content package before reviewing it.'},409);
      const reviewStatus=normalizeText(body.handoff_status).toLowerCase()==='archived'?'archived':'reviewed';
      await state.db.prepare(`UPDATE caip_content_handoffs SET handoff_status=?,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE caip_content_handoff_id=? AND creative_project_id=?`).bind(reviewStatus,state.adminUser.user_id,handoffId,projectId).run();
    } else {
      const evidence=data.evidence;
      const packageJson=JSON.stringify({release:RELEASE,provenance_release:PROVENANCE_RELEASE,creative_project_id:projectId,creative_project_key:data.project.creative_project_key,content_project_id:contentProjectId,product_id:data.project.product_id||null,approved_marker_count:evidence.length,approved_story_evidence_count:new Set(evidence.map(row=>row.creative_story_evidence_id)).size,approved_segment_count:data.segments.length,review_first:true,source_media_copied:false,provider_execution_active:false,publication_active:false});
      const status=evidence.length?'ready_for_review':'draft';
      await state.db.prepare(`INSERT INTO caip_content_handoffs(creative_project_id,content_project_id,handoff_status,approved_marker_count,approved_story_evidence_count,approved_segment_count,package_json,prepared_by_user_id,prepared_at,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(creative_project_id,content_project_id) DO UPDATE SET handoff_status=excluded.handoff_status,approved_marker_count=excluded.approved_marker_count,approved_story_evidence_count=excluded.approved_story_evidence_count,approved_segment_count=excluded.approved_segment_count,package_json=excluded.package_json,prepared_by_user_id=excluded.prepared_by_user_id,prepared_at=CURRENT_TIMESTAMP,reviewed_by_user_id=NULL,reviewed_at=NULL,updated_at=CURRENT_TIMESTAMP`).bind(projectId,contentProjectId,status,evidence.length,new Set(evidence.map(row=>row.creative_story_evidence_id)).size,data.segments.length,packageJson,state.adminUser.user_id).run();
      const handoff=await state.db.prepare(`SELECT caip_content_handoff_id FROM caip_content_handoffs WHERE creative_project_id=? AND content_project_id=? LIMIT 1`).bind(projectId,contentProjectId).first();
      const handoffId=integer(handoff?.caip_content_handoff_id);
      await state.db.prepare(`DELETE FROM caip_content_handoff_evidence WHERE caip_content_handoff_id=?`).bind(handoffId).run();
      let order=0;
      for(const row of evidence){
        await state.db.prepare(`INSERT INTO caip_content_handoff_evidence(caip_content_handoff_id,creative_media_evidence_range_id,creative_story_evidence_id,evidence_role,sort_order,created_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(handoffId,row.creative_media_evidence_range_id,row.creative_story_evidence_id,order===0?'primary':'supporting',order++).run();
      }
    }

    await auditAdminAction(context.env,context.request,state.adminUser,{action_type:`caip_content_handoff_${action}`,target_type:'creative_project',target_id:projectId,target_key:data.project.creative_project_key||null,details:{release:RELEASE,provenance_release:PROVENANCE_RELEASE,content_project_id:contentProjectId,approved_evidence_count:data.evidence.length,source_media_copied:false,publication_active:false}});
    const refreshed=await load(state.db,projectId);
    return json({ok:true,message:action==='review'?'CAIP content handoff reviewed.':'CAIP reviewed-evidence package prepared for Content Studio.',source_media_unchanged:true,provider_execution_active:false,publication_active:false,...refreshed});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'caip_content_handoff',incident_code:'caip_content_handoff_post_failed',severity:'warning',message:error?.message||'CAIP content handoff could not save.',related_user_id:state.adminUser.user_id,details:{release:RELEASE,provenance_release:PROVENANCE_RELEASE,action,creative_project_id:projectId,error:String(error?.stack||error)}});
    return json({ok:false,error:error?.message||'CAIP content handoff could not save.',source_media_unchanged:true,publication_active:false},400);
  }
}
