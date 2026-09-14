# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 152 — Site-wide Image Quality Scoring & Media QA** is the current fully verified Development + Production baseline.

- Development SHA `1d01cbed98b78543b75dab808a30fb76c20d6060`
- Production main SHA `2f22e280426968a9ff229a0cee9ee62a69dc9d75`
- identical tree `9cf8b0ac918ce567c51536f05d4c89b6f6294765`
- System Gate `34860514075`
- Current Application Quality `34860514137`
- I.T. Admin Runtime `34860514304`
- Repository Branch Hygiene `34860514150`
- Production Pages Deploy `34860809983`
- Production Live Resource Integrity `34860922626`

Build 152 is sealed in `release467-build152-sitewide-image-quality-media-qa.json` and is the restart authority for the next build.

## Active candidate

Build 153 — **Layout Observer Performance Hotfix** — is the active schema-free candidate. It was opened after Firefox reported `Script terminated by timeout` at `layout-overflow-guard.js:58:26` on Production.

Root cause: the shared `MutationObserver` synchronously rescanned every added subtree. Large admin renders could therefore repeat overlapping `querySelectorAll` scans in one callback and exceed Firefox's long-script threshold. The observer also watched the same `childList` mutations created when the guard wrapped tables.

Build 153 batches relevant added roots to the next animation frame, ignores mutations with no table/container/admin-shell target, deduplicates descendant roots when an ancestor is already queued, and disconnects the observer while applying its own table wrappers. The Products route receives cache revision `467-b153-layout-observer` so the repaired guard cannot remain hidden behind the older `467-products-b98-readiness-triage` URL.

The hotfix changes no business data, headings, D1/R2 state, provider execution, payment/refund/accounting state or schema. Canonical D1 migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

Build 153 must pass exact-head candidate System/Quality/I.T./hotfix proof, then exact `dev` System/Quality/I.T./Hygiene plus D1/Preview/bindings/smoke, followed by non-force identical-tree promotion to `main`, Production Pages Deploy and Production Live Resource Integrity before it may be called Production GREEN.
