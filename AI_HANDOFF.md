# Build 257 current handoff

The current code release is Build 258. The current D1 migration boundary remains Build 256: `database_build256_media_content_studio.sql` / byte-identical `database_upgrade_current_pass.sql`, applied after Build 255. Build 258 fixes Media Studio inspection under the site-wide anti-framing CSP without weakening security: the selected static page is fetched same-origin, sanitized into a script-free `srcdoc` copy, and inspected there. The global `_headers` policy remains `X-Frame-Options: DENY` plus CSP `frame-ancestors 'none'`. Build 257's static-only scope, curated page directory, and product/inventory/tool/supply exclusions remain authoritative.

# Devil n Dove AI Handoff — Build 257

This is the **first of two canonical current project files**. Read this first for architecture, data authority, safety, schema and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for current status, known risks and the ordered next work. Historical Build prose under `docs/archive/build-history/` is frozen evidence and does not override these two files.

## Build 246 retained foundation

Build 246 repairs the live Product Editor lifecycle and extends D1-backed production integrity. A query-opened product now retains its edit identity so **Update Product** cannot lose the selected product; the chosen SEO/social image is visibly marked and preserved server-side; product deletion distinguishes meaningful business/project history from empty auto-generated Content Studio/CAIP shells, allowing those unreviewed shells to be removed automatically while reviewed/published history still blocks destructive deletion. Creative Projects may now be deleted through an explicit audited workflow that returns only **unreversed** raw inventory consumption. Finished products that are made outside a Creative Project gain an idempotent Production Release that deducts reviewed consumables, preserves material/ingredient snapshots, records evidence-only reusable/log-only resources, and increments finished-product inventory without double-posting. Product Resources now carry optional label-ingredient/INCI profiles; linked soap packaging can seed those verified ingredient facts, use a curated French **draft** workflow with human review, and is locked to the approved `soap_reference_v2` visual direction rather than invented rough ingredient claims. CAIP skips exact same-project media duplicates instead of inserting duplicate rows.

## Current system authorities

| Concern | Authority |
|---|---|
| Product identity and sellable facts | D1 product/catalog tables + Product Editor |
| Product editor gallery | D1 `product_images`, recoverable from linked D1 media/history; `products.featured_image_url` remains the featured-image field |
| Product SEO/social image | D1 `product_seo.og_image_url`; independent of the supporting gallery and preserved when the editor temporarily has no field value |
| Tool/supply master catalog | **D1 `catalog_items`** |
| Operational stock/reservations/movements | **D1 `site_item_inventory` + movement/usage tables** |
| Legacy tool/supply JSON | Read-only provenance/emergency fallback; never a normal mutable runtime authority |
| Tool/supply classification | Lower-case D1 `tool` / `supply`, editable through Inventory Operations |
| Material depletion policy | `site_inventory_usage_profiles` + stock/usage conversion; exact/estimated consume, log-only/reusable do not |
| Finished-product material/ingredient history | `product_production_runs` + `product_production_run_materials` immutable snapshots |
| Product label-ingredient mapping | `product_resource_ingredient_profiles` linked to `product_resource_links` |
| Creative Project process/material/time evidence | Creative Automation / Creative Process D1 tables |
| Creative Project destructive delete audit | `creative_project_deletion_audit`; unreversed project inventory is compensated before deletion |
| Creative media, rights and story evidence | CAIP |
| Private Creative Project originals | CAIP D1 metadata + private `CAIP_PRIVATE_MEDIA_BUCKET` |
| Packaging/label project state | Labeling & Packaging D1 authorities + `PACKAGING_STUDIO.md` |
| Purchased/source material authority | D1 `packaging_source_material_templates` + `packaging_source_material_metadata` + project/formula links; supplier evidence remains distinct from finished-product facts |
| Public managed media metadata | D1 `media_assets` + `managed_media_metadata` |
| Explicit page image/background placements | D1 `media_content_slots` + active `media_content_assignments` |
| Owner-published static page text overrides | D1 `managed_content_blocks`; authored HTML remains fallback |
| French label generation evidence | `packaging_translation_reviews`; machine/curated output remains a draft until human review |
| Content packages | Content Studio |
| Publication approval/provider reconciliation | Release Board / Social Queue / provider records |
| Launch gates | `startup_readiness_items` + history |
| Cross-project architecture/deployment | **This file** |
| Current status/next steps | **`PROJECT_STATUS_AND_ROADMAP.md`** |

Mutable business state belongs in D1 whenever a live table exists. JSON and Markdown may be fixtures, provenance, fixed specialist design authority or release evidence, but must not compete with D1 as a second mutable source of truth.

## Product edit, image and deletion rules

1. A Product Editor opened by URL/query/focus must persist the same numeric product ID through form submission; Update must never fall back to “No product selected” when the product is visibly loaded.
2. Gallery, featured and SEO/social image roles are distinct. The editor should show which image is the SEO/social image, and a blank client field must not erase an already-reviewed `product_seo.og_image_url`.
3. Supporting media is non-destructive: `product_images` is preferred, with recovery from non-deleted `media_assets`, active media-role assignments and image annotations. Up to seven unique editor images are presented.
4. Product deletion may automatically clean **unreviewed generated project shells** that contain no meaningful workflow/review/publication/evidence/output state. A meaningful Content Studio/CAIP project remains a blocking business/history reference and must be handled explicitly.
5. Posted finished-product production history is a deletion blocker. Archive or reverse/detach according to the business workflow rather than silently discarding production evidence.



## Build 257 static Media Studio scope and page-directory rule

`/admin/media-content-studio/` is **not** a Product Editor, inventory editor, supply editor or tool editor. Those specialist records remain owned by Product Editor / Inventory Operations. Build 257 therefore excludes `product_id` media, media typed/sourced as product/inventory/supply/tool, and R2 keys under product/inventory/supply/tool prefixes from Media Studio API results. The browser also ignores dynamic product/catalog/inventory mounts when inspecting a static page shell. Do not reintroduce these specialist records merely because they share the underlying `media_assets` table.

Administrators should not type page URLs for normal use. `public/data/media-content-page-catalog.json` is the curated owner-facing directory of known editable static/public presentation pages. It is validated against real static `index.html` entries by `scripts/build_media_content_page_catalog.py`. Shared Header/Navigation, Footer and Site Background assignments use the special internal page path `@site`; the public manifest returns those shared assignments first and page-specific assignments second so an explicit page override can win. Friendly labels must be shown in the UI; raw paths/keys remain implementation detail. Media Studio assets and the public runtime are cache-busted to `v=257`. Build 257 is code-only and does not advance the D1 migration boundary beyond Build 256.

## Build 256 Media & Content Studio / Packaging rule

`/admin/media-content-studio/` is the owner-facing authority for public media metadata, explicit page placements and selected editable page text. D1 tables `managed_media_metadata`, `media_content_slots`, `media_content_assignments`, `managed_content_blocks` and `media_content_change_audit` are the mutable authority. A normal public page must never enumerate R2. The browser requests `/api/public-media-content-manifest?path=...`, which reads only bounded D1 rows. R2 listing is allowed only through the explicit bounded admin Sync action and must preserve assignments and authored metadata. Existing authored/catalog media always remains in place unless an administrator explicitly assigns a managed media item to one exact registered slot. Safe delete performs a server-side active-assignment recheck.

Packaging Studio Build 256 adds a review-first **Create draft from Amazon link** action for soap bases, waxes, essential/fragrance oils, colourants and micas. Amazon-derived data is a convenience draft, never an approval authority: supplier/manufacturer INCI/SDS/allergen evidence must be reviewed before the source template is marked verified. Soap ribbon rendering uses `soap_reference_v3`, with fixed English ingredient, front oval/artwork, French ingredient, rear seal and claims/net-weight zones; ingredient/claim text is clipped inside its own zone. Packaging Studio and Media Studio load `v=256` assets.

## Build 255 Packaging Material Library rule

`/admin/packaging-studio/` must expose the Material Library even when no label project is selected. A purchased material template owns its own supplier identity, family/subtype, base/fragrance/colourant/additive role, optional colour swatch, raw supplier declaration, structured Master INCI/source ingredient rows, allergen evidence, supplier benefits/claims and review state. **Do not require the current label project's ingredient table to create a source template.** `packaging_source_material_metadata` provides flexible classification without changing the original Build 248 source-type CHECK constraint. `packaging_project_ingredients` and `packaging_project_claims` are the general structured-content authority for soap, candle, bath/body and other packaging; soap-specific tables remain compatibility mirrors. Packaging Studio HTML must load cache-busted `styles.css?v=255` and `admin-packaging-studio.js?v=255`.

## Build 254 Startup Readiness / Smoke runtime rule

The 46-gate **instruction guide is static release data** in `data/site/startup-readiness-guide.json` and the browser bundle. D1 remains authority only for mutable readiness status, owner, due date, evidence, blocked reason and history. `/api/admin/startup-readiness` must use the compact `startup_status_v2` contract and must not rebuild/return the full guide or Markdown report after each save. Browser-only recovery changes synchronize with one bounded `sync_items` batch, and successful saves return compact patches. `/api/admin/post-deploy-smoke-tests` must never create schema during GET/POST; Build 254 installs its table/indexes through D1 migration. Quick-run URLs are same-origin only and result inserts are batched.

## Build 250 Product Edit image and usage rule

Product Edit must clear stale media fields **before** resolving the selected product's featured/gallery images. The editor then restores `products.featured_image_url` first and falls back to the first recoverable gallery/media image, matching the storefront's D1-backed media authority instead of showing a false “no picture” state. Product-resource “How much per use / batch” is the quantity a finished item consumes; it is independent of how many usage units one stock unit contains. New links default to **1 use**, including reusable tools configured as 1 stock item = 100+ uses. Save reads the visible field immediately before POST and the API reads the saved links back from D1 so the editor can verify the persisted fractional value.

## Build 249 inventory-kit and component rule

A purchased kit/bundle remains a purchase/provenance inventory record until deliberately opened. `inventory_kit_templates` describes its expected child contents; `inventory_kit_template_components` defines quantity, stock/usage units, tracking mode, inventory class and optional cost-share percentage. **Open / Break Down Kit** reduces the parent kit count and releases each child as its own normal `site_item_inventory` balance. Existing child stock receives a weighted-average unit cost; newly created child rows retain their kit provenance. Reusable tools/equipment use reusable tracking and are evidence-only when later assigned to a product, while wax, fragrance, colourant, wicks and packaging can be consumed normally.

`inventory_item_profiles` is the structural classification authority for raw material, consumable, packaging, reusable equipment, kit, component, finished good, sample/test material, waste/scrap and other. Lot/expiry/source-material flags are recommendations layered over the existing purchase-lot and Packaging Studio systems, not competing stock authorities. A premixed essential-oil/fragrance bottle is **one inventory item**; its supplier-listed constituent oils/INCI/allergen evidence belongs in the linked source-material record rather than being represented as six bottles that were never purchased.

## Inventory, Creative Project and finished-production rules

The inventory model remains fractional and auditable:

```text
D1 catalog_items
  descriptive master
        ↓
D1 site_item_inventory
  actual stock/cost/reservation state
        ↓
usage profile + movements
  exact/estimated/log-only/reusable effect
```

A Creative Project delete may return only project consumption that has **not already been reversed**. The delete preview calculates the return, the operator uses the explicit `DELETE AND RETURN <project_key>` confirmation when inventory is involved, D1 quantities are compensated, correction movements are written, and an immutable deletion audit is saved. The finished product itself is not silently deleted; meaningful linked outputs/handoffs still block the project delete until deliberately handled.

A finished product made without a Creative Project uses **Finished Product Production Release** under Product Resources. Preview first. The release converts usage units to stock units, deducts only supply rows configured for exact/estimated tracking, records tools/reusable/log-only rows as evidence without depletion, blocks insufficient stock or missing active inventory, and blocks label ingredients that are marked required but have no INCI value. The POST is idempotent and uses expected-previous-quantity guards so one production event cannot normally be double-consumed by a browser retry/concurrency race. It stores immutable material and ingredient snapshots with the production run and then increments finished-product quantity.

## CAIP integrity rule

Private raw Creative Project media remains separate from approved/public media. Exact fingerprint/size duplicates within the **same Creative Project** are skipped at intake instead of creating duplicate upload rows/parts. Cross-project duplicates remain warnings because one source file may legitimately support more than one project. Raw media remains immutable; derivatives, proxies, frames, transcripts and exports are separate objects.

## Packaging and soap-label rule

### Source-material inheritance rule

A **Purchased Source Material** is not the same object as a finished soap formula. Soap bases, fragrance oils, colourants and additives keep their supplier/source identity and evidence in `packaging_source_material_templates`. A project attaches those records through `packaging_project_source_materials`, including a source snapshot for audit context. A saved finished formula may link one `soap_base` as its inherited base through `packaging_formula_source_material_links`; fragrance oils, colourants and additives remain separate project inputs so their lot/source/compliance evidence is not hidden inside the base.

The supplier's ingredient wording is preserved exactly as source evidence, but it is not promoted to verified INCI merely because it appears on a marketplace/product page. Master INCI rows carry review status. Supplier benefits and claims are displayed as source evidence and can only be copied into the finished-product claim editor as **unapproved draft claims** for deliberate review. A source image or supplier document URL is reference evidence only and must not become public product media automatically.

For Canadian cosmetic work, keep ingredient/allergen review current before print. As of 2026-08-01, new cosmetics are subject to Canada's expanded fragrance-allergen disclosure list when the applicable rinse-off/leave-on threshold is exceeded. The source-material model therefore keeps fragrance supplier allergen data and review status separate and blocks print-readiness when an attached fragrance source has not been reviewed. See the official Health Canada cosmetic ingredient-labelling guidance linked from Packaging Studio and `PACKAGING_STUDIO.md`.

Soap ribbon design is locked to the approved `soap_reference_v2` direction. Applying the approved Glacial Purple reference changes the **visual treatment only** and must not invent formula, ingredient, claim, warning or net-quantity facts. Formula/ingredient facts come from reviewed Product Resources / production evidence.

Required soap ingredient rows use INCI as the ingredient-list authority. English/French display text may be stored for clarity, but generated French is always a **draft** with provenance in `packaging_translation_reviews`; it is not automatically approved. The UI may draft common identity, warning, claim and display wording, but a human reviewer must approve wording before print/release. The renderer deliberately shows `INCI INGREDIENTS REQUIRED — DRAFT NOT FOR PRINT` when verified ingredient facts are absent rather than inventing filler text.

## Admin authentication and error/fallback rule retained

Build 245 degraded-auth resilience remains current: explicit 401/403 may clear the local cached session; temporary 5xx/timeouts/Worker-limit conditions retain the provisional admin shell and show degraded status. Every admin API still authenticates server-side. Safe GETs may deduplicate and use bounded retry/backoff/stale read-only continuity; writes are never automatically replayed. Cloudflare HTML failures must be detected before JSON parsing and surface HTTP status/Ray evidence rather than raw `JSON.parse` errors.

## Build 246 schema boundary

For production D1:

1. Back up D1 / record a recovery point.
2. Confirm Build 245 has been applied successfully.
3. Apply **one** of:
   - `database_build246_product_project_production_packaging.sql`; or
   - byte-identical `database_upgrade_current_pass.sql`.
4. Do not apply both current SQL files.
5. Confirm ledger key `build246_product_project_production_packaging`.
6. Run read-only `BUILD246_D1_VERIFICATION.sql`; review any missing INCI rows, duplicate active inventory identities or foreign-key failures it reports.
7. Deploy matching Build 246 code and hard-refresh so service-worker shell **v23** and Build 246 admin scripts load.

Build 246 creates `creative_project_deletion_audit`, `product_resource_ingredient_profiles`, `product_production_runs`, `product_production_run_materials` and `packaging_translation_reviews`, plus supporting indexes/settings. It uses no TEMP-table or destructive table-removal operations. `database_full_schema.sql` is the complete supported fresh-install aggregate; `database_schema.sql` and `database_store_schema.sql` remain scoped historical/overlay schemas and must not be treated as complete fresh-install authorities.

## Public/mobile/SEO guardrails

Every public pass verifies exactly one H1, a clear truthful title, useful meta description, canonical, crawlable descriptive internal links, descriptive alt text, resolvable/crawlable media, mobile content parity and valid structured data. Admin pages remain `noindex,nofollow` and should also retain a single H1. Use real Southern Ontario/local offer wording naturally; never create doorway pages or claim guaranteed first-page placement. Product SEO/social imagery should reflect the actual product and remain stable after edit/reload.

## Current documentation rule

The two cross-project current authorities are only:

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` are compatibility pointers. Specialist documents remain where they own implementation/testing details. Historical Build release prose is archived and frozen rather than repeatedly rewritten.

## Build 251 — Product Editor image runtime repair

- Fixed `ReferenceError: normalizeImageKey is not defined` in `admin-create-product.js`.
- Saved featured/gallery/recovered product media can now reach the existing image manager instead of the manager aborting during render.
- `/admin/products/` and `/admin/catalog/` explicitly load the corrected bundle with `?v=251` to bypass stale browser/CDN copies.
- Product-detail remains the image authority: stored featured image first, then gallery/media/history recovery when required.
## Build 252 — Inventory Operations unit preset runtime repair

- Fixed `ReferenceError: unitPresetOptions is not defined` in `admin-site-item-inventory.js`.
- Inventory Operations now has a synchronous default unit-preset list before the async bootstrap request runs, so first render cannot crash while authentication/bootstrap data is still loading.
- The defaults intentionally mirror `/api/admin/inventory-bootstrap`; the server response can still replace the list after load.
- `/admin/inventory-operations/`, `/admin/mobile-inventory/` and the inventory panel on `/admin/products/` now load `admin-site-item-inventory.js?v=252` to bypass stale `v=245` browser/CDN copies.
- No D1 migration is required for Build 252.

## Build 253 — Linked resource names and inventory form reset clarity

- Saved Product Resource links now resolve their human-readable tool/supply name directly from D1 inventory first, then catalog fallback; the external/source key remains the identity but is no longer the normal dropdown label.
- Linked resource bootstrap also carries stock/usage metadata so a linked tool outside the current search result still keeps its configured conversion such as `1 tool = 100 uses`.
- The browser preserves server-provided link names/resources when the linked item is outside the current 240-result resource search.
- Inventory item editing now exposes three distinct actions: Save/Add, **Start New Item**, and **Clear / Reset Fields**. Full clear also removes stale catalog-search and Amazon-import helper values.
- Product Resources and Inventory Operations bundles are cache-busted to `v=253` on affected admin pages. No D1 migration is required for Build 253.

