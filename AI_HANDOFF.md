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

## D1 baseline and current Release 448 migrations

Release 447 baseline is already applied/verified. Permanent startup rule: **read-only D1/R2 verification first; do not reapply the 447 baseline because a chat or release starts.**

Release 448 now has three additive Development migrations:

1. `database_release448_product_lineage.sql`
   - verification: `RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql`
   - runner: `python scripts/apply_development_product_lineage.py`
2. `database_release448_media_it.sql`
   - verification: `RELEASE448_MEDIA_IT_VERIFICATION.sql`
   - runner: `python scripts/apply_development_release448_media_it.py`
3. `database_release448_storefront_merchandising.sql`
   - verification: `RELEASE448_STOREFRONT_MERCHANDISING_VERIFICATION.sql`
   - runner: `python scripts/apply_development_release448_storefront_merchandising.py`

All three are source/local/transport gated. None may be called remotely applied until `.github/workflows/development-d1-release448.yml` passes against exact `devilndove-dev` and the final read-only verification passes.

The guarded workflow remains unable to pass its first credential guard because GitHub Actions has no `CLOUDFLARE_API_TOKEN` secret. Earlier guarded execution proved that no migration read/write follows that missing-credential guard. Never put this token in chat/source; it belongs only in secure GitHub Actions secret storage.

Fresh-install composition is explicitly gated by:

`python scripts/release448_fresh_install_gate.py`

The authoritative composition order is:

1. `database_full_schema.sql` — aggregate historical/base schema
2. `database_platform_convergence.sql` — verified Release 447 five-module / role / explicit I.T.-manager convergence baseline
3. `database_release448_product_lineage.sql`
4. `database_release448_media_it.sql`
5. `database_release448_storefront_merchandising.sql`

The first version of this gate deliberately exposed that the old aggregate alone did not contain `app_role_module_access` and `app_user_module_managers`; those are correctly owned by the verified Release 447 convergence migration. The gate was corrected to compose the real current authority rather than weakening its expectations. It now requires the five canonical modules, 10 canonical role-module rows, one active explicit I.T. manager, all current Release 448 authorities and clean foreign keys.

## Storefront merchandising — Shop / Collections / Collages / Carousels

These remain **Storefront capabilities, not separate application modules**.

Public surfaces:
- `/shop/` — direct Product search/filter/buying authority
- `/collections/` — curated or rule-based Product grouping
- `/collages/` — visual discovery over approved public Product images
- Home/Movie carousel presentation — shared `public/js/media-carousel.js`

Admin merchandising workspace:
- `/admin/storefront-merchandising/`
- API: `/api/admin/storefront-merchandising`

Public projection:
- `/api/storefront-merchandising`

D1 metadata authorities:
- `storefront_collections`
- `storefront_collection_products`
- `storefront_collage_presets`

Critical boundary: **Collections and Collages never become another Product, Inventory or image catalog.** Product membership stores references only. The public merchandising endpoint consumes the already public-media/consent-gated `/api/products` projection before building collection/collage output, so it does not bypass private-media protection.

Collections can be:
- curated manually;
- driven by supported rules (`merchandise_origin`, `product_category`, `product_type`, `sale_channel`);
- supplemented by explicit include/exclude Product membership.

Current seeded origin paths:
- Handmade creations
- Vintage & antique finds (`vintage|antique`)
- Collectibles & oddities (`collectible|oddity`)
- Pre-built & found items

Collage presets choose a public Product source (all Products or one Collection), layout (`mosaic`, `feature_grid`, `story_strip`) and 3–12 items. They reference current public Product images; no image binary is copied. Public Collage rendering requires at least three safe images and otherwise preserves static fallback content.

All Shop/Collections/Collages pages use Release 448 assets and exactly one public H1. A dedicated source gate enforces this:

`python scripts/release448_storefront_merchandising_gate.py`

## Product lineage / tools / manufacturers

Do not create a second Inventory ledger. Existing stock/movement authorities remain canonical. Release 448 adds review/policy/provenance over them:

- `/admin/product-lineage/`
- `/admin/vendor-reviews/`
- new handmade Product: `made_in_house / pending / required`
- historical handmade Product: `legacy_pending / legacy_nonblocking`
- antiquity/resale/external finished goods: explicit exempt state
- durable Tools/molds are provenance/use links, not consumption
- supplier/store and manufacturer remain distinct
- Devil n Dove-authored review provenance may carry safe ASIN/source/review references without scraping or marketplace runtime dependency

Product provenance chain:

`Product → product_resource_links → site_item_inventory → inventory_manufacturer_links → inventory_manufacturers`

## Product Photography Manager

Workspace: `/admin/product-image-quality/`

API: `/api/admin/product-image-quality`

D1 authority: `product_image_quality_assessments` stores score/review/evidence only. Images remain in existing Product/R2/media authorities.

Transparent 100-point deterministic rubric:
- Lighting 20
- Clarity 20
- Background 15
- Framing 15
- Resolution 10
- Colour 10
- Artifacts 5
- Product-set consistency 5

Operational layer:
- catalog photography queue;
- Product-set readiness score;
- 64-bit perceptual dHash duplicate/near-duplicate evidence;
- strongest distinct image = best-current-hero recommendation;
- other distinct 70+ images = gallery candidates;
- explicit reshoot/improvement reasons;
- optional human approve/reject;
- no automatic image deletion, featured-media mutation, Product hiding or publication blocking.

Browser Canvas is the reproducible baseline. Optional vision-assisted review should later assess subjective issues such as reflections, styling, semantic background quality and premium hero suitability, but remains advisory evidence.

## Shared carousel / Movies

Shared presentation authority: `public/js/media-carousel.js` + `css/media-carousel.css`.

Home is a data adapter. Movie front/back cover pairs use the same renderer. Missing cover evidence stays visibly pending. Keyboard, reduced motion, controls, responsive behavior and fallback remain one implementation. No carousel may inject another H1.

Current Movie data authority is enriched JSON + `movie_catalog` D1 overlay. `movie_metadata_reviews` uses stable UPC/slug review keys and explicit pending/incomplete/unverified/verified states. Never guess Movie metadata.

## I.T. integration registry

Workspace: `/admin/it-integrations/`

API: `/api/admin/it-integrations`

D1: `it_integration_registry`.

I.T. owns provider purpose, consuming module, secret/binding **reference name only**, callback/webhook, scopes, environment, configured state, separately tested/accepted state, last safe error and correction mechanics. Actual secrets are forbidden in D1/UI/source/logs/evidence and obvious secret-like values are rejected by the API.

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
python scripts/product_inventory_tools_source_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

`.github/workflows/system-gate.yml` performs no remote D1/R2/provider/Production writes. `.github/workflows/development-d1-release448.yml` is the separate exact-Development mutation workflow and remains credential-guarded.

## Deferred/non-blocking I.T. acceptance

Carry forward without pretending complete:
- authenticated Development runtime acceptance
- Stripe test
- PayPal sandbox
- CAIP private-media evidence

They do not stop normal Release 448 feature development, but Production promotion remains closed until the required operational acceptance is deliberately reviewed.

## Invariants

- One current release: 448.
- Production untouched unless explicitly authorized.
- D1 is operational write authority; no request-time schema ownership for current features.
- No duplicate stock ledger, Product catalog or Product image catalog.
- Collections/Collages are references/presentation over Product authority.
- Photography scores are evidence/work-queue authority, not automatic publication authority.
- No fabricated historical consumption/manufacturer/Movie metadata.
- One meaningful H1 per public page.
- Shared presentation components remain shared.
- I.T. owns provider configuration metadata; consuming modules own workflows.
- Secrets live only in proper secret stores.
- Exact source gate + exact Development Pages deployment + applicable authenticated evidence define completion.
