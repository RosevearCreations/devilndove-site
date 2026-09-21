# Release 467 Build 220 — Production Run, QA, Rework & Scrap Evidence

## Goal

Record reviewed production-run outcomes, quality checks, rework/scrap evidence, actual material-use reconciliation and finished-inventory/order handoff evidence without creating a second Inventory, order or Finance ledger.

## Exact starting boundary

Build 219 **Manufacturing Work Order & Job Traveler** is exact-SHA Production GREEN.

- Development SHA: `d05924a6c395b9ff2d6cd667d335d690de995805`
- Production main: `6442fc479a61ff1083567a40a46a2987aba12844`
- Shared tree: `c41a2fd13e69a517d258a2b7e8a5c6af47706e1b`
- Development System / Quality / I.T. / Hygiene: `35559932353 / 35559932262 / 35559932380 / 35559932232`
- Build 219 Development proof: `35559932358`
- Exact Development URL: `https://51612e13.devilndove-site.pages.dev`
- Production Pages / Live Resources: `35560514490 / 35560585150`
- Product Browser / Route: `35560585205 / 35560585179`
- Build 219 Production proof: `35560514532`
- Exact Production URL: `https://6e81f92e.devilndove-site.pages.dev`
- Canonical migrations before this build: 18
- Production business counts: users 2, products 45, Inventory rows 1041, orders 0
- Foreign-key violations: 0

Primary roadmap: `docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md`.

## Implementation

Build 220 adds canonical migration `0019_release467_production_run_qa_rework_scrap_evidence.sql` and six additive evidence tables:

- `creative_project_production_runs` — reviewed run identity, quantities, timing, deviation/material reconciliation and void history.
- `creative_project_production_run_operations` — per-operation outcome, start/completion timestamps, checkpoint and deviation notes.
- `creative_project_production_run_qa_checks` — explicit pass/rework/fail/not-applicable checkpoint evidence.
- `creative_project_production_run_material_evidence` — references existing Inventory-owned Creative postings only.
- `creative_project_production_run_handoffs` — references an existing Inventory item, Custom Work order draft or order, or records a pending/other handoff note.
- `creative_project_production_run_events` — append-only reviewed/void event history.

Admin API: `/api/admin/production-run-evidence`.

Admin workspace: `/admin/custom-request/`, mounted by `public/js/admin-production-run-evidence-build220.js`.

Every reviewed run is linked to the exact reviewed Build 219 traveler used. A run with actual output must include at least one performed operation with start/completion timestamps. Rework/failure and unreconciled quantity require reasoned deviation evidence. QA statuses are never auto-passed.

## Existing authorities retained

- Creative Project manufacturing lifecycle and operation plan remain project/run context.
- Build 219 traveler remains the frozen execution packet authority.
- `creative_project_inventory_posts` and Inventory services remain actual stock/movement authority.
- `custom_request_order_drafts` and `orders` remain handoff/order authorities.
- Finance/Accounting remains profitability and posting authority.

Build 220 may reference those authorities but never rewrites them.

## Correction model

Reviewed run evidence is immutable in normal use. If a reviewed packet is wrong, it is voided with a reason and a corrected run is recorded. Voiding a Build 220 packet does not reverse Inventory, mutate an order or post/reverse Finance entries.

## Non-overlap / safety boundary

- Inventory movements remain Inventory-owned.
- No `site_item_inventory` update is performed by the Build 220 API.
- No `site_inventory_movements` or usage movement is inserted by Build 220.
- Order drafts and real orders are read/reference-only.
- Finance/Accounting postings remain Finance/Accounting-owned.
- No request-time DDL.
- No provider/payment/publication execution.
- No Production business-data copy.

## Acceptance

1. Planned, actual, accepted, rework and scrap/failure quantities are explicit.
2. Operation timestamps/outcomes and QA checkpoints are traceable.
3. Rework, scrap/failure and quantity deviations require a reason.
4. Actual material use can be reconciled to existing Inventory-owned project postings without duplicating the Inventory ledger.
5. Resulting finished-inventory/order handoff evidence references existing authorities without mutating them.
6. Corrections preserve audit history through void-and-replace.
7. The complete Build 220 source, Development migration/runtime proof, exact Development proof matrix, protected-main promotion and exact Production migration/runtime/resource/browser proofs are GREEN before closure.

## Next

Release 467 Build 221 — **Workshop Knowledge Library Foundation** — remains blocked until Build 220 is fully Production GREEN.
