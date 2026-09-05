# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

This guide defines the safe restart sequence for the canonical Devil n Dove Development environment. `current-development-authority.json` is the machine-readable restart pointer. Historical compatibility selectors are not current release authority.

## Current accepted Development implementation

Release 467 Build 52 — Content Studio Render Readiness / Explicit Execution Boundary has GREEN implementation acceptance at:
- `dev` SHA `24f66983bf052280f62d0983f27d9707ef20d8f2`
- tree `de49d1b7ad75a7fbff31749165d93b2f1aba94a9`
- System Gate `33932827712` SUCCESS
- Current Application Quality `33932827708` SUCCESS
- I.T. Admin Runtime Proof `33932827704` SUCCESS
- Repository Branch Hygiene `33932827696` SUCCESS
- canonical Development migration proof, Development data-authority read-only proof, exact Preview deployment, control-plane binding proof, non-secret smoke acceptance and regression evidence: SUCCESS.

## Last fully verified restart checkpoint

Build 51 — Explicit Content Studio Schema Readiness is the last fully verified restart checkpoint:
- `dev` SHA `3f5e10f4ad005945ed4092b63079b11f62c4d7ee`
- tree `baca33be1a9b0dc888f12c2882f97545faed97a8`
- System Gate `33932323391` SUCCESS
- Current Application Quality `33932323375` SUCCESS
- I.T. Admin Runtime Proof `33932323392` SUCCESS
- Repository Branch Hygiene `33932323423` SUCCESS
- exact Preview acceptance: SUCCESS.

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative:
1. `accepted_dev_sha` records the current implementation checkpoint accepted before authority closure.
2. `restart_integrity.last_fully_verified` records the latest exact `dev` head whose System, Quality, I.T. and Hygiene workflows plus exact Preview acceptance have already completed successfully.
3. A closure candidate does not claim results that can only be created after that candidate exists.
4. After the closure candidate merges, verify all four workflows on that exact new `dev` head and verify the System Gate exact Preview deployment chain.
5. The following build ingests those externally proven final closure values before source mutation begins.
6. Do not create an extra evidence-only commit merely to store post-commit run IDs.

## Startup sequence

1. Read `current-development-authority.json` first.
2. Read `restart_integrity.last_fully_verified`; current verified checkpoint is Build 51 at `3f5e10f4ad005945ed4092b63079b11f62c4d7ee`, tree `baca33be1a9b0dc888f12c2882f97545faed97a8`, with System `33932323391`, Quality `33932323375`, I.T. `33932323392` and Hygiene `33932323423`.
3. Fetch current `dev`. It must be at or descended from that checkpoint.
4. If current `dev` is newer because it is the Build 52 closure candidate, verify System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene on that exact current `dev` SHA plus exact Preview acceptance before starting Build 53.
5. Build 53, if separately scoped, must ingest the externally verified Build 52 final closure before any source mutation.
6. Read the current release authority, then `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `SANITY_HEALTH_CHECK.md` and `MARKDOWN_INDEX.md`.
7. Open `/admin/it/`, `/admin/deployment-preflight/` and `/admin/reliability/`; confirm their active projections remain read-only and distinguish implementation acceptance from the verified restart checkpoint.
8. Confirm the canonical Pages project is `devilndove-site`; Development is the `dev` Preview environment and Production is the `main` Production environment.
9. Confirm tracked `wrangler.toml` remains Development-safe and contains no `account_id`.
10. Run current source/System gates before making a release claim.
11. Check Development D1/R2 identity/readiness read-only before deciding whether a migration is required.
12. Never replay historical migrations merely because a chat, workstation, deployment or source commit changed.
13. Future schema changes must be added only to `migrations/canonical`, proven on Development first, and applied to Production only before dependent Production code when separately authorized.
14. Verify Application Modules returns account profiles and the root administrator retains effective `manage` access to all five modules. I.T. remains an explicit-user grant.
15. Keep external provider/Access states separate from source/runtime health. Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent unless fresh evidence explicitly accepts them.
16. External AI/provider execution, rendering, publication, social handoff and R2 writes remain closed unless a future separately approved controlled workflow explicitly opens them.
17. Promote only a separately reviewed exact fully-green Development tree. Never overwrite Production business data from Development.

## Current Build 52 boundary

Build 52 adds GET-only fail-closed Content Studio render readiness. The active `ready_for_render` transition requires approved project/deliverable state, selected public-cleared planned sources, review-first/no-auto-publish policy, applicable video script/target duration, no existing output and no active planned/rendering job. The protected route creates no render job and invokes no provider. `scripts/current_content_render_readiness_gate.py` prevents bypass regressions. Build 52 adds no schema migration and authorizes no renderer/provider execution, publication, social queue expansion, R2 mutation, `main` mutation or Production promotion.

## Canonical Development connection

- Source branch: `dev`
- Pages project: `devilndove-site`
- Pages environment: Preview
- Canonical Preview alias: `https://dev.devilndove-site.pages.dev`
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- Canonical migration directory: `migrations/canonical`
- Canonical migration stream: exactly `0001`–`0004`
- GitHub Actions Cloudflare credential reference: `CLOUDFLARE_API_TOKEN`
- Optional outer Access service-token references: `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET`

Credential values must never be printed, committed or serialized into evidence.

## Current vs historical authority

Build 52 is the current accepted implementation; Build 51 is the last fully verified restart checkpoint during the Build 52 closure cycle. Build 51 retains explicit Content Studio schema-readiness authority; Build 50 retains the reviewed CAIP-to-Content-Studio handoff authority; Builds 48–45 retain Grey Hair acceptance/planning/synchronization/media authority; Builds 44–41 retain Packaging protections; Build 40 Product Social, Build 39 Product Numbering, Build 38 Accounting, Build 37 Deployment Preflight and Build 36 Reliability remain historical bounded authorities.

The active I.T., Reliability and Deployment Preflight surfaces are read-only projections. Build 53 is not scoped until Build 52 final closure is externally proven.
