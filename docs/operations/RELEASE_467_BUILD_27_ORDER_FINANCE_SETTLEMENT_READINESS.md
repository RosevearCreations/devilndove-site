# Release 467 Build 27 — Order ↔ Finance Settlement Readiness

## Goal
Provide one bounded, read-only reconciliation between current order/payment/refund evidence and the existing Accounting-owned `accounting_order_records` read contract.

## Review states
`settlement_supported` means the compared total, effective-paid, outstanding and currency evidence agree. It is review evidence only. `accounting_unverified`, `accounting_record_missing`, `refund_review`, `currency_mismatch`, `order_total_mismatch`, `paid_amount_mismatch`, `outstanding_amount_mismatch` and `payment_status_mismatch` all require operator review.

## Ownership and safety
Orders/payment/refund workflows remain their existing owners. Accounting remains the financial write owner. Build 27 performs no charge/refund execution, accounting posting, order or Inventory mutation, schema/migration change, D1/R2 business-data mutation, provider execution/publication, Access, `main` or Production mutation.

Canonical migrations remain exactly `0001`–`0004`; Production remains Release 467 Build 20.
