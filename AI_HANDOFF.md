# AI Handoff — Release 448 Platform Expansion

Updated: 2026-08-28

Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. `development-release.json` is the machine-readable current-release authority. Historical Build numbers are provenance only.

## Current boundary

- Current release: **448 — Platform Expansion**
- Source: `dev`
- Development Pages: `devilndove-site-dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development R2: `devilndove-toolshed-images-dev`, `devilndove-caip-media-dev`
- Modules: Storefront, Creators, Socials, Financials, I.T.
- Clients: Web, Phone, Desktop through one responsive/installable PWA authority
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

Always resolve the exact current `dev` SHA and exact System Gate/Cloudflare Pages status from GitHub before calling a checkpoint green.

## D1 baseline and Release 448 migrations

Release 447 baseline is already applied/verified. Permanent startup rule: **read-only D1/R2 verification first; do not reapply the 447 baseline because a chat or release starts.**

Release 448 now has four additive Development migrations:

1. `database_release448_product_lineage.sql`
   - verification: `RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql`
   - runner: `python scripts/apply_development_product_lineage.py`
2. `database_release448_media_it.sql`
   - verification: `RELEASE448_MEDIA_IT_VERIFICATION.sql`
   - runner: `python scripts/apply_development_release448_media_it.py`
3. `database_release448_storefront_merchandising.sql`
   - verification: `RELEASE448_STOREFRONT_MERCHANDISING_VERIFICATION.sql`
   - runner: `python scripts/apply_development_release448_storefront_merchandising.py`
4. `database_release448_caip_content_handoff.sql`
   - verification: `RELEASE448_CAIP_CONTENT_HANDOFF_VERIFICATION.sql`
   - runner: `python scripts/apply_development_release448_caip_content_handoff.py`

All four are source/local/transport gated. None may be called remotely applied until `.github/workflows/development-d1-release448.yml` passes against exact `devilndove-dev` and final read-only verification passes.

The guarded workflow cannot pass its credential guard because GitHub Actions currently has no `CLOUDFLARE_API_TOKEN` secret. Earlier guarded execution proved the workflow stops before D1 read/write. Never put the token in chat/source; it belongs only in secure GitHub Actions secret storage.

Fresh-install composition is gated by `python scripts/release448_fresh_install_gate.py` in this order:

1. `database_full_schema.sql`
2. `database_platform_convergence.sql`
3. Product lineage
4. Media / Movie / I.T.
5. Storefront merchandising
6. CAIP reviewed Content Studio handoff

The gate verifies five canonical modules, 10 canonical role-module rows, explicit-user-only I.T. authority, all current Release 448 tables and clean foreign keys. A truly empty database has zero users and therefore zero explicit I.T. managers; if an active admin exists, the Release 447 convergence bootstrap must establish explicit I.T. manage authority. Do not manufacture an admin merely to make a fresh-install count equal one.

## Storefront — Shop / Collections / Collages / Carousels

These remain Storefront capabilities, not separate application modules.

- `/shop/` — direct Product discovery/buying authority
- `/collections/` — curated or rule-based Product grouping
- `/collages/` — visual discovery over approved public Product images
- Home/Movie presentation — shared `public/js/media-carousel.js`
- admin merchandising: `/admin/storefront-merchandising/`
- public projection: `/api/storefront-merchandising`

D1 stores only merchandising metadata/references:
- `storefront_collections`
- `storefront_collection_products`
- `storefront_collage_presets`

Products, Inventory and image binaries stay in their existing authorities. Public merchandising consumes the consent-gated `/api/products` projection before grouping safe Products. Public pages retain exactly one H1.

## Product lineage / Inventory / Tools / manufacturers

Do not create a second Inventory ledger. Existing stock/movement authorities remain canonical:
- `site_item_inventory`
- `site_inventory_movements`
- Product resource intent through `product_resource_links`
- current production/lot authorities for actual consumption/provenance

Release 448 adds policy/review/provenance over those authorities:
- `/admin/product-lineage/`
- `/admin/vendor-reviews/`
- new handmade Product: `made_in_house / pending / required`
- historical handmade Product: `legacy_pending / legacy_nonblocking`
- antiquity/resale/external finished goods: explicit exempt state
- durable Tools/molds are use/provenance links, not consumption
- supplier/store and manufacturer remain distinct
- first-party equipment/material reviews may carry safe marketplace/source references without scraping or runtime marketplace dependency

Product provenance chain:
`Product → product_resource_links → site_item_inventory → inventory_manufacturer_links → inventory_manufacturers`

## Product Photography Manager

Workspace: `/admin/product-image-quality/`

D1 authority: `product_image_quality_assessments` stores score/review/evidence only; image ownership remains existing Product/R2/media authority.

100-point deterministic rubric:
- Lighting 20
- Clarity 20
- Background 15
- Framing 15
- Resolution 10
- Colour 10
- Artifacts 5
- Product-set consistency 5

Operational layer includes catalog queue, set readiness, perceptual dHash duplicate/near-duplicate evidence, best-current-hero recommendation, gallery candidates and explicit reshoot/improvement reasons. No automatic deletion, featured-image mutation, Product hiding or publication blocking. Optional vision-assisted review is advisory for subjective issues such as reflections/styling/background suitability.

## Movies / shared carousel

Shared presentation authority: `public/js/media-carousel.js` + `css/media-carousel.css`. Home is a data adapter. Movie front/back covers reuse the same renderer; missing evidence stays visibly pending. No carousel injects a second H1.

Current Movie data authority is enriched JSON + `movie_catalog` D1 overlay. `movie_metadata_reviews` uses stable UPC/slug review keys and explicit pending/incomplete/unverified/verified states. Never guess Movie metadata.

## CAIP / Creators → Content Studio

CAIP outward runtime identity is now Release 448. Historical Build 439 remains provenance for the temporal-evidence design/migration; Content Studio historical Build 355 remains implementation provenance only.

Current surfaces:
- CAIP workspace: `/admin/creative-assets/`
- reviewed evidence handoff: `/admin/caip-content-handoff/`
- handoff API: `/api/admin/caip-content-handoff`
- Content Studio: `/admin/content-studio/`

Release 448 handoff authority:
- `caip_content_handoffs`
- `caip_content_handoff_evidence`

Eligibility is fail-closed: a temporal marker must be active + approved, its linked story evidence must be approved and not rejected, and the CAIP project must already be linked to a Content Studio project. The package stores references/counts only. It does **not** copy private media, execute providers, or publish content. Prepare/refresh and reviewed states remain explicit and auditable.

Secure CAIP review now emits Release 448 outward headers/contracts while retaining `provenance_build: 439` in evidence/audit metadata. Source originals remain immutable/private and ranged streaming remains authenticated.

## I.T. integration registry

Workspace: `/admin/it-integrations/`; API: `/api/admin/it-integrations`; D1: `it_integration_registry`.

I.T. owns provider purpose, consuming module, secret/binding reference name only, callback/webhook, scopes, environment, configured state, separately tested/accepted state, last safe error and correction mechanics. Actual secrets are forbidden.

## Canonical gates

```bash
python scripts/repository_forward_sanity.py
python scripts/module_architecture_gate.py
python scripts/database_platform_gate.py
python scripts/release448_fresh_install_gate.py
python scripts/product_lineage_gate.py
python scripts/apply_development_product_lineage.py --transport-preflight
python scripts/release448_media_it_source_gate.py
python scripts/apply_development_release448_media_it.py --transport-preflight
python scripts/release448_storefront_merchandising_gate.py
python scripts/apply_development_release448_storefront_merchandising.py --transport-preflight
python scripts/release448_caip_content_handoff_gate.py
python scripts/apply_development_release448_caip_content_handoff.py --transport-preflight
python scripts/product_inventory_tools_source_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

`.github/workflows/system-gate.yml` performs no remote D1/R2/provider/Production writes. `.github/workflows/development-d1-release448.yml` is the separate exact-Development mutation workflow and remains credential-guarded.

## Deferred/non-blocking I.T. acceptance

Carry forward truthfully without blocking unrelated feature development:
- authenticated Development runtime acceptance
- Stripe test
- PayPal sandbox
- CAIP private-media delivery/range/evidence acceptance

Production promotion remains closed until required operational evidence is deliberately reviewed.

## Next Release 448 direction

Continue in this order unless a stronger dependency emerges:
1. Inventory operations intelligence over existing stock/movement authority
2. Supplies sourcing/provenance depth
3. Tools lifecycle/provenance depth
4. real Storefront/Photography calibration
5. CAIP runtime/presentation calibration
6. Financials depth

## Invariants

- One current release: 448.
- Production untouched unless explicitly authorized.
- D1 is operational write authority; current feature code does not own request-time schema creation.
- No duplicate stock ledger, Product catalog or Product image catalog.
- Collections/Collages are references/presentation over Product authority.
- CAIP handoff is references/evidence, not private-media duplication.
- Photography scores are work/evidence authority, not automatic publication authority.
- No fabricated historical consumption/manufacturer/Movie metadata.
- One meaningful H1 per public page.
- Shared presentation components remain shared.
- I.T. owns provider configuration metadata; consuming modules own workflows.
- Secrets live only in proper secret stores.
- Exact source gate + exact Development Pages deployment + applicable authenticated evidence define completion.
