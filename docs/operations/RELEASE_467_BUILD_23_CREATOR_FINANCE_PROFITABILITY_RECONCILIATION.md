# Release 467 Build 23 — Creator ↔ Finance Profitability Reconciliation

## Purpose

Build 23 begins from exact green Build 22 closure `ff1bc04ebdf51b1a2cf868269310a29c79588dfb`, tree `ef6100c2bfceb024bd64b531a86af1e2df54d411`, System Gate `33698947509`, Build 22 Proof `33698947534`, and Branch Hygiene `33698947647`.

Build 17 intentionally labelled the Creative Project result as a **rough project result, not accounting truth**. Finance already owns the existing profitability intelligence and Accounting owns financial writes. Build 23 closes the operator gap between those authorities without creating a second calculator or ledger.

## Runtime

`GET /api/admin/project-profitability-reconciliation` is authenticated and read-only. It combines existing `creative_work_projects` / `creative_work_events` evidence with the existing `loadProfitabilityIntelligence` Finance projection. The API reports the exact Creator cost source used, Finance captured cost components, rough Creator result, recorded profitability result, and exact variance.

A non-zero variance means **review the evidence owners**. It is not automatically classified as an error because Finance can legitimately include labour, packaging, overhead, channel fees and shipping that the Creator rough result does not include.

The operator workspace is `/admin/project-profitability-reconciliation/`. It ranks evidence gaps, supports lane/search filters, and links directly back to Creative Process and Accounting for any explicit correction.

## Authority boundary

- Creator project facts remain owned by Creative Process.
- Finance profitability remains the existing read-only Finance intelligence.
- Accounting remains the financial write/posting owner.
- automatic project mutation: **NONE**.
- automatic Finance mutation/posting: **NONE**.
- schema migration/request-time DDL: **NONE**.
- new D1/R2 mutation authority: **NONE**.
- payment/provider execution or publication: **NONE**.
- Cloudflare Access policy mutation: **NONE**.
- `main` / Production mutation: **NONE**.
- external acceptance lanes remain `HOLD_EXTERNAL`.

Canada-only fulfillment, the U.S. sales/shipping suspension, canonical migrations, one-H1 public SEO and Production business-data ownership remain unchanged.

## Acceptance

Build 23 is complete only after its exact feature head passes the focused proof and current PR guards, merges unchanged into `dev`, and the exact merged SHA passes the canonical System Gate including Development D1 convergence/read-only proof, exact Preview deployment, binding proof and smoke acceptance. Production promotion remains separate.
