# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 21 — Release State, Branch & CI Hygiene Convergence** is the active Development source candidate.

Read `current-development-authority.json` first, then `release467-build21-release-state-branch-ci-hygiene.json`, then `docs/operations/RELEASE_467_BUILD_21_RELEASE_STATE_BRANCH_CI_HYGIENE.md`.

## Exact green predecessor — Build 20

**Release 467 Build 20 — Workshop Tool & Equipment Readiness Command Center** is the exact application/runtime predecessor and is already Development and Production green.

- merged `dev`: `7b38af543400a81593a8dc1b7caa4ad9a43033ea`
- tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- System Gate `33688666947` — SUCCESS
- Build 20 Proof `33688733720` — SUCCESS
- Production `main`: `055cbc973c667b35a209c7ea207779089f6fed3a`
- Production tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- Production Pages Deploy `33688892602` — SUCCESS

Build 20 remains the current deployed application authority. Its Workshop Tool & Equipment Readiness command center is GET/read-only; Tool Lifecycle and Inventory Operations retain write authority. Inspection/calibration remain lifecycle-event evidence and no independent due schedule is invented.

## Build 21 scope

Build 21 changes repository/release governance only:

1. converge the current restart pointer and human-readable authority to the actual Build 20 green state;
2. establish `main` and `dev` as the only persistent core branches;
3. safely remove completed merged feature branches;
4. archive the two explicitly known unique historical branch tips before their branch refs are removed;
5. retain unknown unmerged branches with warnings rather than deleting them;
6. retire automatic Release 467 Build 16–20 proof fanout while retaining those workflows for deliberate manual historical proof; and
7. use the canonical System Gate plus Build 21 proof as the current automatic source/deployment chain.

Build 21 changes no application runtime file, schema, D1/R2 business data, provider state, Cloudflare Access policy, `main`, or Production.

## Environment / safety boundary

- source authority: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 21 runtime application change: NONE
- Build 21 schema/D1/R2 mutation: NONE
- provider execution/publication: NONE
- Cloudflare Access policy mutation: NONE
- `main` / Production mutation: NONE
- bounded non-core Git ref cleanup: AUTHORIZED by Build 21 only

External lanes remain **`HOLD_EXTERNAL`** unless independently proven: Cloudflare Access service token, Stripe Development, PayPal sandbox and Social/OAuth. CAIP private-media remains evidence-dependent and must not be inferred green from source state.

Canada-only fulfillment and the existing U.S. sales/shipping suspension remain intact.

## Production boundary

Production remains **Release 467 Build 20** at `055cbc973c667b35a209c7ea207779089f6fed3a` with Production Pages Deploy `33688892602` SUCCESS. Build 21 is Development-only unless a later Production promotion is explicitly authorized.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build21-release-state-branch-ci-hygiene.json`
4. `docs/operations/RELEASE_467_BUILD_21_RELEASE_STATE_BRANCH_CI_HYGIENE.md`
5. `release467-build20-workshop-tool-equipment-readiness.json`
6. `docs/operations/RELEASE_467_BUILD_20_WORKSHOP_TOOL_EQUIPMENT_READINESS.md`
7. `PROJECT_STATUS_AND_ROADMAP.md`
8. `SANITY_HEALTH_CHECK.md`
9. `MARKDOWN_INDEX.md`
10. `development-release.json` — inherited Release 466 compatibility evidence only

## Restart point

Continue Build 21 on `release467-build21-release-state-branch-ci-hygiene` from exact Build 20 green base `7b38af543400a81593a8dc1b7caa4ad9a43033ea` / tree `550272841e764d77fc21297abede3d4cae1aaea0`. Require exact feature-head proof, PR/System Gate success, unchanged-head merge to `dev`, exact merged Build 21 proof, canonical System Gate Development deployment, and branch-hygiene proof before calling Build 21 GREEN.
