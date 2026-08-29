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

## Source convergence now completed in Release 448

### Storefront

Shop remains the Product discovery/buying authority. Collections group the same Products; Collages visually arrange the same consent-gated public Product images; Home and Movie covers share one accessible carousel renderer.

Current surfaces: `/shop/`, `/collections/`, `/collages/`, `/admin/storefront-merchandising/`.

D1 stores only `storefront_collections`, `storefront_collection_products`, and `storefront_collage_presets`. No Product row, Inventory quantity or image binary is duplicated. Public pages preserve exactly one H1.

### Product Photography Manager

Workspace: `/admin/product-image-quality/`.

The manager overlays existing Product/media authority and stores score/review evidence in `product_image_quality_assessments`.

100-point deterministic rubric: Lighting 20, Clarity 20, Background 15, Framing 15, Resolution 10, Colour 10, Artifacts 5, Product-set consistency 5.

Operational features include catalog queue, Product-set readiness, perceptual duplicate/near-duplicate evidence, hero/gallery recommendations and reshoot reasons. It never auto-deletes images, changes featured media, hides Products or becomes publication authority. Vision-assisted subjective review remains an advisory future layer.

### Product / Inventory / manufacturer provenance

Existing `site_item_inventory`, `site_inventory_movements`, `product_resource_links`, production usage and purchase-lot authorities remain canonical. Release 448 adds review/policy/provenance without creating another stock ledger.

Workspaces: `/admin/product-lineage/`, `/admin/vendor-reviews/`.

New handmade Products may require verified material lineage; historical handmade Products stay `legacy_pending / legacy_nonblocking`; outside finished goods may be exempt; durable Tools/molds are provenance/use links; manufacturer and supplier remain separate authorities.

### Inventory Intelligence

Workspace: `/admin/inventory-intelligence/`; API: `/api/admin/inventory-intelligence`.

This is a **read-only prioritized operations queue over existing Inventory**. It highlights linked stockouts, low stock, reorder flags, do-not-reuse items, missing stable identity, missing supplier/manufacturer provenance, missing consumption profile, unlinked Tools and stocked Supplies with no Product linkage. Product impact is derived from existing `product_resource_links`.

It creates no schema and no ledger and explicitly reports `write_authority_duplicated: false`.

### Durable Tool Lifecycle

Workspace: `/admin/tool-lifecycle/`; API: `/api/admin/tool-lifecycle`.

New D1 authority:
- `inventory_tool_lifecycle_profiles`
- `inventory_tool_lifecycle_events`

Profiles cover lifecycle/condition, service dates/interval, warranty, replacement priority/cost/reference and evidence. Events cover inspection, maintenance, repair, calibration, damage, out-of-service, return-to-service, retirement and replacement.

Hard invariant: lifecycle changes **never consume Tool quantity and never write Inventory movement rows**. Product contribution is shown through existing Tool resource links.

### Movies / shared carousel

Home and Movie cover pairs use `public/js/media-carousel.js`. Movie authority remains enriched JSON + `movie_catalog` D1 overlay, with stable UPC/slug review keys and explicit pending/incomplete/unverified/verified metadata states. Unknown Movie metadata is never guessed.

### I.T. integration registry

Workspace: `/admin/it-integrations/`. Stores provider purpose, consuming module, environment, scopes, callback/webhook, reference names, configured/tested state and correction mechanics. Actual secret values are forbidden.

### CAIP / Creators reviewed evidence handoff

CAIP and Content Studio now present Release 448 outwardly. Historical Builds 439 and 355 remain provenance only.

Surfaces: `/admin/creative-assets/`, `/admin/caip-content-handoff/`, `/admin/content-studio/`.

D1 reference authority:
- `caip_content_handoffs`
- `caip_content_handoff_evidence`

Only active approved temporal markers linked to approved, non-rejected story evidence are eligible. Existing Content Studio linkage is required. Handoffs contain references/counts only—no private media copy, provider execution or publication. Secure CAIP review remains authenticated/private with range streaming and immutable originals.

## Release 448 database position

Release 448 now has **five additive Development migrations**:

1. `database_release448_product_lineage.sql`
2. `database_release448_media_it.sql`
3. `database_release448_storefront_merchandising.sql`
4. `database_release448_caip_content_handoff.sql`
5. `database_release448_tool_lifecycle.sql`

Each has source/local verification and exact-Development transport protection. `.github/workflows/development-d1-release448.yml` applies/verifies all five in order and performs final read-only verification.

Remote truth remains unchanged: GitHub Actions currently has no secure `CLOUDFLARE_API_TOKEN`, so the guarded workflow stops before D1 access. No Release 448 migration may be described as remotely applied yet. The credential belongs only in GitHub Actions secret storage.

### Fresh-install protection

`python scripts/release448_fresh_install_gate.py` proves:

1. `database_full_schema.sql`
2. Release 447 `database_platform_convergence.sql`
3. Product lineage
4. Media/Movie/I.T.
5. Storefront merchandising
6. CAIP reviewed Content Studio handoff
7. Tool lifecycle

It verifies current tables and clean foreign keys. A truly empty database has zero users and therefore zero explicit I.T. managers; once an active admin exists, Release 447 bootstrap must create explicit manage authority.

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
python scripts/release448_inventory_intelligence_gate.py
python scripts/release448_tool_lifecycle_gate.py
python scripts/apply_development_release448_tool_lifecycle.py --transport-preflight
python scripts/product_inventory_tools_source_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

Canonical System Gate performs no remote D1/R2/provider/Production writes. The separate Release 448 D1 workflow owns exact-Development mutation and remains credential-guarded.

## Remaining Release 448 roadmap

### Immediate forward development

1. **Supplies sourcing/provenance depth** — improve source/manufacturer/purchase-lot/reorder intelligence and substitution/quality decisions.
2. **Inventory operations calibration** — tune priorities against real Development Inventory once the Release 448 D1 migrations are active.
3. **Tool lifecycle calibration** — establish service/replacement patterns and use existing Product/manufacturer provenance.
4. **Storefront + Photography calibration** using real Product images and merchandising results.
5. **CAIP runtime/presentation calibration** and later private-media acceptance.
6. **Financials depth** — reconciliation, marketplace fees, shared-project costs, profitability and close/export.

### Activation when secure D1 credential is available

- apply/verify all **five** Release 448 migrations against exact `devilndove-dev`;
- run authenticated Development acceptance across Product lineage, Photography, Storefront, I.T. registry, Movie review, CAIP handoff and Tool lifecycle;
- calibrate Inventory Intelligence from the real Development dataset;
- preserve Production closure until deliberate promotion review.

### Deferred I.T. acceptance

Authenticated Development runtime, Stripe test, PayPal sandbox and CAIP private-media delivery/range/timecode/artifact evidence remain visible and non-blocking for unrelated Development work.

## Directional benefit

Release 448 is now a much more connected operating system: Product creation can trace to materials, Tools and manufacturers; photography can drive concrete reshoot/merchandising queues; Storefront discovery reuses one Product/media truth; CAIP reviewed evidence can flow into Content Studio without copying private media; Inventory can expose production risk before a build starts; durable Tools can carry maintenance/safety/replacement history without being treated as consumables; and I.T. can track external readiness without distributing secrets.
