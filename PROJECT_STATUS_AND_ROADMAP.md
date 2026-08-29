# Project Status and Roadmap — Release 448 Platform Expansion

Updated: 2026-08-28/29

`development-release.json` is the machine-readable authority. `AI_HANDOFF.md` and this file are the current human-readable authorities. Historical Build numbers are provenance only.

## Current Development position

- Release: **448 — Platform Expansion**
- Source: `dev`
- Development deployment: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Canonical modules: Storefront / Creators / Socials / Financials / I.T.
- Clients: Web / Phone / Desktop from one responsive/installable PWA
- Release 447 D1 baseline: **applied and verified**
- Release 448 source/fresh-install/transport authority: **six migrations implemented and gated**
- Release 448 remote D1 activation: **blocked by missing GitHub Actions `CLOUDFLARE_API_TOKEN`**
- Production `main` / `devilndove-site`: **untouched / promotion closed**

Always resolve exact `dev` SHA, canonical System Gate and Cloudflare Pages status before calling a checkpoint green.

## Source convergence completed in Release 448

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

The Product lineage source gate now explicitly rejects migration-time manufacturer seeding/inference; the earlier always-true placeholder assertion has been removed.

### Inventory Intelligence

Workspace: `/admin/inventory-intelligence/`; API: `/api/admin/inventory-intelligence`.

This is a **read-only prioritized operations queue over existing Inventory**. It highlights linked stockouts, low stock, reorder flags, do-not-reuse items, missing stable identity, missing supplier/manufacturer provenance, missing consumption profile, unlinked Tools and stocked Supplies with no Product linkage. Product impact is derived from existing `product_resource_links`.

It creates no schema and no ledger and explicitly reports `write_authority_duplicated: false`. Supply rows now deep-link to their sourcing record.

### Supply Sourcing & Replenishment

Workspace: `/admin/supply-sourcing/`; API: `/api/admin/supply-sourcing`.

New D1 authority:
- `inventory_supply_source_options`
- `inventory_supply_replenishment_profiles`
- `inventory_supply_substitution_reviews`

The workspace records primary/alternate/backup/trial sources, source platform/SKU/URL, pack quantity and CAD cost, shipping, minimum packs, lead time, availability, verification, reorder/target/safety stock, usage/day, preferred source, planning cadence and reviewed Supply substitutions.

Database triggers enforce Supply-only source/profile/substitution records and same-Supply preferred-source ownership.

Hard invariants: **no Inventory quantity change, no stock movement, no automatic provider order, no manufacturer inference from supplier identity**.

### Durable Tool Lifecycle

Workspace: `/admin/tool-lifecycle/`; API: `/api/admin/tool-lifecycle`.

D1 authority:
- `inventory_tool_lifecycle_profiles`
- `inventory_tool_lifecycle_events`

Profiles cover lifecycle/condition, service dates/interval, warranty, replacement priority/cost/reference and evidence. Events cover inspection, maintenance, repair, calibration, damage, out-of-service, return-to-service, retirement and replacement.

Hard invariant: lifecycle changes **never consume Tool quantity and never write Inventory movement rows**. Product contribution is shown through existing Tool resource links.

### CAIP / Creators reviewed evidence handoff

CAIP and Content Studio present Release 448 outwardly. Historical Builds 439 and 355 remain provenance only.

Surfaces: `/admin/creative-assets/`, `/admin/caip-content-handoff/`, `/admin/content-studio/`.

D1 reference authority:
- `caip_content_handoffs`
- `caip_content_handoff_evidence`

Only active approved temporal markers linked to approved, non-rejected story evidence are eligible. Existing Content Studio linkage is required. Handoffs contain references/counts only—no private media copy, provider execution or publication.

### Movies / shared carousel

Home and Movie cover pairs use `public/js/media-carousel.js`. Movie authority remains enriched JSON + `movie_catalog` D1 overlay, with stable UPC/slug review keys and explicit pending/incomplete/unverified/verified metadata states. Unknown Movie metadata is never guessed.

### I.T. integration registry

Workspace: `/admin/it-integrations/`. Stores provider purpose, consuming module, environment, scopes, callback/webhook, reference names, configured/tested state and correction mechanics. Actual secret values are forbidden.

### Release 448 real-data calibration cockpit

Workspace: `/admin/release448-calibration/`; API: `/api/admin/release448-calibration`.

This is a read-only derived operational view over Photography, Product lineage, Storefront, CAIP, Inventory, Tools, Supplies and I.T. It creates no duplicate calibration/status ledger.

States deliberately distinguish:
- `schema_not_active`
- `needs_data`
- `needs_review`
- `ready`

The main Admin Dashboard exposes the current Inventory, Supply, Tool, Storefront, CAIP handoff and Calibration workspaces through Release 448 dashboard convergence logic.

### Read-only promotion rehearsal

`scripts/release448_promotion_rehearsal.py` evaluates machine authority without any Git/D1/R2/provider/Pages/Production mutation capability.

`--source-check` proves that the current machine authority can explain readiness while an expected HOLD does not block ordinary source CI. `--strict` refuses promotion readiness until all required activation/calibration/acceptance states are complete.

Current expected strict result: **HOLD**.

## Release 448 database position

Release 448 now has **six additive Development migrations**:

1. `database_release448_product_lineage.sql`
2. `database_release448_media_it.sql`
3. `database_release448_storefront_merchandising.sql`
4. `database_release448_caip_content_handoff.sql`
5. `database_release448_tool_lifecycle.sql`
6. `database_release448_supply_sourcing.sql`

Each has source/local verification and exact-Development transport protection. `.github/workflows/development-d1-release448.yml` applies/verifies all six in order and performs final read-only verification.

### Remote D1 evidence

Latest guarded six-migration workflow: **GitHub Actions run 33227149444**.

Result:
- checkout/setup: passed
- `Guard Development credential and target`: failed because `CLOUDFLARE_API_TOKEN` was empty
- read-only D1 auth probe: skipped
- all migration statements: skipped
- all final D1 verifications: skipped

Therefore no Release 448 migration is yet proven remotely applied. The credential belongs only in GitHub Actions secret storage; do not place it in source or chat.

### Fresh-install protection

`python scripts/release448_fresh_install_gate.py` composes:

1. `database_full_schema.sql`
2. Release 447 `database_platform_convergence.sql`
3. Product lineage
4. Media/Movie/I.T.
5. Storefront merchandising
6. CAIP reviewed Content Studio handoff
7. Tool lifecycle
8. Supply sourcing/replenishment

It verifies current authorities and clean foreign keys. A truly empty database has zero users and therefore zero explicit I.T. managers; once an active admin exists, Release 447 bootstrap must create explicit manage authority.

## Canonical current-release gates

```bash
python scripts/repository_forward_sanity.py
python scripts/release448_expansion_authority_gate.py
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
python scripts/release448_supply_sourcing_gate.py
python scripts/apply_development_release448_supply_sourcing.py --transport-preflight
python scripts/release448_calibration_gate.py
python scripts/release448_promotion_rehearsal.py --source-check
python scripts/product_inventory_tools_source_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

Canonical System Gate performs no remote D1/R2/provider/Production writes. The separate Release 448 D1 workflow owns exact-Development mutation and remains credential-guarded.

## Release 448 completion program

### 1. Development D1 activation — BLOCKED EXTERNALLY

Securely add `CLOUDFLARE_API_TOKEN` as a GitHub Actions repository secret, then rerun the guarded six-migration workflow. The token must never be pasted into source/chat. Do not change migration status until final read-only verification passes against exact `devilndove-dev`.

### 2. Authenticated real-data calibration — SOURCE INFRASTRUCTURE READY

Once D1 is active, open `/admin/release448-calibration/` and work through the derived queues for Product Photography, lineage, Storefront, CAIP, Inventory, Tools, Supplies and I.T.

### 3. Supply sourcing/replenishment depth — SOURCE IMPLEMENTED AND GATED

Calibrate real reorder points, target/safety stock, preferred source, pack cost, lead time and reviewed substitutions. Ordering remains manual and Inventory remains the only stock authority.

### 4. External/private acceptance — DEFERRED / NON-BLOCKING FOR SOURCE, REQUIRED FOR PROMOTION

Still requires real evidence for:
- authenticated Development runtime
- Stripe test checkout/webhook/reconciliation/idempotent replay
- PayPal sandbox approval/capture/webhook/reconciliation/idempotent replay
- CAIP authenticated private delivery/range/timecode/verified-derived-artifact behavior

Do not infer acceptance from configuration/source readiness.

### 5. Promotion rehearsal — SOURCE IMPLEMENTED / STRICT HOLD

Run:

```bash
python scripts/release448_promotion_rehearsal.py --strict
```

A HOLD is correct while D1 activation, calibration or external/private acceptance remains incomplete. A later PASS is evidence for a deliberate promotion decision only; the script itself cannot promote Production.

## Directional benefit

Release 448 is now a connected operating platform rather than a collection of isolated admin tools: Product creation can trace to materials, Tools and manufacturers; photography can drive reshoot/hero/gallery work; Storefront discovery reuses one Product/media truth; CAIP reviewed evidence can flow into Content Studio without copying private media; Inventory can expose production risk; Supplies can compare sourcing/reorder/substitution options without becoming an ordering or stock system; durable Tools carry maintenance/safety/replacement history; and the Calibration/Rehearsal layer provides a single truthful path from source-ready to Development-active to promotion-ready.
