# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 104 — Product Work Session Focus Views is the last fully verified checkpoint:
- `dev` `0a308b4fd0b6bd50c1dde4627bd61d1d76b84891`
- tree `399d16c99bb54c16247fb8c44d5a054286650e30`
- System Gate `34622757518` SUCCESS
- Current Application Quality `34622757414` SUCCESS
- I.T. Admin Runtime Proof `34622757394` SUCCESS
- Repository Branch Hygiene `34622757555` SUCCESS.

## Verified Production

Build 104 is the current Production checkpoint:
- `main` `0a308b4fd0b6bd50c1dde4627bd61d1d76b84891`
- tree `399d16c99bb54c16247fb8c44d5a054286650e30`
- Production Pages Deploy `34623045557` SUCCESS
- Production Live Resource Integrity `34623145483` SUCCESS.

## Build 105 operational boundary

Build 105 — **Product Work Session Completion & Handoff** is the active Development closure candidate. It adds a browser-local session summary, priority/readiness counts, blocker handoff, Copy handoff and Download handoff. It reuses the existing local Product work-session and already-rendered Product/readiness evidence. It adds no Product/readiness API/database read and performs no Product/Inventory mutation.

Build 104 focus views, Build 103 paging, Build 102 manual reorder, Build 101 priority/order modes, Build 100 work sessions, Build 99 work views/sort, Build 98 readiness triage and earlier Product protections remain active.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 105 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`. Build 106 must ingest Build 105's final external closure.

The runtime I.T., preflight and reliability pages cannot self-attest GitHub/Cloudflare workflow status. A local GREEN diagnostic never substitutes for exact external release proof.

## Environment boundaries

- Canonical Cloudflare Pages project: `devilndove-site`
- Development branch / Preview: `dev` / `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development Product R2: `devilndove-toolshed-images-dev`
- Development CAIP R2: `devilndove-caip-media-dev`
- Production branch / site: `main` / `https://devilndove.com`
- Production D1: `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`
- Production Product R2: `devilndove-toolshed-images`
- Production CAIP R2: `devilndove-caip-media`
- Canonical migrations: exactly `0001`–`0004` via `scripts/d1_migrate.py`.

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.
