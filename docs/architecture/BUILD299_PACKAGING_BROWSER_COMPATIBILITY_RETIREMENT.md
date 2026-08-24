# Build 299 — Packaging Browser Compatibility Retirement

## Decision

Build 298 proved the mature Packaging editor no longer emits the retired compatibility endpoint for normal load, Refresh, or Save. However, the Build 298 client still used the Build 297 `dd:packaging-client-transport-active` event and `clientTransportBuild >= 297` as a startup-readiness signal.

Therefore Build 299 is not a deletion sweep. It first removes that readiness dependency, then unloads the now-unnecessary outer Build 297 browser scripts from the Packaging page.

## Runtime cut

Build 299 introduces:

- `public/js/modules/packaging/native-client-v299.mjs`
- `public/js/admin-packaging-native-client-v299.js`

The v299 client preserves Build 298 native semantics:

- reads `/api/admin/packaging-bootstrap`;
- composes Catalog, Inventory, and Content owner contracts;
- writes `/api/admin/packaging-write` directly;
- preserves session-cache / explicit contract-unavailable read degradation;
- records native read/write counters and the Build 292 write boundary.

The readiness dependency changes to the underlying modular Packaging runtime:

```text
dd:packaging-runtime-active
        ↓
DDPackagingContracts.getStatus().state === active
        ↓
readCatalog + readInventory + readContentMedia callable
        ↓
DDPackagingClient Build 299 ready
```

The client deliberately does **not** require:

- `dd:packaging-client-transport-active`;
- `clientTransportBuild >= 297`;
- `clientTransportReady` from the Build 297 outer overlay.

## Page retirement boundary

Before Build 299:

```text
Build 297 startup gate
→ Build 290 runtime via admin.js
→ Build 297 post-activation client overlay
→ Build 298 native client
→ mature editor
```

After Build 299 activation:

```text
Build 290 runtime via admin.js
→ Build 299 runtime-native client
→ mature Build 298 editor
```

The page stops loading:

- `public/js/admin-packaging-startup-gate-v297.js`
- `public/js/admin-packaging-client-transport-v297.js`
- superseded Build 298 launcher `public/js/admin-packaging-native-client-v298.js`

Those files remain in the repository as immutable historical/rollback artifacts.

## What remains intentionally active

Build 290 still internally composes:

- Build 288 legacy GET retirement guard;
- Build 286 bootstrap bridge;
- Build 289 write-response bridge;
- Build 287 artwork picker.

Build 299 does not change those internals. Normal Build 299 traffic should bypass the compatibility bridges just as Build 298 did, but their physical retirement requires a separate dependency audit.

## Server boundary unchanged

No server endpoint is changed:

- read authority: `/api/admin/packaging-bootstrap` → Build 293 read service → proven Build 286 implementation;
- write authority: `/api/admin/packaging-write` → Build 292 gateway → Build 291 domain service;
- `/api/admin/packaging-studio` remains an intentional authenticated HTTP 410 tombstone for both retired GET/POST authority.

The tombstone is not deleted in Build 299.

## Safety constraints

Build 299 must not change SQL/schema, Cloudflare bindings/config, R2, or real Production. The mature editor stays unchanged. The Build 297 source files remain available historically even though the Packaging page no longer loads them.

## Completion evidence

Development completion requires:

1. local Build 299 regression PASS;
2. activation page contains only runtime → v299 client → mature editor for Packaging-specific transport scripts;
3. Development initial load and Refresh use `/api/admin/packaging-bootstrap` with HTTP 200;
4. v299 reports runtime dependency event `dd:packaging-runtime-active`, runtime Build 290 active, owner contracts ready, and Build 297 readiness dependency false;
5. `window.DDPackagingStartupGate` is absent in a fresh page session;
6. no Build 297 gate/overlay script tags are loaded;
7. normal Save uses `/api/admin/packaging-write` with Build 292 → Build 291 provenance;
8. Build 289 compatibility write intercept count remains 0 for normal native Save;
9. no normal request reaches the retired server route;
10. real Production remains untouched.

## Next audit

Only after Build 299 is proven should a later build audit the Build 288/289 internal compatibility guards and the Build 286 compatibility bridge. Physical deletion of the server tombstone remains a separate later decision.
