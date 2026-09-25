# Release 467 Build 260 — Pull-Request Matrix Fan-Out Reduction

## Purpose

Build 260 applies the evidence from Builds 257–259 to reduce duplicated pull-request CI fan-out without removing current proof semantics.

## Exact predecessor

Build 259 **Reusable Exact-SHA Proof Composition** closed GREEN on Development SHA `270eea921559b2439459180998cc367b6fe7c9bb` and Production main `af294ad20ec26222ec0f7ccdb856f39de9fbbd2e`, sharing tree `e81b613e5a4b491927ab89c89800345025853b99`.

Development proofs: System `36082784059`, Quality `36082784168`, I.T. `36082783908`, Hygiene `36082784042`, Build 259 `36082783905`.

Production proofs: Pages `36082913970`, Live Resource `36082967263`, Product Browser `36082967302`, Product Route `36082967286`, Build 259 `36082914063`.

## Measured fan-out

Build 256 full-scanner baseline: **87 pull-request workflows**.

Build 259 full-scanner candidate: **149 workflow files / 73 pull_request / 123 push / 124 workflow_dispatch / 5 workflow_run**. Its exact final PR head ran **72** workflows.

Build 260 identifies exactly **38** still-automatic historical release proof workflows—Builds **206–241 and 258–259**—whose same gate contracts are retained by the canonical System Gate. Only their `pull_request` sibling is removed. Every existing `push` evidence path remains. All 38 targets are manually dispatchable after Build 260; the seven that lacked manual dispatch gain it. Build 240 had no push trigger before Build 260 and becomes **manual-only provenance** after its PR trigger is removed.

With Build 260's own active proof workflow added, the expected scanner result is **150 workflow files / 36 pull_request / 124 push / 132 workflow_dispatch / 5 workflow_run**, with an expected **35 actual PR runs**.

This is a scanner reduction of **37 PR triggers from Build 259** and **51 from the Build 256 scanner baseline**. It does not claim push reduction.

## Proof semantics retained

The canonical System Gate remains automatic and continues to execute the target historical gate contracts. Current Application Quality Proof, I.T. Admin Runtime Proof, Repository Branch Hygiene, the Build 260 proof, exact-SHA Development/Production composition, Production Pages, Live Resource Integrity, Product Browser and Product Route requirements remain intact.

No workflow file or historical gate script is deleted.

## Safety and successor

No schema/D1/R2/provider/Product/Inventory/Finance/business-data mutation is introduced. Exact-SHA and identical-tree promotion remain mandatory.

The future queue remains open. Next is **Build 261 — Production Proof Dependency Orchestration**.
