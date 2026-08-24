# Build 290 — Packaging Legacy Broad Read Source Removal

## Purpose

Build 290 physically removes the retired bulk Catalog and Inventory reads from the mature Packaging server source after Builds 288 and 289 proved those collections are no longer required by active GET or POST flows.

Production remains frozen at Build 280. This work is Development-only until separately promoted.

## What is removed

From `functions/api/admin/packaging-studio.js`, Build 290 removes the following `listData()` behavior:

- the broad Product enumeration ending in `ORDER BY LOWER(name),product_id DESC LIMIT 500`;
- the enriched broad Inventory enumeration ending in `ORDER BY LOWER(sii.item_name) LIMIT 1000`;
- the fallback broad Inventory enumeration ending in `ORDER BY LOWER(item_name) LIMIT 1000`;
- `products` and `inventory` from the `listData()` return object;
- `metadataText()` and `mapPackagingInventory()`, which became dead code once those bulk Inventory reads were removed.

The obsolete Build 289 SQL-filter migration helper `functions/api/_lib/packagingWriteBoundary.mjs` is also deleted because there are no longer broad queries to intercept.

## What deliberately remains

Build 290 does not remove legitimate Packaging context relationships. The following remain valid:

- Packaging project list joins to its linked Product for Packaging context;
- selected Packaging project detail joins to its linked Product;
- Packaging components join to their specifically selected Inventory row;
- source-material workflows verify or link specifically selected Inventory rows;
- project creation may read the specifically selected Product;
- soap project creation may read marked ingredient-resource rows for that selected Product.

These are scoped relationship reads, not bulk Catalog or Inventory ownership.

## Write boundary

The mature `onRequestPost` implementation in `functions/api/admin/packaging-studio.js` remains byte-for-byte unchanged from final Build 289.

`/api/admin/packaging-write` continues to delegate that implementation. Because the broad reads are now absent from source, the gateway no longer wraps D1 with the temporary Build 289 SQL filter. It delegates directly and preserves the owner-contract response shape by omitting `products` and `inventory` if present.

The returned `write_boundary` now reports:

- `gateway_build: 290`;
- `legacy_broad_reads_removed: true`;
- `legacy_broad_reads_removed_build: 290`;
- `broad_catalog_queries_skipped: 0`;
- `broad_inventory_queries_skipped: 0`.

Zero skipped queries is now the healthy result: there are no obsolete bulk queries left to suppress.

## Runtime composition

Build 290 preserves the existing proven runtime stack:

1. Build 288 legacy-GET retirement guard is innermost.
2. Build 286 narrow bootstrap / owner-contract GET bridge sits above it.
3. Build 289 write-response bridge remains outermost for POST transport.
4. Build 287 Content artwork picker remains composed alongside the data path.

Build 290 changes server source and provenance markers, not that transport ordering.

Runtime provenance now exposes:

- `build: 290`;
- `baseBuild: 286`;
- `artworkPickerBuild: 287`;
- `legacyGetRetirementBuild: 288`;
- `writeResponseBuild: 289`;
- `writeGatewayBuild: 290`;
- `legacyBroadReadRemovalBuild: 290`;
- `legacyBroadReadsRemoved: true`.

## Safety boundary

Build 290 includes no:

- D1 migration or schema change;
- Wrangler or Cloudflare binding change;
- R2 enumeration or mutation;
- Production deployment or Production configuration change;
- legacy Packaging UI rewrite;
- Build 286 bridge rewrite;
- Build 287 artwork-picker rewrite;
- Build 288 retirement-guard rewrite;
- Build 289 browser write-bridge rewrite.

## Acceptance

Build 290 is acceptable when local regression proves:

- the three bulk SQL signatures are absent from Packaging Studio source;
- the dead Inventory mapping helpers are absent;
- `listData()` no longer returns `products` or `inventory`;
- selected/contextual Product and Inventory relationship reads remain;
- the complete mature `onRequestPost` implementation matches final Build 289 exactly;
- `loadDetail()` matches final Build 289 exactly;
- the obsolete Build 289 SQL-filter helper is deleted;
- the write gateway delegates directly and reports physical source removal;
- the Build 286–289 runtime layers remain composed;
- Build 290 version markers are wired through the Admin shell;
- the exact Build 289→290 changed-file boundary contains no schema or Cloudflare configuration changes.

After deployment, an authenticated Packaging save should still return HTTP 200 through `/api/admin/packaging-write`, with `legacy_broad_reads_removed: true` and both broad-query skip counters equal to `0`.
