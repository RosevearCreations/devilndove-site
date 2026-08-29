# Project Status and Roadmap — Release 448 Platform Expansion

Updated: 2026-08-28

`development-release.json` is the machine-readable authority. `AI_HANDOFF.md` and this file are the current human-readable authorities.

## Current Development position

- Current release: **448 — Platform Expansion**
- Source: `dev`
- Development deployment: `devilndove-site-dev`
- Development D1: `devilndove-dev`
- Canonical modules: Storefront / Creators / Socials / Financials / I.T.
- Clients: Web / Phone / Desktop from one responsive/installable PWA
- Release 447 D1 baseline: **applied and verified**
- Production `main` / `devilndove-site`: **untouched / promotion closed**
- Historical Build numbers: provenance only

Always resolve exact SHA, System Gate and Pages status from GitHub before calling a checkpoint green.

## Release 448 completed source work

### Product / Inventory provenance

Implemented:
- Product material lineage over the existing Inventory/movement authorities;
- durable Tool/mold provenance without consuming the Tool;
- legacy handmade Products remain `legacy_pending / legacy_nonblocking`;
- new handmade Products become `made_in_house / required` when the D1 policy is active;
- antiquity/resale/external finished goods can be explicitly exempt;
- normalized manufacturer provenance;
- Devil n Dove-authored purchased-item reviews with safe ASIN/source/review references and no marketplace runtime dependency.

Workspaces:
- `/admin/product-lineage/`
- `/admin/vendor-reviews/`

### Product Photography Manager

Implemented source workspace: **`/admin/product-image-quality/`**.

The Photography Manager overlays the existing merged Product/media image authority; it does not create a second image catalog. Individual deterministic browser scores save evidence to `product_image_quality_assessments` with this transparent 100-point rubric:

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

The Release 448 operational layer now also provides:

- catalog-wide photography queue with unscored Products first and weakest scored sets next;
- Product-set score using coverage 20 + best hero 25 + average quality 20 + distinctness 15 + up to four good/excellent gallery images 20;
- 64-bit perceptual dHash stored with scoring evidence;
- probable duplicate flag at dHash distance 0–4;
- possible near-duplicate flag at distance 5–8;
- strongest distinct scored image as the best-current-hero recommendation;
- other distinct 70+ images as gallery candidates;
- explicit work reasons for lighting, clarity, background, framing, resolution, colour, artifacts and set consistency;
- admin approval/rejection of an assessment;
- no automatic deletion, featured-image mutation, Product hiding or publication blocking.

The baseline is automatable and reproducible. Optional vision-assisted review should later handle subjective issues such as reflections, distracting props, premium hero suitability, styling, semantic background appropriateness and whether the Product is clearly identifiable. Vision remains advisory evidence, not a blind publication gate. Canvas scoring requires same-origin/CORS-readable image pixels.

### Shared carousel / Movies

`public/js/media-carousel.js` is now the shared presentation authority.

- Home is a data adapter to the shared carousel.
- Movie front/back cover pairs reuse the same carousel through `movie-media-carousel.js`.
- Missing front/back evidence stays visibly pending rather than disappearing.
- Shared keyboard, reduced-motion, controls, responsive layout and fallback logic live in one place.
- No additional public H1 is introduced.

Current Movie data authority is **enriched JSON + `movie_catalog` D1 overlay**. Release 448 no longer plans against legacy `movies(id)`. `movie_metadata_reviews` uses UPC/slug-stable review keys and explicit pending/incomplete/unverified/verified states so we repair only provably wrong data.

### I.T. integration registry

Implemented source workspace: **`/admin/it-integrations/`**.

The registry tracks provider/platform, purpose, consuming module, environment, scopes, callback/webhook, configured state, separately tested/accepted state, last safe error and correction mechanics. It stores **secret/binding reference names only**. Secret values are rejected by the API and do not belong in D1/UI/source/logs/evidence.

### Admin control surface

`/admin/` is currentized to Release 448. The visible dashboard no longer describes Build 443 HOLDs or the old pre-convergence module grouping. It directly exposes Product Lineage, Product Photography Manager, Manufacturer/Purchased-item Reviews and I.T. Integrations while retaining the existing operational and release tools.

## Current Release 448 D1 state

Two additive Development migrations are ready:

1. `database_release448_product_lineage.sql`
2. `database_release448_media_it.sql`

Both have local behavior/source gates, Development-only transport guards and read-only verification files.

The first guarded remote workflow run (`33198354338`) **did not execute either migration**. It stopped at the credential guard because GitHub Actions does not contain `CLOUDFLARE_API_TOKEN`. No D1 read/write followed that failed guard.

This is the Release 448 database activation blocker, but it is not a reason to freeze unrelated source work. Do not put the token in chat or source. Add it to secure GitHub Actions secret storage, then rerun `.github/workflows/development-d1-release448.yml`; the workflow is hard-pinned to `devilndove-dev`, has no automatic write retry, and performs final read-only verification.

## Canonical gates

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

Canonical System Gate has no remote D1/R2/provider/Production write capability. The separate Release 448 Development D1 workflow owns exact-Development database mutation.

## Remaining Release 448 roadmap

### Immediate convergence

1. Securely provide the GitHub Actions Development Cloudflare token and execute/verify both Release 448 D1 migrations.
2. Run authenticated Development acceptance for the newly active lineage/Photography/I.T./Movie authorities once D1 is active.
3. Use real Devil n Dove Product photography to calibrate deterministic thresholds, duplicate distances and Product-set targets; then add optional vision-assisted subjective review.
4. Continue Storefront Shop / Collections / Collages / Carousels and feed approved Photography Manager recommendations into merchandising deliberately rather than automatically.
5. Continue Movie evidence cleanup, CAIP, Inventory/Supplies/Tools and Financials depth.

### Deferred I.T. acceptance carried forward

- authenticated Development runtime acceptance
- Stripe test
- PayPal sandbox
- CAIP private-media evidence

These do not freeze unrelated Release 448 source work, but deliberate Production promotion remains closed until the required operational acceptance is reviewed.

## Directional benefit

Release 448 is moving the application from a collection of working features toward a **traceable operating system for the business**: Products know what materials and tools contributed to them; Inventory remains the single quantity authority; manufacturer and review provenance can be reused truthfully; photography can be ranked into hero/gallery/improve/reshoot queues with duplicate evidence; Movies stop accumulating guessed metadata; Storefront presentation logic is reused rather than cloned; and I.T. can see external-provider configuration state without spreading secrets through the database or admin UI.
