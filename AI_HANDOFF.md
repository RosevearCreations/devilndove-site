# Devil n Dove AI Handoff — Build 277

This is the **first of two canonical current project files**. Read this first for architecture, data authority, safety, schema and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for current status, known risks and the ordered next work. Historical Build prose is evidence only and does not override these two files.

## Current release and migration boundary

The current code release is **Build 277**. The retained broad D1 feature-migration boundary remains **Build 264** (`database_upgrade_current_pass.sql`). Focused migrations applied after it are Build 269 for CAIP duplicate/integrity support, Build 274 for auditable Creative Process timeline corrections, and Build 276 (`database_build276_packaging_inventory_inci_capacity.sql`) for reference-only Inventory identity on structured Packaging Studio ingredients. Build 276 does **not** create Inventory movements; actual material consumption remains in Creative Process/production. Builds 270–273, Build 275 and Build 277 are code/documentation/UI hardening with no D1 migration. Older production databases that still used `payment_refund_id` also require the one-time Build 266 refund compatibility repair before Build 264 can complete. The TMDB movie helper still requires the encrypted Cloudflare secret `TMDB_READ_ACCESS_TOKEN`; the token must never be returned to browser code.

## Build 277 Packaging bilingual ingredient authority and long-list rule

1. Structured Packaging Studio ingredient rows may reference `site_item_inventory.site_item_inventory_id` for **identity, supplier/source traceability and reusable Material Library lookup only**. Packaging Studio must never reserve, consume, decrement or estimate Inventory quantities from that link.
2. Selecting an Inventory ingredient such as mica imports its linked Material Library Master INCI when available. If no verified source template exists, the row may be linked but print approval remains blocked until the INCI is entered and reviewed.
3. Applying a source-material template propagates the linked Inventory ID to every inherited constituent row. One purchased blend/base can therefore be the source for multiple printed INCI rows without pretending those constituents are separate stock items.
4. Owner presentation preference in Build 277 is **two visible ingredient declarations**: a dedicated English `INGREDIENTS` panel and a dedicated French `INGRÉDIENTS` panel. Structured rows remain the source of truth, French wording must be reviewed/saved, and print approval is blocked if either complete language list exceeds its tested panel capacity. Build 276's one-list/continuation rendering is retired; do not silently clip either language.
5. Do not replace an essential-oil/fragrance mixture with the marketing phrase “Essential Oil scent.” Where the mixture is functioning as fragrance and the source evidence supports it, the regulatory declaration may use `Parfum`; fragrance allergens that exceed the applicable Canadian disclosure threshold remain individually disclosable and the source allergen review must remain complete.
6. Build 277 increases claim separation again: the printed icon-to-text gap is wider, icon rows have non-overlapping vertical centres, and the editor uses larger horizontal column gaps.

## Build 274 Creative Process lifecycle and correction rule

1. Creative Process has one explicit lifecycle for maker and content-only work: **Concept & estimate → Do & document → Review actual materials → CAIP media/evidence → Story/Content Studio → Complete/archive**. Content-only work may consume inventory and incur cost without ever creating a sellable Product.
2. Material/ingredient quantity and cost entered in a normal timeline event are **planning/estimate facts only**. They never alter Inventory. Inventory changes only after a reviewed material is explicitly posted or the operator uses the clearly labeled “Actual inventory used now” shortcut and confirms the material was physically used.
3. Posted inventory is audit data. Never hard-delete a posted usage row. `void_event` reverses any active inventory post through the existing compensating movement/reversal tables, unselects the event as evidence, then marks the timeline event `voided`. `correct_inventory_use` reverses the original post, voids the superseded event and creates/posts a new corrected event.
4. Active timeline totals, evidence selection and material-review queues exclude voided events. Voided/corrected entries remain visible in collapsed history for forensic/accounting continuity.
5. Timeline editing is allowed while an event has no active inventory post. If inventory has been posted, use the correction/undo path first so material facts and stock ledgers cannot diverge.
6. The Admin Dashboard keeps **Website Media & Content Studio** separate from **Creative Project Workflow** because they have different authorities: the former owns static/public site placements; the latter coordinates Creative Process → CAIP → Content Studio. Release tooling is surfaced primarily through **Release & Go-Live Center**, while individual deployment stages remain available as advanced tools.
7. Public SEO remains people-first/evidence-first. Admin workflow pages are `noindex`; content-only stories must not invent products, transformations, local intent or unsupported outcomes.

## Build 274 timeline-entry operator meaning

Use timeline entries for meaningful project decisions/stages, not for every click or tiny action. Recommended semantics:

- `idea`: initial concept, question or possible direction.
- `research`: source/vendor/technique investigation or experiment assumptions.
- `planning`: planned recipe/material/tool/cost/time decision.
- `setup`: physical workspace/preparation before making/filming.
- `process`: an actual making/testing/filming step.
- `mistake`: failed attempt, defect, safety/quality issue or unexpected result.
- `repair`: correction/recovery after a mistake or failed attempt.
- `milestone`: meaningful checkpoint worth preserving.
- `result`: observed output/outcome; a content-only result may simply be footage/findings rather than a Product.
- `lesson`: reviewed learning or recommendation for the next project.
- `material`: generated by the direct actual-inventory shortcut; it represents real physical usage, not a plan.

**Reviewed timeline materials** are a three-stage control: (1) the timeline material is the plan/estimate; (2) material review records the actual quantity, waste/reusable amount and approved cost without changing stock; (3) explicit posting maps that reviewed material to a real Inventory row and records the stock/usage movement. The direct actual-use shortcut combines those stages only when the operator confirms the material has already been physically used.

## Build 273 Creative Process / CAIP / Content Studio bridge rule

1. A standalone/social Creative Process project is one project identity. **Do not create a second project in Content Studio.** Content Studio now lists existing `creative_work_projects`, creates/refreshes a package with `content_projects.source_type=creative_project`, and attaches that package to the existing CAIP row whose identity remains `creative_projects.source_type=creative_work_project`.
2. Content Studio may create a **draft** package before timeline evidence is selected so already-uploaded CAIP media becomes visible as private/reference-only archive rows. Evidence/story approval and public release remain separate human gates.
3. Creative Process is Inventory/time/cost/project-fact authority; CAIP is private source-media, technical observation, evidence, story and derivative-plan authority; Content Studio is channel-deliverable/package authority. The Automatic Output Blueprint is a destination/status dashboard across those authorities, not a renderer.
4. Inventory selection in Creative Process is type-searchable. Filtering changes presentation only; posting still uses the existing inventory ID, unit-conversion, reusable/log-only and reversal rules.
5. Standalone Content Studio copy is project-journal/evidence-first and must not invent a sellable product, force local SEO wording into unrelated personal/social projects, or imply a transformation/outcome not supported by reviewed evidence.
6. Private CAIP originals stay private/reference-only in Content Studio. A missing public URL is not an upload failure and must be represented by a visual placeholder until a reviewed public derivative/promotion exists.
7. Current high-value CAIP work after Build 273 is footage review with timecode evidence, transcript/proxy provider verification, story-spine generation from approved evidence, and then reviewed release/calendar/analytics handoff.

## Build 271 CAIP operator clarity

- The Creative projects sidebar now has an **Open CAIP project** selector sourced from `creative_projects`, so standalone/social projects without a Content Studio package remain selectable.
- The Content Studio selector is explicitly secondary and is used only for create/refresh from `content_projects`.
- Derivative plans are no longer truncated to six display rows; the full list is scrollable and pending plans sort first.
- A new operator guide explains upload vs safe probe vs immutable derivative plan vs plan approval vs evidence vs story structure.
- A derivative plan remains optional and does not render or publish media.
- No Build 271 D1 migration is required; Build 269 remains the focused CAIP schema boundary.

## Build 270 CAIP recovery-state presentation

- Multipart integrity failures remain preserved for audit but are separated from normal project media.
- Historical 87%/105-of-121 progress is labeled as non-running forensic state.
- **Re-upload source safely** creates the new recovery row/R2 key; the damaged multipart object is never resumed.
- Once a newer canonical recovery exists, the older failed row collapses out of the normal API view.
- No Build 270 D1 migration is required; Build 269 remains the CAIP schema boundary.

## Build 269 CAIP standalone/social intake, dedupe and integrity rule

1. Productless Creative Process projects are first-class CAIP workspaces. A social/content/research project may use Inventory and incur internal project cost without ever producing a sellable Product. Creative Process remains inventory/cost authority; CAIP remains private-media/evidence/story authority; Content Studio remains handoff/package authority.
2. `caip_media_upload_files.file_fingerprint` is a **legacy metadata fingerprint**. Build 269 adds `content_fingerprint`, `content_fingerprint_version` and `recovery_of_file_id`. The preferred duplicate-prevention identifier is `sample_sha256_v1`, derived from exact file size plus bounded start/middle/end SHA-256 samples. It is filename-independent and memory-bounded; it is not a whole-object legal/archive checksum.
3. Same-project intake must classify a selected source before binary transfer: registered match → skip; uploaded binary without asset → registration-only; active match → resume; latest integrity-failed match → create a new recovery row/object; otherwise → new upload. One raw binary may support many evidence/story/content references.
4. Multipart `complete()` is forbidden until actual D1 part rows prove: row count, uploaded+ETag count and distinct count all equal `expected_parts`; first part is 1; last part is expected; and uploaded byte sum equals `file_size_bytes`. `[CAIP_MULTIPART_INCOMPLETE]` is a fail-closed condition and must never be repaired by merely copying expected counters into uploaded counters.
5. After valid R2 complete, exact R2 HEAD size is required before `upload_status='uploaded'` and before Creative Asset registration. `[CAIP_R2_SIZE_MISMATCH]` means clean source re-upload is required; `Retry CAIP registration` is only for a verified complete private object.
6. Existing complete private R2 uploads may be upgraded to `sample_sha256_v1` through small bounded HEAD + ranged-read batches. This is the preferred way to strengthen Project 23 and other existing footage without re-uploading multi-gigabyte originals.
7. Physical redundant-R2 deletion remains stricter than intake dedupe: require no linked CAIP/downstream references and equal **verified whole-object checksum**. Sample fingerprints alone never authorize deletion.
8. Build 269's CAIP screen exposes the project-first path: Project/Inventory context → Raw Media → Evidence Review → Story Structure → Content Studio Handoff. It does not claim proxy/transcript/AI provider work is complete when only plans exist.

## Build 267 CAIP reconciliation and duplicate-cleanup rule

1. A verified private R2 object is the binary authority. A later D1/CAIP metadata-registration or screen-refresh failure must never force that binary to upload again.
2. `Retry CAIP registration` is metadata-only. It may relink an already-created `creative_assets` row, promote an older failed intake row to uploaded when R2 HEAD verifies the expected size, and tolerate absent optional technical-observation/processing-plan tables.
3. The intake POST response keeps a successful requested action successful even if rebuilding the full recovery screen later fails; that later condition is returned as `refresh_warning`, not HTTP 400.
4. The CAIP Media Audit groups **probable** duplicates by project + stored intake fingerprint + file size. Archiving duplicate recovery rows is review-driven and non-destructive to R2. Physical R2 deletion is allowed only when the redundant row has no linked CAIP/downstream references **and** both canonical and redundant copies have the same verified content checksum. Metadata fingerprints alone are not sufficient for binary deletion.
5. Archived duplicate rows stay in D1 for audit history and are hidden from normal Project Upload Recovery. Never enumerate the whole private R2 bucket merely to clean one project; reconcile against bounded D1 project rows and targeted R2 HEAD/delete calls.

## Build 264 content, movie, merchandising and project-first CAIP rule

1. `/admin/media-content-studio/` is a static-site presentation editor. The Website Areas panel must never clip its lower entries. Shop static presentation is editable, but individual Product/Inventory/Supply/Tool records remain under their specialist editors.
2. Home `What we make, find, and experiment with` has six editable cards (title, body, destination link and background colour), three editable visuals, and three editable Build-182 visual-polish tiles. Filtered Home category links route directly to Shop product results, which move above the explanatory/support sections while a filter is active.
3. Product/storefront imagery uses full-frame `contain` presentation rather than cropping edited images to fill cards.
4. `/admin/public-display-order/` is the owner authority for explicit Home Featured, Art/Gallery and Creations ordering. Pin + lower rank wins. This is an editorial merchandising choice, not an inferred popularity metric.
5. Movie metadata can be filled from TMDB through `/admin/movies/`. Search/preview are server-side; the normal behavior fills blank metadata only. UPC/edition/physical-cover/value/collection notes remain Devil n Dove facts and are not replaced unless explicitly requested.
6. Every Creative Process project can own a CAIP workspace even with no sellable product. Research/experiment/content projects can upload raw media through CAIP, record direct Inventory usage/cost, assign an internal cost purpose, select reviewed evidence, and then create the normal Content Studio/social package handoff. Reusable/log-only resources can contribute per-use cost without reducing stock; consumables use the existing inventory conversion/posting rules.
7. Build 264 does not automatically publish or treat raw CAIP media as public. Review/privacy/rights/evidence gates remain authoritative.

## Build 263 My Printers / soap-oval alignment rule

Packaging Studio printer selection comes **only** from persistent `packaging_printer_profiles` (the owner-facing **My Printers** list). Never scan Inventory, tools, supplies, printer parts or print-test history to populate the label-printer dropdown. One active My Printers profile may be marked `is_default_label=1`; the Print Test screen should auto-load its Letter paper, margin, gap, scale, rotation and settings note. The operating-system print dialog remains the final physical output step.

The soap front oval keeps the botanical rose on the left and a deliberately left-justified wording block immediately beside it. The wording block is positioned as a visual unit with the rose rather than centered independently in the oval. Preserve the bounded two-line family/product hierarchy and keep clear space before the inner circular maker seal.

## Build 262 Packaging Studio library / print-layout rule

Material Library is selection-driven: show the source-template dropdown and only the active template, never every template expanded at once. Saving a source-material template synchronizes its Master INCI rows into the reusable `packaging_content_library` ingredient choices; fragrance/essential-oil and colourant source templates also become reusable dropdown entries. Preserve the source template as the supplier evidence authority and do not duplicate it manually.

Print Test uses Devil n Dove printer profiles rather than attempting direct operating-system printer control. Candidate printer names come from Printer inventory and prior print-test history; per-browser saved profiles retain Letter paper, margin, gap, scale and auto-rotation preferences. `sheetPlan()` must test portrait/landscape and optional 90-degree rotation and choose the arrangement with the highest count on 8.5 × 11 inch paper without silently shrinking exact-size labels. The system print dialog remains the final printer selector.

Build 277 restores the owner-requested bilingual side-panel arrangement. The current soap ribbon has a dedicated **French `INGRÉDIENTS` panel** and a dedicated **English `INGREDIENTS` panel**. Structured ingredient rows drive both lists; French values may be drafted by the helper but must be reviewed and saved. Claims begin lower in their panel, the net-weight separator/line stays separated from claims, the centre title remains paired with the botanical rose, and ingredient text remains bounded to printable safe zones. If either complete language list cannot fit legibly within its tested panel capacity, print approval must fail and an extended reviewed label method is required.

## Build 261 Packaging Studio inventory/claims/layout rule

Packaging Studio is inventory-first. Components & Cost must start with a type-to-search Inventory selector and reuse saved item name, SKU, supplier and unit cost instead of asking the owner to duplicate those facts. Material Library must first look for an existing `inventory_source_material_links` source template and then reuse current inventory/source metadata; Amazon is only a fallback for missing source evidence. New Amazon-linked inventory source-material entries preserve the returned packaging source draft into the existing Packaging Source Material tables so later label work does not require another marketplace fetch. Older inventory records may contain only the basic Amazon URL/image/name because earlier builds discarded the packaging-specific preview payload; those records can still seed a source template from current inventory facts and receive supplier/INCI evidence manually.

The Claims tab is the owner-facing reusable claim library. `packaging_content_library` remains the D1 authority for bilingual claim text and icons; claim presets are added to a label explicitly and remain subject to review. Components are responsive cards rather than a wide table. Soap labels render with the corrected `soap_reference_v3` geometry. Build 277 uses the two bounded ingredient clips as separate English and French ingredient declarations, alongside the wrapped front family/title, widened claim-icon spacing and separate net-quantity band so text cannot cross decorative rules.

## Build 260 Media Studio request-budget rule

`/admin/media-content-studio/` must not bootstrap page slots, the media library and selected-media usage in one Worker request. Opening or changing a website area loads only that area's explicit D1 slots (`mode=page`). The public site-media picker loads only when an image slot is opened (`mode=media`), in bounded keyset-paginated pages of 48 records. Existing-use details load only for the selected image (`mode=uses`). Do not reintroduce the Build 259 `limit=180` all-in-one bootstrap or per-row assignment-count correlation. Handled Media Studio code/D1 exceptions return structured HTTP 500 JSON; reserve HTTP 503 interpretation for true service/platform failures rather than masking application errors as service unavailability.

The media picker remains limited to static/public site media. Product/finished-product, inventory, supply and tool media continue to belong to their specialist editors and remain excluded server-side.

## Build 259 explicit site-slot rule

`/admin/media-content-studio/` is a visual website-presentation editor. `public/data/media-content-slot-catalog.json` is the owner-facing authority for known static page slots. Public HTML contains stable `data-media-slot`, `data-media-background-slot` and `data-content-slot` attributes. Existing authored images/text remain the default; only explicit D1 assignments/published overrides replace them. Empty visual opportunities use branded SVG placeholders under `assets/placeholders/media-content/`. Admin-only public-page edit links deep-link directly to the exact Media Studio slot. There is no page scanning, iframe inspection, or browser slot registration in the current workflow.

The catalog contains 29 static/public page areas plus shared `@site` positions and explicitly excludes shop/product, inventory, supplies, tools, account, checkout and admin routes. Dynamic product/catalog grids on Gallery/Creations are not Media Studio content. Collections, Creations and Art/Gallery use their existing site imagery as the default managed visuals.

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

Packaging Studio Build 256 adds a review-first **Create draft from Amazon link** action for soap bases, waxes, essential/fragrance oils, colourants and micas. Amazon-derived data is a convenience draft, never an approval authority: supplier/manufacturer INCI/SDS/allergen evidence must be reviewed before the source template is marked verified. Soap ribbon rendering uses `soap_reference_v3`. Historical Build 256 introduced the two ingredient-side zones around the front oval; Build 277 restores those zones to dedicated English/French ingredient declarations while retaining Build 276 Inventory traceability and fail-closed long-list handling. Ingredient/claim text remains bounded to its safe zone. Packaging Studio and Media Studio load `v=256` assets.

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


## 2026-08-17 D1 production-parity note

Current auth authority is `users` + `sessions`. Production retains `members_legacy` + `member_sessions_legacy` solely for preserved historical/blog dependencies; `blog_posts.author_member_id` and `blog_comments.member_id` reference `members_legacy`. Do not rerun the retired legacy auth migration and do not drop those compatibility tables until blog ownership is explicitly migrated. Build 269 aggregate schemas and verification now encode this parity state.

## Build 272 — CAIP intake readiness guard
- CAIP private upload now exposes a prerequisite/readiness contract before `create_session`.
- Required production D1 columns: `caip_media_upload_files.content_fingerprint`, `content_fingerprint_version`, and `recovery_of_file_id` (Build 269 migration).
- Required Production Pages R2 binding: `CAIP_PRIVATE_MEDIA_BUCKET`.
- If readiness is false, the operator UI disables **Select and Upload** and names the exact prerequisite rather than allowing a generic POST 400.
- Build 272 has no new schema migration; it depends on `database_build269_caip_social_project_dedupe_integrity.sql` being applied once to production D1.

## Build 275 — Packaging source inheritance and label presentation repair

Packaging Studio now treats an attached purchased/source base as the project ingredient authority at apply time, not merely as browser-only source evidence. Applying a source material such as the Goat’s Milk soap base synchronizes its reviewed `master_inci` rows into `packaging_project_ingredients`, updates project INCI/English/French fallback strings, and preserves supplier claim suggestions only as unapproved draft claims. The Ingredients tab includes **Reload from attached base** for older projects whose source was attached before this repair.

French packaging support remains draft-only and human-reviewed. The browser can now reconstruct structured rows from an attached base (or, as a final fallback, the INCI text field) before creating a French draft, and the curated helper includes common Goat’s Milk soap display wording. INCI remains the ingredient-list authority; generated French is never legal/compliance approval.

Soap title typography now uses the same script stack used by the Rosevear Creations / Devil n Dove brand wording, with bold weight for the main soap identity. Claim icons/text have additional horizontal separation in both the editor and rendered label. Product rose direction now exposes a visual quick palette of actual botanical rose assets (white, pink, cream, yellow, coral, orange, peach, green, blue, brown, black, grey, silver, gold, copper and bronze) in addition to named product presets and the advanced asset selector.

Build 275 requires **no D1 migration**; it changes how existing Packaging Studio tables are populated and rendered. Cache-bust Packaging Studio CSS/JS to `v=275`.
