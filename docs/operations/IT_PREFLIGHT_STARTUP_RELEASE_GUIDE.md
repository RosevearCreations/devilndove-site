# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 151 — Gifting, Custom Work, Local Pickup & Event Selling** is fully Development + Production GREEN.

- Development SHA `86cc4c2500ccb7ed8027466be7226392098a989f`
- Production main SHA `bb0046c701a8050f9b92948fc60ad622dd1f462e`
- identical tree `7031e0bf710a9f2b4c4202e6858fda8c01008e01`
- System `34858535578`
- Quality `34858535413`
- I.T. `34858535651`
- Hygiene `34858535663`
- Production Pages `34858858586`
- Production Live Resources `34858997196`

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

## Build 152 restart

Build 152 — **Site-wide Image Quality Scoring & Media QA** — is authorized from the exact Build 151 checkpoint above.

It reuses the existing Release 448 deterministic browser Canvas product-image rubric for editable public/static website images. The score remains advisory and read-only: Lighting 20, Detail/Clarity 20, Background 15, Framing 15, Resolution 10, Colour 10, Artifacts 5 and Consistency 5.

Media & Content Studio and authenticated public page Edit mode may display scores and improvement guidance. Scoring is lazy/visible-first, SVG placeholders are identified but not graded, and CORS/load problems are surfaced as score unavailable rather than a false quality judgement.

Build 152 remains schema-free. Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`.

Production live-resource retries remain capped at three transient attempts; permanent 4xx responses and real Product API, R2, photography, merchandising and D1 failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.
