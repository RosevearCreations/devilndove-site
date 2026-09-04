# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

This guide defines the safe restart sequence for the canonical Devil n Dove Development environment.

`current-development-authority.json` is the current Release 467 machine-readable restart pointer. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and the middleware Release 466 header remains explicit **INHERITED_RUNTIME_COMPATIBILITY**; neither is the current release selector.

## Current Build 41 checkpoint

Release 467 Build 41 — Unified Interface & Label Fit Foundation is accepted on Development at:

- merged `dev` SHA `e98a7b1e00257ad3ffa277aa66efb42de3e94a29`
- tree `cc958ea90566c36fde341706666c3a0ce4f440e5`
- System Gate `33893099319` SUCCESS
- Current Application Quality `33893099369` SUCCESS
- I.T. Admin Runtime Proof `33893099321` SUCCESS
- Repository Branch Hygiene `33893099355` SUCCESS
- exact canonical Preview deployment, control-plane binding proof and non-secret smoke acceptance: SUCCESS.

Build 41 adds responsive Packaging Studio convergence and fail-closed printable-label safe-area protection. It adds no canonical migration. The canonical migration stream remains exactly `0001`–`0004`. This authority-only documentation descendant must itself pass the same four push-triggered proofs after merge before Build 42 starts.

Build 32 remains Production GREEN at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS.

## Startup sequence

1. Read `current-development-authority.json` and confirm Release 467 Build 41, its exact accepted Development implementation and safety boundaries.
2. Read `release467-build41-unified-interface-label-fit-foundation.json`.
3. Read `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `SANITY_HEALTH_CHECK.md` and `MARKDOWN_INDEX.md`.
4. Confirm source branch `dev` is at or descended from the final Build 41 documentation-green closure SHA before starting Build 42.
5. Open `/admin/it/` after authenticated access and confirm the Build 41 read-only Control Tower truth agrees with the pointer.
6. Open `/admin/deployment-preflight/` and confirm the active Release 467 Build 41 projection remains GET-only/read-only.
7. Confirm the canonical Pages project is `devilndove-site`; Development is the `dev` Preview environment and Production is the `main` Production environment.
8. Confirm tracked `wrangler.toml` remains Development-safe and contains no `account_id`.
9. Run current source/System gates before making a release claim.
10. Check Development D1/R2 identity/readiness read-only before deciding whether a migration is required.
11. Never replay historical migrations merely because a chat, workstation, deployment or source commit changed.
12. Future schema changes must be added only to `migrations/canonical`, proven on Development first, and applied to Production only before dependent Production code when separately authorized.
13. Apply only genuinely pending canonical migrations through guarded tooling and verify the native ledger, proof rows, checksums and `PRAGMA foreign_key_check` afterward.
14. Verify Application Modules returns account profiles and the root administrator retains effective `manage` access to all five modules. I.T. remains an explicit-user grant.
15. Keep external provider/Access states separate from source/runtime health. Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access remain HOLD unless fresh evidence explicitly accepts them.
16. Provider execution/publication remains closed unless a separate controlled Development/test/sandbox acceptance explicitly opens that lane.
17. Promote only a separately reviewed exact fully-green Development tree. Never overwrite Production business data from Development.

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

Credential **values** must never be printed, committed, serialized into evidence or pasted into release documents.

## Current vs historical authority

Current reading order:

1. `current-development-authority.json`
2. `release467-build41-unified-interface-label-fit-foundation.json`
3. `AI_HANDOFF.md`
4. `PROJECT_STATUS_AND_ROADMAP.md`
5. `SANITY_HEALTH_CHECK.md`
6. `MARKDOWN_INDEX.md`
7. historical feature authorities only as needed.

Build 40 remains historical Product Social schema authority; Build 39 Product Numbering; Build 38 Accounting; Build 37 Deployment Preflight; Build 36 Reliability. Their bounded protections remain active, but none supersedes the current Build 41 Development pointer.

The active I.T. and Deployment Preflight surfaces are read-only projections. They never perform permission repair, request-time schema mutation, D1/R2 business-data writes, provider execution, Access policy mutation, `main` mutation, Production mutation or rollback execution.
