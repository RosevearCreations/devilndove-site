# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 39

Build 39 — Product Numbering Runtime-DDL Elimination & Sequence Safety Convergence is Development GREEN.

Accepted Development implementation: `8f94a6b49b6353946d96afbe2c7eb0b5ce6ca6b1` / tree `1dba2f02509e7fe0c7046541f126f80aa5170d8b`.
Accepted runs: System Gate `33883587705`, Current Application Quality `33883587677`, I.T. Admin Runtime Proof `33883587724`, Repository Branch Hygiene `33883587669` — all SUCCESS.

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

Read current authority in this order:
1. `current-development-authority.json`
2. `release467-build39-product-numbering-runtime-ddl-elimination.json`
3. `release467-build32-help-search-responsive-convergence.json`
4. `release467-build38-accounting-core-runtime-ddl-elimination.json` as historical Accounting feature authority
5. `release467-build37-deployment-preflight-canonical-migration.json` as historical Deployment Preflight feature authority
6. `release467-build36-current-reliability-operational-health.json` as historical Reliability feature authority
7. `AI_HANDOFF.md`
8. `PROJECT_STATUS_AND_ROADMAP.md`
9. `SANITY_HEALTH_CHECK.md`
10. retained Build 35 and earlier authorities as historical evidence only.

Build 39 removes request-time DDL from the shared Product Numbering helper while preserving desktop/mobile sequence business writes. The proven `catalog_product_number_sequence` baseline is asserted read-only across three required columns, and missing schema or invalid allocation fails closed. Runtime schema residue is ratcheted to ceilings of 59 files / 525 DDL statements / 3 delegated or shared helpers with zero raw D1 bypasses carrying DDL. Accounting also remains zero-DDL. Canonical migrations remain exactly `0001`–`0004`.

Current Application Quality guards Product Numbering and Accounting schema authority together with Deployment Preflight, Reliability, I.T. truth, Production promotion provenance and the other current application quality boundaries. Deployment Preflight and Reliability are synchronized to Build 39 read-only current truth while their feature authorities remain historical evidence.

This authority-only closure must itself be merged through GitHub and pass push-triggered System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene before Build 40 starts. Build 32 remains Production until a deliberate exact-tree Production promotion is explicitly requested and independently proven.
