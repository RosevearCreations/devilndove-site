import { serviceHeaders } from "./staff-auth.js";

export function roundMoney(value) {
  const num = Number(value || 0);
  return Math.round((Number.isFinite(num) ? num : 0) * 100) / 100;
}

export async function loadAccounts(env) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/accounting_accounts?select=*&order=sort_order.asc,code.asc`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) throw new Error(`Could not load accounting accounts. ${await res.text()}`);
  return await res.json().catch(() => []);
}

export async function postJournalEntry(env, entry, lines) {
  const headers = serviceHeaders(env);
  const debits = roundMoney(
    lines.filter((x) => x.direction === "debit").reduce((s, x) => s + Number(x.amount_cad || 0), 0)
  );
  const credits = roundMoney(
    lines.filter((x) => x.direction === "credit").reduce((s, x) => s + Number(x.amount_cad || 0), 0)
  );
  if (debits <= 0 || credits <= 0 || debits !== credits) {
    throw new Error("Journal entry is not balanced.");
  }
  await assertPeriodWritable(env, entry?.entry_date);

  const entryRes = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_journal_entries`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify([
      {
        ...entry,
        subtotal_cad: roundMoney(entry.subtotal_cad),
        tax_cad: roundMoney(entry.tax_cad),
        total_cad: roundMoney(entry.total_cad)
      }
    ])
  });
  if (!entryRes.ok) throw new Error(`Could not save journal entry. ${await entryRes.text()}`);
  const createdRows = await entryRes.json().catch(() => []);
  const created = Array.isArray(createdRows) ? createdRows[0] : null;
  if (!created?.id) throw new Error("Could not save journal entry.");

  const linePayload = lines.map((line, idx) => ({
    entry_id: created.id,
    line_order: idx + 1,
    account_code: line.account_code,
    direction: line.direction,
    amount_cad: roundMoney(line.amount_cad),
    memo: line.memo || null
  }));
  const lineRes = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_journal_lines`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(linePayload)
  });
  if (!lineRes.ok) throw new Error(`Could not save journal lines. ${await lineRes.text()}`);
  const createdLines = await lineRes.json().catch(() => []);
  return { entry: created, lines: createdLines };
}

export async function buildMonthlyReport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year });
  const byAccount = {};
  const totals = { revenue: 0, expense: 0, asset: 0, liability: 0, equity: 0, net_income: 0 };

  for (const row of rows) {
    const parsed = signedAmountForRow(row);
    const account = row.account || {};
    byAccount[row.account_code] ||= {
      account_code: row.account_code,
      label: account.label || row.account_code,
      account_type: account.account_type || "expense",
      account_group: account.account_group || null,
      amount_cad: 0
    };
    byAccount[row.account_code].amount_cad = roundMoney(
      byAccount[row.account_code].amount_cad + parsed.signed_amount_cad
    );
    const type = String(parsed.account_type || "expense");
    totals[type] = roundMoney((totals[type] || 0) + parsed.signed_amount_cad);
  }

  totals.net_income = roundMoney((totals.revenue || 0) - (totals.expense || 0));
  const { start, nextMonth } = monthRange(month, year);

  return {
    month,
    year,
    period_start: start,
    period_end_exclusive: nextMonth,
    by_account: Object.values(byAccount).sort((a, b) => String(a.label).localeCompare(String(b.label))),
    totals
  };
}

export async function listPayables(env, { status = "open" } = {}) {
  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=*&entry_type=eq.vendor_bill&order=entry_date.desc,created_at.desc&limit=250`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load payables. ${await res.text()}`);
  const rows = await res.json().catch(() => []);

  const payables = [];
  for (const entry of rows) {
    const settled = await loadSettlementsForEntry(env, entry.id);
    const settledAmount = roundMoney(
      settled.reduce((sum, row) => sum + Number(row.total_cad || 0), 0)
    );
    const total = roundMoney(entry.total_cad || 0);
    const balance = roundMoney(total - settledAmount);
    const paymentStatus = balance <= 0 ? "paid" : settledAmount > 0 ? "partial" : "open";
    if (status !== "all" && paymentStatus !== status) continue;

    payables.push({
      ...entry,
      settled_amount_cad: settledAmount,
      balance_due_cad: balance,
      payment_status: paymentStatus,
      settlements: settled
    });
  }

  return payables;
}

export async function settlePayable(env, {
  entry_id,
  amount_cad,
  payment_account = "cash",
  payment_date,
  memo = null,
  actorName = null,
  actorStaffUserId = null
}) {
  const headers = serviceHeaders(env);
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=*&id=eq.${encodeURIComponent(entry_id)}&limit=1`,
    { headers }
  );
  if (!res.ok) throw new Error(`Could not load payable entry. ${await res.text()}`);
  const bill = (await res.json().catch(() => []))[0];
  if (!bill) throw new Error("Payable entry not found.");

  const existingSettled = await loadSettlementsForEntry(env, entry_id);
  const already = roundMoney(
    existingSettled.reduce((s, row) => s + Number(row.total_cad || 0), 0)
  );
  const total = roundMoney(bill.total_cad || 0);
  const remaining = roundMoney(total - already);
  const settleAmount = amount_cad == null ? remaining : roundMoney(amount_cad);

  if (settleAmount <= 0) throw new Error("Settlement amount must be greater than zero.");
  if (settleAmount > remaining) {
    throw new Error("Settlement amount is greater than the remaining payable balance.");
  }

  const entryType = settleAmount === remaining ? "payable_settlement" : "payable_partial_settlement";
  return await postJournalEntry(env, {
    entry_date: payment_date || new Date().toISOString().slice(0, 10),
    entry_type: entryType,
    status: "posted",
    reference_type: "payable_settlement",
    reference_id: entry_id,
    settlement_of_entry_id: entry_id,
    payee_name: bill.payee_name || bill.vendor_name || null,
    vendor_name: bill.vendor_name || bill.payee_name || null,
    memo: memo || `Settlement for payable ${entry_id}`,
    subtotal_cad: settleAmount,
    tax_cad: 0,
    total_cad: settleAmount,
    paid_at: new Date().toISOString(),
    created_by_name: actorName,
    last_recorded_by_name: actorName,
    created_by_staff_user_id: actorStaffUserId,
    last_recorded_by_staff_user_id: actorStaffUserId
  }, [
    {
      account_code: "accounts_payable",
      direction: "debit",
      amount_cad: settleAmount,
      memo: memo || `Settlement for payable ${entry_id}`
    },
    {
      account_code: payment_account,
      direction: "credit",
      amount_cad: settleAmount,
      memo: memo || `Settlement for payable ${entry_id}`
    }
  ]);
}

export async function buildTaxReport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year, accountCode: "sales_tax_payable" });
  let net = 0;
  for (const row of rows) net = roundMoney(net + signedAmountForRow(row).signed_amount_cad);

  const collected = roundMoney(
    rows
      .filter((r) => String(r.direction) === "credit")
      .reduce((s, r) => s + Number(r.amount_cad || 0), 0)
  );
  const credits = roundMoney(
    rows
      .filter((r) => String(r.direction) === "credit")
      .reduce((s, r) => s + Number(r.amount_cad || 0), 0)
  );
  const debits = roundMoney(
    rows
      .filter((r) => String(r.direction) === "debit")
      .reduce((s, r) => s + Number(r.amount_cad || 0), 0)
  );

  return {
    month,
    year,
    collected_tax_cad: collected,
    tax_account_credits_cad: credits,
    tax_account_debits_cad: debits,
    net_tax_payable_cad: net,
    suggested_remittance_cad: Math.max(0, net),
    rows
  };
}

export async function postTaxRemittance(env, {
  amount_cad = null,
  payment_account = "cash",
  payment_date = null,
  memo = null,
  actorName = null,
  actorStaffUserId = null,
  referenceLabel = null
}) {
  const settleDate = payment_date || new Date().toISOString().slice(0, 10);
  const currentPayable = await loadAccountBalanceThroughDate(
    env,
    "sales_tax_payable",
    addDays(settleDate, 1)
  );
  const outstanding = Math.max(0, roundMoney(currentPayable));
  const remittanceAmount = amount_cad == null ? outstanding : roundMoney(amount_cad);

  if (remittanceAmount <= 0) {
    throw new Error("There is no tax remittance amount available to post.");
  }
  if (remittanceAmount > outstanding) {
    throw new Error("Remittance amount is greater than the current sales tax payable balance.");
  }

  const label = referenceLabel || settleDate.slice(0, 7);
  return await postJournalEntry(env, {
    entry_date: settleDate,
    entry_type: "tax_remittance",
    status: "posted",
    reference_type: "tax_remittance",
    reference_id: label,
    memo: memo || `Sales tax remittance for ${label}`,
    subtotal_cad: remittanceAmount,
    tax_cad: 0,
    total_cad: remittanceAmount,
    paid_at: new Date().toISOString(),
    created_by_name: actorName,
    last_recorded_by_name: actorName,
    created_by_staff_user_id: actorStaffUserId,
    last_recorded_by_staff_user_id: actorStaffUserId
  }, [
    {
      account_code: "sales_tax_payable",
      direction: "debit",
      amount_cad: remittanceAmount,
      memo: memo || `Sales tax remittance for ${label}`
    },
    {
      account_code: payment_account,
      direction: "credit",
      amount_cad: remittanceAmount,
      memo: memo || `Sales tax remittance for ${label}`
    }
  ]);
}

export async function buildOwnerEquityReport(env, { month, year }) {
  const ownerDrawRows = await loadPostedLineRows(env, { month, year, accountCode: "owner_draw" });
  const equityRows = await loadPostedLineRows(env, { month, year, accountCode: "owner_equity" });
  const ownerDrawTotal = roundMoney(
    ownerDrawRows.reduce((s, r) => s + signedAmountForRow(r).signed_amount_cad, 0)
  );
  const ownerEquityDelta = roundMoney(
    equityRows.reduce((s, r) => s + signedAmountForRow(r).signed_amount_cad, 0)
  );

  return {
    month,
    year,
    owner_draw_cad: ownerDrawTotal,
    owner_equity_delta_cad: ownerEquityDelta,
    rows: {
      owner_draw: ownerDrawRows,
      owner_equity: equityRows
    }
  };
}

export async function buildBalanceSheetReport(env, { month, year }) {
  const { nextMonth } = monthRange(month, year);
  const rows = await loadPostedLineRows(env, { startDate: "2020-01-01", endDateExclusive: nextMonth });

  const assets = [];
  const liabilities = [];
  const equityAccounts = [];
  let netIncomeToDate = 0;
  const buckets = {};

  for (const row of rows) {
    const parsed = signedAmountForRow(row);
    const account = row.account || {};
    const type = String(account.account_type || "expense");
    const code = row.account_code;

    buckets[code] ||= {
      account_code: code,
      label: account.label || code,
      account_type: type,
      account_group: account.account_group || null,
      amount_cad: 0
    };
    buckets[code].amount_cad = roundMoney(
      buckets[code].amount_cad + parsed.signed_amount_cad
    );

    if (type === "revenue") netIncomeToDate = roundMoney(netIncomeToDate + parsed.signed_amount_cad);
    if (type === "expense") netIncomeToDate = roundMoney(netIncomeToDate - parsed.signed_amount_cad);
  }

  for (const row of Object.values(buckets)) {
    if (!row.amount_cad) continue;
    if (row.account_type === "asset") assets.push(row);
    if (row.account_type === "liability") liabilities.push(row);
    if (row.account_type === "equity") equityAccounts.push(row);
  }

  const totalAssets = roundMoney(assets.reduce((s, r) => s + Number(r.amount_cad || 0), 0));
  const totalLiabilities = roundMoney(liabilities.reduce((s, r) => s + Number(r.amount_cad || 0), 0));
  const totalEquityAccounts = roundMoney(
    equityAccounts.reduce((s, r) => s + Number(r.amount_cad || 0), 0)
  );
  const totalEquity = roundMoney(totalEquityAccounts + netIncomeToDate);
  const liabilitiesAndEquity = roundMoney(totalLiabilities + totalEquity);

  return {
    month,
    year,
    as_of: addDays(nextMonth, -1),
    sections: {
      assets: assets.sort(sortByLabel),
      liabilities: liabilities.sort(sortByLabel),
      equity: equityAccounts.sort(sortByLabel)
    },
    totals: {
      assets_cad: totalAssets,
      liabilities_cad: totalLiabilities,
      equity_accounts_cad: totalEquityAccounts,
      retained_earnings_cad: netIncomeToDate,
      equity_total_cad: totalEquity,
      liabilities_and_equity_cad: liabilitiesAndEquity,
      balance_delta_cad: roundMoney(totalAssets - liabilitiesAndEquity)
    }
  };
}

export async function buildCashFlowReport(env, { month, year }) {
  const { start, nextMonth } = monthRange(month, year);
  const rows = await loadPostedLineRows(env, { startDate: start, endDateExclusive: nextMonth });
  const grouped = new Map();

  for (const row of rows) {
    const key = row.entry?.id || row.entry_id || `${row.entry?.entry_date || ""}-${row.account_code}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const entries = [];
  const totals = {
    operating_cad: 0,
    investing_cad: 0,
    financing_cad: 0,
    net_change_cad: 0,
    opening_cash_cad: 0,
    closing_cash_cad: 0
  };

  for (const groupRows of grouped.values()) {
    const cashRows = groupRows.filter((row) => String(row.account_code) === "cash");
    if (!cashRows.length) continue;

    const entry = cashRows[0].entry || {};
    const cashDelta = roundMoney(
      cashRows.reduce((sum, row) => sum + signedAmountForRow(row).signed_amount_cad, 0)
    );
    const category = classifyCashEntry(groupRows);
    const counterparts = groupRows
      .filter((row) => String(row.account_code) !== "cash")
      .map((row) => row.account?.label || row.account_code)
      .filter(Boolean);

    if (category === "investing") totals.investing_cad = roundMoney(totals.investing_cad + cashDelta);
    else if (category === "financing") totals.financing_cad = roundMoney(totals.financing_cad + cashDelta);
    else totals.operating_cad = roundMoney(totals.operating_cad + cashDelta);

    entries.push({
      entry_id: entry.id || groupRows[0].entry_id || null,
      entry_date: entry.entry_date || null,
      entry_type: entry.entry_type || null,
      reference_type: entry.reference_type || null,
      reference_id: entry.reference_id || null,
      memo: entry.memo || groupRows[0].memo || null,
      category,
      cash_delta_cad: cashDelta,
      counterpart_accounts: counterparts
    });
  }

  totals.opening_cash_cad = await loadAccountBalanceThroughDate(env, "cash", start);
  totals.closing_cash_cad = await loadAccountBalanceThroughDate(env, "cash", nextMonth);
  totals.net_change_cad = roundMoney(
    totals.operating_cad + totals.investing_cad + totals.financing_cad
  );

  entries.sort((a, b) =>
    String(a.entry_date || "").localeCompare(String(b.entry_date || "")) ||
    String(a.entry_type || "").localeCompare(String(b.entry_type || ""))
  );

  return {
    month,
    year,
    period_start: start,
    period_end_exclusive: nextMonth,
    totals,
    entries
  };
}

export async function buildInventoryCostCompletenessReport(env) {
  const headers = serviceHeaders(env);
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,item_type,name,category,subcategory,qty_on_hand,reorder_point,reorder_qty,unit_label,cost_cents,preferred_vendor,vendor_sku,reuse_policy,is_active,is_public,updated_at&order=item_type.asc,name.asc`,
    { headers }
  );
  if (!res.ok) throw new Error(`Could not load inventory cost coverage. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  const items = Array.isArray(rows) ? rows : [];
  const active = items.filter((item) => item && item.is_active !== false);
  const missing = active.filter(
    (item) => !Number.isFinite(Number(item.cost_cents)) || Number(item.cost_cents) <= 0
  );
  const missingOnHand = missing.filter((item) => Number(item.qty_on_hand || 0) > 0);
  const reorderableMissing = missing.filter(
    (item) => String(item.reuse_policy || "reorder") !== "never_reuse"
  );
  const valuedOnHand = active.filter(
    (item) => Number(item.qty_on_hand || 0) > 0 && Number(item.cost_cents || 0) > 0
  );
  const costedInventoryValue = roundMoney(
    valuedOnHand.reduce(
      (sum, item) => sum + ((Number(item.qty_on_hand || 0) * Number(item.cost_cents || 0)) / 100),
      0
    )
  );

  return {
    totals: {
      active_items: active.length,
      missing_cost_items: missing.length,
      missing_cost_on_hand_items: missingOnHand.length,
      costed_items: active.length - missing.length,
      cost_coverage_pct: active.length
        ? roundMoney(((active.length - missing.length) / active.length) * 100)
        : 100,
      costed_inventory_value_cad: costedInventoryValue,
      reorderable_missing_cost_items: reorderableMissing.length
    },
    items_missing_cost: missingOnHand
      .concat(missing.filter((item) => Number(item.qty_on_hand || 0) <= 0))
      .slice(0, 100)
  };
}

export async function buildReceivablesAgingReport(env, { month, year } = {}) {
  const asOf = month && year
    ? addDays(monthRange(month, year).nextMonth, -1)
    : new Date().toISOString().slice(0, 10);

  const rows = await loadAccountingRecords(env, { limit: 1000 });
  const reportRows = [];
  const totals = {
    current_cad: 0,
    due_1_30_cad: 0,
    due_31_60_cad: 0,
    due_61_90_cad: 0,
    due_91_plus_cad: 0,
    total_balance_cad: 0,
    record_count: 0
  };

  for (const row of rows) {
    const balance = roundMoney(row.balance_due_cad || 0);
    if (balance <= 0) continue;

    const orderStatus = String(row.order_status || "open").toLowerCase();
    if (["paid", "cancelled"].includes(orderStatus)) continue;

    const agingBase = resolveAccountingRecordDate(row);
    if (agingBase > asOf) continue;

    const daysOutstanding = Math.max(0, daysBetween(agingBase, asOf));
    let bucketKey = "current_cad";
    if (daysOutstanding >= 91) bucketKey = "due_91_plus_cad";
    else if (daysOutstanding >= 61) bucketKey = "due_61_90_cad";
    else if (daysOutstanding >= 31) bucketKey = "due_31_60_cad";
    else if (daysOutstanding >= 1) bucketKey = "due_1_30_cad";

    totals[bucketKey] = roundMoney(totals[bucketKey] + balance);
    totals.total_balance_cad = roundMoney(totals.total_balance_cad + balance);
    totals.record_count += 1;

    reportRows.push({
      ...row,
      aging_date: agingBase,
      days_outstanding: daysOutstanding,
      aging_bucket: bucketKey.replace(/_cad$/, "")
    });
  }

  reportRows.sort((a, b) => {
    const byDays = Number(b.days_outstanding || 0) - Number(a.days_outstanding || 0);
    if (byDays) return byDays;
    return String(a.customer_name || "").localeCompare(String(b.customer_name || ""));
  });

  return {
    month: month || null,
    year: year || null,
    as_of: asOf,
    totals,
    rows: reportRows.slice(0, 200)
  };
}

export async function buildOperationalProfitabilityReport(env, { month, year }) {
  const { start, nextMonth } = monthRange(month, year);
  const records = (
    await loadAccountingRecords(env, { startDate: start, endDateExclusive: nextMonth, limit: 1000 })
  ).filter((row) => String(row.order_status || "open").toLowerCase() !== "cancelled");

  const monthlyReport = await buildMonthlyReport(env, { month, year });
  const cogsRows = await loadPostedLineRows(env, { month, year, accountCode: "cost_of_goods_sold" });
  const cogsByBooking = new Map();
  let totalDirectCogs = 0;

  for (const row of cogsRows) {
    const entry = row.entry || {};
    const refId = String(entry.reference_id || "").trim();
    const amount = Math.max(0, roundMoney(signedAmountForRow(row).signed_amount_cad));
    totalDirectCogs = roundMoney(totalDirectCogs + amount);
    if (!refId) continue;
    cogsByBooking.set(refId, roundMoney((cogsByBooking.get(refId) || 0) + amount));
  }

  const bookingIds = records.map((row) => String(row.booking_id || "").trim()).filter(Boolean);
  const timeEntries = bookingIds.length ? await loadTimeEntriesForBookings(env, bookingIds) : [];
  const staffRates = await loadStaffRates(
    env,
    Array.from(new Set(timeEntries.map((row) => String(row.staff_user_id || "").trim()).filter(Boolean)))
  );
  const laborByBooking = new Map();
  let totalEstimatedDirectLabor = 0;

  for (const entry of timeEntries) {
    const bookingId = String(entry.booking_id || "").trim();
    if (!bookingId) continue;

    const minutes = Math.max(0, Number(entry.minutes || 0));
    if (!minutes) continue;

    const staffRateCents = Number(staffRates.get(String(entry.staff_user_id || "").trim()) || 0);
    const laborCad = staffRateCents > 0 ? roundMoney((minutes / 60) * (staffRateCents / 100)) : 0;
    if (laborCad <= 0) continue;

    laborByBooking.set(bookingId, roundMoney((laborByBooking.get(bookingId) || 0) + laborCad));
    totalEstimatedDirectLabor = roundMoney(totalEstimatedDirectLabor + laborCad);
  }

  const overheadPool = roundMoney(
    Math.max(0, Number(monthlyReport.totals?.expense || 0) - totalDirectCogs)
  );
  const totalRecognizedRevenue = roundMoney(
    records.reduce((sum, row) => sum + recognizedRevenueForRecord(row), 0)
  );

  const rows = records.map((row) => {
    const bookingId = String(row.booking_id || "").trim();
    const recognizedRevenue = recognizedRevenueForRecord(row);
    const collectedRevenue = roundMoney(row.collected_total_cad || 0);
    const directCogs = roundMoney(cogsByBooking.get(bookingId) || 0);
    const estimatedDirectLabor = roundMoney(laborByBooking.get(bookingId) || 0);
    const revenueShare = totalRecognizedRevenue > 0 ? recognizedRevenue / totalRecognizedRevenue : 0;
    const allocatedOverhead = roundMoney(overheadPool * revenueShare);
    const estimatedGrossProfit = roundMoney(recognizedRevenue - directCogs);
    const estimatedContributionAfterLabor = roundMoney(estimatedGrossProfit - estimatedDirectLabor);
    const estimatedNetAfterOverhead = roundMoney(estimatedGrossProfit - allocatedOverhead);

    return {
      booking_id: bookingId || null,
      service_date: row.service_date || null,
      customer_name: row.customer_name || null,
      customer_email: row.customer_email || null,
      package_code: row.package_code || null,
      order_status: row.order_status || null,
      accounting_stage: row.accounting_stage || null,
      recognized_revenue_cad: recognizedRevenue,
      collected_revenue_cad: collectedRevenue,
      balance_due_cad: roundMoney(row.balance_due_cad || 0),
      direct_cogs_cad: directCogs,
      estimated_direct_labor_cad: estimatedDirectLabor,
      estimated_contribution_after_labor_cad: estimatedContributionAfterLabor,
      allocated_overhead_cad: allocatedOverhead,
      estimated_gross_profit_cad: estimatedGrossProfit,
      estimated_net_after_overhead_cad: estimatedNetAfterOverhead
    };
  }).sort((a, b) =>
    Number(b.estimated_contribution_after_labor_cad || 0) -
    Number(a.estimated_contribution_after_labor_cad || 0)
  );

  return {
    month,
    year,
    period_start: start,
    period_end_exclusive: nextMonth,
    method_note:
      "Estimated overhead is allocated across the selected month's booking revenue share after subtracting direct inventory COGS already posted to Cost of Goods Sold. Estimated direct labor is shown separately using logged job minutes × staff hourly_rate_cents when available, because payroll may already sit inside posted expenses.",
    totals: {
      booking_count: rows.length,
      recognized_revenue_cad: totalRecognizedRevenue,
      collected_revenue_cad: roundMoney(
        rows.reduce((sum, row) => sum + Number(row.collected_revenue_cad || 0), 0)
      ),
      direct_cogs_cad: totalDirectCogs,
      estimated_direct_labor_cad: totalEstimatedDirectLabor,
      estimated_contribution_after_labor_cad: roundMoney(
        rows.reduce((sum, row) => sum + Number(row.estimated_contribution_after_labor_cad || 0), 0)
      ),
      overhead_pool_cad: overheadPool,
      estimated_net_after_overhead_cad: roundMoney(
        rows.reduce((sum, row) => sum + Number(row.estimated_net_after_overhead_cad || 0), 0)
      )
    },
    rows
  };
}

export async function buildGeneralLedgerExport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year });
  const header = [
    "Entry Date",
    "Entry Type",
    "Reference Type",
    "Reference ID",
    "Vendor / Payee",
    "Account Code",
    "Account Label",
    "Direction",
    "Amount CAD",
    "Created By",
    "Last Recorded By",
    "Memo"
  ];
  const lines = [header.join(",")];

  for (const row of rows) {
    const entry = row.entry || {};
    const account = row.account || {};
    lines.push([
      csvSafe(entry.entry_date || ""),
      csvSafe(entry.entry_type || ""),
      csvSafe(entry.reference_type || ""),
      csvSafe(entry.reference_id || ""),
      csvSafe(entry.vendor_name || entry.payee_name || ""),
      csvSafe(row.account_code || ""),
      csvSafe(account.label || ""),
      csvSafe(row.direction || ""),
      csvSafe(roundMoney(row.amount_cad || 0)),
      csvSafe(entry.created_by_name || ""),
      csvSafe(entry.last_recorded_by_name || ""),
      csvSafe(row.memo || entry.memo || "")
    ].join(","));
  }

  return lines.join("\n");
}

export async function buildProfitAndLossExport(env, { month, year }) {
  const report = await buildMonthlyReport(env, { month, year });
  const header = ["Account Code", "Account Label", "Account Type", "Account Group", "Amount CAD"];
  const lines = [header.join(",")];

  for (const row of report.by_account.filter((item) =>
    ["revenue", "expense"].includes(String(item.account_type))
  )) {
    lines.push([
      csvSafe(row.account_code || ""),
      csvSafe(row.label || ""),
      csvSafe(row.account_type || ""),
      csvSafe(row.account_group || ""),
      csvSafe(roundMoney(row.amount_cad || 0))
    ].join(","));
  }

  lines.push(["", "Net Income", "summary", "", csvSafe(report.totals.net_income || 0)].join(","));
  return lines.join("\n");
}

export async function buildBalanceSheetExport(env, { month, year }) {
  const report = await buildBalanceSheetReport(env, { month, year });
  const header = ["Section", "Account Code", "Label", "Amount CAD"];
  const lines = [header.join(",")];

  for (const section of ["assets", "liabilities", "equity"]) {
    for (const row of report.sections[section] || []) {
      lines.push([
        csvSafe(section),
        csvSafe(row.account_code || ""),
        csvSafe(row.label || ""),
        csvSafe(roundMoney(row.amount_cad || 0))
      ].join(","));
    }
  }

  lines.push([
    csvSafe("equity"),
    "",
    csvSafe("Retained Earnings / Net Income To Date"),
    csvSafe(report.totals.retained_earnings_cad || 0)
  ].join(","));
  lines.push([csvSafe("summary"), "", csvSafe("Assets"), csvSafe(report.totals.assets_cad || 0)].join(","));
  lines.push([
    csvSafe("summary"),
    "",
    csvSafe("Liabilities and Equity"),
    csvSafe(report.totals.liabilities_and_equity_cad || 0)
  ].join(","));

  return lines.join("\n");
}

export async function buildCashFlowExport(env, { month, year }) {
  const report = await buildCashFlowReport(env, { month, year });
  const header = [
    "Entry Date",
    "Entry Type",
    "Category",
    "Cash Delta CAD",
    "Reference Type",
    "Reference ID",
    "Memo",
    "Counterpart Accounts"
  ];
  const lines = [header.join(",")];

  for (const row of report.entries) {
    lines.push([
      csvSafe(row.entry_date || ""),
      csvSafe(row.entry_type || ""),
      csvSafe(row.category || ""),
      csvSafe(roundMoney(row.cash_delta_cad || 0)),
      csvSafe(row.reference_type || ""),
      csvSafe(row.reference_id || ""),
      csvSafe(row.memo || ""),
      csvSafe((row.counterpart_accounts || []).join(" | "))
    ].join(","));
  }

  lines.push(["", csvSafe("Operating"), "", csvSafe(report.totals.operating_cad || 0), "", "", "", ""].join(","));
  lines.push(["", csvSafe("Investing"), "", csvSafe(report.totals.investing_cad || 0), "", "", "", ""].join(","));
  lines.push(["", csvSafe("Financing"), "", csvSafe(report.totals.financing_cad || 0), "", "", "", ""].join(","));
  lines.push(["", csvSafe("Net Change"), "", csvSafe(report.totals.net_change_cad || 0), "", "", "", ""].join(","));

  return lines.join("\n");
}

export async function buildPayablesExport(env, { status = "all" } = {}) {
  const payables = await listPayables(env, { status });
  const header = [
    "Entry ID",
    "Entry Date",
    "Vendor",
    "Due Date",
    "Payment Status",
    "Total CAD",
    "Settled CAD",
    "Balance Due CAD",
    "Settlement Dates",
    "Memo"
  ];
  const lines = [header.join(",")];

  for (const row of payables) {
    lines.push([
      csvSafe(row.id || ""),
      csvSafe(row.entry_date || ""),
      csvSafe(row.vendor_name || row.payee_name || ""),
      csvSafe(row.due_date || ""),
      csvSafe(row.payment_status || ""),
      csvSafe(roundMoney(row.total_cad || 0)),
      csvSafe(roundMoney(row.settled_amount_cad || 0)),
      csvSafe(roundMoney(row.balance_due_cad || 0)),
      csvSafe(
        (row.settlements || [])
          .map((item) => `${item.entry_date || ""} ${roundMoney(item.total_cad || 0)}`)
          .join(" | ")
      ),
      csvSafe(row.memo || "")
    ].join(","));
  }

  return lines.join("\n");
}

export async function buildInventoryCostExport(env) {
  const report = await buildInventoryCostCompletenessReport(env);
  const header = [
    "Item Key",
    "Type",
    "Name",
    "Category",
    "Qty On Hand",
    "Unit",
    "Preferred Vendor",
    "Vendor SKU",
    "Updated At"
  ];
  const lines = [header.join(",")];

  for (const row of report.items_missing_cost || []) {
    lines.push([
      csvSafe(row.item_key || ""),
      csvSafe(row.item_type || ""),
      csvSafe(row.name || ""),
      csvSafe([row.category, row.subcategory].filter(Boolean).join(" / ")),
      csvSafe(row.qty_on_hand || 0),
      csvSafe(row.unit_label || ""),
      csvSafe(row.preferred_vendor || ""),
      csvSafe(row.vendor_sku || ""),
      csvSafe(row.updated_at || "")
    ].join(","));
  }

  return lines.join("\n");
}

export async function buildReceivablesAgingExport(env, { month, year }) {
  const report = await buildReceivablesAgingReport(env, { month, year });
  const header = [
    "Booking ID",
    "Service Date",
    "Customer",
    "Email",
    "Package",
    "Order Status",
    "Balance Due CAD",
    "Days Outstanding",
    "Aging Bucket",
    "As Of"
  ];
  const lines = [header.join(",")];

  for (const row of report.rows || []) {
    lines.push([
      csvSafe(row.booking_id || ""),
      csvSafe(row.service_date || ""),
      csvSafe(row.customer_name || ""),
      csvSafe(row.customer_email || ""),
      csvSafe(row.package_code || ""),
      csvSafe(row.order_status || ""),
      csvSafe(roundMoney(row.balance_due_cad || 0)),
      csvSafe(row.days_outstanding || 0),
      csvSafe(row.aging_bucket || ""),
      csvSafe(report.as_of || "")
    ].join(","));
  }

  lines.push(["", "", csvSafe("Current"), "", "", "", csvSafe(report.totals.current_cad || 0), "", "", csvSafe(report.as_of || "")].join(","));
  lines.push(["", "", csvSafe("1-30 Days"), "", "", "", csvSafe(report.totals.due_1_30_cad || 0), "", "", csvSafe(report.as_of || "")].join(","));
  lines.push(["", "", csvSafe("31-60 Days"), "", "", "", csvSafe(report.totals.due_31_60_cad || 0), "", "", csvSafe(report.as_of || "")].join(","));
  lines.push(["", "", csvSafe("61-90 Days"), "", "", "", csvSafe(report.totals.due_61_90_cad || 0), "", "", csvSafe(report.as_of || "")].join(","));
  lines.push(["", "", csvSafe("91+ Days"), "", "", "", csvSafe(report.totals.due_91_plus_cad || 0), "", "", csvSafe(report.as_of || "")].join(","));
  lines.push(["", "", csvSafe("Total Open Receivables"), "", "", "", csvSafe(report.totals.total_balance_cad || 0), "", "", csvSafe(report.as_of || "")].join(","));

  return lines.join("\n");
}

export async function buildOperationalProfitabilityExport(env, { month, year }) {
  const report = await buildOperationalProfitabilityReport(env, { month, year });
  const header = [
    "Booking ID",
    "Service Date",
    "Customer",
    "Package",
    "Order Status",
    "Recognized Revenue CAD",
    "Collected Revenue CAD",
    "Balance Due CAD",
    "Direct COGS CAD",
    "Estimated Direct Labor CAD",
    "Contribution After Labor CAD",
    "Allocated Overhead CAD",
    "Estimated Gross Profit CAD",
    "Estimated Net After Overhead CAD"
  ];
  const lines = [header.join(",")];

  for (const row of report.rows || []) {
    lines.push([
      csvSafe(row.booking_id || ""),
      csvSafe(row.service_date || ""),
      csvSafe(row.customer_name || ""),
      csvSafe(row.package_code || ""),
      csvSafe(row.order_status || ""),
      csvSafe(roundMoney(row.recognized_revenue_cad || 0)),
      csvSafe(roundMoney(row.collected_revenue_cad || 0)),
      csvSafe(roundMoney(row.balance_due_cad || 0)),
      csvSafe(roundMoney(row.direct_cogs_cad || 0)),
      csvSafe(roundMoney(row.estimated_direct_labor_cad || 0)),
      csvSafe(roundMoney(row.estimated_contribution_after_labor_cad || 0)),
      csvSafe(roundMoney(row.allocated_overhead_cad || 0)),
      csvSafe(roundMoney(row.estimated_gross_profit_cad || 0)),
      csvSafe(roundMoney(row.estimated_net_after_overhead_cad || 0))
    ].join(","));
  }

  lines.push([
    "",
    "",
    csvSafe("Totals"),
    "",
    "",
    csvSafe(report.totals.recognized_revenue_cad || 0),
    csvSafe(report.totals.collected_revenue_cad || 0),
    "",
    csvSafe(report.totals.direct_cogs_cad || 0),
    csvSafe(report.totals.estimated_direct_labor_cad || 0),
    csvSafe(report.totals.estimated_contribution_after_labor_cad || 0),
    csvSafe(report.totals.overhead_pool_cad || 0),
    "",
    csvSafe(report.totals.estimated_net_after_overhead_cad || 0)
  ].join(","));

  return lines.join("\n");
}

export async function postInventoryUsageCOGS(env, { bookingId, item, qtyUsed, actorName = null, note = null }) {
  const costCents = Number(item?.cost_cents || 0);
  if (!Number.isFinite(costCents) || costCents <= 0 || !Number.isFinite(Number(qtyUsed)) || Number(qtyUsed) <= 0) {
    return null;
  }

  const totalCost = roundMoney((Number(qtyUsed) * costCents) / 100);
  if (totalCost <= 0) return null;

  return await postJournalEntry(env, {
    entry_date: new Date().toISOString().slice(0, 10),
    entry_type: "inventory_usage_cogs",
    status: "posted",
    reference_type: "booking_inventory_usage",
    reference_id: bookingId || null,
    vendor_name: null,
    payee_name: null,
    memo: note || `Inventory used on booking ${bookingId || ""}`,
    subtotal_cad: totalCost,
    tax_cad: 0,
    total_cad: totalCost,
    created_by_name: actorName,
    last_recorded_by_name: actorName
  }, [
    {
      account_code: "cost_of_goods_sold",
      direction: "debit",
      amount_cad: totalCost,
      memo: note || item?.name || item?.item_key || null
    },
    {
      account_code: "inventory_supplies",
      direction: "credit",
      amount_cad: totalCost,
      memo: note || item?.name || item?.item_key || null
    }
  ]);
}

async function loadSettlementsForEntry(env, entryId) {
  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=id,entry_date,entry_type,total_cad,memo,reference_id,settlement_of_entry_id,created_by_name,last_recorded_by_name&or=(reference_id.eq.${encodeURIComponent(entryId)},settlement_of_entry_id.eq.${encodeURIComponent(entryId)})&entry_type=in.(payable_settlement,payable_partial_settlement)&status=eq.posted&order=entry_date.asc`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load payable settlements. ${await res.text()}`);
  return await res.json().catch(() => []);
}

async function loadPostedLineRows(env, {
  month,
  year,
  accountCode = null,
  startDate = null,
  endDateExclusive = null
} = {}) {
  const headers = serviceHeaders(env);
  let start = startDate;
  let end = endDateExclusive;

  if (!start || !end) {
    const range = monthRange(month, year);
    start = range.start;
    end = range.nextMonth;
  }

  let url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_lines?select=id,entry_id,direction,amount_cad,account_code,memo,entry:accounting_journal_entries!inner(id,entry_date,entry_type,status,reference_type,reference_id,vendor_name,payee_name,memo,created_by_name,last_recorded_by_name,created_by_staff_user_id,last_recorded_by_staff_user_id),account:accounting_accounts!inner(label,account_type,account_group,normal_balance)&entry.entry_date=gte.${start}&entry.entry_date=lt.${end}&entry.status=eq.posted`;
  if (accountCode) url += `&account_code=eq.${encodeURIComponent(accountCode)}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load accounting rows. ${await res.text()}`);
  return await res.json().catch(() => []);
}

async function loadTimeEntriesForBookings(env, bookingIds = []) {
  const ids = bookingIds.map((value) => String(value || "").trim()).filter(Boolean);
  if (!ids.length) return [];

  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/job_time_entries?select=booking_id,minutes,staff_user_id&booking_id=in.(${encodeIdList(ids)})&limit=5000`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  return await res.json().catch(() => []);
}

async function loadStaffRates(env, staffIds = []) {
  const ids = staffIds.map((value) => String(value || "").trim()).filter(Boolean);
  const map = new Map();
  if (!ids.length) return map;

  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/staff_users?select=id,hourly_rate_cents&id=in.(${encodeIdList(ids)})`;
  const res = await fetch(url, { headers });
  if (!res.ok) return map;
  const rows = await res.json().catch(() => []);

  for (const row of Array.isArray(rows) ? rows : []) {
    map.set(String(row.id || "").trim(), Number(row.hourly_rate_cents || 0));
  }
  return map;
}

async function loadAccountBalanceThroughDate(env, accountCode, endDateExclusive) {
  const rows = await loadPostedLineRows(env, {
    startDate: "2020-01-01",
    endDateExclusive,
    accountCode
  });
  return roundMoney(rows.reduce((sum, row) => sum + signedAmountForRow(row).signed_amount_cad, 0));
}

function classifyCashEntry(rows) {
  const otherRows = rows.filter((row) => String(row.account_code) !== "cash");
  if (!otherRows.length) return "operating";

  const accountCodes = new Set(otherRows.map((row) => String(row.account_code || "")));
  const accountGroups = new Set(otherRows.map((row) => String(row.account?.account_group || "")));
  const accountTypes = new Set(otherRows.map((row) => String(row.account?.account_type || "")));

  if (accountCodes.has("equipment") || accountGroups.has("fixed_assets")) return "investing";
  if (accountCodes.has("owner_equity") || accountCodes.has("owner_draw") || accountTypes.has("equity")) {
    return "financing";
  }
  return "operating";
}

function signedAmountForRow(row) {
  const account = row.account || {};
  const type = String(account.account_type || "expense");
  const dir = String(row.direction || "debit");
  const amount = roundMoney(row.amount_cad || 0);
  const sign =
    type === "revenue" || type === "liability" || type === "equity"
      ? dir === "credit" ? 1 : -1
      : dir === "debit" ? 1 : -1;

  return {
    signed_amount_cad: roundMoney(sign * amount),
    account_type: type
  };
}

async function loadAccountingRecords(env, {
  startDate = null,
  endDateExclusive = null,
  limit = 500
} = {}) {
  const headers = serviceHeaders(env);
  const safeLimit = Math.max(1, Math.min(2000, Number(limit) || 500));
  const url = `${env.SUPABASE_URL}/rest/v1/accounting_records?select=*&order=service_date.asc.nullslast,updated_at.desc&limit=${safeLimit}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load accounting records. ${await res.text()}`);
  const rows = await res.json().catch(() => []);

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const rowDate = resolveAccountingRecordDate(row);
    if (startDate && rowDate < startDate) return false;
    if (endDateExclusive && rowDate >= endDateExclusive) return false;
    return true;
  });
}

function resolveAccountingRecordDate(row) {
  const serviceDate = String(row?.service_date || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) return serviceDate;

  const updated = String(row?.updated_at || row?.created_at || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(updated)) return updated;

  return new Date().toISOString().slice(0, 10);
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.max(0, Math.round((end - start) / 86400000));
}

function recognizedRevenueForRecord(row) {
  const explicit = roundMoney(row?.revenue_cad || 0);
  if (explicit > 0) return explicit;
  return roundMoney(Math.max(0, Number(row?.total_cad || 0) - Number(row?.refund_cad || 0)));
}

function monthRange(month, year) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, nextMonth };
}

function addDays(dateString, days) {
  const base = new Date(`${dateString}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + Number(days || 0));
  return base.toISOString().slice(0, 10);
}

function sortByLabel(a, b) {
  return String(a?.label || "").localeCompare(String(b?.label || ""));
}

function csvSafe(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

function encodeIdList(values = []) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((value) => encodeURIComponent(value))
    .join(",");
}

export async function buildYearEndReport(env, { year }) {
  const monthly = [];
  const expenseBuckets = {};
  const revenueBuckets = {};
  const totals = {
    revenue_cad: 0,
    expense_cad: 0,
    net_income_cad: 0,
    hst_collected_cad: 0,
    hst_debits_cad: 0,
    hst_net_activity_cad: 0,
    owner_draw_cad: 0,
    owner_equity_delta_cad: 0
  };

  for (let month = 1; month <= 12; month += 1) {
    const [pnl, tax, owner] = await Promise.all([
      buildMonthlyReport(env, { month, year }),
      buildTaxReport(env, { month, year }),
      buildOwnerEquityReport(env, { month, year })
    ]);

    const revenue = roundMoney(pnl?.totals?.revenue || 0);
    const expense = roundMoney(pnl?.totals?.expense || 0);
    const netIncome = roundMoney(pnl?.totals?.net_income || (revenue - expense));
    const hstCollected = roundMoney(tax?.collected_tax_cad || 0);
    const hstDebits = roundMoney(tax?.tax_account_debits_cad || 0);
    const hstNet = roundMoney(tax?.net_tax_payable_cad || 0);
    const ownerDraw = roundMoney(Math.abs(owner?.owner_draw_cad || 0));
    const ownerEquityDelta = roundMoney(owner?.owner_equity_delta_cad || 0);

    totals.revenue_cad = roundMoney(totals.revenue_cad + revenue);
    totals.expense_cad = roundMoney(totals.expense_cad + expense);
    totals.net_income_cad = roundMoney(totals.net_income_cad + netIncome);
    totals.hst_collected_cad = roundMoney(totals.hst_collected_cad + hstCollected);
    totals.hst_debits_cad = roundMoney(totals.hst_debits_cad + hstDebits);
    totals.hst_net_activity_cad = roundMoney(totals.hst_net_activity_cad + hstNet);
    totals.owner_draw_cad = roundMoney(totals.owner_draw_cad + ownerDraw);
    totals.owner_equity_delta_cad = roundMoney(totals.owner_equity_delta_cad + ownerEquityDelta);

    for (const row of pnl?.by_account || []) {
      const type = String(row?.account_type || "");
      const target =
        type === "expense" ? expenseBuckets :
        type === "revenue" ? revenueBuckets :
        null;
      if (!target) continue;

      const key = row.account_code;
      target[key] ||= { account_code: key, label: row.label || key, amount_cad: 0 };
      target[key].amount_cad = roundMoney(
        target[key].amount_cad + Number(row.amount_cad || 0)
      );
    }

    monthly.push({
      month,
      month_label: `${year}-${String(month).padStart(2, "0")}`,
      revenue_cad: revenue,
      expense_cad: expense,
      net_income_cad: netIncome,
      hst_collected_cad: hstCollected,
      hst_debits_cad: hstDebits,
      hst_net_activity_cad: hstNet,
      owner_draw_cad: ownerDraw
    });
  }

  const [balanceSheet, receivablesAging, payables] = await Promise.all([
    buildBalanceSheetReport(env, { month: 12, year }),
    buildReceivablesAgingReport(env, { month: 12, year }),
    listPayables(env, { status: "all" })
  ]);

  const openPayables = payables.filter((row) =>
    ["open", "partial"].includes(String(row.payment_status || ""))
  );
  const openPayablesCad = roundMoney(
    openPayables.reduce((sum, row) => sum + Number(row.balance_due_cad || 0), 0)
  );
  const assetRows = balanceSheet?.sections?.assets || [];
  const liabilityRows = balanceSheet?.sections?.liabilities || [];
  const equityRows = balanceSheet?.sections?.equity || [];
  const cashRow = assetRows.find((row) => String(row.account_code) === "cash");
  const taxPayableRow = liabilityRows.find((row) => String(row.account_code) === "sales_tax_payable");

  return {
    year,
    jurisdiction: "Ontario / Canada",
    reporting_basis_note:
      "Operational bookkeeping summary for CRA-friendly handoff. Keep source invoices, settlement support, and GST/HST working papers with this package.",
    monthly,
    totals: {
      ...totals,
      year_end_cash_cad: roundMoney(cashRow?.amount_cad || 0),
      year_end_sales_tax_payable_cad: roundMoney(taxPayableRow?.amount_cad || 0),
      year_end_receivables_cad: roundMoney(receivablesAging?.totals?.total_balance_cad || 0),
      year_end_open_payables_cad: openPayablesCad,
      year_end_total_assets_cad: roundMoney(balanceSheet?.totals?.assets_cad || 0),
      year_end_total_liabilities_cad: roundMoney(balanceSheet?.totals?.liabilities_cad || 0),
      year_end_total_equity_cad: roundMoney(balanceSheet?.totals?.equity_total_cad || 0)
    },
    expense_categories: Object.values(expenseBuckets).sort(
      (a, b) => Number(b.amount_cad || 0) - Number(a.amount_cad || 0)
    ),
    revenue_categories: Object.values(revenueBuckets).sort(
      (a, b) => Number(b.amount_cad || 0) - Number(a.amount_cad || 0)
    ),
    snapshots: {
      balance_sheet: balanceSheet,
      receivables_aging: receivablesAging,
      open_payables: openPayables.slice(0, 250),
      equity_accounts: equityRows
    },
    tax_prep_notes: [
      "Keep invoices, receipts, settlement support, and bank/payment evidence for each posted entry.",
      "GST/HST returns need support for sales collected, ITCs claimed, and remittances posted.",
      "CRA generally requires records to be kept for six years from the end of the last tax year they relate to."
    ]
  };
}

export async function buildYearEndPackageExport(env, { year }) {
  const report = await buildYearEndReport(env, { year });
  const lines = [];

  lines.push([csvSafe("section"), csvSafe("label"), csvSafe("value")].join(","));

  const totals = report?.totals || {};
  [
    ["summary", "Year", year],
    ["summary", "Jurisdiction", report?.jurisdiction || "Ontario / Canada"],
    ["summary", "Revenue", totals.revenue_cad || 0],
    ["summary", "Expense", totals.expense_cad || 0],
    ["summary", "Net income", totals.net_income_cad || 0],
    ["summary", "HST collected", totals.hst_collected_cad || 0],
    ["summary", "HST debits / ITCs", totals.hst_debits_cad || 0],
    ["summary", "HST net activity", totals.hst_net_activity_cad || 0],
    ["summary", "Owner draw", totals.owner_draw_cad || 0],
    ["summary", "Year-end cash", totals.year_end_cash_cad || 0],
    ["summary", "Year-end receivables", totals.year_end_receivables_cad || 0],
    ["summary", "Year-end open payables", totals.year_end_open_payables_cad || 0],
    ["summary", "Year-end sales tax payable", totals.year_end_sales_tax_payable_cad || 0]
  ].forEach((row) => lines.push(row.map(csvSafe).join(",")));

  lines.push([
    csvSafe("monthly"),
    csvSafe("month"),
    csvSafe("revenue_cad"),
    csvSafe("expense_cad"),
    csvSafe("net_income_cad"),
    csvSafe("hst_collected_cad"),
    csvSafe("hst_debits_cad"),
    csvSafe("hst_net_activity_cad"),
    csvSafe("owner_draw_cad")
  ].join(","));

  for (const row of report.monthly || []) {
    lines.push([
      csvSafe("monthly"),
      csvSafe(row.month_label),
      csvSafe(row.revenue_cad || 0),
      csvSafe(row.expense_cad || 0),
      csvSafe(row.net_income_cad || 0),
      csvSafe(row.hst_collected_cad || 0),
      csvSafe(row.hst_debits_cad || 0),
      csvSafe(row.hst_net_activity_cad || 0),
      csvSafe(row.owner_draw_cad || 0)
    ].join(","));
  }

  lines.push([
    csvSafe("expense_categories"),
    csvSafe("account_code"),
    csvSafe("label"),
    csvSafe("amount_cad")
  ].join(","));
  for (const row of report.expense_categories || []) {
    lines.push([
      csvSafe("expense_categories"),
      csvSafe(row.account_code),
      csvSafe(row.label),
      csvSafe(row.amount_cad || 0)
    ].join(","));
  }

  lines.push([
    csvSafe("revenue_categories"),
    csvSafe("account_code"),
    csvSafe("label"),
    csvSafe("amount_cad")
  ].join(","));
  for (const row of report.revenue_categories || []) {
    lines.push([
      csvSafe("revenue_categories"),
      csvSafe(row.account_code),
      csvSafe(row.label),
      csvSafe(row.amount_cad || 0)
    ].join(","));
  }

  lines.push([csvSafe("notes"), csvSafe("tax_prep_note"), csvSafe("")].join(","));
  for (const note of report.tax_prep_notes || []) {
    lines.push([csvSafe("notes"), csvSafe(note), csvSafe("")].join(","));
  }

  return lines.join("\n");
}


export async function listAccountingDocuments(env, { relatedType = null, relatedId = null, documentKind = null, limit = 200 } = {}) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_documents?select=*&order=created_at.desc&limit=${safeLimit}`;
  if (relatedType) url += `&related_type=eq.${encodeURIComponent(relatedType)}`;
  if (relatedId) url += `&related_id=eq.${encodeURIComponent(relatedId)}`;
  if (documentKind) url += `&document_kind=eq.${encodeURIComponent(documentKind)}`;
  return await fetchRowsWithMissingTableFallback(env, url, "accounting_documents", "Could not load accounting documents.");
}

export async function saveAccountingDocument(env, payload = {}, actor = {}) {
  const headers = serviceHeaders(env);
  const row = {
    related_type: cleanTextValue(payload.related_type) || "journal_entry",
    related_id: cleanTextValue(payload.related_id) || null,
    document_kind: cleanTextValue(payload.document_kind) || "attachment",
    title: cleanTextValue(payload.title) || "Untitled document",
    vendor_name: cleanTextValue(payload.vendor_name) || null,
    document_number: cleanTextValue(payload.document_number) || null,
    document_date: cleanTextValue(payload.document_date) || null,
    file_name: cleanTextValue(payload.file_name) || null,
    file_url: cleanTextValue(payload.file_url) || null,
    storage_path: cleanTextValue(payload.storage_path) || null,
    mime_type: cleanTextValue(payload.mime_type) || null,
    size_bytes: payload.size_bytes == null || payload.size_bytes === "" ? null : Number(payload.size_bytes || 0),
    notes: cleanTextValue(payload.notes) || null,
    uploaded_by_name: actor.name || null,
    uploaded_by_staff_user_id: actor.staffUserId || null
  };
  if (!row.file_url && !row.storage_path) throw new Error("A file URL or storage path is required.");
  const docId = cleanTextValue(payload.id);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_documents${docId ? `?id=eq.${encodeURIComponent(docId)}` : ""}`, {
    method: docId ? "PATCH" : "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(docId ? row : [row])
  });
  if (!res.ok) {
    const text = await res.text();
    if (isMissingTableText(text, "accounting_documents")) throw new Error("Run the 2026-04-27 accounting workflow migration before saving accounting documents.");
    throw new Error(`Could not save accounting document. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}


export async function listAccountingVendors(env, { activeOnly = false } = {}) {
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_vendors?select=*&order=vendor_name.asc&limit=250`;
  if (activeOnly) url += `&is_active=eq.true`;
  return await fetchRowsWithMissingTableFallback(env, url, "accounting_vendors", "Could not load vendors.");
}

export async function saveAccountingVendor(env, payload = {}, actor = {}) {
  const headers = serviceHeaders(env);
  const row = {
    vendor_name: cleanTextValue(payload.vendor_name) || "Vendor",
    default_expense_account_code: cleanTextValue(payload.default_expense_account_code) || "shop_supplies",
    default_payment_account_code: cleanTextValue(payload.default_payment_account_code) || "cash",
    default_posting_mode: cleanTextValue(payload.default_posting_mode) || "cash",
    payment_terms_days: payload.payment_terms_days == null || payload.payment_terms_days === "" ? null : Number(payload.payment_terms_days || 0),
    contact_name: cleanTextValue(payload.contact_name) || null,
    contact_email: cleanTextValue(payload.contact_email) || null,
    contact_phone: cleanTextValue(payload.contact_phone) || null,
    vendor_notes: cleanTextValue(payload.vendor_notes) || null,
    is_active: payload.is_active == null ? true : !!payload.is_active,
    updated_by_name: actor.name || null,
    updated_by_staff_user_id: actor.staffUserId || null
  };
  const vendorId = cleanTextValue(payload.id);
  if (!vendorId) {
    row.created_by_name = actor.name || null;
    row.created_by_staff_user_id = actor.staffUserId || null;
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_vendors${vendorId ? `?id=eq.${encodeURIComponent(vendorId)}` : ""}`, {
    method: vendorId ? "PATCH" : "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(vendorId ? row : [row])
  });
  if (!res.ok) {
    const text = await res.text();
    if (isMissingTableText(text, "accounting_vendors")) throw new Error("Run the 2026-04-28 accounting expansion migration before saving vendors.");
    throw new Error(`Could not save vendor. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function listRecurringExpenses(env, { activeOnly = false } = {}) {
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_recurring_expenses?select=*&order=next_due_date.asc,created_at.desc&limit=250`;
  if (activeOnly) url += `&is_active=eq.true`;
  return await fetchRowsWithMissingTableFallback(env, url, "accounting_recurring_expenses", "Could not load recurring expenses.");
}

export async function saveRecurringExpense(env, payload = {}, actor = {}) {
  const headers = serviceHeaders(env);
  await assertPeriodWritable(env, payload.next_due_date || new Date().toISOString().slice(0, 10));
  const subtotal = roundMoney(payload.subtotal_cad || 0);
  const tax = roundMoney(payload.tax_cad || 0);
  const row = {
    vendor_name: cleanTextValue(payload.vendor_name) || "Vendor",
    memo: cleanTextValue(payload.memo) || null,
    expense_account_code: cleanTextValue(payload.expense_account_code) || "shop_supplies",
    payment_account_code: cleanTextValue(payload.payment_account_code) || "cash",
    posting_mode: cleanTextValue(payload.posting_mode) || "cash",
    subtotal_cad: subtotal,
    tax_cad: tax,
    total_cad: roundMoney(subtotal + tax),
    cadence: cleanTextValue(payload.cadence) || "monthly",
    next_due_date: cleanTextValue(payload.next_due_date) || new Date().toISOString().slice(0, 10),
    auto_post: !!payload.auto_post,
    is_active: payload.is_active == null ? true : !!payload.is_active,
    notes: cleanTextValue(payload.notes) || null,
    updated_by_name: actor.name || null,
    updated_by_staff_user_id: actor.staffUserId || null
  };
  if (row.subtotal_cad <= 0) throw new Error("Recurring expense amount must be greater than zero.");
  const templateId = cleanTextValue(payload.id);
  if (!templateId) {
    row.created_by_name = actor.name || null;
    row.created_by_staff_user_id = actor.staffUserId || null;
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_recurring_expenses${templateId ? `?id=eq.${encodeURIComponent(templateId)}` : ""}`, {
    method: templateId ? "PATCH" : "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(templateId ? row : [row])
  });
  if (!res.ok) {
    const text = await res.text();
    if (isMissingTableText(text, "accounting_recurring_expenses")) throw new Error("Run the 2026-04-27 accounting workflow migration before saving recurring expenses.");
    throw new Error(`Could not save recurring expense. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function postRecurringExpenseTemplate(env, { templateId, entryDate = null, actorName = null, actorStaffUserId = null } = {}) {
  const templates = await listRecurringExpenses(env, { activeOnly: false });
  const template = (templates || []).find((row) => String(row.id || "") === String(templateId || ""));
  if (!template) throw new Error("Recurring expense template not found.");
  if (template.is_active === false) throw new Error("Recurring expense template is inactive.");

  const postDate = cleanTextValue(entryDate) || cleanTextValue(template.next_due_date) || new Date().toISOString().slice(0, 10);
  const total = roundMoney(template.total_cad || (Number(template.subtotal_cad || 0) + Number(template.tax_cad || 0)));
  const mode = String(template.posting_mode || "cash");
  const paymentAccount = cleanTextValue(template.payment_account_code) || (mode === "payable" ? "accounts_payable" : "cash");
  const memo = cleanTextValue(template.memo) || `Recurring expense: ${template.vendor_name || "Vendor"}`;

  const posted = await postJournalEntry(env, {
    entry_date: postDate,
    entry_type: mode === "payable" ? "vendor_bill" : "expense",
    status: "posted",
    reference_type: "recurring_expense_template",
    reference_id: template.id,
    payee_name: template.vendor_name || null,
    vendor_name: template.vendor_name || null,
    memo,
    subtotal_cad: roundMoney(template.subtotal_cad || 0),
    tax_cad: roundMoney(template.tax_cad || 0),
    total_cad: total,
    due_date: mode === "payable" ? postDate : null,
    paid_at: mode === "cash" ? new Date().toISOString() : null,
    created_by_name: actorName,
    last_recorded_by_name: actorName,
    created_by_staff_user_id: actorStaffUserId,
    last_recorded_by_staff_user_id: actorStaffUserId
  }, [
    {
      account_code: cleanTextValue(template.expense_account_code) || "shop_supplies",
      direction: "debit",
      amount_cad: roundMoney(template.subtotal_cad || 0),
      memo
    },
    ...(roundMoney(template.tax_cad || 0) > 0 ? [{
      account_code: "sales_tax_payable",
      direction: "debit",
      amount_cad: roundMoney(template.tax_cad || 0),
      memo: "Input tax / tax component"
    }] : []),
    {
      account_code: paymentAccount,
      direction: "credit",
      amount_cad: total,
      memo
    }
  ]);

  const nextDueDate = advanceCadenceDate(postDate, cleanTextValue(template.cadence) || "monthly");
  await saveRecurringExpense(env, {
    id: template.id,
    vendor_name: template.vendor_name,
    memo: template.memo,
    expense_account_code: template.expense_account_code,
    payment_account_code: template.payment_account_code,
    posting_mode: template.posting_mode,
    subtotal_cad: template.subtotal_cad,
    tax_cad: template.tax_cad,
    cadence: template.cadence,
    next_due_date: nextDueDate,
    auto_post: template.auto_post,
    is_active: template.is_active,
    notes: template.notes
  }, actorName || actorStaffUserId ? { name: actorName, staffUserId: actorStaffUserId } : {});

  const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_recurring_expenses?id=eq.${encodeURIComponent(template.id)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      last_posted_at: new Date().toISOString(),
      last_posted_entry_id: posted.entry?.id || null
    })
  });
  if (!patchRes.ok) {
    const text = await patchRes.text();
    if (!isMissingTableText(text, "accounting_recurring_expenses")) throw new Error(`Recurring expense posted, but template could not be updated. ${text}`);
  }

  return { template_id: template.id, next_due_date: nextDueDate, entry: posted.entry, lines: posted.lines };
}

export async function buildBankReconciliationSnapshot(env, { month, year, accountCode = "cash" } = {}) {
  const { start, nextMonth } = monthRange(month, year);
  const rows = await loadPostedLineRows(env, { startDate: start, endDateExclusive: nextMonth, accountCode });
  const monthActivity = roundMoney(rows.reduce((sum, row) => sum + signedAmountForRow(row).signed_amount_cad, 0));
  const endingBookBalance = await loadAccountBalanceThroughDate(env, accountCode, nextMonth);
  const recs = await listBankReconciliations(env, { month, year, accountCode });
  const latest = Array.isArray(recs) && recs.length ? recs[0] : null;
  return {
    month,
    year,
    account_code: accountCode,
    period_start: start,
    period_end_exclusive: nextMonth,
    entry_count: rows.length,
    month_activity_cad: monthActivity,
    ending_book_balance_cad: endingBookBalance,
    latest_reconciliation: latest || null,
    entries: rows.map((row) => ({
      entry_id: row.entry_id || row.entry?.id || null,
      entry_date: row.entry?.entry_date || null,
      entry_type: row.entry?.entry_type || null,
      memo: row.memo || row.entry?.memo || null,
      amount_cad: signedAmountForRow(row).signed_amount_cad,
      direction: row.direction || null
    }))
  };
}

export async function listBankReconciliations(env, { month, year, accountCode = null } = {}) {
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_bank_reconciliations?select=*&order=period_end.desc,created_at.desc&limit=60`;
  if (month && year) {
    const { start, nextMonth } = monthRange(month, year);
    url += `&period_start=eq.${encodeURIComponent(start)}&period_end=eq.${encodeURIComponent(addDays(nextMonth, -1))}`;
  }
  if (accountCode) url += `&account_code=eq.${encodeURIComponent(accountCode)}`;
  return await fetchRowsWithMissingTableFallback(env, url, "accounting_bank_reconciliations", "Could not load bank reconciliations.");
}

export async function saveBankReconciliation(env, payload = {}, actor = {}) {
  const headers = serviceHeaders(env);
  const month = Number(payload.month || 0);
  const year = Number(payload.year || 0);
  const accountCode = cleanTextValue(payload.account_code) || "cash";
  const snapshot = await buildBankReconciliationSnapshot(env, { month, year, accountCode });
  const statementEnding = roundMoney(payload.statement_ending_balance_cad || 0);
  await assertPeriodWritable(env, snapshot.period_end_exclusive);
  const matchedEntryIds = Array.isArray(payload.matched_entry_ids) ? payload.matched_entry_ids : parseDelimitedValues(payload.matched_entry_ids || payload.cleared_journal_entry_ids || payload.cleared_entry_ids || "");
  const row = {
    account_code: accountCode,
    period_start: snapshot.period_start,
    period_end: addDays(snapshot.period_end_exclusive, -1),
    statement_ending_balance_cad: statementEnding,
    calculated_book_balance_cad: roundMoney(snapshot.ending_book_balance_cad || 0),
    difference_cad: roundMoney(statementEnding - Number(snapshot.ending_book_balance_cad || 0)),
    outstanding_count: Number(payload.outstanding_count || 0),
    cleared_journal_entry_ids: matchedEntryIds,
    matched_entry_ids: matchedEntryIds,
    matched_count: matchedEntryIds.length,
    status: cleanTextValue(payload.status) || "draft",
    notes: cleanTextValue(payload.notes) || null,
    reconciled_by_name: actor.name || null,
    reconciled_by_staff_user_id: actor.staffUserId || null
  };
  const recId = cleanTextValue(payload.id);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_bank_reconciliations${recId ? `?id=eq.${encodeURIComponent(recId)}` : ""}`, {
    method: recId ? "PATCH" : "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(recId ? row : [row])
  });
  if (!res.ok) {
    const text = await res.text();
    if (isMissingTableText(text, "accounting_bank_reconciliations")) throw new Error("Run the 2026-04-27 accounting workflow migration before saving bank reconciliations.");
    throw new Error(`Could not save bank reconciliation. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function buildPayrollPayoutReconciliationReport(env, { month, year } = {}) {
  const runs = await loadPayrollRuns(env, { month, year });
  const recs = await listPayrollPayoutReconciliations(env, { month, year });
  const recMap = new Map((recs || []).map((row) => [String(row.payroll_run_id || ""), row]));
  const rows = runs.map((run) => {
    const rec = recMap.get(String(run.id || "")) || null;
    const expected = roundMoney(run.total_gross_cad || 0);
    const expectedDeductions = roundMoney(run.total_deductions_cad || 0);
    const expectedNet = roundMoney((run.total_net_pay_cad != null ? run.total_net_pay_cad : (expected - expectedDeductions)) || 0);
    const paid = roundMoney(rec?.paid_gross_cad || 0);
    const paidNet = roundMoney(rec?.paid_net_pay_cad || 0);
    return {
      payroll_run_id: run.id,
      period_start: run.period_start || null,
      period_end: run.period_end || null,
      status: rec?.status || "pending",
      payout_date: rec?.payout_date || null,
      payment_account_code: rec?.payment_account_code || "cash",
      expected_gross_cad: expected,
      expected_deductions_cad: expectedDeductions,
      expected_net_pay_cad: expectedNet,
      paid_gross_cad: paid,
      paid_net_pay_cad: paidNet,
      source_deductions_remitted_cad: roundMoney(rec?.source_deductions_remitted_cad || 0),
      gross_difference_cad: roundMoney(paid - expected),
      net_difference_cad: roundMoney(paidNet - expectedNet),
      difference_cad: roundMoney(paid - expected),
      note: rec?.note || run.note || null,
      accounting_entry_id: rec?.accounting_entry_id || run.accounting_entry_id || null
    };
  });
  return {
    month,
    year,
    totals: {
      run_count: rows.length,
      expected_gross_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.expected_gross_cad || 0), 0)),
      expected_deductions_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.expected_deductions_cad || 0), 0)),
      expected_net_pay_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.expected_net_pay_cad || 0), 0)),
      paid_gross_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.paid_gross_cad || 0), 0)),
      paid_net_pay_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.paid_net_pay_cad || 0), 0)),
      source_deductions_remitted_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.source_deductions_remitted_cad || 0), 0)),
      difference_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.difference_cad || 0), 0)),
      reconciled_count: rows.filter((row) => ["reconciled", "paid"].includes(String(row.status || ""))).length
    },
    rows
  };
}

export async function listPayrollPayoutReconciliations(env, { month, year } = {}) {
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_payroll_payout_reconciliations?select=*&order=payout_date.desc,created_at.desc&limit=120`;
  if (month && year) {
    const { start, nextMonth } = monthRange(month, year);
    url += `&payout_date=gte.${encodeURIComponent(start)}&payout_date=lt.${encodeURIComponent(nextMonth)}`;
  }
  return await fetchRowsWithMissingTableFallback(env, url, "accounting_payroll_payout_reconciliations", "Could not load payroll payout reconciliations.");
}

export async function savePayrollPayoutReconciliation(env, payload = {}, actor = {}) {
  const headers = serviceHeaders(env);
  const runId = cleanTextValue(payload.payroll_run_id);
  if (!runId) throw new Error("A payroll run is required.");
  const runs = await loadPayrollRuns(env, {});
  const run = (runs || []).find((row) => String(row.id || "") === runId);
  if (!run) throw new Error("Payroll run not found.");

  const payoutDate = cleanTextValue(payload.payout_date) || new Date().toISOString().slice(0, 10);
  await assertPeriodWritable(env, payoutDate);
  const expected = roundMoney(run.total_gross_cad || 0);
  const expectedDeductions = roundMoney(run.total_deductions_cad || payload.expected_deductions_cad || 0);
  const expectedNet = roundMoney((run.total_net_pay_cad != null ? run.total_net_pay_cad : (expected - expectedDeductions)) || 0);
  const paid = roundMoney(payload.paid_gross_cad || expected);
  const paidNet = roundMoney(payload.paid_net_pay_cad || payload.net_pay_cad || expectedNet);
  const row = {
    payroll_run_id: runId,
    payout_date: payoutDate,
    payment_account_code: cleanTextValue(payload.payment_account_code) || "cash",
    expected_gross_cad: expected,
    expected_deductions_cad: expectedDeductions,
    expected_net_pay_cad: expectedNet,
    paid_gross_cad: paid,
    paid_net_pay_cad: paidNet,
    source_deductions_remitted_cad: roundMoney(payload.source_deductions_remitted_cad || 0),
    difference_cad: roundMoney(paid - expected),
    net_difference_cad: roundMoney(paidNet - expectedNet),
    status: cleanTextValue(payload.status) || "reconciled",
    note: cleanTextValue(payload.note) || null,
    accounting_entry_id: cleanTextValue(payload.accounting_entry_id) || run.accounting_entry_id || null,
    reconciled_by_name: actor.name || null,
    reconciled_by_staff_user_id: actor.staffUserId || null
  };
  const recId = cleanTextValue(payload.id);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_payroll_payout_reconciliations${recId ? `?id=eq.${encodeURIComponent(recId)}` : ""}`, {
    method: recId ? "PATCH" : "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(recId ? row : [row])
  });
  if (!res.ok) {
    const text = await res.text();
    if (isMissingTableText(text, "accounting_payroll_payout_reconciliations")) throw new Error("Run the 2026-04-27 accounting workflow migration before saving payroll payout reconciliations.");
    throw new Error(`Could not save payroll payout reconciliation. ${text}`);
  }
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function listPeriodCloses(env, { year = null } = {}) {
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_period_closes?select=*&order=month_start.desc&limit=36`;
  if (year) {
    url += `&month_start=gte.${encodeURIComponent(`${year}-01-01`)}&month_start=lt.${encodeURIComponent(`${Number(year) + 1}-01-01`)}`;
  }
  return await fetchRowsWithMissingTableFallback(env, url, "accounting_period_closes", "Could not load period close workflow.");
}

export async function savePeriodClose(env, payload = {}, actor = {}) {
  const headers = serviceHeaders(env);
  const month = Number(payload.month || 0);
  const year = Number(payload.year || 0);
  const monthStart = payload.month_start || (year && month ? `${year}-${String(month).padStart(2, "0")}-01` : null);
  if (!monthStart) throw new Error("month/year is required.");
  const status = cleanTextValue(payload.status) || "review";
  const row = {
    month_start: monthStart,
    status,
    notes: cleanTextValue(payload.notes) || null,
    checklist: payload.checklist && typeof payload.checklist === "object" ? payload.checklist : null,
    locked_at: ["locked", "closed"].includes(status) ? new Date().toISOString() : null,
    locked_by_name: ["locked", "closed"].includes(status) ? (actor.name || null) : null,
    locked_by_staff_user_id: ["locked", "closed"].includes(status) ? (actor.staffUserId || null) : null
  };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_period_closes?month_start=eq.${encodeURIComponent(monthStart)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation", "Content-Type": "application/json" },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const text = await res.text();
    if (isMissingTableText(text, "accounting_period_closes")) throw new Error("Run the 2026-04-27 accounting workflow migration before saving the accountant lock / close workflow.");
    throw new Error(`Could not save period close workflow. ${text}`);
  }
  let rows = await res.json().catch(() => []);
  if (!Array.isArray(rows) || !rows.length) {
    const createRes = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_period_closes`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation", "Content-Type": "application/json" },
      body: JSON.stringify([row])
    });
    if (!createRes.ok) {
      const text = await createRes.text();
      if (isMissingTableText(text, "accounting_period_closes")) throw new Error("Run the 2026-04-27 accounting workflow migration before saving the accountant lock / close workflow.");
      throw new Error(`Could not save period close workflow. ${text}`);
    }
    rows = await createRes.json().catch(() => []);
  }
  return Array.isArray(rows) ? rows[0] : rows;
}

async function assertPeriodWritable(env, entryDate) {
  const dateValue = cleanTextValue(entryDate) || new Date().toISOString().slice(0, 10);
  const monthStart = `${dateValue.slice(0, 7)}-01`;
  const rows = await listPeriodCloses(env, {});
  const match = (rows || []).find((row) => String(row.month_start || "") === monthStart);
  const status = String(match?.status || "open").toLowerCase();
  if (status === "locked" || status === "closed") {
    throw new Error(`The accounting period ${monthStart} is ${status}. Reopen it before posting new entries.`);
  }
}

async function loadPayrollRuns(env, { month = null, year = null } = {}) {
  let url = `${env.SUPABASE_URL}/rest/v1/staff_payroll_runs?select=id,period_start,period_end,status,total_gross_cad,total_hours,accounting_entry_id,note,posted_at&order=period_end.desc&limit=120`;
  if (month && year) {
    const { start, nextMonth } = monthRange(month, year);
    url += `&period_end=gte.${encodeURIComponent(start)}&period_end=lt.${encodeURIComponent(nextMonth)}`;
  }
  return await fetchRowsWithMissingTableFallback(env, url, "staff_payroll_runs", "Could not load payroll runs.");
}

async function fetchRowsWithMissingTableFallback(env, url, tableHint, errorPrefix) {
  const headers = serviceHeaders(env);
  const res = await fetch(url, { headers });
  if (res.ok) return await res.json().catch(() => []);
  const text = await res.text();
  if (isMissingTableText(text, tableHint)) return [];
  throw new Error(`${errorPrefix} ${text}`);
}

function isMissingTableText(text, tableHint) {
  const low = String(text || "").toLowerCase();
  const hint = String(tableHint || "").toLowerCase();
  return (
    low.includes(`relation "${hint}" does not exist`) ||
    low.includes(`relation '${hint}' does not exist`) ||
    (low.includes("could not find the table") && low.includes(hint)) ||
    (low.includes("schema cache") && low.includes(hint)) ||
    low.includes("42p01")
  );
}

function cleanTextValue(value) {
  return String(value == null ? "" : value).trim();
}

function parseDelimitedValues(value) {
  return String(value || "")
    .split(/[\n,|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function advanceCadenceDate(dateString, cadence) {
  const base = new Date(`${dateString}T00:00:00Z`);
  const next = new Date(base);
  const key = String(cadence || "monthly").toLowerCase();
  if (key === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  else if (key === "quarterly") next.setUTCMonth(next.getUTCMonth() + 3);
  else if (key === "yearly" || key === "annual") next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next.toISOString().slice(0, 10);
}
