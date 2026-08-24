# Build 294 — Packaging Legacy GET Server Retirement

## Objective

Retire the remaining server-side GET authority at `/api/admin/packaging-studio` after Build 293 proved the native Packaging read service and bootstrap independently.

Build 294 is a route-retirement build, not a read-model rewrite.

## Active read path

```text
Packaging UI
  -> /api/admin/packaging-bootstrap
  -> Build 293 bootstrap adapter
  -> functions/api/_lib/packagingReadService.js
  -> proven Build 286 Packaging-owned read implementation
```

Catalog, Inventory, and Content media remain external owner contracts. Packaging does not regain bulk Catalog or Inventory enumeration.

## Active write path

```text
Packaging UI
  -> Build 289 browser write bridge
  -> /api/admin/packaging-write
  -> Build 291 packagingDomainService.js
```

Build 294 does not change this path.

## Legacy route after Build 294

`functions/api/admin/packaging-studio.js` no longer imports or calls `packagingReadService.js`.

### GET

1. Verify administrator identity.
2. If unauthenticated, return HTTP 401.
3. If authenticated, return HTTP 410.
4. Response contains:
   - `error_code: packaging_legacy_get_retired`
   - `build: 294`
   - `legacy_get_retired: true`
   - `replacement_path: /api/admin/packaging-bootstrap`

No Packaging read query executes through the legacy GET route.

### POST

Build 292 behavior remains unchanged:

1. Verify administrator identity.
2. If unauthenticated, return HTTP 401.
3. If authenticated, return HTTP 410.
4. Response contains:
   - `error_code: packaging_legacy_post_retired`
   - `build: 292`
   - `legacy_post_retired: true`
   - `replacement_path: /api/admin/packaging-write`

No Packaging write business logic executes through the legacy POST route.

## Protected boundaries

Build 294 must not change:

- `functions/api/_lib/packagingReadService.js`
- `functions/api/admin/packaging-bootstrap.js`
- `functions/api/_lib/packagingDomainService.js`
- `functions/api/admin/packaging-write.js`
- `public/js/admin-packaging-studio.js`
- `public/js/admin.js`
- `public/js/core/dd-admin-module-runtime.mjs`
- `public/js/core/dd-module-definitions.mjs`
- all Packaging browser runtime modules
- SQL/schema/migrations
- Wrangler/bindings/R2 configuration
- Production

## Why authenticate before 410

The retired route preserves the established admin security boundary. Unauthenticated callers receive the same 401 gate rather than learning retirement details before authentication.

## Completion criteria

Build 294 is complete only after Development proves:

- unauthenticated legacy GET -> 401;
- authenticated legacy GET -> 410 `packaging_legacy_get_retired`;
- authenticated `/api/admin/packaging-bootstrap` -> 200 with Build 293 read provenance;
- normal Packaging save -> 200 with Build 292 gateway / Build 291 write service provenance;
- authenticated legacy POST still -> 410 `packaging_legacy_post_retired`.

Production remains frozen at Build 280.
