# Build 290 Validation — Packaging Legacy Broad Read Source Removal

## Local regression gate

Run:

```bash
python scripts/build290_packaging_legacy_broad_read_source_removal_test.py
```

Expected final result:

```text
BUILD 290 PACKAGING LEGACY BROAD READ SOURCE REMOVAL: PASS
No Cloudflare resource was contacted.
```

The regression must prove:

- Build 290 JavaScript syntax and module import validity;
- broad Product and Inventory enumeration SQL is physically absent from `functions/api/admin/packaging-studio.js`;
- `metadataText()` and `mapPackagingInventory()` are removed as dead migration-era helpers;
- `listData()` no longer exposes `products` or `inventory`;
- linked/contextual Product and Inventory reads remain;
- the complete `onRequestPost` implementation is unchanged from final Build 289;
- `loadDetail()` is unchanged from final Build 289;
- the obsolete Build 289 SQL-filter helper is deleted;
- `/api/admin/packaging-write` delegates directly to the mature POST implementation and reports physical read removal;
- Build 286 narrow bootstrap, Build 287 artwork picker, Build 288 GET retirement, and Build 289 write bridge remain composed;
- Build 290 shell/runtime version markers are present;
- the exact Build 289→290 changed-file boundary is respected;
- no SQL/schema, Cloudflare binding/configuration, legacy UI, or Production-path change exists.

## Development deployment gate

Only after the local regression passes, deploy the `dev` branch to the Development Pages project `devilndove-site-dev`.

Do not target Production.

After deployment verify on the normal Development hostname:

- `public/js/admin.js` is HTTP 200 and imports runtime `?v=290`;
- `public/js/core/dd-admin-module-runtime.mjs` is HTTP 200 and reports Build 290;
- `public/js/core/dd-module-definitions.mjs` is HTTP 200 and loads Packaging runtime `?v=290`;
- `public/js/modules/packaging/runtime.mjs` is HTTP 200 and reports `legacyBroadReadsRemoved`;
- unauthenticated `/api/admin/packaging-bootstrap` remains HTTP 401;
- unauthenticated POST `/api/admin/packaging-write` remains HTTP 401.

## Authenticated browser acceptance

Open an existing Packaging project in Development and save it without intentional business-content changes.

Expected runtime evidence:

```text
runtimeBuild                       290
activeModule                       packaging
packagingBuild                     290
baseBuild                          286
artworkPickerBuild                 287
retirementBuild                    288
writeResponseBuild                 289
writeGatewayBuild                  290
legacyBroadReadRemovalBuild        290
legacyBroadReadsRemoved            true
writeBridgeArmed                   true
lastWriteStatus                    200
gatewayBuild                       290
legacyBroadReadsRemovedBoundary    true
broadCatalogQueriesSkipped         0
broadInventoryQueriesSkipped       0
contractized                       true
catalogSource                      contract
inventorySource                    contract
legacyGetRetired                   true
broadLegacyGetReachable            false
```

The zero skip counters are intentional in Build 290: the obsolete broad queries are no longer present in source, so there is nothing left for a SQL filter to suppress.
