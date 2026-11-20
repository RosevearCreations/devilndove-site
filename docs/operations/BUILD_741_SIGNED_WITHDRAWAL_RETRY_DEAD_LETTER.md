# Devil n Dove Build 741 — Signed Withdrawal Retry & Dead-Letter Operations

## Exact source and authorization
Starting protected Build 740 Production main SHA: 9176e95dde6ebb60eba8b35eb27873f28cfeeb39. This Build 741 hardens the original Admin/Worker signed withdrawal source and adds a bounded private operator readback. It does not turn on privacy sending, authenticate a new Master, change customer consent, remotely erase content, send an email, or rotate keys. The original Production Worker remains deliberately OFF.

## Verified implementation
1. Original 730 two-Admin dead-letter requeue now refuses a current **Admin or Worker signed ACK** before creating a review or requeue approval and in the underlying conditional retry-state update.
2. Canonical forward-only D1 migration 0058 adds before-insert and before-update triggers on the existing original recovery/lease tables. A requeue approval is rejected if the source is not in the exact DEAD_LETTER/6-attempt state and withdrawn consent, or if either signed ACK exists. This protects a race between the initial Admin read and a competing ACK in the same original D1 transaction. An existing signed ACK cannot be silently ignored by a stale approval.
3. Protected, source-only GET /api/admin/privacy-retry-audit-741 returns per-Master original D1 aggregates: queued, manual signed ACK, Worker signed ACK, conflicting double ACK, DEAD_LETTER, expired LEASED, READY due, missing retry ledger, nonwithdrawn consent, local two-Admin SLA closure. It returns up to 25 event UUIDs (never customer identity or scope hash), last original attempt outcome, exact cycle and requeue eligibility **as source-only advisory data**.
4. Existing I.T. privacy section now includes a manual readback panel. There is no automatic polling, POST, sender, remote probe, or new privileged control. Original Build 730 two-distinct-Admin review stays the only requeue process; Build 733 signed ACK + SLA reviews remain separate.
5. New ephemeral canonical SQLite gate scripts/build741_signed_withdrawal_sqlite_gate.py verifies that Admin and Worker ACKs independently block an approval, no phantom approval appears after denial, nonwithdrawn consent holds, and valid two-Admin recovery follows original state rules. The JS script imports the actual protected handlers and proves no network, no D1 mutation from readback, no PII, and worker ACK requeue HOLD.

## Evidence limits
- A local D1 signed ACK is not proof of remote erasure, customer satisfaction, original receiver ownership, or independently certified three-Master telemetry.
- DND730_AUTOMATION_ENABLED=false and DND740_OWNER_ACTIVATION_CONFIRMED=false remain mandatory in source/deployed Worker. No consent withdrawal message is dispatched by this release.
- Existing original signer/receiver enrollment and external one-time signed challenge remain HOLD without independent real-world acceptance; supplier marketing, online sales and payment settlement unchanged.
- New schema is additive only; do not rewrite 0054–0057 or existing retry/ACK history. If 0058 fails, keep system disabled, preserve original rows, and use an independently reviewed forward-only migration.

## Release proof ladder
1. Merge exact protected source branch into dev only after System/Quality security gates succeed. Source test must fail on duplicate ACK, consent change, mixed role, stale lease and write-without-approval.
2. On dev, exact Development original schema 0058 ordered apply/proof, preserve users/products/orders, confirm original two triggers, full System Gate/Quality/I.T./Branch Hygiene, and canonical Preview deployment.
3. Protected dev → main exact-tree promotion only once all source and original Development D1 are accepted.
4. Production Pages must independently snapshot/apply 0058 forward-only, verify original D1 and exact main tree. Follow with independent live-resource readback and disabled Worker/cron proof. Production GREEN refers only to released code/data safety, not to live receiver or customer privacy delivery.

## Completion and successor
Full-company score is still approximately 41% because this is a narrow governance and retry safety build. The privacy withdrawal/dead-letter subfeature should improve once real D1 trigger and operator acceptance are confirmed; do not allocate automatic +5–10 points to all 53 business categories. Next proposed Build 742 — Dovlin Collection Landing & Approved Eight-Plush Catalog. Fourteen future proposals (742–755), with additional overall business work not capped by this queue.

References:
https://github.com/RosevearCreations/devilndove-site/issues/978
https://github.com/RosevearCreations/devilndove-site/blob/main/docs/operations/BUILD_740_OWNER_GATED_PRIVACY_SENDER_CEREMONY.md
