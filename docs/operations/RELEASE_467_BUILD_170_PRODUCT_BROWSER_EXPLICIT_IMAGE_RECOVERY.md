# Release 467 Build 170 — Product Browser Explicit Image Recovery

## Baseline

Build 170 starts from the fully GREEN Build 169 Development/Production checkpoint at exact SHA `d5428c6a275849f217223b9269cd025358c80ddd`.

## Purpose

Continue the Product administration rewrite by removing the remaining automatic secondary D1 work from the compact Products page. Build 168 made fallback image recovery bounded to visible Products missing a featured image; Build 170 makes that recovery fully operator-triggered and limited to one Product per request.

## Changes

- A fresh `/admin/products/` page performs one bounded Product Browser query only.
- Products whose row already contains `featured_image_url` render that image without a secondary D1 image lookup.
- Products without a featured image show the recovery placeholder and an explicit **Recover photo** action.
- Pressing **Recover photo** checks only that Product's existing `product_images`, media-role assignment, then media-asset references.
- The fallback image endpoint requires `operator_triggered: true`, `featured_missing_only: true`, and exactly one Product ID.
- The fallback image endpoint never re-reads the `products` table and never lists R2.
- Successful and unsuccessful photo checks remain browser-session state only; no Product or image row is mutated.
- A failed photo recovery never retries automatically. The Products list remains usable and the operator may explicitly retry.
- Product Browser page/session caching, Search, Previous/Next, deliberate Refresh, browser-to-editor display handoff, Product Editor authority-before-save, Build 169 lazy QA, and Build 166 public Product/image stabilization remain intact.

## D1 / mutation boundary

This is a schema-free code build. There is no D1 business-data migration, Product mutation, Product-image mutation, R2 listing/mutation, provider execution, payment/refund mutation or accounting mutation.

## Acceptance

Build 170 must pass:

- `scripts/release467_build170_gate.py`
- retained Build 169 Product QA/editor convergence proof
- retained Build 168 Product low-read handoff proof
- retained Build 166 Product editing/image stabilization proof
- JavaScript syntax checks
- exact-head System Gate and Development Preview
- Current Application Quality Proof
- I.T. Admin Runtime Proof
- Repository Branch Hygiene
- retained authenticated Product browser regression proof

Promotion to `main` is non-force only after exact Development GREEN. Production then requires the exact Production Pages deployment, Product route/browser proofs and Production Live Resource Integrity proof before Build 170 may be called GREEN.