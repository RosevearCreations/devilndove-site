# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 149 — Seller Listing Manager & Fast Product Editing** is fully Development + Production GREEN.

- SHA `6ff380f581bce93a42aacb982ba4c686baa5c5c4`
- tree `c1829f6371b3d5b7cd771f9f170260f53d5a7e08`
- System `34776427862`
- Quality `34776427860`
- I.T. `34776427885`
- Hygiene `34776427874`
- Production Pages `34776524835`
- Production Live Resources `34776571549`

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and all six external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene, canonical D1/bindings and Preview acceptance.
4. Non-force promote the identical SHA/tree to `main` only after Development is GREEN.
5. Require Production Pages Deploy and Production Live Resource Integrity.
6. Only then call `main` / Production GREEN.

## Build 150 restart

Build 150 — **Orders, Fulfillment & Buyer Communication Workspace** — is authorized from the exact Build 149 checkpoint above.

It reuses the canonical Orders/order-detail APIs, Build 82 Operations-owned fulfilment transition contract and `order_status_history`. Product-aware order search, one seller workspace, packing-slip printing, pickup/shipping context, local packaging/internal notes and copy-only buyer communication drafts are added without a second Orders backend.

Live fulfilment changes require a stable `client_action_id`; uncertain response-loss retries reuse the same identifier. The retained Build 82 fulfilment page receives the same identifier through a compatibility bridge. Tracking is a live append-only audit handoff in `order_status_history`; it does not call a carrier, change financial status or send a buyer message. Provider/payment/refund/accounting/schema/R2 actions remain in their existing owners.

Build 150 remains schema-free. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.
