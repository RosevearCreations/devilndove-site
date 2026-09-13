# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 148 — Seller Daily Command Centre** is fully Development + Production GREEN.

- SHA `5a51981e7831bbef4f44c19f43a36b811e0a2e79`
- tree `f4e0a88f1f7c6837176a939a19e5d4ae36596434`
- System `34772251480`
- Quality `34772251467`
- I.T. `34772251459`
- Hygiene `34772251477`
- Production Pages `34772367891`
- Production Live Resources `34772410714`

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

## Build 149 restart

Build 149 — **Seller Listing Manager & Fast Product Editing** — is authorized from the exact Build 148 checkpoint above. It uses the existing Product/admin APIs and adds safe seller-facing list/card/search, local quick edits, draft clone and storefront preview. Local draft state must visibly progress through waiting/syncing/synced/conflict and stop on `base_updated_at` mismatch. Active/publish, inventory, delete/archive and other high-authority changes must not auto-replay offline.

Build 149 remains schema-free. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.
