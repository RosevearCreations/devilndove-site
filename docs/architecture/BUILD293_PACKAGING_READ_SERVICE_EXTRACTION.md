# Build 293 — Packaging Read Service Extraction

## Objective

Move the active Packaging-owned GET/read model behind a shared server service without rewriting its proven queries or changing the browser runtime.

Build 293 is the read-side analogue of Build 291. Build 291 extracted write authority; Build 293 extracts read authority.

## Preserved implementation

`functions/api/_lib/packagingReadService.js` is copied byte-for-byte from the final Build 292 `functions/api/admin/packaging-bootstrap.js` source. That source is the proven Build 286 narrow Packaging-owned bootstrap implementation.

Preserved behavior includes:

- Packaging template lists.
- Packaging project lists with scoped linked Product context.
- Printer profiles and schema-readiness fallback.
- Packaging reference sources.
- Formula, content and source-material libraries.
- Source-material metadata fallback.
- Selected Packaging project detail.
- Structured ingredients and claims.
- Soap-product fallback rows.
- Packaging versions, exports and print tests.
- Selected Packaging component Inventory context.
- Source-material relationships.
- Packaging preflight and dimensional review calculations.

The Build 290 broad Catalog and Inventory enumerations remain absent. Catalog and Inventory bulk collections continue to come from their owner contracts.

## Server routing after Build 293

### Active read path

```text
Packaging UI
  -> Build 286 browser bootstrap bridge
  -> GET /api/admin/packaging-bootstrap
  -> Build 293 bootstrap adapter
  -> packagingReadService.js
  -> Packaging-owned D1 read model
```

`/api/admin/packaging-bootstrap` preserves its Build 286 payload surface for browser compatibility and adds read-service provenance:

- `read_service_build: 293`
- `read_implementation_build: 286`
- `read_authority: packaging-read-service`
- `shared_read_service: true`

### Temporary legacy GET compatibility

```text
GET /api/admin/packaging-studio
  -> Build 293 compatibility adapter
  -> packagingReadService.js
```

The compatibility adapter preserves the historical `build: "277"` and legacy mode fields, then adds a `read_boundary` object identifying Build 293 read authority.

The active browser runtime still blocks this legacy GET before transport through the Build 288 retirement guard. The server route remains only for controlled compatibility until the next retirement build.

### Write path

Build 293 does not change the write path:

```text
Packaging UI
  -> /api/admin/packaging-write
  -> Build 291 packagingDomainService.js
```

Direct POST authority at `/api/admin/packaging-studio` remains retired by Build 292 and still returns authenticated HTTP 410 with `packaging_legacy_post_retired`.

## Safety invariants

Build 293 must not change:

- `functions/api/_lib/packagingDomainService.js`
- `functions/api/admin/packaging-write.js`
- the mature Packaging browser UI
- Build 286 browser contractization behavior
- Build 287 Content artwork behavior
- Build 288 client legacy-GET guard
- Build 289 write bridge
- Build 290 client/runtime provenance
- SQL migrations or schema
- Wrangler or Cloudflare bindings
- Production

## Why the extracted service still reports Build 286 internally

The shared read-service file intentionally retains the original Build 286 implementation marker because its source is copied byte-for-byte. Build 293 is the extraction/authority boundary, not a read-query rewrite. The endpoint adapters therefore expose Build 293 provenance separately while preserving Build 286 implementation provenance.

This provides a strong regression guarantee: read behavior was moved, not recreated.

## Next step

After Development parity is proven, retire the remaining server-side legacy GET at `/api/admin/packaging-studio`. Once both GET and POST are retired there, the legacy route file can be evaluated for deletion.
