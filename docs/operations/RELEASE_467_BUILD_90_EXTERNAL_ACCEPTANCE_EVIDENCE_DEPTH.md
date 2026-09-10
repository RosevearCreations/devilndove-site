# Release 467 Build 90 — External Acceptance Evidence Depth & Cross-Lane Guidance

## Purpose

Build 90 deepens the current External Acceptance Control Center after Build 89 proved environment isolation. It does not create a new provider engine, does not execute an external proof automatically, and does not convert configuration into acceptance. Its purpose is to make all five external lanes equally understandable: each lane exposes structured checks, passed/required counts, evidence timing where available, and one explicit next action.

## Proven Build 89 predecessor

Development Build 89 is externally proven at exact SHA `68ac415302bceddb81e6faea15fbbebb3a76f24a`, tree `1a7cccf46b29718ea63d532c8c22322bcca98ffd`:
- System Gate `34425720516` — SUCCESS
- Current Application Quality `34425720539` — SUCCESS
- I.T. Admin Runtime Proof `34425720559` — SUCCESS
- Repository Branch Hygiene `34425720537` — SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence — SUCCESS.

Production Build 89 is GREEN at the same SHA/tree:
- Production Pages Deploy `34425875315` — SUCCESS
- Production Live Resource Integrity `34425949898` — SUCCESS.

Build 90 ingests that final Build 89 closure before changing current operator truth.

## Environment isolation retained

Build 89 remains the environment-safety authority:
- the current acceptance endpoint is bridge-first;
- Production is a read-only status projection;
- the retained Build 6 provider runner is invoked only on canonical Development;
- if that Development runner is unavailable, the current page degrades to read-only bridge evidence;
- no current status request directly calls Stripe, PayPal, Social providers or Cloudflare Access.

## Stripe Development

Stripe still requires six real acceptance dimensions:
1. test credentials/configuration;
2. Development checkout;
3. signed webhook evidence;
4. provider-synchronized refund;
5. reconciliation;
6. idempotent replay.

Build 90 does not weaken the guarded Development-only prepare/refund actions. Production execution remains closed.

## PayPal sandbox

PayPal still requires six real acceptance dimensions:
1. sandbox credentials/configuration;
2. approval/capture;
3. verified webhook evidence;
4. provider-synchronized refund;
5. reconciliation;
6. idempotent replay.

The same explicit human confirmation, sandbox/test credential and operator-switch boundaries remain in force.

## Social OAuth structured evidence

The current control center now exposes five structured requirements:
1. the intended Development provider is selected;
2. selected-provider readiness checks pass;
3. intended-account identity evidence is present;
4. controlled OAuth lifecycle evidence is present;
5. provider publication remains closed.

This is a read-only projection over existing OAuth/readiness authorities. Build 90 performs no provider publication, token exchange, refresh, revoke or automatic OAuth execution.

## CAIP private-media structured evidence

CAIP now exposes five required checks:
1. private-review schema authority is available;
2. an authenticated private review-proxy serve is recorded;
3. ranged streaming is evidenced;
4. no-copy handling is evidenced;
5. no-cache handling is evidenced.

Private object-key presence is shown as informational evidence but is not a separate acceptance blocker. The evidence timestamp is displayed when available. Build 90 does not invent an age threshold: the timestamp supports operator/current-release judgment and never silently turns historical evidence into current acceptance.

## Cloudflare Access structured external contract

Cloudflare Access remains `HOLD_EXTERNAL`. Build 90 exposes five checks:
1. retained Build 6 source harness exists — locally knowable;
2. exact reviewed Development SHA is supplied to the dispatch — external;
3. required GitHub Actions service-token secrets are available — external and values are never exposed;
4. the dispatch-only Access workflow succeeds — external;
5. the probe passes Cloudflare Access and reaches the intentional application `401 Unauthorized` response with no app session — external.

Application source cannot self-attest secret availability or a successful workflow run, and Build 90 performs no Access policy/service-token mutation.

## Evidence timing rule

Evidence timestamps are surfaced where the retained evidence source provides them. A timestamp is context, not automatic acceptance. Build 90 has no arbitrary freshness duration and does not infer freshness, staleness, external workflow success or provider acceptance from elapsed time alone.

## Safety boundary

- canonical D1 migrations remain exactly `0001`–`0004`;
- no canonical `0005` is introduced;
- no request-time schema mutation;
- no current-status D1/R2 mutation;
- no Production business-data overwrite;
- no automatic provider execution;
- no provider publication;
- no Production provider execution;
- no Cloudflare Access mutation;
- no secret/token values emitted.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private media remains `EVIDENCE_DEPENDENT` until appropriate current evidence is externally accepted.

## Closure protocol

Build 90 is a closure candidate and cannot self-claim later exact-head proof. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. The exact merged `dev` head must pass System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene, plus canonical Development D1/bindings proof and exact Preview smoke. Only that exact GREEN SHA/tree may be fast-forwarded non-force to `main`. Production must then pass the standard business-data-preserving Pages deployment chain and Production Live Resource Integrity. The next build must ingest Build 90's final external closure evidence.
