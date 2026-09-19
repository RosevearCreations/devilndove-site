# Release 467 — Catalog Rework Plan, Builds 181–186

This plan continues the existing Product / Inventory / Tool / Image direction after Build 180 runtime stabilization. Each build is deliberately bounded so we do not recreate the old all-in-one admin page.

| Build | Focus | Primary outcome |
|---|---|---|
| **181** | Product / Inventory / Tool / Image Authority Health | Live D1-backed repair queue across catalog authorities, read-only and bounded. |
| **182** | Product Facts & Buyer Readiness | Improve Product descriptions, category/type consistency, pricing/stock visibility, buyer facts and direct repair routing while keeping the Product Browser compact. |
| **183** | Inventory & Tool/Supply Identity Cleanup | Normalize duplicate identities, supplier/source facts, usage mode, counts/reorder context and catalog-reference drift with explicit reviewed actions. |
| **184** | Product & Tool/Supply Image Repair Workflow | Unify missing-image, alt-text, role, image-source and R2 evidence review without merging static-site Media Studio into Product/Inventory media. |
| **185** | Product Resource / Cost / Usage Linkage | Repair Product-to-Tool/Supply links, quantity-per-use/batch, missing Inventory matches, lot/usage semantics and cost evidence. |
| **186** | Public Product & Search Proof | Revalidate Product detail, search/collection visibility, structured facts, image delivery, one-H1 SEO, accessibility and mobile performance against the cleaned authorities. |

## Rules carried through all six builds

1. Product Browser remains compact and low-read.
2. Product Editor remains one-Product-at-a-time.
3. Product Image Editor remains the finished-product media mutation authority.
4. Inventory Operations remains the Tool/Supply stock, cost, lifecycle and usage authority.
5. Static Website Media Studio does not absorb Product or Inventory media.
6. D1 is usable and should be proven where the work actually depends on it.
7. Production business data is Production-owned; Development is never copied wholesale over Production.
8. R2 repair is explicit, bounded and environment-safe.
9. Provider publication/payment lanes remain separate from catalog cleanup.
10. Every build gets exact-SHA Development and Production proof before it is called GREEN.


## Current execution checkpoint

- Build 181 — complete: live Product / Inventory / Tool / Image authority health.
- Build 182 — complete: Product Facts & Buyer Readiness.
- Build 183 — complete: Inventory & Tool/Supply Identity Cleanup.
- Build 184 — complete: Product & Tool/Supply Image Repair Workflow plus D1 quota hardening.
- Build 185 — complete: Product Resource / Cost / Usage Linkage.
- Build 186 — current: Public Product & Search Proof.
