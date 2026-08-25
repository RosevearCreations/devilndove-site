// Devil n Dove Builds 344-345 — shared non-mutating Accounting export row reader.

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }
async function tableExists(db, table) { try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(table).first()); } catch { return false; } }
async function columnSet(db, table) { try { return new Set(rows(await db.prepare(`PRAGMA table_info(${table})`).all()).map((row) => text(row?.name)).filter(Boolean)); } catch { return new Set(); } }
function pick(cols, names) { for (const name of names) if (cols.has(name)) return name; return ''; }
function sqlText(column, fallback = "''") { return column ? `COALESCE(${column}, '')` : fallback; }
function sqlNumber(column, cents = false) { if (!column) return '0'; return cents ? `(COALESCE(${column},0) / 100.0)` : `COALESCE(${column},0)`; }
function logical(table, names) { return `${table}.${names.join('|')}`; }

async function inspectOrderSource(db) {
  for (const table of ['accounting_order_records', 'orders']) {
    if (!(await tableExists(db, table))) continue;
    const cols = await columnSet(db, table);
    const id = pick(cols, table === 'orders' ? ['order_id','id'] : ['id','accounting_order_record_id','order_id']);
    const date = pick(cols, table === 'orders' ? ['created_at','order_date'] : ['order_date','created_at']);
    const number = pick(cols, ['order_number']);
    const party = pick(cols, ['customer_name','customer_email']);
    const status = pick(cols, table === 'orders' ? ['order_status','status','payment_status'] : ['status','payment_status','fulfillment_status']);
    const amount = pick(cols, table === 'orders' ? ['total_amount','total','total_cents'] : ['total_amount','grand_total','subtotal_amount','total_cents']);
    const tax = pick(cols, table === 'orders' ? ['tax_amount','tax_total','tax_cents'] : ['tax_amount','tax_total','tax_cents']);
    const notes = pick(cols, ['notes']);
    const missing = [];
    if (!id) missing.push(logical(table, table === 'orders' ? ['order_id','id'] : ['id','accounting_order_record_id','order_id']));
    if (!date) missing.push(logical(table, ['order_date','created_at']));
    if (!amount) missing.push(logical(table, table === 'orders' ? ['total_amount','total','total_cents'] : ['total_amount','grand_total','subtotal_amount','total_cents']));
    return { table, cols, id, date, number, party, status, amount, tax, notes, missing };
  }
  return { table: '', missing: ['accounting_order_records|orders'] };
}

async function inspectSimple(db, table, config) {
  if (!(await tableExists(db, table))) return { table, exists: false, missingTables: [table], missingColumns: [] };
  const cols = await columnSet(db, table);
  const fields = {};
  const missingColumns = [];
  for (const [key, names] of Object.entries(config.required || {})) {
    fields[key] = pick(cols, names);
    if (!fields[key]) missingColumns.push(logical(table, names));
  }
  for (const [key, names] of Object.entries(config.optional || {})) fields[key] = pick(cols, names);
  return { table, exists: true, cols, fields, missingTables: [], missingColumns };
}

async function loadOrders(db, range, state) {
  if (!state.table || state.missing.length) return [];
  const centsAmount = state.amount.endsWith('_cents');
  const centsTax = state.tax.endsWith('_cents');
  const result = await db.prepare(`
    SELECT 'order' AS row_type,
           substr(COALESCE(${state.date}, datetime('now')),1,10) AS entry_date,
           ${sqlText(state.number, `CAST(${state.id} AS TEXT)`)} AS reference_code,
           ${sqlText(state.party)} AS party,
           ${sqlText(state.status)} AS status,
           ROUND(${sqlNumber(state.amount, centsAmount)},2) AS amount,
           ROUND(${sqlNumber(state.tax, centsTax)},2) AS tax_amount,
           '' AS ledger_code,
           '' AS ledger_name,
           ${sqlText(state.notes)} AS notes
    FROM ${state.table}
    WHERE substr(COALESCE(${state.date}, datetime('now')),1,10) >= ?
      AND substr(COALESCE(${state.date}, datetime('now')),1,10) < ?
    ORDER BY COALESCE(${state.date}, datetime('now')) DESC
  `).bind(range.start, range.end).all().catch(() => ({ results: [] }));
  return rows(result);
}

async function loadExpenses(db, range, state) {
  if (!state.exists || state.missingColumns.length) return [];
  const f = state.fields;
  const result = await db.prepare(`
    SELECT 'expense' AS row_type,
           substr(COALESCE(${f.date}, datetime('now')),1,10) AS entry_date,
           ${sqlText(f.reference, `CAST(${f.id} AS TEXT)`)} AS reference_code,
           ${sqlText(f.party)} AS party,
           ${sqlText(f.status)} AS status,
           ROUND(COALESCE(${f.amount},0),2) AS amount,
           ROUND(${sqlNumber(f.tax)},2) AS tax_amount,
           ${sqlText(f.ledgerCode)} AS ledger_code,
           ${sqlText(f.ledgerName)} AS ledger_name,
           ${sqlText(f.notes)} AS notes
    FROM accounting_expenses
    WHERE substr(COALESCE(${f.date}, datetime('now')),1,10) >= ?
      AND substr(COALESCE(${f.date}, datetime('now')),1,10) < ?
    ORDER BY COALESCE(${f.date}, datetime('now')) DESC
  `).bind(range.start, range.end).all().catch(() => ({ results: [] }));
  return rows(result);
}

async function loadWriteoffs(db, range, state) {
  if (!state.exists || state.missingColumns.length) return [];
  const f = state.fields;
  const result = await db.prepare(`
    SELECT 'writeoff' AS row_type,
           substr(COALESCE(${f.date}, datetime('now')),1,10) AS entry_date,
           ${sqlText(f.reference, `CAST(${f.id} AS TEXT)`)} AS reference_code,
           ${sqlText(f.party)} AS party,
           ${sqlText(f.status)} AS status,
           ROUND(COALESCE(${f.amount},0),2) AS amount,
           ROUND(${sqlNumber(f.tax)},2) AS tax_amount,
           ${f.ledgerCode ? sqlText(f.ledgerCode) : "'WRITEOFF'"} AS ledger_code,
           ${f.ledgerName ? sqlText(f.ledgerName) : "'Write-Offs'"} AS ledger_name,
           ${sqlText(f.notes)} AS notes
    FROM accounting_writeoffs
    WHERE substr(COALESCE(${f.date}, datetime('now')),1,10) >= ?
      AND substr(COALESCE(${f.date}, datetime('now')),1,10) < ?
    ORDER BY COALESCE(${f.date}, datetime('now')) DESC
  `).bind(range.start, range.end).all().catch(() => ({ results: [] }));
  return rows(result);
}

export async function readAccountingSummaryExportRows(db, range) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const [orderState, expenseState, writeoffState] = await Promise.all([
    inspectOrderSource(db),
    inspectSimple(db, 'accounting_expenses', {
      required: { id:['expense_id'], date:['expense_date','created_at'], amount:['amount'] },
      optional: { reference:['reference_number'], party:['vendor_name','payee_name'], status:['status'], tax:['tax_amount'], ledgerCode:['ledger_code'], ledgerName:['ledger_name'], notes:['notes'] },
    }),
    inspectSimple(db, 'accounting_writeoffs', {
      required: { id:['writeoff_id'], date:['writeoff_date','created_at'], amount:['total_amount','amount'] },
      optional: { reference:['reference_number'], party:['item_name','product_name','reason_code'], status:['status','reason_code'], tax:['tax_amount'], ledgerCode:['ledger_code'], ledgerName:['ledger_name'], notes:['notes'] },
    }),
  ]);
  const missingTables = [...(expenseState.missingTables || []), ...(writeoffState.missingTables || [])];
  if (!orderState.table) missingTables.push('accounting_order_records|orders');
  const missingColumns = [...(orderState.missing || []), ...(expenseState.missingColumns || []), ...(writeoffState.missingColumns || [])];
  const [orders, expenses, writeoffs] = await Promise.all([
    loadOrders(db, range, orderState), loadExpenses(db, range, expenseState), loadWriteoffs(db, range, writeoffState),
  ]);
  return {
    schema_ready: missingTables.length === 0 && missingColumns.length === 0,
    missing_tables: missingTables,
    missing_columns: missingColumns,
    rows: [...orders, ...expenses, ...writeoffs],
    sources: { order_table: orderState.table || null, expenses_table: expenseState.exists ? 'accounting_expenses' : null, writeoffs_table: writeoffState.exists ? 'accounting_writeoffs' : null },
  };
}
