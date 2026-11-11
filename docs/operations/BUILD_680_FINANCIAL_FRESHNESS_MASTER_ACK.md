# Devil n Dove Build 680 — Evidence Freshness, Signed ACK, Owner Exceptions

## Source-only scope

Build 680 extends Build 679 without granting Master admission or fabricating profitability certification. The protected Admin social-finance GET supports a read-only `financial680` view scoped to a campaign ID, with evidence age, status, owner exceptions and explicit blockers. No public or service-to-service integration route is created.

## Freshness

For an attributed campaign, independently checked advertising and order-cost receipts are reviewed for a 30-day observation-age threshold. Future-dated records and incomplete scans are blocked. Missing or stale evidence forces HOLD; the owner exception list remains visible. Underlying source order settlement/refund checks continue through Build 679.

## Master ACK receipt

Only the owner-protected `master_ack_680` action can record a separately signed receipt. It requires `AI_DATA_MASTER_ACK_PUBLIC_KEY` and `DEVILNDOVE_SOURCE_REVISION` configured on the deployed source; absent configuration is HOLD. The detached Ed25519 signature must cover the exact insertion-ordered UTF-8 JSON:

```json
{"version":1,"campaign":"campaign-slug","fingerprint":"exact-source-679-fingerprint","source_revision":"exact-production-source-sha","master_revision":"exact-master-production-sha","nonce":"unique-16-or-more-char-nonce","ack_at":"2026-11-11T20:00:00.000Z"}
```

A five-minute freshness window, independent public-key verification, exact source fingerprint match and unique nonce reject stale or replayed ACKs. A stored signed receipt remains `SIGNED_RECEIPT_MATCH_ONLY`; this **does not** prove trusted runtime transport, connected status or Master acceptance. Those require an independent protected service integration.

## Owner profitability exception handling

An owner can open an exception for specific evidence, choose a stable reference and document its reason. Only the matching campaign/reference with an open exception can be resolved, requiring a written resolution. The status history is append-only in the existing social evidence table and never rewrites payments, tax or accounting. Owner resolution does not override missing evidence, source signoff or Master connection.

## Coordinating application

AI Data Platform issue: https://github.com/RosevearCreations/ai-data-platform/issues/850
Require independent source signer, exact revision, replay protection, signed ACK and durable Master receipt before changing connection state. Expose aggregated status and blockers only, not customer/order identities or raw signing material.

## Release prerequisites

The repo's exact-commit Current Application Quality, System Gate, I.T. Runtime and Branch Hygiene proofs must all pass before merging to main. Main Production deployment and live version/smoke acceptance are a separate GREEN condition.
