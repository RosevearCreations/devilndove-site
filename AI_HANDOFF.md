# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 142 — Storefront Continuity & Offline Foundation** is the current Development closure candidate.

Build 141 is the last fully verified Development + Production checkpoint:

- SHA `72e270e4c27bd666afcb4d5befc3462dd757a1d1`
- tree `d4a6bfe0327d8de641d3ea1910dcd8c6bc67e14b`
- System Gate `34763039974`
- Current Application Quality `34763039975`
- I.T. Admin Runtime `34763040049`
- Repository Branch Hygiene `34763039996`
- Production Pages Deploy `34763165246`
- Production Live Resource Integrity `34763209880`

Build 142 formally ingests that exact six-proof Build 141 closure and begins the buyer/seller UX programme recorded in `PROJECT_STATUS_AND_ROADMAP.md`.

The first bounded slice is Storefront continuity. Previously loaded public Shop data may remain available as a local browsing fallback when the live Product API is unreachable, but cached price and stock are explicitly last verified, cached Add to Cart is disabled, and live Product authority must be revalidated before purchasing. The service worker precaches the public Shop shell while preserving `/api/` as a no-cache, server-authoritative boundary. Offline and reconnect states are visible and provide a retry/revalidation path.

Build 137–141 closure evidence remains intact: Markdown/JSON export, stable evidence ID, deterministic SHA-256 fingerprint, verification-manifest export, browser digest verification and closure-JSON-versus-manifest consistency verification.

Canonical D1 migrations remain exactly `0001`–`0004`. Production live-resource retry behavior remains bounded to three transient attempts; permanent 4xx and genuine Product API/R2/photo/merchandising/D1 correctness failures remain blocking. No schema, D1 business-data, R2, binding, payment/provider, accounting, inventory, creative, price or Production business-data mutation is authorized.

Build 142 must not self-record its later exact-head closure. Build 143 must ingest it.
