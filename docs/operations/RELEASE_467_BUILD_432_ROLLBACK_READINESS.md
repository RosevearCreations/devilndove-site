# Release 467 Build 432 — Deployment Rollback Readiness & Safe Recovery

## What Build 432 actually provides

**A bounded recovery rehearsal, not a live rollback.** The owner can assess a *specific* historical Production candidate without any code checkout, branch reset, D1 migration, database restore, R2 overwrite, Etsy operation, shipping change, or Cloudflare deployment.

- `scripts/release432_rollback_rehearsal.py`: pure, fail-closed source and evidence evaluation plus read-only Git commit/tree/diff inspection. It requires 40-character SHAs, a historical target reachable from the current commit, and a genuinely different Git tree. It checks archived Build 430 Production receipt source SHA, Cloudflare deployment identity, exact historical successful GitHub Production Pages Deploy run, and the currently served Production version marker. A candidate is never treated as authorized by a mere match of two branches or an unverified owner assertion.
- `scripts/release432_rollback_rehearsal_test.py`: deterministic offline tests for valid historical evidence, wrong SHA, missing or failed receipt, old/incorrect live identity, unverified source ancestry, risky Functions/schema/binding differences, and absence of all deployment/data/provider mutations.
- `.github/workflows/release432-rollback-rehearsal.yml`: manual `workflow_dispatch` with exact historical candidate SHA and run ID. Reads GitHub source history and the prior `production-promotion-proof-<sha>` artifact; obtains an independent status for the historical run; inspects current `https://devilndove.com/release-version.json` and exports `release432-rollback-rehearsal.json`. Triggering this workflow **cannot** deploy, reset, merge, change Git refs, restore D1/R2, or run Etsy operations. It also runs offline regressions on `dev` changes.
- `/admin/rollback-readiness/`: responsive Admin-only read-only handoff with current `dev`/`main`, Production workflow and custom-domain marker status, checklist and links to the isolated rehearsal. It performs no startup polling and requires operator click to inspect. Linked from Release Control and Release Gate Status.
- The main Current Application Quality gate additionally runs the regression tests.

## How to interpret results

The diagnostic always states `HOLD_FOR_MANUAL_RECOVERY_REVIEW`. Even when `holds: []`, the recovery is a **rehearsal only** and requires explicit owner review, candidate approval, a separate code-only recovery PR, preservation of Production-owned data, protected exact-SHA Development proofs, and a fresh Cloudflare Production deployment + smoke + live marker verification.

If evidence is inaccessible, the archived receipt cannot be retrieved, historical GitHub run is not SUCCESS for that SHA, current marker is stale, candidate is not an ancestor, or changed server/database/config files require audit, it records precise holds. Any code rollback across schema changes requires a documented compatibility evaluation and is NEVER permission to restore a database or replay migrations.

## Operator procedure — no Bash required

1. Visit `/admin/rollback-readiness/` and select **Check exact release evidence** to examine the current Production marker.
2. In GitHub, review an existing prior Production Pages Deploy successful run and its archived `production-promotion-proof-<sha>` evidence. Do not choose a historical green Build based only on a milestone number.
3. From the **Release 432 Read-Only Rollback Rehearsal** workflow, select **Run workflow** and supply the exact historical 40-character Git SHA and verified historical Production Pages Deploy run ID.
4. Download the `release432-rollback-rehearsal` artifact. Review `holds`, `changed_files_sample`, `sensitive_changed_files`, source trees and `safety_boundaries`. There is deliberately no automated restore.
5. Any real recovery must be a **new, separately authorized** change and redeployment under the existing protected release gates, not a rollback button. Check live site after deployment.

## Permanent safety boundaries

- Production D1 owns business records: never restore stale D1 snapshots, replay transaction migrations, overwrite orders or swap with Development data.
- Production R2 owns original Product media and private CAIP data: never copy/delete/overwrite private media when rolling back code.
- Preserve U.S. shipping suspension, Etsy one-attempt idempotency and publication controls. Never reactivate publication, payments, or provider writes as a side effect.
- Never claim Production GREEN without successful exact-SHA Development proofs, protected Production Pages Deploy, verified Cloudflare project/deployment identity, public smoke, and matching live SHA marker.
- Existing Production workflow remains authoritative; Build 432 does not weaken it.

**Next planned:** Build 433 — Brand V3 Remaining Customer Placeholder Replacement. The ongoing Etsy single-product test remains on HOLD by owner choice until tomorrow, and is not part of the rollback work.
