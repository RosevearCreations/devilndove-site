# Release 467 Build 91 — Prelaunch Authority & Go-Live Decision Convergence

## Purpose

Build 91 converts the existing `/admin/prelaunch/` page from historical Build 229/230 presentation into the current Release 467 fail-closed launch decision surface. It does not create a second readiness database, a second external-acceptance engine or a new go-live mutation path.

## Proven Build 90 predecessor

Development Build 90 is externally proven at exact SHA `ab23457370ced9224facc2a09c1cca7b1ff20968`, tree `54f069f37e09e6f48e035f98656423ed28aa85f4`:
- System Gate `34434124113` — SUCCESS
- Current Application Quality `34434123999` — SUCCESS
- I.T. Admin Runtime Proof `34434124058` — SUCCESS
- Repository Branch Hygiene `34434124046` — SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence — SUCCESS.

Production Build 90 is GREEN at the same SHA/tree:
- Production Pages Deploy `34434296247` — SUCCESS
- Production Live Resource Integrity `34434356959` — SUCCESS.

Build 91 ingests that final Build 90 closure before changing current operator truth.

## Current launch-decision model

The prelaunch surface reads two existing current authorities:
1. `/api/admin/startup-readiness` for D1-backed mutable readiness status;
2. `/api/admin/current-external-acceptance-control-center` for the five external acceptance lanes.

The prelaunch client performs GET-only reads and manual refresh. It never calls the Startup Readiness POST path and never directly contacts Stripe, PayPal, Social providers or Cloudflare Access.

A launch decision is `READY` only when all of these are true:
- the verified Development and Production baseline is Build 90;
- Startup Readiness is not degraded;
- every returned required Startup Readiness item is closed (`passed` or `not_applicable`);
- all five external acceptance lanes are present and accepted.

Anything else is `HOLD`. An unavailable authority also yields `HOLD`; readiness is never inferred from missing data.

## Startup Readiness authority

The existing Startup Readiness API currently expects 46 active rows. Build 91 deliberately does not hard-code that count into the page. It reads `expected_total` from the active contract and compares it with returned rows. This replaces the stale `43-gate` current presentation while preserving the existing D1 owner and explicit operator write workflow.

## External acceptance authority

Build 90 remains the structured evidence engine. Build 91 consumes, but does not duplicate, its five lanes:
- Stripe Development — six real evidence dimensions;
- PayPal sandbox — six real evidence dimensions;
- Social OAuth — structured provider selection/readiness/identity/lifecycle/publication-closed evidence;
- CAIP private media — private-review/ranged-streaming/no-copy/no-cache evidence;
- Cloudflare Access — external dispatch/service-token/application-401 proof contract.

Each lane exposes passed/required counts and one next action. External acceptance remains distinct from source/deployment health.

## Commerce boundary

Release 467 Build 77 Canada-Only Commerce Rules and Build 78 checkout reliability remain authoritative:
- shipping country: Canada (`CA`);
- currency: CAD;
- U.S. sales/shipping: disabled;
- existing local pickup: supported.

Build 91 does not alter checkout/payment execution and does not re-enable U.S. shipping or sales.

## Safety boundary

- canonical D1 migrations remain exactly `0001`–`0004`;
- no canonical `0005` is introduced;
- no request-time schema mutation;
- no prelaunch D1/R2/binding mutation;
- no automatic Startup Readiness write;
- no automatic provider execution;
- no provider publication;
- no Production provider execution;
- no Cloudflare Access mutation;
- no automatic Production promotion;
- no Development-to-Production business-data overwrite;
- no secret/token values emitted.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private media remains `EVIDENCE_DEPENDENT` until its own appropriate current evidence is accepted.

## Closure protocol

Build 91 is a closure candidate and cannot self-claim later exact-head proof. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. The exact merged `dev` head must pass System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene, plus canonical Development D1/bindings proof and exact Preview smoke. Only that exact GREEN SHA/tree may be fast-forwarded non-force to `main`. Production must then pass the standard business-data-preserving Pages deployment chain and Production Live Resource Integrity. The next build must ingest Build 91's final external closure evidence.
