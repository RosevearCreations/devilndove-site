# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 24 — Storefront ↔ Inventory Sellability Reconciliation is the active Development candidate.**

Exact green predecessor is final Build 23 closure `9e61f20635b963d77c0b5c0c7bf7fb37d8a00d4d`, tree `323f9af57b905ea3e762e01cdbad2976197ea930`; System Gate `33701882478`, Build 23 Proof `33701882382`, and Branch Hygiene `33701882340` are SUCCESS.

Build 24 adds a read-only bridge between existing Product publication readiness and existing finished-stock/resource-buildability evidence. `sellability_supported` is review evidence only; it is not authorization to publish, sell, build, reserve or ship. Product/Storefront and Inventory remain the write owners.

Production remains Build 20 at `main` `055cbc973c667b35a209c7ea207779089f6fed3a`, tree `550272841e764d77fc21297abede3d4cae1aaea0`, Production Pages Deploy `33688892602` SUCCESS.

No schema/D1/R2 business-data/provider/Access/main/Production mutation is authorized. External lanes remain HOLD_EXTERNAL. Canada-only fulfillment and the U.S. sales/shipping suspension remain policy.

## Restart

Prove Build 24 from the exact final Build 23 closure. Do not redo Build 23 unless fresh evidence proves drift.
