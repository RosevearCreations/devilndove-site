# Build 678 — independent marketing expense verification

This is an **owner-supervised, fail-closed** protocol. It does not contact an advertising vendor by itself or establish a genuine invoice by accepting typed information. A separate verifier must inspect an original vendor document and sign the exact claim.

## Enrolment
Configure `MARKETING_EXPENSE_VERIFIER_PUBLIC_KEY` in Cloudflare as the **base64-encoded raw Ed25519 public key** belonging to a separately controlled verifier. Do not put a private signing key into the app, repository, browser, or GitHub secrets for this implementation. Without this configured key, expense verification is HOLD.

The independent verifier must inspect the original invoice/payment and calculate its SHA-256, confirm the vendor, amount/currency, campaign and receipt reference, and sign the UTF-8 bytes of this exact, insertion-ordered JSON object:

```json
{"v":1,"campaign":"campaign-slug","queue_id":123,"receipt_reference":"vendor-invoice-id","vendor":"vendor-name","amount_cents":2450,"currency":"CAD","original_document_sha256":"64-hex-digest","checked_at":"2026-11-11T19:00:00.000Z"}
```

Use Ed25519 detached-signature bytes encoded as base64; enter those and the matching verified fields in Build 678. The server checks the signature and 90-day evidence freshness. The original invoice remains in its independent protected archive. Owner-entered cost evidence alone never satisfies verification.

## Review and acceptance
1. Create the original campaign cost receipt in Build 676; its campaign, reference and amount must agree with the independent claim.
2. Record the external signed attestation using Build 678. A duplicate original reference or verification cannot be counted twice.
3. Reconcile the campaign. Every cost must be independently verified, and every attributed order must still be settled with no refund.
4. The owner must explicitly acknowledge the scope and sign off on **gross attributed receipts less verified ad spend**.

This is *not net business profitability or independently certified ROI*: product costs, taxes, shipping and overhead have not been verified in this workflow. Those axes stay HOLD. Real platform-ad account verification and an independently witnessed original invoice are external operational prerequisites, not simulated by the code.
