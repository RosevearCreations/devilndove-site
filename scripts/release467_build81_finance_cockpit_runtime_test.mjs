import assert from 'node:assert/strict';
import { FINANCE_COCKPIT_STAGE_IDS, buildFinanceAccountingCockpit } from '../functions/api/_lib/financeAccountingCockpit.js';

const available = (data) => ({ available: true, data: { schema_ready: true, ...data } });
const readySources = {
  commerce: available({ orders:{ count:2 }, payments:{ settled_count:2, pending_count:0 }, refunds:{ attention_count:0 } }),
  commitments: available({ open_purchase_order_count:0, open_commitment_cents:0 }),
  reconciliation: available({ summary:{ unresolved_row_count:0, attachment_count:1 } }),
  expenses: available({ count:1, expenses:[{ expense_date:'2026-09-08', ledger_code:'6100', attachment_count:1 }] }),
  costing: available({ summary:{ uncosted_product_count:0, missing_cost_link_count:0, negative_margin_count:0 } }),
  journal: available({ ap_debit_cents:0, ap_credit_cents:0, summary:{ entry_count:2, imbalance_count:0, journal_imbalance_cents:0 } }),
  close: available({
    payment:{ summary:{ outstanding_cents:0, applied_cents:2500 } },
    closure:{ close_checklist:{ bank_reconciled:1 } },
    close_readiness:{ ready:true, blockers:[] },
    evidence_bundle_summary:{ total_attachments:2 },
    export_packages:[{ package_key:'2026-09' }],
  }),
};

const ready = buildFinanceAccountingCockpit('2026-09', readySources);
assert.equal(ready.build, 81);
assert.equal(ready.state, 'READY_FOR_ACCOUNTANT_REVIEW');
assert.equal(ready.summary.stage_count, 8);
assert.equal(ready.summary.ready_count, 8);
assert.deepEqual(ready.stages.map((item) => item.id), FINANCE_COCKPIT_STAGE_IDS);
assert.equal(ready.boundaries.read_only_projection, true);
assert.equal(ready.boundaries.purchase_order_is_not_accounts_payable, true);
assert.equal(ready.boundaries.payment_execution, false);
assert.equal(ready.boundaries.accounting_posting, false);
assert.equal(ready.boundaries.period_close, false);

const reviewSources = structuredClone(readySources);
reviewSources.commerce.data.payments.pending_count = 1;
reviewSources.commerce.data.refunds.attention_count = 1;
reviewSources.commitments.data.open_purchase_order_count = 2;
reviewSources.commitments.data.open_commitment_cents = 15000;
reviewSources.reconciliation.data.summary.unresolved_row_count = 1;
reviewSources.expenses.data.expenses[0].ledger_code = '';
reviewSources.expenses.data.expenses[0].attachment_count = 0;
reviewSources.costing.data.summary.uncosted_product_count = 1;
reviewSources.journal.data.summary.imbalance_count = 1;
reviewSources.journal.data.summary.journal_imbalance_cents = 25;
reviewSources.close.data.payment.summary.outstanding_cents = 1000;
reviewSources.close.data.closure.close_checklist.bank_reconciled = 0;
reviewSources.close.data.close_readiness = { ready:false, blockers:['bank', 'receipts'] };

const review = buildFinanceAccountingCockpit('2026-09', reviewSources);
assert.equal(review.state, 'REVIEW_REQUIRED');
assert.equal(review.summary.review_count, 8);
assert.equal(review.summary.unavailable_count, 0);

const failedSources = structuredClone(readySources);
failedSources.journal = { available:false, code:'journal_read_failed' };
const failed = buildFinanceAccountingCockpit('2026-09', failedSources);
assert.equal(failed.state, 'PARTIAL_SOURCE_FAILURE');
assert.equal(failed.summary.unavailable_count, 2, 'journal failure must also fail AP classification closed');
assert.deepEqual(failed.source_errors, [{ source:'journal', code:'journal_read_failed' }]);
assert.throws(() => buildFinanceAccountingCockpit('September 2026', readySources), RangeError);

console.log('RELEASE 467 BUILD 81 FINANCE COCKPIT RUNTIME: PASS');
console.log('Monthly stages: 8 / ORDER-TO-ACCOUNTANT CHAIN');
console.log('Partial source failure: FAILS CLOSED');
console.log('Posting/payment/refund/purchasing/close/export actions: NONE');
