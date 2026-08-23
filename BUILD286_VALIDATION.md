# Build 286 Validation

Build 286 is accepted only when all of the following are true.

## Local static/regression gate

Run:

```bash
python scripts/build286_packaging_boundary_test.py
```

Expected:

```text
PASS: Build 286 JavaScript syntax
PASS: narrow Packaging bootstrap excludes bulk Catalog and Inventory enumeration
PASS: healthy Packaging GET bypasses the legacy broad endpoint
PASS: Packaging writes remain on the existing endpoint
PASS: rollback GET remains explicit and observable
PASS: exact Build 286 changed-file boundary
PASS: no D1 migration, SQL/schema, or Cloudflare binding/config change
BUILD 286 PACKAGING API BOUNDARY CLEANUP: PASS
No Cloudflare resource was contacted.
```

## Development runtime acceptance

Development assets must serve Build 286 markers and `/api/admin/packaging-bootstrap` must reject unauthenticated access with HTTP 401.

In an authenticated Development Packaging Studio session, the final bootstrap state should show:

```text
build: 286
contractized: true
serverBootstrapSource: "packaging-bootstrap"
legacyEndpointBypassed: true
catalogSource: "contract"
inventorySource: "contract"
contentMediaSource: "contract"
fallbackReasons: []
```

The narrow server payload must include `module_boundary.bulk_catalog_rows = 0` and `module_boundary.bulk_inventory_rows = 0`.

## Safety boundary

No Production resource is contacted or changed by Build 286 validation.
