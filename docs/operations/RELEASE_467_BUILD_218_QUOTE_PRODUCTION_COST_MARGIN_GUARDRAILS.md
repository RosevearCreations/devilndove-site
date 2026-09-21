# Release 467 Build 218 — Quote ↔ Production Cost ↔ Margin Guardrails

## Goal

Connect existing Custom Work quote evidence to reviewed production-cost evidence, Product linked-resource margin evidence and full Finance profitability without creating a second quote or accounting system.

## Exact starting boundary

Build 217 **Production Cost Evidence v2** is fully Production GREEN.

- Development SHA: `17d606f63d91ec178668c215caf263b95e3bd580`
- Production SHA: `94a977f0732cc649037423a415dfba60417d4a47`
- shared tree: `cffc68c278b69f389372e4d43c022a9f0140a9d1`
- Development System / Quality / I.T. / Hygiene: `35553944193` / `35553944303` / `35553944241` / `35553944239`
- Build 217 Development proof: `35553944296`
- Production Pages / Live Resource: `35554258043` / `35554327033`
- Products Browser / Route: `35554326994` / `35554327019`
- Build 217 Production proof: `35554258012`
- exact Production URL: `https://5cebd07d.devilndove-site.pages.dev`
- canonical migrations: **17**
- Production FK violations: **0**

## Existing authorities reused

- `custom_request_quote_drafts` — existing quote draft authority.
- `custom_request_quote_line_items` — customer-visible quote price-line authority.
- `custom_request_quote_revisions` — quote review/revision history.
- `creative_project_manufacturing_lifecycles` — Custom Request ↔ Creative Project relationship.
- `creative_project_production_cost_evidence` — Build 217 manufacturing source evidence.
- Product Resource + Inventory authorities — linked-resource cost/margin evidence.
- `creative_project_profitability` / Finance intelligence — full Finance profitability.

## Implementation

Build 218 adds a schema-neutral Custom Work margin-guardrail workspace.

For one existing Custom Request, it shows four deliberately separate evidence lanes:

1. **Quote revenue** — active customer-visible price lines excluding tax and pickup/shipping.
2. **Production cost evidence** — Build 217 reviewed direct production components and accepted quantity, plus Inventory-owned material evidence.
3. **Product linked-resource margin** — existing Product/Inventory resource evidence only; not full profit.
4. **Finance profitability** — existing Finance project profitability when available.

A human operator may append a `build218_margin_review` snapshot into existing quote revision history. That snapshot may include expected total/unit production-cost assumptions, the current actual evidence and a review disposition.

## Unknown-cost rule

Blank or missing expected/actual costs remain **unknown**. Build 218 never substitutes zero for missing cost.

## No automatic price rewrite

Build 218 may recommend human price review, but it does not modify:

- quote price lines;
- quote totals;
- Product prices;
- payment requests;
- order drafts or real orders;
- Inventory;
- Finance/Accounting ledgers;
- provider/publication state.

## Economics boundaries

Expected ↔ actual production comparison is valid only for the operator-declared scope recorded in the review note.

Product linked-resource margin remains the narrow Product-resource calculation and excludes labour, overhead, marketplace/payment fees, shipping, tax and accounting adjustments.

Finance profitability remains the full existing Finance calculation and is displayed separately.

## Schema boundary

Build 218 is **schema-neutral**. Canonical migration authority remains `0001–0017`; no Build 218 migration exists.

## Acceptance

1. Quote cost coverage and unknown-cost warnings are explicit.
2. Expected versus reviewed actual production-cost evidence can be compared without silent zero.
3. Quoted versus actual unit economics can be reviewed when quantity/cost evidence exists.
4. Product linked-resource margin remains clearly separate from full Finance profitability.
5. A manual margin review is appended to existing quote revision history.
6. No automatic price rewrite, Inventory mutation, Accounting posting, payment/order/provider execution or publication occurs.
7. Existing Build 217 source evidence remains authoritative and retained.

## Next

Release 467 Build 219 — **Manufacturing Work Order & Job Traveler** — remains blocked until Build 218 is exact-SHA Production GREEN.
