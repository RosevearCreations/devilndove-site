// Release 467 Build 376 — authenticated, project-agnostic, bounded read-only Creative Process + Search Console portfolio.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
const n=v=>Number(v||0)||0;
const rows=r=>Array.isArray(r?.results)?r.results:[];
const response=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const safety=Object.freeze({read_only:true,project_data_mutation:false,search_console_import:false,seo_apply:false,automatic_review:false,automatic_publication:false,raw_private_urls:false,production_d1_contact:false});
export async function onRequestGet(context){
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin)return response({ok:false,error:'Admin access required.',code:'PORTFOLIO_AUTH_REQUIRED'},401);
 const db=getDb(context.env);
 if(!db)return response({ok:false,error:'Database binding unavailable.',code:'PORTFOLIO_DB_UNAVAILABLE'},503);
 try{
  // Bounded two-source read: no fan-out HTTP calls, no looped D1 queries per project.
  const [pResult,totals,search]=await Promise.all([
   db.prepare(`SELECT w.creative_work_project_id,w.project_key,w.project_title,w.project_status,
    (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id) maker_story_profiles,
    COALESCE((SELECT MAX(m.story_review_status) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id),'') story_review_status,
    (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(w.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspaces,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
    (SELECT COUNT(*) FROM creative_project_evidence_selections es WHERE es.creative_work_project_id=w.creative_work_project_id AND es.selected=1) selected_evidence_rows
    FROM creative_work_projects w WHERE COALESCE(w.project_status,'active')<>'archived'
    ORDER BY w.creative_work_project_id LIMIT 100`).all(),
   db.prepare("SELECT COUNT(*) active_projects FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived'").first(),
   db.prepare(`SELECT COUNT(*) total_rows,
    COALESCE(SUM(CASE WHEN report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') THEN 1 ELSE 0 END),0) recent_rows,
    COALESCE(SUM(CASE WHEN report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') THEN clicks ELSE 0 END),0) recent_clicks,
    COALESCE(SUM(CASE WHEN report_date IS NOT NULL AND date(report_date)>=date('now','-30 days') THEN impressions ELSE 0 END),0) recent_impressions,
    COALESCE(MAX(report_date),'') latest_report_date
    FROM search_console_page_queries`).first()
  ]);
  const projects=rows(pResult).map(w=>({
   creative_work_project_id:n(w.creative_work_project_id),project_key:String(w.project_key||''),
   project_title:String(w.project_title||''),project_status:String(w.project_status||''),
   maker_story_profiles:n(w.maker_story_profiles),story_review_status:String(w.story_review_status||''),
   caip_workspaces:n(w.caip_workspaces),active_events:n(w.active_events),selected_evidence_rows:n(w.selected_evidence_rows)
  }));
  const total=n(totals?.active_projects),profiled=projects.filter(x=>x.maker_story_profiles>0).length;
  return response({ok:true,release:467,build:376,title:'System-wide Project and Discovery Portfolio',portfolio:{
    total_active_projects:total,loaded_projects:projects.length,has_more:total>projects.length,
    profiled_in_loaded_projects:profiled,unprofiled_in_loaded_projects:projects.length-profiled,
    projects_with_caip:projects.filter(x=>x.caip_workspaces>0).length,projects_with_events:projects.filter(x=>x.active_events>0).length,
    projects
  },discovery:{source:'real_google_search_console_operator_import_only',freshness_window_days:30,
   total_rows:n(search?.total_rows),recent_rows:n(search?.recent_rows),recent_clicks:n(search?.recent_clicks),
   recent_impressions:n(search?.recent_impressions),latest_report_date:String(search?.latest_report_date||''),
   actionable:n(search?.recent_rows)>0,import_timestamps_are_not_report_dates:true},
   links:{creative_process:'/admin/creative-process/',evidence_workbench:'/admin/evidence-gap-execution-workbench/',
     buyer_discovery:'/admin/release-control/runtime-storefront-intelligence/',search_console_import:'/admin/release-control/runtime-storefront-intelligence/'},
   safety});
 }catch(error){
  console.error('PROJECT_DISCOVERY_PORTFOLIO_READ_ERROR',error?.name||'Error');
  return response({ok:false,error:'System portfolio could not load; check database/Worker logs and retry.',code:'PORTFOLIO_READ_FAILED'},503);
 }
}
