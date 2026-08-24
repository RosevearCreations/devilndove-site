# Devil n Dove AI Context — Development Build 297 Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`, `docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md`, `docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md`, `docs/architecture/BUILD285_PACKAGING_CONTRACT_CONSUMPTION.md`, `docs/architecture/BUILD286_PACKAGING_API_BOUNDARY_CLEANUP.md`, `docs/architecture/BUILD287_PACKAGING_CONTENT_ARTWORK_PICKER.md`, `docs/architecture/BUILD288_PACKAGING_LEGACY_GET_RETIREMENT.md`, `docs/architecture/BUILD289_PACKAGING_WRITE_RESPONSE_DECOUPLING.md`, `docs/architecture/BUILD290_PACKAGING_LEGACY_BROAD_READ_SOURCE_REMOVAL.md`, `docs/architecture/BUILD291_PACKAGING_DOMAIN_WRITE_SERVICE_EXTRACTION.md`, `docs/architecture/BUILD292_PACKAGING_LEGACY_POST_RETIREMENT.md`, `docs/architecture/BUILD293_PACKAGING_READ_SERVICE_EXTRACTION.md`, `docs/architecture/BUILD294_PACKAGING_LEGACY_GET_SERVER_RETIREMENT.md`, `docs/architecture/BUILD295_PACKAGING_STARTUP_TRANSPORT_GATE.md`, `docs/architecture/BUILD296_PACKAGING_EXPLICIT_CLIENT_TRANSPORT.md`, and `docs/architecture/BUILD297_PACKAGING_LEGACY_GET_FALLBACK_REMOVAL.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, Content artwork selection, active-runtime legacy GET retirement, write-response decoupling, and physical removal of broad Catalog/Inventory reads from the mature Packaging server source.

Build 291 moved the mature Packaging implementation into `functions/api/_lib/packagingDomainService.js`; Build 292 retired direct POST authority at `/api/admin/packaging-studio`; Build 293 extracted the active Packaging read service; and Build 294 retired direct GET authority at `/api/admin/packaging-studio`. Authenticated direct legacy GET/POST probes therefore return intentional HTTP 410 tombstones, while native replacements are `/api/admin/packaging-bootstrap` and `/api/admin/packaging-write`.

Build 295 introduced a startup gate after live validation showed the mature editor could issue its compatibility GET before modular activation. It prevented unsafe server contact but inferred callable transport ownership from mutable `DDAuth.apiFetch`, so it remains a historical safety step rather than the final solution.

Build 296 added explicit callable handles to the proven Build 286 read bridge and Build 289 write bridge. The Build 290 facade exposes `transportLegacyRequest()` and the startup adapter calls that facade directly. Initial Development startup then passed with the native bootstrap contractized, replay 1, blocked 0, and no physical legacy GET.

Live testing after that success exposed a second Build 296 defect: after runtime activation, the Build 286 bridge again occupied the active authenticated transport chain. Clicking the mature editor's **Refresh** button could enter Build 286's old rollback behavior and physically request `/api/admin/packaging-studio`. Because Build 294 correctly returns HTTP 410, Packaging projects failed to reload.

Build 297 fixes that post-activation path without rewriting the mature editor or proven Build 296 runtime. `client-transport-v297.mjs` layers over the active Build 296 facade and becomes the outer authenticated Packaging compatibility transport after activation. Compatibility GET is handled by `native-read-transport.mjs`, which calls `/api/admin/packaging-bootstrap` and composes Catalog, Inventory, and Content owner contracts. Contract failures use session cache where available or an empty owner collection with a recorded fallback reason. **There is no physical legacy GET fallback.** Compatibility POST continues through the retained Build 296/289 write transport to `/api/admin/packaging-write`.

Build 297 preserves server/domain authority: read service Build 293 over proven read implementation Build 286; write gateway Build 292 over domain service Build 291; Build 294 GET tombstone; Build 292 POST tombstone. The mature `public/js/admin-packaging-studio.js`, Build 296 runtime, server endpoints, SQL/schema, Wrangler/bindings, R2, and Production remain unchanged.

## Build 297 completed Development proof — 2026-08-24

Build 297 is now **COMPLETE in Development**. Local regression passed on final Build 297 source `8d444153`, and Development deployed that source in `devilndove-site-dev` without touching the real Production application.

The mature Packaging page successfully loaded projects. Initial load plus one normal Refresh proved the native read path remained active:

```text
client_transport_build           297
client_transport_ready           true
post_activation_transport_armed  true
legacy_get_fallback_removed      true
legacy_server_get_reachable      false
bootstrap_contractized           true
bootstrap_source                 packaging-bootstrap
legacy_endpoint_bypassed         true
native_read_request_count        2
native_read_last_status          200
native_read_last_error           ""
```

A normal Packaging Save then succeeded with the UI message `Labeling and packaging project, structured content, claims and artwork selection saved to D1.` The retained write bridge recorded six intercepted writes in the active session, last HTTP status 200, and the server response proved the native authority chain:

```text
intercepted_write_count       6
last_write_http_status        200
gateway_build                 292
gateway_path                  /api/admin/packaging-write
write_service_build           291
write_authority               packaging-domain-service
shared_write_service          true
legacy_post_route_retired     true
packaging_owned_response      true
```

Therefore normal Packaging initial load, Refresh, project loading, and Save are proven in Development without using the retired legacy GET as a normal runtime fallback. `BUILD297_VALIDATION.md` contains the completed evidence.

## Recommended next modular work

The next Packaging build should remove the mature editor's internal naming of `/api/admin/packaging-studio` entirely and give the editor a native client API/facade shape for reads and writes. This should be a naming/client-boundary cutover only: preserve the proven Build 297 read transport and `292 -> 291` write authority, keep the mature editor behavior/functionality intact, and do not mix schema work into the cutover.

Only after that native-client naming cutover is independently proven should `functions/api/admin/packaging-studio.js` be considered for physical deletion. Separately, dormant read helpers inside the Build 291 write-service source can be removed only after write-response/detail dependencies are audited and independently protected.
