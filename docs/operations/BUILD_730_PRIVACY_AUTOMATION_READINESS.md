# Build 730 — Privacy operations automation readiness (Development)

## Implemented in the Development source
- Authenticated Admin-only `?review=730` exposure of bounded privacy alerts and withdrawal retry schedule *decisions* derived from the original 728 outbox and 729 signer configuration.
- Read-only 24h/7d overdue alerts, independent peer signature/proof hold alerts, key rotation backlog and existing retention review visibility.
- Bounded exponential advisory retry policy (5 minutes initial, 24 hours maximum, six-attempt maximum).
- Fail-closed states for malformed source times, missing original signed receiver proof, unreadable D1, missing keyring.
- Negative contract in `scripts/build730_privacy_alerts_retry_contract.mjs`, wired into Development quality workflow.

## NOT yet implemented — release must remain HOLD
1. Durable, atomic D1 claim/lease + attempt ledger and real dead-letter/requeue evidence.
2. Scoped authorized scheduled runtime and its secret identity/alerting on Cloudflare or the original Windows master host.
3. Automatic live retry using the original withdrawal envelope + real peer signature, replay protections and immutable D1 ACK.
4. Automated ciphertext version rotation from retained previous key with verified readback. Rotation scheduling is advisory; no Cloudflare secret rotation.
5. Operator workflow to recover a dead letter with distinct authorization and auditable result.
6. Production deployment and independent live integrity verification.

The current source explicitly publishes `scheduler: NOT_DEPLOYED`, `retry_attempt_ledger: NOT_DEPLOYED` and `automatic_external_delivery_enabled: false`. **Do not report Build 730 Production GREEN or that remote deletion occurred merely because advisory alerts exist.**

Source and delivery release gates from [Issue 948](https://github.com/RosevearCreations/devilndove-site/issues/948) remain mandatory. Follow Build 729 source consent controls and externally provisioned genuine original Master receivers. Do not simulate Production original signer/ACK or bypass Development-first D1 promotion.
