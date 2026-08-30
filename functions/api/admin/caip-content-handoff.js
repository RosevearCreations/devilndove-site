// Release 461 wrapper around the established Release 458 reviewed-evidence handoff.
// The legacy implementation remains the Content Studio handoff authority. This wrapper adds
// current CAIP story/edit-plan acceptance context and keeps provider/publication execution closed.
import * as legacy from './_caipContentHandoffLegacy.js';
import { getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE=461;
const PROVENANCE_RELEASE=458;
const PIPELINE_TABLES=['caip_story_builder_drafts','caip_edit_timeline_drafts','caip_edit_timeline_clips','caip_asset_quality_reviews','caip_asset_lifecycle_states','caip_semantic_evidence_annotations'];
const integer=(value)=>{const n=Number(value||0);return Number.isInteger(n)&&n>0?n:0;};
const rows=(result)=>Array.isArray(result?.results)?result.results:[];
const json=(data,status=200)=>jsonResponse({release:RELEASE,provenance_release:PROVENANCE_RELEASE,provider_execution_active:false,publication_active:false,source_media_unchanged:true,...data},status,{'Cache-Control':'no-store'});

async function parse(response){try{return await response.clone().json();}catch{return null;}}
async function bodyClone(request){try{return await request.clone().json();}catch{return{};}}
async function pipelineSchemaReady(db){
  const placeholders=PIPELINE_TABLES.map(()=>'?').join(',');
  const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...PIPELINE_TABLES).all().catch(()=>({results:[]})));
  const present=new Set(found.map((row)=>String(row.name||'')));
  const missing_tables=PIPELINE_TABLES.filter((name)=>!present.has(name));
  return{schema_ready:missing_tables.length===0,missing_tables};
}
async function pipelineSnapshot(db,projectId){
  const readiness=await pipelineSchemaReady(db);
  if(!readiness.schema_ready)return{...readiness,handoff_mode:'reviewed_content_studio_reference_only',provider_execution_active:false,publication_active:false};
  const [story,timeline,quality,semantic,lifecycle]=await Promise.all([
    db.prepare(`SELECT caip_story_builder_draft_id,story_key,title,story_status,source_segment_count,source_evidence_count,updated_at FROM caip_story_builder_drafts WHERE creative_project_id=? AND story_status<>'archived' ORDER BY updated_at DESC,caip_story_builder_draft_id DESC LIMIT 1`).bind(projectId).first().catch(()=>null),
    db.prepare(`SELECT d.caip_edit_timeline_draft_id,d.caip_story_builder_draft_id,d.timeline_key,d.title,d.timeline_status,d.aspect_ratio,d.target_duration_seconds,d.total_planned_seconds,d.provider_execution_status,d.updated_at,(SELECT COUNT(*) FROM caip_edit_timeline_clips c WHERE c.caip_edit_timeline_draft_id=d.caip_edit_timeline_draft_id) AS clip_count FROM caip_edit_timeline_drafts d WHERE d.creative_project_id=? AND d.timeline_status<>'archived' ORDER BY d.updated_at DESC,d.caip_edit_timeline_draft_id DESC LIMIT 1`).bind(projectId).first().catch(()=>null),
    db.prepare(`SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN review_status='accepted' THEN 1 ELSE 0 END),0) AS accepted,COALESCE(SUM(CASE WHEN review_status='rejected' THEN 1 ELSE 0 END),0) AS rejected FROM caip_asset_quality_reviews WHERE creative_project_id=?`).bind(projectId).first().catch(()=>null),
    db.prepare(`SELECT COUNT(*) AS total,COALESCE(SUM(CASE WHEN review_status='approved' THEN 1 ELSE 0 END),0) AS approved FROM caip_semantic_evidence_annotations WHERE creative_project_id=?`).bind(projectId).first().catch(()=>null),
    db.prepare(`SELECT COALESCE(SUM(CASE WHEN lifecycle_status='rejected' THEN 1 ELSE 0 END),0) AS rejected,COALESCE(SUM(CASE WHEN lifecycle_status='purge_requested' THEN 1 ELSE 0 END),0) AS purge_requested FROM caip_asset_lifecycle_states WHERE creative_project_id=?`).bind(projectId).first().catch(()=>null),
  ]);
  return{
    schema_ready:true,missing_tables:[],handoff_mode:'reviewed_content_studio_reference_only',
    story_builder:story||null,edit_timeline:timeline||null,
    footage_quality:{reviewed:Number(quality?.total||0),accepted:Number(quality?.accepted||0),rejected:Number(quality?.rejected||0)},
    semantic_evidence:{reviewed:Number(semantic?.total||0),approved:Number(semantic?.approved||0)},
    lifecycle:{rejected:Number(lifecycle?.rejected||0),purge_requested:Number(lifecycle?.purge_requested||0),raw_delete_executed:false},
    provider_execution_active:false,publication_active:false,source_media_copied:false,
  };
}
async function persistSnapshot(db,data,snapshot){
  const handoffId=integer(data?.handoff?.caip_content_handoff_id);
  if(!handoffId||!snapshot?.schema_ready)return data;
  let packageData={};
  try{packageData=JSON.parse(String(data?.handoff?.package_json||'{}'));}catch{packageData={};}
  const packageJson=JSON.stringify({...packageData,release:RELEASE,provenance_release:PROVENANCE_RELEASE,caip_release461_pipeline:snapshot,handoff_mode:'reviewed_content_studio_reference_only',provider_execution_active:false,publication_active:false,source_media_copied:false});
  await db.prepare(`UPDATE caip_content_handoffs SET package_json=?,updated_at=CURRENT_TIMESTAMP WHERE caip_content_handoff_id=?`).bind(packageJson,handoffId).run();
  return{...data,handoff:{...data.handoff,package_json:packageJson}};
}
function outward(data,snapshot){return{...(data||{}),release:RELEASE,provenance_release:PROVENANCE_RELEASE,caip_release461_pipeline:snapshot,provider_execution_active:false,publication_active:false,source_media_unchanged:true,handoff_mode:'reviewed_content_studio_reference_only'};}

export async function onRequestGet(context){
  const response=await legacy.onRequestGet(context);
  if(!response.ok)return response;
  const data=await parse(response);if(!data)return response;
  const projectId=integer(new URL(context.request.url).searchParams.get('creative_project_id')||new URL(context.request.url).searchParams.get('project_id'));
  const db=getDb(context.env);
  const snapshot=db&&projectId?await pipelineSnapshot(db,projectId):{schema_ready:false,missing_tables:PIPELINE_TABLES,provider_execution_active:false,publication_active:false};
  return json(outward(data,snapshot),response.status);
}

export async function onRequestPost(context){
  const body=await bodyClone(context.request);
  const response=await legacy.onRequestPost(context);
  if(!response.ok)return response;
  let data=await parse(response);if(!data)return response;
  const projectId=integer(body.creative_project_id||body.project_id||data?.project?.creative_project_id);
  const db=getDb(context.env);
  const snapshot=db&&projectId?await pipelineSnapshot(db,projectId):{schema_ready:false,missing_tables:PIPELINE_TABLES,provider_execution_active:false,publication_active:false};
  if(db&&String(body.action||'').trim().toLowerCase()==='prepare')data=await persistSnapshot(db,data,snapshot);
  return json(outward(data,snapshot),response.status);
}
