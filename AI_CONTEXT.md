# Devil n Dove AI Context — Development Build 291 Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`, `docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md`, `docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md`, `docs/architecture/BUILD285_PACKAGING_CONTRACT_CONSUMPTION.md`, `docs/architecture/BUILD286_PACKAGING_API_BOUNDARY_CLEANUP.md`, `docs/architecture/BUILD287_PACKAGING_CONTENT_ARTWORK_PICKER.md`, `docs/architecture/BUILD288_PACKAGING_LEGACY_GET_RETIREMENT.md`, `docs/architecture/BUILD289_PACKAGING_WRITE_RESPONSE_DECOUPLING.md`, `docs/architecture/BUILD290_PACKAGING_LEGACY_BROAD_READ_SOURCE_REMOVAL.md`, and `docs/architecture/BUILD291_PACKAGING_DOMAIN_WRITE_SERVICE_EXTRACTION.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, Content artwork selection, active-runtime legacy GET retirement, write-response decoupling, and physical removal of broad Catalog/Inventory reads from the mature Packaging server source.

Build 291 changes server ownership without changing Packaging business behavior. The exact final Build 290 mature `functions/api/admin/packaging-studio.js` implementation is preserved byte-for-byte in `functions/api/_lib/packagingDomainService.js`. This shared domain service is now the single source of truth for the mature Packaging GET-support helpers and POST business implementation while the read model remains temporarily co-located for migration safety.

`functions/api/admin/packaging-studio.js` is reduced to a thin compatibility adapter. Its GET delegates to the shared domain service and its POST delegates to the same shared write implementation. The active `/api/admin/packaging-write` endpoint imports the shared service directly rather than importing the legacy route module, so active write authority no longer flows through the compatibility endpoint.

The Build 291 write gateway preserves the Build 290 response boundary: `products` and `inventory` remain omitted, broad-read counters remain zero, and the response now records `write_service_build: 291`, `write_authority: packaging-domain-service`, `shared_write_service: true`, and `legacy_post_route_is_adapter: true`.

No browser Packaging runtime behavior changes in Build 291. The proven Build 290 client runtime remains intact, including the Build 286 narrow bootstrap, Build 287 Content artwork picker, Build 288 GET retirement guard, Build 289 browser write bridge, and Build 290 broad-read-removal provenance. Build 291 is intentionally a server ownership refactor.

Build 291 introduces no D1 migration, SQL/schema change, Wrangler/binding change, R2 enumeration, or Production change. The regression requires the shared service to be byte-for-byte equal to the final Build 290 mature Packaging implementation, ensuring write SQL, validation, audit behavior, detail reloads, and Packaging-owned refresh behavior were moved rather than rewritten.

Expected next work after Build 291 parity validation: retire direct legacy POST authority at `/api/admin/packaging-studio` from the active architecture while retaining a controlled compatibility response if needed, then separate the remaining legacy GET/read model from the shared domain service so the old route can eventually be deleted.
