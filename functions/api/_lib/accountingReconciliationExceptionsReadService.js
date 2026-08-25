export const BUILD = 335;
export const CONTRACT_ID = 'accounting-reconciliation-exceptions-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_reconciliation_exceptions';

const REQUIRED_COLUMNS=Object.freeze(['accounting_reconciliation_exception_id','reconciliation_type','period_month','scope_key','provider_scope','exception_status','severity','reference_label','statement_amount_cents','book_amount_cents','difference_cents','tolerance_cents','notes','assigned_to_user_id','accountant_review_flag','resolved_by_user_id','resolved_at','reopened_by_user_id','reopened_at','detail_json','source_import_id','created_at','updated_at']);
function rows(result){ return Array.isArray(result?.results)?result.results:[]; }
function text(value){ return String(value??'').trim(); }
function bounded(value){ const n=Number(value); return Math.max(1,Math.min(500,Number.isFinite(n)?Math.trunc(n):200)); }
async function tableExists(db){ try{return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(AUTHORITY_TABLE).first());}catch{return false;} }
async function columnSet(db){ try{return new Set(rows(await db.prepare(`PRAGMA table_info(${AUTHORITY_TABLE})`).all()).map(r=>text(r?.name)).filter(Boolean));}catch{return new Set();} }
function shape(row){ return {...row, accounting_reconciliation_exception_id:Number(row.accounting_reconciliation_exception_id||0), statement_amount_cents:Number(row.statement_amount_cents||0), book_amount_cents:Number(row.book_amount_cents||0), difference_cents:Number(row.difference_cents||0), tolerance_cents:Number(row.tolerance_cents||0), accountant_review_flag:Number(row.accountant_review_flag||0), source_import_id:row.source_import_id==null?null:Number(row.source_import_id||0)}; }
function payload(extra={}){ return {ok:true,build:BUILD,contract:CONTRACT_ID,owner:OWNER,mode:'read-only-accounting-reconciliation-exceptions',authority_table:AUTHORITY_TABLE,request_time_schema_mutation:false,...extra}; }

export async function readAccountingReconciliationExceptions(db,options={}){
  if(!db) throw new TypeError('A D1 database binding is required.');
  if(!(await tableExists(db))) return payload({schema_ready:false,missing_tables:[AUTHORITY_TABLE],missing_columns:[],exceptions:[],count:0,summary:{open_count:0,total_count:0}});
  const cols=await columnSet(db);
  const missingColumns=REQUIRED_COLUMNS.filter(name=>!cols.has(name)).map(name=>`${AUTHORITY_TABLE}.${name}`);
  if(missingColumns.length) return payload({schema_ready:false,missing_tables:[],missing_columns:missingColumns,exceptions:[],count:0,summary:{open_count:0,total_count:0}});
  const reconciliationType=text(options.reconciliationType), periodMonth=text(options.periodMonth), status=text(options.status);
  const result=await db.prepare(`SELECT accounting_reconciliation_exception_id, reconciliation_type, period_month, scope_key, provider_scope, exception_status, severity, reference_label, statement_amount_cents, book_amount_cents, difference_cents, tolerance_cents, notes, assigned_to_user_id, accountant_review_flag, resolved_by_user_id, resolved_at, reopened_by_user_id, reopened_at, detail_json, source_import_id, created_at, updated_at FROM accounting_reconciliation_exceptions WHERE (? = '' OR reconciliation_type = ?) AND (? = '' OR period_month = ?) AND (? = '' OR exception_status = ?) ORDER BY updated_at DESC, accounting_reconciliation_exception_id DESC LIMIT ?`).bind(reconciliationType,reconciliationType,periodMonth,periodMonth,status,status,bounded(options.limit)).all();
  const exceptions=rows(result).map(shape);
  return payload({schema_ready:true,missing_tables:[],missing_columns:[],exceptions,count:exceptions.length,summary:{open_count:exceptions.filter(row=>row.exception_status==='open').length,total_count:exceptions.length}});
}
