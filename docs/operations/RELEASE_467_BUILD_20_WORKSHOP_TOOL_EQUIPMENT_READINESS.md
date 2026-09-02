# Release 467 Build 20 — Workshop Tool & Equipment Readiness Command Center

Updated: 2026-09-02

## Development predecessor

Build 20 starts from the exact Development-green Release 467 Build 19 merge:

- `dev`: `9c814314dea5ddc664e73b9d822c8a41423c3aca`
- tree: `9be57e9c0e090f8edf210ce62fcf8b093e703506`
- merged System Gate: `33673793408` — SUCCESS
- merged Build 19 Proof: `33673793538` — SUCCESS
- `main` / Production remains Build 15 at `296e53b079bba53126c80902be36a9271d82cea4`
- last verified Production Pages deployment: `33655223149` — SUCCESS

## Purpose

Build 20 adds `/admin/workshop-readiness/`, a read-only workshop-wide projection over the existing durable Tool authorities. It answers: which Tools are blocked or unsafe, which recorded service dates need attention, where Inventory and lifecycle state disagree, which replacements are being watched/planned, where lifecycle review evidence is incomplete, and what inspection/calibration events have recently been recorded.

The projection endpoint is `/api/admin/workshop-readiness`.

## Existing authorities preserved

No Tool ledger is duplicated.

- `site_item_inventory` remains Tool identity, quantity and `do_not_reuse` authority.
- `inventory_tool_lifecycle_profiles` remains lifecycle status, condition, service schedule, warranty and replacement-planning authority.
- `inventory_tool_lifecycle_events` remains inspection, maintenance, repair, calibration, damage, out-of-service, return-to-service, retirement and replacement evidence authority.
- `/admin/tool-lifecycle/` remains the detailed lifecycle write owner.
- `/admin/inventory-operations/` remains the Inventory write owner.

## Attention lanes

Build 20 ranks six factual lanes:

1. **Safety** — Inventory do-not-reuse, unsafe condition, damaged/out-of-service state.
2. **Service** — only the existing `next_service_at` schedule: overdue, due today or due within 30 days.
3. **Authority alignment** — contradictions such as Inventory blocking reuse while lifecycle remains active.
4. **Replacement** — existing `watch`, `plan` and `urgent` replacement priorities.
5. **Lifecycle evidence** — missing profile, unreviewed profile or unverified condition.
6. **Warranty** — recorded warranty date approaching within 30 days.

## Calibration and inspection truth

The durable schema records `calibration` and `inspection` as lifecycle events. It does **not** contain a separate calibration-due or inspection-due schedule. Build 20 therefore shows the most recent recorded calibration/inspection evidence but never invents a due interval or deadline. The only scheduled service date used by this command center is the existing `inventory_tool_lifecycle_profiles.next_service_at` authority.

## Write boundary

Build 20 does not:

- change Tool lifecycle or condition,
- clear or set Inventory `do_not_reuse`,
- create lifecycle profiles,
- record maintenance, repair, calibration or inspection events,
- mark service complete,
- purchase or create replacement Tools,
- change Inventory quantity,
- call external providers,
- create D1/R2 schema or migration authority,
- mutate `main` or Production.

All action links route operators to the existing write owner.

## Schema / provider / Production boundary

- schema migration: **NONE**
- request-time schema mutation: **NONE**
- new D1/R2 mutation authority: **NONE**
- provider execution/publication: **CLOSED / HOLD_EXTERNAL**
- Cloudflare Access mutation: **NONE**
- Production promotion: **CLOSED**
- `main` mutation: **NONE**

Release 467 Build 20 is Development-only until its own source proof, System Gate, exact Development deployment and runtime evidence are green.
