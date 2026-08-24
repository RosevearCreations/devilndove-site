# Build 291 Validation

## Local regression

Run:

```bash
python scripts/build291_packaging_domain_write_service_extraction_test.py
```

Expected:

```text
PASS: Build 291 JavaScript syntax
PASS: shared Packaging domain service is byte-for-byte final Build 290 mature source
PASS: legacy Packaging Studio route is a thin compatibility adapter
PASS: active Packaging write gateway imports the shared service directly
PASS: Build 290 broad-read removal remains intact in the shared service
PASS: Build 290 browser/runtime compatibility stack is unchanged
PASS: Build 290 historical regression boundary is pinned
PASS: exact Build 291 changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, legacy UI, bootstrap, or client-runtime change
BUILD 291 PACKAGING DOMAIN WRITE SERVICE EXTRACTION: PASS
No Cloudflare resource was contacted.
```

## Development deployment gate

After the local regression passes, deploy only:

```text
devilndove-site-dev
```

Do not target Production.

## Static/runtime checks after deployment

Confirm:

- current admin and Packaging runtime assets remain HTTP 200;
- unauthenticated `/api/admin/packaging-write` remains HTTP 401;
- unauthenticated `/api/admin/packaging-studio` remains HTTP 401;
- unauthenticated `/api/admin/packaging-bootstrap` remains HTTP 401.

Because Build 291 is intentionally server-only, the browser runtime remains Build 290.

## Authenticated write acceptance

Open an existing Packaging project in Development, make no business changes, and click **Save Packaging Project** once.

The recorded write boundary should include:

```text
build                         291
gateway_build                 291
write_service_build           291
write_authority               packaging-domain-service
shared_write_service          true
legacy_post_route_is_adapter  true
legacy_broad_reads_removed    true
legacy_broad_reads_removed_build 290
broad_catalog_queries_skipped 0
broad_inventory_queries_skipped 0
legacy_post_business_logic_preserved true
```

The existing contract state must remain intact:

```text
catalogSource          contract
inventorySource        contract
serverBootstrapSource packaging-bootstrap
legacyGetRetired       true
broadLegacyGetReachable false
```

## Rollback

Build 291 is source-only. Rollback is the final Build 290 commit:

```text
d207609967c9a182627561f2f8f9b7ae47b17b04
```

No schema rollback is required.
