# Release 467 Build 385 — Durable Server-Side Write Idempotency & Operation Receipts

**Goal:** Save/Add/Update/Delete operations should report when an action is being processed, clearly confirm results, and avoid repeated DB mutations. Build 384 introduced the client-side waiting labels and in-page duplicate request coalescing. Build 385 adds actual persistent D1 operation receipts for four operator-selected routes.

## Protected actions
1. Custom Request Commission Workbench POST `/api/admin/commission-workbench` — `commission_decision`
2. Cross-Project Accounting POST `/api/admin/cross-project-accounting` — `finance_review`
3. Material Planner POST `/api/admin/project-material-planner` action `reserve` — `material_reserve`
4. Material Planner POST `/api/admin/project-material-planner` action `release` — `material_release`

Each protected request must use an unpredictable 16–80-character `request_key`. Admin identity is verified by the existing HttpOnly-cookie authentication and POST Origin check. The server calculates a canonical SHA-256 of normalized action, actor, target and fields. The first request uses a **D1 atomic batch** of the canonical business source write and an immutable receipt insert. A database trigger checks that the receipt's original source record, actor, project/request and key agree; the receipt cannot be forged without a real same-transaction source row. A conflicting use of the same key returns HTTP 409; a repeat of the identical key/payload/actor/target returns its verified stored receipt without executing a second business mutation. Cross-worker and cross-device repeat requests converge through the canonical D1 uniqueness boundary, not a JavaScript-only lock.

The material release path uses a unique request key embedded in the source `release_note` when mutating the existing reservation; the D1 batch adds its receipt only against that exact verified release source marker. The existing trigger decrements inventory reserved stock only when the release actually updates that reservation. No material consumption, accounting posting, payment or external supplier action is performed.

## Verifying uncertain outcomes
`GET /api/admin/write-operation-receipt?scope=...&request_key=...` is an authenticated read-only receipt check. Only the same admin user receives a committed record and its original source ID and timestamp. `not_found` is **not proof a past attempt failed**; allow for network or deployment issues and verify the source before retrying. A successful receipt includes `receipt_id`, `source_record_id` and `replayed`. Recovery must reuse the original key and unchanged payload; a different action requires a new random key.

The existing Build 384 wait text and toast acknowledgements continue to guard all supported fetch-based Admin mutation buttons, but durable exact-repeat protection is **scoped only to these four endpoints**. Other admin writes (including work-order time, inventory tools, commerce checkout, supplier imports, media, billing and external provider calls) retain existing source safeguards; Build 386 should expand receipt coverage with source-specific atomic tests and cross-tab recovery. Never claim universal exactly-once across provider networks.

## Tests / production gate
`python scripts/release467_build385_gate.py` verifies hash identity, actor/target conflicts, same-source receipt enforcement, append-only ledger immutability, duplicate key uniqueness, material release bound, and atomic rollback of bad receipts. Apply canonical migration 0036 on Development first and prove isolated D1/Preview; require six exact-head Development quality/runtime/hygiene/gate checks; promote identical tree to main; apply Production D1 0036 and verify Production Pages, smoke, and live resource integrity. Never write fake business or payment records in a real D1 database.

**Next queued:** Build 386 — Write Receipt Coverage Expansion & Cross-Tab Recovery.
