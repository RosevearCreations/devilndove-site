export const BUILD = 332;
export const CONTRACT_ID = 'accounting-recurring-expense-rules-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_recurring_expense_rules';

const EXPECTED_COLUMNS = Object.freeze(['recurring_expense_rule_id','vendor_id','vendor_name','rule_name','ledger_code','ledger_name','amount','tax_amount','frequency','due_day','next_due_date','auto_create_mode','notes','is_active','last_generated_at','last_generated_expense_id','created_by_user_id','updated_by_user_id','created_at','updated_at']);
function rows(result){ return Array.isArray(result?.results) ? result.results : []; }
async function tableExists(db, tableName){ try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first()); } catch { return false; } }
async function columnSet(db, tableName){ try { return new Set(rows(await db.prepare(`PRAGMA table_info(${tableName})`).all()).map(r=>String(r?.name||'').trim()).filter(Boolean)); } catch { return new Set(); } }
function cleanFrequency(value){ const raw=String(value||'').trim().toLowerCase(); return ['monthly','quarterly','yearly','manual'].includes(raw)?raw:'monthly'; }
function cleanAutoCreateMode(value){ const raw=String(value||'').trim().toLowerCase(); return ['manual','draft_expense'].includes(raw)?raw:'manual'; }
function shape(row){ return { recurring_expense_rule_id:Number(row.recurring_expense_rule_id||0), vendor_id:row.vendor_id==null?null:Number(row.vendor_id||0), vendor_name:row.vendor_name||'', rule_name:row.rule_name||'', ledger_code:row.ledger_code||'', ledger_name:row.ledger_name||'', amount:Number(row.amount||0), tax_amount:Number(row.tax_amount||0), frequency:cleanFrequency(row.frequency), due_day:row.due_day==null?null:Number(row.due_day||0), next_due_date:row.next_due_date||null, auto_create_mode:cleanAutoCreateMode(row.auto_create_mode), notes:row.notes||'', is_active:Number(row.is_active||0)===1?1:0, last_generated_at:row.last_generated_at||null, last_generated_expense_id:row.last_generated_expense_id==null?null:Number(row.last_generated_expense_id||0), created_by_user_id:row.created_by_user_id==null?null:Number(row.created_by_user_id||0), updated_by_user_id:row.updated_by_user_id==null?null:Number(row.updated_by_user_id||0), created_at:row.created_at||null, updated_at:row.updated_at||null }; }

export async function readAccountingRecurringExpenseRules(db,{includeInactive=false}={}){
  const exists=await tableExists(db,AUTHORITY_TABLE);
  const cols=exists?await columnSet(db,AUTHORITY_TABLE):new Set();
  const missingTables=exists?[]:[AUTHORITY_TABLE];
  const missingColumns=exists?EXPECTED_COLUMNS.filter(n=>!cols.has(n)).map(n=>`${AUTHORITY_TABLE}.${n}`):[];
  const schemaReady=!missingTables.length&&!missingColumns.length;
  let rules=[];
  if(schemaReady){
    const result=await db.prepare(`SELECT recurring_expense_rule_id, vendor_id, vendor_name, rule_name, ledger_code, ledger_name, amount, tax_amount, frequency, due_day, next_due_date, auto_create_mode, notes, is_active, last_generated_at, last_generated_expense_id, created_by_user_id, updated_by_user_id, created_at, updated_at FROM accounting_recurring_expense_rules ORDER BY is_active DESC, COALESCE(next_due_date,'9999-12-31') ASC, rule_name ASC`).all().catch(()=>({results:[]}));
    rules=rows(result).map(shape).filter(row=>includeInactive||row.is_active===1);
  }
  const today=new Date().toISOString().slice(0,10);
  const dueRules=rules.filter(row=>row.is_active===1&&row.next_due_date&&row.next_due_date<=today);
  return { ok:true, build:BUILD, contract:CONTRACT_ID, owner:OWNER, mode:'read-only-accounting-recurring-expense-rules', authority_table:AUTHORITY_TABLE, schema_ready:schemaReady, missing_tables:missingTables, missing_columns:missingColumns, request_time_schema_mutation:false, rules, count:rules.length, due_rules:dueRules, summary:{ rule_count:rules.length, active_rule_count:rules.filter(r=>r.is_active===1).length, due_rule_count:dueRules.length, monthly_rule_count:rules.filter(r=>r.frequency==='monthly').length } };
}
