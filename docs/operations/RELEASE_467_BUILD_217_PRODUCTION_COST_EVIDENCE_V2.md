# Release 467 Build 217 — Production Cost Evidence v2

## Goal

Enrich existing Creative Project source evidence with manufacturing-specific cost drivers while preserving Inventory and Finance/Accounting ownership.

## Exact starting boundary

Build 216 is fully Production GREEN.

- Development: `2f9b0187110ffa0bd754eba1087f6ce56c23a0e4`
- Production: `0e6312ed188c3423fdf32b18c892ff4d17c387bc`
- shared tree: `5bc30361efc9166f90aa8a7a4761646389325625`
- Production Pages / Live Resources: `35552841763` / `35552906462`
- Product Browser / Route: `35552906457` / `35552906453`
- Build 216 Production proof: `35552841726`
- exact Production URL: `https://401aaffc.devilndove-site.pages.dev`

## Implementation

Canonical migration `0017_release467_production_cost_evidence_v2.sql` adds one source-evidence table linked to existing Creative Projects and, optionally, Build 212 operations.

Evidence can capture setup/design, machine, hands-on labour and rework minutes; consumables, packaging, prototype-waste, rework, finishing and outside-service cost; failed prototypes; quantity produced/accepted; and explicit unknown/partial/reviewed cost-evidence state.

Existing Inventory postings and Creative Process material events are read in place. They are not copied into a second material ledger. The existing Creator ↔ Finance profitability reconciliation receives the richer source evidence read-only and does not automatically rewrite Finance results.

## Unknown-cost rule

Blank cost fields are stored as `NULL` and remain **unknown**. Explicit zero may be recorded as zero. Build 217 never substitutes zero for an unknown cost.

## Safety / non-overlap

- no request-time DDL;
- no second Inventory material-cost authority;
- no second project-profitability or Accounting ledger;
- no automatic Finance/Accounting posting or cost rollup;
- no Inventory mutation from the Build 217 surface;
- no payment/provider/order/publication execution;
- evidence correction uses void history rather than delete.

## Acceptance

1. Setup, machine, labour, consumables, finishing, prototype waste, failures and rework can be evidenced.
2. Actual produced/accepted quantity can be captured.
3. Existing Inventory material evidence remains visible under its original owner.
4. Existing Finance profitability reconciliation can consume the richer source evidence without ownership drift.
5. Unknown costs remain unknown.
6. Migration 0017 is forward-only/additive and creates no business rows.

## Next

Release 467 Build 218 — **Quote ↔ Production Cost ↔ Margin Guardrails** — remains blocked until Build 217 is exact-SHA Production GREEN.
