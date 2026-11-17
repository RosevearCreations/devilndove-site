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
- The new protected `POST /api/admin/privacy-retry-730` route records an original `review_dead_letter_730` review, and requires a distinct Administrator for `approve_dead_letter_730`; original consent must remain withdrawn, there must be no signed ACK, the event must be genuinely dead-lettered, and the D1 retry cycle must transition/read back. It never sends or claims an ACK.


## Cloudflare Scheduled Worker — code ready, operational enablement HOLD
- `workers/privacy-automation-730.mjs` provides a Cloudflare native scheduled handler (no public HTTP endpoint). The isolated `wrangler.privacy730.toml` declares a 15-minute Production cron, but `DND730_AUTOMATION_ENABLED=false` by default.
- The Worker uses the original consent outbox and immutable per-event lease/attempt cycles. It sends only metadata-only signed withdrawal envelopes to an actual independently enrolled Master whose current pinned-key proof is no older than seven days. Only an original fresh Ed25519 response verified against the exact event can produce a service-owned `dnd_withdrawal_auto_acks_730` immutable receipt. It cannot impersonate an Administrator, delete original customer/media/payment data, purge a vault or automatically replace an encryption key.
- `dnd_privacy_schedule_receipts_730` stores run/held/signed counts and current-version key-rotation backlog. A fresh tick proves a scheduled worker reached original D1, **not** that the external Master deleted content or an external platform recalled media.
- `.github/workflows/build730-privacy-worker-production.yml` runs only after same-main-SHA Production Pages Deploy SUCCESS, proves Production D1 0054, deploys the disabled Worker and independently reads back the script and 15-minute cron. This workflow has not yet been observed succeeding on Build 730 main.
- **Activation prerequisite**: original Cloudflare Worker-specific secure configuration for all needed `DND728_PEER_<MASTER>_URL`, `_HMAC_KEY_B64URL`, `_PUBLIC_KEY_B64URL`, `_ENROLLMENT_RECEIPT`, plus non-secret unique `DND730_SERVICE_ID` and `DND728_ACTIVE_KEY_ID`; original Masters must be independently verified and actively return signed ACKs. Cloudflare Pages configuration does not automatically populate a separate Worker. Only a separate operator-approved Production change may set `DND730_AUTOMATION_ENABLED=true`.
- Existing signed Build 728 Admin delivery remains independently available, and now respects verified service-owned signed ACKs to avoid known redundant sends.

## Remaining Production activation gates — release must remain HOLD
1. Cloudflare Worker deployment and verified scheduled tick on original Production D1 after exact-main-SHA release; the Worker remains intentionally disabled until independently approved secrets and real Master enrollments exist.
2. Genuine original Master signed receiver ACK(s), not fabricated source samples; the Worker cannot prove remote erasure, consent deletion or outside publication recall.
3. Ciphertext version rewrap is still owner-supervised through Build 728; Build 730 schedules and alerts for the rotation backlog, never silently rewrites existing evidence or retires old keys.
4. Independently verify two-Admin recovery route and source evidence in real Development D1.
5. Development D1 0054 has a genuine successful workflow run #43993592160; Production D1 0054, exact-head CI, Cloudflare Pages/Worker deployment and live resource integrity remain unverified.

The current source does not automatically claim an operational scheduler merely because Worker source and config exist. Original D1 heartbeat is shown separately, and `DND730_AUTOMATION_ENABLED` remains false by default. **Do not report Build 730 Production GREEN or that remote deletion occurred merely because advisory alerts exist.**

Source and delivery release gates from [Issue 948](https://github.com/RosevearCreations/devilndove-site/issues/948) remain mandatory. Follow Build 729 source consent controls and externally provisioned genuine original Master receivers. Do not simulate Production original signer/ACK or bypass Development-first D1 promotion.
