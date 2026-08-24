# Build 293 Validation

## Local regression

Run from the Development `dev` branch after pulling the final Build 293 commit:

```bash
python scripts/build293_packaging_read_service_extraction_test.py
```

Expected final line:

```text
BUILD 293 PACKAGING READ SERVICE EXTRACTION: PASS
```

The regression proves:

- JavaScript syntax is valid.
- `packagingReadService.js` is byte-for-byte the final Build 292 bootstrap implementation.
- The active bootstrap endpoint delegates to the shared read service.
- The bootstrap preserves Build 286 client compatibility while exposing Build 293 read authority.
- Legacy Packaging GET delegates to the shared read service and preserves its legacy response surface.
- Build 292 legacy POST retirement remains intact.
- Build 291 write service and Build 292 native write gateway are unchanged.
- Build 290 broad Catalog/Inventory read removal remains intact.
- The proven browser/runtime stack is unchanged.
- Build 292 historical regression is pinned to its final commit.
- The Build 293 changed-file boundary is exact.
- No SQL/schema, Cloudflare binding/config, or Production change is included.

## Development deployment checks

After local PASS, deploy only to:

```text
devilndove-site-dev
```

Unauthenticated checks should show:

- `/api/admin/packaging-bootstrap` GET -> `401`
- `/api/admin/packaging-studio` GET -> `401`
- `/api/admin/packaging-studio` POST -> `401`
- `/api/admin/packaging-write` POST -> `401`

## Authenticated bootstrap acceptance

On the normal Development Packaging page, the active modular bootstrap must remain contractized and successful. A direct authenticated raw GET to `/api/admin/packaging-bootstrap` should report:

```text
build: 286
read_service_build: 293
read_implementation_build: 286
read_authority: packaging-read-service
shared_read_service: true
module_boundary.bulk_catalog_rows: 0
module_boundary.bulk_inventory_rows: 0
```

The normal Packaging page must still report Catalog and Inventory sources as owner contracts.

## Authenticated write parity

A normal Save Packaging Project remains required as a regression guard. It should still report:

```text
lastWriteStatus: 200
gatewayBuild: 292
writeServiceBuild: 291
legacyPostRouteRetired: true
```

Build 293 is not complete until both read-service provenance and unchanged write behavior are proven in Development.

Production must not be contacted.
