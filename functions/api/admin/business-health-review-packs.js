// Release 467 Build 115 — GET-only Business Health Review Packs & Owner Handoff.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { loadRelease465BusinessHealth } from '../_lib/release465BusinessHealth.js';
import { buildBusinessHealthActionQueue } from '../_lib/businessHealthActionQueue.js';
import { buildBusinessHealthReviewPacks, BUSINESS_HEALTH_REVIEW_PACKS_BUILD, BUSINESS_HEALTH_REVIEW_PACKS_TITLE } from '../_lib/businessHealthReviewPacks.js';

const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const SAFETY=Object.freeze({
  mutation_capability:'none',
  handoff_mode:'human-review-only',
  acknowledgement_persistence:false,
  automatic_business_action:false,
  accounting_posting:false,
  period_close:false,
  inventory_mutation:false,
  creative_mutation:false,
  price_mutation:false,
  provider_execution:false,
  provider_publication:false,
  request_time_schema_mutation:false,
  r2_mutation:false,
  binding_mutation:false,
  production_mutation:false
});

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return json({ok:false,release:467,build:BUSINESS_HEALTH_REVIEW_PACKS_BUILD,error:'Admin access required.',safety:SAFETY},401);
  const db=getDb(context.env);
  if(!db)return json({ok:false,release:467,build:BUSINESS_HEALTH_REVIEW_PACKS_BUILD,error:'Database binding is not configured.',safety:SAFETY},503);
  try{
    const url=new URL(context.request.url);
    const health=await loadRelease465BusinessHealth(db,context.env,{periodMonth:url.searchParams.get('period_month')||''});
    const business_action_queue=buildBusinessHealthActionQueue(health);
    const business_review_packs=buildBusinessHealthReviewPacks(health,business_action_queue);
    return json({
      ok:true,
      release:467,
      build:BUSINESS_HEALTH_REVIEW_PACKS_BUILD,
      title:BUSINESS_HEALTH_REVIEW_PACKS_TITLE,
      role:'read_only_business_health_review_packs',
      authority:'release467-build115-business-health-review-packs',
      ...health,
      business_action_queue,
      business_review_packs,
      safety:{...SAFETY,...business_action_queue.boundaries,...business_review_packs.boundaries,mutation_capability:'none',handoff_mode:'human-review-only',acknowledgement_persistence:false,automatic_business_action:false,accounting_posting:false,period_close:false,inventory_mutation:false,creative_mutation:false,price_mutation:false,provider_execution:false,request_time_schema_mutation:false}
    });
  }catch(error){
    return json({
      ok:false,
      release:467,
      build:BUSINESS_HEALTH_REVIEW_PACKS_BUILD,
      role:'read_only_business_health_review_packs',
      error:error?.message||'Business Health Review Packs could not load.',
      safety:SAFETY
    },500);
  }
}
