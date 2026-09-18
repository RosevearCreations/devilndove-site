# Release 467 — Build 178 Product Editor Navigation Convergence

Build 178 keeps Product work on the dedicated low-read Product surfaces introduced in Builds 162–175.

## Starting boundary

At build start, `dev` and `main` were source-identical at `79e8e509f89c29fbd300a34a0ba20c2bfcc7aaef` (Build 177 source head). Build 178 is code-only and does not introduce a D1 migration.

## Problem

Several current Product/admin workspaces still linked back to the retired all-in-one `/admin/catalog/?product_id=...` editor. Following those links could wake legacy Product subsystems even though the dedicated Product Editor and Product Media / Image Editor already exist.

## Build 178 behavior

- Product readiness fixes route to `/admin/product-editor/` with the matching `tab` and `focus` query.
- Product list fix actions route to the dedicated Product Editor rather than the retired catalog editor.
- Product Media context returns to the dedicated Product Editor.
- Release Preflight returns to the dedicated Product Editor.
- Server-generated release-preflight Product links no longer target the retired catalog editor.
- Marketplace listing-fact edits route to the Product Editor description tab.
- Product Editor and Product Media / Image Editor are cache-bumped to one Build 178 browser generation.
- Existing Product Editor tab/focus support, explicit saves, lazy QA, bounded Media reads, explicit Image Editor actions, no autosave and no background image polling remain intact.

## Safety boundary

Build 178 performs no schema change, D1 business-data mutation, R2 mutation, provider execution, payment/refund action, accounting posting, publication, or automatic Product mutation.

## Acceptance

Build 178 must pass its dedicated navigation-convergence proof plus retained Product QA, Product Media save/repair, Product Editor media-read and zero-introspection-save gates. Normal repository/System Gate and deployment workflows remain authoritative for Development and Production promotion.
