# Release 467 Build 22 — I.T. Release & Deployment Truth Convergence

## Purpose

Build 22 corrects stale operator release truth in the I.T. Control Tower without creating a new database, provider or deployment authority. The previous consolidated wrapper still identified itself as Build 10 and surfaced Build 9 as last green even though Development had advanced through Build 21.

## Exact predecessor

- Build 21 closure `dev`: `d411d4a21b2172de20722776b7ba3514310aeca1`
- tree: `eaf8e58ec3c985a8909df324b18e1ab0f8dfd089`
- System Gate `33697923893` — SUCCESS
- Build 21 Proof `33697923897` — SUCCESS
- Repository Branch Hygiene `33697923895` — SUCCESS

## Truth model

The I.T. page now distinguishes current Build 22 operator authority, last-green Build 21 Development, Build 20 application/runtime authority and Build 20 Production authority. Production remains `main` `055cbc973c667b35a209c7ea207779089f6fed3a`, tree `550272841e764d77fc21297abede3d4cae1aaea0`, Production Pages Deploy `33688892602` SUCCESS.

The underlying `/api/admin/it-control-tower` remains a retained read-only preflight engine; `/api/admin/it-operations-control-tower` owns the current operator/release truth projection.

## Safety

Build 22 is read-only. It performs no automatic repair, schema migration, request-time DDL, D1/R2 business-data mutation, provider execution/publication, Cloudflare Access policy mutation, `main` mutation or Production promotion. External provider and Access lanes remain `HOLD_EXTERNAL` unless independently proven.
