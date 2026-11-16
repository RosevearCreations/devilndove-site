# Devil n Dove Build 726 — Versioned Event V2, Durable Unique Dedupe / ACK Review / Dead Letter, and Inventory Fit-to-Screen

## Original sources and scope
Protected Build 725 Production GREEN: `dev=b1b2f9d8200c680e4d2cabea8351a40d1ffba03f`, `main=f32baa02464829b5a9e4e58f12362d253280fffc`; identical Git tree `ab6027e9163428435ad8ef4204e57ea7e67b9a6b`. Cloudflare Production Pages [#43794632423](https://github.com/RosevearCreations/devilndove-site/actions/runs/43794632423) and separate same-SHA Live Resource Integrity [#43794726579](https://github.com/RosevearCreations/devilndove-site/actions/runs/43794726579) succeeded.

This is **one application-only** release. AI Data Platform controller Build 408 publishes protocol **1.1**, backward-compatible with **1.0**; Build 726 preserves those boundaries and does NOT trigger updates to AI Data Platform, YW or iCamp while their Vercel quotas are constrained. The same applies to other Masters and Rosie Dazzlers. GitHub source handoff is NOT a signed network delivery or cross-app runtime CONNECTED state. Schema `rosevear.dnd.event.v2` is a **locally held original DND source event** design, not a new automatically enabled external transport. Legacy `/api/integration/v1/health` and `/api/integration/v1/capabilities` are untouched; protocol 1.0 peers still work through their existing independently verified original auth.

## Inventory Operations layout — owner screenshot correction
The owner screenshot from `/admin/inventory-operations/` at a desktop width shows the **Wide Table** with columns and Save row running beyond the viewport. The problem is horizontal clipping; increasing the table width would worsen it.

**Default: Fit to screen** (new persisted `dd_inventory_display_mode_v726` preference). The existing nine editable table cells are laid out as **one full-width record** with an accessible responsive CSS grid:
- Identity/photo/name/tool-or-supply; category, role and specific workstation memberships; supplier/Amazon link; current location.
- On hand, stock/usage units, units per stock, per-usage calculated cost, cost per stock unit, reorder/no-reorder threshold, active status.
- Per-record **Save row** always visible plus Full edit, Lots, Receive, Record use, Delete, Amazon fill. There is no horizontal scroll in Fit mode. On narrow screens fields stack into one column, preserving keyboard access and existing data attributes.
- Buttons allow **Fit to screen**, **Card View** and **Wide Table**. Existing card preference is retained on initial migration; subsequent choice persists as v726.
- **Quick stock + HST** on every item opens the established Release 467 Build 387 `DDInventoryQuickEdit` dialog. This is preferable for intentional inventory count, unit-conversion and CAD cost/HST correction: it writes an existing unique correction receipt + stock movement and does not pretend an invoice or automatic tax credit is verified. The everyday Save row continues to use the existing authenticated original item PATCH, without auto-saving as the user types.

No quantity, cost, inventory, location, or media record is silently changed when the new view loads. The original many-to-many specific station checkbox script remains enabled. Existing legacy Wide Table stays available for large monitors.

Implementation: `css/inventory-card-view-v359.css` (version `?v=726`), `public/js/admin-site-item-inventory.js` (version `?v=726`), `admin/inventory-operations/index.html`. No new runtime CSS/JS file.

## New canonical D1 migration 0051 — real durable unique admission within Devil n Dove
`migrations/canonical/0051_release467_event_outbox_dedupe_ack_deadletter.sql` adds:
- `dnd_event_outbox_726`: UUID primary key and **D1 UNIQUE SHA256 deduplication**, exact schema `rosevear.dnd.event.v2` and protocol `1.1`, only nonpersonal `DND_HEALTH_EVIDENCE` or `DND_SECURITY_EVIDENCE`, source `devilndove`, one of three Masters as target, source SHA, hashed tenant and consent scopes, and **empty-body SHA256 only** (no personal customer/media fields). Append-only triggers prevent UPDATE/DELETE. This is a held source review, not transport.
- `dnd_event_dispositions_726`: **one terminal disposition per event** enforced by a trigger plus UNIQUE(event_id,decision) / foreign key; `LOCAL_DEAD_LETTER` needs an explicit original Admin note, or `SIGNED_ACK_REVIEW` needs verified Ed25519 signed peer metadata. Append-only; ack-after-deadletter and deadletter-after-ack reject atomically. The D1 receipt's `source_origin_outside_verified` is forced to **0**: even a valid cryptographic signature from a configured public key does NOT independently prove external peer ownership or a network ACK.
- Migration 0051 requires the canonical **Development-first migration apply/proof**, then production snapshot and guarded Production D1 apply/proof before dependent code via existing System Gate/Cloudflare workflows. No direct Dev-to-Production data overwrite or customer/stock ledger reset.

The old Build 724 `admin_action_audit` nonce review still **lacks independently proven database unique replay protection**; only new Build726 source-event dedupe and terminal dispositions use the new D1 unique constraints. Do not conflate them with durable service-to-service replay admission.

## Owner review endpoint and operator Inbox hook
Existing authenticated Admin `/api/admin/production-variable-audit-406` extends with:
- `GET ?review=726`: no-store, bounded 15-item original local D1 event readback and truthful code-only state. The on-demand **Build 726** I.T. Integrations panel shows event ID/family/target, HELD/LOCAL_DEAD_LETTER/SIGNED_ACK_REVIEW, and **remote delivery NOT VERIFIED**.
- `POST action=queue_source_event_726`: manual Admin source-only, exact seven input fields, request key 16–80 chars, owner review checkbox, fixed event family, valid Master audience, DND original source revision 40 hex, SHA-256 hashed tenant and consent scopes; generates local UUID, atomic unique D1 dedupe hash, readback; duplicate returns HOLD, no retry blind write.
- `POST action=local_dead_letter_726`: manual Admin event ID, explicit original 24–400 char reason and confirmation; one immutable D1 local disposition, no remote retry.
- `POST action=review_signed_peer_ack_726`: requires original Admin, exact event and currently configured independent Ed25519 peer public key, source identity / peer Git SHA, audience, 32-hex nonce, signed ACK claim freshness and current event dedupe fingerprint; records a **SIGNED_ACK_REVIEW** local immutable receipt only. Never says an actual peer received, persisted or acknowledged the message. No private keys accepted or emitted; unverified source pins fail closed. No T4/T5 authority or transport activation.

**No remote network POST, no scheduled sender, no external retry worker, no actual Comms Hub inbox writes, no direct child-to-child database writes, no cross-tenant payload.** A future real Master sender/receiver must establish original trust enrollment, signed event envelope, durable unique replay at receiver, consent revocation checks, owner gates, genuine ACK and incident recovery independently.

Optional read-only public verification pins if genuinely enrolled by original external source owner in the **DND Cloudflare** environment (not GitHub secrets): `DND726_ACK_SOURCE_APP`, `DND726_ACK_PEER_MAIN_SHA`, `DND726_ACK_PUBLIC_KEY`, `DND726_ACK_ORIGINAL_ENROLLMENT_RECEIPT`, `DND726_ACK_REVOKED`. Their mere presence does not independently certify peer identity; do not generate or copy tokens, keys, signed ACKs or source receipts for acceptance.

## Safety and compatibility
- Seven ordered applications: AI Data Platform → Rosevear AI Hub → Rosevear Comms Hub → iCamp → YW → Devil n Dove → Rosie Dazzlers.
- Three Masters retain unified theme requirements; iCamp and YW Slave Shell themes/labels remain untouched in this release.
- `topologyId=rosevear-master-shell-seven-apps.v1`, `authorityTransfer=false`; `CROSS_APP_CONNECTED=NOT_VERIFIED`, `RECEIVER=UNKNOWN/HOLD`, `EXTERNAL_DELIVERY_ACK=NOT_VERIFIED`.
- Any unavailable 1.0/1.1 peer blocks its dependent future event-delivery capability only, never ordinary local Inventory/Product operations.
- Operator Inbox hook shows only DND original local source data and is **not** a remote operator inbox feed.
- The owner-requested ≥10 percentage-point app improvement remains an evidence-gated goal; 77 proposed Build723 checks still need original approved denominators.

## Provenance repair and measured budget before feature acceptance
Canonical migration 0051 was added to the live `functions/api/admin/current-deployment-preflight.js` source inventory, whose current truth gate compares every manifest filename with the deployed preflight's expected native/proof migration list. The previous source-gate failed because this explicit map still stopped at 0050; the gate itself stays **unchanged and fail closed**. Only the forward schema list is extended.

The actual previous Build725 System Gate source measured **19,655,042 bytes**. An exact feature-versus-dev GitHub UTF-8 byte comparison of the eight changed runtime files measured a net **+24,253 bytes** (9,924 D1 event helper, 7,166 responsive Inventory CSS, 2,628 Admin API, 2,046 Admin UI JS, 1,292 Inventory JS, 1,142 Admin page, 57 preflight, -2 Inventory page), giving projected **19,679,295 bytes**. Prior cap **19,658,000** would fail by **21,295**. Narrow reviewed cap adjustment **+24,000** to **19,682,000** leaves projected **2,705 bytes** of headroom. The feature's *actual exact-SHA System Gate* must still independently PASS; this is a source-byte estimate, **not** a claim of completed CI. File count 1,855, individual JS 600,000, CSS/HTML, CSP, D1 migration authority and no peer transport remain strict.

## Acceptance and next build
- `python scripts/build726_event_ledger_sqlite_gate.py` checks migration 0051's true SQLite unique and FK constraints, mutually exclusive terminal ACK/DLQ, append-only protection, invalid event families / target peers / claimed independent outside source.
- `node scripts/build726_event_inbox_inventory_fit_contract.mjs` checks protocol 1.1/legacy 1.0, exact signed ACK metadata, wrong issuer/key/audience/SHA/expiry/nonce and unsupported payload, Admin no-store auth, **all nine original Inventory data cells**, default Fit mode, old Card/Wide modes, existing Quick HST receipt path and no live sender.
- Existing full Current Application Quality, System Gate, Branch Hygiene, I.T. Admin, D1 Fan-Out, Brand V3 and original performance ceilings must remain green. On feature HEAD, then exact `dev` Preview and migration proof, then protected `main` same-tree and guarded Production D1 migration, Cloudflare deployment/public smoke **plus separate independent same-SHA Live Resource Integrity proof**.
- Any source-size overage requires an exact measured, minimal documented change without bypassing the existing size cap, max runtime file count 1855, individual JS/CSS/HTML, CSP or owner/session tests.

**Next proposed Build 727:** Customer/Payment/Media DLP, Redaction, Encryption, Consent-Withdrawal Delivery Handoff & Retention Evidence. It may safely be developed in DND independently, with protected local-only acceptance and explicitly held live cross-app interactions.
