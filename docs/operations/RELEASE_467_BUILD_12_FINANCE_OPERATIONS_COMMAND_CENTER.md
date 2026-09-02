# Release 467 Build 12 — Finance Operations Command Center

## Purpose

Release 467 Build 12 turns `/admin/finance/` from a grouped navigation hub into a practical monthly Finance Operations Command Center while preserving the existing Accounting ownership model.

Exact predecessor: Release 467 Build 11 at `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`, System Gate `33637049566` SUCCESS, Build 11 Proof `33637049079` SUCCESS.

## Runtime design

The Finance workspace mounts the existing `public/js/admin-accounting-operations.js` engine at `financeOperationsMount`. The Accounting workspace continues to mount the same engine at `accountingOperationsMount`.

The shared engine reads the existing authenticated Accounting authorities for reconciliation, reconciliation exceptions, statement imports, profit/loss, item costing, period locks and GIFI summary. It produces current-month exception counts, reconciliation/cost/close/evidence queues and a financial snapshot.

When rendered on Finance, every exception and summary link resolves into the owning `/admin/accounting/` section. Build 12 therefore improves discovery and triage without creating a second ledger, reconciliation engine, statement importer, costing writer or close authority.

## Ownership boundary

- Finance Command Center role: **READ_ONLY_PROJECTION**.
- Financial write authority duplicated: **NO**.
- Reconciliation, statement-import, costing, close and ledger writes remain owned by existing Accounting workflows.
- Authenticated reads remain on `window.DDAuth.apiFetch`.
- Loading or refreshing `/admin/finance/` performs no business-data mutation.
- Stripe Development, PayPal sandbox and other provider execution remain `HOLD_EXTERNAL`.

## Schema and environment boundary

Build 12 adds no migration. Canonical migrations remain exactly `0001`–`0004`. Request-time DDL remains forbidden. Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`; Product R2 remains `devilndove-toolshed-images-dev`; CAIP R2 remains `devilndove-caip-media-dev`.

Build 12 authorizes no new D1/R2 mutation, no Cloudflare Access policy mutation, no provider execution/publication, no `main` change, no Production contact and no secret-value exposure. Production Promotion Readiness remains separately governed by Release 467 Build 5.

## Acceptance

Build 12 is complete only when its dedicated proof, all current Release 467 PR checks, and the canonical merged-SHA System Gate are green and the exact merged `dev` SHA has passed Development deployment, D1/data-authority proof, Preview binding validation and non-secret smoke acceptance.
