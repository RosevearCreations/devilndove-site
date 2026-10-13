# Release 467 Build 383 — Cross-Project Accounting, Revenue & Profitability

**Admin workspace:** `/admin/cross-project-accounting/`. **Authenticated API:** `/api/admin/cross-project-accounting` read and explicitly reviewed writes.

The existing Finance `creative_project_profitability` record and `loadProfitabilityIntelligence` remain owners of financial projections. A source-linked read-only view also shows Creator sales, work-order time, actual Inventory consumption posts valued using **current unit cost estimates**, existing manufacturing evidence, and actual linked customer order/payment/refund/tax source records. Project orders are linked through Custom Request manufacturing identity and order status links, not names or emails. Orders do not establish booked project revenue. The original accounting system remains the sole posting owner.

**Never add overlapping sources**: manufacturing direct cost, Creator event material and Inventory use may count the same materials; Creative Process time and work-order time may count the same labour. Missing prices are unknown and must not become zero. Payment status does not prove a deposit category. Order taxes are not remitted taxes. Non-CAD order rows suppress aggregated CAD order totals; exchange rates are not guessed. A Finance profitability snapshot is not accountant-certified profit. The list has at most 100 projects, linked orders at most 20, Finance projection at most 150 and review history at most 80; truncation is indicated.

Migration `0035_release467_cross_project_finance_review.sql` adds append-only `creative_project_finance_review_events`: actor, timestamp, project, review kind/result, source reference, and note. SQLite enforces same-project source references for Finance, work-order, Creator event, Inventory post, manufacturing evidence and linked order IDs. A source-verification decision requires a real source-owned record reference; an operator note is not accounting evidence. Reassessment is another event. No journal, financial posting, payment, refund, stock or customer mutation is granted.

Validate with `python scripts/release467_build383_gate.py`; Development System Gate must first apply migration 0035 and deploy exact Preview, then promote exact GREEN Development tree to main and verify Production D1, Cloudflare Pages, public smoke and live-resource integrity. Never test by charging customers or posting real financial records.

**Next queued:** Build 384 — System-Wide Analytics, Automation & Operational Reliability.
