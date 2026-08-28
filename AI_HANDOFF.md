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

Always resolve the exact current `dev` SHA and exact System Gate/Pages status from GitHub. Never copy an old SHA forward.

## D1 baseline and current Release 448 migrations

Release 447 baseline is already applied/verified. Permanent startup rule: **read-only D1/R2 verification first; do not reapply the 447 baseline because a new chat starts.**

Release 448 has two additive Development migrations:

1. `database_release448_product_lineage.sql`
   - verification: `RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql`
   - runner: `python scripts/apply_development_product_lineage.py`
2. `database_release448_media_it.sql`
   - verification: `RELEASE448_MEDIA_IT_VERIFICATION.sql`
   - runner: `python scripts/apply_development_release448_media_it.py`

Both are implemented, locally gated and transport-preflighted. **Neither may be called remotely applied yet.** Guarded GitHub workflow run `33198354338` stopped before any D1 read/write because GitHub Actions has no `CLOUDFLARE_API_TOKEN` secret. No migration statement executed. The only safe next D1 action is to provide that credential through GitHub secret storage (never chat/source), then rerun `.github/workflows/development-d1-release448.yml` and require read-only post-verification.

## Product lineage / tools / manufacturers

Do not create a second inventory ledger. Existing stock/movement authorities remain canonical. Release 448 adds review/policy/provenance over them:

- `/admin/product-lineage/`
- `/admin/vendor-reviews/`
- new handmade Product: `made_in_house / pending / required`
- historical handmade Product: `legacy_pending / legacy_nonblocking`
- antiquity/resale/external finished goods: explicit exempt state
- Supplies/materials may consume Inventory through existing movement authorities
- Tools/molds are durable provenance/use links and are never consumed by the lineage link itself
- manufacturer is normalized on the Tool/Supply Inventory item; supplier/store is not assumed to be manufacturer
- Devil n Dove-authored reviews can store safe marketplace/manufacturer references such as ASIN/source URL without scraping or making Amazon/VEVOR a runtime dependency

Product provenance chain:

`Product → product_resource_links → site_item_inventory → inventory_manufacturer_links → inventory_manufacturers`

## Product image quality — Release 448

Workspace: **`/admin/product-image-quality/`**

API: **`/api/admin/product-image-quality`**

D1 authority: `product_image_quality_assessments` stores score/evidence only. Images remain in their existing Product/R2/media authority.

Transparent 100-point deterministic rubric:

- Lighting/exposure/clipping — 20
- Clarity/sharpness heuristic — 20
- Background border/uniformity — 15
- Framing/approximate occupancy and centering — 15
- Resolution — 10
- Colour/white-balance spread — 10
- Compression/artifact heuristic — 5
- Product-set aspect-ratio consistency — 5

Browser Canvas measurement is the reproducible baseline. Optional vision-assisted scoring may later evaluate subjective issues such as reflections, styling, premium hero suitability and background appropriateness. Vision is evidence/advice, not an unexplained automatic publication authority. Originals are never modified by scoring. Initial use is to prioritize reshoots/improvement, not automatically hide Products.

Potential operational constraint: cross-origin Product/R2 images must be readable by Canvas (same-origin delivery or suitable CORS) or deterministic pixel scoring will report that it cannot score the image rather than fabricate a result.

## Shared carousel / Movies

Shared presentation authority: **`public/js/media-carousel.js`** plus `css/media-carousel.css`.

- Home `public/js/home-carousel.js` is now only a Storefront data adapter to the shared carousel.
- Movie covers use `public/js/movie-media-carousel.js`, loaded through the media-content runtime.
- Movie records with both front/back covers get the shared accessible carousel.
- Movie records with a missing side retain the truthful two-slot pending fallback.
- Shared behavior covers keyboard arrows, indicators, previous/next, pause/reduced-motion handling, mobile controls and image-error fallback.
- No carousel may create another public H1.

Current Movie data authority is **enriched JSON base + `movie_catalog` D1 overlay**, not legacy `movies(id)` planning material. Release 448 migration now owns the `movie_catalog` schema so request handlers should not be the schema authority going forward.

`movie_metadata_reviews` keys evidence by stable UPC/slug (with optional `movie_catalog_id`) and supports `pending`, `incomplete`, `unverified`, `verified`. Repair only demonstrably incorrect Movie metadata; never guess unknown values.

## I.T. integration registry

Workspace: **`/admin/it-integrations/`**

API: **`/api/admin/it-integrations`**

D1 authority: `it_integration_registry`.

I.T. owns:
- provider/platform key and purpose
- consuming canonical module
- Cloudflare secret/binding **reference name only**
- callback/webhook URL
- scopes
- environment
- configured state
- tested/accepted state separately
- last safe error
- correction mechanics/evidence reference

Actual API keys, OAuth secrets, access/refresh tokens, webhook signing secrets, passwords and private keys are forbidden in D1/UI/source/logs/evidence. The API rejects obvious secret-like values.

## Canonical gates

Run:

```bash
python scripts/repository_forward_sanity.py
python scripts/module_architecture_gate.py
python scripts/database_platform_gate.py
python scripts/product_lineage_gate.py
python scripts/apply_development_product_lineage.py --transport-preflight
python scripts/release448_media_it_source_gate.py
python scripts/apply_development_release448_media_it.py --transport-preflight
python scripts/product_inventory_tools_source_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

`.github/workflows/system-gate.yml` performs no remote D1/R2/provider/Production writes. `.github/workflows/development-d1-release448.yml` is the separate exact-Development mutation workflow and currently cannot pass its credential guard until the GitHub secret exists.

## Deferred/non-blocking I.T. acceptance

Carry forward without pretending complete:
- authenticated Development runtime acceptance
- Stripe test
- PayPal sandbox
- CAIP private-media evidence

These do not block normal Release 448 feature development, but they remain required before a deliberate Production promotion decision.

## Invariants

- One current release: 448.
- Production untouched unless explicitly authorized.
- D1 is operational write authority; request-time schema creation should be retired as migrations converge.
- No duplicate stock ledger.
- No fabricated historical consumption/manufacturer/Movie metadata.
- One meaningful H1 per public page.
- Home/Movie reuse one carousel presentation authority.
- I.T. owns provider configuration metadata; consuming modules own workflows.
- Secrets live only in proper secret stores.
- Exact source gate + exact Development Pages deployment + applicable authenticated evidence define completion.
