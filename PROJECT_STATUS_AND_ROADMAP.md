# Project Status and Roadmap — Development Build 446

Updated: 2026-08-28

This file and `AI_HANDOFF.md` are the current-state authorities.

## Release status

- Current Development release: **Build 446 — deep repository retirement / forward sanity**
- Source/runtime: `dev` → `devilndove-site-dev`
- Previous fully accepted Development checkpoint: **Build 445 / `f50e6d61deb31de9c17b12b55d6649a7779fdb95`**
- Product/Inventory/Tool inherited source and authenticated evidence: **GREEN provenance carried forward**
- Repository history policy: **Git history only; obsolete build artifacts do not ship**
- Build 446 D1 migration: **NONE**
- Separate live Production promotion: **CLOSED**

## Build 446 scope

1. Remove historical root/build Markdown and release/archive copies from the active tree.
2. Remove superseded incremental `database_build*.sql` and old standalone verification SQL after their schema is represented by `database_full_schema.sql`.
3. Replace the historical `scripts/` pile with the small current CI/D1 recovery set plus active SEO bake utilities.
4. Keep guarded Build 440/442/443 recovery assets until read-only Development readiness proves they are no longer needed.
5. Maintain one current system-gate workflow and a canonical `scripts/repository_forward_sanity.py` so bulk cannot regrow.
6. Make no Production or provider mutation and no new D1 migration.

## Current HOLD register

| ID | Work | State |
| --- | --- | --- |
| CAR-446-H1 | Determine carousel schema state through read-only readiness; if absent apply retained guarded Development migration, then prove live editor/public fallback | **HOLD** |
| IT-446-H1 | Determine I.T. grant schema state; if absent apply retained guarded Development migration | **HOLD** |
| IT-446-H2 | Explicit per-user I.T. route/API/UI enforcement | **HOLD until schema authority is proven** |
| PAY-446-H1 | Stripe Development checkout/return/signed webhook/duplicate replay | **HOLD** |
| PAY-446-H2 | PayPal sandbox approval/capture/return/verified webhook/replay | **HOLD** |
| CAIP-446-H1 | Private R2 delivery/range seeking/timecode/storage evidence | **HOLD** |
| OPS-446-H1 | Separate live Production promotion | **HOLD BY POLICY** |

## Forward roadmap

### Storefront
Keep Home carousel and merchandising truthful and fail-safe; strengthen Shop/Collections/search/cart/checkout, approved media, customer documents, delivery/pickup and mobile behavior. Every public surface keeps one meaningful H1, truthful canonical metadata/schema, and no internal Inventory leakage.

### Creators / CAIP
Continue Creative Project → Content Studio handoff, reviewed material usage, verified media evidence, lessons/recommendations, profitability and private storyboard notes. Public handoff remains human-approved; private source media stays private.

### Inventory / Products / Tools
Continue receiving/source provenance, physical counts, kit/component depletion, usage setup, reversals, tool service/inspection/history and publication linkage. D1 remains authoritative and uncertain historical provenance is never fabricated.

### Finance / Accounting
Continue provider-confirmed payments/refunds/disputes, reconciliation, AR/AP/journal/tax/fees/profitability/export/close, marketplace percentage fees and shared project-cost allocation. Stripe/PayPal acceptance is current-release work, not an old-build requirement.

### I.T. / Platform
Keep API keys/secrets, bindings, readiness, module grants, release health, incident/schema diagnostics and recovery mechanics under the I.T. domain. Readiness probes remain read-only. Old recovery artifacts are retired only when no current gate or recovery path needs them.

### Packaging / Content / SEO
Continue reusable packaging/formula/ingredient templates, proof/prepress, bilingual/INCI review, approved visual assets, social publishing proof, Search Console/sitemap/indexing and consent-aware analytics.

### Reliability / Go-live
Maintain bounded/no-idle polling, structured failures, permission tests, Worker CPU/subrequest review, service-worker recovery, backup/restore rehearsal, accessibility/performance and exact Development deployment evidence. Production promotion is always a deliberate owner decision.

## Release rule

A feature is complete only when source authority, database authority where applicable, error/fallback behavior, responsive behavior, tests/CI, exact Development deployment and required authenticated/live evidence agree. Unfinished items are renumbered into the current release instead of keeping obsolete builds open.
