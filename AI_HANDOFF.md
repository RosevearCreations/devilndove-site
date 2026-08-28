# AI Handoff — Release 448 Platform Expansion

Updated: 2026-08-28

Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. These are the two mutable current-state Markdown authorities. `development-release.json` is the machine-readable release authority. Git history is the historical archive.

## Current release

- Development release: **Release 448 — Platform Expansion**
- Release track: **one current release**; historical Build numbers are provenance only
- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development R2: `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`
- Canonical modules: **Storefront, Creators, Socials, Financials, I.T.**
- Canonical clients: **Web, Phone, Desktop**
- Phone/Desktop mode today: shared responsive/installable PWA application with service worker, offline fallback and explicit opt-in notifications
- Client notifications: **new application releases + newly published items**
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

Always resolve the exact current `dev` SHA and exact System Gate/Pages status from GitHub. Do not copy an old checkpoint SHA forward.

## Release 447 closure and deferred I.T.

Release 447 — Platform Convergence is **COMPLETE**. Authenticated Development runtime evidence, Stripe test acceptance, PayPal sandbox acceptance and CAIP private-media evidence are carried in the **deferred/non-blocking I.T. test environment**. They are not assumed accepted, but they do not gate Release 448 or later feature work.

Until I.T. testing resumes, implement normal Development features using safe provider abstractions/mocks/reference names as though required key references will be populated. Never fabricate successful real-provider evidence. Secret values never belong in D1, UI, source, logs or evidence.

## Canonical platform direction

Minimum top-level modules:

1. **Storefront** — public commerce, Shop, Collections, Collages, Carousels and product discovery/purchase surfaces.
2. **Creators** — creative projects, production evidence, packaging/formula/content preparation and creator workflow.
3. **Socials** — publication/campaign/channel workflow and CAIP-facing distribution behavior.
4. **Financials** — accounting, payments, refunds/disputes, reconciliation, profitability, tax/fees, journals/export/close.
5. **I.T.** — bindings, API/provider configuration references, test environment, diagnostics, access/security/infrastructure recovery.

Add future top-level modules only when an actual ownership/security/lifecycle boundary justifies them. Shop/Collections/Collages/Carousels remain Storefront capabilities for now.

Web, Phone and Desktop remain first-class clients of the same application authority. Major new surfaces must be evaluated on all three. Notification permission remains explicit opt-in; release/item checks occur on launch/resume, not idle polling.

## Development D1 / R2 baseline

Release 447 D1 convergence is **APPLIED AND VERIFIED**: five canonical module rows, zero legacy module rows, 10 canonical role rows, one explicit I.T. manager, Home-carousel tables and clean foreign keys.

Permanent startup rule: **read-only D1/R2 verification first**. Do not rerun `database_platform_convergence.sql` because a new chat/release starts.

Release 448 may add protected Development migrations when current feature work requires them. Production is never a normal Development migration target.

## Release 448 Product lineage implementation — current

The first substantive Release 448 work is now implemented in source and gated.

### Existing operational authorities retained

Do **not** create another stock ledger. Existing authorities remain canonical:

- Product → Tool/Supply intent: `product_resource_links`
- operational Inventory: `site_item_inventory`
- actual stock movement: `site_inventory_movements`
- production consumption/run records and purchase-lot provenance remain existing authorities
- reusable Tools/molds are provenance/use links, not consumable stock deductions

### New additive migration

Current Release 448 migration:

- `database_release448_product_lineage.sql`
- read-only verification: `RELEASE448_PRODUCT_LINEAGE_VERIFICATION.sql`
- Development-only runner: `python scripts/apply_development_product_lineage.py`
- local behavior gate: `python scripts/product_lineage_gate.py`

**Current state:** source implemented and canonical transport/local tests added. Development D1 application must be marked complete only after the runner is actually executed against exact `devilndove-dev` and its verification passes. This pending execution is **non-blocking for unrelated Release 448 source work**.

The migration is additive, does not alter Inventory quantities, does not fabricate historical consumption and creates:

- `product_lineage_profiles`
- `product_resource_lineage_reviews`
- `inventory_manufacturers`
- `inventory_manufacturer_links`
- `inventory_vendor_reviews`

Existing handmade Products become `legacy_pending / legacy_nonblocking`; no fake historical usage is inserted. Antiquity/resale/external finished goods are explicitly exempt. New handmade Products inserted after migration become `made_in_house / pending / required`, with raw-material lineage required before publication.

### Product lineage workspace

Admin workspace: **`/admin/product-lineage/`**

It supports Product origin/policy/status, evidence notes, Supply lineage verification and Tool/mold role/provenance review. It never changes stock.

Current Release 448 admin middleware blocks both `publish` and `publish_override` only when a **new required made-in-house** Product has unresolved/unverified material lineage and the Release 448 schema is present. Historical `legacy_nonblocking` Products and exempt outside finished goods continue normally. Before migration rollout, the middleware deliberately preserves existing publication behavior rather than breaking Development.

Retained older Product/Tool handlers may still contain historical build-number implementation strings internally. The current admin middleware strips stale outward `build` identity from selected retained JSON contracts and emits Release 448 instead. Historical implementation names are provenance only, never current release authority.

## Manufacturer / VEVOR / Amazon review authority — current

Manufacturer identity is normalized at the Tool/Supply Inventory item rather than copied onto each Product. **Supplier/store and manufacturer are separate authorities**; never infer manufacturer from `supplier_name`.

Admin workspace: **`/admin/vendor-reviews/`**

API: **`/api/admin/inventory-vendor-reviews`**

Capabilities implemented in source:

- create/select a normalized manufacturer such as VEVOR;
- attach one reviewed manufacturer provenance record to a Tool/Supply Inventory item;
- relationship: manufacturer / brand owner / OEM / private label / unknown;
- verification/evidence/reference metadata;
- locally store Devil n Dove-authored purchased-item reviews;
- platform reference such as Amazon, VEVOR, eBay, Etsy, local or other;
- ASIN/external item/model identifiers;
- product/source URL and direct URL to our external review when available;
- local rating/date/title/body and private/internal/approved-public status.

Amazon/VEVOR are **reference locations only**. The endpoint never scrapes or contacts a marketplace, and normal application behavior does not depend on Amazon being reachable. Owner-controlled copy/import/linking of **our own authored reviews** is the intended path unless an official supported export/API is available later.

Product lineage now derives manufacturer provenance through:

`Product → product_resource_links → site_item_inventory → inventory_manufacturer_links → inventory_manufacturers`

Therefore one verified VEVOR Tool can contribute manufacturer provenance to every Product that truthfully links that Tool.

## Release 448 remaining workstreams

Continue moving without waiting for deferred I.T. work:

1. finish/apply/verify the current Development Product-lineage migration when a safe authenticated Cloudflare execution surface is available;
2. continue Storefront Shop / Collections / Collages / Carousels;
3. reuse/generalize Carousel presentation for Movie surfaces without a second H1 or duplicate Home authority;
4. audit Movie names/core metadata and mark unknowns instead of guessing;
5. continue CAIP;
6. continue Inventory / Supplies / Tools depth;
7. expand manufacturer/review provenance into public/Creator/Social content only through deliberate approved-public states;
8. add future top-level modules only when justified.

## Canonical repository gates

Run:

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

The active CI workflow is `.github/workflows/system-gate.yml`. CI does **not** apply remote D1 and does not mutate R2, providers or Production.

## Invariants

- One current release only.
- Historical Build numbers never become active gates.
- D1 is operational write authority; new code must not create schema at request time.
- Legacy JSON is not write authority.
- Product lineage overlays existing Inventory/resource authorities; it does not duplicate them.
- Never fabricate legacy material consumption or manufacturer identity.
- Public pages preserve one meaningful H1 and truthful canonical metadata/schema.
- Home carousel is Storefront-owned and may never inject a second H1.
- I.T. owns provider/infrastructure configuration references; consuming modules own business workflow.
- Deferred I.T. work never blocks unrelated forward releases.
- Web/Phone/Desktop remain first-class clients.
- Production remains untouched without explicit authorization.

## Workflow

1. Work on `dev` only.
2. Move forward within Release 448; do not create parallel build tracks.
3. Run System Gate on the exact resulting head and require `devilndove-site-dev` Pages success on that same SHA.
4. Use read-only D1/R2 verification before recovery or migration.
5. Apply a current Development migration only with exact Development targeting and proof; never claim it applied from source inspection.
6. Carry deferred I.T. tests forward automatically instead of freezing releases.
7. Keep Production untouched without explicit authorization.
8. Keep this file, `PROJECT_STATUS_AND_ROADMAP.md`, `development-release.json`, `LIVE_TESTING_GUIDE.md` and the I.T. page synchronized as state changes.
