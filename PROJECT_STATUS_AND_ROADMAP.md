# Devil n Dove — Project Status and Roadmap

## Current release

**Release 467 Build 38 — Accounting Core Runtime-DDL Elimination & Baseline Schema Assertion is Development GREEN.**

Accepted Development implementation:
- SHA `a48a44558e2438d7db4d994da0012b0cae703689`
- tree `27adcad60e871921ea3fb9372b03f8a38b22daa8`
- System Gate `33881012179` SUCCESS
- Current Application Quality `33881011819` SUCCESS
- I.T. Admin Runtime Proof `33881011733` SUCCESS
- Repository Branch Hygiene `33881011711` SUCCESS

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

## Build 38 result

Build 38 removes request-time schema ownership from the core order-accounting helper. `accounting_order_records` is treated as proven baseline schema and is asserted read-only across 22 required columns and the two required indexes before normal accounting writes proceed. Missing structure fails closed and routes repair back to canonical migration authority.

The actual order-accounting business write remains intact. No new migration was created because this table belongs to the proven baseline; the canonical forward stream remains exactly `0001`–`0004`.

Runtime schema residue is now ratcheted from the prior inventory of 61 DDL-bearing files / 529 statements / 5 delegated or shared helpers to ceilings of 60 / 526 / 4, with zero Accounting request-time DDL and zero raw D1 bypasses carrying DDL. Current Application Quality includes a dedicated Accounting schema-authority guard, while System Gate continues enforcing the repository-wide runtime schema firewall.

I.T., Reliability and Deployment Preflight are synchronized to Build 38 current read-only truth. Build 37 remains historical Deployment Preflight feature evidence and Build 36 remains historical Reliability feature evidence.

The exact accepted implementation passed canonical Development D1 proof, read-only data authority, exact Preview deployment, binding proof, smoke acceptance and current deployment/regression artifact generation.

No Production deployment, rollback, schema migration, D1/R2 business-data mutation by the build, provider execution/publication or Cloudflare Access mutation is part of Build 38.

## Next

After this authority-only closure SHA itself passes the standard push-triggered four-proof set, Build 39 may start from the resulting `dev` head. Build 38 should not be promoted to Production unless explicitly requested. External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain separate HOLD items.
