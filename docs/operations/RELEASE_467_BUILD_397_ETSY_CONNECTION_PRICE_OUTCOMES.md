# Release 467 Build 397 — Etsy Connection Observability & Price Review Outcomes

Status: **DEVELOPMENT CLOSURE CANDIDATE** (not yet Production GREEN).

## Product scope
- An authenticated admin explicitly requests stored Etsy connection verification state, shop verification age and sanitized historical OAuth callback outcome. No provider call or background polling, and a historical callback result cannot override the current stored connection.
- A single Product ID returns canonical current CAD cents and the latest operator-approved source price receipt. A missing approved source is never guessed; an approved zero price is allowed.
- Operator choices are limited to **source needed**, **discrepancy investigation**, and **approved price match reviewed**. An action is permitted only when the current source evidence supports that exact outcome.
- Decisions append actor-linked, idempotent receipts to the existing `admin_action_audit` table with exact source/price fingerprint, Product cents guard, approved receipt guard and last-outcome audit-head guard. No new schema or automatic price update.
- After recording a decision, the browser rereads the receipt, displays an OK outcome, and prevents repeated submissions while a request runs.
- Neither this view nor its status constitutes independent original source authentication, provider reachability proof, Etsy listing acceptance, or authorized Product correction.

## Release evidence and guardrails
Build 396 development: `dce1e5eb44411f926822a153775a3ae1656e04a9`; source tree `430c449f0c67291c15c7ef5589e7a9d355a643a3`.
Build 396 CI: System 38509628146, Application Quality 38509628109, I.T. Runtime 38509628152, Branch Hygiene 38509628153.
Build 396 production: `1a696def192024066b234c7f6bbc56158c2405bf`; Cloudflare Pages Deploy 38509872223; Production Live Resource Integrity 38509954292.

- [ ] Exact-commit Build 397 feature regression and four required Development checks pass.
- [ ] Canonical Cloudflare development preview is green on identical SHA.
- [ ] Promotion commits identical approved Git tree to `main`, never a blanket merge or force push.
- [ ] Cloudflare production deploy and public smoke checks pass.
- [ ] Independent Production Live Resource Integrity proof passes for exact `main` commit.
- [ ] Authenticated browser and independent original-document review remain separate owner acceptance checks; never claim they occurred when no evidence was captured.

Proposed successor after Build 397 GREEN: **Build 398 — Etsy Outcome Review Operator Acceptance & Evidence Recheck**.
