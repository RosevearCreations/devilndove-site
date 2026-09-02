# Release 467 Build 21 — Release State, Branch & CI Hygiene Convergence

## Purpose

Build 21 closes repository/release-governance drift after the successful Build 20 Development and Production promotion. The runtime application is intentionally unchanged.

The exact predecessor is Release 467 Build 20:

- Development `dev`: `7b38af543400a81593a8dc1b7caa4ad9a43033ea`
- Development/Production tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- System Gate: `33688666947` — SUCCESS
- Build 20 Proof: `33688733720` — SUCCESS
- Production `main`: `055cbc973c667b35a209c7ea207779089f6fed3a`
- Production Pages Deploy: `33688892602` — SUCCESS

## Problem being closed

After Build 20, several canonical Markdown authorities still described Builds 18–19 or a Build 20 candidate, and historical Release 467 proof workflows continued to fan out automatically even when their older pointer assumptions could fail on a newer exact-green SHA. The repository also retained many completed feature branches.

Build 21 makes that release state deterministic rather than relying on manual cleanup.

## Branch lifecycle authority

Persistent branches are exactly:

- `main`
- `dev`

`.github/workflows/repository-branch-hygiene.yml` runs after pushes to `dev` and may also be manually dispatched.

Its rules are fail-safe:

1. `main` and `dev` are never deletion candidates.
2. Any non-core branch already merged into `dev` or `main` is deleted.
3. Two explicitly known unmerged historical branches are archived to tags before branch deletion:
   - `backup-main-before-dev-replacement-20260830` → `985ecfad41207f8bf46ad99e1346e6e69ece5a69`
   - `release467-build7-handoff-convergence` → `1486777699808c1252f585b7024e2fcfd6296b26`
4. Archive tags use prefix `archive/branch-hygiene/`.
5. An unknown unmerged branch is retained and reported with a warning; it is not deleted automatically.
6. The cleanup job changes Git refs only. It does not modify source files, D1, R2, providers, Access, runtime data or Production.

## CI lifecycle authority

The proof workflows for Release 467 Builds 16, 17, 18, 19 and 20 are retained as historical/manual evidence but become `workflow_dispatch` only.

Current automatic validation is:

- canonical `System Gate`;
- `Release 467 Build 21 Release State Branch CI Hygiene Proof`;
- repository branch hygiene on `dev` pushes.

The Build 21 proof directly runs the retained Build 20 source gate and the whole-site public SEO gate, so retiring old automatic fanout does not remove predecessor or public SEO regression protection.

## Authority convergence

Build 21 synchronizes:

- `current-development-authority.json`
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `SANITY_HEALTH_CHECK.md`
- `MARKDOWN_INDEX.md`

The Build 20 gate becomes forward-compatible: when the current pointer is Build 21 or newer, it verifies Build 20 through the immutable Build 20 manifest and Build 21 predecessor evidence rather than requiring Build 20 to remain the active candidate forever.

## Safety boundary

Build 21 authorizes:

- repository branch-ref cleanup under the exact rules above;
- archive-tag creation for the two explicit unique legacy branches;
- CI trigger retirement for old proof workflows;
- documentation/current-authority convergence.

Build 21 does **not** authorize:

- application runtime behavior change;
- schema migration or request-time DDL;
- D1 or R2 mutation;
- Product/Inventory/Order/Accounting/Tool mutation;
- provider execution or publication;
- Cloudflare Access policy mutation;
- secret-value output;
- `main` mutation;
- Production mutation or automatic promotion.

Canonical migrations remain exactly `0001`–`0004`.

## Acceptance

Build 21 is GREEN only after:

1. exact feature-head Build 21 proof succeeds;
2. PR/System Gate checks succeed on that unchanged head;
3. the exact proven head merges to `dev`;
4. exact merged Build 21 proof succeeds;
5. canonical System Gate succeeds and deploys the exact merged Development SHA;
6. repository branch hygiene succeeds on the merged `dev` push; and
7. post-cleanup branch inventory confirms the intended persistent branch state, with archive tags preserving the two explicit unique legacy tips.

External lanes remain `HOLD_EXTERNAL` and are not a blocker for this repository-only build.
