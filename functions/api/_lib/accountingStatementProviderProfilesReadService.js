export const BUILD = 333;
export const CONTRACT_ID = 'accounting-statement-provider-profiles-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_statement_provider_profiles';

export const DEFAULT_PROFILES = Object.freeze([
  { provider_scope: 'bank', display_name: 'Bank CSV', date_column: 'Date', description_column: 'Description', gross_column: 'Amount', fee_column: '', net_column: 'Amount', currency_column: '', reference_column: 'Reference', default_currency: 'CAD', notes: 'Generic Canadian bank CSV mapping. Review against each bank export.' },
  { provider_scope: 'paypal', display_name: 'PayPal Activity', date_column: 'Date', description_column: 'Name', gross_column: 'Gross', fee_column: 'Fee', net_column: 'Net', currency_column: 'Currency', reference_column: 'Transaction ID', default_currency: 'CAD', notes: 'PayPal activity export mapping for gross/fee/net reconciliation.' },
  { provider_scope: 'stripe', display_name: 'Stripe Balance Transactions', date_column: 'Created', description_column: 'Description', gross_column: 'Amount', fee_column: 'Fee', net_column: 'Net', currency_column: 'Currency', reference_column: 'id', default_currency: 'CAD', notes: 'Stripe balance transaction CSV mapping.' },
  { provider_scope: 'square', display_name: 'Square Transactions', date_column: 'Date', description_column: 'Description', gross_column: 'Gross Sales', fee_column: 'Fees', net_column: 'Net Total', currency_column: 'Currency', reference_column: 'Transaction ID', default_currency: 'CAD', notes: 'Square transaction CSV mapping.' },
  { provider_scope: 'etsy', display_name: 'Etsy Payment Account', date_column: 'Date', description_column: 'Type', gross_column: 'Amount', fee_column: 'Fees & Taxes', net_column: 'Net', currency_column: 'Currency', reference_column: 'Info', default_currency: 'CAD', notes: 'Etsy exports vary; use as a saved review starting point.' },
  { provider_scope: 'manual', display_name: 'Manual CSV', date_column: 'date', description_column: 'description', gross_column: 'gross_cents', fee_column: 'fee_cents', net_column: 'net_cents', currency_column: 'currency', reference_column: 'reference', default_currency: 'CAD', notes: 'Internal/manual import template.' },
]);
const EXPECTED_COLUMNS=Object.freeze(['accounting_statement_provider_profile_id','provider_scope','display_name','date_column','description_column','gross_column','fee_column','net_column','currency_column','reference_column','default_currency','mapping_json','notes','is_active','created_at','updated_at']);
function rows(result){ return Array.isArray(result?.results)?result.results:[]; }
async function tableExists(db,t){ try{return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(t).first());}catch{return false;} }
async function columnSet(db,t){ try{return new Set(rows(await db.prepare(`PRAGMA table_info(${t})`).all()).map(r=>String(r?.name||'').trim()).filter(Boolean));}catch{return new Set();} }
function shape(row){ let mapping={}; try{mapping=JSON.parse(row.mapping_json||'{}');}catch{mapping={};} return { accounting_statement_provider_profile_id:Number(row.accounting_statement_provider_profile_id||0), provider_scope:row.provider_scope||'', display_name:row.display_name||'', date_column:row.date_column||'', description_column:row.description_column||'', gross_column:row.gross_column||'', fee_column:row.fee_column||'', net_column:row.net_column||'', currency_column:row.currency_column||'', reference_column:row.reference_column||'', default_currency:row.default_currency||'CAD', mapping, notes:row.notes||'', is_active:Number(row.is_active||0), updated_at:row.updated_at||null }; }
function defaultShape(profile){ return { accounting_statement_provider_profile_id:0, provider_scope:profile.provider_scope, display_name:profile.display_name, date_column:profile.date_column||'', description_column:profile.description_column||'', gross_column:profile.gross_column||'', fee_column:profile.fee_column||'', net_column:profile.net_column||'', currency_column:profile.currency_column||'', reference_column:profile.reference_column||'', default_currency:profile.default_currency||'CAD', mapping:{...profile}, notes:profile.notes||'', is_active:1, updated_at:null }; }

export async function readAccountingStatementProviderProfiles(db){
  const exists=await tableExists(db,AUTHORITY_TABLE);
  const cols=exists?await columnSet(db,AUTHORITY_TABLE):new Set();
  const missingTables=exists?[]:[AUTHORITY_TABLE];
  const missingColumns=exists?EXPECTED_COLUMNS.filter(n=>!cols.has(n)).map(n=>`${AUTHORITY_TABLE}.${n}`):[];
  const schemaReady=!missingTables.length&&!missingColumns.length;
  const merged=new Map(DEFAULT_PROFILES.map(p=>[p.provider_scope,defaultShape(p)]));
  if(schemaReady){
    const stored=rows(await db.prepare(`SELECT * FROM accounting_statement_provider_profiles ORDER BY is_active DESC, provider_scope ASC`).all().catch(()=>({results:[]}))).map(shape);
    for(const profile of stored) merged.set(profile.provider_scope,profile);
  }
  const profiles=Array.from(merged.values()).sort((a,b)=>(b.is_active-a.is_active)||a.provider_scope.localeCompare(b.provider_scope));
  return { ok:true, build:BUILD, contract:CONTRACT_ID, owner:OWNER, mode:'read-only-accounting-statement-provider-profiles', authority_table:AUTHORITY_TABLE, schema_ready:schemaReady, missing_tables:missingTables, missing_columns:missingColumns, request_time_schema_mutation:false, profiles, count:profiles.length, default_profile_count:DEFAULT_PROFILES.length, defaults_materialized:false, source:schemaReady?'stored-plus-in-memory-defaults':'in-memory-defaults' };
}
