import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status, { "Cache-Control": "no-store" });
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

function monthRange(monthValue) {
  const raw = String(monthValue || '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    raw,
    start: `${match[1]}-${match[2]}-01`,
    end: `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`,
  };
}

async function ensureTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_journal_entries (
      accounting_journal_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_month TEXT NOT NULL,
      entry_date TEXT,
      source_type TEXT NOT NULL,
      source_id TEXT,
      source_reference TEXT,
      memo TEXT,
      is_balanced INTEGER NOT NULL DEFAULT 1,
      total_debit_cents INTEGER NOT NULL DEFAULT 0,
      total_credit_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(period_month, source_type, source_id)
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_journal_lines (
      accounting_journal_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
      accounting_journal_entry_id INTEGER NOT NULL,
      line_order INTEGER NOT NULL DEFAULT 0,
      ledger_code TEXT NOT NULL,
      ledger_name TEXT NOT NULL,
      entry_side TEXT NOT NULL CHECK(entry_side IN ('debit','credit')),
      amount_cents INTEGER NOT NULL DEFAULT 0,
      memo TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accounting_journal_entry_id) REFERENCES accounting_journal_entries(accounting_journal_entry_id) ON DELETE CASCADE
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_period ON accounting_journal_entries(period_month, entry_date DESC, accounting_journal_entry_id DESC)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_source ON accounting_journal_entries(source_type, source_id, period_month)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_entry ON accounting_journal_lines(accounting_journal_entry_id, line_order ASC)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_ledger ON accounting_journal_lines(ledger_code, entry_side, created_at DESC)`).run();
}

async function safeAll(db, sql, bindings = []) {
  try {
    const result = await db.prepare(sql).bind(...bindings).all();
    return normalizeResults(result);
  } catch {
    return [];
  }
}

function entryBlueprintsForOrder(row) {
  const totalCents = Math.max(0, Number(row.total_cents || 0));
  const taxCents = Math.max(0, Number(row.tax_cents || row.tax_liability_cents || 0));
  const revenueCents = Math.max(0, totalCents - taxCents);
  const paidCents = Math.max(0, Number(row.amount_paid_cents || 0));
  const outstandingCents = Math.max(0, Number(row.amount_outstanding_cents || 0));
  const lines = [];
  if (paidCents > 0) lines.push({ side: 'debit', code: '1000', name: 'Cash', amount_cents: paidCents });
  if (outstandingCents > 0) lines.push({ side: 'debit', code: '1100', name: 'Accounts Receivable', amount_cents: outstandingCents });
  if (revenueCents > 0) lines.push({ side: 'credit', code: '4000', name: 'Sales Revenue', amount_cents: revenueCents });
  if (taxCents > 0) lines.push({ side: 'credit', code: '2300', name: 'Sales Tax Payable', amount_cents: taxCents });
  return lines;
}

function entryBlueprintForExpense(row) {
  const amountCents = Math.round(Number(row.amount || 0) * 100);
  const taxCents = Math.round(Number(row.tax_amount || 0) * 100);
  const totalCents = Math.max(0, amountCents + taxCents);
  const expenseCode = normalizeText(row.ledger_code).toUpperCase() || '6100';
  const expenseName = normalizeText(row.ledger_name) || 'Operating Expense';
  const lines = [];
  if (amountCents > 0) lines.push({ side: 'debit', code: expenseCode, name: expenseName, amount_cents: amountCents });
  if (taxCents > 0) lines.push({ side: 'debit', code: '1410', name: 'Tax Recoverable / Input Credits', amount_cents: taxCents });
  if (totalCents > 0) lines.push({ side: 'credit', code: '2100', name: 'Accounts Payable / Cash', amount_cents: totalCents });
  return lines;
}

function entryBlueprintForWriteoff(row) {
  const amountCents = Math.round(Number(row.amount || row.total_amount || 0) * 100);
  const lines = [];
  if (amountCents > 0) {
    lines.push({ side: 'debit', code: '6600', name: 'Write-Off Expense', amount_cents: amountCents });
    lines.push({ side: 'credit', code: '1400', name: 'Inventory / Asset Clearing', amount_cents: amountCents });
  }
  return lines;
}

function entryBlueprintForOverhead(row) {
  const amountCents = Math.max(0, Number(row.amount_cents || 0));
  const ledgerCode = normalizeText(row.ledger_code).toUpperCase() || '6200';
  const ledgerName = normalizeText(row.ledger_name) || 'Overhead Allocation';
  if (!amountCents) return [];
  return [
    { side: 'debit', code: ledgerCode, name: ledgerName, amount_cents: amountCents },
    { side: 'credit', code: '2900', name: 'Overhead Clearing', amount_cents: amountCents },
  ];
}

async function saveEntry(db, range, sourceType, sourceId, sourceReference, memo, entryDate, lines) {
  const debitTotal = lines.filter((line) => line.side === 'debit').reduce((sum, line) => sum + Number(line.amount_cents || 0), 0);
  const creditTotal = lines.filter((line) => line.side === 'credit').reduce((sum, line) => sum + Number(line.amount_cents || 0), 0);
  const isBalanced = debitTotal === creditTotal ? 1 : 0;

  await db.prepare(`
    INSERT INTO accounting_journal_entries (
      period_month, entry_date, source_type, source_id, source_reference, memo, is_balanced, total_debit_cents, total_credit_cents, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(period_month, source_type, source_id) DO UPDATE SET
      entry_date = excluded.entry_date,
      source_reference = excluded.source_reference,
      memo = excluded.memo,
      is_balanced = excluded.is_balanced,
      total_debit_cents = excluded.total_debit_cents,
      total_credit_cents = excluded.total_credit_cents,
      updated_at = CURRENT_TIMESTAMP
  `).bind(range.raw, entryDate || range.start, sourceType, String(sourceId || ''), sourceReference || null, memo || null, isBalanced, debitTotal, creditTotal).run();

  const entry = await db.prepare(`SELECT accounting_journal_entry_id FROM accounting_journal_entries WHERE period_month = ? AND source_type = ? AND source_id = ? LIMIT 1`).bind(range.raw, sourceType, String(sourceId || '')).first();
  const entryId = Number(entry?.accounting_journal_entry_id || 0);
  if (!entryId) return 0;

  await db.prepare(`DELETE FROM accounting_journal_lines WHERE accounting_journal_entry_id = ?`).bind(entryId).run();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    await db.prepare(`
      INSERT INTO accounting_journal_lines (
        accounting_journal_entry_id, line_order, ledger_code, ledger_name, entry_side, amount_cents, memo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(entryId, index + 1, line.code, line.name, line.side, Number(line.amount_cents || 0), line.memo || null).run();
  }
  return entryId;
}

async function syncMonth(db, range) {
  await ensureTables(db);

  const hasOrders = await tableExists(db, 'accounting_order_records');
  const hasExpenses = await tableExists(db, 'accounting_expenses');
  const hasWriteoffs = await tableExists(db, 'accounting_writeoffs');
  const hasOverhead = await tableExists(db, 'accounting_overhead_allocations');

  await db.prepare(`DELETE FROM accounting_journal_lines WHERE accounting_journal_entry_id IN (SELECT accounting_journal_entry_id FROM accounting_journal_entries WHERE period_month = ?)` ).bind(range.raw).run();
  await db.prepare(`DELETE FROM accounting_journal_entries WHERE period_month = ?`).bind(range.raw).run();

  let entriesCreated = 0;

  if (hasOrders) {
    const rows = await safeAll(db, `
      SELECT order_id, order_number, total_cents, tax_cents, tax_liability_cents, amount_paid_cents, amount_outstanding_cents, created_at
      FROM accounting_order_records
      WHERE substr(COALESCE(created_at, datetime('now')), 1, 7) = ?
    `, [range.raw]);
    for (const row of rows) {
      const entryId = await saveEntry(db, range, 'order_record', row.order_id, row.order_number || `Order ${row.order_id}`, 'Booked order record', row.created_at || range.start, entryBlueprintsForOrder(row));
      if (entryId) entriesCreated += 1;
    }
  }

  if (hasExpenses) {
    const rows = await safeAll(db, `
      SELECT expense_id, expense_date, vendor_name, amount, tax_amount, ledger_code, ledger_name
      FROM accounting_expenses
      WHERE substr(COALESCE(expense_date, created_at, datetime('now')), 1, 7) = ?
    `, [range.raw]);
    for (const row of rows) {
      const entryId = await saveEntry(db, range, 'expense', row.expense_id, row.vendor_name || `Expense ${row.expense_id}`, 'Operating expense', row.expense_date || range.start, entryBlueprintForExpense(row));
      if (entryId) entriesCreated += 1;
    }
  }

  if (hasWriteoffs) {
    const rows = await safeAll(db, `
      SELECT writeoff_id, writeoff_date, item_name, product_name, amount, total_amount
      FROM accounting_writeoffs
      WHERE substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 7) = ?
    `, [range.raw]);
    for (const row of rows) {
      const ref = normalizeText(row.item_name || row.product_name || `Write-Off ${row.writeoff_id}`);
      const entryId = await saveEntry(db, range, 'writeoff', row.writeoff_id, ref, 'Inventory or cost write-off', row.writeoff_date || range.start, entryBlueprintForWriteoff(row));
      if (entryId) entriesCreated += 1;
    }
  }

  if (hasOverhead) {
    const rows = await safeAll(db, `
      SELECT allocation_id, ledger_code, ledger_name, amount_cents, period_month
      FROM accounting_overhead_allocations
      WHERE period_month = ?
    `, [range.raw]);
    for (const row of rows) {
      const ref = normalizeText(row.ledger_code || row.ledger_name || `Overhead ${row.allocation_id}`);
      const entryId = await saveEntry(db, range, 'overhead_allocation', row.allocation_id, ref, 'Overhead allocation pool', range.start, entryBlueprintForOverhead(row));
      if (entryId) entriesCreated += 1;
    }
  }

  return entriesCreated;
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  await ensureTables(db);

  const url = new URL(context.request.url);
  const range = monthRange(url.searchParams.get('month'));
  if (!range) return json({ ok: false, error: 'Please provide month in YYYY-MM format.' }, 400);

  const summary = await db.prepare(`
    SELECT
      COUNT(*) AS entry_count,
      COALESCE(SUM(total_debit_cents), 0) AS total_debit_cents,
      COALESCE(SUM(total_credit_cents), 0) AS total_credit_cents,
      SUM(CASE WHEN is_balanced = 1 THEN 1 ELSE 0 END) AS balanced_entry_count,
      SUM(CASE WHEN is_balanced = 0 THEN 1 ELSE 0 END) AS imbalance_count
    FROM accounting_journal_entries
    WHERE period_month = ?
  `).bind(range.raw).first().catch(() => ({}));

  const entries = normalizeResults(await db.prepare(`
    SELECT
      e.accounting_journal_entry_id,
      e.period_month,
      e.entry_date,
      e.source_type,
      e.source_id,
      e.source_reference,
      e.memo,
      e.is_balanced,
      e.total_debit_cents,
      e.total_credit_cents,
      COALESCE(SUM(CASE WHEN l.entry_side = 'debit' THEN 1 ELSE 0 END), 0) AS debit_line_count,
      COALESCE(SUM(CASE WHEN l.entry_side = 'credit' THEN 1 ELSE 0 END), 0) AS credit_line_count
    FROM accounting_journal_entries e
    LEFT JOIN accounting_journal_lines l ON l.accounting_journal_entry_id = e.accounting_journal_entry_id
    WHERE e.period_month = ?
    GROUP BY e.accounting_journal_entry_id
    ORDER BY COALESCE(e.entry_date, e.created_at) DESC, e.accounting_journal_entry_id DESC
    LIMIT 100
  `).bind(range.raw).all()));

  const ledgerSummary = normalizeResults(await db.prepare(`
    SELECT
      l.ledger_code,
      l.ledger_name,
      SUM(CASE WHEN l.entry_side = 'debit' THEN l.amount_cents ELSE 0 END) AS debit_cents,
      SUM(CASE WHEN l.entry_side = 'credit' THEN l.amount_cents ELSE 0 END) AS credit_cents,
      COUNT(*) AS line_count
    FROM accounting_journal_lines l
    INNER JOIN accounting_journal_entries e ON e.accounting_journal_entry_id = l.accounting_journal_entry_id
    WHERE e.period_month = ?
    GROUP BY l.ledger_code, l.ledger_name
    ORDER BY l.ledger_code ASC, l.ledger_name ASC
  `).bind(range.raw).all()));

  return json({
    ok: true,
    period: range.raw,
    summary: {
      entry_count: Number(summary?.entry_count || 0),
      balanced_entry_count: Number(summary?.balanced_entry_count || 0),
      imbalance_count: Number(summary?.imbalance_count || 0),
      total_debit_cents: Number(summary?.total_debit_cents || 0),
      total_credit_cents: Number(summary?.total_credit_cents || 0),
    },
    entries: entries.map((row) => ({
      accounting_journal_entry_id: Number(row.accounting_journal_entry_id || 0),
      period_month: row.period_month || range.raw,
      entry_date: row.entry_date || null,
      source_type: row.source_type || '',
      source_id: row.source_id || '',
      source_reference: row.source_reference || '',
      memo: row.memo || '',
      is_balanced: Number(row.is_balanced || 0) === 1,
      total_debit_cents: Number(row.total_debit_cents || 0),
      total_credit_cents: Number(row.total_credit_cents || 0),
      debit_line_count: Number(row.debit_line_count || 0),
      credit_line_count: Number(row.credit_line_count || 0),
    })),
    ledger_summary: ledgerSummary.map((row) => ({
      ledger_code: row.ledger_code || '',
      ledger_name: row.ledger_name || '',
      debit_cents: Number(row.debit_cents || 0),
      credit_cents: Number(row.credit_cents || 0),
      line_count: Number(row.line_count || 0),
    })),
  });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = normalizeText(body.action || 'sync_month').toLowerCase();
  if (action !== 'sync_month') return json({ ok: false, error: 'Unsupported action.' }, 400);

  const range = monthRange(body.month || body.period_month);
  if (!range) return json({ ok: false, error: 'Please provide month in YYYY-MM format.' }, 400);

  const entriesCreated = await syncMonth(db, range);

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'sync_accounting_journal_month',
    target_type: 'accounting_journal',
    target_key: range.raw,
    details: { period_month: range.raw, entries_created: entriesCreated }
  });

  return json({ ok: true, period: range.raw, entries_created });
}
