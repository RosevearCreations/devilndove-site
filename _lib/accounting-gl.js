import { serviceHeaders } from "./staff-auth.js";

export function roundMoney(value) {
  const num = Number(value || 0);
  return Math.round((Number.isFinite(num) ? num : 0) * 100) / 100;
}

export async function loadAccounts(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_accounts?select=*&order=sort_order.asc,code.asc`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load accounting accounts. ${await res.text()}`);
  return await res.json().catch(() => []);
}

export async function postJournalEntry(env, entry, lines) {
  const headers = serviceHeaders(env);
  const debits = roundMoney(lines.filter((x) => x.direction === "debit").reduce((s, x) => s + Number(x.amount_cad || 0), 0));
  const credits = roundMoney(lines.filter((x) => x.direction === "credit").reduce((s, x) => s + Number(x.amount_cad || 0), 0));
  if (debits <= 0 || credits <= 0 || debits !== credits) throw new Error("Journal entry is not balanced.");

  const entryRes = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_journal_entries`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify([{ ...entry, subtotal_cad: roundMoney(entry.subtotal_cad), tax_cad: roundMoney(entry.tax_cad), total_cad: roundMoney(entry.total_cad) }])
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
    byAccount[row.account_code].amount_cad = roundMoney(byAccount[row.account_code].amount_cad + parsed.signed_amount_cad);
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
    const settledAmount = roundMoney(settled.reduce((sum, row) => sum + Number(row.total_cad || 0), 0));
    const total = roundMoney(entry.total_cad || 0);
    const balance = roundMoney(total - settledAmount);
    const paymentStatus = balance <= 0 ? "paid" : (settledAmount > 0 ? "partial" : "open");
    if (status !== "all" && paymentStatus !== status) continue;
    payables.push({ ...entry, settled_amount_cad: settledAmount, balance_due_cad: balance, payment_status: paymentStatus, settlements: settled });
  }
  return payables;
}

export async function settlePayable(env, { entry_id, amount_cad, payment_account = "cash", payment_date, memo = null, actorName = null, actorStaffUserId = null }) {
  const headers = serviceHeaders(env);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=*&id=eq.${encodeURIComponent(entry_id)}&limit=1`, { headers });
  if (!res.ok) throw new Error(`Could not load payable entry. ${await res.text()}`);
  const bill = (await res.json().catch(() => []))[0];
  if (!bill) throw new Error("Payable entry not found.");
  const existingSettled = await loadSettlementsForEntry(env, entry_id);
  const already = roundMoney(existingSettled.reduce((s, row) => s + Number(row.total_cad || 0), 0));
  const total = roundMoney(bill.total_cad || 0);
  const remaining = roundMoney(total - already);
  const settleAmount = amount_cad == null ? remaining : roundMoney(amount_cad);
  if (settleAmount <= 0) throw new Error("Settlement amount must be greater than zero.");
  if (settleAmount > remaining) throw new Error("Settlement amount is greater than the remaining payable balance.");
  const entryType = settleAmount === remaining ? "payable_settlement" : "payable_partial_settlement";
  const posted = await postJournalEntry(env, {
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
    { account_code: "accounts_payable", direction: "debit", amount_cad: settleAmount, memo: memo || `Settlement for payable ${entry_id}` },
    { account_code: payment_account, direction: "credit", amount_cad: settleAmount, memo: memo || `Settlement for payable ${entry_id}` }
  ]);
  return posted;
}

export async function buildTaxReport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year, accountCode: "sales_tax_payable" });
  let net = 0;
  for (const row of rows) net = roundMoney(net + signedAmountForRow(row).signed_amount_cad);
  const collected = roundMoney(rows.filter((r) => String(r.direction) === "credit").reduce((s, r) => s + Number(r.amount_cad || 0), 0));
  const credits = roundMoney(rows.filter((r) => String(r.direction) === "credit").reduce((s, r) => s + Number(r.amount_cad || 0), 0));
  const debits = roundMoney(rows.filter((r) => String(r.direction) === "debit").reduce((s, r) => s + Number(r.amount_cad || 0), 0));
  return { month, year, collected_tax_cad: collected, tax_account_credits_cad: credits, tax_account_debits_cad: debits, net_tax_payable_cad: net, suggested_remittance_cad: Math.max(0, net), rows };
}

export async function postTaxRemittance(env, { amount_cad = null, payment_account = "cash", payment_date = null, memo = null, actorName = null, actorStaffUserId = null, referenceLabel = null }) {
  const settleDate = payment_date || new Date().toISOString().slice(0, 10);
  const currentPayable = await loadAccountBalanceThroughDate(env, "sales_tax_payable", addDays(settleDate, 1));
  const outstanding = Math.max(0, roundMoney(currentPayable));
  const remittanceAmount = amount_cad == null ? outstanding : roundMoney(amount_cad);
  if (remittanceAmount <= 0) throw new Error("There is no tax remittance amount available to post.");
  if (remittanceAmount > outstanding) throw new Error("Remittance amount is greater than the current sales tax payable balance.");
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
    last_recorded_by_name: actorName
  }, [
    { account_code: "sales_tax_payable", direction: "debit", amount_cad: remittanceAmount, memo: memo || `Sales tax remittance for ${label}` },
    { account_code: payment_account, direction: "credit", amount_cad: remittanceAmount, memo: memo || `Sales tax remittance for ${label}` }
  ]);
}

export async function buildOwnerEquityReport(env, { month, year }) {
  const ownerDrawRows = await loadPostedLineRows(env, { month, year, accountCode: "owner_draw" });
  const equityRows = await loadPostedLineRows(env, { month, year, accountCode: "owner_equity" });
  const ownerDrawTotal = roundMoney(ownerDrawRows.reduce((s, r) => s + signedAmountForRow(r).signed_amount_cad, 0));
  const ownerEquityDelta = roundMoney(equityRows.reduce((s, r) => s + signedAmountForRow(r).signed_amount_cad, 0));
  return { month, year, owner_draw_cad: ownerDrawTotal, owner_equity_delta_cad: ownerEquityDelta, rows: { owner_draw: ownerDrawRows, owner_equity: equityRows } };
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
    buckets[code].amount_cad = roundMoney(buckets[code].amount_cad + parsed.signed_amount_cad);
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
  const totalEquityAccounts = roundMoney(equityAccounts.reduce((s, r) => s + Number(r.amount_cad || 0), 0));
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
  const totals = { operating_cad: 0, investing_cad: 0, financing_cad: 0, net_change_cad: 0, opening_cash_cad: 0, closing_cash_cad: 0 };

  for (const groupRows of grouped.values()) {
    const cashRows = groupRows.filter((row) => String(row.account_code) === "cash");
    if (!cashRows.length) continue;
    const entry = cashRows[0].entry || {};
    const cashDelta = roundMoney(cashRows.reduce((sum, row) => sum + signedAmountForRow(row).signed_amount_cad, 0));
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
  totals.net_change_cad = roundMoney(totals.operating_cad + totals.investing_cad + totals.financing_cad);

  entries.sort((a, b) => String(a.entry_date || "").localeCompare(String(b.entry_date || "")) || String(a.entry_type || "").localeCompare(String(b.entry_type || "")));

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
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,item_type,name,category,subcategory,qty_on_hand,reorder_point,reorder_qty,unit_label,cost_cents,preferred_vendor,vendor_sku,reuse_policy,is_active,is_public,updated_at&order=item_type.asc,name.asc`, { headers });
  if (!res.ok) throw new Error(`Could not load inventory cost coverage. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  const items = Array.isArray(rows) ? rows : [];
  const active = items.filter((item) => item && item.is_active !== false);
  const missing = active.filter((item) => !Number.isFinite(Number(item.cost_cents)) || Number(item.cost_cents) <= 0);
  const missingOnHand = missing.filter((item) => Number(item.qty_on_hand || 0) > 0);
  const reorderableMissing = missing.filter((item) => String(item.reuse_policy || "reorder") !== "never_reuse");
  const valuedOnHand = active.filter((item) => Number(item.qty_on_hand || 0) > 0 && Number(item.cost_cents || 0) > 0);
  const costedInventoryValue = roundMoney(valuedOnHand.reduce((sum, item) => sum + ((Number(item.qty_on_hand || 0) * Number(item.cost_cents || 0)) / 100), 0));

  return {
    totals: {
      active_items: active.length,
      missing_cost_items: missing.length,
      missing_cost_on_hand_items: missingOnHand.length,
      costed_items: active.length - missing.length,
      cost_coverage_pct: active.length ? roundMoney(((active.length - missing.length) / active.length) * 100) : 100,
      costed_inventory_value_cad: costedInventoryValue,
      reorderable_missing_cost_items: reorderableMissing.length
    },
    items_missing_cost: missingOnHand.concat(missing.filter((item) => Number(item.qty_on_hand || 0) <= 0)).slice(0, 100)
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
  const records = (await loadAccountingRecords(env, { startDate: start, endDateExclusive: nextMonth, limit: 1000 }))
    .filter((row) => String(row.order_status || "open").toLowerCase() !== "cancelled");

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
  const staffRates = await loadStaffRates(env, Array.from(new Set(timeEntries.map((row) => String(row.staff_user_id || "").trim()).filter(Boolean))));
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

  const overheadPool = roundMoney(Math.max(0, Number(monthlyReport.totals?.expense || 0) - totalDirectCogs));
  const totalRecognizedRevenue = roundMoney(records.reduce((sum, row) => sum + recognizedRevenueForRecord(row), 0));

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
  }).sort((a, b) => Number(b.estimated_contribution_after_labor_cad || 0) - Number(a.estimated_contribution_after_labor_cad || 0));

  return {
    month,
    year,
    period_start: start,
    period_end_exclusive: nextMonth,
    method_note: "Estimated overhead is allocated across the selected month's booking revenue share after subtracting direct inventory COGS already posted to Cost of Goods Sold. Estimated direct labor is shown separately using logged job minutes × staff hourly_rate_cents when available, because payroll may already sit inside posted expenses.",
    totals: {
      booking_count: rows.length,
      recognized_revenue_cad: totalRecognizedRevenue,
      collected_revenue_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.collected_revenue_cad || 0), 0)),
      direct_cogs_cad: totalDirectCogs,
      estimated_direct_labor_cad: totalEstimatedDirectLabor,
      estimated_contribution_after_labor_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.estimated_contribution_after_labor_cad || 0), 0)),
      overhead_pool_cad: overheadPool,
      estimated_net_after_overhead_cad: roundMoney(rows.reduce((sum, row) => sum + Number(row.estimated_net_after_overhead_cad || 0), 0))
    },
    rows
  };
}

export async function buildGeneralLedgerExport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year });
  const header = ["Entry Date", "Entry Type", "Reference Type", "Reference ID", "Vendor / Payee", "Account Code", "Account Label", "Direction", "Amount CAD", "Memo"];
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
  for (const row of report.by_account.filter((item) => ["revenue", "expense"].includes(String(item.account_type)))) {
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
      lines.push([csvSafe(section), csvSafe(row.account_code || ""), csvSafe(row.label || ""), csvSafe(roundMoney(row.amount_cad || 0))].join(","));
    }
  }
  lines.push([csvSafe("equity"), "", csvSafe("Retained Earnings / Net Income To Date"), csvSafe(report.totals.retained_earnings_cad || 0)].join(","));
  lines.push([csvSafe("summary"), "", csvSafe("Assets"), csvSafe(report.totals.assets_cad || 0)].join(","));
  lines.push([csvSafe("summary"), "", csvSafe("Liabilities and Equity"), csvSafe(report.totals.liabilities_and_equity_cad || 0)].join(","));
  return lines.join("\n");
}

export async function buildCashFlowExport(env, { month, year }) {
  const report = await buildCashFlowReport(env, { month, year });
  const header = ["Entry Date", "Entry Type", "Category", "Cash Delta CAD", "Reference Type", "Reference ID", "Memo", "Counterpart Accounts"];
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
  const header = ["Entry ID", "Entry Date", "Vendor", "Due Date", "Payment Status", "Total CAD", "Settled CAD", "Balance Due CAD", "Settlement Dates", "Memo"];
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
      csvSafe((row.settlements || []).map((item) => `${item.entry_date || ""} ${roundMoney(item.total_cad || 0)}`).join(" | ")),
      csvSafe(row.memo || "")
    ].join(","));
  }
  return lines.join("\n");
}

export async function buildInventoryCostExport(env) {
  const report = await buildInventoryCostCompletenessReport(env);
  const header = ["Item Key", "Type", "Name", "Category", "Qty On Hand", "Unit", "Preferred Vendor", "Vendor SKU", "Updated At"];
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
  const header = ["Booking ID", "Service Date", "Customer", "Email", "Package", "Order Status", "Balance Due CAD", "Days Outstanding", "Aging Bucket", "As Of"];
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
  const header = ["Booking ID", "Service Date", "Customer", "Package", "Order Status", "Recognized Revenue CAD", "Collected Revenue CAD", "Balance Due CAD", "Direct COGS CAD", "Estimated Direct Labor CAD", "Contribution After Labor CAD", "Allocated Overhead CAD", "Estimated Gross Profit CAD", "Estimated Net After Overhead CAD"];
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
  lines.push(["", "", csvSafe("Totals"), "", "", csvSafe(report.totals.recognized_revenue_cad || 0), csvSafe(report.totals.collected_revenue_cad || 0), "", csvSafe(report.totals.direct_cogs_cad || 0), csvSafe(report.totals.estimated_direct_labor_cad || 0), csvSafe(report.totals.estimated_contribution_after_labor_cad || 0), csvSafe(report.totals.overhead_pool_cad || 0), "", csvSafe(report.totals.estimated_net_after_overhead_cad || 0)].join(","));
  return lines.join("\n");
}

export async function postInventoryUsageCOGS(env, { bookingId, item, qtyUsed, actorName = null, note = null }) {
  const costCents = Number(item?.cost_cents || 0);
  if (!Number.isFinite(costCents) || costCents <= 0 || !Number.isFinite(Number(qtyUsed)) || Number(qtyUsed) <= 0) return null;
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
    { account_code: "cost_of_goods_sold", direction: "debit", amount_cad: totalCost, memo: note || item?.name || item?.item_key || null },
    { account_code: "inventory_supplies", direction: "credit", amount_cad: totalCost, memo: note || item?.name || item?.item_key || null }
  ]);
}

async function loadSettlementsForEntry(env, entryId) {
  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=id,entry_date,entry_type,total_cad,memo,reference_id,settlement_of_entry_id,created_by_name,last_recorded_by_name&or=(reference_id.eq.${encodeURIComponent(entryId)},settlement_of_entry_id.eq.${encodeURIComponent(entryId)})&entry_type=in.(payable_settlement,payable_partial_settlement)&status=eq.posted&order=entry_date.asc`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load payable settlements. ${await res.text()}`);
  return await res.json().catch(() => []);
}

async function loadPostedLineRows(env, { month, year, accountCode = null, startDate = null, endDateExclusive = null } = {}) {
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
  const rows = await loadPostedLineRows(env, { startDate: "2020-01-01", endDateExclusive, accountCode });
  return roundMoney(rows.reduce((sum, row) => sum + signedAmountForRow(row).signed_amount_cad, 0));
}

function classifyCashEntry(rows) {
  const otherRows = rows.filter((row) => String(row.account_code) !== "cash");
  if (!otherRows.length) return "operating";
  const accountCodes = new Set(otherRows.map((row) => String(row.account_code || "")));
  const accountGroups = new Set(otherRows.map((row) => String(row.account?.account_group || "")));
  const accountTypes = new Set(otherRows.map((row) => String(row.account?.account_type || "")));
  if (accountCodes.has("equipment") || accountGroups.has("fixed_assets")) return "investing";
  if (accountCodes.has("owner_equity") || accountCodes.has("owner_draw") || accountTypes.has("equity")) return "financing";
  return "operating";
}

function signedAmountForRow(row) {
  const account = row.account || {};
  const type = String(account.account_type || "expense");
  const dir = String(row.direction || "debit");
  const amount = roundMoney(row.amount_cad || 0);
  const sign = (type === "revenue" || type === "liability" || type === "equity")
    ? (dir === "credit" ? 1 : -1)
    : (dir === "debit" ? 1 : -1);
  return { signed_amount_cad: roundMoney(sign * amount), account_type: type };
}

async function loadAccountingRecords(env, { startDate = null, endDateExclusive = null, limit = 500 } = {}) {
  const headers = serviceHeaders(env);
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_records?select=*&order=service_date.asc.nullslast,updated_at.desc&limit=${Math.max(1, Math.min(2000, Number(limit) || 500))}`;
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
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
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
