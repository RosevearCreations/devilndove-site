// Release 467 Build 383. Source-linked reconciliation; not an accounting/posting or payment instruction surface.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {loadProfitabilityIntelligence} from '../_lib/release465BusinessHealth.js';
import {TYPES,RESULTS,SOURCES,positive,rows,deriveOrders,evidenceFlags} from './_lib/projectFinanceEvidence.js';
const out=(d,s=200)=>jsonResponse({release:467,build:383,...d},s,{'Cache-Control':'no-store'});
const clean=(v,max=1200)=>String(v??'').trim().slice(0,max);
const SAFETY={accounting_posting:false,finance_mutation:false,payments_execution:false,tax_remittance:false,automatic_deposits:false,
  estimated_material_cost_is_accounting_cost:false,quote_is_revenue:false,payment_is_revenue:false,
  material_reservation_is_consumption:false,time_record_is_payroll:false,private_customer_details:false,request_time_ddl:false};
async function auth({request,env}){const user=await getAdminUserFromRequest(request,env);
 if(!user)return {response:out({ok:false,error:'Admin authentication required'},401)};
 const db=getDb(env);if(!db)return {response:out({ok:false,error:'Database binding unavailable'},503)};
 return {db,user};}
const project=(db,id)=>db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status,sales_revenue_cents,actual_cost_cents,updated_at
 FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1`).bind(id).first();
async function review(db,id){
 const p=await project(db,id);if(!p)return null;
 const financeSource=await db.prepare(`SELECT creative_work_project_id,labour_rate_cents,packaging_cost_cents,overhead_cost_cents,
 channel_fee_cents,shipping_cost_cents,revenue_cents,updated_at FROM creative_project_profitability WHERE creative_work_project_id=? LIMIT 1`).bind(id).first();
 const [time,creative,production,inventory,requests,history]=await Promise.all([
  db.prepare(`SELECT COUNT(*) time_rows,COALESCE(SUM(minutes_worked),0) actual_minutes FROM creative_work_order_events
     WHERE creative_work_project_id=? AND event_kind='time'`).bind(id).first(),
  db.prepare(`SELECT COUNT(*) event_count,COALESCE(SUM(CASE WHEN COALESCE(entry_status,'active')='active' THEN duration_minutes ELSE 0 END),0) creative_minutes,
  COALESCE(SUM(CASE WHEN COALESCE(entry_status,'active')='active' THEN material_cost_cents ELSE 0 END),0) tracked_material_cents
  FROM creative_work_events WHERE creative_work_project_id=?`).bind(id).first(),
  db.prepare(`SELECT COUNT(*) evidence_rows,COALESCE(SUM(COALESCE(consumables_cost_cents,0)+COALESCE(packaging_cost_cents,0)+
   COALESCE(prototype_waste_cost_cents,0)+COALESCE(rework_cost_cents,0)+COALESCE(finishing_cost_cents,0)+
   COALESCE(outside_service_cost_cents,0)),0) known_direct_cost_cents,
   SUM(CASE WHEN cost_evidence_state='reviewed' THEN 1 ELSE 0 END) reviewed_rows,
   SUM(CASE WHEN consumables_cost_cents IS NOT NULL OR packaging_cost_cents IS NOT NULL OR prototype_waste_cost_cents IS NOT NULL OR
   rework_cost_cents IS NOT NULL OR finishing_cost_cents IS NOT NULL OR outside_service_cost_cents IS NOT NULL THEN 1 ELSE 0 END) cost_known_rows
   FROM creative_project_production_cost_evidence WHERE creative_work_project_id=? AND evidence_status='active'`).bind(id).first(),
  db.prepare(`SELECT COUNT(*) post_count, SUM(CASE WHEN i.unit_cost_cents IS NOT NULL AND i.unit_cost_cents>0 THEN 1 ELSE 0 END) valued_posts,
    COALESCE(SUM(CASE WHEN i.unit_cost_cents IS NOT NULL AND i.unit_cost_cents>0 THEN ROUND(ip.stock_quantity_consumed*i.unit_cost_cents) ELSE 0 END),0) current_unit_price_estimate_cents
   FROM creative_project_inventory_posts ip JOIN site_item_inventory i ON i.site_item_inventory_id=ip.site_item_inventory_id
   WHERE ip.creative_work_project_id=? AND COALESCE(ip.posting_status,'posted')='posted'`).bind(id).first(),
  db.prepare(`SELECT DISTINCT l.custom_request_id,l.order_id FROM creative_project_manufacturing_lifecycles m
   JOIN custom_request_order_status_links l ON l.custom_request_id=m.custom_request_id
   WHERE m.creative_work_project_id=? AND l.order_id IS NOT NULL
   ORDER BY l.order_id LIMIT 21`).bind(id).all(),
  db.prepare(`SELECT creative_project_finance_review_event_id,review_type,review_result,source_kind,source_record_id,evidence_note,actor_user_id,created_at
   FROM creative_project_finance_review_events WHERE creative_work_project_id=? ORDER BY creative_project_finance_review_event_id DESC LIMIT 81`).bind(id).all()
 ]);
 const orderLinks=rows(requests),distinctOrders=[...new Set(orderLinks.map(x=>positive(x.order_id)).filter(Boolean))].slice(0,20);
 const orderResult=[];
 for(const orderId of distinctOrders){
  const info=await db.prepare(`SELECT o.order_id,o.order_number,o.currency,o.order_status,o.payment_status,o.subtotal_cents,o.tax_cents,o.total_cents,
    (SELECT COALESCE(SUM(CASE WHEN LOWER(COALESCE(p.payment_status,'')) IN ('paid','partially_refunded','refunded') THEN p.amount_cents ELSE 0 END),0)
    FROM payments p WHERE p.order_id=o.order_id) gross_paid_cents,
    (SELECT COALESCE(SUM(r.amount_cents),0) FROM payment_refunds r WHERE r.order_id=o.order_id) refund_cents
    FROM orders o WHERE o.order_id=? LIMIT 1`).bind(orderId).first();
  if(info)orderResult.push(info);
 }
 const payments=deriveOrders(orderResult);
 const [financial]=await Promise.all([loadProfitabilityIntelligence(db,{limit:150})]);
 const finance=financial.rows?.find(x=>Number(x.creative_work_project_id)===id)||null;
 const financeProjectionCoverage=financial.rows?.length>=150;
 const reviewed=rows(history);
 const sourceNeeds=evidenceFlags({finance:financeSource,work:time,production,inventory,orders:payments,links:orderLinks.length>0});
 if(financeSource&&!finance)sourceNeeds.push('Finance intelligence result is outside the bounded 150-project projection; use Finance authoritative view');
 if(orderLinks.length>20)sourceNeeds.push('Linked order sources truncated at 20; reconciliation incomplete');
 if(Number(inventory?.post_count||0)>Number(inventory?.valued_posts||0))sourceNeeds.push('Some actual inventory posts lack a current cost estimate');
 if(production?.evidence_rows>production?.cost_known_rows)sourceNeeds.push('Some manufacturing cost evidence remains unknown');
 const currencyWarning=orderResult.some(x=>x.currency&&String(x.currency).toUpperCase()!=='CAD');
 if(currencyWarning){sourceNeeds.push('Some linked orders use non-CAD currency; no automatic FX conversion');for(const key of ['recorded_order_totals_cents','recorded_order_tax_cents','gross_paid_cents','refund_cents','net_paid_cents'])payments[key]=null;}
 const materials={
  posts_count:Number(inventory?.post_count||0),
  inventory_current_cost_estimate_cents:Number(inventory?.valued_posts||0)>0?Number(inventory.current_unit_price_estimate_cents||0):null,
  missing_price_posts:Number(inventory?.post_count||0)-Number(inventory?.valued_posts||0),
  creative_process_material_cost_cents:creative?.event_count>0?Number(creative.tracked_material_cents||0):null,
  reservations_excluded:true,unit_cost_is_current_not_historical:true,never_sum_two_material_views:true};
 const labour={actual_work_order_minutes:Number(time?.actual_minutes||0),time_entries:Number(time?.time_rows||0),
   finance_hourly_rate_cents:financeSource?.labour_rate_cents??null,
   work_order_cost_estimate_cents:time?.time_rows>0&&financeSource?.labour_rate_cents!=null&&Number.isFinite(Number(financeSource.labour_rate_cents))?
   Math.round(Number(time.actual_minutes)/60*Number(financeSource.labour_rate_cents)):null,
   creative_process_minutes:Number(creative?.creative_minutes||0),
   overlapping_time_logs_are_not_additive:true,not_payroll:true};
 return {project:p,finance_source:financeSource,finance_intelligence:finance,
   finance_projection_window_may_be_incomplete:financeProjectionCoverage,material_evidence:materials,
   labour_evidence:labour,production_cost_evidence:{rows:Number(production?.evidence_rows||0),
     reviewed_rows:Number(production?.reviewed_rows||0),known_direct_cost_cents:production?.cost_known_rows>0?
     Number(production.known_direct_cost_cents||0):null,not_an_additive_expense_account:true},
   linked_orders:orderResult,linked_order_sources_truncated:orderLinks.length>20,payment_refund_reconciliation:payments,
   source_gaps:sourceNeeds,review_history:reviewed.slice(0,80),history_truncated:reviewed.length>80,
   controls:SAFETY,finance_record_source:'creative_project_profitability',estimated_cost_is_booked_cost:false,
   snapshot_not_fiscal_close:true,currency:currencyWarning?'mixed':'CAD'};
}
export async function onRequestGet(ctx){
 const a=await auth(ctx);if(a.response)return a.response;
 const v=new URL(ctx.request.url).searchParams.get('project_id');
 try{
  if(!v){const raw=rows(await a.db.prepare(`SELECT p.creative_work_project_id,p.project_key,p.project_title,p.project_status,p.updated_at,
    f.revenue_cents, f.labour_rate_cents, f.overhead_cost_cents,
    (SELECT COUNT(*) FROM creative_project_finance_review_events e WHERE e.creative_work_project_id=p.creative_work_project_id) review_count
    FROM creative_work_projects p LEFT JOIN creative_project_profitability f ON f.creative_work_project_id=p.creative_work_project_id
    WHERE COALESCE(p.project_status,'active')<>'archived' ORDER BY p.creative_work_project_id DESC LIMIT 101`).all());
   return out({ok:true,projects:raw.slice(0,100),projects_truncated:raw.length>100,safety:SAFETY,review_types:TYPES,review_results:RESULTS,source_kinds:SOURCES});}
  const id=positive(v);if(!id||String(id)!==v)return out({ok:false,error:'Valid project ID required'},400);
  const detail=await review(a.db,id);return detail?out({ok:true,...detail}):out({ok:false,error:'Project not found'},404);
 }catch(e){console.error('BUILD383_ACCOUNTING_READ_FAILED',e?.name||'Error');return out({ok:false,error:'Accounting source reconciliation unavailable'},503);}
}
export async function onRequestPost(ctx){
 const a=await auth(ctx);if(a.response)return a.response;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return out({ok:false,error:'Same-origin request required'},403);
 let b;try{b=await ctx.request.json()}catch{return out({ok:false,error:'Invalid request body'},400)}
 const id=positive(b.creative_work_project_id),type=clean(b.review_type,60),result=clean(b.review_result,60),
   source=clean(b.source_kind,100),record=positive(b.source_record_id),note=clean(b.evidence_note,1200),key=clean(b.request_key,80);
 if(!id||!TYPES.includes(type)||!RESULTS.includes(result)||!SOURCES.includes(source)||note.length<16||
    !/^[0-9A-Za-z_-]{16,80}$/.test(key))return out({ok:false,error:'Project, review classification, source, 16+ character note and unique request key required'},400);
 if(result==='source_verified'&&(source==='operator_review'||!record))return out({ok:false,error:'Source verified requires an exact source-owned record ID'},409);
 try{
  const p=await project(a.db,id);if(!p)return out({ok:false,error:'Project not found'},404);
  const inserted=await a.db.prepare(`INSERT INTO creative_project_finance_review_events
  (creative_work_project_id,review_type,review_result,source_kind,source_record_id,evidence_note,actor_user_id,request_key)
  VALUES(?,?,?,?,?,?,?,?)`).bind(id,type,result,source,record||null,note,positive(a.user.user_id),key).run();
  const eventId=positive(inserted.meta?.last_row_id);
  await auditAdminAction(ctx.env,ctx.request,a.user,{action_type:'creative_project_finance_source_review',target_type:'creative_work_project',target_id:id,
    target_key:String(eventId),details:{review_type:type,review_result:result,source_kind:source,source_record_id:record||null,
     accounting_posted:false,payment_executed:false,review_note:note}});
  return out({ok:true,review_event_id:eventId,source_data_unchanged:true,message:'Human source review appended; no accounting, payment, tax or inventory posting was made.'});
 }catch(e){const msg=String(e?.message||'');if(/UNIQUE|constraint|finance_review_/.test(msg))return out({ok:false,error:'Duplicate key or project/source mismatch. Refresh source evidence.',code:'REVIEW_GUARD_REJECTED'},409);
  console.error('BUILD383_REVIEW_SAVE_FAILED',e?.name||'Error');return out({ok:false,error:'Source review could not be recorded'},503);}
}
