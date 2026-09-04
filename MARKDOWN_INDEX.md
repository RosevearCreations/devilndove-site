# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 38

Build 38 — Accounting Core Runtime-DDL Elimination & Baseline Schema Assertion is Development GREEN.

Accepted Development implementation: `a48a44558e2438d7db4d994da0012b0cae703689` / tree `27adcad60e871921ea3fb9372b03f8a38b22daa8`.
Accepted runs: System Gate `33881012179`, Current Application Quality `33881011819`, I.T. Admin Runtime Proof `33881011733`, Repository Branch Hygiene `33881011711` — all SUCCESS.

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

Read current authority in this order:
1. `current-development-authority.json`
2. `release467-build38-accounting-core-runtime-ddl-elimination.json`
3. `release467-build32-help-search-responsive-convergence.json`
4. `release467-build37-deployment-preflight-canonical-migration.json` as historical Deployment Preflight feature authority
5. `release467-build36-current-reliability-operational-health.json` as historical Reliability feature authority
6. `AI_HANDOFF.md`
7. `PROJECT_STATUS_AND_ROADMAP.md`
8. `SANITY_HEALTH_CHECK.md`
9. retained Build 35 and earlier authorities as historical evidence only.

Build 38 removes request-time DDL from core Accounting while preserving the real order-accounting write path. The proven `accounting_order_records` baseline is asserted read-only across 22 required columns and 2 required indexes. Runtime schema residue is ratcheted to ceilings of 60 files / 526 DDL statements / 4 delegated or shared helpers with zero raw D1 bypasses carrying DDL. Canonical migrations remain exactly `0001`–`0004`.

Current Application Quality guards Accounting schema authority together with Deployment Preflight, Reliability, I.T. truth, Production promotion provenance and the other current application quality boundaries. Deployment Preflight and Reliability are synchronized to Build 38 read-only current truth while their feature authorities remain historical evidence.

This authority-only closure must itself be merged through GitHub and pass push-triggered System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene before Build 39 starts. Build 32 remains Production until a deliberate exact-tree Production promotion is explicitly requested and independently proven.
