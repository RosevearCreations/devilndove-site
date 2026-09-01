# Devil n Dove — Sanity / Health Check

## Current release

**Release 466 — Operational Resilience and Commercial Readiness — Build 1 is Development green with native GitHub ruleset application externally pending.** Release 465 remains Production green and unchanged on `main`.

## Environment boundaries

- [x] `dev` → `devilndove-site` Preview/Development.
- [x] Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product/CAIP R2 remain isolated Development buckets.
- [x] `main` remains Release 465 at `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`.
- [x] Production D1/R2 remain isolated Production authorities.
- [x] Production business/transactional data remain Production-owned.
- [x] Request-time schema mutation, raw R2 deletion and provider execution/publication remain closed.
- [x] Cloudflare Access is not weakened for Preview acceptance.

## Canonical D1 authority

- [x] Canonical stream remains exactly `0001`–`0004`.
- [x] Release 466 Build 1 introduced no migration `0005`.
- [x] Development canonical System Gate reported `No migrations to apply!`.
- [x] Development: `583` total non-sqlite tables / `4` migrations / `4` proofs / `4` Release 465 guards / `11` Build 3 authorities / `0` FK violations.
- [x] Production: canonical `0001`–`0004` remain applied/proven from Release 465.

## Release 466 Build 1 proof

- [x] Technical source SHA `96c51f4f2f7ebeb8035b2d4db4c8c3aadf2ffe2c`.
- [x] Canonical System Gate `33463654502` passed.
- [x] Exact Preview `https://60d84da5.devilndove-site.pages.dev` passed bindings and Access-safe smoke.
- [x] Supplemental Build 1 Proof `33463654504` passed.
- [x] Proof artifact `9784113538` retained.
- [x] Recovery rehearsal: live Development application-table count excluding `_cf_%` = `582`; restored ephemeral SQLite application tables = `582`.
- [x] Recovery integrity check `ok`; FK violations `0`.
- [x] Raw D1 export and restored SQLite database were deleted and not retained as artifacts.
- [x] Structural drift: Development `603` identities / Production `603`; missing `[]`; extra `[]`; canonical migration/proof identities match.
- [x] Drift detector read no Production business rows and performed no Production mutation.
- [x] Production reliability snapshot: **100/100 GREEN**.
- [x] Production D1/Product R2/CAIP R2 bindings proven.
- [x] Open critical runtime incidents `0`; open error runtime incidents `0`; FK violations `0`.
- [x] Recovery export is serialized after the exact-SHA canonical System Gate to avoid D1 export/migration contention.

## Item status

- [ ] Item 1 native GitHub `dev`/`main` ruleset application — **external repository setting pending**. In-repository policy and equivalent fail-closed controls are green.
- [x] Item 2 rollback readiness — Development green, execution disabled.
- [x] Item 3 disaster-recovery rehearsal — Development green.
- [x] Item 4 structural drift detector — Development green.
- [x] Item 5 Production reliability/SLO snapshot — Development green.

## Remaining amber boundaries

- [ ] Native GitHub ruleset application.
- [ ] Release 466 Builds 2–4.
- [ ] Stripe Development, PayPal sandbox, CAIP private-media and Social/OAuth acceptance remain deliberately deferred to Build 4.
- [ ] Release 466 Production promotion is not authorized.

## Current verdict

Release 466 Build 1 is technically Development GREEN. Native GitHub ruleset application remains the only item-1 external governance action. Production remains safely on Release 465. The next bounded work after final closure proof is Release 466 Build 2, items 6–10.
