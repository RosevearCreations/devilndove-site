# Build 291 — Packaging Domain Write Service Extraction

## Objective

Move authoritative Packaging write behavior out of the legacy route module without rewriting mature business logic.

Build 291 is a server ownership refactor. It does not change Packaging UI behavior, database schema, bindings, or Production.

## Starting point

Build 290 left the application in this shape:

- active Packaging GET uses `/api/admin/packaging-bootstrap` plus owner contracts;
- broad legacy GET is blocked by the active runtime;
- active Packaging POST is transported through `/api/admin/packaging-write`;
- the write gateway still imported `onRequestPost` from `functions/api/admin/packaging-studio.js`;
- the broad Product/Inventory enumerations had already been physically removed.

The remaining architectural problem was ownership: the active write gateway still depended on the legacy route module for the mature write implementation.

## Build 291 design

### Shared Packaging domain service

`functions/api/_lib/packagingDomainService.js` is introduced as the shared server implementation.

For migration safety, its initial content is byte-for-byte the final Build 290 `functions/api/admin/packaging-studio.js` source. That deliberately preserves:

- all Packaging action validation;
- all write SQL;
- audit behavior;
- incident capture;
- selected Product/Inventory relationship reads;
- detail reload behavior;
- Packaging-owned response refresh behavior;
- legacy GET-support helpers temporarily needed by the compatibility route.

No mature action is rewritten during extraction.

### Legacy Packaging Studio route becomes an adapter

`functions/api/admin/packaging-studio.js` no longer owns business logic. It imports the shared service and delegates:

- GET -> shared legacy Packaging loader;
- POST -> shared Packaging write implementation.

This keeps direct compatibility behavior available for Build 291 while removing write authority from the route file itself.

### Active write gateway calls the service directly

`functions/api/admin/packaging-write.js` now imports the shared domain service directly. It no longer imports from `./packaging-studio.js`.

The gateway continues to provide the owner-contract response boundary and records:

- `write_service_build: 291`;
- `write_authority: packaging-domain-service`;
- `shared_write_service: true`;
- `legacy_post_route_is_adapter: true`;
- `legacy_broad_reads_removed: true`;
- zero broad-read skip counters because those reads were physically removed in Build 290.

## Client runtime

Build 291 intentionally does not modify the browser Packaging runtime. The proven Build 290 client stack remains in place:

- Build 286 narrow bootstrap and owner contracts;
- Build 287 Content artwork picker;
- Build 288 broad legacy GET retirement;
- Build 289 browser write bridge;
- Build 290 broad-read-removal runtime provenance.

The new Build 291 server ownership is observable in the successful write response boundary rather than by changing the browser lifecycle.

## Safety properties

- No D1 migration or schema change.
- No Wrangler or binding change.
- No Production change.
- No legacy Packaging UI change.
- No Build 286–290 client compatibility-layer change.
- Shared service must exactly equal the final Build 290 mature Packaging source at extraction time.
- Active gateway must not import the legacy route module.
- Legacy route must contain no mature Packaging SQL/business implementation.

## Acceptance

Build 291 is accepted when local regression proves:

1. shared service is byte-for-byte equal to final Build 290 mature Packaging source;
2. legacy route is only an adapter;
3. active write gateway imports the shared service directly;
4. no broad Product/Inventory enumeration reappears;
5. Build 290 client runtime files are untouched;
6. changed-file boundary is exact;
7. a Development authenticated save returns HTTP 200 with Build 291 shared-service authority markers.

## Next

Build 292 can retire direct legacy POST authority more aggressively because both the active gateway and compatibility route now share one authoritative implementation. After that, the remaining legacy GET/read model can be separated from the shared domain service in a later build.
