// Release 467 Build 377 — project-neutral evidence/workflow routing, authenticated GET only, bounded D1.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
const n=x=>Number(x||0)||0;
const rows=x=>Array.isArray(x?.results)?x.results:[];
const json=(d,s=200)=>jsonResponse(d,s,{'Cache-Control':'no-store'});
const SAFETY=Object.freeze({read_only:true,shadow_task_table:false,owner_assignment_persistence:false,acknowledgement_persistence:false,completion_persistence:false,automatic_evidence_review:false,automatic_publication:false,raw_private_urls:false,production_d1_contact:false});
const link=id=>'/admin/creative-process/?project_id='+encodeURIComponent(id);
function route(p) {
 const id=n(p.creative_work_project_id),workspace=link(id),evidence=n(p.selected_evidence_rows),events=n(p.active_events),caip=n(p.caip_workspaces),profile=n(p.maker_story_profiles);
 const review=String(p.story_review_status||'').toLowerCase();
 const stages=[
  {code:'caip_source_workspace',complete:caip>0,action:'Confirm a CAIP project/source workspace',href:workspace},
  {code:'record_real_process',complete:events>0,action:'Record a real project event',href:workspace},
  {code:'select_real_evidence',complete:evidence>0,action:'Select actual supporting evidence',href:workspace},
  {code:'maker_story_profile',complete:profile>0,action:'Set up Maker Story facts through Creative Process',href:workspace},
  {code:'human_story_review',complete:review==='reviewed'||review==='approved',action:'Request explicit human review of the Maker Story',href:workspace}
 ];
 const pending=stages.filter(x=>!x.complete);
 return {creative_work_project_id:id,project_key:String(p.project_key||''),project_title:String(p.project_title||''),
  project_status:String(p.project_status||''),maker_story_profiles:profile,story_review_status:review,caip_workspaces:caip,
  active_events:events,selected_evidence_rows:evidence,
  readiness_state:pending.length?'HUMAN_INPUT_REQUIRED':'HUMAN_DECISION_REQUIRED',
  source_steps:stages,next_action:pending[0]||{code:'human_publication_decision',complete:false,action:'Make a separate explicit rights and publication decision',href:workspace},
  workspace,source_of_truth:'creative_process_and_caip',automatic_advancement:false};
}
export async function onRequestGet(context){
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin)return json({ok:false,error:'Admin access required.',code:'ROUTING_AUTH_REQUIRED'},401);
 const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding unavailable.',code:'ROUTING_DB_UNAVAILABLE'},503);
 const url=new URL(context.request.url);
 const cursorRaw=url.searchParams.get('cursor')||'0',limitRaw=url.searchParams.get('limit')||'25';
 if(!/^\d{1,10}$/.test(cursorRaw)||!/^\d{1,2}$/.test(limitRaw))return json({ok:false,error:'Invalid pagination values.',code:'INVALID_PAGINATION'},400);
 const cursor=Number(cursorRaw),limit=Number(limitRaw);
 if(!Number.isSafeInteger(cursor)||limit<1||limit>50)return json({ok:false,error:'Pagination out of bounds.',code:'INVALID_PAGINATION'},400);
 try {
  const [result,total]=await Promise.all([
   db.prepare(`SELECT w.creative_work_project_id,w.project_key,w.project_title,w.project_status,
    (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id) maker_story_profiles,
    COALESCE((SELECT MAX(m.story_review_status) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id),'') story_review_status,
    (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(w.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspaces,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
    (SELECT COUNT(*) FROM creative_project_evidence_selections es WHERE es.creative_work_project_id=w.creative_work_project_id AND es.selected=1) selected_evidence_rows
    FROM creative_work_projects w WHERE COALESCE(w.project_status,'active')<>'archived' AND w.creative_work_project_id>?
    ORDER BY w.creative_work_project_id LIMIT ?`).bind(cursor,limit+1).all(),
   db.prepare("SELECT COUNT(*) active_projects FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived'").first()
  ]);
  const source=rows(result),hasMore=source.length>limit,projectRows=source.slice(0,limit).map(route);
  return json({ok:true,release:467,build:377,title:'Multi-Project Workflow & Evidence Routing',total_active_projects:n(total?.active_projects),
   cursor,limit,has_more:hasMore,next_cursor:hasMore?projectRows[projectRows.length-1]?.creative_work_project_id:null,
   projects:projectRows,routing_mode:'DERIVED_FROM_EXISTING_SOURCE_AUTHORITIES',safety:SAFETY});
 }catch(e){console.error('PROJECT_WORKFLOW_ROUTING_FAILED',e?.name||'Error');
   return json({ok:false,error:'Project workflow routing is temporarily unavailable.',code:'ROUTING_READ_FAILED'},503);}
}
