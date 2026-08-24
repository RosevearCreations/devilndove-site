# Devil n Dove AI Context — Development Build 300 Stabilization Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `BUILD298_VALIDATION.md`, `BUILD299_VALIDATION.md`, and `docs/architecture/BUILD300_PACKAGING_STABILIZATION.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

## Completed stable Packaging baseline

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, active-runtime legacy GET retirement, write-response decoupling, and removal of broad Catalog/Inventory reads from the mature Packaging server path.

Build 291 moved mature Packaging writes into `functions/api/_lib/packagingDomainService.js`; Build 292 made `/api/admin/packaging-write` the native write gateway; Build 293 extracted the active Packaging read service; and Build 294 retired direct legacy GET authority. The legacy `/api/admin/packaging-studio` endpoint remains an intentional tombstone only.

Builds 295–297 stabilized startup/read compatibility. Build 298 then removed the retired endpoint name from the mature editor and moved normal editor traffic to the native client.

### Build 298 completed Development proof — 2026-08-24

Activation commit:

```text
d3fa66c37665797d303a3a44f40015dd81fdf7aa
Build 298 activate native Packaging client cutover
```

Completed parity head:

```text
3a19ebc263a206acd22e6490327ffa32567e4a8a
```

Build 298 live proof established:

```text
native read:  /api/admin/packaging-bootstrap -> 200
native write: /api/admin/packaging-write     -> 200
write gateway build: 292
write service build: 291
write authority: packaging-domain-service
compatibility bridge intercepts: 0
```

Build 298 is the last fully completed Packaging runtime baseline.

## Build 299 status — NOT COMPLETE / browser controller rolled back

Build 299 attempted to make current-draft versus historical-version printing explicit. Its local regression passed and its browser controller loaded, but live validation exposed owner-visible regressions before completion:

- Packaging details/Preview still appeared stale;
- changed claims then appeared not to persist after **Save project**;
- the tested project had no saved review versions, so the historical-version path was not fully proven.

Build 299 was therefore **not signed off**.

Build 300 unloads the Build 299 browser controller from the live Packaging page. The Build 299 controller and saved-version artifact endpoint may remain in the repository for audit/history, but they are dormant from normal Packaging page operation.

See `BUILD299_VALIDATION.md` for the rollback record.

## Build 300 — mandatory Packaging stabilization

No further Packaging modularization, compatibility retirement, tombstone deletion, or schema work should proceed until Build 300 passes live Development validation.

The live Packaging page is restored to the proven Build 298 editor/native-client stack and loads one additional stabilization layer:

```text
public/js/admin-packaging-save-stabilizer-v300.js
```

Load order:

```text
Build 297 startup/defense layers
-> Build 298 native client
-> Build 300 save stabilizer
-> mature Build 298 editor
```

The Build 299 browser print-source controller is not loaded.

### Verified Save Project behavior

For `action: save_project` only, Build 300:

1. calls the unchanged Build 298 native client;
2. writes through `/api/admin/packaging-write` and the proven Build 292 -> 291 authority chain;
3. immediately performs a fresh native read of the same project;
4. compares the fresh D1-backed result with the editor payload for core project fields and the complete structured claims array;
5. returns success only when the fresh read matches;
6. otherwise returns an explicit verification failure so the mature editor keeps its browser draft and does not display a false-success state.

A successful message must include:

```text
Verified by fresh D1 read-back.
```

Diagnostics:

```js
window.DDPackagingSaveStabilizer?.getStatus?.()
window.DDPackagingClient?.getStatus?.()
```

Required save proof:

```text
verifiedSaveCount >= 1
failedVerificationCount = 0
lastVerification.ok = true
lastVerification.claims_match = true
lastVerification.core_match = true
```

After a normal Refresh/hard refresh, the edited ordinary field and edited claim must still be present.

### Preview stabilization

The current soap renderer intentionally gives `Product identity — English` precedence over `Product / variant`. Build 300 keeps explicit identity edits authoritative but synchronizes the identity while it is still blank/default/derived from Product / variant.

Expected derived-identity proof:

```text
identityIsDerived = true
previewContainsIdentity = true
```

Once the owner deliberately edits English identity to a different custom value, later Product / variant edits must not overwrite that explicit identity.

The soap Front tagline field is now clarified as saved metadata because the current soap-ribbon renderer does not print that field.

## Build 300 preserved authority/safety boundary

Build 300 does not change:

- mature editor `public/js/admin-packaging-studio.js` Build 298;
- Build 298 native client launcher/module;
- Build 293/286 Packaging read authority;
- Build 292/291 Packaging write authority;
- Build 294 retired-route tombstone;
- SQL/schema;
- Cloudflare binding/config;
- R2 configuration;
- real Production.

The Production freeze remains Build 280.

## Mandatory next action

**Do not begin a future Packaging pass yet.**

First run `scripts/build300_packaging_stabilization_test.py`, deploy/confirm the Development source, and live-prove:

- ordinary project field save;
- claim save;
- fresh D1 read-back verification;
- persistence after Refresh;
- Preview matches the verified saved identity;
- explicit identity override is preserved.

Only after those gates pass may Build 299 printing be reconsidered or any later compatibility-retirement work resume.

Schema parity/data-copy remains a completely separate track and must not be mixed into this stabilization work.
