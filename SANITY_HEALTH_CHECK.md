# Devil n Dove Sanity and Health Check — Build 222

## Current architecture health
- Supported fresh schema: `database_full_schema.sql`.
- Store aggregate: `database_store_schema.sql`, repaired in Build 222 so it can validate independently while remaining compatible with the main users table.
- Core-plus-history aggregate: `database_schema.sql`, repaired with required commerce parents; production upgrades still use numbered migrations.
- Current additive migration: `database_build222_soap_label_startup_readiness.sql` or identical `database_upgrade_current_pass.sql`.
- Canonical handoff: `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `STARTUP_GO_LIVE_GUIDE.md`.

## Build 222 health result
- Soap-label source data is normalized into relational rows for product, ingredients, claims, exports and print tests.
- Packaging current-draft compatibility fields remain synchronized rather than becoming another independent data authority.
- The approved ribbon reference is reproduced by deterministic SVG structure, not flattened into a non-editable image.
- Label approval requires a saved version and physical proof.
- New admin routes remain private/noindex and have one H1.
- Public SEO metadata and local references remain complete in static validation.
- CSS and JavaScript syntax checks pass.

## Launch health
The application is structurally mature but unrestricted opening remains dependent on the 20 gates in `STARTUP_GO_LIVE_GUIDE.md`. The highest-risk unresolved areas are payment/webhook idempotency, exact-once inventory restoration, final-unit concurrency, transactional email, tax/shipping verification, physical label/regulatory review, restore rehearsal and full fulfilment proof.
