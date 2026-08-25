import { readAccountingStatementProviderProfiles } from './accountingStatementProviderProfilesReadService.js';

export const BUILD = 334;
export const CONTRACT_ID = 'accounting-statement-imports-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze([
  'accounting_statement_imports',
  'accounting_statement_import_rows',
  'accounting_reconciliation_exceptions',
  'accounting_statement_provider_profiles',
]);

const IMPORT_COLUMNS = Object.freeze(['accounting_statement_import_id','provider_scope','import_status','source_filename','source_format','period_month','period_start','period_end','currency','row_count','gross_cents','fee_cents','net_cents','tax_cents','shipping_cents','deposit_cents','withdrawal_cents','txn_count','statement_reference','detail_json','created_by_user_id','created_at','updated_at']);
const ROW_COLUMNS = Object.freeze(['accounting_statement_import_row_id','accounting_statement_import_id','provider_scope','txn_date','txn_type','description','reference_number','gross_cents','fee_cents','net_cents','tax_cents','shipping_cents','debit_cents','credit_cents','running_balance_cents','raw_json','matched_scope_key','created_at']);
const EXCEPTION_COLUMNS = Object.freeze(['accounting_reconciliation_exception_id','reconciliation_type','period_month','scope_key','provider_scope','exception_status','severity','reference_label','statement_amount_cents','book_amount_cents','difference_cents','tolerance_cents','notes','assigned_to_user_id','accountant_review_flag','resolved_by_user_id','resolved_at','reopened_by_user_id','reopened_at','detail_json','source_import_id','created_at','updated_at']);

function rows(result){ return Array.isArray(result?.results) ? result.results : []; }
function text(value){ return String(value ?? '').trim(); }
function bounded(value,fallback,min,max){ const n=Number(value); return Math.max(min,Math.min(max,Number.isFinite(n)?Math.trunc(n):fallback)); }
function providerFilter(value){ const raw=text(value).toLowerCase(); if(!raw) return ''; return ['bank','paypal','stripe','etsy','square','manual','other'].includes(raw)?raw:'other'; }
async function tableExists(db,table){ try{return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(table).first());}catch{return false;} }
async function columnSet(db,table){ try{return new Set(rows(await db.prepare(`PRAGMA table_info(${table})`).all()).map(r=>text(r?.name)).filter(Boolean));}catch{return new Set();} }
async function inspect(db,table,required){ const exists=await tableExists(db,table); if(!exists) return {exists:false,missingTables:[table],missingColumns:[]}; const cols=await columnSet(db,table); return {exists:true,missingTables:[],missingColumns:required.filter(name=>!cols.has(name)).map(name=>`${table}.${name}`)}; }
function importRow(row){ return {...row, accounting_statement_import_id:Number(row.accounting_statement_import_id||0), row_count:Number(row.row_count||0), gross_cents:Number(row.gross_cents||0), fee_cents:Number(row.fee_cents||0), net_cents:Number(row.net_cents||0), tax_cents:Number(row.tax_cents||0), shipping_cents:Number(row.shipping_cents||0), deposit_cents:Number(row.deposit_cents||0), withdrawal_cents:Number(row.withdrawal_cents||0), txn_count:Number(row.txn_count||0)}; }
function detailRow(row){ return {...row, accounting_statement_import_row_id:Number(row.accounting_statement_import_row_id||0), accounting_statement_import_id:Number(row.accounting_statement_import_id||0), gross_cents:Number(row.gross_cents||0), fee_cents:Number(row.fee_cents||0), net_cents:Number(row.net_cents||0), tax_cents:Number(row.tax_cents||0), shipping_cents:Number(row.shipping_cents||0), debit_cents:Number(row.debit_cents||0), credit_cents:Number(row.credit_cents||0), running_balance_cents:Number(row.running_balance_cents||0)}; }
function exceptionRow(row){ return {...row, accounting_reconciliation_exception_id:Number(row.accounting_reconciliation_exception_id||0), statement_amount_cents:Number(row.statement_amount_cents||0), book_amount_cents:Number(row.book_amount_cents||0), difference_cents:Number(row.difference_cents||0), tolerance_cents:Number(row.tolerance_cents||0), accountant_review_flag:Number(row.accountant_review_flag||0), source_import_id:row.source_import_id==null?null:Number(row.source_import_id||0)}; }
function payload(extra={}){ return {ok:true,build:BUILD,contract:CONTRACT_ID,owner:OWNER,mode:'read-only-accounting-statement-imports',authority_tables:AUTHORITY_TABLES,request_time_schema_mutation:false,...extra}; }

export async function readAccountingStatementImports(db, options={}){
  if(!db) throw new TypeError('A D1 database binding is required.');
  const importId=Number(options.importId||options.accountingStatementImportId||0);
  if(importId>0){
    const state=await inspect(db,'accounting_statement_import_rows',ROW_COLUMNS);
    const missingTables=[...state.missingTables], missingColumns=[...state.missingColumns];
    if(missingTables.length||missingColumns.length) return payload({schema_ready:false,missing_tables:missingTables,missing_columns:missingColumns,rows:[],count:0,accounting_statement_import_id:importId});
    const result=await db.prepare(`SELECT accounting_statement_import_row_id, accounting_statement_import_id, provider_scope, txn_date, txn_type, description, reference_number, gross_cents, fee_cents, net_cents, tax_cents, shipping_cents, debit_cents, credit_cents, running_balance_cents, raw_json, matched_scope_key, created_at FROM accounting_statement_import_rows WHERE accounting_statement_import_id = ? ORDER BY COALESCE(txn_date, created_at) ASC, accounting_statement_import_row_id ASC LIMIT ?`).bind(importId,bounded(options.limit,250,1,1000)).all();
    const detailRows=rows(result).map(detailRow);
    return payload({schema_ready:true,missing_tables:[],missing_columns:[],rows:detailRows,count:detailRows.length,accounting_statement_import_id:importId});
  }

  const [importsState,exceptionsState,profilesRead]=await Promise.all([
    inspect(db,'accounting_statement_imports',IMPORT_COLUMNS),
    inspect(db,'accounting_reconciliation_exceptions',EXCEPTION_COLUMNS),
    readAccountingStatementProviderProfiles(db),
  ]);
  const missingTables=[...importsState.missingTables,...exceptionsState.missingTables,...(profilesRead.missing_tables||[])];
  const missingColumns=[...importsState.missingColumns,...exceptionsState.missingColumns,...(profilesRead.missing_columns||[])];
  const schemaReady=!missingTables.length&&!missingColumns.length;
  let imports=[], exceptions=[];
  if(importsState.exists&&!importsState.missingColumns.length){
    const provider=providerFilter(options.providerScope), month=text(options.periodMonth);
    imports=rows(await db.prepare(`SELECT accounting_statement_import_id, provider_scope, import_status, source_filename, source_format, period_month, period_start, period_end, currency, row_count, gross_cents, fee_cents, net_cents, tax_cents, shipping_cents, deposit_cents, withdrawal_cents, txn_count, statement_reference, detail_json, created_by_user_id, created_at, updated_at FROM accounting_statement_imports WHERE (? = '' OR provider_scope = ?) AND (? = '' OR period_month = ?) ORDER BY created_at DESC, accounting_statement_import_id DESC LIMIT ?`).bind(provider,provider,month,month,bounded(options.limit,50,1,200)).all()).map(importRow);
  }
  if(exceptionsState.exists&&!exceptionsState.missingColumns.length){
    const month=text(options.periodMonth), status=text(options.status);
    exceptions=rows(await db.prepare(`SELECT accounting_reconciliation_exception_id, reconciliation_type, period_month, scope_key, provider_scope, exception_status, severity, reference_label, statement_amount_cents, book_amount_cents, difference_cents, tolerance_cents, notes, assigned_to_user_id, accountant_review_flag, resolved_by_user_id, resolved_at, reopened_by_user_id, reopened_at, detail_json, source_import_id, created_at, updated_at FROM accounting_reconciliation_exceptions WHERE (? = '' OR period_month = ?) AND (? = '' OR exception_status = ?) ORDER BY updated_at DESC, accounting_reconciliation_exception_id DESC LIMIT ?`).bind(month,month,status,status,bounded(options.exceptionLimit,100,1,500)).all()).map(exceptionRow);
  }
  const profiles=profilesRead.profiles||[];
  return payload({schema_ready:schemaReady,missing_tables:missingTables,missing_columns:missingColumns,imports,exceptions,provider_profiles:profiles,count:imports.length,summary:{import_count:imports.length,exception_count:exceptions.length,provider_profile_count:profiles.length},provider_profile_defaults_materialized:profilesRead.defaults_materialized===true});
}
