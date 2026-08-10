# Devil n Dove Project Status and Roadmap — Build 246

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture, data authority, fallback and deployment rules. This file owns current progress, known risks and the ordered next work.

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

- Build 246 must still be proven against **production D1/R2** after migration; static/synthetic tests do not prove every historical record shape.
- Product deletion intentionally remains blocked when Content Studio/CAIP/production references contain meaningful reviewed/published/history evidence. A future UI should let the owner inspect and resolve those references from one place before deletion.
- Creative Project deletion returns unreversed raw consumption, but a separately released finished product or external output is intentionally not silently undone. Reversal/detach workflows need explicit owner actions.
- Finished-product production reversal is schema-ready through run status fields but does not yet have the same polished audited UI as posting.
- Ingredient profiles require operator review. Historical products may have incomplete INCI names, percentages/order or allergen evidence.
- Curated French generation is not a certified translator and remains review-required before print/release.
- The approved soap-label renderer is substantially closer to the approved reference, but physical printer/wrap proof and owner visual acceptance remain launch evidence.
- CAIP exact duplicate protection currently relies on fingerprints/size already available at intake; browser-side SHA-256 and cross-device rename detection should be strengthened.
- Cloudflare Worker/D1 limits can still exist independently of application optimizations; retain Ray IDs for any remaining 503/1102 incidents.
- Local first-page search placement cannot be guaranteed. Continue measuring real query/page/Business Profile outcomes after deployment rather than relying on static SEO scores alone.

## Next 20 steps after Build 246

1. Back up production D1, apply Build 246 once, run `BUILD246_D1_VERIFICATION.sql`, and save the resulting ledger/foreign-key/ingredient/duplicate evidence.
2. Re-test the exact products that previously showed false Content Studio/CAIP delete blockers and verify only empty generated shells are auto-cleaned while meaningful history remains protected.
3. Add a Product Delete Reference Inspector that lists every blocking Content Studio, CAIP, production/order/history reference with a direct Open/Resolve action before deletion.
4. Run a Creative Project deletion test that has real fractional material posts, verify unreversed stock is returned exactly once, and verify a repeat/delete retry cannot return inventory twice.
5. Add an audited Finished Production **reversal** UI that returns raw consumables and decrements finished quantity only when the run has not already been reversed or sold/committed downstream.
6. Add lot-aware material selection/costing to production runs so resin, wax, fragrance, mica, wire, chain and similar stock can retain actual lot/cost provenance.
7. Add an Inventory **Usage Setup Required** queue for historical supplies still using generic `unit`/`log_only`, prioritizing high-value/high-use materials for real stock-unit/usage-unit conversions.
8. Add a Product Ingredient Review queue for label ingredients missing INCI, ordering, French review or required supporting facts before packaging release.
9. Add current cosmetic/fragrance-allergen review fields/gates to the soap/cosmetic packaging workflow and keep claims from being inferred from Amazon/source descriptions.
10. Add a Packaging French Review cockpit with source/draft/approved text side-by-side, reviewer/date/history and no publish/print approval while required translations remain unreviewed.
11. Add a visual/reference-diff checkpoint for `soap_reference_v2` and complete a real physical soap wrap/print proof against the pre-approved label reference.
12. Strengthen CAIP browser-side SHA-256/fingerprint capture so duplicate raw media can be recognized even when filenames change.
13. Complete direct browser-to-private-R2 multipart signing/resume so large CAIP media avoids Worker request-body/CPU pressure.
14. Add CAIP proxy/thumbnail/frame/audio/transcript processors and bounded processing queues with retry/dead-letter evidence.
15. Add a Media Integrity Review queue for products where recoverable R2/D1 media roles disagree with current gallery/featured/SEO selections.
16. Build the D1-backed Website Media Library intake for `PRODUCT_MEDIA_BUCKET/uploads/website-library/`, including thumbnail review, page/product assignment, alt text and role approval.
17. Add a Classification Review queue for likely tool↔supply mistakes and keep all controlled classifications lower-case/case-insensitive without lower-casing human/external display values.
18. Add a physical-count/adjustment workflow for correcting historical quantities with reason, actor, before/after values and movement evidence rather than overwriting stock silently.
19. Deploy and measure Search Console/Business Profile/local conversion outcomes; improve titles, single H1s, copy, internal links and real product/process imagery from evidence, not keyword stuffing.
20. Complete remaining production smoke gates: payments/refunds, email delivery, D1 restore drill, R2 private/public separation, mobile/desktop deployed screenshots, CAIP large-media interruption/recovery and controlled launch evidence.

## SEO/local-search direction each pass

Keep one clear H1 on every exposed page, concise truthful title/description/canonical, searcher language in the title/main heading/opening content where natural, crawlable descriptive internal links, descriptive alt text and real product/process imagery near matching text. Mobile must preserve the same primary content and image meaning as desktop. Local copy should describe the real Southern Ontario offer/service area and real pickup/shipping/custom options; do not manufacture location pages or competitor promises. Use Search Console and Business Profile evidence after deployment to prioritize changes.

## Documentation sanity rule

Only `AI_HANDOFF.md` and this file are cross-project current authorities. Compatibility pointer files should remain short. Specialist documents own specialist implementation. Old Build changed-files/validation/verification prose belongs in `docs/archive/build-history/` and must not be treated as current work.
