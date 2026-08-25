import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { createStatementImportFromCsv, ensureAccountingStatementImportsTables } from './_accountingStatementImports.js';
import { readAccountingStatementImports } from '../_lib/accountingStatementImportsReadService.js';

const DEFAULT_PROVIDER_PROFILES = [
  { provider_scope: 'bank', display_name: 'Bank CSV', date_column: 'Date', description_column: 'Description', gross_column: 'Amount', fee_column: '', net_column: 'Amount', currency_column: '', reference_column: 'Reference', default_currency: 'CAD', notes: 'Generic Canadian bank CSV mapping.' },
  { provider_scope: 'paypal', display_name: 'PayPal Activity', date_column: 'Date', description_column: 'Name', gross_column: 'Gross', fee_column: 'Fee', net_column: 'Net', currency_column: 'Currency', reference_column: 'Transaction ID', default_currency: 'CAD', notes: 'PayPal gross/fee/net reconciliation.' },
  { provider_scope: 'stripe', display_name: 'Stripe Balance Transactions', date_column: 'Created', description_column: 'Description', gross_column: 'Amount', fee_column: 'Fee', net_column: 'Net', currency_column: 'Currency', reference_column: 'id', default_currency: 'CAD', notes: 'Stripe balance transaction export.' },
  { provider_scope: 'square', display_name: 'Square Transactions', date_column: 'Date', description_column: 'Description', gross_column: 'Gross Sales', fee_column: 'Fees', net_column: 'Net Total', currency_column: 'Currency', reference_column: 'Transaction ID', default_currency: 'CAD', notes: 'Square transaction CSV mapping.' },
  { provider_scope: 'etsy', display_name: 'Etsy Payment Account', date_column: 'Date', description_column: 'Type', gross_column: 'Amount', fee_column: 'Fees & Taxes', net_column: 'Net', currency_column: 'Currency', reference_column: 'Info', default_currency: 'CAD', notes: 'Etsy exports vary; review each file.' },
  { provider_scope: 'manual', display_name: 'Manual CSV', date_column: 'date', description_column: 'description', gross_column: 'gross_cents', fee_column: 'fee_cents', net_column: 'net_cents', currency_column: 'currency', reference_column: 'reference', default_currency: 'CAD', notes: 'Internal/manual import template.' },
];
async function ensureStatementProviderProfilesTable(db){ await db.prepare(`CREATE TABLE IF NOT EXISTS accounting_statement_provider_profiles (accounting_statement_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,provider_scope TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,date_column TEXT,description_column TEXT,gross_column TEXT,fee_column TEXT,net_column TEXT,currency_column TEXT,reference_column TEXT,default_currency TEXT NOT NULL DEFAULT 'CAD',mapping_json TEXT,notes TEXT,is_active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run().catch(()=>null); }
async function seedProviderProfileDefaults(db){ await ensureStatementProviderProfilesTable(db); for(const profile of DEFAULT_PROVIDER_PROFILES){ await db.prepare(`INSERT OR IGNORE INTO accounting_statement_provider_profiles (provider_scope,display_name,date_column,description_column,gross_column,fee_column,net_column,currency_column,reference_column,default_currency,mapping_json,notes,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(profile.provider_scope,profile.display_name,profile.date_column||null,profile.description_column||null,profile.gross_column||null,profile.fee_column||null,profile.net_column||null,profile.currency_column||null,profile.reference_column||null,profile.default_currency||'CAD',JSON.stringify(profile),profile.notes||null).run().catch(()=>null); } }

export async function onRequestGet(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env); if(!adminUser) return jsonResponse({ok:false,error:'Admin access required.'},401);
  const db=getDb(context.env); if(!db) return jsonResponse({ok:false,error:'Database binding is not configured.'},500);
  const url=new URL(context.request.url);
  try{return jsonResponse(await readAccountingStatementImports(db,{importId:Number(url.searchParams.get('accounting_statement_import_id')||0),providerScope:url.searchParams.get('provider_scope')||'',periodMonth:url.searchParams.get('period_month')||'',status:url.searchParams.get('status')||'',limit:Number(url.searchParams.get('limit')||50),exceptionLimit:Number(url.searchParams.get('exception_limit')||100)}));}
  catch(error){return jsonResponse({ok:false,build:334,contract:'accounting-statement-imports-read',owner:'accounting',error:error?.message||'Failed to read Accounting statement imports.'},500);}
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingStatementImportsTables(db);
  await seedProviderProfileDefaults(db);
  let form;
  try { form = await request.formData(); } catch { return jsonResponse({ ok: false, error: 'Expected multipart/form-data.' }, 400); }
  const file = form.get('file');
  if (!file || typeof file.text !== 'function') return jsonResponse({ ok: false, error: 'CSV file is required.' }, 400);
  const providerScope = String(form.get('provider_scope') || '').trim().toLowerCase();
  if (!providerScope) return jsonResponse({ ok: false, error: 'provider_scope is required.' }, 400);
  const csvText = await file.text();
  const imported = await createStatementImportFromCsv(db, { providerScope, sourceFilename: String(file.name || form.get('source_filename') || '').trim(), csvText, statementReference: String(form.get('statement_reference') || '').trim(), periodMonth: String(form.get('period_month') || '').trim(), currency: String(form.get('currency') || 'CAD').trim().toUpperCase(), createdByUserId: Number(adminUser.user_id || 0) });
  await auditAdminAction(env, request, adminUser, { action_type: 'import_accounting_statement_csv', target_type: 'accounting_statement_import', target_id: Number(imported.statementImport.accounting_statement_import_id || 0), target_key: imported.statementImport.statement_reference || imported.statementImport.source_filename || providerScope, details: { provider_scope: imported.statementImport.provider_scope, period_month: imported.statementImport.period_month, row_count: imported.statementImport.row_count, gross_cents: imported.statementImport.gross_cents, fee_cents: imported.statementImport.fee_cents, tax_cents: imported.statementImport.tax_cents, shipping_cents: imported.statementImport.shipping_cents, auto_match_count: imported.matches.length } });
  return jsonResponse({ ok: true, import: imported.statementImport, summary: imported.summary, matches: imported.matches });
}
