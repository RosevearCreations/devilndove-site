// Devil n Dove Build 342 — Accounting-owned non-mutating close-workflow read service.

import { readAccountingPeriodLocks } from './accountingPeriodLocksReadService.js';

export const BUILD = 342;
export const CONTRACT_ID = 'accounting-close-workflow-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze([
  'accounting_payment_applications',
  'accounting_hst_gst_reviews',
  'accounting_period_closures',
  'accountant_export_packages',
  'accounting_evidence_attachments',
]);

const REQUIRED = Object.freeze({
  accounting_payment_applications: ['accounting_payment_application_id','payment_id','order_id','period_month','application_status','applied_amount_cents','fee_amount_cents','tax_component_cents','provider','transaction_reference','application_notes','created_by_user_id','reviewed_by_user_id','reviewed_at','created_at','updated_at'],
  accounting_hst_gst_reviews: ['accounting_hst_gst_review_id','period_month','review_status','sales_tax_collected_cents','input_tax_credit_cents','net_tax_payable_cents','filing_reference','filing_due_date','remittance_status','remittance_evidence_url','reminder_date','reviewed_by_user_id','reviewed_at','notes','created_at','updated_at'],
  accountant_export_packages: ['accountant_export_package_id','package_key','period_month','tax_year','package_status','manifest_json','created_by_user_id','finalized_by_user_id','finalized_at','created_at','updated_at','notes'],
  accounting_evidence_attachments: ['accounting_evidence_attachment_id','period_month','evidence_kind','title','evidence_url','object_key','original_filename','mime_type','file_size_bytes','attachment_status','created_by_user_id','created_at','updated_at'],
});

function rows(result){ return Array.isArray(result?.results)?result.results:[]; }
function text(value){ return String(value??'').trim(); }
function monthValue(value){ const raw=text(value); return /^\d{4}-\d{2}$/.test(raw)?raw:new Date().toISOString().slice(0,7); }
async function tableExists(db,table){ try{return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(table).first());}catch{return false;} }
async function columnSet(db,table){ try{return new Set(rows(await db.prepare(`PRAGMA table_info(${table})`).all()).map((row)=>text(row?.name)).filter(Boolean));}catch{return new Set();} }
async function readiness(db,table,required){ if(!(await tableExists(db,table)))return{ready:false,missing_tables:[table],missing_columns:[]}; const cols=await columnSet(db,table); const missing=required.filter((name)=>!cols.has(name)).map((name)=>`${table}.${name}`); return{ready:missing.length===0,missing_tables:[],missing_columns:missing}; }
function emptyPayment(){ return {pending_orders:[],applied_rows:[],summary:{order_count:0,total_cents:0,paid_cents:0,outstanding_cents:0,tax_cents:0,applied_cents:0}}; }
function emptyHst(periodMonth,fallbackTaxCents=0){ return {period_month:periodMonth,review_status:'draft',sales_tax_collected_cents:fallbackTaxCents,input_tax_credit_cents:0,net_tax_payable_cents:fallbackTaxCents,filing_reference:'',filing_due_date:'',remittance_status:'not_ready',remittance_evidence_url:'',reminder_date:'',notes:''}; }
function emptyClosure(periodMonth){ return {period_month:periodMonth,lock_state:'open',close_checklist:{bank_reconciled:0,sales_tax_reviewed:0,receipts_attached:0,gifi_reviewed:0,schedule_141_notes_started:0,accountant_followup_flagged:0},close_notes:''}; }
function evidenceBundleSummary(data){ const items=data.evidence_attachments||[]; let binarySafe=0,binaryBytes=0,urlOnly=0; const warnings=[]; for(const row of items){ const size=Number(row.file_size_bytes||0)||0; const mime=text(row.mime_type).toLowerCase(); if(!row.object_key||!(mime==='application/pdf'||mime.startsWith('image/'))||size>5242880){urlOnly+=1;continue;} binarySafe+=1;binaryBytes+=size; } return {total_attachments:items.length,binary_fetch_enabled:false,binary_requested:false,binary_safe_count:binarySafe,binary_safe_bytes:binaryBytes,url_only_count:urlOnly,max_bytes_per_file:5242880,warnings}; }
function closeReadiness(closure,hst,payment){ const checklist=closure?.close_checklist||{}; const blockers=[]; if(!checklist.bank_reconciled)blockers.push('Bank/reconciliation checkbox is not complete.'); if(!checklist.sales_tax_reviewed&&!['reviewed','finalized','filed'].includes(String(hst.review_status||'')))blockers.push('HST/GST review is not marked reviewed/finalized.'); if(Number(payment.summary?.outstanding_cents||0)>0)blockers.push('Some orders still show outstanding payment balance.'); if(!checklist.receipts_attached)blockers.push('Receipt/bill support checkbox is not complete.'); return {ready:blockers.length===0,blockers}; }
function payload(extra={}){ return {ok:true,build:BUILD,contract:CONTRACT_ID,owner:OWNER,mode:'read-only-accounting-close-workflow',authority_tables:AUTHORITY_TABLES,request_time_schema_mutation:false,...extra}; }

async function paymentSummary(db,periodMonth,paymentApplicationsReady){
  const hasOrders=await tableExists(db,'orders'); if(!hasOrders&&!paymentApplicationsReady)return emptyPayment();
  let pending=[];
  if(hasOrders){
    const hasPayments=await tableExists(db,'payments');
    pending=rows(await db.prepare(`
      SELECT o.order_id,o.order_number,o.customer_name,o.customer_email,o.total_cents,o.tax_cents,o.currency,o.payment_status,o.order_status,o.created_at,
             COALESCE(pay.paid_cents,0) AS paid_cents,
             MAX(COALESCE(o.total_cents,0)-COALESCE(pay.paid_cents,0),0) AS outstanding_cents
      FROM orders o
      LEFT JOIN (${hasPayments?`SELECT order_id,SUM(CASE WHEN LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured') THEN COALESCE(amount_cents,0) ELSE 0 END) AS paid_cents FROM payments GROUP BY order_id`:`SELECT NULL AS order_id,0 AS paid_cents`}) pay ON pay.order_id=o.order_id
      WHERE substr(COALESCE(o.created_at,''),1,7)=?
      ORDER BY outstanding_cents DESC,datetime(o.created_at) DESC
      LIMIT 80
    `).bind(periodMonth).all().catch(()=>({results:[]})));
  }
  const applied=paymentApplicationsReady?rows(await db.prepare(`SELECT * FROM accounting_payment_applications WHERE period_month=? ORDER BY datetime(updated_at) DESC LIMIT 80`).bind(periodMonth).all().catch(()=>({results:[]}))):[];
  const summary=pending.reduce((acc,row)=>{acc.order_count+=1;acc.paid_cents+=Number(row.paid_cents||0);acc.outstanding_cents+=Number(row.outstanding_cents||0);acc.total_cents+=Number(row.total_cents||0);acc.tax_cents+=Number(row.tax_cents||0);return acc;},{order_count:0,total_cents:0,paid_cents:0,outstanding_cents:0,tax_cents:0,applied_cents:applied.reduce((sum,row)=>sum+Number(row.applied_amount_cents||0),0)});
  return {pending_orders:pending,applied_rows:applied,summary};
}

async function hstReview(db,periodMonth,fallbackTaxCents,ready){ if(!ready)return emptyHst(periodMonth,fallbackTaxCents); const row=await db.prepare(`SELECT * FROM accounting_hst_gst_reviews WHERE period_month=? LIMIT 1`).bind(periodMonth).first().catch(()=>null); return row||emptyHst(periodMonth,fallbackTaxCents); }
async function exportPackages(db,periodMonth,ready){ if(!ready)return[]; const taxYear=periodMonth.slice(0,4); return rows(await db.prepare(`SELECT * FROM accountant_export_packages WHERE period_month=? OR tax_year=? ORDER BY datetime(updated_at) DESC LIMIT 30`).bind(periodMonth,taxYear).all().catch(()=>({results:[]}))); }
async function evidenceAttachments(db,periodMonth,ready){ if(!ready)return[]; return rows(await db.prepare(`SELECT * FROM accounting_evidence_attachments WHERE period_month=? ORDER BY datetime(created_at) DESC LIMIT 200`).bind(periodMonth).all().catch(()=>({results:[]}))); }

export async function readAccountingCloseWorkflow(db,{periodMonth=''}={}){
  if(!db)throw new TypeError('A D1 database binding is required.');
  const period=monthValue(periodMonth);
  const appState=await readiness(db,'accounting_payment_applications',REQUIRED.accounting_payment_applications);
  const hstState=await readiness(db,'accounting_hst_gst_reviews',REQUIRED.accounting_hst_gst_reviews);
  const packageState=await readiness(db,'accountant_export_packages',REQUIRED.accountant_export_packages);
  const evidenceState=await readiness(db,'accounting_evidence_attachments',REQUIRED.accounting_evidence_attachments);
  const closureResult=await readAccountingPeriodLocks(db,{periodMonth:period});
  const missingTables=[...new Set([...appState.missing_tables,...hstState.missing_tables,...packageState.missing_tables,...evidenceState.missing_tables,...(closureResult.missing_tables||[])])];
  const missingColumns=[...new Set([...appState.missing_columns,...hstState.missing_columns,...packageState.missing_columns,...evidenceState.missing_columns,...(closureResult.missing_columns||[])])];
  const schemaReady=missingTables.length===0&&missingColumns.length===0;
  const payment=await paymentSummary(db,period,appState.ready);
  const hst=await hstReview(db,period,Number(payment.summary?.tax_cents||0),hstState.ready);
  const closure=closureResult.closure||emptyClosure(period);
  const export_packages=await exportPackages(db,period,packageState.ready);
  const evidence_attachments=await evidenceAttachments(db,period,evidenceState.ready);
  const data=payload({schema_ready:schemaReady,missing_tables:missingTables,missing_columns:missingColumns,period_month:period,payment,hst_review:hst,closure,export_packages,evidence_attachments});
  data.close_readiness=closeReadiness(closure,hst,payment);
  data.evidence_bundle_summary=evidenceBundleSummary(data);
  return data;
}
