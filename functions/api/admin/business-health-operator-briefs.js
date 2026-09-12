// Release 467 Build 116 — GET-only Business Health Operator Briefs & Export.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { loadRelease465BusinessHealth } from '../_lib/release465BusinessHealth.js';
import { buildBusinessHealthActionQueue } from '../_lib/businessHealthActionQueue.js';
import { buildBusinessHealthReviewPacks } from '../_lib/businessHealthReviewPacks.js';
import { buildBusinessHealthOperatorBriefs, BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD, BUSINESS_HEALTH_OPERATOR_BRIEFS_TITLE } from '../_lib/businessHealthOperatorBriefs.js';

const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const SAFETY=Object.freeze({mutation_capability:'none',handoff_mode:'human-review-only',export_mode:'read-only-download',server_persistence:false,
  acknowledgement_persistence:false,resolution_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,
  inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,request_time_schema_mutation:false,
  d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,production_mutation:false});
const safePeriod=(value)=>/^\d{4}-\d{2}$/.test(String(value||''))?String(value):'current';

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,release:467,build:BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD,error:'Admin access required.',safety:SAFETY},401);
  const db=getDb(context.env);
  if(!db)return json({ok:false,release:467,build:BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD,error:'Database binding is not configured.',safety:SAFETY},503);
  try{
    const url=new URL(context.request.url),periodMonth=url.searchParams.get('period_month')||'',format=String(url.searchParams.get('format')||'').toLowerCase();
    const health=await loadRelease465BusinessHealth(db,context.env,{periodMonth});
    const business_action_queue=buildBusinessHealthActionQueue(health);
    const business_review_packs=buildBusinessHealthReviewPacks(health,business_action_queue);
    const business_operator_briefs=buildBusinessHealthOperatorBriefs(health,business_review_packs);
    if(format==='markdown'){
      return new Response(business_operator_briefs.combined_markdown,{status:200,headers:{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store',
        'Content-Disposition':`attachment; filename="devilndove-business-health-${safePeriod(business_operator_briefs.period_month)}.md"`}});
    }
    return json({ok:true,release:467,build:BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD,title:BUSINESS_HEALTH_OPERATOR_BRIEFS_TITLE,
      role:'read_only_business_health_operator_briefs',authority:'release467-build116-business-health-operator-briefs',...health,business_action_queue,business_review_packs,
      business_operator_briefs,safety:{...SAFETY,...business_action_queue.boundaries,...business_review_packs.boundaries,...business_operator_briefs.boundaries,
        mutation_capability:'none',server_persistence:false,acknowledgement_persistence:false,resolution_persistence:false,automatic_business_action:false}});
  }catch(error){
    return json({ok:false,release:467,build:BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD,role:'read_only_business_health_operator_briefs',
      error:error?.message||'Business Health Operator Briefs could not load.',safety:SAFETY},500);
  }
}
