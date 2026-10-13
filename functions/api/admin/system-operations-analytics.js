// Release 467 Build 384 — bounded Admin operational analytics only; no write/mutation/automation.
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {sample,summarize} from './_lib/operationsAnalytics.js';
const json=(body,status=200)=>jsonResponse({release:467,build:384,...body},status,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
export async function onRequestGet({request,env}){
 const user=await getAdminUserFromRequest(request,env);
 if(!user)return json({ok:false,error:'Admin authentication required'},401);
 const db=getDb(env);if(!db)return json({ok:false,error:'Database binding unavailable'},503);
 const sources={
  projects:"SELECT creative_work_project_id,project_status,updated_at FROM creative_work_projects ORDER BY creative_work_project_id DESC LIMIT 101",
  requests:"SELECT custom_request_id,status,updated_at FROM custom_requests ORDER BY custom_request_id DESC LIMIT 101",
  work:"SELECT creative_work_order_event_id,event_kind,minutes_worked,created_at FROM creative_work_order_events ORDER BY creative_work_order_event_id DESC LIMIT 101",
  materials:"SELECT creative_project_material_reservation_id,original_stock_quantity,released_stock_quantity,created_at FROM creative_project_material_reservations ORDER BY creative_project_material_reservation_id DESC LIMIT 101",
  calendar:"SELECT creative_resource_calendar_entry_id,entry_kind,entry_status,override_conflict,created_at FROM creative_resource_calendar_entries ORDER BY creative_resource_calendar_entry_id DESC LIMIT 101",
  commission:"SELECT custom_request_commission_event_id,event_kind,created_at FROM custom_request_commission_events ORDER BY custom_request_commission_event_id DESC LIMIT 101",
  finance:"SELECT creative_project_finance_review_event_id,review_result,created_at FROM creative_project_finance_review_events ORDER BY creative_project_finance_review_event_id DESC LIMIT 101"
 };
 try{
  // Seven indexed, capped reads. Never aggregate complete D1 tables or expose private row content.
  const values=await Promise.all(Object.values(sources).map(sql=>db.prepare(sql).all()));
  const grouped={};Object.keys(sources).forEach((key,i)=>{grouped[key]=sample(values[i],100)});
  return json({ok:true,...summarize(grouped),snapshot_at:new Date().toISOString(),
   provenance:'canonical source-owned records; newest 100 per module',
   freshness:'as_of_request_only',cache_persistence:false,action_guard:'client_single_flight_with_server_source_guards',
   automation_policy:{execution_enabled:false,scheduled_writes_enabled:false,approval_required:true},
   safety:{request_time_ddl:false,d1_mutation:false,private_customer_exposure:false,finance_posting:false,payment_execution:false,
    automatic_publication:false,provider_writes:false,inventory_consumption:false}});
 }catch(error){console.error('BUILD384_ANALYTICS_READ_FAILED',error?.name||'Error');
  return json({ok:false,error:'Operational snapshot unavailable; no partial invented totals.',code:'SOURCE_UNAVAILABLE'},503);}
}
