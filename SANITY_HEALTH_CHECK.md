# Devil n Dove — Sanity / Health Check

## Current release state

**Release 467 Build 21 — Release State, Branch & CI Hygiene Convergence** is the active Development candidate.

Exact application/runtime predecessor: **Build 20 — Workshop Tool & Equipment Readiness Command Center**.

- Build 20 merged `dev`: `7b38af543400a81593a8dc1b7caa4ad9a43033ea`
- Build 20 tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- System Gate `33688666947`: SUCCESS
- Build 20 Proof `33688733720`: SUCCESS
- Production `main`: `055cbc973c667b35a209c7ea207779089f6fed3a`
- Production tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- Production Pages Deploy `33688892602`: SUCCESS

## GREEN

- Build 20 Development source/deployment: GREEN.
- Build 20 Production deployment: GREEN.
- Canonical D1 migrations: exactly `0001`–`0004`, already proven on Development and Production.
- Development/Production D1 isolation: retained.
- Product and CAIP R2 environment separation: retained.
- request-time schema mutation: CLOSED.
- public SEO one-H1 rule and whole-site Build 15 SEO gate: retained.
- Build 20 workshop readiness runtime: read-only; Tool Lifecycle and Inventory retain write ownership.
- Canada-only fulfillment and U.S. sales/shipping suspension: retained.

## BUILD 21 — REPOSITORY GOVERNANCE

Build 21 changes no runtime application surface. It synchronizes release truth and repository lifecycle:

- persistent branches: `main`, `dev`;
- merged non-core branches: eligible for deletion;
- unique historical branch tips: archive tag first, then delete branch;
- unknown unmerged branches: RETAIN_WITH_WARNING;
- old Build 16–20 proof workflows: manual historical proof only;
- current automatic proof: canonical System Gate + Build 21 proof;
- Production promotion: NOT AUTHORIZED.

## HOLD_EXTERNAL

These remain external acceptance matters and do not become GREEN from source configuration alone:

- Cloudflare Access service-token acceptance;
- Stripe Development acceptance;
- PayPal sandbox acceptance;
- Social/OAuth acceptance;
- CAIP private-media acceptance unless current evidence independently proves it.

## Safety assertions

- Build 21 schema migration: NONE.
- Build 21 runtime application change: NONE.
- Build 21 D1/R2 business-data mutation: NONE.
- Build 21 provider execution/publication: NONE.
- Build 21 Cloudflare Access policy mutation: NONE.
- Build 21 `main` / Production mutation: NONE.
- bounded non-core repository-ref cleanup: AUTHORIZED only under Build 21 fail-safe rules.
- secret values emitted: NONE.

## Current verdict

**Application runtime: GREEN at Build 20. Production: GREEN at Build 20. Build 21: DEVELOPMENT CANDIDATE until exact-head proof, PR/System Gate, merged-SHA Development deployment and branch-hygiene verification complete.**

Production remains Build 20 at `055cbc973c667b35a209c7ea207779089f6fed3a`, tree `550272841e764d77fc21297abede3d4cae1aaea0`, Production Pages Deploy `33688892602` SUCCESS.
