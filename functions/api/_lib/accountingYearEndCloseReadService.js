// Devil n Dove Build 343 — Accounting-owned non-mutating year-end close read service.

import { readAccountingPeriodLocks } from './accountingPeriodLocksReadService.js';
import { readAccountingGifiNotes } from './accountingGifiNotesReadService.js';
import { readAccountingReconciliation } from './accountingReconciliationReadService.js';
import { readAccountingAttachments } from './accountingAttachmentsReadService.js';
import { readAccountingStatementImports } from './accountingStatementImportsReadService.js';
import { readAccountingGeneralLedger } from './accountingGeneralLedgerReadService.js';

export const BUILD = 343;
export const CONTRACT_ID = 'accounting-year-end-close-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze([
  'accounting_period_closures','accounting_gifi_review_notes','accounting_reconciliation_reviews','accounting_attachments',
  'accounting_statement_imports','accounting_reconciliation_exceptions','accounting_statement_provider_profiles','general_ledger_accounts',
]);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function yearValue(value) { const raw=String(value||'').trim(); return /^\d{4}$/.test(raw)?raw:''; }
function summarizeBy(items,keyFn){ const out={}; for(const item of items){ const key=String(keyFn(item)||'unknown'); out[key]=Number(out[key]||0)+1; } return out; }
function unique(values){ return [...new Set((values||[]).filter(Boolean))]; }
function payload(extra={}){ return {ok:true,build:BUILD,contract:CONTRACT_ID,owner:OWNER,mode:'read-only-accounting-year-end-close',authority_tables:AUTHORITY_TABLES,request_time_schema_mutation:false,...extra}; }
function csvEscape(value){ const text=String(value==null?'':value); if(/["\n,]/.test(text)) return `"${text.replace(/"/g,'""')}"`; return text; }

export function flattenAccountingYearEndCsvRows(bundle){
  const output=[]; const push=(section,groupKey,itemKey,value,notes='')=>output.push({section,group_key:groupKey,item_key:itemKey,value,notes});
  Object.entries(bundle?.checklist||{}).forEach(([key,value])=>push('checklist','summary',key,value));
  const handoff=bundle?.accountant_handoff||{};
  Object.entries(handoff.gl_review_summary||{}).forEach(([key,value])=>push('gl_review_summary','gl',key,value));
  const attachmentSummary=handoff.attachment_summary||{};
  for(const [group,values] of Object.entries({by_kind:attachmentSummary.by_kind||{},by_status:attachmentSummary.by_status||{},by_month:attachmentSummary.by_month||{},by_scope:attachmentSummary.by_scope||{},by_attachment_scope:attachmentSummary.by_attachment_scope||{}})) Object.entries(values).forEach(([key,value])=>push('attachment_summary',group,key,value));
  (attachmentSummary.coverage_gaps||[]).forEach((item,index)=>push('attachment_gaps','gap',String(index+1),item));
  Object.entries(attachmentSummary.statement_metrics||{}).forEach(([key,value])=>push('attachment_statement_metrics','statements',key,typeof value==='object'?JSON.stringify(value):value));
  Object.entries(attachmentSummary.coverage_matrix||{}).forEach(([month,values])=>push('attachment_coverage_matrix',month,'matrix',JSON.stringify(values||{})));
  const reconciliationSummary=handoff.reconciliation_summary||{};
  for(const [group,values] of Object.entries({by_type:reconciliationSummary.by_type||{},by_status:reconciliationSummary.by_status||{},by_scope:reconciliationSummary.by_scope||{}})) Object.entries(values).forEach(([key,value])=>push('reconciliation_summary',group,key,value));
  Object.entries(reconciliationSummary.matrix_by_month||{}).forEach(([month,monthRows])=>Object.entries(monthRows||{}).forEach(([kind,detail])=>push('reconciliation_matrix',month,kind,detail?.difference_cents??'',JSON.stringify(detail||{}))));
  (handoff.gl_final_blockers||[]).forEach((row)=>push('gl_blockers',row.blocker_type||'needs_review',row.code||'',row.gifi_review_state||'',row.name||''));
  (handoff.recommended_missing_items||[]).forEach((item,index)=>push('recommended_missing_items','missing',String(index+1),item));
  (handoff.handoff_export_checklist||[]).forEach((item,index)=>push('handoff_export_checklist','export',String(index+1),item));
  const statementImportSummary=handoff.statement_import_summary||{};
  Object.entries(statementImportSummary.by_provider||{}).forEach(([key,value])=>push('statement_import_summary','by_provider',key,value));
  Object.entries(statementImportSummary.by_month||{}).forEach(([key,value])=>push('statement_import_summary','by_month',key,value));
  (handoff.statement_import_rows||[]).forEach((row,index)=>push('statement_import_rows',row.provider_scope||'other',String(index+1),row.row_count||0,JSON.stringify(row||{})));
  const exceptionSummary=handoff.exception_summary||{};
  Object.entries(exceptionSummary.by_type||{}).forEach(([key,value])=>push('exception_summary','by_type',key,value));
  Object.entries(exceptionSummary.by_status||{}).forEach(([key,value])=>push('exception_summary','by_status',key,value));
  (handoff.unresolved_items_summary||[]).forEach((row,index)=>push('unresolved_items_summary',row.reconciliation_type||'other',String(index+1),row.difference_cents||0,JSON.stringify(row||{})));
  (handoff.attachment_index||[]).forEach((row,index)=>push('attachment_index',row.attachment_kind||'other',String(index+1),row.original_filename||row.statement_reference||'',JSON.stringify({period_month:row.period_month,scope_key:row.scope_key,provider_scope:row.provider_scope,public_url:row.public_url})));
  (bundle?.notes||[]).forEach((item,index)=>push('notes','bundle',String(index+1),item));
  return output;
}

export function accountingYearEndCsv(bundle){
  const lines=['section,group_key,item_key,value,notes'];
  for(const row of flattenAccountingYearEndCsvRows(bundle)) lines.push([row.section,row.group_key,row.item_key,row.value,row.notes].map(csvEscape).join(','));
  return lines.join('\n');
}

export function accountingYearEndCsvPack(bundle){
  const attachments=bundle?.attachments||[]; const exceptions=bundle?.accountant_handoff?.unresolved_items_summary||[]; const imports=bundle?.accountant_handoff?.statement_import_rows||[];
  const attachmentLines=['attachment_kind,attachment_status,period_month,scope_key,provider_scope,original_filename,public_url'];
  for(const row of attachments) attachmentLines.push([row.attachment_kind,row.attachment_status,row.period_month,row.scope_key,row.provider_scope,row.original_filename,row.public_url].map(csvEscape).join(','));
  const unresolvedLines=['reconciliation_type,period_month,scope_key,status,difference_cents,tolerance_cents,notes'];
  for(const row of exceptions) unresolvedLines.push([row.reconciliation_type,row.period_month,row.scope_key,row.exception_status,row.difference_cents,row.tolerance_cents,row.notes].map(csvEscape).join(','));
  const importLines=['provider_scope,period_month,row_count,gross_cents,fee_cents,net_cents,tax_cents,shipping_cents,statement_reference'];
  for(const row of imports) importLines.push([row.provider_scope,row.period_month,row.row_count,row.gross_cents,row.fee_cents,row.net_cents,row.tax_cents,row.shipping_cents,row.statement_reference].map(csvEscape).join(','));
  return ['# devilndove-year-end-summary.csv',...accountingYearEndCsv(bundle).split('\n'),'','# devilndove-attachment-index.csv',...attachmentLines,'','# devilndove-unresolved-items.csv',...unresolvedLines,'','# devilndove-statement-imports.csv',...importLines].join('\n');
}

export async function readAccountingYearEndClose(db,{year=''}={}){
  if(!db) throw new TypeError('A D1 database binding is required.');
  const taxYear=yearValue(year||new Date().getFullYear());
  if(!taxYear) throw new RangeError('Please provide year in YYYY format.');
  const [periodRead,gifiRead,glRead,attachmentRead,statementRead,salesTaxRead,processorRead,shippingRead]=await Promise.all([
    readAccountingPeriodLocks(db,{limit:60}), readAccountingGifiNotes(db,{year:taxYear}), readAccountingGeneralLedger(db), readAccountingAttachments(db,{taxYear,limit:1}),
    readAccountingStatementImports(db,{limit:1,exceptionLimit:1}),
    readAccountingReconciliation(db,{reconciliationType:'sales_tax',periodMonth:`${taxYear}-12`,includeAllPeriods:true}),
    readAccountingReconciliation(db,{reconciliationType:'processor_fees',periodMonth:`${taxYear}-12`,includeAllPeriods:true}),
    readAccountingReconciliation(db,{reconciliationType:'shipping',periodMonth:`${taxYear}-12`,includeAllPeriods:true}),
  ]);
  const reads=[periodRead,gifiRead,glRead,attachmentRead,statementRead,salesTaxRead,processorRead,shippingRead];
  const missingTables=unique(reads.flatMap((item)=>item?.missing_tables||[]));
  const missingColumns=unique(reads.flatMap((item)=>item?.missing_columns||[]));
  const schemaReady=missingTables.length===0&&missingColumns.length===0;
  const closures=(periodRead.closures||[]).filter((row)=>String(row.period_month||'').startsWith(`${taxYear}-`));
  const gifiNotes=gifiRead.notes||[];
  const reconciliationReviews=[...(salesTaxRead.reviews||[]),...(processorRead.reviews||[]),...(shippingRead.reviews||[])].filter((row)=>String(row.period_month||'').startsWith(`${taxYear}-`));
  let attachments=[]; let yearStatementImports=[]; let reconciliationExceptions=[];
  if(attachmentRead.schema_ready===true){ attachments=rows(await db.prepare(`SELECT * FROM accounting_attachments WHERE tax_year=? ORDER BY COALESCE(document_date,created_at) DESC,accounting_attachment_id DESC LIMIT 1000`).bind(taxYear).all().catch(()=>({results:[]}))); }
  if(statementRead.schema_ready===true){
    yearStatementImports=rows(await db.prepare(`SELECT * FROM accounting_statement_imports WHERE period_month LIKE ? ORDER BY created_at DESC,accounting_statement_import_id DESC LIMIT 500`).bind(`${taxYear}-%`).all().catch(()=>({results:[]})));
    reconciliationExceptions=rows(await db.prepare(`SELECT * FROM accounting_reconciliation_exceptions WHERE period_month LIKE ? ORDER BY updated_at DESC,accounting_reconciliation_exception_id DESC LIMIT 1000`).bind(`${taxYear}-%`).all().catch(()=>({results:[]})));
  }
  const glSummary=glRead.summary||{}; const glFinalBlockers=glSummary.final_blockers||[];
  const attachmentKinds=summarizeBy(attachments,(row)=>row.attachment_kind||'other'); const attachmentStatus=summarizeBy(attachments,(row)=>row.attachment_status||'uploaded');
  const attachmentByMonth=summarizeBy(attachments,(row)=>row.period_month||(row.document_date||'').slice(0,7)||'unassigned'); const attachmentByScope=summarizeBy(attachments,(row)=>row.scope_key||'all'); const attachmentByAttachmentScope=summarizeBy(attachments,(row)=>row.attachment_scope||'other');
  const statementMetrics=attachments.filter((row)=>(row.attachment_kind||'')==='statement').reduce((acc,row)=>{ for(const key of ['statement_gross_cents','statement_fee_cents','statement_net_cents','statement_tax_cents','statement_shipping_cents','statement_txn_count']) acc[key]+=Number(row[key]||0); return acc; },{statement_gross_cents:0,statement_fee_cents:0,statement_net_cents:0,statement_tax_cents:0,statement_shipping_cents:0,statement_txn_count:0});
  const coverageMatrix={}; const attachmentGaps=[];
  for(let month=1;month<=12;month+=1){ const label=`${taxYear}-${String(month).padStart(2,'0')}`; const monthItems=attachments.filter((row)=>(row.period_month||'').startsWith(label)||(row.document_date||'').startsWith(label)); const kindCounts=summarizeBy(monthItems,(row)=>row.attachment_kind||'other'); const scopeCounts=summarizeBy(monthItems,(row)=>row.attachment_scope||'other'); coverageMatrix[label]={by_kind:kindCounts,by_scope:scopeCounts,attachment_count:monthItems.length}; if(!kindCounts.statement)attachmentGaps.push(`${label}: missing statement attachment`); if(!kindCounts.workpaper)attachmentGaps.push(`${label}: missing workpaper attachment`); if(!scopeCounts.bill_support)attachmentGaps.push(`${label}: no bill-support attachments linked`); if(!scopeCounts.receipt_support)attachmentGaps.push(`${label}: no receipt-support attachments linked`); }
  const reconciliationByType=summarizeBy(reconciliationReviews,(row)=>row.reconciliation_type||'other'); const reconciliationByStatus=summarizeBy(reconciliationReviews,(row)=>row.review_status||'draft'); const reconciliationByScope=summarizeBy(reconciliationReviews,(row)=>row.scope_key||'all');
  const reconciliationMatrix={}; for(const row of reconciliationReviews){ const month=row.period_month||'unassigned'; reconciliationMatrix[month]=reconciliationMatrix[month]||{}; reconciliationMatrix[month][row.reconciliation_type||'other']={review_status:row.review_status||'draft',statement_reference:row.statement_reference||'',difference_cents:Number(row.difference_cents||0),unresolved_item_count:Number(row.unresolved_item_count||0),attachment_count:Number(row.attachment_count||0),note:row.note||''}; }
  const importByProvider=summarizeBy(yearStatementImports,(row)=>row.provider_scope||'other'); const importByMonth=summarizeBy(yearStatementImports,(row)=>row.period_month||'unassigned'); const exceptionByType=summarizeBy(reconciliationExceptions,(row)=>row.reconciliation_type||'other'); const exceptionByStatus=summarizeBy(reconciliationExceptions,(row)=>row.exception_status||'open');
  const monthsLocked=closures.filter((row)=>row.lock_state==='locked').map((row)=>row.period_month); const openMonths=closures.filter((row)=>row.lock_state!=='locked').map((row)=>row.period_month);
  const checklist={locked_month_count:monthsLocked.length,reopened_month_count:closures.filter((row)=>row.reopened_at).length,gifi_finalized_count:gifiNotes.filter((row)=>row.review_status==='finalized').length,gifi_needs_accountant_count:gifiNotes.filter((row)=>row.review_status==='needs_accountant').length,reconciliation_finalized_count:reconciliationReviews.filter((row)=>row.review_status==='finalized').length,reconciliation_needs_accountant_count:reconciliationReviews.filter((row)=>row.review_status==='needs_accountant').length,attachment_count:attachments.length,statement_attachment_count:Number(attachmentKinds.statement||0),workpaper_attachment_count:Number(attachmentKinds.workpaper||0)};
  const recommendedMissingItems=[Number(glSummary.unmapped_count||0)>0?'Finish unmapped active GL accounts before final accountant export.':null,Number(glSummary.needs_accountant_count||0)>0?'Resolve active GL accounts still marked needs_accountant.':null,openMonths.length?`Finish lock review for open months: ${openMonths.join(', ')}`:null,Number(attachmentKinds.statement||0)===0?'Attach statements for the year-end handoff package.':null,Number(attachmentKinds.workpaper||0)===0?'Attach workpapers or close-checklists for the year-end handoff package.':null,yearStatementImports.length===0?'No statement imports were found for this tax year.':null,reconciliationExceptions.length?`Resolve reconciliation exceptions: ${reconciliationExceptions.slice(0,5).map((row)=>`${row.reconciliation_type}/${row.scope_key}`).join(', ')}`:null,attachmentGaps.length?`Attachment coverage gaps remain: ${attachmentGaps.slice(0,6).join('; ')}`:null,reconciliationReviews.some((row)=>Number(row.unresolved_item_count||0)>0)?'Reconciliation reviews still show unresolved items that should be explained or cleared.':null].filter(Boolean);
  return payload({schema_ready:schemaReady,missing_tables:missingTables,missing_columns:missingColumns,tax_year:taxYear,checklist,accountant_handoff:{gl_review_summary:{active_account_count:Number(glSummary.active_count||0),mapped_account_count:Number(glSummary.mapped_count||0),reviewed_account_count:Number(glSummary.reviewed_count||0),finalized_account_count:Number(glSummary.finalized_count||0),unmapped_account_count:Number(glSummary.unmapped_count||0),needs_accountant_count:Number(glSummary.needs_accountant_count||0)},gl_final_blockers:glFinalBlockers,attachment_summary:{total_attachment_count:attachments.length,by_kind:attachmentKinds,by_status:attachmentStatus,by_month:attachmentByMonth,by_scope:attachmentByScope,by_attachment_scope:attachmentByAttachmentScope,statement_metrics:statementMetrics,coverage_matrix:coverageMatrix,coverage_gaps:attachmentGaps},reconciliation_summary:{total_review_count:reconciliationReviews.length,by_type:reconciliationByType,by_status:reconciliationByStatus,by_scope:reconciliationByScope,matrix_by_month:reconciliationMatrix},statement_import_summary:{total_import_count:yearStatementImports.length,by_provider:importByProvider,by_month:importByMonth},statement_import_rows:yearStatementImports,exception_summary:{total_exception_count:reconciliationExceptions.length,by_type:exceptionByType,by_status:exceptionByStatus},unresolved_items_summary:reconciliationExceptions.slice(0,200),attachment_index:attachments.slice(0,500),export_bundle_v2:{formats:['json','csv','csv_pack'],includes:['gifi_summary','reconciliation_summary','statement_imports','attachment_index','unresolved_items']},recommended_missing_items:recommendedMissingItems,handoff_export_checklist:['GIFI staging CSV','Year-end close JSON bundle','CSV pack export','Attachment index','Unresolved-items summary','Statements, bills, receipts, and workpapers','Notes for unresolved differences or accountant follow-up']},months:closures,gifi_notes:gifiNotes,reconciliation_reviews:reconciliationReviews,attachments,notes:['This is a slow year-end close bundle for internal review and accountant handoff, not a final T2 filing package.','Use this alongside the GIFI staging summary, monthly exports, receipts, statements, bank downloads, and your accountant review.','Attach receipts, statements, and workpapers by expense, period, or reconciliation type so the year-end package is easier to defend and review.']});
}
