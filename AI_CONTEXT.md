# Devil n Dove AI Context — Development Build 298 Staging Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md` and the Packaging build notes through `docs/architecture/BUILD298_PACKAGING_NATIVE_CLIENT_CUTOVER.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, Content artwork selection, active-runtime legacy GET retirement, write-response decoupling, and physical removal of broad Catalog/Inventory reads from the mature Packaging server source.

Build 291 moved mature Packaging writes into `functions/api/_lib/packagingDomainService.js`; Build 292 made `/api/admin/packaging-write` the native write gateway and retired direct legacy POST authority; Build 293 extracted the active Packaging read service; and Build 294 retired direct legacy GET authority. Authenticated direct legacy GET/POST probes therefore return intentional HTTP 410 tombstones, while native replacements are `/api/admin/packaging-bootstrap` and `/api/admin/packaging-write`.

Build 295 prevented a startup race but still inferred transport ownership from mutable `DDAuth.apiFetch`. Build 296 replaced that inference with explicit callable Packaging bridge handles. Build 297 then fixed the remaining post-activation Refresh regression by adding a no-legacy-fallback client read transport. Initial load and Refresh use `/api/admin/packaging-bootstrap`; normal compatibility saves still reach `/api/admin/packaging-write` through the retained Build 289 bridge.

## Build 297 completed Development proof — 2026-08-24

Build 297 is complete in Development. Local regression passed; Development deployed final runtime source `8d444153`; Packaging projects loaded; initial load plus Refresh produced native read count `2`, HTTP 200, contractized `packaging-bootstrap`, and no reachable legacy GET fallback.

A normal Packaging Save also passed. The active session reported:

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

`BUILD297_VALIDATION.md` contains the completed evidence. Build 297's historical regression is now pinned at completed parity head `525b5187cddcede69f8b10334951a56366885ebf` so later client work cannot rewrite its proof.

## Build 298 — native client cutover staging

Build 298 removes the retired compatibility endpoint name from the mature editor itself. The new browser facade is `DDPackagingClient`, launched by `public/js/admin-packaging-native-client-v298.js` and implemented by `public/js/modules/packaging/native-client-v298.mjs`.

The Build 298 native client:

- waits for the proven Build 297 Packaging owner-contract runtime;
- physically reads `/api/admin/packaging-bootstrap` and composes Catalog, Inventory, and Content owner contracts;
- uses session-cache or explicit empty owner collections if an owner contract fails, never a retired endpoint fallback;
- physically writes `/api/admin/packaging-write` directly;
- records native `readCount`, `writeCount`, HTTP status, errors, bootstrap provenance, and the returned `write_boundary`;
- contains no `/api/admin/packaging-studio` literal.

Build 297 remains loaded as defense-in-depth during Build 298, but after the mature editor cutover its compatibility startup/write counters should remain idle for normal editor load, Refresh and Save.

### Activation boundary still pending local application

The Build 298 support files, architecture, regression, changed-file manifest and surgical patch helper are staged on `dev`. The new client is deliberately not active on the Packaging page until the two-file cutover is applied together.

Run locally after pulling the staged Build 298 commits:

```bash
python scripts/apply_build298_packaging_native_client_cutover.py
python scripts/build298_packaging_native_client_cutover_test.py
```

The helper changes only:

- `public/js/admin-packaging-studio.js`: replaces the old transport-owning `api()` helper with `DDPackagingClient.request(body, projectId)` and removes the retired endpoint literal;
- `admin/packaging-studio/index.html`: loads the Build 298 native client before the mature editor and advances the editor cache key to `v=298`.

The helper aborts if the exact expected Build 277 editor block or Build 297 script block has drifted.

After the regression passes, commit/push those two activation files to Development and perform the live checks in `BUILD298_VALIDATION.md`.

## Build 298 completion target

Build 298 is complete only when normal initial load and Refresh use `/api/admin/packaging-bootstrap`, normal Save uses `/api/admin/packaging-write`, the Build 298 client proves `gateway_build: 292` and `write_service_build: 291`, normal editor traffic produces zero Build 297 compatibility replays/intercepts in a fresh session, direct legacy GET/POST probes remain 410 tombstones, and real Production is untouched.

Only after Build 298 is independently proven should the next build audit whether the legacy browser compatibility layers and finally `functions/api/admin/packaging-studio.js` can be physically removed. Dormant read helpers inside the Build 291 write-service source remain a separate later audit and must not be mixed into this client cutover.
