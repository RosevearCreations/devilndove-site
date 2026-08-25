# Build 340 — Accounting Reconciliation Read Extraction

`/api/admin/accounting-reconciliation` GET now delegates to `accountingReconciliationReadService.js`, which reads reconciliation reviews, attachments, vendor context and monthly sales-tax/processor-fee/shipping summaries without request-time schema creation. The legacy POST review-save path retains its existing write-side reconciliation/attachment schema compatibility. Dedicated GET-only contract: `/api/admin/contracts/accounting-reconciliation-read`.
