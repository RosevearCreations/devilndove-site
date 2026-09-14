# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 150 — Orders, Fulfillment & Buyer Communication Workspace** is fully Development + Production GREEN.

- Development SHA `33d46f701adb839525561114a31abcd29943d28f`
- Production main SHA `531e303d32d426d2db6986ec5c3d466455612ee3`
- identical tree `2f7add90d513a2e9548865f04d97e69b0ae3630e`
- System `34802545653`
- Quality `34802545673`
- I.T. `34802545668`
- Hygiene `34802545660`
- Production Pages `34802707901`
- Production Live Resources `34802759988`

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and all six external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene, canonical D1/bindings and Preview acceptance.
4. Non-force promote the identical tree to `main` only after Development is GREEN.
5. Require Production Pages Deploy and Production Live Resource Integrity.
6. Only then call `main` / Production GREEN.

## Build 151 restart

Build 151 — **Gifting, Custom Work, Local Pickup & Event Selling** — is authorized from the exact Build 150 checkpoint above.

It reuses canonical gift-card/checkout authorities, the Operations Custom Requests read/mutation boundaries, existing local-pickup checkout support and public event/pickup pages. Gift intent may carry recipient, occasion, wrapping, requested-delivery and event/pickup context without creating a new payment or fulfillment backend.

The seller Custom Work command view is read-only. Existing reviewed quote/payment/order mutations remain in their established Custom Requests owner. Local pickup remains server-authoritative; browser totals are estimates until checkout revalidates price, stock, shipping and tax.

Event/offline mode must fail closed for inventory authority: cached state may help a seller remember context but cannot reserve/decrement stock, confirm a unique-item sale or present stale sellability as live. Reconciliation must happen through the live server-authoritative path.

Build 151 remains schema-free. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.