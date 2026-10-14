# Release 467 Build 394 — Etsy Connection Monitoring & Product Price Drift Safeguards

Status: PARTIAL DEVELOPMENT IMPLEMENTATION — NOT PRODUCTION GREEN.

## Objective
Provide an administrator-visible, read-only Etsy connection freshness check and Product price drift review. No automatic Etsy reconnect, listing publication, currency rewrite or Product mutation.

## Etsy status
- Read only the already-authorized Etsy connection state and verified shop identity from the existing integration status endpoint.
- Display verification state, last successful check time, failure timestamp, and sanitized operator guidance; never display access/refresh tokens, authorization codes, state or PKCE.
- Distinguish connected_verified, disconnected, expired, verification_unknown and provider_unavailable. Never infer connected status from the existence of credentials.
- Manual Refresh should be explicitly initiated, rate limited, and return a clear receipt (OK, failed, outcome unknown). No aggressive polling or silent retry.
- Failure guidance should direct a fresh Connect Etsy flow when authorization needs renewal.

## Product price drift safeguards
- Read-only bounded review queue of products with missing, zero or changed price evidence; do not assume CAD $0.00 is invalid.
- Compare against stored approved internal price-source evidence only. Require traceable operator approval before proposing a price correction.
- Display CAD amounts to two decimal places and compare canonical integer cents, never floating point approximate equality.
- Read-back after a human Product Editor save. Do not silently adjust product price, tax, inventory or Etsy listing prices.
- Confirm pending, failed, unknown and successful save outcomes explicitly; verify persisted state before any retry.
- Do not transmit prices, private supplier information or inventory to Etsy as part of monitoring.

## Gates
1. Build 393 user-confirmed Etsy/price acceptance is recorded; CI and production release remain independently required.
2. Add scoped regression covering disconnected, stale, verified, provider failure, $0.00 legitimate price, cent rounding, rejected/unknown save and no write-on-read.
3. Pass System Gate, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene and Build-specific proof on the exact Development commit.
4. Resolve the existing dev/main divergence before promotion; do not merge thousands of unrelated commits into production.
5. Verify identical approved code tree in production, Cloudflare Pages deployment success and Production Live Resource Integrity before marking GREEN.

## Delivery boundaries
Implemented on Development: passive stored-evidence Etsy connection health, shop verification age, and a bounded read-only zero-priced Product review queue that explicitly refuses to claim price drift without an approved baseline. Implemented: explicitly reviewed source identifiers and approved CAD cents are stored as immutable actor-bound `admin_action_audit` receipts, with read-only one-Product comparison, exact-cent validation, bounded manual source entry and no automatic Product or Etsy update. Each source is operator-attested, not independently verified against the external document. Pending: production operator acceptance and final release proofs. No automatic price correction or Etsy listing write. Do not mark Build 394 complete or Production GREEN until these are addressed.

Next proposed: Build 395 — Etsy Monitoring Operator Acceptance & Exception Resolution.
