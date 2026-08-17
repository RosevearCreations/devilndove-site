# Devil n Dove Project Status and Roadmap — Build 267

## Build 267 completed work — CAIP registration recovery and duplicate reconciliation

1. Retry CAIP registration now works strictly from an existing private R2 object and no longer re-uploads the binary. Older failed/uploading rows are promoted to uploaded when targeted R2 HEAD verifies the expected object size.
2. If an earlier retry already created the canonical `creative_assets` row but failed before linking `caip_media_upload_files.creative_asset_id`, Build 267 relinks it instead of creating another asset.
3. Optional technical-observation and processing-plan schema drift no longer blocks the canonical private CAIP asset. These downstream records are best-effort and can be repaired later.
4. Successful CAIP POST actions no longer become HTTP 400 merely because the subsequent screen-state refresh fails; the response returns `refresh_warning` instead.
5. Direct upload is idempotent around R2: if the correct-size binary is already present, registration continues without another PUT. If R2 storage succeeds but later metadata work fails, the endpoint returns `binary_stored=true` and `registration_pending=true` instead of telling the browser that the binary upload failed.
6. Added **CAIP media audit & duplicate cleanup** to Creative Assets. Probable duplicate intake rows are grouped by project/fingerprint/size; the owner can archive redundant D1 recovery rows. Physical private-R2 deletion is offered only for redundant rows with no linked downstream references and an equal verified content checksum. Nothing is deleted automatically.
7. Added read-only `BUILD267_CAIP_PROJECT23_AUDIT.sql` for the current Project 23 investigation. Build 267 is code-only; no new D1 migration is required.

### Highest-value next work after Build 267

- Deploy Build 267 and retry registration on one Project 23 row that already shows 100% uploaded. It should return a registration result or a specific pending diagnostic without another binary upload.
- Open the new duplicate audit, archive obvious redundant recovery rows first **without R2 deletion**, and confirm the recovery list becomes clean.
- Only use physical R2 duplicate deletion when Build 267 marks the copy checksum-verified and unreferenced. Keep uncertain/private originals.
- After Project 23 is reconciled, continue the CAIP evidence → Content Studio/social-package workflow.

## Build 264 completed work — editable Home/Shop, movie metadata, project-first CAIP and merchandising order

1. Media Studio Website Areas no longer clips Collections/lower entries; Shop static presentation is now part of the managed site-content catalog while product/inventory/supply/tool records remain excluded. The catalog now contains 30 owner-facing areas and 543 explicit static slots.
2. Home now has two additional editable visuals; all six What-we-make cards expose title, description, destination and background colour; all three Build-182 visual-polish tiles expose kicker, heading, message and colour.
3. Category links from Home open filtered Shop results at the top of the Shop experience, ahead of Recently Viewed and explanatory/support sections while an active intent/filter exists. Shop hero/content/collection/policy presentation fields are Media-Studio editable.
4. Storefront product imagery now uses full-frame `contain` presentation so edited product photos are not unintentionally cropped to a corner/side.
5. Added `/admin/public-display-order/` with separate pin/rank authority for Home Featured, Art/Gallery and Creations. Existing fallback ordering remains when no explicit priority is saved.
6. Added review-first TMDB movie lookup. Search + movie/credits/external-ID/video detail can fill empty title/year/genre/director/cast/runtime/studio/IMDb/poster/trailer/synopsis fields while preserving physical-copy facts. Requires encrypted Cloudflare secret `TMDB_READ_ACCESS_TOKEN`.
7. Research/experiment/content Creative Projects now automatically get productless CAIP workspaces. Creative Process can record Inventory usage directly, allocate per-use cost, save an internal content/research/project-development cost purpose, and jump straight to CAIP raw-media upload for the selected project.
8. Productless projects retain material-usage/cost-analysis outputs and can proceed through reviewed evidence to the existing Content Studio/social-package handoff without inventing a sellable product.
9. Added additive D1 migration `database_build264_content_project_merchandising.sql`; `database_upgrade_current_pass.sql` is byte-identical.

### Highest-value next work after Build 264

1. Production-test one existing research/experiment project: confirm CAIP workspace, upload one disposable video/photo fixture, record one consumable and one reusable Inventory use, then create a reviewed Content Studio handoff.
2. Set `TMDB_READ_ACCESS_TOKEN` in the production Pages secrets and test two known movie titles before batch-filling the movie shelf.
3. Use Public Display Order to pin/rank a small Home Featured/Gallery/Creations fixture and verify each surface is independent.
4. Continue expanding Media Studio only for genuinely static/public presentation slots; keep product, inventory, supplies and tools in specialist editors.

## Build 263 completed work — My Printers-only label output and tighter oval composition

1. Removed Inventory and print-test-history discovery from Packaging Studio printer selection. The Print Test dropdown now contains only persistent **My Printers** records.
2. Added `packaging_printer_profiles` with paper, margin, gap, scale, auto-rotation, settings notes, active state and one `Default for labels` flag.
3. Added Save/Remove My Printer controls and automatic loading of the default label-printer settings.
4. Moved the soap front wording block closer to the botanical rose and changed the block to left justification while keeping the combined rose/text composition balanced inside the oval.
5. Bumped Packaging Studio assets/API to Build 263. Build 263 requires the additive `database_build263_packaging_my_printers_label_alignment.sql` migration.

### Highest-value next work after Build 263

- Add the two real workshop printers to **My Printers**, mark the normal label printer as default, and enter its measured non-printable margin/settings.
- Hard-refresh Packaging Studio and confirm no Inventory/tool/printer-part names appear in the Print Test dropdown.
- Print one crowded soap label at Actual Size / 100% and verify that the left-justified wording block now sits close enough to the rose without colliding with the maker seal.

## Build 262 completed work — active material templates, reusable source ingredients, printer profiles and soap print fit

1. Changed Material Library so the source-template dropdown is the primary navigator and only the active template is expanded/edited.
2. Changed Individual Ingredients / Fragrance-Essential-Oil Blends / Colourants into a dropdown-driven reusable library instead of an always-expanded card list.
3. Saving a source-material template now synchronizes its Master INCI rows into reusable ingredient records; saved fragrance/essential-oil and colourant source templates also become reusable choices automatically.
4. Added Print Test printer-profile selection from printer inventory, prior print tests and locally saved profiles with paper, margin, gap, scale and auto-rotation settings. Browser printing still uses the operating-system print dialog for the final physical printer selection.
5. Added a Letter-sheet packing planner that evaluates portrait/landscape and optional 90-degree label rotation, then uses the highest-count exact-size arrangement on 8.5 × 11 inch paper.
6. Refined `soap_reference_v3`: French ingredients now print left of the oval and English ingredients right; ingredient clips are tighter; claims start lower and are more compressed; the weight separator/net-quantity line is lower; the centre title wraps/centres against the rose; and the small circular seal is enlarged with smaller wording.
7. Cache-bumped Packaging Studio CSS/JavaScript to Build 262. Build 262 is code-only; the D1 migration boundary remains Build 259.

### Highest-value next work after Build 262

- Deploy and hard-refresh Packaging Studio, then confirm one long soap-base template shows only its active source card and that its INCI rows appear in the reusable ingredient dropdown after save.
- Save profiles for the printers actually used in the workshop, enter each printer's realistic non-printable margin, and run the optimized Letter-sheet test before recording a production print test.
- Print the most crowded soap label at Actual Size / 100% and verify the left French ingredients, centre rose/title/seal, right English ingredients and lowered claims/net-weight strip on the physical label stock.
- Continue Media Studio production verification independently; Build 262 changes only Packaging Studio and its API.

## Build 261 completed work — Packaging components, claims, inventory-source reuse and label fit

1. Replaced the wide Packaging Components table with responsive component cards; the first field is a type-to-search Inventory selector.
2. Selecting an inventory item reuses its name, SKU/reference, supplier, stock status and unit cost while preserving the packaging quantity/waste fields as project-specific data.
3. Reworked Material Library to use Inventory first. Existing linked source templates open directly; otherwise saved inventory/source metadata pre-fills a source template. Amazon is collapsed into an explicit fallback only for missing evidence.
4. Going forward, an Amazon-reviewed inventory source material preserves the `packaging_source_draft` returned during Inventory entry into the existing Packaging Source Material tables and links it back to that inventory item. This prevents repeated Amazon retrieval for the same purchased material.
5. Moved the reusable bilingual Claims database into the Claims tab with visible leaf/hands/recycle/heart icons, Add-to-label actions, and a simple custom-claim editor.
6. Rebuilt current label claim rows as responsive cards rather than a wide row table.
7. Tightened the soap ribbon SVG to `soap_reference_v3`: bounded ingredient clips, wrapped family/title text, smaller identity/subtitle text, four compressed bilingual claims, and a protected net-quantity strip above the decorative bottom rule.
8. Cache-bumped Packaging Studio and the shared Inventory editor to Build 261.
9. Build 261 is code-only. The current D1 migration remains Build 259.

### Highest-value next work after Build 261

- Deploy and test Components & Cost with a real packaging supply already in Inventory, then reload the packaging project to confirm the BOM values persist.
- Open one existing soap-base inventory item in Material Library. If it already has a linked source template, confirm it opens without Amazon; otherwise use the saved inventory facts and add/verify supplier INCI evidence once.
- Print the corrected soap ribbon at Actual Size / 100% and record the print-test result, especially long ingredient lists and the claims/net-weight panel.
- Continue Media Studio production verification from Build 260 independently; no Media Studio behavior changed in Build 261.

## Build 260 completed work — Media Studio 503/runtime hardening

1. Split the authenticated Media Studio GET into three bounded modes: page slots, media-library pages and selected-media uses.
2. Opening or changing Home/About/etc. now loads only that page's explicit slots; it no longer retrieves the media library or media-use data at startup.
3. The site-media library loads only after **Choose image** and is limited to 48 records per request, with keyset **Load more** pagination.
4. Removed the per-media correlated assignment-count query from library search. Usage locations are requested only when **Details / uses** is opened for one selected image.
5. Removed the Build 259 `limit=180` bootstrap and the parallel multi-query `Promise.all` request path.
6. Kept the server-side exclusion of Product/finished-product, inventory, supply and tool media unchanged.
7. Cache-bumped only the Media Studio admin bundle/catalog request to `v=260`. The public slot runtime remains Build 259 because its behavior did not change.
8. Handled Media Studio query/update exceptions now return structured HTTP 500 JSON with explicit error codes instead of being mislabeled as 503, making a true Cloudflare platform 503 distinguishable.
9. Build 260 is code-only; the D1 migration boundary remains Build 259.

### Highest-value next work after Build 260

- Deploy Build 260 and confirm `/api/admin/media-content-studio?mode=page&path=/` returns normally before opening the image picker.
- Then open one Home image slot and confirm `mode=media&limit=48` loads the library; use **Load more** only if required.
- If a platform-generated 503 remains on the small `mode=page` request, capture the exact Cloudflare Ray ID/function log because the former heavy bootstrap will no longer be in that request path.
- Continue the original Media Studio specification with reusable managed galleries, version history/rollback and media-health scoring after the production endpoint is stable.

## Build 259 completed work — explicit visual website slots

1. Replaced Media Studio page scanning/registration with a deployment-seeded static site slot catalog.
2. Instrumented 29 known public/static areas with stable image, background and text slot selectors; current count is 454 active canonical slots including shared site positions.
3. Preserved existing authored images as defaults. Collections, Creations and Art/Gallery explicitly default to their existing imagery.
4. Added branded SVG placeholders only where a visual position had no appropriate existing image.
5. Added admin-only `Edit image` / `Replace placeholder` / `Edit text` deep links on managed public content.
6. Rebuilt `/admin/media-content-studio/` as a website map + direct slot editor; removed Scan selected area and Make scanned locations editable workflow.
7. Added inline image picker/upload-and-use workflow, Use original/default, text draft/publish/unpublish, metadata, replacement, archive and safe-delete controls.
8. Removed Media Studio public runtime from excluded shop/product, inventory, supplies, tools, account, checkout and admin routes.
9. Hardened Media Studio API filtering for product/catalog/finished-product/inventory/supply/tool media and associated R2 key patterns/roles.
10. Added Build 259 D1 migration to deactivate older scan-derived slots for canonical pages and seed the explicit slot definitions without deleting historical assignments/audit records.

### Highest-value next work after Build 259

- Deploy Build 259, apply the migration, then verify Home, About, Collections, Creations and Art/Gallery one slot at a time.
- Continue the original Media Studio specification with reusable managed galleries (Process, Technique, Evidence, Materials, Packaging, Workshop/Event), version history/rollback and media-health scoring without reintroducing product/inventory records into this Studio.
- Gradually replace intentional SVG placeholders with real workshop/site photography through Media Studio rather than source edits.

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture, data authority, fallback and deployment rules. This file owns current progress, known risks and the ordered next work.





## Build 258 completed work — CSP-safe Media Studio page inspection

1. Fixed the browser `frame-ancestors 'none'` violation triggered when Media Studio tried to frame a live Devil n Dove page for inspection.
2. Kept the global anti-framing policy unchanged (`X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`).
3. Media Studio now fetches the selected same-origin static page as HTML, rejects empty/unexpectedly large responses, strips scripts/forms/frames/objects/embeds/noscript, and builds a hidden script-free `srcdoc` copy for selector/background inspection.
4. A `<base>` element points the inert copy at the selected public URL so linked CSS/images resolve for layout/background discovery without running the page's JavaScript.
5. Cache-bumped the Media Studio page/script/catalog to Build 258.
6. Build 258 is code-only; the D1 migration boundary remains Build 256.
7. Build 258 focused regression passes 14/14 and Build 257 static-directory regression remains 37/37.

### Highest-value next work after Build 258

- Deploy Build 258 and confirm Home/About/Gallery scans no longer create CSP frame-ancestor console errors.
- Continue the managed Gallery/Process/Technique/Evidence collection work after the secure page-inspection path is confirmed live.
- Add version history/rollback for managed image replacement.

## Build 257 completed work — Static-only Media Studio and automatic site directory

1. Narrowed `/admin/media-content-studio/` to **static website presentation content only**; finished-product media, product/catalog records, inventory, supplies, tools and their specialist images are excluded from Media Studio search/results.
2. Enforced that boundary server-side: product-linked media, blocked source types and product/inventory/supply/tool R2 prefixes are filtered from media queries and cannot be assigned through this Studio.
3. Removed the normal manual page-path workflow and added `public/data/media-content-page-catalog.json`, a curated directory of 29 known static/public pages validated against the real application filesystem.
4. Added friendly quick choices for **Home, About, Gallery, Showcase / Creations and Workshop / Workroom**, plus the remaining landing, guide, contact, gift, event and policy pages.
5. Added first-class shared-site controls for **Header & Navigation, Footer and Site Backgrounds**, plus a direct **Home Banner / Hero** control. Shared placements use internal `@site` authority rather than requiring duplicate edits on every page.
6. Added section filtering for Banner/Hero, Main Content, Gallery/Showcase, Backgrounds, Header/Nav and Footer so owners can focus on the presentation area being changed.
7. Hardened page inspection to ignore dynamic catalog/product/inventory mounts such as gallery/shop grids; only the static presentation shell is registered for Media Studio editing.
8. Updated the public manifest to merge shared `@site` assignments with the current page, applying page-specific overrides after shared defaults.
9. Removed the Product media type and `products/` R2 sync prefix from this Studio while leaving Product Editor and Inventory Operations unchanged.
10. Added responsive Build 257 directory/site-area CSS, cache-busted Media Studio/public runtime assets to `v=257`, and added a catalog filesystem audit.
11. Build 257 is **code-only**. The current D1 migration boundary remains Build 256; no Build 257 migration should be applied.
12. Build 257 focused regression passes 37/37; Build 256 Media/Packaging regression remains 52/52 after the scope refinement.

### Highest-value next work after Build 257

- Deploy Build 257 and verify the curated page directory plus Header/Footer/Background shared assignments on one reversible test page.
- Continue the Media Studio specialist specification with reusable managed galleries (general, process, technique, evidence, materials, packaging, workshop/event) while continuing to exclude Product Editor and Inventory Operations data.
- Add a visual page/section preview or thumbnail chooser after the static slot model is proven live, so selecting “About → Maker Story” is even more visual.
- Add media replacement version history/rollback and richer audit/history UI.
- Integrate the managed Artwork filter directly into Packaging Studio pickers without exposing product/inventory media there.

## Build 256 completed work — Amazon source drafts, aligned soap labels, Media & Content Studio

1. Added **Create draft from Amazon link** directly inside Packaging Studio Material Library for soap bases, candle wax, fragrance/essential-oil blends, colourants and micas/pigments.
2. Amazon preview now infers material family/category, supplier/brand, ASIN/SKU, source URL, product image, likely colour swatch, exposed ingredient/allergen text and product-detail bullets; all imported fields remain `needs_review` until deliberately saved and verified.
3. Rebuilt the soap-ribbon renderer as `soap_reference_v3` with five fixed non-overlapping zones matching the approved reference hierarchy: English ingredients, front oval/artwork, French ingredients, rear seal, claims/net weight.
4. Added SVG clipping and a horizontal print-preview shell so long English/French ingredient lists and claims cannot bleed into neighbouring zones.
5. Added a clear soap alignment guide in Preview with a direct link to the approved reference image.
6. Implemented `/admin/media-content-studio/` with a numbered owner workflow: inspect/register a public page, choose/upload public media, edit media metadata/uses, then assign images or draft/publish text for exact page locations.
7. Added D1 authorities `managed_media_metadata`, `media_content_slots`, `media_content_assignments`, `managed_content_blocks` and `media_content_change_audit`.
8. Added explicit safe placement precedence: page inspection, uploads, metadata edits and R2 sync never change a live placement. Only an explicit assignment can replace one occupied slot, and removing it returns the page to authored/catalog content.
9. Added public per-page media/content manifest plus a lightweight runtime to apply only explicit assignments/published text, including a short MutationObserver window for dynamically rendered page elements.
10. Added page inspection for existing `<img>` elements, CSS image backgrounds and selected main/article text. The inspection runs only when an administrator requests it and registers stable selectors without publishing.
11. Added public media upload, metadata, alt/caption/tags, focal point, attribution/license/consent fields, assignment-state filtering, existing-use reporting, archive protection and server-side safe-delete recheck.
12. Added explicit bounded public-R2 sync in Media Studio; normal storefront requests never list R2.
13. Added same-key **Replace image file, keep placements** workflow with password step-up and public-manifest cache busting.
14. Installed the public Media Studio runtime on 56 existing non-admin HTML entry points and added direct Dashboard/Packaging Studio navigation to the new Studio.
15. Preserved the supplied Media & Content Management Studio specification under `docs/media-content/` as the implementation authority; future gallery/version/rollback maturity remains tracked there.

### Historical next-work list recorded at Build 256

- Live-deploy Build 256 and verify the D1 migration, Amazon preview behavior and Media Studio page inspection against production Cloudflare Pages/R2.
- Register a small representative page set first (Home, About/Story, Shop/collections, FAQ/support and one landing page), deliberately assign one reversible image/text override, then verify removal returns to authored content.
- Continue the attached Media Studio specification with reusable managed galleries (general, before/after, process, technique, evidence, materials, packaging, workshop/event), drag/reorder and publication rules.
- Add media replacement version history/rollback and richer audit/history UI after the core placement model is proven live.
- Integrate the managed Artwork filter directly into Packaging Studio pickers so label art can be selected without manual asset paths.

## Build 255 completed work — Packaging Material Library clarity and cross-product structured content

1. Fixed Packaging Studio stale asset URLs by bumping `styles.css` and `admin-packaging-studio.js` from `v=248` to `v=255`.
2. Rebuilt purchased/source-material cards and editor CSS with explicit responsive grid rules instead of relying on generic card styling.
3. Made the **Material Library visible without selecting a packaging project**, so bases/oils/colours can be entered before label work begins.
4. Added product-area and source-category metadata covering soap bases, candle wax/base blends, cosmetic bases, fragrance oils, essential-oil blends, colourants/dyes/micas, carrier oils/butters, botanicals and other additives.
5. Added optional colour swatches for colourant/source templates.
6. Moved source Master INCI editing into the source template itself; saving a purchased material no longer steals the current project's ingredient rows.
7. Added **Create draft rows from supplier text** plus add/remove source ingredient row controls.
8. Generalized base-role inheritance so a candle wax/base can act as a finished-formula base just like a soap base.
9. Generalized the Finished Soap Formula language/workflow to **Finished Formula / Recipe** while retaining soap compatibility.
10. Added `packaging_project_ingredients` and `packaging_project_claims` so structured label content persists for candle, bath/body and other package types, with legacy soap tables mirrored.
11. Seeded metadata for the existing Goat's Milk Melt & Pour source and backfilled existing soap structured content into the general packaging tables.
12. Added Build 255 D1 verification and regression coverage; Build 254 remains the runtime-hardening foundation.

## Build 254 completed work — Startup/Smoke 503 runtime hardening

1. Reduced `/api/admin/startup-readiness` from a full embedded 46-gate guide response to compact mutable D1 status/history only (`startup_status_v2`).
2. Single readiness saves now return one compact patch; browser-only recovery uses one bounded `sync_items` batch instead of one full-guide POST/reload per gate.
3. The full 46-gate guide is now maintained in `data/site/startup-readiness-guide.json`, synchronized to the browser fallback and generated `STARTUP_GO_LIVE_GUIDE.md`.
4. Removed request-time `CREATE TABLE` from Post-Deploy Smoke Tests; Build 254 migration owns smoke storage/index creation.
5. Smoke quick-run is bounded to same-origin URLs and stores collected results with one D1 batch.
6. Both admin UIs now report structured 503/degraded conditions and load cache-busted `v=254` assets.
7. Updated stale Startup foundation instructions to current migration/build-neutral language while retaining all 46 gates and browser recovery.
8. Build 254 regression passes 16/16; retained Builds 249–253 regressions and current public/asset audits remain green.

## Build 250 completed work — product images and per-use persistence

1. Fixed Product Edit clearing the resolved featured image after load; stale image slots are now cleared before the selected product's media is resolved.
2. Retained fallback from the stored featured image to the first recoverable product/gallery image, matching storefront media behavior.
3. Bumped Product Edit/Product Resources asset versions to avoid stale cached JavaScript after deployment.
4. Product Resource links now default to **1 use/batch** regardless of an inventory stock conversion such as 1 tool = 100 uses.
5. Save now reads the live visible `How much per use / batch` input immediately before POST, protecting fractional values from browser event-order timing.
6. Product Resources API now reloads persisted D1 links after save and returns them to the editor for save verification.
7. Build 250 migration normalizes historical null/non-positive resource usage quantities to 1 while preserving explicit fractional and larger quantities.
8. Added Build 250 regression coverage for media load ordering, gallery fallback, one-use defaults, fractional persistence, server read-back and cache-version changes.

## Build 249 completed work — kits, components and inventory structure

1. Added purchased **Kit / Bundle** templates that can be opened into separate usable inventory components.
2. Added component quantity/unit/tracking definitions so wax, colour, fragrance, wicks, containers and hardware remain independently usable after a kit is opened.
3. Added reusable-equipment handling for included pitchers, molds or tools so they remain equipment rather than being consumed by a finished product.
4. Added equal or percentage cost allocation and weighted-average child unit-cost updates.
5. Added immutable kit-opening provenance linking the original kit purchase to each child quantity/cost release.
6. Added general inventory classes: raw material, consumable, packaging, reusable equipment, kit, component, finished good, sample/test material, waste/scrap and other.
7. Added lifecycle plus lot, expiry and supplier-composition/source-material recommendations in the main inventory editor.
8. Added an inventory↔Packaging Source Material link table for future direct lot/source evidence integration without creating a second stock authority.
9. Clarified premixed essential/fragrance oils: one purchased bottle remains one inventory item while constituent oils/INCI/allergen evidence remains inside its source-material record.
10. Fixed the inventory-delete audit path referencing an undefined variable.
11. Kept Build 248 Packaging Studio behavior intact; Build 248 regression remains 85/85.

## Build 248 retained work — purchased source-material inheritance and compliance evidence

1. Added a D1-backed **Purchased Source Material** library distinct from finished soap formulas.
2. Added source types for `soap_base`, `fragrance_oil`, `colourant` and `additive`, each with supplier/product/SKU/source references.
3. Added source image and supplier-document URLs so packaging operators can keep visual/document evidence beside the reusable source template without making it public product media.
4. Added raw supplier ingredient declaration plus structured Master INCI rows with explicit review state; source wording is never silently declared verified INCI.
5. Added reusable source allergen statement, supplier benefits/characteristics, supplier claims, usage notes and compliance notes.
6. Added fragrance-allergen evidence rows and a review gate designed around the current Canadian 2026 expanded fragrance-allergen disclosure requirements.
7. Seeded the owner-provided Goat’s Milk Melt & Pour base with its nine supplier ingredient names, supplier allergen statement and six supplier benefit/characteristic sections.
8. Kept all seeded Goat’s Milk Master INCI rows in `needs_review` until actual supplier INCI evidence is verified; no plain-English ingredient name is promoted automatically.
9. Added project/source links with source snapshots and source-role separation so one base, fragrance, colourant and additive set can be reviewed independently.
10. Added finished-formula→source-base inheritance; a formula may inherit only a `soap_base` as its base, while fragrance/colour/additive sources remain separate project inputs.
11. Applying a soap-base template replaces the structured base ingredient rows and supplies Master INCI draft text; supplier claim suggestions enter as unapproved drafts only.
12. Added visual source-material cards, source image fallback artwork, attached-state badges, evidence/detail display and mobile single-column layouts.
13. Retained Build 247 label deletion, Truth-reference rendering, fixed ingredient clipping, reusable layout templates and complete rose/custom-colour controls.
14. Synchronized Build 248 into all aggregate schemas and kept `database_upgrade_current_pass.sql` byte-identical to the standalone migration.
15. Consolidated repository documentation: superseded root `BUILD*.md` copies were retired into `docs/archive/build-history/`; the two canonical current authorities remain this file and `AI_HANDOFF.md`.

## Build 247 completed work — Packaging Studio repair pass

1. Added permanent label/project deletion with typed project-key confirmation and child-record cleanup.
2. Rebuilt soap ingredient panel boundaries to match the approved Truth/reference hierarchy and prevent text from crossing the front oval.
3. Removed the purple-only soap artwork fallback and made the selected botanical rose the actual renderer authority.
4. Added the complete requested botanical rose palette plus arbitrary custom rose colour support.
5. Added the requested product→rose defaults, including Health Oatmeal & Goat Milk→oatmeal/cream/beige.
6. Added a visible Layouts & Templates gallery and retained save-as-template/repeat-job support.
7. Added persistent formula/content libraries for soap formulas, individual ingredients, fragrance oils, colourants and claims.
8. Seeded Health Oatmeal & Goat Milk with the owner-supplied 16-item ingredient list and preserved `*Organic` as a source/review note rather than an assumed per-ingredient flag.
9. Seeded Natural Ingredients, Handmade with Care, Gentle & Moisturizing and Please Recycle as bilingual reusable claims.
10. Added Build 247 migration/schema synchronization and regression/verification notes.

## Build 246 completed work — 20 repository-side advances

1. Fixed Product Editor query/focus loading so the visible selected product also sets the persistent edit ID used by Update Product.
2. Added defensive submit-time product-ID recovery from the form/current editor state so a loaded product cannot normally produce “No product selected for editing.”
3. Added an explicit SEO/social-image role in the seven-slot image manager, including a visible badge and `Use for SEO/social` action.
4. Preserved an existing reviewed `product_seo.og_image_url` server-side when an edit request temporarily omits/clears that client field, with featured image only as a true fallback.
5. Reclassified auto-created Content Studio product shells: empty/unreviewed generated shells no longer block product deletion merely because their rows exist.
6. Added the same bounded cleanup treatment for empty/unreviewed CAIP product shells while retaining meaningful project/governance/evidence/output references as deletion blockers.
7. Added `product_production_runs.product_id` to protected product business/history references so posted finished-production evidence cannot be silently deleted with a product.
8. Expanded Creative Project deletion preview so project-owned rows can be deleted intentionally while meaningful downstream/external output references still block the operation.
9. Added audited Creative Project deletion with compensation of only unreversed raw inventory consumption, correction movements and immutable `creative_project_deletion_audit` evidence.
10. Added Finished Product Production Release preview for products made outside Creative Projects, showing stock effect, blockers, evidence-only resources, ingredients and estimated material cost.
11. Added idempotent finished-production posting that converts usage units to stock units and deducts exact/estimated consumables without consuming reusable/log-only resources.
12. Added expected-quantity concurrency guards and compensation for partial posting so a production race cannot silently double-deplete stock or over-increment finished quantity.
13. Added immutable `product_production_runs` and `product_production_run_materials` snapshots so each finished release retains what materials/ingredients were actually posted at that time.
14. Added `product_resource_ingredient_profiles` and Product Resources fields for label-ingredient inclusion, English/French display wording, INCI, ordering and translation review state.
15. Linked soap packaging creation to reviewed Product Resource ingredient profiles so product-linked soap labels can start from actual product ingredient evidence rather than an unrelated formula placeholder.
16. Added curated French **draft** generation for applicable packaging identity/warning/claim/display fields plus D1 `packaging_translation_reviews` provenance and explicit human-review status.
17. Made INCI the required structured soap ingredient authority and removed the old hard-coded pseudo-ingredient/reference claims; missing verified ingredients render as `DRAFT NOT FOR PRINT` instead of invented facts.
18. Locked soap ribbon rendering/templates to the approved `soap_reference_v2` direction and changed “Apply Glacial Purple reference” to visual styling only, preserving formula, claims, warnings, quantity and product identity facts.
19. Added CAIP exact same-project fingerprint/size duplicate skipping so re-selecting the same source media does not create duplicate upload-file/part records; legitimate cross-project reuse remains a warning only.
20. Completed the supporting D1 migration/aggregate synchronization, lower-case object-name check, mobile/CSS treatment for changed controls, service-worker shell v23, release documentation consolidation and Build 246 regression coverage.

## Current position

The product lifecycle is now much closer to one auditable chain:

```text
raw tool/supply inventory
   ↓
Product Resources / Creative Project usage
   ↓
reviewed fractional consumption
   ↓
finished production run + immutable material/ingredient snapshot
   ↓
finished product inventory
   ↓
approved packaging/label evidence
   ↓
CAIP/Content Studio/public release
```

The Product Editor retains gallery/featured/SEO roles across reloads, and empty generated project shells should no longer falsely prevent product deletion. Project deletion can return unreversed inventory rather than stranding raw materials. CAIP same-project media duplicate prevention reduces a second corruption path.

## Known gaps and risks

- Supplier/source Master INCI rows intentionally remain review-required until the actual supplier documentation is checked; marketplace/plain-English ingredient text is provenance, not automatic regulatory truth.
- The seeded Goat’s Milk supplier allergen wording is intentionally flagged for review because the supplied statement calls itself an eight-major-allergen statement while naming seven categories and omitting milk even though the base contains goat milk; do not publish an allergen-free claim from that wording without supplier verification.
- Fragrance-oil templates need the supplier allergen breakdown/documentation before they can pass the new packaging fragrance review gate.
- Build 248 must still be proven against **production D1/R2** after migration; static/synthetic tests do not prove every historical record shape.
- Product deletion intentionally remains blocked when Content Studio/CAIP/production references contain meaningful reviewed/published/history evidence. A future UI should let the owner inspect and resolve those references from one place before deletion.
- Creative Project deletion returns unreversed raw consumption, but a separately released finished product or external output is intentionally not silently undone. Reversal/detach workflows need explicit owner actions.
- Finished-product production reversal is schema-ready through run status fields but does not yet have the same polished audited UI as posting.
- Ingredient profiles require operator review. Historical products may have incomplete INCI names, percentages/order or allergen evidence.
- Curated French generation is not a certified translator and remains review-required before print/release.
- The approved soap-label renderer is substantially closer to the approved reference, but physical printer/wrap proof and owner visual acceptance remain launch evidence.
- CAIP exact duplicate protection currently relies on fingerprints/size already available at intake; browser-side SHA-256 and cross-device rename detection should be strengthened.
- Cloudflare Worker/D1 limits can still exist independently of application optimizations; retain Ray IDs for any remaining 503/1102 incidents.
- Local first-page search placement cannot be guaranteed. Continue measuring real query/page/Business Profile outcomes after deployment rather than relying on static SEO scores alone.

## Next 20 steps after Build 249

1. Back up production D1, confirm Build 248 is already applied, apply Build 249 once, run `BUILD249_D1_VERIFICATION.sql`, and retain the foreign-key/kit/profile evidence.
2. Enter the actual supplier, SKU/product URL, product image/document link and verified INCI sheet for each purchased soap base; promote Master INCI rows only after source review.
3. Create reusable source templates for each regularly purchased fragrance oil and colourant, including supplier documentation and applicable fragrance-allergen evidence.
4. Run a real Oatmeal & Goat Milk packaging project from source base → finished formula → added fragrance/colour → physical label and verify inherited ingredients remain editable but traceable.
5. Add the Product Delete Reference Inspector that lists every blocking Content Studio, CAIP, production/order/history reference with direct Open/Resolve actions.
6. Run a Creative Project deletion test with real fractional material posts and prove unreversed stock is returned exactly once.
7. Add an audited Finished Production reversal UI with downstream sale/commit guards.
8. Add lot-aware material selection/costing to production runs and source-material project links so supplier lot/cost provenance survives into finished production.
9. Add an Inventory Usage Setup Required queue for historical supplies still using generic `unit`/`log_only`.
10. Add a Product Ingredient Review queue combining missing INCI/order/source evidence/fragrance-allergen review and required French review before packaging release.
11. Add a Packaging French Review cockpit with source/draft/approved wording side-by-side, reviewer/date/history and a hard print/publish gate.
12. Add visual/reference-diff evidence for `soap_reference_v2` and complete a real 100% physical wrap/print proof against the approved reference.
13. Strengthen CAIP browser-side SHA-256/fingerprint capture and cross-device rename detection.
14. Complete direct browser-to-private-R2 multipart signing/resume for large CAIP media.
15. Add CAIP proxy/thumbnail/frame/audio/transcript processors with bounded queues and retry/dead-letter evidence.
16. Add a Media Integrity Review queue where D1/R2 media roles disagree with gallery/featured/SEO selections.
17. Build the D1 Website Media Library intake with thumbnail review, assignments, alt text and role approval.
18. Add classification review plus physical-count/adjustment workflows with reason, actor, before/after values and movements rather than silent overwrite.
19. Deploy and measure Search Console/Business Profile/local conversion outcomes; improve descriptive titles, one prominent H1, internal links and real product/process imagery from evidence, not keyword stuffing or special “AI SEO” markup.
20. Complete production smoke gates: payments/refunds, email delivery, D1 restore drill, R2 separation, mobile/desktop screenshots, large-media interruption/recovery and controlled launch evidence.

## SEO/local-search direction each pass

Keep one clear H1 on every exposed page, concise truthful title/description/canonical, searcher language in the title/main heading/opening content where natural, crawlable descriptive internal links, descriptive alt text and real product/process imagery near matching text. Mobile must preserve the same primary content and image meaning as desktop. Local copy should describe the real Southern Ontario offer/service area and real pickup/shipping/custom options; do not manufacture location pages or competitor promises. Use Search Console and Business Profile evidence after deployment to prioritize changes.

## Documentation sanity rule

Only `AI_HANDOFF.md` and this file are cross-project current authorities. Compatibility pointer files should remain short. Specialist documents own specialist implementation. Old Build changed-files/validation/verification prose belongs in `docs/archive/build-history/` and must not be treated as current work.

## Build 251 — Product Editor image runtime repair

- Fixed `ReferenceError: normalizeImageKey is not defined` in `admin-create-product.js`.
- Saved featured/gallery/recovered product media can now reach the existing image manager instead of the manager aborting during render.
- `/admin/products/` and `/admin/catalog/` explicitly load the corrected bundle with `?v=251` to bypass stale browser/CDN copies.
- Product-detail remains the image authority: stored featured image first, then gallery/media/history recovery when required.
## Build 252 — Inventory Operations unit preset runtime repair

1. Fixed the Inventory Operations startup crash caused by `unitPresetOptions` being read during `render()` before it had ever been initialized.
2. Added a local default unit list matching the inventory bootstrap API so the page can render immediately and then accept server-provided presets after load.
3. Cache-busted the shared inventory admin bundle to `v=252` on Inventory Operations, Mobile Inventory and Products.
4. Added a regression that verifies helper initialization precedes render use, client/server unit presets stay aligned, the initial unauthenticated render does not throw, and all affected admin pages request the current bundle.
5. No schema/D1 change is required; the current migration boundary remains Build 250.

## Build 253 — Linked item naming and entry-reset usability

1. Product-resource bootstrap now resolves linked item display names from `site_item_inventory.item_name` with `catalog_items.name` fallback instead of forcing the external/source key into the selected-link dropdown.
2. The same bootstrap carries usage conversion metadata, protecting configured values such as 100 uses per reusable tool even when that linked item is outside the current search page.
3. Product Resources keeps the server-provided name/resource object when a live search result is unavailable.
4. Inventory Operations now has separate **Start New Item** and **Clear / Reset Fields** controls; the latter also clears catalog-search and Amazon-import helper inputs.
5. Shared affected bundles are cache-busted to `v=253`. No D1 migration is required; Build 250 remains the database migration boundary.
