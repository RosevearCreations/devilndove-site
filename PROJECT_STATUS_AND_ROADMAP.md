# Project Status and Roadmap — Release 448 Platform Expansion

Updated: 2026-08-28

`development-release.json` is the machine-readable authority. `AI_HANDOFF.md` and this file are the current human-readable authorities. Historical Build numbers are provenance only.

## Current Development position

- Current release: **448 — Platform Expansion**
- Source: `dev`
- Development deployment: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Canonical modules: Storefront / Creators / Socials / Financials / I.T.
- Clients: Web / Phone / Desktop from one responsive/installable PWA
- Release 447 D1 baseline: **applied and verified**
- Production `main` / `devilndove-site`: **untouched / promotion closed**

Always resolve exact `dev` SHA, canonical System Gate and Cloudflare Pages status before calling a checkpoint green.

## Release 448 source convergence completed to date

### Storefront — Shop / Collections / Collages / Carousels

These remain one **Storefront** domain rather than separate application modules.

- `/shop/` remains direct Product search/filter/buying discovery.
- `/collections/` is now a merchandising layer over the same public Products.
- `/collages/` is a visual discovery layer over approved public Product photography.
- Home and Movie presentation reuse the shared accessible `public/js/media-carousel.js` authority.
- All current Shop/Collections/Collages pages carry Release 448 assets and exactly one H1.

New Storefront merchandising source authority:

- migration: `database_release448_storefront_merchandising.sql`
- verification: `RELEASE448_STOREFRONT_MERCHANDISING_VERIFICATION.sql`
- Development runner: `scripts/apply_development_release448_storefront_merchandising.py`
- source gate: `scripts/release448_storefront_merchandising_gate.py`
- admin workspace: `/admin/storefront-merchandising/`
- admin API: `/api/admin/storefront-merchandising`
- public projection: `/api/storefront-merchandising`
- shared public runtime: `public/js/storefront-merchandising.js`
- shared presentation: `css/storefront-merchandising.css`

The migration creates only Storefront merchandising metadata/reference tables:

- `storefront_collections`
- `storefront_collection_products`
- `storefront_collage_presets`

**No Product row, Inventory quantity or Product image binary is duplicated.** The public Storefront merchandising endpoint first consumes the existing `/api/products` projection, which already applies public-media annotation/consent rules, and only then groups safe Products into Collections/Collages.

Collections support:
- curated membership;
- supported rules by merchandise origin, Product category, Product type or sale channel;
- explicit include/exclude Product exceptions;
- ordering and public/SEO copy.

Seeded origin Collections:
- Handmade creations;
- Vintage & antique finds (`vintage|antique`);
- Collectibles & oddities (`collectible|oddity`);
- Pre-built & found items.

Collage presets support `mosaic`, `feature_grid` and `story_strip`, 3–12 items, optional Collection source and public heading/body. Collages reference the current approved public Product image projection and fall back safely when fewer than three usable images are available.

### Product Photography Manager

Workspace: **`/admin/product-image-quality/`**.

The Photography Manager overlays the existing merged Product/media image authority and persists score/review evidence in `product_image_quality_assessments`; it does not create another image catalog.

Transparent deterministic 100-point rubric:

| Dimension | Points |
| --- | ---: |
| Lighting/exposure/clipping | 20 |
| Clarity/sharpness | 20 |
| Background uniformity | 15 |
| Framing/occupancy/centering | 15 |
| Resolution | 10 |
| Colour balance | 10 |
| Compression/artifacts | 5 |
| Product-set consistency | 5 |
| **Total** | **100** |

Operational layer:
- catalog-wide photography work queue;
- Product-set readiness score;
- 64-bit perceptual dHash duplicate/near-duplicate evidence;
- strongest distinct image = best-current-hero recommendation;
- other distinct 70+ images = gallery candidates;
- explicit improve/reshoot reasons;
- optional admin approve/reject;
- no automatic deletion, featured-image mutation, Product hiding or publication blocking.

Canvas scoring is the reproducible baseline. Optional vision-assisted review should later handle subjective concerns such as reflections, styling, semantic background quality and premium hero suitability, while remaining advisory evidence rather than a hidden publication rule.

### Product / Inventory provenance

Implemented source authority:
- Product material lineage over existing Inventory/movement authority;
- durable Tool/mold provenance without consuming Tools;
- `legacy_pending / legacy_nonblocking` for historical handmade Products;
- `made_in_house / required` for new handmade Products once D1 policy is active;
- explicit exempt state for antiquity/resale/external finished goods;
- normalized manufacturer provenance;
- Devil n Dove-authored purchased-item reviews with safe ASIN/source/review references and no marketplace runtime dependency.

Workspaces:
- `/admin/product-lineage/`
- `/admin/vendor-reviews/`

### Shared carousel / Movies

`public/js/media-carousel.js` is the shared presentation authority. Home is a data adapter and Movie front/back cover pairs reuse the same renderer. Missing Movie cover evidence remains visibly pending rather than being hidden. Keyboard, reduced-motion, controls, responsive behavior and fallback logic are centralized. No additional public H1 is introduced.

Current Movie data authority is **enriched JSON + `movie_catalog` D1 overlay**, not legacy `movies(id)`. `movie_metadata_reviews` uses stable UPC/slug identity and explicit pending/incomplete/unverified/verified states so unknown Movie data is never guessed.

### I.T. integration registry

Workspace: **`/admin/it-integrations/`**.

The registry records provider/platform, purpose, consuming module, environment, scopes, callback/webhook, configured state, separately tested/accepted state, last safe error and correction mechanics. It stores **secret/binding reference names only**. Actual secret values are forbidden and obvious secret-like values are rejected by the API.

### Admin control surface

`/admin/` is currentized to Release 448 rather than old numbered-Build HOLD semantics. Product Lineage, Product Photography, manufacturer/review and I.T. integration work are first-class current surfaces. Storefront merchandising is available directly at `/admin/storefront-merchandising/`.

## Release 448 database position

Release 448 now has **three additive Development migrations**:

1. `database_release448_product_lineage.sql`
2. `database_release448_media_it.sql`
3. `database_release448_storefront_merchandising.sql`

All three have source/local gates, guarded exact-Development transport runners and read-only verification files.

Remote D1 truth remains unchanged: the secure GitHub Actions `CLOUDFLARE_API_TOKEN` is absent, so the guarded Release 448 D1 workflow cannot pass its first credential gate. Earlier evidence proved the guard stops before any D1 read/write; therefore **none of the three Release 448 migrations may be described as remotely applied yet**.

The correct activation path is to add the credential to secure GitHub Actions secret storage—not chat/source—and rerun `.github/workflows/development-d1-release448.yml`. The workflow is hard-pinned to `devilndove-dev`, forbids Production, has no automatic write retry and performs final read-only verification.

### Fresh-install protection

Release 448 now explicitly protects against the historical failure mode where incremental Development works but a new database is missing current schema.

`python scripts/release448_fresh_install_gate.py` composes a fresh local database from:

1. `database_full_schema.sql`
2. Product-lineage Release 448 migration
3. Media/Movie/I.T. Release 448 migration
4. Storefront-merchandising Release 448 migration

It requires current Release 448 authorities, all five canonical modules and clean foreign keys. Until the large physical aggregate schema is deliberately regenerated, **base aggregate + all current Release 448 migrations is the gated fresh-install authority**.

## Canonical current-release gates

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

Canonical System Gate has no remote D1/R2/provider/Production write capability. The separate Release 448 D1 workflow owns exact-Development database mutation.

## Remaining Release 448 roadmap

### Immediate activation/calibration

1. Securely add the Development Cloudflare API token to GitHub Actions and apply/verify all three Release 448 migrations against exact `devilndove-dev`.
2. Run authenticated Development acceptance for Product lineage, Photography Manager, Storefront merchandising, I.T. registry and Movie review authority once D1 is active.
3. Score real Devil n Dove Product photography, calibrate deterministic thresholds/duplicate distances/Product-set targets and add optional vision-assisted subjective review.
4. Calibrate real Shop Collections/Collages with actual Product data and deliberately feed approved Photography Manager recommendations into merchandising.

### Forward functional depth

5. Continue CAIP / Creators / Socials evidence and Content Studio handoff.
6. Continue Inventory / Supplies / Tools lifecycle, provenance, kit/depletion/reversal and sourcing depth.
7. Continue Financials reconciliation, fees, profitability, shared-project allocation and close/export depth.
8. Review Production promotion only after the intended Development operational evidence is deliberately accepted.

### Deferred I.T. acceptance carried forward

- authenticated Development runtime acceptance
- Stripe test
- PayPal sandbox
- CAIP private-media evidence

These remain truthful, visible and non-blocking for unrelated Release 448 development. Production promotion remains closed.

## Directional benefit

Release 448 is moving Devil n Dove toward a traceable business operating system rather than a collection of disconnected pages. Products can carry material/Tool/manufacturer provenance; Inventory remains the single quantity authority; photography can be ranked into hero/gallery/improve/reshoot queues; Shop, Collections and Collages now reuse one Product/media truth; Movies stop accumulating guessed metadata; shared presentation logic reduces UI drift; and I.T. can track external-provider readiness without distributing secrets through the database or application.
