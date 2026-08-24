# Devil n Dove AI Context — Development Build 301 Compatibility Checkpoint Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `BUILD298_VALIDATION.md`, `BUILD299_VALIDATION.md`, `BUILD300_VALIDATION.md`, `BUILD301_VALIDATION.md`, `docs/architecture/BUILD300_PACKAGING_STABILIZATION.md`, and `docs/architecture/BUILD301_PACKAGING_COMPATIBILITY_CHECKPOINT.md`.

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

Build 298 remains the proven native transport/editor implementation baseline underneath later compatibility checkpoints.

## Build 299 status — NOT COMPLETE / browser controller rolled back

Build 299 attempted to make current-draft versus historical-version printing explicit. Its local regression passed and its browser controller loaded, but live validation exposed owner-visible regressions before completion:

- Packaging details/Preview still appeared stale;
- changed claims then appeared not to persist after **Save project**;
- the tested project had no saved review versions, so the historical-version path was not fully proven.

Build 299 was therefore **not signed off**.

Build 300 unloads the Build 299 browser controller from the live Packaging page. The Build 299 controller and saved-version artifact endpoint may remain in the repository for audit/history, but they are dormant from normal Packaging page operation.

See `BUILD299_VALIDATION.md` for the rollback record.

## Build 300 — COMPLETE IN DEVELOPMENT — 2026-08-24

Build 300 is the mandatory Packaging stabilization pass that restored trust in Save Project and Preview before forward modularization resumed.

Runtime completion source:

```text
37d2d1c21e80d64211f5f50a8d4be607f23b16e4
Build 300 guard preview audit feedback regression
```

Completed documentation/handoff head now historically pinned by Build 301:

```text
21b01cc34ef734f581da22a7f0d3c43ec10607c0
Build 300 record completed stabilization handoff
```

Development Pages project deployed source for the live runtime proof:

```text
devilndove-site-dev
source 37d2d1c
```

The Cloudflare `Environment = Production` label on that deployment refers to the primary environment of the Development Pages project. Real Devil n Dove Production was not contacted and remains frozen at Build 280.

### Build 300 live runtime shape

```text
Build 297 startup/defense layers
-> Build 298 native client
-> Build 300 verified-save + Preview stabilizer
-> mature Build 298 editor
```

The Build 299 browser print-source controller is not loaded.

### Verified Save Project — PASS

For `action: save_project` only, Build 300:

1. calls the unchanged Build 298 native client;
2. writes through `/api/admin/packaging-write` and the proven Build 292 -> 291 authority chain;
3. immediately performs a fresh native read of the same project;
4. compares the fresh D1-backed result with the editor payload for core project fields and the complete structured claims array;
5. returns success only when the fresh read matches;
6. otherwise returns an explicit verification failure so the mature editor keeps its browser draft and does not display a false-success state.

Live proof:

```text
verifiedSaveCount = 2
failedVerificationCount = 0
lastVerification.ok = true
expected_claim_count = 3
actual_claim_count = 3
claims_match = true
core_match = true
mismatch_fields = []
```

A successful message includes:

```text
Verified by fresh D1 read-back.
```

### Full-ribbon Preview — PASS

The stale-looking Preview was traced to presentation rather than persistence. The soap SVG is a wide ribbon and the claims panel sits near the far-right edge; the old detail-width presentation could leave changed claims outside the visible viewport after rerender.

Build 300 now defaults Preview to **Fit full label**, while **Detail / scroll** preserves the old large inspection view when wanted. The fitted browser view does not change physical SVG millimetre dimensions, print output, or exports.

Live proof:

```text
preview_mode = fit
preview_fit_count = 1
forced_preview_refresh_count = 0
dom_claim_count = 2
rendered_claim_count = 2
preview_claim_target_count = 2
preview_svg_present = true
preview_claims_match_dom = true
dom_matches_verified = true
```

The mature soap renderer does print `Front tagline`; Build 300 leaves that normal label/rendered behavior intact.

### Preview audit stability — PASS

A live diagnostic exposed a self-triggering Preview audit loop. Build 300 now updates Preview status text only when needed and ignores mutations originating inside its own Preview controls.

Final idle proof:

```text
audit_before = 4
audit_after = 4
audit_delta = 0
```

### Build 300 historical regression

Build 301 changes `scripts/build300_packaging_stabilization_test.py` so completed Build 300 is validated against historical head `21b01cc34ef734f581da22a7f0d3c43ec10607c0` rather than future HEAD. Do not undo this historical pin.

## Build 301 — CURRENT PACKAGING COMPATIBILITY CHECKPOINT

Owner direction: advance Packaging to one Build 301 compatibility conversation rather than continuing to discuss Build 297, 298 and 300 as if they are separate current runtimes.

Build 301 therefore becomes the single **current compatibility identity** while older build numbers remain explicit implementation provenance only.

Build 301 adds:

```text
public/js/admin-packaging-compatibility-v301.js
```

and exposes:

```js
window.DDPackagingCompatibility?.getStatus?.()
```

Top-level expected identity:

```text
build = 301
compatibilityCheckpoint = true
singleConversationBuild = 301
state = active   // after normal Packaging startup/read completes
```

### Implementation provenance under the one Build 301 conversation

```text
startupGateBuild              297
clientTransportBuild          297
nativeClientBuild             298
stabilizationBuild            300
editorImplementationBuild     298
nativeReadGatewayBuild        293
nativeReadImplementationBuild 286
nativeWriteGatewayBuild       292
nativeWriteServiceBuild       291
```

These are not separate current workstreams. They identify which already-proven implementation is supplying each responsibility beneath Build 301.

### Build 301 intended live page shape after activation

```text
Build 297 startup gate
-> core admin/runtime bootstrap
-> Build 297 compatibility transport
-> Build 298 native client
-> Build 300 verified-save + Preview stabilizer
-> Build 301 compatibility checkpoint
-> mature Build 298 editor
```

The Build 301 checkpoint is diagnostic/orchestration metadata only. It performs no API fetch and installs no additional network transport.

### Build 301 activation workflow

Build 301 support is staged before page activation. Run locally:

```bash
python scripts/apply_build301_packaging_compatibility_checkpoint.py
python scripts/build300_packaging_stabilization_test.py
python scripts/build301_packaging_compatibility_checkpoint_test.py
```

Only after both regressions pass should `admin/packaging-studio/index.html` be committed as:

```text
Build 301 activate Packaging compatibility checkpoint
```

See `BUILD301_VALIDATION.md` for exact browser proof and completion gates.

## Build 301 safety boundary

Build 301 does not modify:

- Build 297 startup gate implementation;
- Build 297 client-transport launcher/module;
- Build 298 native-client launcher/module;
- Build 300 save/Preview stabilizer;
- mature editor implementation;
- Build 293/286 Packaging read authority;
- Build 292/291 Packaging write authority;
- Build 294 retired-route tombstone;
- SQL/schema;
- Cloudflare binding/config;
- R2 configuration;
- real Production.

The Production freeze remains Build 280.

## Next Packaging rule

Treat **Build 301** as the one current Packaging compatibility conversation after activation. When diagnostics show older build numbers, describe them as implementation provenance beneath Build 301, not as separate current passes.

Do not physically remove Build 297 compatibility layers merely because Build 301 reports them idle. Build 298 still has a real readiness dependency on the Build 297 transport. A future retirement build must first remove that dependency and prove native startup/save/Preview behavior independently.

Do not reactivate Build 299 print-source behavior without a deliberate redesign and new live proof.

Schema parity/data-copy remains a completely separate track and must not be mixed into Packaging compatibility work.
