# Release 467 Build 386 — Write Receipt Coverage Expansion & Cross-Tab Recovery

## Scope
Build 385's permanent, immutable D1 receipt history remains unchanged. Forward-only canonical migration **0037** adds a separate verified source-ledger for **work-order transition/time/milestone events** and **resource-calendar scheduling**. The four earlier protected write scopes remain supported. This build does **not** make all Admin writes or external provider actions exactly-once.

### New server guarantees
- Authenticated same-origin Admin POSTs now require unique request keys for work-order actions and resource calendar scheduling.
- Business insert and immutable receipt insert share a D1 transactional batch. The receipt trigger verifies source row, original key, actor and project/resource; a forged receipt fails.
- The work-order event source has an indexed unique key for new events, plus no-update/no-delete guards for keyed receipt sources. Existing historic unkeyed events are untouched.
- Exact key+payload+actor+target replay returns the committed original source ID. A reused key for changed payload, different user or target fails with 409.
- Work status transitions and scheduling conflict checks remain enforced by original source validation / D1 constraints. Calendar cancellations are **not** covered; treat their ambiguous outcomes with source inspection.

### Cross-tab browser recovery
The Admin helper is loaded in the Work Orders, Production Calendar, Commissions, Accounting Review and Material Planner workspaces, and the receipt checker lists both new scopes. It persists only an action scope, original opaque request key, short-lived state, and optional receipt/source IDs in same-origin browser storage. It never stores customer notes, quotes, media, full request JSON, or payment details. An identical pending/unknown operation in a second tab is blocked pending verification. A lost network response produces **unknown**, not **failed**. The operator can use **Verify original receipt**, refresh the source, and only then explicitly **Start new action**. Cross-tab notice is browser best-effort; the D1 unique key is the server's final exact-repeat guard.

Browser records expire from the active recovery display after 30 minutes and may be cleared by browser storage controls; they are not authoritative server receipts. Another device, another admin account, and unrelated new request keys are not globally de-duplicated. Never automatically retry payments, supplier actions, external publishing, or other unprotected writes.

## Verification and promotion
Run `python scripts/release467_build386_gate.py` and the dedicated JS cross-tab tests. Apply migration 0037 **to Development first** through canonical D1 migration authority; verify source/receipt atomic insert, rejected actor/target/key forgery, immutable rows, negative rollback and `PRAGMA foreign_key_check`. Require all exact-branch-head System Gate, Current Application Quality, I.T. runtime, Branch Hygiene, D1 Fan-Out and Build 386 workflow proofs GREEN on `dev`. Promote the **identical tree** to `main`; do not claim Production GREEN until Production D1 migration and Pages plus live resource checks complete.

No test writes to live Production business records. Existing users must refresh their Admin pages to load the new recovery script.

**Next queued:** Build 387 — Write Confirmation Coverage Audit & Guided Recovery Decisions.
