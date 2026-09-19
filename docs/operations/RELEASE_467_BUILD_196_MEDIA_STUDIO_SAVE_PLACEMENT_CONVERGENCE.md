# Release 467 Build 196 — Media Studio Save-to-Placement Convergence

## Trigger and exact starting boundary

Owner acceptance on Production-GREEN Build 195 showed that non-product presentation images still felt broken: an administrator could choose an image, open **Selected image details**, press the prominent Save button, and see no page change.

The behavior was technically consistent with the old implementation because **Save image details** only wrote metadata. It was not consistent with the owner's workflow or the surrounding page-location context.

Build 196 starts from:

- Build 195 Development: `85b51c7b1db56a30d4d4b6383a76d24fcf204dce`.
- Build 195 Production `main`: `2855881cfb81f20355ada9b15afd4fe1a14905e9`.
- Production Pages Deploy #211: SUCCESS.
- Production Live Resource Integrity #190: SUCCESS.
- Cloudflare Pages exact Production deployment: SUCCESS.

## Corrective behavior

1. When an image was opened from an explicit page slot, the metadata panel now shows the exact placement target.
2. Its primary action is **Save details & use in this location**.
3. **Save details only (do not change page)** remains available and states its non-placement behavior directly.
4. Assignment success is not reported unless the server verifies exactly one active assignment row for the slot and that row points to the requested media item.
5. If historical duplicate active rows exist for that exact slot, an explicit assignment normalizes only that slot to one authoritative active assignment.
6. The public media manifest now returns the non-sensitive `media_asset_id` with image assignments so placement diagnostics can correlate public projection to the selected media item.
7. Product, Inventory, Supplies and Tools image authorities remain unchanged.

## Safety boundary

- No schema migration.
- No request-time DDL.
- No automatic page-image assignment; the owner must still explicitly choose the placement action.
- No automatic R2 list, upload, replacement or deletion from this build.
- No Product/Inventory/customer/business-data rewrite.
- No payment, accounting or external-provider execution.
- Assignment normalization is bounded to the one explicitly selected `media_content_slot_id`.
- Production promotion is code-only and uses the zero-D1 migration path.

## Acceptance

- Choosing an image from a page location and using the primary Save action must save metadata **and** assign that image to that exact location.
- Saving details only must explicitly say the page is unchanged.
- The placement target remains visible while editing image details.
- Server response must include `verified:true`, the requested IDs and `active_assignment_count:1`.
- Duplicate active rows for that one slot are deactivated before the new authoritative assignment is inserted.
- The Media Studio cache key advances to `v=467b196`.
- Build 195 sitewide runtime/carousel recovery remains intact.
- Build 197 remains the next planned Buyer Readiness Repair Workbench after Build 196 is fully GREEN.
