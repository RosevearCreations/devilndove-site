# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

This guide defines the safe restart sequence for the canonical Devil n Dove Development environment. `current-development-authority.json` is the current machine-readable restart pointer. Historical compatibility selectors are not current release authority.

## Current Build 48 checkpoint

Release 467 Build 48 — Automated Production Acceptance is accepted on Development at:
- merged `dev` SHA `19ee5739ff5f374fae4faf6c003ffca2a0ca557a`
- tree `aef0bf492ffbbee0f4d39e19c84fdbd874a9aaa7`
- System Gate `33925012698` SUCCESS
- Current Application Quality `33925012735` SUCCESS
- I.T. Admin Runtime Proof `33925012737` SUCCESS
- Repository Branch Hygiene `33925012709` SUCCESS
- canonical D1 migration proof, Development data-authority read-only proof, exact Preview deployment, control-plane binding proof, non-secret smoke acceptance and regression evidence: SUCCESS.

Build 48 is GET-only Automated Production Acceptance over the approved Build 47 Grey Hair story/edit package. It requires confirmed Build 46 synchronization, exactly four distinct confirmed cameras, approved story/timeline reviewer evidence, current approved source evidence, exact story-to-clip coverage, valid source bounds, contiguous timing, preserved sync offsets and target-duration compliance. It returns `HOLD` or `ACCEPTED_FOR_CONTROLLED_PRODUCTION`.

A passing acceptance package authorizes **no** rendering, provider execution, publication, social handoff, R2 mutation, `main` mutation or application Production promotion. Build 48 adds no canonical migration or request-time DDL; the canonical stream remains exactly `0001`–`0004`.

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

## Startup sequence

1. Read `current-development-authority.json` and confirm Release 467 Build 48, the accepted SHA/tree and safety boundaries.
2. Read `release467-build48-automated-production-acceptance.json`, then Builds 47, 46 and 45 Grey Hair authorities and retained Packaging/schema authorities as needed.
3. Read `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `SANITY_HEALTH_CHECK.md` and `MARKDOWN_INDEX.md`.
4. Confirm `dev` is at or descended from the final Build 48 authority-green closure SHA before starting any new build.
5. Open `/admin/it/`, `/admin/deployment-preflight/` and `/admin/reliability/` and confirm their active Release 467 Build 48 projections remain read-only.
6. Confirm the canonical Pages project is `devilndove-site`; Development is the `dev` Preview environment and Production is the `main` Production environment.
7. Confirm tracked `wrangler.toml` remains Development-safe and contains no `account_id`.
8. Run current source/System gates before making a release claim.
9. Check Development D1/R2 identity/readiness read-only before deciding whether a migration is required.
10. Never replay historical migrations merely because a chat, workstation, deployment or source commit changed.
11. Future schema changes must be added only to `migrations/canonical`, proven on Development first, and applied to Production only before dependent Production code when separately authorized.
12. Verify Application Modules returns account profiles and the root administrator retains effective `manage` access to all five modules. I.T. remains an explicit-user grant.
13. Keep external provider/Access states separate from source/runtime health. Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD/evidence-dependent unless fresh evidence explicitly accepts them.
14. External AI/provider execution, rendering, publication, social handoff and R2 writes remain closed unless a future separately approved controlled workflow explicitly opens them.
15. Promote only a separately reviewed exact fully-green Development tree. Never overwrite Production business data from Development.
16. There is currently **no approved Build 49 scope**. Choose the next bounded workstream only after final Build 48 closure is GREEN.

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

Current reading order starts with Build 48, then Build 47 story/edit planning, Build 46 synchronization and Build 45 media intelligence. Builds 44–41 retain Packaging protections; Build 40 Product Social, Build 39 Product Numbering, Build 38 Accounting, Build 37 Deployment Preflight and Build 36 Reliability remain historical bounded authorities.

The active I.T., Reliability and Deployment Preflight surfaces are read-only projections. They never perform permission repair, request-time schema mutation, D1/R2 business-data writes, provider execution, media rendering, publication, Access policy mutation, `main` mutation, Production mutation or rollback execution.
