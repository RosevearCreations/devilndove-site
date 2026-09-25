# Release 467 Build 261 — Production Proof Dependency Orchestration

## Purpose

Build 261 applies the Release 467 efficiency roadmap to Production dependency orchestration without weakening the proof set. It removes redundant historical `main` push subscriptions while preserving Development evidence and every canonical Production proof.

## Exact predecessor

Build 260 **Pull-Request Matrix Fan-Out Reduction** closed on Development SHA `28b6f64d43f05e6c00a1cec579fa51f6a8797c0d` and Production main `2f227d8ceb2239b5dc95b6f7a730c755a338d6f2`, sharing tree `bde6ee54115f549d47f9d1fcf1f59b016f099a79`.

Build 261 verifies the predecessor live by exact SHA through the reusable proof composition before accepting this candidate.

## Bounded Production orchestration change

Exactly **39** historical release-proof workflows — Builds **206–241 and 258–260** — no longer subscribe to Production `main` pushes. Their `dev` push evidence and `workflow_dispatch` manual evidence remain available. No workflow or historical gate script is deleted.

This is a branch-filter reduction only. It does not reduce the repository-wide generic `push` trigger count because those workflows still run on Development.

## Canonical Production proofs retained

The canonical dependency remains:

1. **Production Pages Deploy** — deliberate exact-`main` deployment proof.
2. **Production Live Resource Integrity Proof** — independently visible `workflow_run` proof after successful Production Pages.
3. **Release 467 Build 155 Products Production Browser Proof** — independently visible `workflow_run` proof after successful Production Pages.
4. **Release 467 Build 154 Products Route Production Proof** — independently visible `workflow_run` proof after successful Production Pages.

The two non-Production `workflow_run` chains are also retained. The total remains **5**. Build 261 therefore removes no independently owned dependency listener merely to reduce a count.

## Expected candidate inventory

With the Build 261 workflow added, the generic trigger scanner is expected to report **151 workflow files / 37 pull_request / 125 push / 133 workflow_dispatch / 5 workflow_run**. The material Production reduction is **39 historical `main` push subscriptions removed**.

## Safety and successor

Exact-SHA promotion, identical-tree continuity, named Production proof visibility, Canada/CAD policy, the U.S. shipping pause, and all business/provider mutation boundaries remain unchanged.

No schema/D1/R2/provider/Product/Inventory/Finance/business-data mutation is introduced.

The future queue remains open. Next is **Build 262 — Operations Today-Tasks Read Fan-Out Review**.
