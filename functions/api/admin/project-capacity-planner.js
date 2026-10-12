// Release 467 Build 378 — bounded, authenticated, read-only shared workstation demand planner.
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {buildCapacityReport} from './_lib/crossProjectCapacity.js';
const rows = r => Array.isArray(r?.results) ? r.results : [];
const reply=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const SAFETY=Object.freeze({read_only:true,station_mutation:false,inventory_mutation:false,
  task_completion:false,calendar_reservation:false,actual_availability_inference:false,
  automatic_allocation:false,private_media_exposure:false,production_d1_contact:false});
export async function onRequestGet({request,env}) {
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return reply({ok:false,error:'Admin access required.',code:'CAPACITY_AUTH_REQUIRED'},401);
  const db=getDb(env);
  if(!db)return reply({ok:false,error:'Database binding unavailable.',code:'CAPACITY_DB_UNAVAILABLE'},503);
  const url=new URL(request.url),rawCursor=url.searchParams.get('cursor')||'0',rawLimit=url.searchParams.get('limit')||'20';
  if(!/^\d{1,10}$/.test(rawCursor)||!/^\d{1,2}$/.test(rawLimit))
    return reply({ok:false,error:'Invalid pagination.',code:'INVALID_PAGINATION'},400);
  const cursor=Number(rawCursor),limit=Number(rawLimit);
  if(!Number.isSafeInteger(cursor)||limit<1||limit>25)
    return reply({ok:false,error:'Pagination out of bounds.',code:'INVALID_PAGINATION'},400);
  try {
    const [projectsResult,totalResult,stationsResult]=await Promise.all([
      db.prepare("SELECT creative_work_project_id,project_key,project_title,project_status FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived' AND creative_work_project_id>? ORDER BY creative_work_project_id LIMIT ?").bind(cursor,limit+1).all(),
      db.prepare("SELECT COUNT(*) AS count FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived'").first(),
      db.prepare("SELECT s.site_item_inventory_id,s.item_name,COALESCE(p.process_name,'') AS process_name FROM inventory_workstation_roles wr JOIN site_item_inventory s ON s.site_item_inventory_id=wr.site_item_inventory_id LEFT JOIN inventory_process_assignments a ON a.site_item_inventory_id=s.site_item_inventory_id LEFT JOIN inventory_processes p ON p.inventory_process_id=a.inventory_process_id WHERE wr.workstation_role='station' AND LOWER(TRIM(COALESCE(s.source_type,'')))='tool' AND COALESCE(s.is_active,1)=1 ORDER BY s.site_item_inventory_id LIMIT 161").all()
    ]);
    const page=rows(projectsResult),hasMore=page.length>limit,projects=page.slice(0,limit);
    const stations=rows(stationsResult),end=projects.length?Number(projects[projects.length-1].creative_work_project_id):cursor;
    let links=[],equipment=[];
    if(projects.length) {
      const [linksResult,equipmentResult]=await Promise.all([
        db.prepare("SELECT ms.creative_work_project_id,ms.site_item_inventory_id FROM creative_project_maker_story_workstations ms JOIN creative_work_projects p ON p.creative_work_project_id=ms.creative_work_project_id WHERE ms.creative_work_project_id>? AND ms.creative_work_project_id<=? AND COALESCE(p.project_status,'active')<>'archived' ORDER BY ms.creative_work_project_id,ms.site_item_inventory_id LIMIT 401").bind(cursor,end).all(),
        db.prepare("SELECT o.creative_work_project_id,o.operation_title,r.creative_project_operation_resource_id,r.site_item_inventory_id,i.item_name,CASE WHEN wr.workstation_role='station' THEN r.site_item_inventory_id ELSE wm.workstation_site_item_inventory_id END AS station_id FROM creative_project_operations o JOIN creative_project_operation_resources r ON r.creative_project_operation_id=o.creative_project_operation_id JOIN site_item_inventory i ON i.site_item_inventory_id=r.site_item_inventory_id LEFT JOIN inventory_workstation_roles wr ON wr.site_item_inventory_id=r.site_item_inventory_id LEFT JOIN inventory_workstation_memberships wm ON wm.site_item_inventory_id=r.site_item_inventory_id WHERE o.creative_work_project_id>? AND o.creative_work_project_id<=? AND o.plan_status<>'retired' AND r.resource_role IN ('tool','fixture') ORDER BY o.creative_work_project_id,r.creative_project_operation_resource_id,station_id LIMIT 801").bind(cursor,end).all()
      ]);
      links=rows(linksResult);equipment=rows(equipmentResult);
    }
    const report=buildCapacityReport({projects,stations:stations.slice(0,160),storyLinks:links.slice(0,400),
      requirements:equipment.slice(0,800),truncated:{stations:stations.length>160,storyLinks:links.length>400,requirements:equipment.length>800}});
    return reply({ok:true,release:467,build:378,title:'Cross-Project Workstations, Equipment & Capacity Planner',
      cursor,limit,has_more:hasMore,next_cursor:hasMore?end:null,total_active_projects:Number(totalResult?.count||0),
      ...report,source_authorities:['creative_work_projects','creative_project_operations',
        'creative_project_operation_resources','creative_project_maker_story_workstations',
        'inventory_workstation_roles','inventory_workstation_memberships','site_item_inventory'],safety:SAFETY});
  }catch(error){console.error('BUILD378_CAPACITY_READ_FAILED',error?.name||'Error');
    return reply({ok:false,error:'Capacity review temporarily unavailable.',code:'CAPACITY_READ_FAILED'},503);}
}
