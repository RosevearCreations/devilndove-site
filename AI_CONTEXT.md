# Devil n Dove AI Context — Development Build 299 Candidate Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md` and the Packaging build notes through `docs/architecture/BUILD299_PACKAGING_PRINT_SOURCE_CONSISTENCY.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, Content artwork selection, active-runtime legacy GET retirement, write-response decoupling, and physical removal of broad Catalog/Inventory reads from the mature Packaging server source.

Build 291 moved mature Packaging writes into `functions/api/_lib/packagingDomainService.js`; Build 292 made `/api/admin/packaging-write` the native write gateway and retired direct legacy POST authority; Build 293 extracted the active Packaging read service; and Build 294 retired direct legacy GET authority. Authenticated direct legacy GET/POST probes therefore return intentional HTTP 410 tombstones, while native replacements are `/api/admin/packaging-bootstrap` and `/api/admin/packaging-write`.

Build 295 prevented a startup race but still inferred transport ownership from mutable `DDAuth.apiFetch`. Build 296 replaced that inference with explicit callable Packaging bridge handles. Build 297 then fixed the remaining post-activation Refresh regression by adding a no-legacy-fallback client read transport.

## Build 297 completed Development proof — 2026-08-24

Build 297 is complete in Development. Local regression passed; Development deployed final runtime source `8d444153`; Packaging projects loaded; initial load plus Refresh produced native read count `2`, HTTP 200, contractized `packaging-bootstrap`, and no reachable legacy GET fallback.

A normal Packaging Save also passed through the compatibility bridge with Build 292 -> Build 291 provenance. `BUILD297_VALIDATION.md` contains the completed evidence. Build 297's historical regression is pinned at completed parity head `525b5187cddcede69f8b10334951a56366885ebf` so later client work cannot rewrite its proof.

## Build 298 completed Development proof — 2026-08-24

Build 298 is **complete in Development**. Activation commit:

```text
d3fa66c37665797d303a3a44f40015dd81fdf7aa
Build 298 activate native Packaging client cutover
```

Completed Development parity head:

```text
3a19ebc263a206acd22e6490327ffa32567e4a8a
Build 298 record completed Development parity
```

The Development Pages project `devilndove-site-dev` deployed the Build 298 native-client line. Real Devil n Dove Production remained untouched.

Build 298 removes the retired compatibility endpoint name from the mature editor itself. The browser facade is `DDPackagingClient`, launched by `public/js/admin-packaging-native-client-v298.js` and implemented by `public/js/modules/packaging/native-client-v298.mjs`.

The mature editor delegates its Packaging `api()` helper to `DDPackagingClient.request(body, projectId)` and contains no `/api/admin/packaging-studio` literal. The Packaging page loads the Build 298 client before the mature editor while keeping Build 297 compatibility machinery loaded only as defense-in-depth.

### Proven native read path

Initial load plus one normal Refresh produced:

```text
client_build                  298
client_state                  ready
native_client                 true
owner_contracts_ready         true
native_bootstrap_path         /api/admin/packaging-bootstrap
native_write_path             /api/admin/packaging-write
legacy_route_named_by_client  false
native_read_count             2
native_read_status            200
native_read_error             ""
build297_gate_replays         0
build297_gate_blocks          0
build297_transport_ready      true
```

### Proven native write path

A normal Development Packaging Save produced:

```text
client_build                    298
native_write_count              1
native_write_status             200
native_write_error              ""
gateway_build                   292
gateway_path                    /api/admin/packaging-write
write_service_build             291
write_authority                 packaging-domain-service
shared_write_service            true
legacy_post_route_retired       true
packaging_owned_response        true
compatibility_bridge_intercepts 0
```

The zero compatibility intercept count is the decisive Build 298 write proof: the mature editor writes directly to `/api/admin/packaging-write`.

## Build 299 Development candidate — Packaging print source consistency

During normal Development use after Build 298, project edits were saving correctly but the Print Test interface made the printed source look stale. The root cause was a browser-model mismatch:

- **Save project** correctly updates the live Packaging project;
- **Save review version** correctly creates an immutable historical snapshot;
- the Print Test selector defaulted to the newest saved review version after every render;
- the existing optimized-sheet function nevertheless rendered the live Project draft and ignored that selected version.

Build 299 corrects that inconsistency without changing the mature editor or version semantics.

New read endpoint:

```text
GET /api/admin/packaging-version-artifact
  ?packaging_project_id=<project>
  &packaging_project_version_id=<version>
```

It returns exactly one stored `packaging_project_versions.svg_markup` artifact after admin authentication and project/version ownership validation. Normal bootstrap remains small and unchanged.

New browser controller:

```text
public/js/admin-packaging-print-source-v299.js
```

Behavior:

- Print Test defaults to **Project draft** after every project/render refresh;
- draft printing continues through the existing mature-editor optimized-sheet handler unchanged;
- explicitly selecting Version 1/2/etc. intercepts only that print click and loads/prints the immutable stored SVG for that version;
- saved versions are never silently rewritten by **Save project**;
- the selector is presented as **Print source / evidence version** so the current source is explicit.

The earlier browser-compatibility-retirement candidate was removed from the current tree before this fix was activated. That retirement audit is deferred until Build 299 has independent live Development proof.

`BUILD299_VALIDATION.md` contains the local and live validation procedure. Build 299 is not complete until the local regression, normal draft-print proof, and explicit saved-version print proof all pass.

## Preserved authority and safety boundary

Build 299 does not change:

- mature editor `public/js/admin-packaging-studio.js` Build 298;
- Build 298 native client read/write transport;
- Build 297 compatibility runtime/defense layers;
- Build 293 read service over the proven Build 286 read implementation;
- Build 292 write gateway over Build 291 domain service;
- `functions/api/admin/packaging-studio.js` retired GET/POST tombstone endpoint;
- SQL/schema;
- Cloudflare binding/config;
- R2 configuration;
- real Production.

Normal Build 299 draft printing should not call the new version-artifact endpoint. That endpoint is used only after a historical review version is deliberately selected.

## Recommended next modular work

First finish Build 299 Development parity. Do not resume browser-compatibility retirement until current-draft printing and exact historical-version printing are both proven.

After Build 299 is complete, resume the audit of idle browser compatibility layers introduced across Builds 295–297 while preserving Build 298/299 behavior. Do **not** combine that cleanup with physical deletion of `functions/api/admin/packaging-studio.js`; the server tombstone remains a separate decision requiring its own repository/runtime/tooling reference audit.

Separately, dormant read helpers inside the Build 291 write-service source can be removed only after write-response/detail dependencies are audited and independently protected.

Schema parity/data-copy work remains a separate track and must not be mixed into Packaging modularization.
