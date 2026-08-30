# Release 461 — Runtime Schema Convergence, Inventory & CAIP Production Pipeline

Release 461 is the accepted Development release for `devilndove-site-dev`.

## Boundary

- Source: `dev`
- Development Pages: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development R2 only for product/private-media storage.
- Separate live Production `main` / `devilndove-site`: untouched.
- Provider live authorization/execution/publication: closed.
- Raw CAIP R2 deletion: closed.
- Request-time DDL and historical migration replay: forbidden.

## Completed scope

Release 461 converged request-time schema ownership into explicit forward migrations and completed Inventory package/base-unit authority, responsive Inventory usability, primary product-image quality, CAIP ingest/synchronization/quality/lifecycle/semantic evidence, Story Builder, edit/timeline planning and reviewed Content Studio handoff.

Purchase packaging/cost remains on `site_item_inventory`; `site_inventory_base_balances` is canonical usable/base-unit read authority. Primary product images require a loadable public image, at least 1200×1200, at least 12 alt-text characters and quality score at least 70. CAIP planning remains source-preserving and cannot render/publish through providers or delete raw R2 media.

## D1 closure

Development D1 acceptance run `33340698069` succeeded:

- 19 Release 461 migrations;
- 77 required tables;
- 93 required named indexes;
- zero missing required objects;
- zero remaining structural drift;
- zero foreign-key violations.

The bounded structural repair was applied only after exact read-only classification. Release 461 D1 is closed and must not be replayed on startup.

## Authenticated runtime closure

Run `33342752757` on request/source SHA `7200f421e0fc58842aed4003dc774ed30f910809` passed the GET-only Development acceptance:

- module authority healthy at Release 461;
- Inventory base-unit authority live for 80 returned rows;
- Product Media primary thresholds exactly 1200×1200 / alt 12 / score 70;
- CAIP pipeline schema ready with 23 projects and execution/publication/R2-delete false;
- reviewed CAIP handoff live for project 36 with source media unchanged;
- anonymous protected access refused;
- existing Development session resolved read-only, masked and never emitted;
- zero D1/R2/provider/Production mutation.

## Green state

Release 461 satisfies the Development-green definition: D1 converged, aggregate source authority green, System Gate carried-forward authority green on the current source lineage, Development Pages deployment green, authenticated Development runtime green, and all provider/Production deletion boundaries remain closed.

Future request-file-only acceptance commits are required to trigger the Release 461 Source Gate as well as System Gate/Pages/runtime acceptance so the latest GitHub head can display the complete green evidence set.

New source feature work begins as **Release 462**. Separate CAIP private-media browser evidence, Stripe/PayPal testing and live provider acceptance remain deliberate later boundaries.
