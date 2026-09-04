# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 38 — Accounting Core Runtime-DDL Elimination & Baseline Schema Assertion is Development GREEN.**

Accepted Build 38 Development implementation:
- SHA `a48a44558e2438d7db4d994da0012b0cae703689`
- tree `27adcad60e871921ea3fb9372b03f8a38b22daa8`
- System Gate `33881012179` SUCCESS
- Current Application Quality `33881011819` SUCCESS
- I.T. Admin Runtime Proof `33881011733` SUCCESS
- Repository Branch Hygiene `33881011711` SUCCESS

Build 32 remains the independently verified Production baseline:
- Production `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`
- tree `2c1b4a3694779996e1bdb094be5e9e043834276e`
- Production Pages Deploy `33866964958` SUCCESS.

## Build 38 result

`functions/api/_lib/accounting.js` no longer carries request-time table/index creation. Before a real order-accounting write, it now asserts the proven `accounting_order_records` baseline read-only using `PRAGMA table_info` and `PRAGMA index_list` across 22 required columns and 2 required indexes. Missing baseline structure fails closed with `accounting_baseline_schema_not_ready` and must be repaired only through canonical migration authority.

The real accounting write path remains intact: `syncAccountingForOrder` still performs its `INSERT ... ON CONFLICT(order_id) DO UPDATE` business operation after the read-only baseline assertion.

The runtime schema-debt guard is now a ratchet. Build 37 inventory was 61 DDL-bearing runtime files / 529 statements / 5 delegated or shared helpers. Build 38 proves ceilings of 60 / 526 / 4, with Accounting itself at zero request-time DDL and zero raw D1 bypasses carrying DDL. Future accepted source may reduce these numbers but cannot silently increase them.

No canonical migration was added. `accounting_order_records` belongs to the already-proven baseline, so the forward migration stream remains exactly `0001`–`0004`. `current_accounting_schema_authority_gate.py` is part of Current Application Quality.

I.T., Reliability and Deployment Preflight are synchronized to Build 38 current truth without adding mutation capability. Build 37 remains the historical Deployment Preflight feature authority; Build 36 remains historical Reliability feature authority; Release 466 reliability remains regression compatibility.

No Production deployment, rollback, schema migration, D1/R2 business-data mutation by the build, provider execution/publication or Cloudflare Access mutation was performed.

## Restart rule

This authority-only closure and any later authority-only descendant must itself pass push-triggered System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene before Build 39 starts. Build 32 remains Production until a deliberate current fully-green Development promotion is explicitly requested and independently proven.

External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain HOLD unless fresh evidence explicitly accepts them.
