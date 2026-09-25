# Release 467 Build 258 — Historical Workflow Trigger Scope Tightening

## Purpose

Build 258 reduces automatic GitHub Actions fan-out only where Builds 255–257 provide direct evidence that historical Release 467 build-proof workflows are superseded as automatic current-branch owners.

The historical proof sources are **retained**. No workflow file or gate script is deleted. Builds **242–257** become **manual-only provenance** through `workflow_dispatch`, while the canonical current Development and Production proof owners continue to run automatically.

## Exact predecessor

Build 257 closed GREEN on Development SHA `5e6fa8772be5946a0cd53eadbd4b3daa36fce253` and Production main `9e95bca825599dea1459838e10812c74d799c976`, sharing tree `df03a29c947144f298f0908abf53ca3cdda1c159`.

Development proofs: System `36077891398`, Quality `36077890063`, I.T. `36077891374`, Hygiene `36077890258`, Build 257 `36077890220`.

Production proofs: Pages `36078157785`, Live Resources `36078244247`, Product Browser `36078244252`, Product Route `36078244289`, Build 257 `36078158019`.

## Tightened historical span

Exactly **16** build-proof workflows, Builds **242 through 257**, are converted from automatic pull-request/push triggering to manual-only provenance.

The full repository scanner on the exact Build 257 tree measured **147 workflow files**, **87 pull_request**, **137 push**, **107 workflow_dispatch**, **5 workflow_run** and **0 parser-visible issues** triggers. The earlier Build 257 search snapshot (87/91/90 on the candidate) used a different search-derived measurement and is retained only as historical search evidence.

After the 16 historical workflows are narrowed and the active Build 258 workflow is added, the exact full-scanner candidate is **148 workflow files**, **72 pull_request**, **122 push**, **123 workflow_dispatch** and the same **5 workflow_run** chains. This is a net reduction of **15 automatic pull-request workflows** and **15 automatic push workflows** while retaining all historical proof files.

## Coverage retained

The System Gate continues invoking historical Python gate contracts directly. The current canonical proof owners remain System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof, Repository Branch Hygiene, Production Pages Deploy, Production Live Resource Integrity Proof, Product Browser Production Proof and Product Route Production Proof.

The five `workflow_run` chains remain unchanged. Exact-SHA Development proof, identical-tree Production promotion and named Production resource proofs remain mandatory.

## Safety and successor

Build 258 changes no schema, request-time DDL, D1/R2 business data, provider action, Product publication, Inventory movement, Finance posting, business action, branch protection or secret handling. It deletes no workflow and weakens no exact-SHA promotion requirement.

The future queue remains open. Next is **Build 259 — Reusable Exact-SHA Proof Composition**.
