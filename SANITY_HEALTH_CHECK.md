# Devil n Dove — Sanity / Health Check

## Current release

**Release 461 — Runtime Schema Convergence, Inventory & CAIP Production Pipeline — Development green.**

## Hard boundaries

- [x] Source branch is `dev`.
- [x] Pages target is `devilndove-site-dev`.
- [x] Development URL is `https://devilndove-site-dev.pages.dev`.
- [x] D1 is exactly `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Product R2 is `devilndove-toolshed-images-dev`.
- [x] CAIP private R2 is `devilndove-caip-media-dev`.
- [x] `wrangler.toml` contains no `account_id`.
- [x] Separate live `main` / `devilndove-site` remains untouched.
- [x] Provider live authorization/execution/publication is closed.
- [x] Raw CAIP R2 deletion is closed.

## Release 461 D1 sanity

- [x] Combined D1 acceptance run `33340698069` succeeded.
- [x] 19 Release 461 migrations applied.
- [x] 77 required tables present.
- [x] 93 required indexes present.
- [x] Missing required objects: 0.
- [x] Structural drift after apply: 0.
- [x] Foreign-key violations: 0.
- [x] Historical migrations were not replayed.
- [x] Request-time schema DDL/repair remains forbidden.

## Release 461 authenticated runtime sanity

Runtime run `33342752757`, request/source SHA `7200f421e0fc58842aed4003dc774ed30f910809`:

- [x] Exact Development D1 identity verified read-only.
- [x] Existing admin session resolved read-only and masked; no credential emitted/committed.
- [x] Anonymous protected routes returned 401.
- [x] Module authority: HTTP 200, Release 461, schema ready, five canonical modules healthy.
- [x] Inventory: HTTP 200, `quantity_authority=base`, 80 rows, all returned Inventory rows on base authority.
- [x] Product Media: HTTP 200; primary minimums 1200×1200, alt 12, quality score 70.
- [x] CAIP pipeline: HTTP 200, schema ready, 23 projects, execution/publication/R2 delete false.
- [x] CAIP handoff: project 36, HTTP 200, Release 461, source media unchanged.
- [x] HTTP acceptance was GET-only.
- [x] D1 mutation: none.
- [x] R2 mutation: none.
- [x] Provider execution/publication: none.
- [x] Separate live Production mutation: none.

## Release rule

A new chat is not a migration event. Release 461 D1/runtime work is closed and must not be replayed on startup. If read-only verification remains healthy, start new feature/source work as Release 462.

Separate later evidence such as CAIP private-media browser proof, Stripe test, PayPal sandbox and live provider acceptance remains deliberate and does not reopen Release 461 D1.
