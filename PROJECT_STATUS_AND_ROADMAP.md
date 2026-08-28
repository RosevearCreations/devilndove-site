# Project Status and Roadmap — Release 448 Platform Expansion

Updated: 2026-08-28

`development-release.json` is the machine-readable current-release authority. This file and `AI_HANDOFF.md` are the mutable human-readable authorities. Git history is the archive.

## Current Development status

- Current release: **Release 448 — Platform Expansion**
- Previous release: **Release 447 — Platform Convergence — COMPLETE**
- Source/runtime: `dev` → `devilndove-site-dev`
- Canonical modules: **Storefront / Creators / Socials / Financials / I.T.**
- Canonical clients: **Web / Phone / Desktop**
- Phone/Desktop delivery: shared responsive/installable PWA authority
- Notifications: explicit opt-in **new-release + new-item** alerts
- D1 baseline: Release 447 convergence **APPLIED AND VERIFIED** against `devilndove-dev`
- Historical Build numbers: provenance only; no active build-number gates
- Separate live Production promotion: **CLOSED**

Always resolve the exact current `dev` SHA and its System Gate/Pages deployment evidence from GitHub.

## Forward motion vs deferred I.T.

Authenticated Development runtime, Stripe test acceptance, PayPal sandbox acceptance and CAIP private-media acceptance remain in the **deferred/non-blocking I.T. test environment**. They carry forward automatically and do not stop normal Release 448 work. Real provider evidence remains truthful and separate; Production stays closed.

## Application architecture

### Storefront
Owns Home, Shop, product discovery, Collections, Collages, Carousels, Movies/showcase presentation, cart/checkout/customer documents and public SEO truthfulness. Shop/Collections/Collages/Carousels remain Storefront capabilities unless a stronger ownership boundary emerges.

### Creators
Owns Creative Projects, creation/production evidence, packaging/formula/ingredient templates, Content Studio preparation, material-usage review, lessons/recommendations and creator workflow.

### Socials
Owns social publication/campaign/channel workflow and CAIP-facing distribution. I.T. owns external connection/config references consumed by Socials.

### Financials
Owns accounting, payment-state interpretation, refunds/disputes, reconciliation, AR/AP/journal/tax/fees/profitability/export/close and marketplace economics.

### I.T.
Owns infrastructure, provider/API reference metadata, the eventual external-platform test cockpit, module/user access, diagnostics and recovery. Deferred I.T. completion does not gate unrelated features.

### Future modules
Five is a minimum, not a permanent maximum. Add a module only when a real domain ownership/security/lifecycle boundary justifies it.

## Web / Phone / Desktop

All three remain first-class clients of the same application authority. Enforced behavior includes responsive layout, installable PWA mode, shared service worker, offline fallback, API/admin cache bypass, push/notification-click handling, explicit notification permission, new-release/new-item alerts, and launch/resume checking rather than idle polling.

## D1 baseline and Release 448 migration policy

Development D1 is `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`). The Release 447 convergence baseline is already applied/verified. Permanent startup rule: **read-only D1/R2 verification first**; never replay baseline migrations merely because a chat/release starts.

Release 448 may add protected Development migrations. Source readiness never equals applied D1: remote application must be proved separately.

## Product material/tool lineage — source implemented

Release 448 now extends the existing Product/Inventory model without creating a second stock authority.

Existing authorities remain:

- `product_resource_links` — Product → Tool/Supply intent;
- `site_item_inventory` — operational Inventory;
- `site_inventory_movements` — actual stock movement;
- current production-run and purchase-lot authorities — consumption/provenance evidence;
- durable Tools/molds — usage/provenance links, never consumed merely because they are linked.

New source authority:

- migration: `database_release448_product_lineage.sql`
- read-only verification: `RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql`
- local behavior gate: `scripts/product_lineage_gate.py`
- exact Development runner: `scripts/apply_development_product_lineage.py`
- admin API: `/api/admin/product-lineage`
- admin workspace: `/admin/product-lineage/`

The migration creates:

- `product_lineage_profiles`
- `product_resource_lineage_reviews`
- `inventory_manufacturers`
- `inventory_manufacturer_links`
- `inventory_vendor_reviews`

Historical handmade Products are seeded `legacy_pending / legacy_nonblocking`; no historical consumption is fabricated. Antiquity/resale/external finished goods are explicitly exempt. New handmade Products become `made_in_house / pending / required` automatically once the migration is active.

Current publication safeguard: when the Release 448 schema is present, both normal Publish and Override Publish are blocked for a new `made_in_house / required` Product until consuming Supply links resolve to active Inventory, those resource links are verified, and the Product lineage profile is verified. Legacy and exempt products are not retroactively blocked.

**Development D1 status:** pending actual execution/verification. This is tracked accurately but does not block unrelated Release 448 source work.

## Manufacturer / VEVOR / purchased-item reviews — source implemented

Manufacturer identity is normalized at the Tool/Supply Inventory item rather than copied to each Product. Supplier/store and manufacturer are separate authorities; the system never promotes `supplier_name` into a manufacturer without review.

Current source surfaces:

- API: `/api/admin/inventory-vendor-reviews`
- workspace: `/admin/vendor-reviews/`

The model supports:

- manufacturer such as **VEVOR**;
- Tool/Supply Inventory association;
- manufacturer/brand-owner/OEM/private-label/unknown relationship;
- pending/unverified/verified provenance;
- evidence/model/external item reference;
- Devil n Dove-authored purchased-item reviews;
- Amazon/VEVOR/eBay/Etsy/local/other platform reference;
- ASIN/external ID;
- source item URL and direct URL to our external review;
- rating/date/title/body;
- private/internal/approved-public state.

Amazon/VEVOR are reference locations only. The API does not scrape or contact a marketplace. Owner-controlled linking/import of **our own authored content** is the intended workflow unless a supported official export/API is established later.

Product manufacturer provenance is derived through:

`Product → product_resource_links → site_item_inventory → inventory_manufacturer_links → inventory_manufacturers`

This means one verified VEVOR Tool can truthfully contribute provenance to every Product linked to that Tool.

## Deferred I.T. test environment

| I.T. task | State | Release effect |
| --- | --- | --- |
| Authenticated Development runtime evidence | **DEFERRED** | non-blocking |
| Stripe test checkout/webhook/reconciliation/replay | **DEFERRED** | non-blocking |
| PayPal sandbox approval/capture/webhook/reconciliation/replay | **DEFERRED** | non-blocking |
| CAIP private-media delivery/range/timecode/artifact evidence | **DEFERRED** | non-blocking |

`LIVE_TESTING_GUIDE.md` remains the later test procedure. The eventual I.T. cockpit should hold safe provider metadata, callbacks/webhooks, scopes, configured/tested state, safe errors/correction mechanics and evidence references—never secret values.

## Remaining Release 448 workstreams

### Storefront
- Shop
- Collections
- Collages
- Carousels
- reusable carousel presentation on Movies/showcase surfaces
- product/category merchandising
- search/filter/discovery
- cart/checkout truthfulness
- approved media
- pickup/delivery/customer documents
- public SEO/schema/conversion work

### Movies
- reuse/generalize carousel presentation without duplicating Home-carousel authority;
- preserve one public H1;
- audit incorrect names/core metadata;
- mark unknown/incomplete fields explicitly rather than guessing.

### CAIP / Creators / Socials
- Creative Project → Content Studio handoff
- temporal/private-media evidence
- story/evidence selection
- lessons/future recommendations
- publication packages and channel variants
- manufacturer/tool/material evidence where useful
- private storyboard/client notes where applicable

### Inventory / Supplies / Tools
- continue lineage reconstruction
- purchase-lot/source provenance
- manufacturer attribution/reviews
- kit depletion/reversal
- durable Tool lifecycle
- molds/tool-use association
- reorder/source intelligence
- truthful availability/publication integration

### Financials
- payment/refund/dispute truth
- reconciliation
- marketplace/channel fees
- shared-project cost allocation
- profitability
- journal/AR/AP/tax/export/close

### I.T. — later dedicated work
- provider setup/test cockpit
- real secret-reference completion
- Stripe/PayPal acceptance
- social OAuth/webhooks/scopes
- authenticated runtime evidence
- CAIP private-media infrastructure acceptance
- backup/restore, performance/accessibility and incident tooling

## Canonical current-release gates

```bash
python scripts/repository_forward_sanity.py
python scripts/module_architecture_gate.py
python scripts/database_platform_gate.py
python scripts/product_lineage_gate.py
python scripts/apply_development_product_lineage.py --transport-preflight
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/product_inventory_tools_source_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

The canonical System Gate performs no remote D1/R2/provider/Production writes. Deferred authenticated/provider/media I.T. tests are not release-blocking gates.

## Forward release policy

A normal feature is ready when its source authority, D1 authority where applicable, fallback/error behavior, Web/Phone/Desktop behavior, regression tests/CI and exact Development deployment agree. External-provider acceptance is required when deliberately completing that provider or before Production use—not as a permanent blocker to unrelated Development releases.

Production remains a separate deliberate promotion decision.
