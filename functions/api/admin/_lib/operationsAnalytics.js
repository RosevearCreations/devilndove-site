// Build 384 — pure, conservative aggregation over bounded source-owned samples.
export const sample=(result,max=100)=>{const raw=Array.isArray(result?.results)?result.results:[];return {rows:raw.slice(0,max),truncated:raw.length>max,limit:max};};
export function summarize(sources){
 const projects=sources.projects.rows,requests=sources.requests.rows,work=sources.work.rows,materials=sources.materials.rows,
   calendar=sources.calendar.rows,commission=sources.commission.rows,finance=sources.finance.rows;
 const count=(array,pred)=>array.filter(pred).length;
 const sum=(array,fn)=>array.reduce((total,row)=>total+(Number(fn(row))||0),0);
 const activeCalendar=count(calendar,x=>x.entry_status==='active');
 const data={
   projects:{sample_count:projects.length,active:count(projects,x=>x.project_status!=='archived'),archived:count(projects,x=>x.project_status==='archived')},
   custom_requests:{sample_count:requests.length,pending_review:count(requests,x=>['new','reviewing','quote_needed'].includes(x.status)),accepted:count(requests,x=>x.status==='accepted')},
   work:{sample_count:work.length,time_entries:count(work,x=>x.event_kind==='time'),work_minutes:sum(work,x=>x.event_kind==='time'?x.minutes_worked:0),milestones:count(work,x=>x.event_kind==='milestone')},
   materials:{reservation_rows:materials.length,open_reservations:count(materials,x=>Number(x.original_stock_quantity)>Number(x.released_stock_quantity)),unreleased_stock_units:sum(materials,x=>Math.max(0,Number(x.original_stock_quantity||0)-Number(x.released_stock_quantity||0))),inventory_cost_postings_created:0},
   calendar:{sample_count:calendar.length,active_events:activeCalendar,maintenance_holds:count(calendar,x=>x.entry_status==='active'&&x.entry_kind==='maintenance'),overrides:count(calendar,x=>Number(x.override_conflict)===1)},
   customer_review:{sample_count:commission.length,customer_progress_approvals:count(commission,x=>x.event_kind==='progress_approval')},
   finance_reviews:{sample_count:finance.length,source_verified:count(finance,x=>x.review_result==='source_verified'),needs_reconciliation:count(finance,x=>x.review_result==='needs_reconciliation')}
 };
 return {modules:data,sample_limits:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,{rows:v.rows.length,limit:v.limit,truncated:v.truncated}])),
  any_truncated:Object.values(sources).some(v=>v.truncated),count_is_global:false,history_complete:false,financial_totals_available:false};
}
