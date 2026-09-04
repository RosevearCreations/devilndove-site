# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

This guide defines the safe restart sequence for the canonical Devil n Dove Development environment. `current-development-authority.json` is the machine-readable restart pointer. Historical compatibility selectors are not current release authority.

## Last fully verified Development checkpoint

Release 467 Build 48 — Automated Production Acceptance is fully GREEN/CLOSED at:
- final `dev` SHA `3980661045c68f55fa64e66e6414055ee0d359f6`
- tree `66e5e0a088d6eb9f4f85f70791de8925ac40adb0`
- System Gate `33925647553` SUCCESS
- Current Application Quality `33925647532` SUCCESS
- I.T. Admin Runtime Proof `33925647561` SUCCESS
- Repository Branch Hygiene `33925647559` SUCCESS
- canonical D1 migration proof, Development data-authority read-only proof, exact Preview deployment, control-plane binding proof, non-secret smoke acceptance and regression evidence: SUCCESS.

Build 48 implementation acceptance is retained independently at `19ee5739ff5f374fae4faf6c003ffca2a0ca557a` / tree `aef0bf492ffbbee0f4d39e19c84fdbd874a9aaa7`. Implementation acceptance and final closure are intentionally different checkpoints.

Build 48 is GET-only Automated Production Acceptance over the approved Build 47 Grey Hair story/edit package. A passing acceptance package authorizes **no** rendering, provider execution, publication, social handoff, R2 mutation, `main` mutation or application Production promotion. Build 48 adds no canonical migration or request-time DDL; the canonical stream remains exactly `0001`–`0004`.

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

## Restart-integrity protocol

Static repository files cannot truthfully embed proof run IDs for workflows that execute only after the same commit exists. Release 467 Build 49 therefore uses `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1`:

1. `accepted_dev_sha` records the implementation checkpoint accepted before authority closure.
2. `restart_integrity.last_fully_verified` records the previous exact `dev` branch head whose System, Quality, I.T. and Hygiene workflows have all already completed successfully.
3. A closure candidate must never self-claim final proof results that have not executed yet.
4. After the closure candidate merges, verify all four workflows on that exact new `dev` head and the exact Preview deployment in System Gate.
5. The next build ingests those externally proven final closure values before source mutation begins.

This removes the infinite loop in which committing run IDs creates a new SHA that would itself need another set of run IDs.

## Startup sequence

1. Read `current-development-authority.json` first.
2. Read `restart_integrity.last_fully_verified` and record its exact SHA, tree and four proof run IDs.
3. Fetch current `dev`. It must be at or descended from the verified checkpoint.
4. If current `dev` is newer than the stored verified checkpoint because it is the preceding build's closure candidate, verify System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene on that exact current `dev` SHA before starting a new build.
5. Ingest that newly proven closure into the next build's authority update; do not create a separate commit merely to make the preceding static file self-claim its own post-commit proof.
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

## Current Build 49 boundary

Release 467 Build 49 — **Current Authority Convergence & Restart Integrity** is authorized. It is limited to authority/restart protocol convergence, the new source gate, and synchronized read-only I.T./Preflight/Reliability projections. It adds no schema and does not reopen Grey Hair production execution.

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

Build 48 remains the last fully verified checkpoint while Build 49 is in flight. Builds 47–45 retain Grey Hair planning/synchronization/media authority; Builds 44–41 retain Packaging protections; Build 40 Product Social, Build 39 Product Numbering, Build 38 Accounting, Build 37 Deployment Preflight and Build 36 Reliability remain historical bounded authorities.

The active I.T., Reliability and Deployment Preflight surfaces are read-only projections. They never perform permission repair, request-time schema mutation, D1/R2 business-data writes, provider execution, media rendering, publication, Access policy mutation, `main` mutation, Production mutation or rollback execution.
