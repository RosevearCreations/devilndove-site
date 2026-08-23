# Build 284 — Packaging Contract Integration

## Goal

Turn the three read contracts already declared by Packaging into concrete owner-side services without redesigning Packaging Studio or introducing eager/background work.

## Implemented contracts

### `catalog-read` — owner: Catalog

Route: `/api/admin/contracts/catalog-read`

Returns bounded active product identity/presentation facts used by consumers such as Packaging. It does not expose Catalog write behavior.

### `inventory-read` — owner: Inventory

Route: `/api/admin/contracts/inventory-read`

Returns bounded active inventory identity, cost/quantity display facts, supplier/source references, source-material linkage and captured supplier metadata. It is read-only and never posts, reserves, consumes or reverses inventory.

### `content-media` — owner: Content

Route: `/api/admin/contracts/content-media`

Returns bounded non-product managed media references from Content authority. It does not enumerate R2 and excludes Product/Inventory/Supply/Tool specialist media.

## Runtime behavior

`dd-module-service-adapters.mjs` registers the three services into the shared module registry. Registration itself is passive and performs no network request.

Before an active module is loaded, the Admin runtime verifies that every declared consumed contract has a registered service. Packaging therefore requires:

- `inventory-read`
- `catalog-read`
- `content-media`

If any is missing, Packaging remains blocked rather than silently bypassing the contract boundary.

## Packaging consumer boundary

The Packaging runtime entry binds the three services during `onLoad()` and exposes a bounded browser facade:

- `DDPackagingContracts.readCatalog()`
- `DDPackagingContracts.readInventory()`
- `DDPackagingContracts.readContentMedia()`

Reads are allowed only while the verified Packaging module is active. No read starts automatically on activation.

## Compatibility boundary

Build 284 intentionally does **not** yet rewrite the large legacy `admin-packaging-studio.js` bootstrap. Existing UI/API behavior remains the parity baseline while contract calls are independently verified on Development.

This means Build 284 establishes real service authority and a real consumer path, but legacy bootstrap duplication remains temporarily. The next migration should replace individual legacy reads only after contract response parity is measured.

## Not changed

- no D1 migration;
- no table move or split database;
- no Wrangler/binding change;
- no Production change;
- no Packaging write API move;
- no new polling, timer or automatic contract fetch;
- no authorization by hidden UI.
