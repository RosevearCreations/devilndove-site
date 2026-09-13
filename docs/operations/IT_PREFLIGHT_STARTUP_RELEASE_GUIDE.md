# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 147 — Buyer Account, Saved Items & Order Hub** is fully Development + Production GREEN.

- SHA `3fadc908df56ba194e2cd2f9e5480f6bfbedb796`
- tree `aeee53fdd3e01aee6b01a75e83f92f57b859960f`
- System `34769839872`
- Quality `34769839865`
- I.T. `34769839876`
- Hygiene `34769839871`
- Production Pages `34769929784`
- Production Live Resources `34769969149`

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

## Build 148 restart

Build 148 — **Seller Daily Command Centre** — is authorized from the exact Build 147 checkpoint above. Reuse existing safe read authorities: Today Tasks, dashboard summary, I.T./Reliability and existing workspace routes. Do not reuse legacy request-time DDL from the older Command Center endpoint. The cockpit may cache last-known read-only dashboard context locally with a timestamp, but current order, inventory, financial and destructive actions remain live-authority only.

Build 148 must remain schema-free. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.
