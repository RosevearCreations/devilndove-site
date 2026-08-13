# Devil n Dove Project Status and Roadmap — Build 257

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture, data authority, fallback and deployment rules. This file owns current progress, known risks and the ordered next work.





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

