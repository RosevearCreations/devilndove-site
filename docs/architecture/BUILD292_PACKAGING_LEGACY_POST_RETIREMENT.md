# Build 292 — Packaging Legacy POST Retirement

## Purpose

Build 292 removes direct server write authority from the legacy `/api/admin/packaging-studio` POST endpoint after Build 291 established `/api/admin/packaging-write` as the native Packaging write gateway backed by the shared Packaging domain service.

## Locked behavior

### Native write path

The supported application path remains:

`Packaging UI -> Build 289 browser write bridge -> POST /api/admin/packaging-write -> packagingDomainService.js -> D1`

The shared `functions/api/_lib/packagingDomainService.js` implementation is unchanged from Build 291.

### Retired legacy POST path

`POST /api/admin/packaging-studio` no longer delegates to the shared write service.

It now:

1. verifies administrator identity using the existing server auth helper;
2. returns HTTP 401 when the caller is not an authenticated administrator;
3. returns HTTP 410 for an authenticated administrator;
4. reports `error_code: packaging_legacy_post_retired`;
5. reports replacement path `/api/admin/packaging-write`.

This preserves security semantics while making accidental direct use of the legacy endpoint fail explicitly instead of silently continuing as an alternate write authority.

### Temporary legacy GET compatibility

`GET /api/admin/packaging-studio` remains delegated to the shared Packaging domain service in Build 292. The active browser runtime still retires the broad legacy GET before transport and uses `/api/admin/packaging-bootstrap` plus owner contracts. The remaining server GET compatibility surface is intentionally left for the next read-service extraction build.

## Write-boundary provenance

Successful native writes through `/api/admin/packaging-write` report:

- `gateway_build: 292`
- `write_service_build: 291`
- `write_authority: packaging-domain-service`
- `shared_write_service: true`
- `legacy_post_route_is_adapter: false`
- `legacy_post_route_retired: true`
- `legacy_post_retirement_build: 292`
- `legacy_post_error_code: packaging_legacy_post_retired`
- `legacy_broad_reads_removed: true`
- `legacy_broad_reads_removed_build: 290`
- both broad-read counters remain zero.

The separate gateway and service build markers are deliberate: Build 292 changes endpoint authority, not the mature shared write implementation extracted in Build 291.

## Compatibility stack retained

Build 292 does not change the browser runtime. The active Packaging page continues to use:

- Build 286 narrow bootstrap bridge;
- Build 287 Content artwork picker;
- Build 288 legacy GET retirement guard;
- Build 289 browser POST bridge;
- Build 290 client runtime and broad-read-removal provenance;
- Build 291 shared server write service.

Because the Build 289 browser bridge intercepts the mature UI's POST to `/api/admin/packaging-studio` and sends it to `/api/admin/packaging-write`, the mature UI does not encounter the new 410 response.

## Safety boundary

Build 292 makes no:

- D1 migration or schema change;
- SQL/business-write change;
- R2 change;
- Wrangler or binding change;
- mature Packaging UI change;
- browser runtime change;
- shared Packaging domain-service change;
- Production change.

## Next architecture step

After Development parity validation, extract the remaining Packaging-owned GET/read implementation from `packagingDomainService.js` into a dedicated Packaging read service. Once the native read boundary is proven, the remaining server-side legacy GET endpoint can be retired and `functions/api/admin/packaging-studio.js` can be removed.
