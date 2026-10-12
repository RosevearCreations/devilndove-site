# Release 467 Build 379 — Work Orders, Task Sequencing & Time Capture

Operator link: https://devilndove.com/admin/project-work-orders/ (admin login).

Actual work orders reuse the existing Creative Project operation plan, order and dependencies. Migration `0031` adds **append-only** `creative_work_order_events` for explicit status transitions, human-entered time (1–720 whole minutes per entry, date, operator ID) and evidence linking to an actual same-project `creative_work_events` ID. Nothing is auto-completed or published. Pending dependencies block ready, start and completion, and completion requires a real milestone. Every POST requires admin session, same-origin request, meaningful notes and an audit action. The status transition uses optimistic SQL compare-and-swap. No material stock move, CAIP access, or payroll/cost booking.

Operator plan editing remains in Creative Process. The picker is bounded to 100 projects, each work view to 80 operations, 300 dependencies and latest 100 historical entries. Historical events remain stored; incorrect logs require a reviewed future correction rather than deletion.

Migration discipline: Development D1 first, then Production migration before dependent Pages deploy; request-time DDL prohibited. Run `python scripts/release467_build379_regression.py`, `node --test scripts/release467_build379_rules.test.mjs`; verify exact-head Development quality, System Gate, runtime, hygiene, then matching-tree Production Pages and live-integrity proofs. Human acceptance of real time logs/evidence requires an authenticated operator, not synthetic CI.

**Next queued: Build 380 — Multi-Project Materials, Consumables & Costing.**
