// Devil n Dove Build 324 — Accounting-owned non-mutating monthly profit/loss read service.

export const BUILD = 324;
export const CONTRACT_ID = 'accounting-profit-loss-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze([
  'orders',
  'accounting_expenses',
  'accounting_writeoffs',
  'general_ledger_accounts',
  'accounting_overhead_allocations',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function centsFromDollars(value) {
  return Math.round(Number(value || 0) * 100);
}

export function monthRange(monthValue) {
  const raw = text(monthValue);
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`;
  return { raw, start, end };
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`
    ).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function coalesceColumns(columns, names, fallback = '0') {
  const usable = names.filter((name) => columns.has(name));
  if (!usable.length) return fallback;
  return `COALESCE(${usable.join(', ')}, ${fallback})`;
}

function dateExpression(columns, names) {
  const usable = names.filter((name) => columns.has(name));
  if (!usable.length) return `datetime('now')`;
  return `COALESCE(${usable.join(', ')}, datetime('now'))`;
}

function requiredAlternativeMissing(columns, names) {
  return !names.some((name) => columns.has(name));
}

function addMissing(missingColumns, table, logicalColumn) {
  missingColumns.push(`${table}.${logicalColumn}`);
}

async function first(db, sql, bindings = []) {
  const row = await db.prepare(sql).bind(...bindings).first();
  return row || {};
}

async function all(db, sql, bindings = []) {
  const result = await db.prepare(sql).bind(...bindings).all();
  return rows(result);
}

function payload(extra = {}) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-profit-loss',
    authority_tables: AUTHORITY_TABLES,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingProfitLoss(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const range = monthRange(options.month || new Date().toISOString().slice(0, 7));
  if (!range) {
    const error = new RangeError('Please provide month in YYYY-MM format.');
    error.code = 'invalid_accounting_month';
    throw error;
  }

  const availability = {};
  const columnSets = {};
  for (const table of AUTHORITY_TABLES) {
    availability[table] = await tableExists(db, table);
    columnSets[table] = availability[table] ? await tableColumns(db, table) : new Set();
  }

  const missingTables = AUTHORITY_TABLES.filter((table) => !availability[table]);
  const missingColumns = [];

  const orderCols = columnSets.orders;
  if (availability.orders) {
    if (requiredAlternativeMissing(orderCols, ['total_amount', 'total'])) addMissing(missingColumns, 'orders', 'total_amount|total');
    if (requiredAlternativeMissing(orderCols, ['created_at'])) addMissing(missingColumns, 'orders', 'created_at');
  }

  const expenseCols = columnSets.accounting_expenses;
  if (availability.accounting_expenses) {
    if (!expenseCols.has('amount')) addMissing(missingColumns, 'accounting_expenses', 'amount');
    if (requiredAlternativeMissing(expenseCols, ['expense_date', 'created_at'])) addMissing(missingColumns, 'accounting_expenses', 'expense_date|created_at');
  }

  const writeoffCols = columnSets.accounting_writeoffs;
  if (availability.accounting_writeoffs) {
    if (!writeoffCols.has('amount')) addMissing(missingColumns, 'accounting_writeoffs', 'amount');
    if (requiredAlternativeMissing(writeoffCols, ['writeoff_date', 'created_at'])) addMissing(missingColumns, 'accounting_writeoffs', 'writeoff_date|created_at');
  }

  const overheadCols = columnSets.accounting_overhead_allocations;
  if (availability.accounting_overhead_allocations) {
    for (const column of ['amount_cents', 'period_month']) {
      if (!overheadCols.has(column)) addMissing(missingColumns, 'accounting_overhead_allocations', column);
    }
  }

  const glCols = columnSets.general_ledger_accounts;
  if (availability.general_ledger_accounts) {
    for (const column of ['code', 'name', 'category']) {
      if (!glCols.has(column)) addMissing(missingColumns, 'general_ledger_accounts', column);
    }
  }

  const orderReady = availability.orders
    && !requiredAlternativeMissing(orderCols, ['total_amount', 'total'])
    && orderCols.has('created_at');
  const expenseReady = availability.accounting_expenses
    && expenseCols.has('amount')
    && !requiredAlternativeMissing(expenseCols, ['expense_date', 'created_at']);
  const writeoffReady = availability.accounting_writeoffs
    && writeoffCols.has('amount')
    && !requiredAlternativeMissing(writeoffCols, ['writeoff_date', 'created_at']);
  const overheadReady = availability.accounting_overhead_allocations
    && overheadCols.has('amount_cents')
    && overheadCols.has('period_month');
  const glReady = availability.general_ledger_accounts
    && glCols.has('code')
    && glCols.has('name')
    && glCols.has('category');

  let orderSummary = {};
  if (orderReady) {
    const totalExpr = coalesceColumns(orderCols, ['total_amount', 'total'], '0');
    const taxExpr = coalesceColumns(orderCols, ['tax_amount', 'tax_total'], '0');
    const statusExpr = orderCols.has('status') ? `LOWER(COALESCE(status,''))` : `''`;
    const createdExpr = dateExpression(orderCols, ['created_at']);
    orderSummary = await first(db, `
      SELECT
        COALESCE(SUM(${totalExpr}),0) AS booked_amount,
        COALESCE(SUM(${taxExpr}),0) AS booked_tax,
        SUM(CASE WHEN ${statusExpr} IN ('paid','fulfilled') THEN ${totalExpr} ELSE 0 END) AS recognized_amount,
        COUNT(*) AS order_count
      FROM orders
      WHERE substr(${createdExpr},1,10) >= ?
        AND substr(${createdExpr},1,10) < ?
    `, [range.start, range.end]);
  }

  let expenseSummary = {};
  let groupedExpenses = [];
  if (expenseReady) {
    const expenseDateExpr = dateExpression(expenseCols, ['expense_date', 'created_at']);
    const taxExpr = expenseCols.has('tax_amount') ? 'COALESCE(tax_amount,0)' : '0';
    const ledgerCodeExpr = expenseCols.has('ledger_code') ? `COALESCE(NULLIF(ledger_code,''), 'UNASSIGNED')` : `'UNASSIGNED'`;
    const ledgerNameExpr = expenseCols.has('ledger_name') ? `COALESCE(NULLIF(ledger_name,''), 'Unassigned')` : `'Unassigned'`;
    expenseSummary = await first(db, `
      SELECT
        COALESCE(SUM(CAST(ROUND(COALESCE(amount,0) * 100.0) AS INTEGER)),0) AS expense_cents,
        COALESCE(SUM(CAST(ROUND(${taxExpr} * 100.0) AS INTEGER)),0) AS expense_tax_cents,
        COUNT(*) AS expense_count
      FROM accounting_expenses
      WHERE substr(${expenseDateExpr},1,10) >= ?
        AND substr(${expenseDateExpr},1,10) < ?
    `, [range.start, range.end]);

    groupedExpenses = await all(db, `
      SELECT
        ${ledgerCodeExpr} AS ledger_code,
        ${ledgerNameExpr} AS ledger_name,
        COALESCE(SUM(CAST(ROUND((COALESCE(amount,0) + ${taxExpr}) * 100.0) AS INTEGER)),0) AS total_cents,
        COUNT(*) AS entry_count
      FROM accounting_expenses
      WHERE substr(${expenseDateExpr},1,10) >= ?
        AND substr(${expenseDateExpr},1,10) < ?
      GROUP BY ${ledgerCodeExpr}, ${ledgerNameExpr}
      ORDER BY total_cents DESC, ledger_name ASC
    `, [range.start, range.end]);
  }

  let writeoffSummary = {};
  if (writeoffReady) {
    const writeoffDateExpr = dateExpression(writeoffCols, ['writeoff_date', 'created_at']);
    writeoffSummary = await first(db, `
      SELECT
        COALESCE(SUM(CAST(ROUND(COALESCE(amount,0) * 100.0) AS INTEGER)),0) AS writeoff_cents,
        COUNT(*) AS writeoff_count
      FROM accounting_writeoffs
      WHERE substr(${writeoffDateExpr},1,10) >= ?
        AND substr(${writeoffDateExpr},1,10) < ?
    `, [range.start, range.end]);
  }

  let overheadSummary = {};
  let overheadGroups = [];
  if (overheadReady) {
    const ledgerCodeExpr = overheadCols.has('ledger_code') ? `COALESCE(NULLIF(ledger_code,''), 'UNASSIGNED')` : `'UNASSIGNED'`;
    const ledgerNameExpr = overheadCols.has('ledger_name') ? `COALESCE(NULLIF(ledger_name,''), 'Unassigned')` : `'Unassigned'`;
    const allocationBasisExpr = overheadCols.has('allocation_basis') ? `COALESCE(MIN(allocation_basis),'manual')` : `'manual'`;
    overheadSummary = await first(db, `
      SELECT
        COALESCE(SUM(COALESCE(amount_cents,0)),0) AS overhead_cents,
        COUNT(*) AS overhead_count
      FROM accounting_overhead_allocations
      WHERE period_month = ?
    `, [range.raw]);

    overheadGroups = await all(db, `
      SELECT
        ${ledgerCodeExpr} AS ledger_code,
        ${ledgerNameExpr} AS ledger_name,
        COALESCE(SUM(COALESCE(amount_cents,0)),0) AS total_cents,
        COUNT(*) AS entry_count,
        ${allocationBasisExpr} AS allocation_basis
      FROM accounting_overhead_allocations
      WHERE period_month = ?
      GROUP BY ${ledgerCodeExpr}, ${ledgerNameExpr}
      ORDER BY total_cents DESC, ledger_name ASC
    `, [range.raw]);
  }

  let glAccounts = [];
  if (glReady) {
    const select = [
      'code',
      'name',
      'category',
      glCols.has('parent_group') ? 'parent_group' : `'' AS parent_group`,
      glCols.has('normal_balance') ? 'normal_balance' : `'' AS normal_balance`,
      glCols.has('sort_order') ? 'sort_order' : '0 AS sort_order',
      glCols.has('gifi_code') ? 'gifi_code' : `'' AS gifi_code`,
      glCols.has('gifi_label') ? 'gifi_label' : `'' AS gifi_label`,
      glCols.has('gifi_section') ? 'gifi_section' : `'' AS gifi_section`,
      glCols.has('tax_deductibility_percent') ? 'tax_deductibility_percent' : '100 AS tax_deductibility_percent',
    ].join(',\n        ');
    const sortOrder = glCols.has('sort_order') ? 'sort_order' : '0';
    glAccounts = await all(db, `
      SELECT
        ${select}
      FROM general_ledger_accounts
      ORDER BY category ASC, ${sortOrder} ASC, code ASC
      LIMIT 250
    `);
  }

  const bookedAmount = Number(orderSummary.booked_amount || 0);
  const bookedTax = Number(orderSummary.booked_tax || 0);
  const recognizedAmount = Number(orderSummary.recognized_amount || 0);
  const expenseCents = Number(expenseSummary.expense_cents || 0);
  const expenseTaxCents = Number(expenseSummary.expense_tax_cents || 0);
  const writeoffCents = Number(writeoffSummary.writeoff_cents || 0);
  const overheadCents = Number(overheadSummary.overhead_cents || 0);
  const roughNetBeforeOverheadCents = centsFromDollars(recognizedAmount) - expenseCents - expenseTaxCents - writeoffCents;

  return payload({
    period: range.raw,
    schema_ready: missingTables.length === 0 && missingColumns.length === 0,
    missing_tables: missingTables,
    missing_columns: missingColumns,
    summary: {
      order_count: Number(orderSummary.order_count || 0),
      expense_count: Number(expenseSummary.expense_count || 0),
      writeoff_count: Number(writeoffSummary.writeoff_count || 0),
      overhead_count: Number(overheadSummary.overhead_count || 0),
      booked_amount: bookedAmount,
      booked_tax: bookedTax,
      recognized_amount: recognizedAmount,
      operating_expense_cents: expenseCents,
      operating_expense_tax_cents: expenseTaxCents,
      writeoff_cents: writeoffCents,
      rough_net_before_cogs_cents: roughNetBeforeOverheadCents,
      overhead_allocated_cents: overheadCents,
      rough_net_after_overhead_cents: roughNetBeforeOverheadCents - overheadCents,
    },
    expense_groups: groupedExpenses.map((row) => ({
      ledger_code: row.ledger_code || 'UNASSIGNED',
      ledger_name: row.ledger_name || 'Unassigned',
      total_cents: Number(row.total_cents || 0),
      entry_count: Number(row.entry_count || 0),
    })),
    overhead_groups: overheadGroups.map((row) => ({
      ledger_code: row.ledger_code || 'UNASSIGNED',
      ledger_name: row.ledger_name || 'Unassigned',
      total_cents: Number(row.total_cents || 0),
      entry_count: Number(row.entry_count || 0),
      allocation_basis: row.allocation_basis || 'manual',
    })),
    general_ledger_accounts: glAccounts.map((row) => ({
      code: row.code || '',
      name: row.name || '',
      category: row.category || '',
      parent_group: row.parent_group || '',
      normal_balance: row.normal_balance || '',
      sort_order: Number(row.sort_order || 0),
      gifi_code: row.gifi_code || '',
      gifi_label: row.gifi_label || '',
      gifi_section: row.gifi_section || '',
      tax_deductibility_percent: Number(row.tax_deductibility_percent == null ? 100 : row.tax_deductibility_percent),
    })),
  });
}
