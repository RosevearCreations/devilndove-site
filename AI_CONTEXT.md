# Devil n Dove AI Context — Development Build 301 Completed Compatibility Baseline

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap. For the modular Packaging line after the Build 280 Production freeze, read `BUILD300_VALIDATION.md`, `BUILD301_VALIDATION.md`, `docs/architecture/BUILD300_PACKAGING_STABILIZATION.md`, and `docs/architecture/BUILD301_PACKAGING_COMPATIBILITY_CHECKPOINT.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

## Current Packaging rule

**Build 301 is the one current Packaging compatibility baseline/conversation.**

Do not describe Builds 297, 298, or 300 as separate current passes. They are implementation provenance underneath the completed Build 301 checkpoint.

Build 301 runtime activation commit:

```text
e2be2209
Build 301 activate Packaging compatibility checkpoint
```

Build 301 completion documentation commits begin after that runtime activation. No runtime file changed after the successful live browser proof.

Development Pages project:

```text
devilndove-site-dev
```

The Cloudflare `Environment = Production` label for this project refers to the primary environment of the Development Pages project. It is not real Devil n Dove Production.

## Completed Packaging lineage

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, compatibility guards, and browser/runtime decoupling.

Build 291 moved mature Packaging writes into `functions/api/_lib/packagingDomainService.js`.

Build 292 made `/api/admin/packaging-write` the native write gateway.

Build 293 extracted the active Packaging read service.

Build 294 retired direct legacy GET authority. `/api/admin/packaging-studio` remains an intentional tombstone only.

Builds 295–297 stabilized startup/read compatibility.

Build 298 removed the retired endpoint name from the mature editor and moved normal editor traffic to the native client.

Build 299 attempted draft-versus-saved-version print-source handling but was **NOT COMPLETE** and its browser controller was rolled back after live regressions. Do not reactivate it without a deliberate redesign and fresh proof.

Build 300 stabilized Save Project and Preview and is **COMPLETE IN DEVELOPMENT**.

Build 301 unifies the current Packaging compatibility identity and is **COMPLETE IN DEVELOPMENT**.

## Build 300 historical stabilization baseline

Completed Build 300 documentation/handoff head:

```text
21b01cc34ef734f581da22a7f0d3c43ec10607c0
```

`scripts/build300_packaging_stabilization_test.py` is historically pinned to this completed head.

Build 300 proved:

```text
verified Save Project through fresh D1 read-back
claims/core fields persisted correctly
fitted full-ribbon Preview
DOM -> rendered SVG claim parity
verified saved state -> DOM parity
forced preview refreshes = 0
idle preview audit delta = 0
```

The mature soap renderer does print `Front tagline`.

## Build 301 — COMPLETE IN DEVELOPMENT

Build 301 adds the single top-level browser compatibility checkpoint:

```text
public/js/admin-packaging-compatibility-v301.js
```

Browser status authority:

```js
window.DDPackagingCompatibility?.getStatus?.()
```

Top-level identity:

```text
build = 301
compatibilityCheckpoint = true
singleConversationBuild = 301
state = active
```

### Proven implementation provenance beneath Build 301

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

These numbers identify the proven implementation supplying each responsibility. They are not separate current conversations.

### Live page order

```text
Build 297 startup gate
-> core admin/runtime bootstrap
-> Build 297 compatibility transport
-> Build 298 native client
-> Build 300 verified-save + Preview stabilizer
-> Build 301 compatibility checkpoint
-> mature Build 298 editor
```

The rolled-back Build 299 print-source controller is not loaded.

### Build 301 local proof — PASS

Activation helper passed and changed only `admin/packaging-studio/index.html` before commit.

Completed Build 300 historical regression passed:

```text
BUILD 300 PACKAGING STABILIZATION HISTORICAL REGRESSION: PASS (21b01cc3)
No Cloudflare resource was contacted.
```

Build 301 regression passed:

```text
BUILD 301 PACKAGING COMPATIBILITY CHECKPOINT: PASS
No Cloudflare resource was contacted.
```

No SQL/schema, Cloudflare binding/config, R2, or Production change was part of Build 301.

### Build 301 Development deployment proof — PASS

Activation commit:

```text
e2be2209
```

Development deployment source:

```text
Source e2be220
Status Active
```

During initial validation the project alias briefly served the preceding Packaging HTML while the new Build 301 JavaScript asset was already available. Direct HTTP checks later showed the project alias serving both:

```text
BUILD 301 SCRIPT: YES
BUILD 300 STABILIZER: YES
```

No Packaging code change was required for this transient deployment propagation state.

### Build 301 live browser proof — PASS

Initial load:

```text
build301_script_in_page       true
build301_global_exists        true
compatibility_build           301
compatibility_state           active
compatibility_checkpoint      true
single_conversation_build     301
startup_gate_ready            true
client_transport_ready        true
native_client_ready           true
save_verification_active      true
preview_stabilization_active  true
native_read_count             2
native_read_status            200
failed_verification_count     0
preview_mode                  fit
forced_preview_refresh_count  0
```

After one Development-only Save Project:

```text
compatibility_build          301
compatibility_state          active
native_read_count            4
native_read_status           200
native_write_count           1
native_write_status          200
verified_save_count          1
failed_verification_count    0
preview_mode                 fit
forced_preview_refresh_count 0
compatibility_delayed        0
compatibility_replayed       0
compatibility_blocked        0
gateway_build                292
write_service_build          291
write_authority              packaging-domain-service
```

This is the completed Build 301 Development proof.

## Trusted current Packaging architecture

```text
Build 301 compatibility checkpoint
    |
    +-- startup/compatibility gate     Build 297
    +-- compatibility transport        Build 297
    +-- native browser client          Build 298
    +-- Save/Preview stabilization     Build 300
    +-- mature editor                  Build 298
    +-- native read gateway            Build 293
    +-- read implementation            Build 286
    +-- native write gateway           Build 292
    +-- write domain service           Build 291
```

Normal browser traffic is native. Build 301 live proof showed compatibility delayed/replayed/blocked counters all at zero.

## Build 301 safety boundary

Build 301 does not alter:

- Build 297 startup gate implementation;
- Build 297 client-transport implementation;
- Build 298 native-client implementation;
- Build 300 Save/Preview stabilizer implementation;
- mature Packaging editor implementation;
- Build 293/286 Packaging read authority;
- Build 292/291 Packaging write authority;
- Build 294 legacy-route tombstone;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Mandatory rule before the next Packaging runtime build

Before changing Packaging runtime again, **pin completed Build 301 historically** so its proof cannot follow future HEAD.

A future compatibility-retirement build must not simply delete Build 297. Build 298 still has a real readiness dependency on the Build 297 compatibility transport/status event. First remove that dependency in a bounded build and prove native startup/read/write/Save/Preview independently; only then consider deleting outer compatibility layers.

Do not reactivate Build 299 print-source behavior without a new design and live proof.

## Separate schema/data parity track — DO NOT MIX WITH PACKAGING

There is a separate Devil n Dove database parity problem:

1. missing Production business data in Development;
2. incomplete fresh-install schema, with Development missing Production tables that current runtime code may still use.

Examples previously identified include `accounting_order_records`, `gift_cards`, several Command Center tables, and `notification_dispatch_log` fresh-install inconsistency.

Priority on that track remains:

```text
schema parity first
then business-data copy/migration
```

Do not combine that work with Build 301 Packaging compatibility or future Packaging retirement passes.
