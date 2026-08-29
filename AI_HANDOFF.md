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
- Clients: Web, Phone, Desktop from one responsive/installable PWA authority
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

Always resolve exact current `dev` SHA and exact System Gate/Cloudflare Pages status before calling a checkpoint green.

## D1 baseline and current Release 448 migrations

Release 447 platform convergence is already applied and verified. Permanent startup rule: **read-only D1/R2 verification first; never replay the Release 447 baseline because a new chat/release starts.**

Release 448 now has **five** additive Development migrations:

1. `database_release448_product_lineage.sql`
2. `database_release448_media_it.sql`
3. `database_release448_storefront_merchandising.sql`
4. `database_release448_caip_content_handoff.sql`
5. `database_release448_tool_lifecycle.sql`

Each has a read-only verification file and exact-Development runner. All five are source/local/transport gated. The guarded workflow `.github/workflows/development-d1-release448.yml` applies them in order and then performs final read-only verification.

Remote truth: GitHub Actions still lacks the secure `CLOUDFLARE_API_TOKEN` repository secret. The guarded workflow previously stopped at its credential guard before D1 read/write. Therefore **none of the five Release 448 migrations is remotely applied yet**. Never weaken the guard and never put the token in chat/source.

Fresh-install composition is gated in this order:

1. `database_full_schema.sql`
2. `database_platform_convergence.sql`
3. Product lineage
4. Media / Movie / I.T.
5. Storefront merchandising
6. CAIP reviewed Content Studio handoff
7. Tool lifecycle

A truly empty database has zero users and therefore zero explicit I.T. managers. Once an active admin exists, Release 447 convergence must bootstrap explicit I.T. manage authority. Do not manufacture user data to satisfy a fresh-install count.

## Storefront

Shop, Collections, Collages and Carousels remain Storefront capabilities.

- `/shop/` — direct Product discovery/buying
- `/collections/` — curated/rule-based Product grouping
- `/collages/` — visual discovery over approved public Product images
- `/admin/storefront-merchandising/` — merchandising curator
- shared carousel: `public/js/media-carousel.js`

D1 stores merchandising metadata/references only: `storefront_collections`, `storefront_collection_products`, `storefront_collage_presets`. Products, Inventory and image binaries remain in their existing authorities. Public merchandising consumes the consent-gated `/api/products` projection. One public H1 per page remains mandatory.

## Product lineage / manufacturer provenance

Never create another stock ledger. Canonical authorities remain:
- `site_item_inventory`
- `site_inventory_movements`
- `product_resource_links`
- current production/lot authorities

Release 448 overlays policy/provenance:
- `/admin/product-lineage/`
- `/admin/vendor-reviews/`
- new handmade Product: `made_in_house / pending / required`
- historical handmade Product: `legacy_pending / legacy_nonblocking`
- antiquity/resale/external finished goods may be explicitly exempt
- durable Tools/molds are provenance/use links, never consumption
- supplier/store and manufacturer are distinct

Manufacturer chain:
`Product → product_resource_links → site_item_inventory → inventory_manufacturer_links → inventory_manufacturers`

## Product Photography Manager

Workspace: `/admin/product-image-quality/`

`product_image_quality_assessments` stores score/review evidence only; image ownership stays in Product/R2/media authority.

100-point objective baseline:
- Lighting 20
- Clarity 20
- Background 15
- Framing 15
- Resolution 10
- Colour 10
- Artifacts 5
- Product-set consistency 5

Manager features include catalog queue, Product-set readiness, perceptual duplicate/near-duplicate evidence, strongest-current-hero recommendation, gallery candidates and explicit reshoot reasons. No automatic deletion, featured-image mutation, Product hiding or publication blocking. Vision-assisted review may later advise on subjective matters such as reflections, clutter, styling and hero suitability.

## CAIP / Creators → Content Studio

CAIP outward runtime identity is Release 448. Historical Build 439 remains provenance for temporal-evidence design; Content Studio Build 355 remains implementation provenance only.

Surfaces:
- `/admin/creative-assets/`
- `/admin/caip-content-handoff/`
- `/admin/content-studio/`

Release 448 handoff tables:
- `caip_content_handoffs`
- `caip_content_handoff_evidence`

Eligibility is fail-closed: marker active + approved, linked story evidence approved and not rejected, existing Content Studio linkage required. Handoff stores references/counts only—no private media copy, provider execution or publication. Secure CAIP review remains authenticated/private with range streaming and immutable originals.

## Inventory Intelligence

Workspace: `/admin/inventory-intelligence/`
API: `/api/admin/inventory-intelligence`

This is deliberately **read-only intelligence over existing Inventory**, not a ledger/schema replacement. It prioritizes:
- linked Supply stockouts
- low stock
- reorder flags
- do-not-reuse
- missing stable Inventory identity
- missing supplier
- missing manufacturer provenance
- missing consumption/usage profile
- unlinked Tools
- stocked Supplies with no Product link

Product impact counts come from existing `product_resource_links`. The endpoint explicitly reports `write_authority_duplicated: false`.

## Durable Tool Lifecycle

Workspace: `/admin/tool-lifecycle/`
API: `/api/admin/tool-lifecycle`
Migration: `database_release448_tool_lifecycle.sql`

Tables:
- `inventory_tool_lifecycle_profiles`
- `inventory_tool_lifecycle_events`

Profiles cover active/maintenance/out-of-service/retired/replaced state, condition, acquired/warranty/service dates, service interval, replacement priority/cost/reference and evidence.

Events cover inspection, maintenance, repair, calibration, damage, out-of-service, returned-to-service, retirement and replacement.

**Hard invariant:** Tool lifecycle never decrements Tool quantity and never writes stock movements. Product contribution is derived from existing `product_resource_links`.

## Movies / shared carousel

Movie authority remains enriched JSON + `movie_catalog` D1 overlay. `movie_metadata_reviews` uses stable UPC/slug keys and explicit pending/incomplete/unverified/verified states. Home and Movie cover pairs share the Release 448 carousel renderer. Unknown Movie metadata is never guessed.

## I.T. integration registry

Workspace: `/admin/it-integrations/`; D1: `it_integration_registry`.

Stores provider purpose, consuming module, secret/binding **reference name only**, callback/webhook, scopes, environment, configured/tested state, safe errors and correction mechanics. Actual secrets are forbidden.

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
python scripts/release448_inventory_intelligence_gate.py
python scripts/release448_tool_lifecycle_gate.py
python scripts/apply_development_release448_tool_lifecycle.py --transport-preflight
python scripts/product_inventory_tools_source_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

Canonical System Gate performs no remote D1/R2/provider/Production writes. The separate Release 448 D1 workflow owns exact-Development database mutation and remains credential-guarded.

## Deferred/non-blocking I.T. acceptance

Carry forward truthfully:
- authenticated Development runtime
- Stripe test
- PayPal sandbox
- CAIP private-media delivery/range/timecode/artifact evidence

These do not block unrelated Release 448 source development. Production remains closed until deliberate review.

## Next Release 448 direction

1. Supplies sourcing/provenance depth and real reorder/source intelligence
2. Inventory Intelligence calibration against real Development data after D1 activation
3. Tool lifecycle calibration and replacement planning
4. Storefront/Photography real-data calibration
5. CAIP runtime/presentation calibration
6. Financials depth

## Invariants

- One current release: 448.
- Production untouched unless explicitly authorized.
- D1 is operational write authority; current feature code does not own request-time schema creation.
- No duplicate Product, Inventory or Product-image catalog.
- Collections/Collages are references/presentation over Product authority.
- CAIP handoff is reference/evidence, not private-media duplication.
- Photography scores are advisory work/evidence, not automatic publication authority.
- Tool lifecycle is durable-asset state, not stock consumption.
- Never fabricate historical consumption, manufacturer identity or Movie metadata.
- One meaningful H1 per public page.
- Secrets live only in proper secret stores.
- Exact System Gate + exact Development Pages + applicable authenticated evidence define completion.
