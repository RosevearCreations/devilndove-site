# Devil n Dove AI Context — Development Build 292 Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`, `docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md`, `docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md`, `docs/architecture/BUILD285_PACKAGING_CONTRACT_CONSUMPTION.md`, `docs/architecture/BUILD286_PACKAGING_API_BOUNDARY_CLEANUP.md`, `docs/architecture/BUILD287_PACKAGING_CONTENT_ARTWORK_PICKER.md`, `docs/architecture/BUILD288_PACKAGING_LEGACY_GET_RETIREMENT.md`, `docs/architecture/BUILD289_PACKAGING_WRITE_RESPONSE_DECOUPLING.md`, `docs/architecture/BUILD290_PACKAGING_LEGACY_BROAD_READ_SOURCE_REMOVAL.md`, `docs/architecture/BUILD291_PACKAGING_DOMAIN_WRITE_SERVICE_EXTRACTION.md`, and `docs/architecture/BUILD292_PACKAGING_LEGACY_POST_RETIREMENT.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, Content artwork selection, active-runtime legacy GET retirement, write-response decoupling, and physical removal of broad Catalog/Inventory reads from the mature Packaging server source.

Build 291 moved the exact mature Build 290 Packaging implementation into `functions/api/_lib/packagingDomainService.js`. The native `/api/admin/packaging-write` endpoint began calling that shared domain service directly, while `/api/admin/packaging-studio` became a compatibility adapter.

Build 292 retires direct legacy POST authority at `/api/admin/packaging-studio`. The route keeps its temporary GET compatibility adapter, but POST now verifies administrator identity and then returns HTTP 410 with `error_code: packaging_legacy_post_retired` and replacement path `/api/admin/packaging-write`. Unauthenticated legacy POST requests still return HTTP 401.

The active native write path remains `/api/admin/packaging-write` -> `packagingDomainService.js`. The shared service is unchanged from Build 291. The Build 292 gateway response records `gateway_build: 292`, preserves `write_service_build: 291`, and adds `legacy_post_route_retired: true`, `legacy_post_retirement_build: 292`, and `legacy_post_error_code: packaging_legacy_post_retired`.

No browser Packaging runtime behavior changes in Build 292. The proven Build 290 client runtime remains intact, including the Build 286 narrow bootstrap, Build 287 Content artwork picker, Build 288 GET retirement guard, Build 289 browser write bridge, and Build 290 broad-read-removal provenance. The browser bridge continues intercepting the legacy UI POST path before transport and sending the request to the native write gateway, so the mature UI does not hit the retired server route.

Build 292 introduces no D1 migration, SQL/schema change, Wrangler/binding change, R2 enumeration, shared-service business-logic change, or Production change.

Expected next work after Build 292 parity validation: extract the Packaging-owned read model from the shared domain service into a dedicated read service, then retire the remaining server-side legacy GET compatibility endpoint so `functions/api/admin/packaging-studio.js` can be deleted entirely.
