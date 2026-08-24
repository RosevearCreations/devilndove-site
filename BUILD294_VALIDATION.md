# Build 294 Validation

## Local regression

Run from Development `dev` after pulling the final Build 294 commit:

```bash
python scripts/build294_packaging_legacy_get_server_retirement_test.py
```

Expected final line:

```text
BUILD 294 PACKAGING LEGACY GET SERVER RETIREMENT: PASS
```

The regression proves:

- JavaScript syntax is valid.
- Legacy GET no longer imports or calls the shared Packaging read service.
- Legacy GET authenticates first, then returns HTTP 410 retirement metadata.
- Build 292 legacy POST retirement remains intact.
- Build 293 read service/bootstrap are unchanged.
- Build 291 write service and Build 292 native gateway are unchanged.
- Build 290 browser/runtime compatibility stack is unchanged.
- Build 293 historical regression is pinned.
- Build 294 changed-file boundary is exact.
- No SQL/schema, Cloudflare binding/config, R2, or Production change is included.

## Development unauthenticated boundary

After deployment to `devilndove-site-dev` only:

- `/api/admin/packaging-bootstrap` GET -> 401
- `/api/admin/packaging-studio` GET -> 401
- `/api/admin/packaging-studio` POST -> 401
- `/api/admin/packaging-write` POST -> 401

## Authenticated legacy GET retirement proof

A raw authenticated GET to `/api/admin/packaging-studio` must return:

```text
status: 410
error_code: packaging_legacy_get_retired
build: 294
legacy_get_retired: true
replacement_path: /api/admin/packaging-bootstrap
```

No Packaging read response payload should be returned.

## Active read parity

A direct authenticated GET to `/api/admin/packaging-bootstrap` must still return HTTP 200 and:

```text
build: 286
read_service_build: 293
read_implementation_build: 286
read_authority: packaging-read-service
shared_read_service: true
module_boundary.bulk_catalog_rows: 0
module_boundary.bulk_inventory_rows: 0
```

The normal Packaging page must remain contractized with Catalog, Inventory, and Content media sourced from owner contracts.

## Active write parity

A normal Save Packaging Project must still return HTTP 200 and report:

```text
gatewayBuild: 292
writeServiceBuild: 291
writeAuthority: packaging-domain-service
legacyPostRouteRetired: true
```

## Authenticated legacy POST regression

A raw authenticated POST to `/api/admin/packaging-studio` must still return:

```text
status: 410
error_code: packaging_legacy_post_retired
build: 292
legacy_post_retired: true
replacement_path: /api/admin/packaging-write
```

Build 294 is not complete until the retired GET, active read, active write, and retained POST retirement are all proven in Development.

Production must not be contacted.
