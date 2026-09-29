# Release 467 Build 292 — Client Runtime Observer & Memory-Churn Hardening

Build 292 reduces long-session main-thread churn caused by broad MutationObservers and repeated document/workspace rescans. It does not claim a browser heap leak where none was proven; the measured risk class is observer/render churn, self-triggered DOM work and stale long-lived observers.

## Hardened hot paths

- Public H1 protection now runs only when a newly inserted subtree actually contains an H1.
- Layout Overflow keeps its added-node/deduplicated-root model and now disconnects/cancels pending work on page exit.
- Storefront Discovery filters inserted subtrees, coalesces SEO head reconciliation and disconnects both body/head observers on page exit.
- Admin Ergonomics replaces whole-document MutationObserver(apply) rescans with relevant added-root processing.
- Admin Workspace State enhances only affected status nodes/new subtrees and disconnects on page exit.
- Product enhancements watch direct Product-row structure changes rather than all descendant mutations.
- Packaging material/composition/print observers are scoped to the Packaging workspace and relevant inserted controls.
- Inventory multi-station retains its self-mutation disconnect/reconnect protection and now closes its observer at page exit.

## Budget gate

scripts/release467_build292_observer_budget.py inventories current MutationObserver sites and enforces the hot-path rules above. Future client changes cannot reintroduce the known whole-document patterns without failing Build 292's retained contract.

## Boundaries

No schema, D1, R2, payment, provider or publication mutation is introduced. Build 292 changes browser scheduling/lifecycle behavior only.

After Production GREEN the queue remains open.

**Next: Build 293 — CSS Design-System & Responsive Consolidation.**
