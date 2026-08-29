# Project Status and Roadmap — Release 448 Platform Expansion

Updated: 2026-08-28

`development-release.json` is the machine-readable authority. `AI_HANDOFF.md` and this file are the current human-readable authorities. Historical Build numbers are provenance only.

## Current Development position

- Release: **448 — Platform Expansion**
- Source: `dev`
- Development deployment: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Canonical modules: Storefront / Creators / Socials / Financials / I.T.
- Clients: Web / Phone / Desktop from one responsive/installable PWA
- Release 447 D1 baseline: **applied and verified**
- Production `main` / `devilndove-site`: **untouched / promotion closed**

Always resolve exact `dev` SHA, canonical System Gate and Cloudflare Pages status before calling a checkpoint green.

## Release 448 source convergence completed

### Storefront

Shop remains the Product discovery/buying authority. Collections are merchandising/group navigation over the same Products. Collages are visual presentation over the same consent-gated public Product images. Home and Movie cover presentation share one accessible carousel implementation.

Current surfaces:
- `/shop/`
- `/collections/`
- `/collages/`
- `/admin/storefront-merchandising/`

Storefront D1 stores only metadata/references:
- `storefront_collections`
- `storefront_collection_products`
- `storefront_collage_presets`

No Product row, Inventory quantity or image binary is duplicated. Public merchandising consumes `/api/products` before grouping safe public images. Current public Storefront pages preserve exactly one H1.

### Product Photography Manager

Workspace: `/admin/product-image-quality/`.

The Photography Manager overlays existing Product/media authority and persists score/review evidence in `product_image_quality_assessments`.

Deterministic 100-point rubric:
- Lighting 20
- Clarity 20
- Background 15
- Framing 15
- Resolution 10
- Colour balance 10
- Artifacts 5
- Product-set consistency 5

It also provides catalog work queues, Product-set readiness, perceptual duplicate/near-duplicate evidence, hero/gallery recommendations and reshoot reasons. It never auto-deletes images, changes featured media, hides Products or becomes publication authority. Vision-assisted subjective review is a future advisory layer.

### Product / Inventory / manufacturer provenance

Current source adds review/policy/provenance without creating another stock ledger:
- `/admin/product-lineage/`
- `/admin/vendor-reviews/`
- new handmade Products can require verified raw-material lineage
- historical handmade Products stay `legacy_pending / legacy_nonblocking`
- outside finished goods may be explicitly exempt
- durable Tools/molds are provenance/use links, not consumption
- manufacturer and supplier remain separate authorities
- locally authored equipment/material reviews can retain safe marketplace/source references without marketplace runtime dependency

Existing operational stock/movement remains canonical.

### Movies / shared carousel

Home and Movie cover pairs use shared `public/js/media-carousel.js`. Movie data authority is enriched JSON + `movie_catalog` D1 overlay, with stable UPC/slug review keys and explicit pending/incomplete/unverified/verified metadata states. Unknown Movie data is never guessed.

### I.T. integration registry

Workspace: `/admin/it-integrations/`. The registry records provider purpose, consuming module, environment, scopes, callbacks/webhooks, reference names, configured/tested state and correction mechanics. Actual secret values are forbidden.

### CAIP / Creators reviewed evidence handoff

CAIP and Content Studio now present **Release 448** outwardly. Historical Builds 439 and 355 remain provenance only.

Current surfaces:
- `/admin/creative-assets/`
- `/admin/caip-content-handoff/`
- `/admin/content-studio/`

New D1 reference authority:
- `caip_content_handoffs`
- `caip_content_handoff_evidence`

The handoff packages only active approved temporal markers whose linked story evidence is approved and not rejected. It requires an existing Content Studio linkage. It stores references/counts only—no private media copy, provider execution or automatic publication. Preparation and review are explicit/audited states.

Secure CAIP review remains authenticated/private, supports ranged streaming, preserves source originals, and now emits Release 448 runtime identity while retaining historical provenance in audit evidence.

## Release 448 database position

Release 448 now has **four additive Development migrations**:

1. `database_release448_product_lineage.sql`
2. `database_release448_media_it.sql`
3. `database_release448_storefront_merchandising.sql`
4. `database_release448_caip_content_handoff.sql`

Each has source/local verification and exact-Development transport protection. `.github/workflows/development-d1-release448.yml` applies/validates the four in order and then performs final read-only verification.

Remote truth remains unchanged: GitHub Actions has no secure `CLOUDFLARE_API_TOKEN`, so the guarded workflow stops before D1 access. Therefore no Release 448 migration may be described as remotely applied yet. Add the credential only to GitHub Actions secret storage; never source/chat.

### Fresh-install protection

`python scripts/release448_fresh_install_gate.py` proves this composition:

1. `database_full_schema.sql`
2. Release 447 `database_platform_convergence.sql`
3. Release 448 Product lineage
4. Release 448 Media/Movie/I.T.
5. Release 448 Storefront merchandising
6. Release 448 CAIP reviewed Content Studio handoff

The composed test verifies all current tables plus clean foreign keys. A truly empty database has no users and therefore zero explicit I.T. managers; if an active admin exists, Release 447 bootstrap must create explicit manage authority. This distinction is intentional and tested.

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
python scripts/release448_caip_content_handoff_gate.py
python scripts/apply_development_release448_caip_content_handoff.py --transport-preflight
python scripts/product_inventory_tools_source_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

Canonical System Gate performs no remote D1/R2/provider/Production writes. The separate Release 448 D1 workflow owns exact-Development database mutation and remains credential-guarded.

## Remaining Release 448 roadmap

### Immediate forward development

1. **Inventory operations intelligence** — turn existing Inventory/movement/usage/provenance data into actionable stock/reorder/lineage work queues without creating another ledger.
2. **Supplies sourcing/provenance depth** — source/manufacturer/purchase-lot/reorder intelligence and quality/reuse decisions.
3. **Tools lifecycle/provenance depth** — durable Tool condition, use, maintenance/retirement/replacement and Product/project contribution.
4. **Storefront + Photography calibration** using real Product data once Release 448 D1 is active.
5. **CAIP runtime/presentation calibration** and later private-media acceptance.
6. **Financials depth** — reconciliation, fees, profitability, shared-project allocation and close/export.

### Activation when secure D1 credential is available

- apply/verify all four Release 448 migrations against exact `devilndove-dev`;
- run authenticated Development acceptance across Product lineage, Photography, Storefront, I.T. registry, Movie review and CAIP handoff;
- preserve Production closure until deliberate promotion review.

### Deferred I.T. acceptance

- authenticated Development runtime
- Stripe test
- PayPal sandbox
- CAIP private-media delivery/range/timecode/artifact evidence

These remain visible and non-blocking for unrelated Development work.

## Directional benefit

Release 448 is converging Devil n Dove into a traceable operating system: Product creation can connect to actual materials/Tools/manufacturers; photography can be ranked into useful merchandising queues; Shop/Collections/Collages reuse one Product/media truth; Movie data carries explicit verification; CAIP approved evidence can move into Content Studio without copying private media or bypassing review; and I.T. can track external readiness without distributing secrets.
