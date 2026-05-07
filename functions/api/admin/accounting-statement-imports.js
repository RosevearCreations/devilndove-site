import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { createStatementImportFromCsv, ensureAccountingStatementImportsTables, listAccountingReconciliationExceptions, listAccountingStatementImports } from './_accountingStatementImports.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function listImportRows(db, importId, limit = 200) {
  const result = await db.prepare(`SELECT accounting_statement_import_row_id, accounting_statement_import_id, provider_scope, txn_date, txn_type, description, reference_number, gross_cents, fee_cents, net_cents, tax_cents, shipping_cents, debit_cents, credit_cents, running_balance_cents, raw_json, matched_scope_key, created_at FROM accounting_statement_import_rows WHERE accounting_statement_import_id = ? ORDER BY COALESCE(txn_date, created_at) ASC, accounting_statement_import_row_id ASC LIMIT ?`).bind(Number(importId || 0), Math.max(1, Math.min(1000, Number(limit || 200) || 200))).all().catch(() => ({ results: [] }));
  return rows(result).map((row) => ({ ...row, accounting_statement_import_row_id: Number(row.accounting_statement_import_row_id || 0), accounting_statement_import_id: Number(row.accounting_statement_import_id || 0), gross_cents: Number(row.gross_cents || 0), fee_cents: Number(row.fee_cents || 0), net_cents: Number(row.net_cents || 0), tax_cents: Number(row.tax_cents || 0), shipping_cents: Number(row.shipping_cents || 0), debit_cents: Number(row.debit_cents || 0), credit_cents: Number(row.credit_cents || 0), running_balance_cents: Number(row.running_balance_cents || 0) }));
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingStatementImportsTables(db);
  const url = new URL(context.request.url);
  const importId = Number(url.searchParams.get('accounting_statement_import_id') || 0);
  if (importId > 0) {
    const rowsForImport = await listImportRows(db, importId, Number(url.searchParams.get('limit') || 250));
    return jsonResponse({ ok: true, rows: rowsForImport, accounting_statement_import_id: importId });
  }
  const imports = await listAccountingStatementImports(db, { providerScope: url.searchParams.get('provider_scope') || '', periodMonth: url.searchParams.get('period_month') || '', limit: Number(url.searchParams.get('limit') || 50) });
  const exceptions = await listAccountingReconciliationExceptions(db, { periodMonth: url.searchParams.get('period_month') || '', status: url.searchParams.get('status') || '', limit: Number(url.searchParams.get('exception_limit') || 100) });
  return jsonResponse({ ok: true, imports, exceptions, summary: { import_count: imports.length, exception_count: exceptions.length } });
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
  const imported = await createStatementImportFromCsv(db, {
    providerScope,
    sourceFilename: String(file.name || form.get('source_filename') || '').trim(),
    csvText,
    statementReference: String(form.get('statement_reference') || '').trim(),
    periodMonth: String(form.get('period_month') || '').trim(),
    currency: String(form.get('currency') || 'CAD').trim().toUpperCase(),
    createdByUserId: Number(adminUser.user_id || 0),
  });

  await auditAdminAction(env, request, adminUser, {
    action_type: 'import_accounting_statement_csv',
    target_type: 'accounting_statement_import',
    target_id: Number(imported.statementImport.accounting_statement_import_id || 0),
    target_key: imported.statementImport.statement_reference || imported.statementImport.source_filename || providerScope,
    details: {
      provider_scope: imported.statementImport.provider_scope,
      period_month: imported.statementImport.period_month,
      row_count: imported.statementImport.row_count,
      gross_cents: imported.statementImport.gross_cents,
      fee_cents: imported.statementImport.fee_cents,
      tax_cents: imported.statementImport.tax_cents,
      shipping_cents: imported.statementImport.shipping_cents,
      auto_match_count: imported.matches.length,
    }
  });

  return jsonResponse({ ok: true, import: imported.statementImport, summary: imported.summary, matches: imported.matches });
}
