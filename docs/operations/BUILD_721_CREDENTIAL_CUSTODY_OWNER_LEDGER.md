# Devil n Dove Build 721 — Provider Credential Lifecycle Evidence, Independent Custody Renewal Handoffs & Source-Verified Owner Approval Ledger

## Original baseline and authority
Build 720 `main=e2403769b0513f0be86e302f095f029567ff7dbb` was Production software GREEN: Production Pages Deploy `43659311051` SUCCESS and independent Live Resource Integrity `43659397954` SUCCESS on that exact SHA. Owner approval does not follow automatically from software GREEN.

Build 721 builds on the existing Build 720 presence-only provider audit and original Build 718 cryptographically validated Build 716 independent ninth + Build 717 distinct outside Ed25519 custody receipts. It never fabricates issuer credential renewal, signs on behalf of an external reviewer, uploads private keys, silently enables receivers, posts to social providers or closes financial books.

## Credential lifecycle evidence / source freshness
`GET /api/admin/production-variable-audit-406?review=721&campaign_queue_id=<original campaign>` is verified-Admin, read-only, no-store. It returns:
- credential-source **name-presence only** for Etsy, Meta, Pinterest, YouTube, TikTok, X, Stripe, PayPal and Square; no API tokens, excerpts, hashes or inferred expiration times;
- `NOT_VERIFIED` issuer rotation receipt and `UNKNOWN_NO_ISSUER_RECORD` credential age until a genuine provider-issued rotation/expiration document has been independently inspected;
- manual next action only for active providers, with absent optional providers not treated as incidents; the four GitHub CI secrets previously reported do not need duplicate creation;
- no auto-rotation, credential change, provider API call, external contact or credential authorization.

To establish true issuer freshness: open the **original** provider owner dashboard, locate the credential's rotation/issuance/expiry audit and obtain the provider-issued event ID/date, verify provider/account/environment identity, confirm the credential is not revoked, and enter no secret values into GitHub issue or chat. The Build 721 UI leaves this as `NOT_VERIFIED` until a separate trusted receipt-verification workflow is built and authenticated. An owner's note cannot mark the provider credential current.

## Independent custody renewal handoff and actual source-pinned Admin ledger
A recorded Admin owner **review of original evidence** is possible only after:
1. An authenticated original campaign is identified; Build 718 rereads source-linked D1 original 716 independent ninth signer and 717 distinct outside Ed25519 signer, along with original 710/711/712 and fresh Master source.
2. No invalid, unresolved, missing or duplicate original receipts, no Master open cases, and zero unverified receipt lineage.
3. Every original ninth and outside signature has valid source age **under 72 hours** at current read time. Historical valid signatures older than that are retained as history, but an owner must request fresh independent source and no new review is recorded.
4. Original current Master source revision and fingerprint match the explicitly owner-reviewed values, and original renewal receipt, ninth-signed receipt and outside-signed receipt IDs match. A second source readback immediately before write prevents stale known-source approval.
5. An active verified Admin explicitly selects a specific original renewal, checks the consent statement and supplies a 25–400 character note. This is an Admin-account review, not separate legal owner-identity attestation.
6. A single append-only `social_post_attempts` receipt is committed via `WHERE NOT EXISTS` keyed to exact original campaign/renewal; the server independently reads the original source and D1 receipt after write. No new D1 table or migration.

This records `SOURCE_BOUND_ADMIN_OWNER_REVIEW_RECORDED_BOOKS_HOLD_721` and an original receipt ID only after success. It is deliberately **not** an independent human signature, final approval of financial statements, outside SLA closure, payment settlement, media/phone witness, or financial book close. The read view marks an existing receipt `verified_current=false` if source changed or aged out. Failed/duplicate/stale writes remain HOLD.

## Operator steps
1. Visit `https://devilndove.com/admin/it-integrations/` (authenticated Admin).
2. In Build 721, enter the exact original campaign queue ID. Click **Check credential lifecycle and original signed receipts**.
3. Read each provider lifecycle as `NOT_VERIFIED` unless independent issuer evidence is obtained **outside** this UI.
4. If exact original independently signed finance receipts are current, select a displayed original renewal. Verify it in `https://devilndove.com/admin/social-publishing/` Build 718.
5. Only after personal review, supply the note, check explicit consent, and click **Record source-bound Admin review (books HOLD)**. A server-issued verified D1 receipt number confirms only the review. If HOLD, renew missing outside signer evidence through authorized separately controlled source handoff.
6. Recheck original camera media in `https://devilndove.com/admin/mobile-product/` for D1 and live R2 HEAD/owner 702 freshness; this owner ledger does not claim media physically witnessed or fixed.

## Seven-app owner-ordered sanitized connectivity handoff
Top-tier controller `ai-data-platform` Build 404 source `main=d1b8dae579f127dde0f5f99bf388cfa5afd5ce06`; canonical `rosevear-master-shell-seven-apps.v1`; `authorityTransfer=false`. The controller is a source of GitHub governance metadata only, not a blanket runtime connection. Current main branch snapshot obtained from GitHub on 2026-11-15 02:00 UTC approximately (not proof of the underlying service health):

1. `ai-data-platform` — `d1b8dae579f127dde0f5f99bf388cfa5afd5ce06` — top-tier validation Master.
2. `rosevear-ai-hub` — `befe3d1cfde917e6d89dde4c713ffb3d3ff9a705` — independent Windows-host Master; original physical OFF/receiver state is not witnessed here.
3. `rosevear-comms-hub` — `d5689723968116949979e878367a44ad6846ae73` — independent operator/communications Master.
4. `iCamp` — `840a511ee895bf2954f94d5b8f0f12fd9d5748d7` — external governed shell.
5. `yw` — `86ee251cc1a7623692132c3b7057ab1bde6f2701` — external governed shell.
6. `devilndove-site` — latest confirmed Production GREEN baseline `e2403769b0513f0be86e302f095f029567ff7dbb`, Build 720 (superseded upon independently verified Build 721 promotion).
7. `rosiedazzlers` — `2271c229b14b43647a22c1b4bd9100d8f999ce20` — internal company application, next hop.

Prior handoffs: `https://github.com/RosevearCreations/ai-data-platform/issues/935` and `https://github.com/RosevearCreations/yw/issues/801`; Devil n Dove incoming `https://github.com/RosevearCreations/devilndove-site/issues/921` and controller `https://github.com/RosevearCreations/devilndove-site/issues/920`. Forward the sanitized exact current Devil n Dove main SHA and Actions proofs to Rosie after Production GREEN. **CROSS_APP_CONNECTIVITY=NOT_VERIFIED** — no original independent signer ACK, three-Master end-to-end handshake, original physical receiver ON approval or tenant-level live integration was obtained here. Original-host witness/closure remain HOLD or UNKNOWN until independent real evidence. No credentials, local IP, private keys, raw signed documents or customer information are to be forwarded.

## Verification / queue
No new D1 migration, no R2/media writes, no direct provider calls or automatic credential rotation. Feature PR must pass exact-SHA checks; merge `dev` and run full source, quality, branch and Preview proofs; protected `dev` → `main` PR; then exact SHA Cloudflare Production Pages Deploy/public smoke and a separate Live Resource Integrity Proof successful on identical main SHA. Production GREEN means deployed code only.

Next **proposed** Build 722: Independently Issued Credential Rotation Receipt Verification, Post-Review Ledger Drift Reconciliation and Seven-App Linkage Exception Handoff Refresh. There is no finite preapproved end-of-queue count in the authoritative current repository; this proposal is one known successor, **not** evidence of a fixed total remaining number.
