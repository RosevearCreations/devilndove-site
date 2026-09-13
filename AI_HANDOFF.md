# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 143 — Adaptive Mobile/Desktop/Web Application Shell** is the current Development closure candidate.

Build 142 is the last fully verified Development + Production checkpoint:

- SHA `0b022c355217c00a7313aa2cb3e4b37a2b9a2b45`
- tree `acf47b86db2cd170dc1fadd2a9e827e485e7c908`
- System Gate `34765428970`
- Current Application Quality `34765428976`
- I.T. Admin Runtime `34765428961`
- Repository Branch Hygiene `34765428957`
- Production Pages Deploy `34765518900`
- Production Live Resource Integrity `34765564112`

Build 143 formally ingests that exact six-proof Build 142 closure and continues the buyer/seller UX programme recorded in `PROJECT_STATUS_AND_ROADMAP.md`.

The bounded Build 143 slice is the adaptive application shell. A shared middleware-injected shell provides deliberate phone, tablet and desktop navigation for buyers and sellers rather than merely shrinking existing page headers. Buyer destinations are Shop, Search, device-local Saved, Cart and Account. Seller destinations are Home, Orders, Products, Create and More, using existing operational routes. Global online/offline state is announced accessibly, back/forward scroll recovery is retained, and offline Account navigation fails safely rather than forcing a broken login loop.

`/saved/` is deliberately local-only in Build 143. Saved products are browser-device preferences, not inventory reservations; saved prices are last-saved context rather than current commercial authority; account synchronization remains a later Buyer Account scope. Live stock, price, checkout, payments, account authority and seller mutations remain server-authoritative.

The Release 450 installable-client identity remains intact: service-worker cache identity is `devilndove-shell-r450`, the PWA platform still declares Release 450, and `/api/`, admin/auth-sensitive paths remain outside cache authority. The safe public adaptive shell and Saved page may be precached.

Build 137–142 closure evidence remains intact: Markdown/JSON export, stable evidence ID, deterministic SHA-256 fingerprint, verification-manifest export, browser digest verification and closure-JSON-versus-manifest consistency verification.

Canonical D1 migrations remain exactly `0001`–`0004`. Production live-resource retry behavior remains bounded to three transient attempts; permanent 4xx and genuine Product API/R2/photo/merchandising/D1 correctness failures remain blocking. No schema, D1 business-data, R2, binding, payment/provider, accounting, inventory, creative, price or Production business-data mutation is authorized.

Build 143 must not self-record its later exact-head closure. Build 144 must ingest it.
