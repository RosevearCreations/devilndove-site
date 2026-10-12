// Release 467 Build 380: pure cost and unit projections, never approval/accounting totals.
export function quantity(value){
 const n=Number(value);
 return Number.isFinite(n)&&n>0&&n<=100000&&Math.abs(Math.round(n*1000)-n*1000)<0.00001?Math.round(n*1000)/1000:null;
}
export function money(stockQty,unitCostCents){
 const n=Number(unitCostCents);
 if(!Number.isFinite(n)||n<=0)return null;
 return Math.round(stockQty*n);
}
export function summarize(allocations,posts){
 const remaining=allocations.reduce((n,a)=>n+Number(a.original_stock_quantity||0)-Number(a.released_stock_quantity||0),0);
 const posted=posts.reduce((n,p)=>n+Number(p.stock_quantity_consumed||0),0);
 const known=posts.filter(p=>p.estimated_cost_cents!==null&&p.estimated_cost_cents!==undefined);
 return {reserved_stock_units:Math.round(remaining*1000)/1000,actual_posted_stock_units:Math.round(posted*1000)/1000,
 actual_posted_cost_estimate_cents:known.length?known.reduce((n,p)=>n+Number(p.estimated_cost_cents||0),0):null,
 unknown_cost_rows:posts.length-known.length,accounting_authority:false,inventory_posting_authority:'creative_process'};
}
