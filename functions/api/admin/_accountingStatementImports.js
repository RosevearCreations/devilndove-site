import { normalizeText } from '../_lib/adminAudit.js';
import { cleanPeriodMonth, ensureAccountingReconciliationReviewsTable } from './_accountingReconciliation.js';
import { ensureAccountingAttachmentsTable } from './_accountingAttachments.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableIndexes(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function cleanStatementProvider(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['bank', 'paypal', 'stripe', 'etsy', 'square', 'manual', 'other'].includes(raw) ? raw : 'other';
}

export function cleanStatementImportStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['imported', 'matched', 'needs_review', 'archived'].includes(raw) ? raw : 'imported';
}

export async function ensureAccountingStatementImportsTables(db) {
  const tableRequirements = [
    {
      table: 'accounting_statement_imports',
      columns: [
        'accounting_statement_import_id', 'provider_scope', 'import_status', 'source_filename', 'source_format',
        'period_month', 'period_start', 'period_end', 'currency', 'row_count', 'gross_cents', 'fee_cents', 'net_cents',
        'tax_cents', 'shipping_cents', 'deposit_cents', 'withdrawal_cents', 'txn_count', 'statement_reference',
        'detail_json', 'created_by_user_id', 'created_at', 'updated_at'
      ],
      indexes: ['idx_accounting_statement_imports_period'],
    },
    {
      table: 'accounting_statement_import_rows',
      columns: [
        'accounting_statement_import_row_id', 'accounting_statement_import_id', 'provider_scope', 'txn_date', 'txn_type',
        'description', 'reference_number', 'gross_cents', 'fee_cents', 'net_cents', 'tax_cents', 'shipping_cents',
        'debit_cents', 'credit_cents', 'running_balance_cents', 'raw_json', 'matched_scope_key', 'created_at'
      ],
      indexes: ['idx_accounting_statement_import_rows_import', 'idx_accounting_statement_import_rows_provider_ref'],
    },
    {
      table: 'accounting_reconciliation_exceptions',
      columns: [
        'accounting_reconciliation_exception_id', 'reconciliation_type', 'period_month', 'scope_key', 'provider_scope',
        'exception_status', 'severity', 'reference_label', 'statement_amount_cents', 'book_amount_cents', 'difference_cents',
        'tolerance_cents', 'notes', 'assigned_to_user_id', 'accountant_review_flag', 'resolved_by_user_id', 'resolved_at',
        'reopened_by_user_id', 'reopened_at', 'detail_json', 'source_import_id', 'created_at', 'updated_at'
      ],
      indexes: ['idx_accounting_reconciliation_exceptions_period', 'idx_accounting_reconciliation_exceptions_queue'],
    },
  ];

  for (const requirement of tableRequirements) {
    const columns = await tableColumns(db, requirement.table);
    const missingColumns = requirement.columns.filter((name) => !columns.has(name));
    if (missingColumns.length) {
      throw new Error(`Accounting statement import schema is not ready: ${requirement.table} is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
    }
    const indexes = await tableIndexes(db, requirement.table);
    const missingIndexes = requirement.indexes.filter((name) => !indexes.has(name));
    if (missingIndexes.length) {
      throw new Error(`Accounting statement import schema is not ready: ${requirement.table} is missing index ${missingIndexes.join(', ')}. Apply the current Development migration authority.`);
    }
  }
  return true;
}

const HEADER_ALIASES = new Map([
  ['created utc', 'created'],
  ['created (utc)', 'created'],
  ['created date', 'created'],
  ['date/time', 'date'],
  ['posted date', 'date'],
  ['processed date', 'date'],
  ['transaction date', 'transaction date'],
  ['transaction id', 'transaction id'],
  ['transaction number', 'transaction id'],
  ['source id', 'source id'],
  ['payment id', 'payment id'],
  ['payout id', 'payout id'],
  ['order number', 'order id'],
  ['orderid', 'order id'],
  ['activity type', 'activity type'],
  ['reporting category', 'reporting category'],
  ['balance impact', 'balance impact'],
  ['item title', 'item name'],
  ['item total', 'item total'],
  ['customer facing amount', 'customer facing amount'],
  ['net amount', 'net amount'],
  ['payout amount', 'payout amount'],
  ['net deposit', 'net deposit'],
  ['processing fee', 'processing fee'],
  ['transaction fee', 'transaction fee'],
  ['platform fee', 'platform fee'],
  ['fees & taxes', 'fees taxes'],
  ['fees and taxes', 'fees taxes'],
  ['sales tax', 'sales tax'],
  ['tax collected', 'tax collected'],
  ['tax amount', 'tax amount'],
  ['shipping amount', 'shipping amount'],
  ['shipping revenue', 'shipping revenue'],
  ['postage amount', 'postage'],
  ['money in', 'money in'],
  ['money out', 'money out'],
  ['running balance', 'running balance'],
  ['ending balance', 'running balance'],
]);

function normalizeHeader(header) {
  const normalized = normalizeText(header)
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\s_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const simple = normalized.replace(/[^a-z0-9 ()/&.]/g, '').trim();
  return HEADER_ALIASES.get(simple) || simple;
}

function countDelimiter(line, delimiter) {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') i += 1;
      else inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }
  return count;
}

function detectDelimiter(headerLine) {
  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;
  for (const candidate of candidates) {
    const sep = candidate === '\t' ? '\t' : candidate;
    const count = countDelimiter(headerLine, sep);
    if (count > bestCount) {
      best = sep;
      bestCount = count;
    }
  }
  return best;
}

export function splitCsvLine(line, delimiter = ',') {
  const values = [];
  let current = '';
  let inQuotes = false;
  const sep = delimiter || ',';
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map((value) => String(value || '').trim());
}

export function parseCsv(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((line) => String(line || '').trim());
  if (!lines.length) return { headers: [], rows: [], delimiter: ',' };
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((header) => normalizeHeader(header));
  const out = [];
  for (const line of lines.slice(1)) {
    const parts = splitCsvLine(line, delimiter);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = parts[idx] == null ? '' : String(parts[idx]);
    });
    out.push(row);
  }
  return { headers, rows: out, delimiter };
}

function parseMoneyToCents(value) {
  const original = String(value ?? '').trim();
  if (!original) return 0;
  const negative = /\([^)]*\)/.test(original) || /^\s*-/.test(original) || /\bdebit\b/i.test(original);
  const cleaned = original
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/[A-Z]{3}/gi, '')
    .replace(/[$€£¥,\s]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  const cents = Math.round(Math.abs(num) * 100);
  return negative || num < 0 ? -cents : cents;
}

function firstValue(row, names = []) {
  for (const name of names) {
    const value = row[name];
    if (value != null && String(value).trim() !== '') return String(value);
  }
  return '';
}

function cleanDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) return raw.replaceAll('/', '-');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [m, d, y] = raw.split('/');
    return `${y}-${m}-${d}`;
  }
  const parsed = new Date(raw);
  if (Number.isFinite(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

function reconciliationConfidence(statementCents, bookCents, toleranceCents) {
  const statement = Number(statementCents || 0);
  const book = Number(bookCents || 0);
  const tolerance = Math.max(0, Number(toleranceCents || 0));
  const difference = statement - book;
  const absDifference = Math.abs(difference);
  if (absDifference === 0) {
    return { difference_cents: difference, match_confidence: 1, match_bucket: 'exact', unresolved_item_count: 0, review_status: 'reviewed', severity: 'info' };
  }
  if (absDifference <= tolerance) {
    return { difference_cents: difference, match_confidence: 0.9, match_bucket: 'likely', unresolved_item_count: 0, review_status: 'reviewed', severity: 'info' };
  }
  if (absDifference <= Math.max(tolerance * 3, 1000)) {
    return { difference_cents: difference, match_confidence: 0.55, match_bucket: 'partial', unresolved_item_count: 1, review_status: 'needs_accountant', severity: 'warning' };
  }
  return { difference_cents: difference, match_confidence: 0.2, match_bucket: 'manual_review', unresolved_item_count: 1, review_status: 'needs_accountant', severity: 'critical' };
}

function summarizeImportRows(provider, parsedRows) {
  const normalizedProvider = cleanStatementProvider(provider);
  const rowsOut = [];
  let grossCents = 0;
  let feeCents = 0;
  let netCents = 0;
  let taxCents = 0;
  let shippingCents = 0;
  let debitCents = 0;
  let creditCents = 0;
  let txnCount = 0;
  let periodStart = '';
  let periodEnd = '';

  for (const row of parsedRows) {
    const txnDate = cleanDate(firstValue(row, ['date', 'transaction date', 'created', 'available on', 'payout date', 'posted date', 'processed date']));
    const txnType = firstValue(row, ['type', 'transaction type', 'balance impact', 'activity type', 'reporting category', 'record type']).toLowerCase();
    const description = firstValue(row, ['description', 'name', 'details', 'memo', 'item name', 'title', 'info', 'note']);
    const referenceNumber = firstValue(row, ['id', 'transaction id', 'reference', 'order id', 'payout id', 'source id', 'payment id', 'invoice id']);
    const gross = parseMoneyToCents(firstValue(row, ['gross', 'amount', 'total', 'sale amount', 'item total', 'customer facing amount', 'payments', 'paid']));
    const fee = parseMoneyToCents(firstValue(row, ['fee', 'fees', 'processing fee', 'transaction fee', 'platform fee', 'fees taxes']));
    const net = parseMoneyToCents(firstValue(row, ['net', 'net amount', 'payout amount', 'net deposit', 'payment amount', 'balance impact']));
    const tax = parseMoneyToCents(firstValue(row, ['tax', 'sales tax', 'vat', 'gst', 'hst', 'tax collected', 'tax amount']));
    const shipping = parseMoneyToCents(firstValue(row, ['shipping', 'shipping amount', 'postage', 'shipping revenue', 'delivery']));
    const debit = Math.abs(parseMoneyToCents(firstValue(row, ['debit', 'withdrawal', 'money out', 'charge', 'spent'])));
    const credit = Math.abs(parseMoneyToCents(firstValue(row, ['credit', 'deposit', 'money in', 'received', 'income'])));
    const runningBalance = parseMoneyToCents(firstValue(row, ['balance', 'running balance']));
    const displayAmount = gross || (credit - debit);
    const derivedDebit = debit || (displayAmount < 0 ? Math.abs(displayAmount) : 0);
    const derivedCredit = credit || (displayAmount > 0 ? Math.abs(displayAmount) : 0);
    const fallbackNet = net || (displayAmount - Math.abs(fee));

    if (txnDate) {
      periodStart = !periodStart || txnDate < periodStart ? txnDate : periodStart;
      periodEnd = !periodEnd || txnDate > periodEnd ? txnDate : periodEnd;
    }
    grossCents += displayAmount;
    feeCents += Math.abs(fee);
    netCents += fallbackNet;
    taxCents += tax;
    shippingCents += shipping;
    debitCents += derivedDebit;
    creditCents += derivedCredit;
    txnCount += 1;

    rowsOut.push({
      provider_scope: normalizedProvider,
      txn_date: txnDate,
      txn_type: txnType || normalizedProvider,
      description,
      reference_number: referenceNumber,
      gross_cents: displayAmount,
      fee_cents: Math.abs(fee),
      net_cents: fallbackNet,
      tax_cents: tax,
      shipping_cents: shipping,
      debit_cents: derivedDebit,
      credit_cents: derivedCredit,
      running_balance_cents: runningBalance,
      raw_json: JSON.stringify(row),
      matched_scope_key: normalizedProvider,
    });
  }

  return {
    provider_scope: normalizedProvider,
    row_count: rowsOut.length,
    txn_count: txnCount,
    gross_cents: grossCents,
    fee_cents: feeCents,
    net_cents: netCents,
    tax_cents: taxCents,
    shipping_cents: shippingCents,
    deposit_cents: creditCents,
    withdrawal_cents: debitCents,
    period_start: periodStart || null,
    period_end: periodEnd || null,
    period_month: cleanPeriodMonth(periodStart || periodEnd || new Date().toISOString().slice(0, 7)),
    rows: rowsOut,
  };
}

export async function listAccountingStatementImports(db, { providerScope = '', periodMonth = '', limit = 50 } = {}) {
  await ensureAccountingStatementImportsTables(db);
  const rawProviderFilter = normalizeText(providerScope).toLowerCase();
  const providerFilter = rawProviderFilter ? cleanStatementProvider(rawProviderFilter) : '';
  const monthFilter = String(periodMonth || '').trim();
  const result = await db.prepare(`
    SELECT accounting_statement_import_id, provider_scope, import_status, source_filename, source_format,
           period_month, period_start, period_end, currency, row_count, gross_cents, fee_cents, net_cents,
           tax_cents, shipping_cents, deposit_cents, withdrawal_cents, txn_count, statement_reference,
           detail_json, created_by_user_id, created_at, updated_at
    FROM accounting_statement_imports
    WHERE (? = '' OR provider_scope = ?)
      AND (? = '' OR period_month = ?)
    ORDER BY created_at DESC, accounting_statement_import_id DESC
    LIMIT ?
  `).bind(providerFilter, providerFilter, monthFilter, monthFilter, Math.max(1, Math.min(200, Number(limit || 50) || 50))).all().catch(() => ({ results: [] }));
  return rows(result).map((row) => ({ ...row, accounting_statement_import_id: Number(row.accounting_statement_import_id || 0), row_count: Number(row.row_count || 0), gross_cents: Number(row.gross_cents || 0), fee_cents: Number(row.fee_cents || 0), net_cents: Number(row.net_cents || 0), tax_cents: Number(row.tax_cents || 0), shipping_cents: Number(row.shipping_cents || 0), deposit_cents: Number(row.deposit_cents || 0), withdrawal_cents: Number(row.withdrawal_cents || 0), txn_count: Number(row.txn_count || 0) }));
}

export async function listAccountingReconciliationExceptions(db, { reconciliationType = '', periodMonth = '', status = '', limit = 200 } = {}) {
  await ensureAccountingStatementImportsTables(db);
  const result = await db.prepare(`
    SELECT accounting_reconciliation_exception_id, reconciliation_type, period_month, scope_key, provider_scope,
           exception_status, severity, reference_label, statement_amount_cents, book_amount_cents,
           difference_cents, tolerance_cents, notes, assigned_to_user_id, accountant_review_flag,
           resolved_by_user_id, resolved_at, reopened_by_user_id, reopened_at,
           detail_json, source_import_id, created_at, updated_at
    FROM accounting_reconciliation_exceptions
    WHERE (? = '' OR reconciliation_type = ?)
      AND (? = '' OR period_month = ?)
      AND (? = '' OR exception_status = ?)
    ORDER BY updated_at DESC, accounting_reconciliation_exception_id DESC
    LIMIT ?
  `).bind(String(reconciliationType || '').trim(), String(reconciliationType || '').trim(), String(periodMonth || '').trim(), String(periodMonth || '').trim(), String(status || '').trim(), String(status || '').trim(), Math.max(1, Math.min(500, Number(limit || 200) || 200))).all().catch(() => ({ results: [] }));
  return rows(result).map((row) => ({
    ...row,
    accounting_reconciliation_exception_id: Number(row.accounting_reconciliation_exception_id || 0),
    statement_amount_cents: Number(row.statement_amount_cents || 0),
    book_amount_cents: Number(row.book_amount_cents || 0),
    difference_cents: Number(row.difference_cents || 0),
    tolerance_cents: Number(row.tolerance_cents || 0),
    assigned_to_user_id: row.assigned_to_user_id == null ? null : Number(row.assigned_to_user_id || 0),
    accountant_review_flag: Number(row.accountant_review_flag || 0),
    resolved_by_user_id: row.resolved_by_user_id == null ? null : Number(row.resolved_by_user_id || 0),
    reopened_by_user_id: row.reopened_by_user_id == null ? null : Number(row.reopened_by_user_id || 0),
    source_import_id: row.source_import_id == null ? null : Number(row.source_import_id || 0)
  }));
}

async function getReviewByKey(db, reconciliationType, periodMonth, scopeKey) {
  await ensureAccountingReconciliationReviewsTable(db);
  return db.prepare(`SELECT * FROM accounting_reconciliation_reviews WHERE reconciliation_type=? AND period_month=? AND scope_key=? LIMIT 1`).bind(reconciliationType, periodMonth, scopeKey).first().catch(() => null);
}

async function upsertException(db, payload) {
  await ensureAccountingStatementImportsTables(db);
  const existing = await db.prepare(`SELECT accounting_reconciliation_exception_id FROM accounting_reconciliation_exceptions WHERE reconciliation_type=? AND period_month=? AND scope_key=? AND COALESCE(reference_label,'')=? LIMIT 1`).bind(payload.reconciliation_type, payload.period_month, payload.scope_key, payload.reference_label || '').first().catch(() => null);
  if (existing?.accounting_reconciliation_exception_id) {
    await db.prepare(`UPDATE accounting_reconciliation_exceptions SET provider_scope=?, exception_status=?, severity=?, statement_amount_cents=?, book_amount_cents=?, difference_cents=?, tolerance_cents=?, notes=?, detail_json=?, source_import_id=?, updated_at=CURRENT_TIMESTAMP WHERE accounting_reconciliation_exception_id=?`).bind(payload.provider_scope || null, payload.exception_status || 'open', payload.severity || 'warning', Number(payload.statement_amount_cents || 0), Number(payload.book_amount_cents || 0), Number(payload.difference_cents || 0), Number(payload.tolerance_cents || 0), payload.notes || null, payload.detail_json || null, payload.source_import_id || null, Number(existing.accounting_reconciliation_exception_id)).run();
    return Number(existing.accounting_reconciliation_exception_id);
  }
  const result = await db.prepare(`INSERT INTO accounting_reconciliation_exceptions (reconciliation_type, period_month, scope_key, provider_scope, exception_status, severity, reference_label, statement_amount_cents, book_amount_cents, difference_cents, tolerance_cents, notes, detail_json, source_import_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(payload.reconciliation_type, payload.period_month, payload.scope_key || 'all', payload.provider_scope || null, payload.exception_status || 'open', payload.severity || 'warning', payload.reference_label || null, Number(payload.statement_amount_cents || 0), Number(payload.book_amount_cents || 0), Number(payload.difference_cents || 0), Number(payload.tolerance_cents || 0), payload.notes || null, payload.detail_json || null, payload.source_import_id || null).run();
  return Number(result?.meta?.last_row_id || 0);
}

export async function autoMatchStatementImport(db, statementImport, adminUserId = null) {
  await ensureAccountingStatementImportsTables(db);
  await ensureAccountingReconciliationReviewsTable(db);
  await ensureAccountingAttachmentsTable(db);
  const providerScope = cleanStatementProvider(statementImport.provider_scope);
  const periodMonth = cleanPeriodMonth(statementImport.period_month);
  const statementReference = statementImport.statement_reference || statementImport.source_filename || `${providerScope}-${periodMonth}`;
  const matches = [];

  const targets = [
    {
      reconciliation_type: 'processor_fees',
      scope_key: providerScope,
      statement_amount_cents: Number(statementImport.fee_cents || 0),
      tolerance_cents: 500,
      note: `Auto-matched from ${providerScope} statement import.`
    },
    {
      reconciliation_type: 'shipping',
      scope_key: providerScope === 'bank' ? 'shipping' : providerScope,
      statement_amount_cents: Number(statementImport.shipping_cents || 0),
      tolerance_cents: 1000,
      note: `Auto-matched shipping totals from ${providerScope} statement import.`
    },
    {
      reconciliation_type: 'sales_tax',
      scope_key: 'all',
      statement_amount_cents: Number(statementImport.tax_cents || 0),
      tolerance_cents: 500,
      note: `Auto-matched tax totals from ${providerScope} statement import.`
    }
  ].filter((row) => Number(row.statement_amount_cents || 0) > 0);

  for (const target of targets) {
    const review = await getReviewByKey(db, target.reconciliation_type, periodMonth, target.scope_key);
    const bookAmount = Number(review?.book_amount_cents || review?.compared_amount_cents || 0);
    const confidence = reconciliationConfidence(target.statement_amount_cents, bookAmount, target.tolerance_cents);
    const difference = confidence.difference_cents;
    const unresolved = confidence.unresolved_item_count;
    const detail = (() => {
      try { return JSON.parse(String(review?.detail_json || '{}')); } catch { return {}; }
    })();
    detail.statement_import_id = Number(statementImport.accounting_statement_import_id || 0);
    detail.statement_source_filename = statementImport.source_filename || '';
    detail.statement_provider_scope = providerScope;
    detail.statement_imported_row_count = Number(statementImport.row_count || 0);
    detail.statement_match_confidence = confidence.match_confidence;
    detail.statement_match_bucket = confidence.match_bucket;
    detail.statement_match_difference_cents = difference;

    await db.prepare(`
      INSERT INTO accounting_reconciliation_reviews (
        reconciliation_type, period_month, scope_key, review_status, note,
        statement_reference, difference_reason, detail_json, attachment_count,
        statement_amount_cents, book_amount_cents, tolerance_cents,
        expected_rate_basis_points, observed_rate_basis_points, unresolved_item_count,
        reference_amount_cents, compared_amount_cents, difference_cents,
        created_by_user_id, updated_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(reconciliation_type, period_month, scope_key) DO UPDATE SET
        review_status = CASE WHEN accounting_reconciliation_reviews.review_status='finalized' THEN accounting_reconciliation_reviews.review_status ELSE excluded.review_status END,
        note = COALESCE(excluded.note, accounting_reconciliation_reviews.note),
        statement_reference = excluded.statement_reference,
        difference_reason = excluded.difference_reason,
        detail_json = excluded.detail_json,
        statement_amount_cents = excluded.statement_amount_cents,
        tolerance_cents = excluded.tolerance_cents,
        unresolved_item_count = excluded.unresolved_item_count,
        difference_cents = excluded.difference_cents,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      target.reconciliation_type,
      periodMonth,
      target.scope_key,
      confidence.review_status,
      target.note,
      statementReference,
      unresolved ? `statement_import_${confidence.match_bucket}` : `statement_import_${confidence.match_bucket}`,
      JSON.stringify(detail),
      Number(review?.attachment_count || 0),
      Number(target.statement_amount_cents || 0),
      bookAmount,
      Number(target.tolerance_cents || 0),
      Number(review?.expected_rate_basis_points || 0),
      Number(review?.observed_rate_basis_points || 0),
      unresolved,
      Number(review?.reference_amount_cents || 0),
      Number(review?.compared_amount_cents || review?.book_amount_cents || 0),
      difference,
      adminUserId == null ? null : Number(adminUserId || 0),
      adminUserId == null ? null : Number(adminUserId || 0)
    ).run();

    if (unresolved) {
      await upsertException(db, {
        reconciliation_type: target.reconciliation_type,
        period_month: periodMonth,
        scope_key: target.scope_key,
        provider_scope: providerScope,
        exception_status: 'open',
        severity: confidence.severity || 'warning',
        reference_label: statementReference,
        statement_amount_cents: Number(target.statement_amount_cents || 0),
        book_amount_cents: bookAmount,
        difference_cents: difference,
        tolerance_cents: Number(target.tolerance_cents || 0),
        notes: `Imported statement difference requires review for ${target.reconciliation_type}.`,
        detail_json: JSON.stringify(detail),
        source_import_id: Number(statementImport.accounting_statement_import_id || 0),
      });
    }

    matches.push({
      reconciliation_type: target.reconciliation_type,
      scope_key: target.scope_key,
      statement_amount_cents: Number(target.statement_amount_cents || 0),
      book_amount_cents: bookAmount,
      difference_cents: difference,
      unresolved_item_count: unresolved,
      match_confidence: confidence.match_confidence,
      match_bucket: confidence.match_bucket,
      review_status: confidence.review_status,
    });
  }

  await db.prepare(`UPDATE accounting_statement_imports SET import_status=?, updated_at=CURRENT_TIMESTAMP WHERE accounting_statement_import_id=?`).bind(matches.some((row) => Number(row.unresolved_item_count || 0) > 0) ? 'needs_review' : 'matched', Number(statementImport.accounting_statement_import_id || 0)).run();
  return matches;
}

export async function createStatementImportFromCsv(db, { providerScope, sourceFilename, csvText, statementReference = '', periodMonth = '', currency = 'CAD', createdByUserId = null } = {}) {
  await ensureAccountingStatementImportsTables(db);
  const provider = cleanStatementProvider(providerScope);
  const parsed = parseCsv(csvText);
  const summary = summarizeImportRows(provider, parsed.rows);
  const effectivePeriodMonth = cleanPeriodMonth(periodMonth || summary.period_month);
  const result = await db.prepare(`
    INSERT INTO accounting_statement_imports (
      provider_scope, import_status, source_filename, source_format, period_month, period_start, period_end,
      currency, row_count, gross_cents, fee_cents, net_cents, tax_cents, shipping_cents, deposit_cents,
      withdrawal_cents, txn_count, statement_reference, detail_json, created_by_user_id, created_at, updated_at
    ) VALUES (?, 'imported', ?, 'csv', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    provider,
    sourceFilename || null,
    effectivePeriodMonth,
    summary.period_start || null,
    summary.period_end || null,
    normalizeText(currency || 'CAD').toUpperCase() || 'CAD',
    Number(summary.row_count || 0),
    Number(summary.gross_cents || 0),
    Number(summary.fee_cents || 0),
    Number(summary.net_cents || 0),
    Number(summary.tax_cents || 0),
    Number(summary.shipping_cents || 0),
    Number(summary.deposit_cents || 0),
    Number(summary.withdrawal_cents || 0),
    Number(summary.txn_count || 0),
    statementReference || sourceFilename || null,
    JSON.stringify({ headers: parsed.headers, delimiter: parsed.delimiter || ',', sample_rows: summary.rows.slice(0, 5) }),
    createdByUserId == null ? null : Number(createdByUserId || 0)
  ).run();
  const importId = Number(result?.meta?.last_row_id || 0);
  for (const row of summary.rows) {
    await db.prepare(`INSERT INTO accounting_statement_import_rows (accounting_statement_import_id, provider_scope, txn_date, txn_type, description, reference_number, gross_cents, fee_cents, net_cents, tax_cents, shipping_cents, debit_cents, credit_cents, running_balance_cents, raw_json, matched_scope_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(importId, provider, row.txn_date || null, row.txn_type || null, row.description || null, row.reference_number || null, Number(row.gross_cents || 0), Number(row.fee_cents || 0), Number(row.net_cents || 0), Number(row.tax_cents || 0), Number(row.shipping_cents || 0), Number(row.debit_cents || 0), Number(row.credit_cents || 0), Number(row.running_balance_cents || 0), row.raw_json || null, row.matched_scope_key || provider).run();
  }
  const statementImport = {
    accounting_statement_import_id: importId,
    provider_scope: provider,
    source_filename: sourceFilename || '',
    period_month: effectivePeriodMonth,
    row_count: Number(summary.row_count || 0),
    gross_cents: Number(summary.gross_cents || 0),
    fee_cents: Number(summary.fee_cents || 0),
    net_cents: Number(summary.net_cents || 0),
    tax_cents: Number(summary.tax_cents || 0),
    shipping_cents: Number(summary.shipping_cents || 0),
    txn_count: Number(summary.txn_count || 0),
    statement_reference: statementReference || sourceFilename || '',
  };
  const matches = await autoMatchStatementImport(db, statementImport, createdByUserId);
  return { statementImport, parsed, summary, matches };
}