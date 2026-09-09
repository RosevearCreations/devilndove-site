// Release 467 Build 81 — pure Finance & Accounting Cockpit derivation.
// This helper classifies existing read authority. It never posts, pays, refunds, purchases, closes, or exports.

export const FINANCE_COCKPIT_STAGE_IDS = Object.freeze([
  'orders-payments-refunds',
  'accounts-receivable',
  'accounts-payable',
  'bank-reconciliation',
  'expenses',
  'inventory-costs',
  'journals',
  'month-end-accountant-export',
]);

function text(value) { return String(value ?? '').trim(); }
function n(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function list(value) { return Array.isArray(value) ? value : []; }
function month(value) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(text(value)) ? text(value) : ''; }
function data(source) { return source?.available === true && source.data && typeof source.data === 'object' ? source.data : null; }
function schemaReady(source) { const value = data(source); return Boolean(value && value.schema_ready !== false); }
function metric(label, value) { return { label, value: n(value) }; }
function stage(id, label, state, detail, metrics, ownerUrl, ownerLabel) {
  return { id, label, state, detail, metrics, owner_url: ownerUrl, owner_label: ownerLabel };
}
function unavailable(id, label, ownerUrl, ownerLabel) {
  return stage(id, label, 'unavailable', 'The required read authority is unavailable or not schema-ready. No readiness is inferred.', [], ownerUrl, ownerLabel);
}

export function buildFinanceAccountingCockpit(periodValue, sources = {}) {
  const period = month(periodValue);
  if (!period) throw new RangeError('Finance cockpit period must use YYYY-MM.');

  const commerce = data(sources.commerce);
  const close = data(sources.close);
  const commitments = data(sources.commitments);
  const reconciliation = data(sources.reconciliation);
  const expenses = data(sources.expenses);
  const monthExpenses = list(expenses?.expenses).filter((row) => text(row.expense_date || row.created_at).slice(0, 7) === period);
  const costing = data(sources.costing);
  const journal = data(sources.journal);
  const stages = [];

  if (!schemaReady(sources.commerce)) {
    stages.push(unavailable('orders-payments-refunds', 'Orders, payments & refunds', '/admin/order-finance-settlement-readiness/', 'Open settlement readiness'));
  } else {
    const pendingPayments = n(commerce.payments?.pending_count);
    const refundAttention = n(commerce.refunds?.attention_count);
    const review = pendingPayments > 0 || refundAttention > 0;
    stages.push(stage(
      'orders-payments-refunds', 'Orders, payments & refunds', review ? 'review' : 'ready',
      review ? 'Pending payment or refund evidence requires review before settlement can be relied upon.' : 'No pending payment or refund exception is visible for the selected month.',
      [metric('Orders', commerce.orders?.count), metric('Settled payments', commerce.payments?.settled_count), metric('Refund attention', refundAttention)],
      '/admin/order-finance-settlement-readiness/', 'Open settlement readiness'
    ));
  }

  if (!schemaReady(sources.close)) {
    stages.push(unavailable('accounts-receivable', 'Accounts receivable', '/admin/accounting/', 'Open Accounting'));
  } else {
    const receivable = n(close.payment?.summary?.outstanding_cents);
    stages.push(stage(
      'accounts-receivable', 'Accounts receivable', receivable > 0 ? 'review' : 'ready',
      receivable > 0 ? 'One or more selected-month orders still have an outstanding balance.' : 'No outstanding selected-month order balance is visible.',
      [metric('Outstanding cents', receivable), metric('Applied cents', close.payment?.summary?.applied_cents)],
      '/admin/accounting/#accountingCloseWorkflowMount', 'Review receivables'
    ));
  }

  if (!schemaReady(sources.commitments) || !schemaReady(sources.journal)) {
    stages.push(unavailable('accounts-payable', 'Accounts payable', '/admin/inventory-operations/', 'Review purchasing'));
  } else {
    const openCommitments = n(commitments.open_purchase_order_count);
    const commitmentCents = n(commitments.open_commitment_cents);
    const apLedgerCents = Math.max(0, n(journal.ap_credit_cents) - n(journal.ap_debit_cents));
    const review = openCommitments > 0 || (commitmentCents > 0 && apLedgerCents === 0);
    stages.push(stage(
      'accounts-payable', 'Accounts payable', review ? 'review' : 'ready',
      review ? 'Open purchase commitments need invoice/receipt review. A purchase order is not treated as booked Accounts Payable.' : 'No open purchase commitment requires AP review.',
      [metric('Open purchase orders', openCommitments), metric('Commitment cents', commitmentCents), metric('AP ledger cents', apLedgerCents)],
      '/admin/inventory-operations/', 'Review purchasing'
    ));
  }

  if (!schemaReady(sources.reconciliation) || !schemaReady(sources.close)) {
    stages.push(unavailable('bank-reconciliation', 'Bank & processor reconciliation', '/admin/accounting/#accountingReconciliationCard', 'Open reconciliation'));
  } else {
    const unresolved = n(reconciliation.summary?.unresolved_row_count);
    const bankChecked = n(close.closure?.close_checklist?.bank_reconciled) === 1;
    const review = unresolved > 0 || !bankChecked;
    stages.push(stage(
      'bank-reconciliation', 'Bank & processor reconciliation', review ? 'review' : 'ready',
      review ? 'Processor differences or the month-end bank confirmation still require review.' : 'Processor reconciliation has no unresolved row and the bank checklist is confirmed.',
      [metric('Unresolved rows', unresolved), metric('Statements', reconciliation.summary?.attachment_count), metric('Bank confirmed', bankChecked ? 1 : 0)],
      '/admin/accounting/#accountingReconciliationCard', 'Open reconciliation'
    ));
  }

  if (!schemaReady(sources.expenses)) {
    stages.push(unavailable('expenses', 'Expenses & evidence', '/admin/accounting/#expense-entry', 'Review expenses'));
  } else {
    const missingLedger = monthExpenses.filter((row) => !text(row.ledger_code)).length;
    const missingEvidence = monthExpenses.filter((row) => n(row.attachment_count) === 0).length;
    const review = missingLedger > 0 || missingEvidence > 0;
    stages.push(stage(
      'expenses', 'Expenses & evidence', review ? 'review' : 'ready',
      review ? 'Selected-month expenses are missing ledger classification or supporting evidence.' : 'Selected-month expense rows have ledger classification and evidence, or no expenses are recorded.',
      [metric('Expenses', monthExpenses.length), metric('Missing ledger', missingLedger), metric('Missing evidence', missingEvidence)],
      '/admin/accounting/#expense-entry', 'Review expenses'
    ));
  }

  if (!schemaReady(sources.costing)) {
    stages.push(unavailable('inventory-costs', 'Inventory & product costs', '/admin/inventory-finance-valuation-readiness/', 'Review costing'));
  } else {
    const summary = costing.summary || {};
    const costGaps = n(summary.uncosted_product_count) + n(summary.missing_cost_link_count) + n(summary.negative_margin_count);
    stages.push(stage(
      'inventory-costs', 'Inventory & product costs', costGaps > 0 ? 'review' : 'ready',
      costGaps > 0 ? 'Cost links, cost coverage, or negative-margin results require review.' : 'No costing exception is visible in the selected-month costing authority.',
      [metric('Uncosted', summary.uncosted_product_count), metric('Missing links', summary.missing_cost_link_count), metric('Negative margin', summary.negative_margin_count)],
      '/admin/inventory-finance-valuation-readiness/', 'Review costing'
    ));
  }

  if (!schemaReady(sources.journal)) {
    stages.push(unavailable('journals', 'General journal', '/admin/accounting/#accountingReportMount', 'Review journal'));
  } else {
    const summary = journal.summary || {};
    const commerceActivity = n(commerce?.orders?.count) + monthExpenses.length;
    const emptyWithActivity = commerceActivity > 0 && n(summary.entry_count) === 0;
    const review = n(summary.imbalance_count) > 0 || n(summary.journal_imbalance_cents) !== 0 || emptyWithActivity;
    stages.push(stage(
      'journals', 'General journal', review ? 'review' : 'ready',
      review ? 'The journal is imbalanced or has not yet represented visible monthly activity.' : 'The selected-month journal is balanced, or no source activity requires entries.',
      [metric('Entries', summary.entry_count), metric('Imbalances', summary.imbalance_count), metric('Net imbalance cents', summary.journal_imbalance_cents)],
      '/admin/accounting/#accountingReportMount', 'Review journal'
    ));
  }

  if (!schemaReady(sources.close)) {
    stages.push(unavailable('month-end-accountant-export', 'Month-end & accountant export', '/admin/month-end/', 'Open Month-End'));
  } else {
    const blockers = list(close.close_readiness?.blockers);
    const ready = close.close_readiness?.ready === true;
    stages.push(stage(
      'month-end-accountant-export', 'Month-end & accountant export', ready ? 'ready' : 'review',
      ready ? 'The existing close authority reports ready; exports remain deliberate operator downloads.' : `${blockers.length || 1} close blocker(s) remain before accountant export readiness.`,
      [metric('Close blockers', blockers.length), metric('Evidence files', close.evidence_bundle_summary?.total_attachments), metric('Export manifests', list(close.export_packages).length)],
      '/admin/month-end/', 'Open Month-End'
    ));
  }

  const counts = stages.reduce((acc, item) => { acc[item.state] = (acc[item.state] || 0) + 1; return acc; }, { ready: 0, review: 0, unavailable: 0 });
  const sourceErrors = Object.entries(sources).filter(([, source]) => source?.available !== true).map(([name, source]) => ({ source: name, code: text(source?.code) || 'read_unavailable' }));
  return {
    release: 467,
    build: 81,
    authority: 'finance-accounting-cockpit',
    period_month: period,
    state: counts.unavailable ? 'PARTIAL_SOURCE_FAILURE' : (counts.review ? 'REVIEW_REQUIRED' : 'READY_FOR_ACCOUNTANT_REVIEW'),
    summary: { stage_count: stages.length, ready_count: counts.ready, review_count: counts.review, unavailable_count: counts.unavailable },
    stages,
    source_errors: sourceErrors,
    boundaries: {
      read_only_projection: true,
      purchase_order_is_not_accounts_payable: true,
      readiness_is_not_posting_authorization: true,
      payment_execution: false,
      refund_execution: false,
      accounting_posting: false,
      purchasing: false,
      period_close: false,
      automatic_export: false,
      request_time_schema_mutation: false,
      provider_execution: false,
    },
  };
}
