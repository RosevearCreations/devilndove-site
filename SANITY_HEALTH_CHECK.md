# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** is the active Development source candidate.

The exact green predecessor is **Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** at `d8a9ffba03f980b9632643d91d9aa69b25bd94fd` with tree `949f2523d31e0f47ed1e19ff7655de2762fbc1df`.

- [x] Build 9 System Gate `33633043297` — SUCCESS.
- [x] Build 9 Proof `33633043229` — SUCCESS.
- [x] `current-development-authority.json` identifies Build 10 and preserves Build 9 as last-green.
- [x] `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**.
- [x] Middleware Release 466 header is explicitly classified **INHERITED_RUNTIME_COMPATIBILITY**, not current Release 467 authority.

Release 467 Build 8 — Authority Convergence and Restart Safety remains the authority that established the current-vs-compatibility split. Release 467 Build 9 remains the authority that retired obsolete Release 466 automatic CI fanout.

## Build 10 I.T. Control Tower

- [x] New read-only endpoint: `/api/admin/it-operations-control-tower`.
- [x] Existing `/api/admin/it-control-tower` subsystem engine is retained rather than bypassed.
- [x] Current Release 467 Build 10 authority and exact Build 9 predecessor evidence are surfaced together.
- [x] Development target/D1/R2/runtime ancestry summary is surfaced without inferring opaque binding identities.
- [x] Root-admin, active profile/admin, module, D1 migration/proof and FK metrics are summarized.
- [x] Non-green subsystem findings are flattened into one severity-sorted recovery queue.
- [x] Recovery guidance links to corrective workspaces but performs no automatic repairs.
- [x] External acceptance policy states are displayed independently from runtime/source success.
- [x] No secret values are emitted.

## Environment boundary

- [x] Source authority remains `dev`.
- [x] Development Preview remains `https://dev.devilndove-site.pages.dev`.
- [x] Development D1 remains `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2 remains `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2 remains `devilndove-caip-media-dev`.
- [x] Build 10 authorizes no D1/R2 mutation.
- [x] Build 10 authorizes no Cloudflare Access policy mutation.
- [x] Build 10 authorizes no `main` mutation.
- [x] Build 10 authorizes no Production mutation/contact.

## D1 / schema sanity

- [x] Canonical migration stream remains exactly `0001`–`0004`.
- [x] Build 10 adds no migration.
- [x] Request-time schema DDL remains forbidden.
- [x] A new chat/workstation/deployment is not a migration event.
- [x] Build 10 reads existing D1 readiness/profile/module evidence only.

## External acceptance sanity

Build 10 source/runtime state and external acceptance are intentionally independent.

- [ ] Cloudflare Access service-token acceptance — `HOLD_EXTERNAL` until deliberate Build 6 evidence succeeds.
- [ ] Stripe Development acceptance — `HOLD_EXTERNAL` until deliberate test-mode evidence succeeds.
- [ ] PayPal sandbox acceptance — `HOLD_EXTERNAL` until deliberate sandbox evidence succeeds.
- [ ] Social/OAuth controlled acceptance — `HOLD_EXTERNAL` until deliberate intended-account evidence succeeds.
- [ ] CAIP private-media current state — use fresh Build 7 runtime evidence.

- [x] Provider execution from Build 10: NONE.
- [x] Provider publication from Build 10: NONE.
- [x] Payment/refund execution from Build 10: NONE.
- [x] OAuth connect/revoke from Build 10: NONE.
- [x] Secret values inspected/emitted by Build 10: NONE.

## CI / prior authority sanity

- [x] Release 466 Build 1–6 proof workflows remain manual-only provenance under Build 9.
- [x] Build 9 gate is forward-compatible with Build 10 while retaining locked Build 9 manifest/history assertions.
- [x] Release 467 Build 6, Build 7, Build 8 and Build 9 authorities remain separate and retained.
- [x] Production Promotion Readiness remains the separate Build 5 authority.

## Main / Production sanity

The carried-forward source-head observation for `main` is `fcf92f5342c04f0f0d07387034e852b4cc40f3f9`; this is not proof of the currently deployed Production release.

- [x] Build 10 does not update `main`.
- [x] Build 10 does not contact Production resources.
- [x] Build 10 does not copy Development business data to Production.
- [x] Production promotion remains a separate exact-candidate review under Release 467 Build 5 Production Promotion Readiness.

## Current verdict

Release 467 Build 9 is the exact proven Development predecessor. Release 467 Build 10 is a bounded, schema-neutral I.T. application candidate that consolidates current operational evidence and corrective guidance without repairing data/access automatically or changing external/Production authority. External lanes remain truthfully `HOLD_EXTERNAL`.
