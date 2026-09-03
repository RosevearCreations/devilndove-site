# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 24 — Storefront ↔ Inventory Sellability Reconciliation is DEVELOPMENT GREEN.**

Accepted Build 24 runtime evidence is `b04aeb89d4d22b1b158244c86256ad39f31da70b`, tree `f70c733f9544764bd7d68af3d85383e133ee77db`; System Gate `33703326878`, Build 24 Proof `33703326916`, and Branch Hygiene `33703326867` are SUCCESS.

Build 24 provides a read-only bridge between existing Product publication readiness and existing finished-stock/resource-buildability evidence. `sellability_supported` is review evidence only; it is not authorization to publish, sell, build, reserve or ship. Product/Storefront and Inventory remain the write owners. No second readiness, inventory or fulfillment authority was created.

Production remains Build 20 at `main` `055cbc973c667b35a209c7ea207779089f6fed3a`, tree `550272841e764d77fc21297abede3d4cae1aaea0`, Production Pages Deploy `33688892602` SUCCESS.

No schema/D1/R2 business-data/provider/Access/main/Production mutation is authorized. External lanes remain HOLD_EXTERNAL. Canada-only fulfillment and the U.S. sales/shipping suspension remain policy.

## Restart

Start the next bounded Devil n Dove build from current `dev` after confirming it descends from accepted Build 24 evidence. Do not redo Build 24 unless fresh evidence proves drift.
