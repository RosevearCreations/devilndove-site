# Devil n Dove — Build 661 Commission, Invoice & Profit Evidence

**Operator route:** `/admin/commission-finance/`  
**Source endpoint:** Financials Admin `GET /api/admin/commission-finance-661?request_id=<original-id>`  
**Release intent:** source-only, read-only cross-authority commission finance acceptance. Production deployment does not itself certify actual financial accuracy, live payments or tax accounting.

## Source ownership, not a new money engine

| Evidence | Original source authority | Build 661 review |
| --- | --- | --- |
| Inquiry, customer decisions and quote | `custom_requests`, `custom_request_quote_drafts` and existing Custom Requests Admin | Original ID, state, quote total; no synthetic acceptance or quote price |
| Deposit/payment request | `custom_request_payment_request_drafts` | Latest request draft is **not** payment |
| Production and creative job | `creative_project_manufacturing_lifecycles`, `creative_work_projects` | Only the project actually linked to this request |
| Customer order | Active `custom_request_order_status_links` → `orders` | Five most recent originals; source-truncated results HOLD |
| Invoices and credit notes | `customer_documents` (Build 397/414) | Actual `issued` invoice number/amount/state, void handling; no draft disguised as invoice |
| Payment/refund record | `payments` and `payment_refunds` | Saved status/amount, unresolved refund HOLD; no provider settlement attestation |
| Manufacturing costs | `maker_project_cost_reviews`, source inventory posts, work-order time, production cost evidence and QA | Reuse Build 449 `projectCostProjection`; unknown inputs remain unknown; scrap/time views not double counted |
| Finance revenue reference | `creative_project_profitability` | Display source-entered reference separately; realized profit remains UNKNOWN |
| Owner acceptance | Private Build 656 record in `app_settings` | Three checkpoints; local observation is not independent certification |

### Exact owner checkpoints

1. `customer-requests.commission`
2. `invoicing.invoice`
3. `job-finances.margin`

They are source-owned and still use **proposed, not owner-ratified denominators**. The Build 661 desk cannot issue a Master Shell completion percentage or activate integrations.

## Owner walkthrough

1. Open **Financials → Commission Finance** (requires an active Financials Admin grant).
2. Select **List recent request IDs** or enter the original numerical Custom Request ID. The listing omits contact details; no private request is opened automatically.
3. Verify the quote state and total in **Custom Requests / Commission Workbench**. A quote, revision or proposed price alone does not constitute accepted work or booked sales revenue.
4. For commissions with an actual order, open **Customer Documents** to issue or verify its original invoice under the source's existing authority. This review screen never issues one. Voided and duplicate active invoices require investigation.
5. Inspect saved Order payments and refunds and compare them with actual provider records if authorized. The desk cannot independently confirm settlement, dispute, net payout or refund completion.
6. If an actual Creative Project exists, open **Project Costs**. Review posted inventory, work-order time, directly evidenced production inputs, unknown categories, and the latest human-reviewed pricing scenario. See **Cross-Project Accounting** for reconciliation and accounting ownership. **Never add overlapping BOM, creative time, posted material and current unit-cost estimates together.**
7. Record only personally observed device and owner evidence in **Module Acceptance**. Acceptance requires actual source reference, observer, date and the existing versioned receipt rules.
8. Keep external settlements, ledger posting, invoicing accuracy, tax classification, owner field and accountant review on HOLD until the relevant original records can be independently checked.

## Financial interpretation

- `quote_total_cents`: quoted price only; not revenue, invoice or cash.
- `payment_request_draft.amount_cents`: request to pay, not an actual payment.
- `customer_documents`: an actual issued invoice, but still **not evidence of cash received**.
- `saved_paid_cents`: sum of selected saved paid/completed/captured payment rows in the original source; **not a processor or bank settlement**. Null when currency/evidence truncation makes the comparison unsafe.
- `saved_completed_refund_cents`: saved completed/refunded subset, distinct from unresolved or failed refunds. Never infer settlement or subtract pending refunds as completed.
- `projectCostProjection`: candidate production cost and hypothetical pricing margin, with explicit unknowns; **not a posted expense or accountant-certified net profit**.
- `creative_project_profitability.revenue_cents`: source-entered finance reference only. No automatic profit calculation across different accounting bases.
- `ledger_profit_cents`, `master_completion_percent`: always `null` until a separate original owner/accountant and Master Shell certification exists.

## Data and security boundaries

- This Build 661 endpoint implements only GET. No database write, DDL, charge, refund, invoice issue/void, customer email, tax filing, payroll, posting, publication, stock correction or Master Shell event.
- The centralized middleware must authorize the Financials module and an active verified Admin. No unauthenticated or Storefront-only access.
- Explicit SQL projections plus response allowlists omit customer names, emails, street addresses, checkout tokens, provider payment IDs, document snapshots, notes and private media.
- Explicit one-request reads; latest 50 request identifiers for discovery; at most five source-linked orders, twenty documents/payments/refunds each. Any bounded truncation remains HOLD.
- Read result has `Cache-Control: private,no-store`, a source SHA-256 digest, source gaps and defensive error status; missing canonical tables/source receipts return HOLD, never an invented clean result.
- The two Build 190/191 value-operations browser scripts were checked against GitHub code references for active HTML/runtime consumers and preserved byte-for-byte in `docs/operations/historical/` before retiring their **unreferenced public runtime copies**. This keeps the fixed runtime budget unchanged without deleting historical content.

## What software GREEN means

The isolated code/tests and protected deployment can be GREEN while real commissions, issued invoice correctness, deposits, successful payments/refunds, actual costs and accountant review remain individually **UNKNOWN/HOLD**. Do not populate a paid/accepted customer example to force a green percentage. Use original records as they become available.

**Next proposed Build 662 — Worker Roles, Task Handoffs, Time Tracking & Mobile/Tablet Usability.**
