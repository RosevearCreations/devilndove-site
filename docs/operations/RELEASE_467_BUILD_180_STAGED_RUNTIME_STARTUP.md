# Release 467 Build 180 — Staged Runtime Startup

Build 180 is a code-only responsiveness follow-up to Build 179. It addresses the remaining browser-freeze risk visible in the public Product detail page, Media & Content Studio, and the large Inventory Operations workspace.

## Changes

- The bounded Product detail request starts immediately from the body-end Product script, before optional cart/recently-viewed/trust helpers execute.
- Product detail remains one bounded `/api/product-detail-core` read with the existing 8-second AbortController fail-fast contract.
- Media Studio paints the selected page editor first, then schedules the live D1 image-plan read during browser idle time.
- Media Studio renders the image-plan checklist in 40-row batches instead of building the entire checklist DOM at once.
- Inventory physical-count review no longer auto-loads 40 large editable cards during Inventory Operations startup. The operator explicitly chooses **Load 40-item queue**.
- Below-fold Inventory operational mounts use `content-visibility:auto` and intrinsic sizing so the browser can defer layout/paint until a panel approaches the viewport.
- Build 179 viewport containment, Product shared-snapshot behavior, image-quality scoring, and Inventory authorities are preserved.

## Safety boundary

This is a code-only runtime/presentation build. There is **no migration** and no automatic D1 business-data mutation. It introduces no R2 mutation, provider execution, publication, payment/refund action, accounting posting, inventory count write, or usage-profile write. Existing explicit operator mutations remain unchanged and continue to require their established controls.

## Acceptance

Build 180 is acceptable only when:
1. Build 180 source gate passes.
2. retained Build 179 runtime gate passes.
3. retained Build 166 Product delivery gate passes.
4. retained Build 440 Inventory integrity and asset URL regressions pass.
5. System Gate, Current Application Quality, I.T. Admin Runtime, and Repository Branch Hygiene are GREEN on the exact Development SHA.
6. The exact verified Development SHA is promoted non-force to `main`.
7. Production Pages, live-resource integrity, Product Production Browser/route proofs, and Build 180 proof are GREEN on that exact Production SHA.
