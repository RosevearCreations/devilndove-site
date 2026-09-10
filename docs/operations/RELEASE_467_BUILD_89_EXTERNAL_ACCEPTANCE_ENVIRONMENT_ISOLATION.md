# Release 467 Build 89 — External Acceptance Environment Isolation & Guided Recovery

## Purpose

Build 89 fixes an environment-boundary defect in the current External Acceptance Control Center. Build 88 correctly kept provider execution Development-only, but its current status wrapper always invoked the retained Development-only provider runner. On Production that runner correctly fails closed, which could make the otherwise read-only current acceptance dashboard unavailable.

Build 89 separates **status truth** from **provider action capability**. The current control center remains useful on both environments while provider execution stays strictly Development-only.

## Verified starting point

Build 88 — External Acceptance Control Center Convergence is the exact verified Development and Production baseline:

- SHA `9c6d56b887b2aa4bb710e5980608b8942830034c`
- tree `9f7d279ed5c83795682ba763ca150f1fe91a6019`
- System Gate `34423493650` — SUCCESS
- Current Application Quality `34423493830` — SUCCESS
- I.T. Admin Runtime Proof `34423493747` — SUCCESS
- Repository Branch Hygiene `34423493617` — SUCCESS
- Production Pages Deploy `34423649786` — SUCCESS
- Production Live Resource Integrity `34423737422` — SUCCESS.

Build 89 ingests this final Build 88 closure before changing current runtime truth.

## Bridge-first acceptance truth

`/api/admin/current-external-acceptance-control-center` is the current GET-only status projection.

Build 89 always reads the retained Release 467 commercial acceptance bridge first. That bridge is the sanitized evidence authority for Stripe Development, PayPal sandbox, Social OAuth and CAIP private-media acceptance. Cloudflare Access remains a separate external lane.

The historical Build 6 provider runner remains a Development-only action/evidence-enrichment engine. It is not required for Production read-only status rendering.

## Environment isolation

### Production

On Production:

- the current acceptance endpoint does **not** invoke the Development-only provider runner;
- provider action availability is `false`;
- Stripe/PayPal evidence is derived from the read-only commercial bridge;
- no provider request is made;
- no provider action button is enabled;
- the dashboard remains useful for status, evidence gaps and corrective routing.

Production provider execution remains forbidden.

### Development

On canonical Development:

- the current acceptance endpoint may invoke the retained provider runner;
- runner output enriches payment evidence and guarded action availability;
- Stripe/PayPal actions are available only if the historical runner independently confirms its Development/test/sandbox execution boundary;
- all provider-calling actions still require explicit human confirmation.

If the Development provider runner is unavailable or fails closed, Build 89 degrades the current page to read-only bridge evidence rather than failing the whole control center.

## Stripe Development evidence

Stripe still requires six real acceptance dimensions:

1. `credentials`
2. `checkout`
3. `webhook-signature`
4. `refund`
5. `reconciliation`
6. `idempotent-replay`

The refund dimension remains provider-synchronized Development evidence. Build 89 does not relax or pre-satisfy any dimension.

## PayPal sandbox evidence

PayPal still requires six real acceptance dimensions:

1. `credentials`
2. `approval-capture`
3. `webhook-verification`
4. `refund`
5. `reconciliation`
6. `idempotent-replay`

The refund dimension remains provider-synchronized sandbox evidence. Build 89 does not relax or pre-satisfy any dimension.

## Guided recovery

Each payment lane now exposes the next missing evidence step. Guidance may route the operator to configuration, a deliberate Development checkout/approval, verified webhook evidence, provider-synchronized refund, reconciliation, or duplicate webhook replay.

Guidance is advisory. Build 89 never automatically runs a provider action, retries a provider request, mutates credentials, changes Cloudflare Access, publishes content or promotes Production.

## Other external lanes

- Social OAuth selected-provider acceptance remains `HOLD_EXTERNAL`; intended-account and controlled lifecycle evidence remain required and publication stays closed.
- CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`; fresh authenticated private review/range-streaming evidence remains required.
- Cloudflare Access service-token acceptance remains `HOLD_EXTERNAL` and remains a separate dispatch-only proof.

## Historical authority preservation

Historical Build 6/7 source remains preserved:

- Build 6 provider runner remains the guarded Development-only Stripe/PayPal action owner.
- Build 7 commercial bridge remains the current sanitized evidence bridge wrapper over retained readiness evidence.

Build 89 changes the current orchestration boundary, not historical evidence provenance.

## Safety and schema boundary

- canonical D1 migrations remain exactly `0001`–`0004`;
- no new canonical migration;
- no request-time schema mutation;
- current status endpoint D1 mutation: **NONE**;
- current status endpoint R2 mutation: **NONE**;
- binding mutation: **NONE**;
- automatic provider execution: **NONE**;
- Production provider execution: **NONE**;
- provider publication: **NONE**;
- Production business-data overwrite: **NONE**;
- secret values emitted: **NONE**.

## Closure policy

Build 89 may be promoted only from the exact fully-GREEN `dev` tree after System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke succeed.

Production must then independently pass business-data preservation, canonical D1/FK/binding proof, exact Pages deployment/public smoke and Production Live Resource Integrity. A successful Build 89 deployment still does not itself close Stripe, PayPal, Social OAuth, CAIP private-media or Cloudflare Access acceptance; those remain evidence-driven external lanes.
