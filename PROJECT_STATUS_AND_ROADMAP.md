# Devil n Dove Project Status and Roadmap — Build 250

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture, data authority, fallback and deployment rules. This file owns current progress, known risks and the ordered next work.



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
