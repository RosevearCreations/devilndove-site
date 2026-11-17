# Build 730 — Privacy operations automation readiness (Development)

## Implemented in the Development source
- Authenticated Admin-only `?review=730` exposure of bounded privacy alerts and withdrawal retry schedule *decisions* derived from the original 728 outbox and 729 signer configuration.
- Read-only 24h/7d overdue alerts, independent peer signature/proof hold alerts, key rotation backlog and existing retention review visibility.
- Bounded exponential advisory retry policy (5 minutes initial, 24 hours maximum, six-attempt maximum).
- Fail-closed states for malformed source times, missing original signed receiver proof, unreadable D1, missing keyring.
- Negative contract in `scripts/build730_privacy_alerts_retry_contract.mjs`, wired into Development quality workflow.

## Durable schema added, not yet activated
- Canonical forward-only D1 migration `0054_release467_withdrawal_retry_custody.sql` adds retry state/leases, immutable attempt evidence, and two-person recovery decision records. It is registered in the canonical manifest but has **not** been applied to live Development or Production D1.
- `scripts/build730_retry_sqlite_gate.py` is wired into the Development quality workflow, but this does not establish that the remote CI has passed.
- The Admin readback distinguishes `D1_SCHEMA_PRESENT_NO_WORKER` from `NOT_DEPLOYED`. Schema presence alone never authorizes an automatic send.

## NOT yet implemented — release must remain HOLD
1. Safe authenticated scheduled runner, atomic runtime claim/settlement and real end-to-end signed delivery.
2. Approved live external peer receiver enrollment with verified signed ACK and failure escalation.
3. Encryption version rewrap automation with verified readback and previous-key preservation.
4. Admin two-person dead-letter recovery action enforcing original approval checks (schema alone is insufficient).
5. Real Development-first D1 migration application, exact-head CI, Production deployment and independent live integrity verification.

The current source explicitly publishes `scheduler: NOT_DEPLOYED`, `retry_attempt_ledger: NOT_DEPLOYED` and `automatic_external_delivery_enabled: false`. **Do not report Build 730 Production GREEN or that remote deletion occurred merely because advisory alerts exist.**

Source and delivery release gates from [Issue 948](https://github.com/RosevearCreations/devilndove-site/issues/948) remain mandatory. Follow Build 729 source consent controls and externally provisioned genuine original Master receivers. Do not simulate Production original signer/ACK or bypass Development-first D1 promotion.
