// Devil n Dove Build 340 — Accounting-owned non-mutating reconciliation read service.

import { readAccountingAttachments } from './accountingAttachmentsReadService.js';
import { readAccountingVendors } from './accountingVendorsReadService.js';

export const BUILD = 340;
export const CONTRACT_ID = 'accounting-reconciliation-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze([
  'accounting_reconciliation_reviews',
  'accounting_attachments',
  'accounting_vendors',
]);

const REVIEW_COLUMNS = Object.freeze([
  'accounting_reconciliation_review_id','reconciliation_type','period_month','scope_key','review_status',
  'note','statement_reference','difference_reason','detail_json','attachment_count','statement_amount_cents',
  'book_amount_cents','tolerance_cents','expected_rate_basis_points','observed_rate_basis_points',
  'unresolved_item_count','reference_amount_cents','compared_amount_cents','difference_cents',
  'created_by_user_id','updated_by_user_id','created_at','updated_at'
]);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }
function cleanType(value) { const raw=text(value).toLowerCase(); return ['sales_tax','processor_fees','shipping'].includes(raw)?raw:'sales_tax'; }
function cleanStatus(value) { const raw=text(value).toLowerCase(); return ['draft','reviewed','needs_accountant','finalized'].includes(raw)?raw:'draft'; }
function cleanMonth(value) { const raw=text(value); if(/^\d{4}-\d{2}$/.test(raw)) return raw; if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0,7); return new Date().toISOString().slice(0,7); }
function safeJson(value, fallback={}) { try { return JSON.parse(String(value||'')); } catch { return fallback; } }
function toJson(value) { try { return JSON.stringify(value||{}); } catch { return '{}'; } }
async function tableExists(db, tableName) { try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first()); } catch { return false; } }
async function columnSet(db, tableName) { try { return new Set(rows(await db.prepare(`PRAGMA table_info(${tableName})`).all()).map((row)=>text(row?.name)).filter(Boolean)); } catch { return new Set(); } }
function firstExisting(cols,names,fallback='0'){ for(const name of names) if(cols.has(name)) return name; return fallback; }
function providerScopeFromText(value){ const raw=text(value).toLowerCase(); if(!raw)return'other'; if(raw.includes('paypal'))return'paypal'; if(raw.includes('stripe'))return'stripe'; if(raw.includes('square'))return'square'; if(raw.includes('etsy'))return'etsy'; if(raw.includes('bank'))return'bank'; return'other'; }
function defaultExpectedRateBps(scopeKey){ const scope=text(scopeKey).toLowerCase(); if(scope==='paypal')return 349; if(scope==='stripe')return 290; if(scope==='square')return 265; if(scope==='etsy')return 650; return 0; }
function payload(extra={}){ return {ok:true,build:BUILD,contract:CONTRACT_ID,owner:OWNER,mode:'read-only-accounting-reconciliation',authority_tables:AUTHORITY_TABLES,request_time_schema_mutation:false,...extra}; }

async function reviewReadiness(db){
  const table='accounting_reconciliation_reviews';
  if(!(await tableExists(db,table))) return {ready:false,missing_tables:[table],missing_columns:[]};
  const cols=await columnSet(db,table);
  const missing=REVIEW_COLUMNS.filter((name)=>!cols.has(name)).map((name)=>`${table}.${name}`);
  return {ready:missing.length===0,missing_tables:[],missing_columns:missing};
}

function shapeReview(row){
  return {
    accounting_reconciliation_review_id:Number(row.accounting_reconciliation_review_id||0),
    reconciliation_type:row.reconciliation_type||'sales_tax', period_month:row.period_month||'', scope_key:row.scope_key||'all', review_status:cleanStatus(row.review_status),
    note:row.note||'', statement_reference:row.statement_reference||'', difference_reason:row.difference_reason||'', detail_json:row.detail_json||'',
    attachment_count:Number(row.attachment_count||0), statement_amount_cents:Number(row.statement_amount_cents||0), book_amount_cents:Number(row.book_amount_cents||0),
    tolerance_cents:Number(row.tolerance_cents||0), expected_rate_basis_points:Number(row.expected_rate_basis_points||0), observed_rate_basis_points:Number(row.observed_rate_basis_points||0),
    unresolved_item_count:Number(row.unresolved_item_count||0), reference_amount_cents:Number(row.reference_amount_cents||0), compared_amount_cents:Number(row.compared_amount_cents||0), difference_cents:Number(row.difference_cents||0),
    created_by_user_id:row.created_by_user_id==null?null:Number(row.created_by_user_id||0), updated_by_user_id:row.updated_by_user_id==null?null:Number(row.updated_by_user_id||0),
    created_at:row.created_at||null, updated_at:row.updated_at||null,
  };
}

async function readReviews(db,{reconciliationType,periodMonth,includeAllPeriods},ready){
  if(!ready) return [];
  const result=await db.prepare(`
    SELECT accounting_reconciliation_review_id,reconciliation_type,period_month,scope_key,review_status,note,
           statement_reference,difference_reason,detail_json,attachment_count,statement_amount_cents,book_amount_cents,
           tolerance_cents,expected_rate_basis_points,observed_rate_basis_points,unresolved_item_count,
           reference_amount_cents,compared_amount_cents,difference_cents,created_by_user_id,updated_by_user_id,created_at,updated_at
    FROM accounting_reconciliation_reviews
    WHERE reconciliation_type=? AND (?='' OR period_month=? OR ?='1')
    ORDER BY period_month DESC,scope_key ASC
  `).bind(reconciliationType,periodMonth,periodMonth,includeAllPeriods?'1':'0').all().catch(()=>({results:[]}));
  return rows(result).map(shapeReview);
}

function attachmentInfo(attachments=[]){
  const by_scope={};
  for(const row of attachments){
    const scopeKey=text(row.scope_key)||'all';
    const item=by_scope[scopeKey]||{count:0,statement_count:0,files:[]};
    item.count+=1; if((row.attachment_kind||'')==='statement') item.statement_count+=1; if(item.files.length<5)item.files.push(row); by_scope[scopeKey]=item;
  }
  return {count:attachments.length,items:attachments.slice(0,40),all_items:attachments,by_scope};
}

function sumAttachmentStatements(attachments=[],scopeKey='all'){
  const normalized=text(scopeKey||'all').toLowerCase();
  const matches=attachments.filter((row)=>{ const scope=text(row.scope_key||'all').toLowerCase(); const provider=text(row.provider_scope).toLowerCase(); return scope===normalized||provider===normalized||(normalized==='all'&&!provider); });
  return matches.reduce((acc,row)=>{ acc.attachment_count+=1; if((row.attachment_kind||'')==='statement')acc.statement_count+=1; acc.statement_gross_cents+=Number(row.statement_gross_cents||0); acc.statement_fee_cents+=Number(row.statement_fee_cents||0); acc.statement_net_cents+=Number(row.statement_net_cents||0); acc.statement_tax_cents+=Number(row.statement_tax_cents||0); acc.statement_shipping_cents+=Number(row.statement_shipping_cents||0); acc.statement_txn_count+=Number(row.statement_txn_count||0); return acc; },{attachment_count:0,statement_count:0,statement_gross_cents:0,statement_fee_cents:0,statement_net_cents:0,statement_tax_cents:0,statement_shipping_cents:0,statement_txn_count:0});
}

async function loadSalesTaxSummary(db,periodMonth,statementAttachments=[]){
  const start=`${periodMonth}-01`; const end=new Date(Date.UTC(Number(periodMonth.slice(0,4)),Number(periodMonth.slice(5,7)),1)).toISOString().slice(0,10);
  const hasOrders=await tableExists(db,'orders'); const hasExpenses=await tableExists(db,'accounting_expenses'); const orderCols=hasOrders?await columnSet(db,'orders'):new Set();
  let collected=0,inputTax=0,orderCount=0,grossSalesCents=0,shippingCents=0,discountCents=0,expenseCount=0;
  if(hasOrders){
    const taxExpr=orderCols.has('tax_cents')?'COALESCE(tax_cents,0)':(orderCols.has('tax_amount')?'CAST(ROUND(COALESCE(tax_amount,0) * 100.0) AS INTEGER)':(orderCols.has('tax_total')?'CAST(ROUND(COALESCE(tax_total,0) * 100.0) AS INTEGER)':'0'));
    const subtotalExpr=orderCols.has('subtotal_cents')?'COALESCE(subtotal_cents,0)':(orderCols.has('subtotal_amount')?'CAST(ROUND(COALESCE(subtotal_amount,0) * 100.0) AS INTEGER)':'0');
    const shippingExpr=orderCols.has('shipping_cents')?'COALESCE(shipping_cents,0)':(orderCols.has('shipping_amount')?'CAST(ROUND(COALESCE(shipping_amount,0) * 100.0) AS INTEGER)':'0');
    const discountExpr=orderCols.has('discount_cents')?'COALESCE(discount_cents,0)':(orderCols.has('discount_amount')?'CAST(ROUND(COALESCE(discount_amount,0) * 100.0) AS INTEGER)':'0');
    const statusCol=firstExisting(orderCols,['order_status','status'],"''"); const createdCol=firstExisting(orderCols,['created_at'],"datetime('now')");
    const row=await db.prepare(`SELECT COALESCE(SUM(${taxExpr}),0) AS collected_cents,COALESCE(SUM(${subtotalExpr}),0) AS gross_sales_cents,COALESCE(SUM(${shippingExpr}),0) AS shipping_cents,COALESCE(SUM(${discountExpr}),0) AS discount_cents,COUNT(*) AS order_count FROM orders WHERE substr(COALESCE(${createdCol},datetime('now')),1,10)>=? AND substr(COALESCE(${createdCol},datetime('now')),1,10)<? AND LOWER(COALESCE(${statusCol},'')) IN ('paid','fulfilled','refunded','partially_refunded')`).bind(start,end).first().catch(()=>null);
    collected=Number(row?.collected_cents||0); grossSalesCents=Number(row?.gross_sales_cents||0); shippingCents=Number(row?.shipping_cents||0); discountCents=Number(row?.discount_cents||0); orderCount=Number(row?.order_count||0);
  }
  if(hasExpenses){ const row=await db.prepare(`SELECT COALESCE(SUM(CAST(ROUND(COALESCE(tax_amount,0)*100.0) AS INTEGER)),0) AS input_tax_cents,COUNT(*) AS expense_count FROM accounting_expenses WHERE substr(COALESCE(expense_date,created_at,datetime('now')),1,10)>=? AND substr(COALESCE(expense_date,created_at,datetime('now')),1,10)<?`).bind(start,end).first().catch(()=>null); inputTax=Number(row?.input_tax_cents||0); expenseCount=Number(row?.expense_count||0); }
  const taxableBaseCents=Math.max(0,grossSalesCents+shippingCents-discountCents); const observedRateBps=taxableBaseCents>0?Math.round((collected/taxableBaseCents)*10000):0; const netTaxPayableCents=collected-inputTax;
  const statementTotals=sumAttachmentStatements(statementAttachments,'all'); const statementTaxCents=Number(statementTotals.statement_tax_cents||statementTotals.statement_gross_cents||0); const unresolvedItemCount=Math.abs(statementTaxCents||netTaxPayableCents)>500?1:(netTaxPayableCents===0?0:1);
  return {period_month:periodMonth,rows:[{scope_key:'all',label:'Sales tax collected vs input tax credits',reference_amount_cents:collected,compared_amount_cents:inputTax,statement_amount_cents:statementTaxCents||netTaxPayableCents,book_amount_cents:netTaxPayableCents,difference_cents:(statementTaxCents||netTaxPayableCents)-netTaxPayableCents,order_count:orderCount,expense_count:expenseCount,gross_sales_cents:grossSalesCents,shipping_cents:shippingCents,discount_cents:discountCents,net_tax_payable_cents:netTaxPayableCents,expected_rate_basis_points:0,observed_rate_basis_points:observedRateBps,tolerance_cents:500,attachment_count:statementTotals.attachment_count,statement_count:statementTotals.statement_count,unresolved_item_count:unresolvedItemCount,detail_json:toJson({gross_sales_cents:grossSalesCents,shipping_cents:shippingCents,discount_cents:discountCents,tax_collected_cents:collected,input_tax_cents:inputTax,net_tax_payable_cents:netTaxPayableCents,statement_tax_cents:statementTaxCents,statement_attachment_count:statementTotals.attachment_count,statement_count:statementTotals.statement_count,order_count:orderCount,expense_count:expenseCount,observed_rate_basis_points:observedRateBps})}]};
}

async function loadProcessorFeeSummary(db,periodMonth,statementAttachments=[],vendorReady=false){
  const start=`${periodMonth}-01`; const end=new Date(Date.UTC(Number(periodMonth.slice(0,4)),Number(periodMonth.slice(5,7)),1)).toISOString().slice(0,10);
  const hasPayments=await tableExists(db,'payments'); const hasExpenses=await tableExists(db,'accounting_expenses'); const hasRefunds=await tableExists(db,'payment_refunds'); const paymentCols=hasPayments?await columnSet(db,'payments'):new Set(); const providerRows=[];
  if(hasPayments){ const amountExpr=paymentCols.has('amount_cents')?'COALESCE(amount_cents,0)':(paymentCols.has('amount')?'CAST(ROUND(COALESCE(amount,0)*100.0) AS INTEGER)':'0'); const paidAtCol=firstExisting(paymentCols,['paid_at','created_at'],"datetime('now')"); const paymentStatusCol=firstExisting(paymentCols,['payment_status'],"''"); const paymentRows=rows(await db.prepare(`SELECT LOWER(COALESCE(provider,'other')) AS provider,COALESCE(SUM(${amountExpr}),0) AS gross_paid_cents,COUNT(*) AS payment_count FROM payments WHERE substr(COALESCE(${paidAtCol},datetime('now')),1,10)>=? AND substr(COALESCE(${paidAtCol},datetime('now')),1,10)<? AND LOWER(COALESCE(${paymentStatusCol},'')) IN ('paid','partially_refunded','refunded') GROUP BY provider`).bind(start,end).all().catch(()=>({results:[]}))); providerRows.push(...paymentRows.map((row)=>({scope_key:providerScopeFromText(row.provider),label:`${row.provider||'Other'} expected fees vs booked fees`,gross_paid_cents:Number(row.gross_paid_cents||0),reference_amount_cents:0,statement_amount_cents:0,compared_amount_cents:0,book_amount_cents:0,difference_cents:0,payment_count:Number(row.payment_count||0),booked_expense_count:0,refund_cents:0,unresolved_item_count:0,expected_rate_basis_points:defaultExpectedRateBps(providerScopeFromText(row.provider)),observed_rate_basis_points:0,tolerance_cents:500}))); }
  if(hasExpenses){
    const sql=vendorReady?`SELECT LOWER(COALESCE(v.vendor_name,e.vendor_name,e.ledger_name,'other')) AS vendor_name,COALESCE(SUM(CAST(ROUND((COALESCE(e.amount,0)+COALESCE(e.tax_amount,0))*100.0) AS INTEGER)),0) AS expense_cents,COUNT(*) AS expense_count FROM accounting_expenses e LEFT JOIN accounting_vendors v ON v.accounting_vendor_id=e.vendor_id WHERE substr(COALESCE(e.expense_date,e.created_at,datetime('now')),1,10)>=? AND substr(COALESCE(e.expense_date,e.created_at,datetime('now')),1,10)<? GROUP BY vendor_name`:`SELECT LOWER(COALESCE(e.vendor_name,e.ledger_name,'other')) AS vendor_name,COALESCE(SUM(CAST(ROUND((COALESCE(e.amount,0)+COALESCE(e.tax_amount,0))*100.0) AS INTEGER)),0) AS expense_cents,COUNT(*) AS expense_count FROM accounting_expenses e WHERE substr(COALESCE(e.expense_date,e.created_at,datetime('now')),1,10)>=? AND substr(COALESCE(e.expense_date,e.created_at,datetime('now')),1,10)<? GROUP BY vendor_name`;
    const expenseRows=rows(await db.prepare(sql).bind(start,end).all().catch(()=>({results:[]})));
    for(const row of expenseRows){ const scopeKey=providerScopeFromText(row.vendor_name); const existing=providerRows.find((item)=>item.scope_key===scopeKey); if(existing){existing.compared_amount_cents=Number(row.expense_cents||0);existing.book_amount_cents=Number(row.expense_cents||0);existing.booked_expense_count=Number(row.expense_count||0);}else providerRows.push({scope_key:scopeKey,label:`${scopeKey} expected fees vs booked fees`,gross_paid_cents:0,reference_amount_cents:0,statement_amount_cents:0,compared_amount_cents:Number(row.expense_cents||0),book_amount_cents:Number(row.expense_cents||0),difference_cents:0,payment_count:0,booked_expense_count:Number(row.expense_count||0),refund_cents:0,unresolved_item_count:0,expected_rate_basis_points:defaultExpectedRateBps(scopeKey),observed_rate_basis_points:0,tolerance_cents:500}); }
  }
  if(hasRefunds){ const refundRows=rows(await db.prepare(`SELECT LOWER(COALESCE(provider,'other')) AS provider,COALESCE(SUM(CAST(ROUND(COALESCE(amount,0)*100.0) AS INTEGER)),0) AS refund_cents FROM payment_refunds WHERE substr(COALESCE(created_at,datetime('now')),1,10)>=? AND substr(COALESCE(created_at,datetime('now')),1,10)<? GROUP BY provider`).bind(start,end).all().catch(()=>({results:[]}))); for(const row of refundRows){ const scopeKey=providerScopeFromText(row.provider); const existing=providerRows.find((item)=>item.scope_key===scopeKey); if(existing)existing.refund_cents=Number(row.refund_cents||0); else providerRows.push({scope_key:scopeKey,label:`${scopeKey} expected fees vs booked fees`,gross_paid_cents:0,reference_amount_cents:0,statement_amount_cents:0,compared_amount_cents:0,book_amount_cents:0,difference_cents:0,payment_count:0,booked_expense_count:0,refund_cents:Number(row.refund_cents||0),unresolved_item_count:0,expected_rate_basis_points:defaultExpectedRateBps(scopeKey),observed_rate_basis_points:0,tolerance_cents:500}); } }
  const rowsOut=providerRows.map((row)=>{ const netPaidCents=Math.max(0,Number(row.gross_paid_cents||0)-Number(row.refund_cents||0)); const expectedRateBps=Number(row.expected_rate_basis_points||0); const expectedFeeCents=expectedRateBps>0?Math.round((netPaidCents*expectedRateBps)/10000):0; const statementTotals=sumAttachmentStatements(statementAttachments,row.scope_key); const statementFeeCents=Number(statementTotals.statement_fee_cents||0); const statementGrossCents=Number(statementTotals.statement_gross_cents||0); row.reference_amount_cents=expectedFeeCents; row.statement_amount_cents=statementFeeCents||expectedFeeCents; row.difference_cents=(statementFeeCents||expectedFeeCents)-Number(row.compared_amount_cents||0); row.expected_rate_basis_points=expectedRateBps; row.observed_rate_basis_points=netPaidCents>0?Math.round((Number(row.compared_amount_cents||0)/netPaidCents)*10000):0; row.attachment_count=statementTotals.attachment_count; row.statement_count=statementTotals.statement_count; row.unresolved_item_count=Math.abs(row.difference_cents)>500?1:0; row.detail_json=toJson({gross_paid_cents:Number(row.gross_paid_cents||0),refund_cents:Number(row.refund_cents||0),net_paid_cents:netPaidCents,expected_fee_cents:expectedFeeCents,booked_fee_cents:Number(row.compared_amount_cents||0),statement_fee_cents:statementFeeCents,statement_gross_cents:statementGrossCents,payment_count:Number(row.payment_count||0),booked_expense_count:Number(row.booked_expense_count||0),statement_count:statementTotals.statement_count}); return row; });
  return {period_month:periodMonth,rows:rowsOut.sort((a,b)=>String(a.scope_key).localeCompare(String(b.scope_key)))};
}

async function loadShippingSummary(db,periodMonth,statementAttachments=[]){
  const start=`${periodMonth}-01`; const end=new Date(Date.UTC(Number(periodMonth.slice(0,4)),Number(periodMonth.slice(5,7)),1)).toISOString().slice(0,10); const hasOrders=await tableExists(db,'orders'); const hasExpenses=await tableExists(db,'accounting_expenses'); const orderCols=hasOrders?await columnSet(db,'orders'):new Set(); let charged=0,booked=0,fulfilledCount=0,expenseCount=0;
  if(hasOrders){ const shippingExpr=orderCols.has('shipping_cents')?'COALESCE(shipping_cents,0)':(orderCols.has('shipping_amount')?'CAST(ROUND(COALESCE(shipping_amount,0)*100.0) AS INTEGER)':'0'); const statusCol=firstExisting(orderCols,['order_status','status'],"''"); const createdCol=firstExisting(orderCols,['created_at'],"datetime('now')"); const row=await db.prepare(`SELECT COALESCE(SUM(${shippingExpr}),0) AS shipping_charged_cents,COUNT(*) AS fulfilled_count FROM orders WHERE substr(COALESCE(${createdCol},datetime('now')),1,10)>=? AND substr(COALESCE(${createdCol},datetime('now')),1,10)<? AND LOWER(COALESCE(${statusCol},'')) IN ('fulfilled','paid')`).bind(start,end).first().catch(()=>null); charged=Number(row?.shipping_charged_cents||0); fulfilledCount=Number(row?.fulfilled_count||0); }
  if(hasExpenses){ const row=await db.prepare(`SELECT COALESCE(SUM(CAST(ROUND((COALESCE(amount,0)+COALESCE(tax_amount,0))*100.0) AS INTEGER)),0) AS shipping_cost_cents,COUNT(*) AS expense_count FROM accounting_expenses WHERE substr(COALESCE(expense_date,created_at,datetime('now')),1,10)>=? AND substr(COALESCE(expense_date,created_at,datetime('now')),1,10)<? AND (LOWER(COALESCE(ledger_name,'')) LIKE '%shipping%' OR LOWER(COALESCE(vendor_name,'')) LIKE '%post%' OR LOWER(COALESCE(vendor_name,'')) LIKE '%ups%' OR LOWER(COALESCE(vendor_name,'')) LIKE '%fedex%')`).bind(start,end).first().catch(()=>null); booked=Number(row?.shipping_cost_cents||0); expenseCount=Number(row?.expense_count||0); }
  const statementTotals=sumAttachmentStatements(statementAttachments,'shipping'); const statementAmount=Number(statementTotals.statement_shipping_cents||statementTotals.statement_gross_cents||charged);
  return {period_month:periodMonth,rows:[{scope_key:'shipping',label:'Shipping charged vs booked shipping cost',reference_amount_cents:charged,compared_amount_cents:booked,statement_amount_cents:statementAmount,book_amount_cents:booked,difference_cents:statementAmount-booked,fulfilled_order_count:fulfilledCount,shipping_expense_count:expenseCount,tolerance_cents:1000,attachment_count:statementTotals.attachment_count,statement_count:statementTotals.statement_count,unresolved_item_count:Math.abs(statementAmount-booked)>1000?1:0,detail_json:toJson({shipping_charged_cents:charged,shipping_cost_cents:booked,statement_shipping_cents:statementTotals.statement_shipping_cents,statement_gross_cents:statementTotals.statement_gross_cents,fulfilled_order_count:fulfilledCount,shipping_expense_count:expenseCount,statement_count:statementTotals.statement_count})}]};
}

export async function readAccountingReconciliation(db,{reconciliationType='',periodMonth='',includeAllPeriods=false}={}){
  if(!db) throw new TypeError('A D1 database binding is required.');
  const type=cleanType(reconciliationType); const period=cleanMonth(periodMonth);
  const reviewState=await reviewReadiness(db);
  const attachmentsResult=await readAccountingAttachments(db,{reconciliationType:type,periodMonth:period,limit:500});
  const vendorsResult=await readAccountingVendors(db,{includeInactive:true});
  const missingTables=[...new Set([...(reviewState.missing_tables||[]),...(attachmentsResult.missing_tables||[]),...(vendorsResult.missing_tables||[])])];
  const missingColumns=[...new Set([...(reviewState.missing_columns||[]),...(attachmentsResult.missing_columns||[]),...(vendorsResult.missing_columns||[])])];
  const schemaReady=missingTables.length===0&&missingColumns.length===0;
  const info=attachmentInfo(attachmentsResult.attachments||[]); const statementAttachments=info.all_items.filter((row)=>(row.attachment_kind||'')==='statement');
  let computed; if(type==='processor_fees')computed=await loadProcessorFeeSummary(db,period,statementAttachments,vendorsResult.schema_ready===true); else if(type==='shipping')computed=await loadShippingSummary(db,period,statementAttachments); else computed=await loadSalesTaxSummary(db,period,statementAttachments);
  const reviews=await readReviews(db,{reconciliationType:type,periodMonth:period,includeAllPeriods},reviewState.ready);
  const reviewMap=new Map(reviews.map((row)=>[`${row.period_month}|${row.scope_key}`,row]));
  const rowsWithReviews=computed.rows.map((row)=>{ const review=reviewMap.get(`${period}|${row.scope_key}`)||null; const attachmentScope=info.by_scope[text(row.scope_key||'all')]||info.by_scope.all||{count:0,statement_count:0,files:[]}; const detail=safeJson(review?.detail_json||row.detail_json||'{}',{}); return {...row,review,attachment_count:Number(review?.attachment_count||attachmentScope.count||0),statement_count:Number(attachmentScope.statement_count||0),expected_rate_basis_points:Number(review?.expected_rate_basis_points||row.expected_rate_basis_points||detail.expected_rate_basis_points||0),observed_rate_basis_points:Number(review?.observed_rate_basis_points||row.observed_rate_basis_points||detail.observed_rate_basis_points||0),statement_amount_cents:Number(review?.statement_amount_cents||row.statement_amount_cents||row.reference_amount_cents||0),book_amount_cents:Number(review?.book_amount_cents||row.book_amount_cents||row.compared_amount_cents||0),tolerance_cents:Number(review?.tolerance_cents||row.tolerance_cents||0),unresolved_item_count:Number(review?.unresolved_item_count||row.unresolved_item_count||0)}; });
  return payload({schema_ready:schemaReady,missing_tables:missingTables,missing_columns:missingColumns,type,period_month:period,rows:rowsWithReviews,reviews,attachment_preview:info.items,count:rowsWithReviews.length,summary:{row_count:rowsWithReviews.length,finalized_count:reviews.filter((row)=>row.review_status==='finalized').length,reviewed_count:reviews.filter((row)=>row.review_status==='reviewed'||row.review_status==='finalized').length,attachment_count:info.count,statement_reference_count:reviews.filter((row)=>text(row.statement_reference)).length,unresolved_row_count:rowsWithReviews.filter((row)=>Number(row.unresolved_item_count||0)>0||Math.abs(Number(row.difference_cents||0))>Number(row.tolerance_cents||0)).length}});
}
