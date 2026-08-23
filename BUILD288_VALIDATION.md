# Build 288 Validation

Build 288 is accepted only when all of the following are true.

## Local regression gate

Run:

```bash
python scripts/build288_packaging_legacy_get_retirement_test.py
```

Expected:

```text
PASS: Build 288 JavaScript syntax
PASS: Build 288 module imports resolve
PASS: healthy Packaging GET still uses narrow bootstrap + owner contracts
PASS: narrow-bootstrap failure cannot reach legacy broad GET
PASS: Packaging POST remains on the existing write endpoint
PASS: Build 287 artwork picker remains composed
PASS: Build 288 routing/version markers
PASS: Build 287 historical regression boundary is pinned
PASS: exact Build 288 changed-file boundary
PASS: no Function, SQL/schema, Cloudflare binding/config, legacy Packaging UI, Build 286 bridge, or Build 287 picker change
BUILD 288 PACKAGING LEGACY GET RETIREMENT: PASS
No Cloudflare resource was contacted.
```

## Development static/runtime gate

After deploying Development only:

- `admin.js` loads `dd-admin-module-runtime.mjs?v=288`.
- Admin module runtime reports build `288`.
- Packaging definition loads `../modules/packaging/runtime.mjs?v=288`.
- `read-retirement.mjs` is served successfully.
- unauthenticated `/api/admin/packaging-bootstrap` remains HTTP `401`.

## Authenticated Packaging acceptance

On an authenticated Packaging project:

```text
runtimeBuild                         288
packagingBuild                       288
baseBuild                            286
artworkPickerBuild                   287
packagingState                       active
legacyGetRetired                     true
activeRuntimeBroadLegacyGetReachable false
legacyGetGuardArmed                  true
serverBootstrapSource                packaging-bootstrap
legacyEndpointBypassed               true
catalogSource                        contract
inventorySource                      contract
contentMediaSource                   contract
```

The Build 287 artwork picker must still start and mount on the Artwork tab when `#packagingArtworkAsset` exists. A zero Content-artwork count remains valid.

## Failure-path proof

The local harness deliberately makes `/api/admin/packaging-bootstrap` fail after a healthy request. The original network stub throws if any GET reaches `/api/admin/packaging-studio`.

Expected behavior:

- the Build 286 bridge attempts its historical rollback;
- the Build 288 guard intercepts that attempt;
- the returned response is HTTP `410` with `packaging_legacy_get_retired`;
- the original network stub records zero legacy GETs;
- the guard increments `blockedLegacyGetCount`.

## Write-path proof

The same harness sends a POST to `/api/admin/packaging-studio` and verifies it reaches the original write transport exactly once. The retirement guard must never intercept POST.

## Safety boundary

Build 288 changes no Functions, SQL/schema, Wrangler/bindings, legacy Packaging UI, Build 286 base bridge, or Build 287 artwork picker. Production is not contacted.
