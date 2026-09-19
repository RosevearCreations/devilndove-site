# Release 467 Build 197 — Cycle Count & Duplicate Identity Resolution

## Goal

Provide bounded, auditable workflows for count-due Inventory and duplicate identities without automatic merges or silent stock rewrites.

## Measured starting point

- Count due: 1,040 active Inventory rows.
- Duplicate-identity rows: 8.

## Required scope

- explicit cycle-count queue with deterministic ordering and bounded page size;
- one-item count entry routed through existing Inventory authority;
- expected timestamp / stale-target protection;
- pre/post count evidence and operator note requirement for quantity changes;
- duplicate-group comparison showing identity, supplier/source, on-hand, reserved, cost and timestamps;
- explicit keep/repair/archive routing using established authorities;
- no automatic duplicate merge;
- no automatic quantity reconciliation from another record.

## Safety boundary

No unattended stock mutation, no mass count reset, no duplicate auto-merge, no cost propagation, no purchasing/reorder action and no Production business-data copy.

## Acceptance

Every mutation remains reviewed and auditable; count and duplicate workflows stay bounded and do not reintroduce the high-read scans closed by Builds 183/189/194.
