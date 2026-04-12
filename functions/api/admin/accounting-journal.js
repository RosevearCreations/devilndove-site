import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status, { "Cache-Control": "no-store" });
}

function monthRange(monthValue) {
  const raw = String(monthValue || "").trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;

  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;

  return { raw, start, end };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function asInt(value) {
  return Math.round(Number(value || 0));
}

async function safeFirst(db, sql, bindings = [], fallback = {}) {
  try {
    const row = await db.prepare(sql).bind(...bindings).first();
    return row || fallback;
  } catch {
    return fallback;
  }
}

async function safeAll(db, sql, bindings = []) {
  try {
    const result = await db.prepare(sql).bind(...bindings).all();
    return normalizeResults(result);
  } catch {
    return [];
  }
}

async function tableExists(db, tableName) {
  try {
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
      .bind(tableName)
      .first();
    return !!row;
  } catch {
    return false;
  }
}

async function ensureJournalSchema(db) {
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

  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_period ON accounting_journal_entries(period_month, entry_date DESC, accounting_journal_entry_id DESC)"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_source ON accounting_journal_entries(source_type, source_id, period_month)"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_balance ON accounting_journal_entries(period_month, is_balanced, created_at DESC)"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_entry ON accounting_journal_lines(accounting_journal_entry_id, line_order ASC)"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_ledger ON accounting_journal_lines(ledger_code, entry_side, created_at DESC)"
  ).run();
}

function buildRevenueLines(summary) {
  const cashGross = asInt(summary.cash_gross_cents);
  const taxRecognized = asInt(summary.tax_recognized_cents);
  const salesRecognized = Math.max(0, cashGross - taxRecognized);

  const lines = [
    {
      ledger_code: "1000",
      ledger_name: "Cash Clearing",
      entry_side: "debit",
      amount_cents: cashGross,
      memo: "Recognized cash receipts",
    },
    {
      ledger_code: "4000",
      ledger_name: "Sales Revenue",
      entry_side: "credit",
      amount_cents: salesRecognized,
      memo: "Recognized sales before tax",
    },
    {
      ledger_code: "2300",
      ledger_name: "Sales Tax Payable",
      entry_side: "credit",
      amount_cents: taxRecognized,
      memo: "Recognized sales tax liability",
    },
  ];

  return lines.filter((line) => Number(line.amount_cents || 0) > 0);
}

function buildExpenseLines(group) {
  const total = asInt(group.total_cents);
  if (total <= 0) return [];

  return [
    {
      ledger_code: normalizeText(group.ledger_code) || "6100",
      ledger_name: normalizeText(group.ledger_name) || "Operating Expense",
      entry_side: "debit",
      amount_cents: total,
      memo: `${normalizeText(group.ledger_name) || "Expense"} for ${normalizeText(group.period_month)}`,
    },
    {
      ledger_code: "2100",
      ledger_name: "Accounts Payable",
      entry_side: "credit",
      amount_cents: total,
      memo: "Expense accrual",
    },
  ];
}

function buildWriteoffLines(group) {
  const total = asInt(group.total_cents);
  if (total <= 0) return [];

  return [
    {
      ledger_code: normalizeText(group.ledger_code) || "6900",
      ledger_name: normalizeText(group.ledger_name) || "Write-Off Expense",
      entry_side: "debit",
      amount_cents: total,
      memo: `${normalizeText(group.ledger_name) || "Write-Off"} for ${normalizeText(group.period_month)}`,
    },
    {
      ledger_code: "1400",
      ledger_name: "Inventory / Asset Clearing",
      entry_side: "credit",
      amount_cents: total,
      memo: "Write-off clearing",
    },
  ];
}

function buildOverheadLines(group) {
  const total = asInt(group.total_cents);
  if (total <= 0) return [];

  return [
    {
      ledger_code: normalizeText(group.ledger_code) || "6200",
      ledger_name: normalizeText(group.ledger_name) || "Allocated Overhead",
      entry_side: "debit",
      amount_cents: total,
      memo: `${normalizeText(group.ledger_name) || "Allocated Overhead"} for ${normalizeText(group.period_month)}`,
    },
    {
      ledger_code: "2190",
      ledger_name: "Overhead Clearing",
      entry_side: "credit",
      amount_cents: total,
      memo: "Allocated overhead clearing",
    },
  ];
}

function summarizeLines(lines) {
  let totalDebit = 0;
  let totalCredit = 0;

  const normalized = lines
    .map((line, index) => {
      const entrySide = String(line.entry_side || "").toLowerCase() === "credit" ? "credit" : "debit";
      const amount = Math.max(0, asInt(line.amount_cents));
      if (!amount) return null;
      if (entrySide === "debit") totalDebit += amount;
      else totalCredit += amount;
      return {
        line_order: index + 1,
        ledger_code: normalizeText(line.ledger_code) || "0000",
        ledger_name: normalizeText(line.ledger_name) || "Unmapped Ledger",
        entry_side: entrySide,
        amount_cents: amount,
        memo: normalizeText(line.memo) || null,
      };
    })
    .filter(Boolean);

  return {
    lines: normalized,
    total_debit_cents: totalDebit,
    total_credit_cents: totalCredit,
    is_balanced: totalDebit === totalCredit ? 1 : 0,
    imbalance_cents: totalDebit - totalCredit,
  };
}

async function deleteManagedEntries(db, periodMonth) {
  await db.prepare(`
    DELETE FROM accounting_journal_entries
    WHERE period_month = ?
      AND source_type IN ('revenue_summary', 'expense_summary', 'writeoff_summary', 'overhead_summary')
  `).bind(periodMonth).run();
}

async function upsertEntry(db, periodMonth, entryDate, sourceType, sourceId, memo, lines, sourceReference = null) {
  const summary = summarizeLines(lines);
  if (!summary.lines.length) return null;

  await db.prepare(`
    INSERT INTO accounting_journal_entries (
      period_month,
      entry_date,
      source_type,
      source_id,
      source_reference,
      memo,
      is_balanced,
      total_debit_cents,
      total_credit_cents,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(period_month, source_type, source_id) DO UPDATE SET
      entry_date = excluded.entry_date,
      source_reference = excluded.source_reference,
      memo = excluded.memo,
      is_balanced = excluded.is_balanced,
      total_debit_cents = excluded.total_debit_cents,
      total_credit_cents = excluded.total_credit_cents,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    periodMonth,
    entryDate,
    sourceType,
    sourceId,
    sourceReference,
    memo,
    summary.is_balanced,
    summary.total_debit_cents,
    summary.total_credit_cents
  ).run();

  const entry = await db.prepare(`
    SELECT
      accounting_journal_entry_id,
      period_month,
      entry_date,
      source_type,
      source_id,
      source_reference,
      memo,
      is_balanced,
      total_debit_cents,
      total_credit_cents,
      created_at,
      updated_at
    FROM accounting_journal_entries
    WHERE period_month = ? AND source_type = ? AND source_id = ?
    LIMIT 1
  `).bind(periodMonth, sourceType, sourceId).first();

  if (!entry?.accounting_journal_entry_id) return null;

  await db.prepare("DELETE FROM accounting_journal_lines WHERE accounting_journal_entry_id = ?")
    .bind(entry.accounting_journal_entry_id)
    .run();

  for (const line of summary.lines) {
    await db.prepare(`
      INSERT INTO accounting_journal_lines (
        accounting_journal_entry_id,
        line_order,
        ledger_code,
        ledger_name,
        entry_side,
        amount_cents,
        memo,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      entry.accounting_journal_entry_id,
      line.line_order,
      line.ledger_code,
      line.ledger_name,
      line.entry_side,
      line.amount_cents,
      line.memo
    ).run();
  }

  return {
    ...entry,
    lines: summary.lines,
    imbalance_cents: summary.imbalance_cents,
  };
}

async function loadSourceSummaries(db, range) {
  const hasOrders = await tableExists(db, "accounting_order_records");
  const hasExpenses = await tableExists(db, "accounting_expenses");
  const hasWriteoffs = await tableExists(db, "accounting_writeoffs");
  const hasOverhead = await tableExists(db, "accounting_overhead_allocations");

  const revenueSummary = hasOrders
    ? await safeFirst(
        db,
        `
          SELECT
            COALESCE(SUM(COALESCE(amount_paid_cents, 0)), 0) AS cash_gross_cents,
            COALESCE(SUM(COALESCE(tax_liability_cents, 0)), 0) AS tax_recognized_cents,
            COALESCE(SUM(COALESCE(amount_outstanding_cents, 0)), 0) AS outstanding_cents,
            COUNT(*) AS order_count
          FROM accounting_order_records
          WHERE substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')), 1, 10) >= ?
            AND substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')), 1, 10) < ?
        `,
        [range.start, range.end],
        { cash_gross_cents: 0, tax_recognized_cents: 0, outstanding_cents: 0, order_count: 0 }
      )
    : { cash_gross_cents: 0, tax_recognized_cents: 0, outstanding_cents: 0, order_count: 0 };

  const expenseGroups = hasExpenses
    ? await safeAll(
        db,
        `
          SELECT
            ? AS period_month,
            COALESCE(NULLIF(ledger_code, ''), '6100') AS ledger_code,
            COALESCE(NULLIF(ledger_name, ''), 'Operating Expense') AS ledger_name,
            COALESCE(SUM(CAST(ROUND((COALESCE(amount, 0) + COALESCE(tax_amount, 0)) * 100.0) AS INTEGER)), 0) AS total_cents,
            COUNT(*) AS entry_count
          FROM accounting_expenses
          WHERE substr(COALESCE(expense_date, created_at, datetime('now')), 1, 10) >= ?
            AND substr(COALESCE(expense_date, created_at, datetime('now')), 1, 10) < ?
          GROUP BY COALESCE(NULLIF(ledger_code, ''), '6100'), COALESCE(NULLIF(ledger_name, ''), 'Operating Expense')
          HAVING COALESCE(SUM(CAST(ROUND((COALESCE(amount, 0) + COALESCE(tax_amount, 0)) * 100.0) AS INTEGER)), 0) > 0
          ORDER BY total_cents DESC, ledger_name ASC
        `,
        [range.raw, range.start, range.end]
      )
    : [];

  const writeoffGroups = hasWriteoffs
    ? await safeAll(
        db,
        `
          SELECT
            ? AS period_month,
            COALESCE(NULLIF(ledger_code, ''), '6900') AS ledger_code,
            COALESCE(NULLIF(ledger_name, ''), 'Write-Off Expense') AS ledger_name,
            COALESCE(SUM(CAST(ROUND(COALESCE(amount, 0) * 100.0) AS INTEGER)), 0) AS total_cents,
            COUNT(*) AS entry_count
          FROM accounting_writeoffs
          WHERE substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 10) >= ?
            AND substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 10) < ?
          GROUP BY COALESCE(NULLIF(ledger_code, ''), '6900'), COALESCE(NULLIF(ledger_name, ''), 'Write-Off Expense')
          HAVING COALESCE(SUM(CAST(ROUND(COALESCE(amount, 0) * 100.0) AS INTEGER)), 0) > 0
          ORDER BY total_cents DESC, ledger_name ASC
        `,
        [range.raw, range.start, range.end]
      )
    : [];

  const overheadGroups = hasOverhead
    ? await safeAll(
        db,
        `
          SELECT
            ? AS period_month,
            COALESCE(NULLIF(ledger_code, ''), '6200') AS ledger_code,
            COALESCE(NULLIF(ledger_name, ''), 'Allocated Overhead') AS ledger_name,
            COALESCE(SUM(COALESCE(amount_cents, 0)), 0) AS total_cents,
            COUNT(*) AS entry_count,
            COALESCE(MIN(allocation_basis), 'manual') AS allocation_basis
          FROM accounting_overhead_allocations
          WHERE period_month = ?
          GROUP BY COALESCE(NULLIF(ledger_code, ''), '6200'), COALESCE(NULLIF(ledger_name, ''), 'Allocated Overhead')
          HAVING COALESCE(SUM(COALESCE(amount_cents, 0)), 0) > 0
          ORDER BY total_cents DESC, ledger_name ASC
        `,
        [range.raw, range.raw]
      )
    : [];

  return { revenueSummary, expenseGroups, writeoffGroups, overheadGroups };
}

async function syncJournal(db, range) {
  await ensureJournalSchema(db);
  await deleteManagedEntries(db, range.raw);

  const { revenueSummary, expenseGroups, writeoffGroups, overheadGroups } = await loadSourceSummaries(db, range);
  const upserts = [];

  const revenueLines = buildRevenueLines(revenueSummary);
  if (revenueLines.length) {
    const entry = await upsertEntry(
      db,
      range.raw,
      range.end,
      "revenue_summary",
      `${range.raw}:revenue`,
      `Recognized cash receipts and sales tax for ${range.raw}`,
      revenueLines,
      `REV-${range.raw}`
    );
    if (entry) upserts.push(entry);
  }

  for (const group of expenseGroups) {
    const ledgerCode = normalizeText(group.ledger_code) || "6100";
    const entry = await upsertEntry(
      db,
      range.raw,
      range.end,
      "expense_summary",
      `${range.raw}:expense:${ledgerCode}`,
      `${normalizeText(group.ledger_name) || "Operating Expense"} summary for ${range.raw}`,
      buildExpenseLines(group),
      `EXP-${range.raw}-${ledgerCode}`
    );
    if (entry) upserts.push(entry);
  }

  for (const group of writeoffGroups) {
    const ledgerCode = normalizeText(group.ledger_code) || "6900";
    const entry = await upsertEntry(
      db,
      range.raw,
      range.end,
      "writeoff_summary",
      `${range.raw}:writeoff:${ledgerCode}`,
      `${normalizeText(group.ledger_name) || "Write-Off Expense"} summary for ${range.raw}`,
      buildWriteoffLines(group),
      `WRO-${range.raw}-${ledgerCode}`
    );
    if (entry) upserts.push(entry);
  }

  for (const group of overheadGroups) {
    const ledgerCode = normalizeText(group.ledger_code) || "6200";
    const entry = await upsertEntry(
      db,
      range.raw,
      range.end,
      "overhead_summary",
      `${range.raw}:overhead:${ledgerCode}`,
      `${normalizeText(group.ledger_name) || "Allocated Overhead"} summary for ${range.raw}`,
      buildOverheadLines(group),
      `OVH-${range.raw}-${ledgerCode}`
    );
    if (entry) upserts.push(entry);
  }

  return {
    synced_entry_count: upserts.length,
    revenue_order_count: Number(revenueSummary.order_count || 0),
    expense_group_count: expenseGroups.length,
    writeoff_group_count: writeoffGroups.length,
    overhead_group_count: overheadGroups.length,
  };
}

async function fetchJournal(db, periodMonth) {
  await ensureJournalSchema(db);

  const entries = await safeAll(
    db,
    `
      SELECT
        accounting_journal_entry_id,
        period_month,
        entry_date,
        source_type,
        source_id,
        source_reference,
        memo,
        is_balanced,
        total_debit_cents,
        total_credit_cents,
        created_at,
        updated_at
      FROM accounting_journal_entries
      WHERE period_month = ?
      ORDER BY entry_date DESC, accounting_journal_entry_id DESC
    `,
    [periodMonth]
  );

  const lines = await safeAll(
    db,
    `
      SELECT
        accounting_journal_line_id,
        accounting_journal_entry_id,
        line_order,
        ledger_code,
        ledger_name,
        entry_side,
        amount_cents,
        memo,
        created_at
      FROM accounting_journal_lines
      WHERE accounting_journal_entry_id IN (
        SELECT accounting_journal_entry_id
        FROM accounting_journal_entries
        WHERE period_month = ?
      )
      ORDER BY accounting_journal_entry_id DESC, line_order ASC
    `,
    [periodMonth]
  );

  const lineMap = new Map();
  const ledgerMap = new Map();
  for (const line of lines) {
    const entryId = Number(line.accounting_journal_entry_id || 0);
    if (!lineMap.has(entryId)) lineMap.set(entryId, []);
    const normalizedLine = {
      accounting_journal_line_id: Number(line.accounting_journal_line_id || 0),
      accounting_journal_entry_id: entryId,
      line_order: Number(line.line_order || 0),
      ledger_code: line.ledger_code || "",
      ledger_name: line.ledger_name || "",
      entry_side: line.entry_side || "debit",
      amount_cents: Number(line.amount_cents || 0),
      memo: line.memo || "",
      created_at: line.created_at || null,
      debit_cents: String(line.entry_side || "").toLowerCase() === "debit" ? Number(line.amount_cents || 0) : 0,
      credit_cents: String(line.entry_side || "").toLowerCase() === "credit" ? Number(line.amount_cents || 0) : 0,
    };
    lineMap.get(entryId).push(normalizedLine);

    const ledgerKey = `${normalizedLine.ledger_code}::${normalizedLine.ledger_name}`;
    const existingLedger = ledgerMap.get(ledgerKey) || {
      ledger_code: normalizedLine.ledger_code,
      ledger_name: normalizedLine.ledger_name,
      debit_cents: 0,
      credit_cents: 0,
    };
    existingLedger.debit_cents += normalizedLine.debit_cents;
    existingLedger.credit_cents += normalizedLine.credit_cents;
    ledgerMap.set(ledgerKey, existingLedger);
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let balancedEntryCount = 0;
  let imbalanceCount = 0;

  const normalizedEntries = entries.map((entry) => {
    const debit = Number(entry.total_debit_cents || 0);
    const credit = Number(entry.total_credit_cents || 0);
    const isBalanced = Number(entry.is_balanced || 0) === 1;
    totalDebit += debit;
    totalCredit += credit;
    if (isBalanced) balancedEntryCount += 1;
    else imbalanceCount += 1;

    return {
      accounting_journal_entry_id: Number(entry.accounting_journal_entry_id || 0),
      period_month: entry.period_month || periodMonth,
      entry_date: entry.entry_date || "",
      source_type: entry.source_type || "",
      source_id: entry.source_id || "",
      source_reference: entry.source_reference || "",
      memo: entry.memo || "",
      is_balanced: isBalanced ? 1 : 0,
      total_debit_cents: debit,
      total_credit_cents: credit,
      imbalance_cents: debit - credit,
      created_at: entry.created_at || null,
      updated_at: entry.updated_at || null,
      lines: lineMap.get(Number(entry.accounting_journal_entry_id || 0)) || [],
    };
  });

  const ledgerSummary = Array.from(ledgerMap.values()).sort((a, b) => {
    if (a.ledger_code !== b.ledger_code) return String(a.ledger_code).localeCompare(String(b.ledger_code));
    return String(a.ledger_name).localeCompare(String(b.ledger_name));
  });

  return {
    entries: normalizedEntries,
    ledger_summary: ledgerSummary,
    summary: {
      entry_count: normalizedEntries.length,
      balanced_entry_count: balancedEntryCount,
      imbalance_count: imbalanceCount,
      total_debit_cents: totalDebit,
      total_credit_cents: totalCredit,
      journal_imbalance_cents: totalDebit - totalCredit,
    },
  };
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleGet(context, db) {
  const url = new URL(context.request.url);
  const range = monthRange(url.searchParams.get("month") || new Date().toISOString().slice(0, 7));
  if (!range) {
    return json({ ok: false, error: "Please provide month in YYYY-MM format." }, 400);
  }

  const journal = await fetchJournal(db, range.raw);
  return json({ ok: true, period: range.raw, ...journal });
}

async function handlePost(context, db, adminUser) {
  const body = await readJsonBody(context.request);
  const action = normalizeText(body.action || "sync_month").toLowerCase();
  const range = monthRange(body.month || new Date().toISOString().slice(0, 7));
  if (!range) {
    return json({ ok: false, error: "Please provide month in YYYY-MM format." }, 400);
  }

  try {
    if (action === "clear_month") {
      await ensureJournalSchema(db);
      await deleteManagedEntries(db, range.raw);
      await auditAdminAction(context.env, context.request, adminUser, {
        action_type: "accounting_journal_clear",
        target_type: "accounting_journal",
        target_key: range.raw,
        details: { month: range.raw },
      });
      const journal = await fetchJournal(db, range.raw);
      return json({ ok: true, period: range.raw, cleared: true, ...journal });
    }

    const syncResult = await syncJournal(db, range);
    const journal = await fetchJournal(db, range.raw);

    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: "accounting_journal_sync",
      target_type: "accounting_journal",
      target_key: range.raw,
      details: syncResult,
    });

    return json({ ok: true, period: range.raw, sync_result: syncResult, ...journal });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: "accounting_journal",
      incident_code: "journal_sync_failed",
      severity: "error",
      message: "Failed to sync monthly accounting journal.",
      related_user_id: Number(adminUser.user_id || 0),
      details: {
        month: range.raw,
        action,
        error: String(error?.message || error || "Unknown error"),
      },
    });

    return json(
      {
        ok: false,
        error: action === "clear_month"
          ? "Could not clear accounting journal rows for this month."
          : "Could not sync accounting journal for this month.",
        period: range.raw,
      },
      500
    );
  }
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: "Admin access required." }, 401);

  return handleGet(context, db);
}

export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: "Admin access required." }, 401);

  return handlePost(context, db, adminUser);
}
