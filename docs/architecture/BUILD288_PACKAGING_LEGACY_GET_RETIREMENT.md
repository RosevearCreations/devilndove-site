# Build 288 — Packaging Legacy Broad GET Runtime Retirement

## Purpose

Build 288 removes the old broad Packaging GET from the **active modular execution path** without rewriting the mature Packaging write Function.

Build 286 proved that the healthy Packaging GET can be served by the narrow Packaging-owned `/api/admin/packaging-bootstrap` endpoint plus owner-side `catalog-read`, `inventory-read`, and `content-media` contracts. Build 287 proved additional Packaging UI can compose on top of that boundary without taking ownership of Content media.

Build 288 now removes the remaining runtime rollback route that could still contact the broad legacy GET if the narrow bootstrap or an uncached owner contract failed.

## Runtime design

A new `read-retirement.mjs` guard is armed **before** the Build 286 Packaging bridge activates.

The order is intentional:

1. The original authenticated `DDAuth.apiFetch` exists.
2. Build 288 arms the retirement guard around that original fetch.
3. Build 286 activates and captures the guarded fetch as its underlying transport.
4. Build 286 remains the outer bridge used by the legacy Packaging UI.

On a healthy UI GET to `/api/admin/packaging-studio`:

- Build 286 intercepts the legacy-shaped GET.
- Build 286 calls `/api/admin/packaging-bootstrap` through the Build 288 guard.
- The guard allows the narrow request through.
- Build 286 injects Catalog, Inventory and Content data from owner contracts.
- The broad legacy GET is never contacted.

If the narrow bootstrap or an owner-contract fallback path causes Build 286 to attempt its historical rollback GET:

- Build 286 calls its captured underlying fetch with GET `/api/admin/packaging-studio`.
- Build 288 intercepts that attempted rollback before the network layer.
- Build 288 returns HTTP `410` with `error_code: packaging_legacy_get_retired`.
- No broad GET reaches the server.

This means contract/session-cache behavior remains explicit, but broad re-enumeration is no longer a recovery mechanism.

## Write path

Build 288 intentionally does not intercept POST.

`POST /api/admin/packaging-studio` continues through the existing mature Packaging write authority. The Build 288 guard matches only GET for the exact legacy Packaging path; POST and all other requests pass through unchanged.

This preserves:

- project create/save/delete/archive behavior;
- component writes;
- formula/source-material/library actions;
- printer profiles;
- versions/review/export/print-test actions;
- current audit and incident behavior.

## Why the server file is not edited yet

`functions/api/admin/packaging-studio.js` still uses its historical `listData()` helper for both GET and successful POST responses. That helper still performs bulk Catalog and Inventory enumeration.

Physically deleting those queries in the same build would couple two changes:

1. legacy GET source retirement; and
2. write-response contract changes.

Build 288 deliberately separates them. The active application can no longer reach the broad GET, while the mature write response remains untouched until its client dependencies are explicitly removed.

## Content artwork

Build 287 artwork behavior remains composed without modification. The managed artwork picker continues to consume only `content-media`, leaves the manual `packagingArtworkAsset` field available, does not poll, and does not mutate Content records.

## Security and activation

The retirement guard is armed only as part of verified Packaging module activation. Cached/degraded identity still cannot newly activate Packaging. Server authentication remains authoritative for the narrow bootstrap, contracts, and writes.

The guard is removed during module deactivation. Deactivation order is also intentional: Build 286 first restores the guard it captured as its underlying fetch, then Build 288 restores the original authenticated fetch.

## No infrastructure change

Build 288 adds no:

- D1 migration;
- SQL/schema change;
- Cloudflare binding/config change;
- R2 enumeration;
- Function change;
- Production change.

## Acceptance

Build 288 is accepted when Development proves:

- runtime build `288` is active;
- Packaging build `288` is active over base Build 286;
- `legacyGetRetired === true`;
- `activeRuntimeBroadLegacyGetReachable === false`;
- healthy Packaging GET still reports `serverBootstrapSource: packaging-bootstrap` and owner-contract sources;
- simulated narrow-bootstrap failure produces the retired response without any network GET to `/api/admin/packaging-studio`;
- Packaging POST still reaches `/api/admin/packaging-studio` unchanged;
- Build 287 artwork picker still starts and mounts when the Artwork tab field exists;
- Production is never contacted.

## Next step

After Build 288 is proven, split successful Packaging POST responses from the broad `listData()` dependency. Once writes no longer require those collections, physically remove the dormant broad Product/Inventory queries and then remove the obsolete GET implementation from `packaging-studio.js`.
