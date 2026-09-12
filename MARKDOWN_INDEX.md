# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 107

Build 107 — **Storefront Discovery & Collection Improvements** is the current Development closure candidate.

Last fully verified Development is Build 106:
- `dev` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- System `34655258282` SUCCESS
- Quality `34655258284` SUCCESS
- I.T. `34655258283` SUCCESS
- Hygiene `34655258294` SUCCESS.

Current Production is Build 106:
- `main` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- Production Pages Deploy `34655379475` SUCCESS
- Production Live Resource Integrity `34655438506` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build107-storefront-discovery-collections.json`
3. `release467-build106-marketplace-listing-readiness.json`
4. `docs/operations/RELEASE_467_BUILD_107_STOREFRONT_DISCOVERY_COLLECTIONS.md`
5. `PROJECT_STATUS_AND_ROADMAP.md` — includes the autonomous Build 107–113 layout.
6. `AI_HANDOFF.md`
7. `SANITY_HEALTH_CHECK.md`
8. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
9. `migrations/canonical/manifest.json`

## Build 107 authority contract

Build 107 consumes exact Build 106 Development and Production closure and adds crawlable Shop/Collections discovery paths for Under $25, One-of-a-kind, Local pickup, Custom gifts, Vintage finds, Laser engraved, Workshop experiments and Proof-rich Products. Evidence-backed `discover=` paths reuse the already-loaded Product payload and fail closed when public Product evidence is insufficient. It adds no Product network/database read, performs no Product/Inventory mutation, creates no duplicate catalog and cannot publish to a provider or marketplace.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
