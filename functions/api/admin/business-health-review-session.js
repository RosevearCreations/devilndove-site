// Release 467 Build 120 — GET-only Business Health Owner Context Transfer & Review Session Packet.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getDecisionBrief } from './business-health-decision-brief.js';
import { buildBusinessHealthReviewSession, BUSINESS_HEALTH_REVIEW_SESSION_BUILD, BUSINESS_HEALTH_REVIEW_SESSION_TITLE } from '../_lib/businessHealthReviewSession.js';
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const SAFETY=Object.freeze({mutation_capability:'none',url_context_only:true,review_session_persistence:false,context_persistence:false,decision_persistence:false,approval_persistence:false,trend_history_persistence:false,server_persistence:false,acknowledgement_persistence:false,resolution_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,provider_publication:false,request_time_schema_mutation:false,d1_business_data_mutation:false,r2_mutation:false,binding_mutation:false,production_mutation:false});
export async function onRequestGet(context){
  try{
    const requestUrl=new URL(context.request.url),format=String(requestUrl.searchParams.get('format')||'').toLowerCase();
    const innerUrl=new URL(requestUrl);innerUrl.pathname='/api/admin/business-health-decision-brief';innerUrl.searchParams.delete('format');
    const innerRequest=new Request(innerUrl.toString(),{method:'GET',headers:context.request.headers});
    const response=await getDecisionBrief({...context,request:innerRequest});
    if(!response.ok)return response;
    const payload=await response.json().catch(()=>null);
    if(!payload?.ok)return json({ok:false,release:467,build:120,error:'Build 119 decision authority returned an invalid payload.',safety:SAFETY},503);
    const business_review_session=buildBusinessHealthReviewSession(payload.business_decision_brief||{},payload.business_action_queue||{},payload.business_rolling_trend||{});
    const combined_markdown=[business_review_session.markdown,'',payload.combined_markdown||payload.business_decision_brief?.markdown||''].join('\n');
    if(format==='markdown')return new Response(combined_markdown,{status:200,headers:{'Content-Type':'text/markdown; charset=utf-8','Cache-Control':'no-store','Content-Disposition':`attachment; filename="devilndove-business-health-${business_review_session.period_month||'current'}-review-session.md"`}});
    return json({...payload,ok:true,release:467,build:BUSINESS_HEALTH_REVIEW_SESSION_BUILD,title:BUSINESS_HEALTH_REVIEW_SESSION_TITLE,role:'read_only_business_health_review_session',authority:'release467-build120-business-health-review-session',business_review_session,combined_markdown,safety:{...SAFETY,...business_review_session.boundaries,mutation_capability:'none'}});
  }catch(error){return json({ok:false,release:467,build:120,role:'read_only_business_health_review_session',error:error?.message||'Business Health review session could not load.',safety:SAFETY},500);}
}
