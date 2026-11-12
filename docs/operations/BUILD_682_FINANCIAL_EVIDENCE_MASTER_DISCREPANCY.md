# Devil n Dove Build 682 — Financial Evidence Export & Master Discrepancy Review

## Boundaries
The protected Admin Social Queue GET accepts `?export=financial682&campaign_queue_id=ID`. It requires an authenticated active Admin session and returns a **source-owned, sanitized JSON attachment**, with `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, and no customer/order identities, raw source fingerprint, verifier signatures, credentials, or original documents. This is not an independent accounting audit or Master connection. Incomplete audit scans return HOLD rather than an authoritative export.

The `financial682` read model includes campaign, CAD aggregate amounts *only when source reconciliation passes*, evidence counts, exact configured source revision where available, SHA-256 of the source fingerprint, bounded owner history and receipt lifecycle, and explicit discrepancy case codes. An absent source revision stays null; it is never guessed.

## Discrepancy cases
The server derives source financial evidence, owner signoff, stale verifier evidence, open owner exceptions, incomplete audit, current signed Master receipt, and independent Master admission discrepancies from live source records. The **Master independent admission case always stays HOLD** because a signed ACK recorded by the source is not independently verified service transport or Master-side acceptance. Owner review does not close the Master case.

An Admin may explicitly `acknowledge` or `escalate` an existing case through `owner_discrepancy_review_682` using the current SHA-256 source fingerprint, a 15–400-character audit note and explicit review confirmation. It adds a new existing-table `social_post_attempts` record under `finance_discrepancy_682` and reads it back before reporting success. Historical reviews of an old source fingerprint are shown as stale and are not reused to accept new evidence. Case resolution requires the independent missing evidence and a later read-model reconciliation, not a manual status override.

The export is owner-only source data. AI Data Platform must obtain independent authentication, tenant-scoped source revision proof, signer custody, replay-proof transport, and a Master-side durable receipt before any `CONNECTED`, audited financial certification, or owner acceptance claim.

## Release requirements
This build adds no database migration and changes no orders, refunds, taxes, vendor provider postings, or accounting entries. The source footprint must remain inside the fixed Release 465 performance budget. Required Dev workflows must be GREEN for the exact source tree and include the canonical Preview deployment; Production needs its own main Cloudflare, smoke, live version and resource integrity evidence.

Master coordination: https://github.com/RosevearCreations/ai-data-platform/issues/850
