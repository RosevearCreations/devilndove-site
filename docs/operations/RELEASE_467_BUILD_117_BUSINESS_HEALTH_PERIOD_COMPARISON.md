# Release 467 Build 117 — Business Health Period Comparison & Trend Review

Build 117 extends the read-only Business Health operator handoff with a selected-period versus prior-period comparison.

Only genuinely period-specific operational-quality evidence is graded: month-end readiness, close blockers, financial anomaly counts, outstanding balance, evidence gap and accountant-export gap. Profitability and I.T. are displayed only as current snapshots because their current authorities are not historical monthly ledgers.

Worsening signals sort ahead of improving signals. The comparison and Markdown handoff never persist acknowledgement/resolution state and never execute Accounting posting, period close, Inventory/Creative/price mutation, provider action, schema/D1/R2/binding mutation or Production business-data changes.

Canonical D1 migrations remain exactly `0001`–`0004`. Existing Finance, Month End, Creator/Profitability and I.T. workspaces remain the sole action owners.
