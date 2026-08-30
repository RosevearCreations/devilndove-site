import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { createStatementImportFromCsv, ensureAccountingStatementImportsTables } from './_accountingStatementImports.js';
import { readAccountingStatementImports } from '../_lib/accountingStatementImportsReadService.js';

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