# Release 466 Branch Protection Policy

This file is the canonical in-repository policy for native GitHub protection of `dev` and `main`.

## Current external state

The connected GitHub integration can read repository rulesets but cannot create or update them. At Release 466 Build 1 start, the repository ruleset collection is empty. Therefore native application of this policy remains an external repository-governance action; the application must never be falsely reported as complete until GitHub itself shows the ruleset.

## Required rules for `dev`

- Target branch: `dev`.
- Block branch deletion.
- Block force pushes.
- Require linear history.
- Require successful status check context `source-gate` before an update is accepted.
- Do not permit a bypass that allows an un-gated application tree to become Development authority.
- The exact commit accepted by the source gate must be the commit advanced to `dev`; no merge-generated application tree is allowed.

## Required rules for `main`

- Target branch: `main`.
- Block branch deletion.
- Block force pushes.
- Require linear history.
- Require successful status check context `source-gate` on the exact commit before an update is accepted.
- `main` must remain an exact tree previously proven green on `dev`.
- Production deployment remains owned by `.github/workflows/production-pages-deploy.yml`; native Git-triggered Cloudflare Pages deployments remain disabled.
- Main-only application patches are forbidden.

## Why pull-request-only enforcement is not required here

The canonical release mechanic deliberately preserves an exact source-gated commit SHA from candidate branch to `dev`, then from exact green `dev` to `main`. A rule that unconditionally creates a merge/rebase commit can change that SHA. The required control is therefore successful status proof on the exact commit plus no force-push/delete and the existing same-tree promotion gate.

## Fail-closed in-repository equivalents

Until native GitHub rulesets are applied, these controls remain mandatory:

- `scripts/repository_forward_sanity.py` validates branch/release boundaries.
- `scripts/main_promotion_gate.py` requires exact green Development tree before `main` Production work.
- `.github/workflows/system-gate.yml` owns Development source and deployment acceptance.
- `.github/workflows/production-pages-deploy.yml` owns Production migrations-before-code, business-count preservation, exact deployment and smoke.
- `scripts/release466_build1_gate.py` rejects removal or weakening of this policy.

## Completion evidence

Item 1 may be marked fully complete only when a GitHub repository ruleset or branch-protection read proves these native controls are active for both `dev` and `main`. Until then its state is `external_repository_setting_pending`, even though equivalent in-repository controls remain fail closed.
