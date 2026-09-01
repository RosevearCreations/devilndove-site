# Devil n Dove — AI Handoff

## Current authority

**Release 466 — Operational Resilience and Commercial Readiness — Build 1 is Development green with one external repository-governance boundary pending.** Items 2–5 are fully Development green. Item 1's in-repository fail-closed branch policy is implemented and gated, but native GitHub `dev`/`main` ruleset application remains external because the connected GitHub integration can read rulesets but cannot write them.

Release 465 remains fully GREEN on Production and must not be reopened unless a current gate proves drift.

## Exact environment boundary

### Development
- branch: `dev`
- Pages: `devilndove-site` / Preview
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Production
- branch: `main`
- current Production release: **465**
- current Production source: `d5009d9c622bdf84232b3aa7bd24a1c3d61581b2`
- live: `https://devilndove.com`
- D1: `devilndove-prod-r462` (`f34a741b-0000-45b0-9a96-6be08754d563`)
- Product R2: `devilndove-toolshed-images`
- CAIP R2: `devilndove-caip-media`

Production business/transactional data remain Production-owned. Release 466 has **not** been promoted to Production.

## Release 466 Build 1 technical-green evidence

Technical source SHA: `96c51f4f2f7ebeb8035b2d4db4c8c3aadf2ffe2c`.

Canonical System Gate:
- run `33463654502`
- source job `99718937820`
- deploy-development job `99718991277`
- exact Preview `https://60d84da5.devilndove-site.pages.dev`
- Development D1: `583` total non-sqlite tables including Cloudflare reserved storage / `4` canonical migrations / `4` proofs / `4` Release 465 guards / `11` Build 3 required authorities / `0` FK violations
- `No migrations to apply!`
- Access-safe Preview smoke passed; auth headers ZERO; Access weakened NO.

Release 466 supplemental proof:
- run `33463654504`
- source-proof job `99718937752`
- runtime-proof job `99718977134`
- artifact `9784113538`
- recovery rehearsal: remote application-table count excluding `_cf_%` = `582`; ephemeral restored SQLite application tables = `582`; integrity `ok`; FK violations `0`; raw export retained NO; restored DB retained NO
- structural drift: Development `603` identities / Production `603`; missing `[]`; extra `[]`; migration/proof identities match
- Production reliability snapshot: **GREEN 100/100**, D1/Product R2/CAIP R2 bindings proven, open critical incidents `0`, open error incidents `0`, FK violations `0`, business rows read NO, Production mutation ZERO

The recovery proof is serialized after the exact-SHA canonical System Gate because a D1 export can temporarily make D1 unavailable. Never run the recovery export concurrently with canonical migration/deployment acceptance.

## Build 1 status

1. Native GitHub branch/ruleset protection — **Development green policy / external native ruleset application pending**.
2. Production rollback readiness — **Development green**. Readiness only; no deploy, schema reverse, branch movement or automatic data restore.
3. Disaster-recovery rehearsal — **Development green**.
4. Development/Production structural drift detector — **Development green**, schema metadata only.
5. Production reliability/SLO current snapshot — **Development green**, read-only and not a historical uptime claim.

Build 1 is schema-neutral. Canonical migrations remain exactly `0001`–`0004`.

## Permanent safety rules

- Exact green Development tree only may move to `main`.
- Main-only application patches are forbidden.
- Production transactional data are never overwritten from Development.
- Request-time schema DDL remains forbidden.
- Schema migrations are forward-only; rollback does not automatically reverse schema.
- Business-data restore is never automatic.
- Native Git-triggered Cloudflare Pages deployment remains frozen.
- Provider execution/publication remain closed unless separately authorized.
- Raw CAIP R2 deletion remains closed.
- Cloudflare Access is never weakened for Preview smoke.

## Next bounded work

After the final Build 1 closure SHA re-passes both canonical System Gate and Release 466 Build 1 Proof, proceed to **Release 466 Build 2 — Runtime & Storefront Intelligence, items 6–10**. Do not touch `main` for Release 466 until a later deliberate Production promotion is explicitly requested.

## Canonical reading order

1. `development-release.json`
2. `release466-build1-governance-recovery-reliability.json`
3. `docs/operations/RELEASE_466_FOUR_BUILD_ROADMAP.md`
4. `AI_HANDOFF.md`
5. `PROJECT_STATUS_AND_ROADMAP.md`
6. `SANITY_HEALTH_CHECK.md`
7. `.github/RELEASE466_BRANCH_PROTECTION_POLICY.md`
8. `release463-environment.json`

Release 465 files remain immutable historical acceptance authorities and must continue to pass their append-safe gates.
