# Devil n Dove Build 679 — Verified Cost Allocation and Master Handoff

Build 679 is **fail-closed financial source evidence**. It does not establish independent audited accounting or automatically publish to the Master Shell.

## Source model and calculation

The checkout source contains `total_cents`, `tax_cents`, a first-party bound campaign/order record and payment settlement evidence. For every attributed paid CAD order, Build 679 requires independently signed cost evidence in four categories: `product_cogs`, `shipping_fulfilment`, `payment_processing`, and `overhead_allocated`. Even a zero-cost category needs a genuine signed evidence record.

Net contribution = **settled order total less sales tax less independently attested advertising spend less independently attested order costs**. Captured shipping charges are part of receipt total while actual shipping outlay is a cost allocation. This is not an audited Canadian tax determination. Actual shipping, labour, manufacturing, and indirect allocations must be independently reviewed.

A refund, settlement drift, duplicate order, unverified advertising expense or missing cost category forces HOLD. Signoff records the approved source basis, but **does not** claim independently certified business profitability.

## External verifier protocol

Set `PRODUCT_COST_VERIFIER_PUBLIC_KEY` to base64-encoded raw Ed25519 public key in the deployed Cloudflare environment. The external private key must stay with a separate verifier, not in GitHub, the browser or Developer tools.

Verifier inspects the original source documentation, confirms a CAD amount (possibly zero), a specific attributed `order_id`, source campaign and one of the four allocation axes, and calculates the original source SHA-256. Sign the UTF-8 encoding of insertion-ordered canonical JSON:

```json
{"version":1,"order_id":123,"campaign":"campaign-slug","axis":"product_cogs","reference":"vendor:invoice:123","issuer":"actual verifier/source","amount_cents":4500,"currency":"CAD","source_sha256":"64 lowercase hexadecimal characters","observed_at":"2026-11-11T19:00:00.000Z"}
```

The `verifier_signature` is a detached Ed25519 base64 signature. The server requires matching signed fields, an enrolled key, a recent observation and original paid order binding, then records it in source-only financial evidence. A duplicate reference is blocked.

## AI Data Platform Master handoff

The authenticated operator GET for `/api/admin/social-post-queue?campaign_queue_id=ID` provides a read-only `financial679` evidence projection with source states, blocker codes and aggregate CAD cents. **This endpoint is not a service-to-service grant.** Do not use an owner's session in Master connectors. Master must implement independent tenant-scoped source authorization, source-signer custody, replay prevention, freshness, source-revision binding and durable ACK. Until verified, `master_handoff=HOLD_INDEPENDENT_MASTER_SIGNER_ENROLLMENT`.

Direct Master instructions: https://github.com/RosevearCreations/ai-data-platform/issues/850
