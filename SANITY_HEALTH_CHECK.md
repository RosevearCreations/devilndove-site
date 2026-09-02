# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 12 — Finance Operations Command Center** is the active Development source candidate.

Exact green predecessor: Release 467 Build 11 at `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`.

- [x] Build 11 System Gate `33637049566` — SUCCESS.
- [x] Build 11 Proof `33637049079` — SUCCESS.
- [x] `current-development-authority.json` identifies Build 12 and preserves Build 11 as last-green.
- [x] `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**.
- [x] Runtime Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Locked Build 8 provenance sanity

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked historical provenance. Its exact Build 7 predecessor was `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, with System Gate `33591744817` and Build 7 Proof `33591744787` both SUCCESS. External acceptance remained `HOLD_EXTERNAL`. These facts are retained for regression proof and do not override current Build 12 authority.

## Build 12 Finance Operations Command Center

- [x] `/admin/finance/` contains `financeOperationsMount`.
- [x] Finance loads `admin-accounting-operations.js?v=467b12` and the existing Accounting operations CSS.
- [x] The shared script still mounts on `accountingOperationsMount` for `/admin/accounting/`.
- [x] Finance mode resolves Accounting anchors to `/admin/accounting/#...` instead of dead local anchors.
- [x] Existing authenticated Accounting reconciliation, exception, statement-import, profit/loss, costing, period-lock and GIFI reads are reused.
- [x] No POST/PUT/DELETE path is added to the shared engine.
- [x] Financial write authority duplicated: NO.
- [x] Reconciliation, statement-import, costing, close and ledger writes remain Accounting-owned.
- [x] Finance page retains exactly one H1.
- [x] Existing grouped Finance workspace navigation remains below the command center.

## Environment / schema sanity

- [x] Source authority: `dev`.
- [x] Preview: `https://dev.devilndove-site.pages.dev`.
- [x] D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Product R2: `devilndove-toolshed-images-dev`.
- [x] CAIP R2: `devilndove-caip-media-dev`.
- [x] Canonical migrations remain exactly `0001`–`0004`.
- [x] Build 12 adds no migration and no request-time DDL.
- [x] Build 12 authorizes no new D1/R2 mutation.

## CI / authority sanity

- [x] Build 11 gate is forward-compatible with Build 12 while retaining locked Build 11 runtime/provenance checks.
- [x] Build 10 I.T., Build 9 CI retirement, Build 8 authority convergence, Build 7 external bridge and Build 6 Access authorities remain retained.
- [x] Release 466 Build 1–6 workflows remain manual-only historical provenance.
- [x] Production Promotion Readiness remains separate Build 5 authority.

## External acceptance sanity

- [ ] Cloudflare Access service token — `HOLD_EXTERNAL`.
- [ ] Stripe Development — `HOLD_EXTERNAL`.
- [ ] PayPal sandbox — `HOLD_EXTERNAL`.
- [ ] Social/OAuth — `HOLD_EXTERNAL`.
- [ ] CAIP private media — use fresh Build 7 evidence.

- [x] Provider/payment/refund/OAuth execution from Build 12: NONE.
- [x] Cloudflare Access policy mutation from Build 12: NONE.
- [x] Secret values emitted by Build 12: NONE.

## Main / Production sanity

- [x] `main` is exact Build 11 SHA `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`.
- [x] Production Pages Deploy `33640133776` — SUCCESS on that exact SHA.
- [x] Production business counts were snapshotted and preserved through the canonical migration proof.
- [x] Production D1 isolation, canonical migrations, migration proofs and foreign keys passed.
- [x] Exact Production Pages deployment, bindings and public smoke acceptance passed.
- [x] Build 12 remains Development-only and does not authorize a further Production promotion.

## Current verdict

Release 467 Build 11 is the exact proven Development and Production baseline. Release 467 Build 12 is a bounded, schema-neutral Finance application candidate that promotes existing Accounting read intelligence to `/admin/finance/` while keeping every financial write owner unchanged. External lanes remain truthfully `HOLD_EXTERNAL`.
