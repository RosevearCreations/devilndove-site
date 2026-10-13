// Build 383. Pure conservative math; source ledger amounts must never be summed into booked revenue.
export const TYPES=['revenue_source','material_consumption','labour_cost','production_cost','tax_source','payment_refund','variance_resolution','overall_readiness'];
export const RESULTS=['evidence_missing','needs_reconciliation','reviewed_with_caveat','source_verified'];
export const SOURCES=['creative_project_profitability','creative_work_events','creative_work_order_events','creative_project_inventory_posts','creative_project_production_cost_evidence','orders_payments_refunds','operator_review'];
export const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
export const rows=r=>Array.isArray(r?.results)?r.results:[];
export const moneyOrNull=v=>v===null||v===undefined?null:Number.isFinite(Number(v))?Math.round(Number(v)):null;
export function deriveOrders(orderRows){
 const orders=orderRows||[];return {order_count:orders.length,
  recorded_order_totals_cents:orders.length?orders.reduce((a,o)=>a+Number(o.total_cents||0),0):null,
  recorded_order_tax_cents:orders.length?orders.reduce((a,o)=>a+Number(o.tax_cents||0),0):null,
  gross_paid_cents:orders.length?orders.reduce((a,o)=>a+Number(o.gross_paid_cents||0),0):null,
  refund_cents:orders.length?orders.reduce((a,o)=>a+Number(o.refund_cents||0),0):null,
  net_paid_cents:orders.length?orders.reduce((a,o)=>a+Math.max(0,Number(o.gross_paid_cents||0)-Number(o.refund_cents||0)),0):null,
  revenue_posted_by_these_payments:false,deposit_is_paid_inferred:false};
}
export function evidenceFlags({finance,work,production,inventory,orders,links}){
 const missing=[];
 if(!finance)missing.push('No Finance project-profitability source record');
 if(!work||Number(work.time_rows||0)===0)missing.push('No actual work-order time evidence');
 if(!inventory||Number(inventory.post_count||0)===0)missing.push('No posted project inventory usage; reservations are not consumption');
 if(!production||Number(production.evidence_rows||0)===0)missing.push('No active manufacturing cost-evidence rows');
 if(!links)missing.push('No explicitly linked custom request/order source');
 if(!orders?.order_count)missing.push('No linked order/payment/refund reconciliation');
 return missing;
}
