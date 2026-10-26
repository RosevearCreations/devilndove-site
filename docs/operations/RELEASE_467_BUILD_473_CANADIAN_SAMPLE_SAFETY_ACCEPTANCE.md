# Devil n Dove Build 473 — Canadian Physical Product Sample & Label Safety Review

## Outcome and hard boundary

The existing `/admin/maker-product-safety/` worksheet now includes **a real-physical-sample review for each selected product category**. It reuses Build 462's exact authenticated Product GET; Build 473 introduces **zero additional D1, R2, supplier, external publishing or database calls**, no schema migrations and no writes. The new panel does not render a safety approval, compliant badge, automatic product release or Health Canada certification. The product's physical/legal acceptance remains **HOLD** until evidence actually exists and qualified review determines applicability.

## Owner-run physical review

1. Load an **actual saved Product** by exact ID from the Canadian Product Safety & Label Review screen. If the existing Product source fails, changes or is not found, the new physical-sample review resets. A stored product category is never a regulatory classification.
2. Select its true use/audience, including **children under 15 for jewellery** where marketing or appearance warrants it; a **3+ or adult collector plush label does not alone exempt a toy**. For mixed categories, inspect under each applicable regime separately.
3. Enter a **real sample ID** and **lot/material/batch record**. Mark "sample in hand" only if physically present. Compare the actual **printed and affixed label**, not merely a digital draft, for product identity, quantity, dealer details, appropriate English/French and relevant warnings, subject to actual legal scope/exemptions.
4. Inspect the category-specific real article and related test/QA receipts:
   - **Jewellery/metal:** origin/finish/clasps, skin contact; child-directed products require specific lead/cadmium limits and competent component test reports, with small-part/ingestion assessment.
   - **Candles:** complete representative burn, vessel/wick, heat, stability, ingredients and visible burning warnings. Determine applicable candle requirements from actual design.
   - **Soap/cosmetics:** actual INCI/ingredients and formula, classification and claims, packaging/label, lot hygiene and actual Cosmetic Notification Form where applicable. Notification is **not product approval**; assess the timing in relation to first Canadian sale.
   - **Resin/fabrication:** actual cure, structure and claims (skin/food/heat/child use). If selling uncured resin kits rather than cured art, separately evaluate the **Consumer Chemicals and Containers Regulations, 2001**, including hazards, labels and child-resistant packaging as applicable.
   - **Plush/soft toys:** intended and foreseeable age, seams, stuffing, detachable eyes, ornaments and gold dove emblem, flammability/coatings/toxicity, and applicable textile/filling requirements or exclusions. Do not assume collector language makes an article exempt.
5. For each question, choose **not examined**, **personally examined with original source reference**, **observed defect/concern**, or **specialist pending**. The second state is *an observation, not a legal pass*. Any defect is flagged `STOP / HOLD`; unanswered questions remain HOLD, and expert items require independent specialist interpretation even when someone typed a report ID.
6. Download optional **private local JSON** for our operator files. It includes bounded IDs, source links, statuses, HOLD reasons, and explicit `certified:false`, `publication_authorized:false`. It creates **no server receipt**. Never enter URLs with secrets, passwords, customer personal data or health records. Original evidence belongs in the maker, QA, supplier and owner trial sources, not in the local checklist.

## Primary Canadian reference points (checked October 25, 2026)

- [Health Canada — CCPSA overview](https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/canada-consumer-product-safety-act-guide.html)
- [Competition Bureau — prepackaged non-food label content](https://competition-bureau.canada.ca/en/labelling/prepackaged-non-food-consumer-products/what-must-be-label)
- [Health Canada — children's jewellery](https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/guide-children-jewellery/guidance-document.html)
- [Health Canada — candle safety](https://www.canada.ca/en/health-canada/services/healthy-living/your-health/products/candle-safety.html)
- [Health Canada — cosmetic labelling](https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/labelling-cosmetics.html) and [cosmetic notification](https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html)
- [Health Canada — toy and soft-toy safety](https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/industry-guide-safety-requirements-children-toys-related-products-summary/guidance-document.html)
- [Competition Bureau — stuffed/filled textile articles](https://competition-bureau.canada.ca/en/labelling/textile-labelling/guide-labelling-stuffed-or-filled-textile-articles)
- [Health Canada — example of uncured resin-kit chemical-labelling enforcement](https://recalls-rappels.canada.ca/en/alert-recall/various-new-classic-resin-products-recalled-due-improper-labelling)

Guides must be checked against the *current* law and actual product. This worksheet is neither legal advice nor a substitute for qualified laboratory testing or official regulatory interpretation. Products for private therapy may remain private; no implied conversion to commercial inventory.

## Acceptance separation and regression

- Software release gate: source, CI, protected `dev/main` and independent live Pages proof all GREEN.
- Physical sample and legal gate: **HOLD** until owner's original actual label and sample inspection, relevant qualified lab results, applicable law and any necessary third-party approval are independently established.
- Run `node --test scripts/release467_build473_canadian_sample_safety.test.mjs scripts/release467_build462_maker_product_safety.test.mjs` and syntax-check the two Build473 modules.
- No new D1 database, migration, query, R2 bucket, Stripe/Etsy/Meta request, automatic publication, customer action or synthetic sample.

Next queued Build 474: Real Order Fulfillment, Damage/Returns & Customer Consent Trial II, subject to genuine owner/customer evidence and manual-only external actions.
