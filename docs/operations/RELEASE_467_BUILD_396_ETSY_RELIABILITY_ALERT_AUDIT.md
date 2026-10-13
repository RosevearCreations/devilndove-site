# Release 467 Build 396 — Etsy Monitoring Reliability, Alert Routing & Audit Closure

Status: **QUEUED / NOT IMPLEMENTED / NOT PRODUCTION GREEN**.

## Prerequisite lock
Build 396 must not be enabled, merged or deployed until Builds 394 (Etsy connection monitoring/price drift functionality) and 395 (operator exceptions and acceptance) pass exact SHA Development and Production checks. Build 393 has human-reported Etsy/shop/price validations, not documented completed CI or production release proof. Cloudflare production automatic deployments are disabled by branch control. Keep production `main`; do not remove existing D1/R2 bindings or alter GitHub default branch.

## Functional scope
1. Reliability: Surface current verified Etsy shop state, last verified check timestamp, consecutive-safe-failure count, and unknown/stale evidence distinctly. Use bounded manual reads and avoid expensive periodic D1 probes.
2. Exception routing: Classify `reauthorization_required`, `provider_unavailable`, `rate_limited`, `verification_unknown`, `source_evidence_missing`, `price_drift_review`, and `save_outcome_unknown`. Route notifications only to authorized operator surfaces; redact auth and customer data.
3. Noise controls: Stable incident identity, deduplication, no duplicate operator acknowledgements, cooldown and bounded retries. Never automatically refresh OAuth grants or change external Etsy listings.
4. Audit: Append/retain authorized incident transitions and human resolution records once per idempotency key, not on every GET. Evidence includes incident ID, UTC created/updated times, lifecycle, deployment SHA, safe summary, actor and outcome.
5. Price drift: Compare canonical integer CAD cents against an approved source record. Treat legitimate zero prices as valid, missing evidence as review needed; no automated corrections or public listing synchronization.
6. Recovery: Show OK only when server response and persisted state agree; on 5xx/timeouts show UNKNOWN and read existing persisted state before permitting retry.

## Required tests
- Verified/stale/revoked Etsy connection classifications.
- 429/502/timeout and recovery; secure diagnostic redaction.
- Duplicate delivery and repeated button clicks produce one effective incident/action.
- Product zero, decimal cents, unknown evidence and changed price.
- GET/read-only routes never perform D1 writes, provider mutation or hidden schema creation.
- Operator authorization; every row scoped; bounded query and retention.
- Existing regression and four exact-head checks: System Gate, Current Application Quality, I.T. Runtime, Repository Branch Hygiene.

## Release / completion checklist
- [ ] Build 394 and 395 functionality proven GREEN with exact-sha evidence.
- [ ] Build 396 runtime implementation reviewed and tests passed on `dev`.
- [ ] Exact Development preview and required D1 proof successful.
- [ ] Divergent `dev` / `main` history reconciled via audited release tree, not a blanket merge.
- [ ] Approved version promoted to `main` without force push.
- [ ] Cloudflare production deployment of exact approved SHA successful (automatic deployments disabled until deliberately resumed).
- [ ] Production Live Resource Integrity and live smoke proof pass.
- [ ] Operator signs off audit closure and documents next build.

## Platform configuration snapshot, 2026-10-13
Cloudflare Pages project `devilndove-site`, Git integration `RosevearCreations/devilndove-site`, Production branch `main`, automatic deployments disabled, `DB` bound to production D1, private CAIP R2 and product media R2 bound. Do not change these bindings as part of Build 396.

Next proposed after verified Build 396 Production GREEN: Build 397 — Etsy Connection Observability & Price Review Outcomes (provisional).
