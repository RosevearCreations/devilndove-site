# Build 301 Validation — Packaging Compatibility Checkpoint

## Status — STAGED / NOT YET ACTIVATED

Build 301 makes `301` the single current Packaging browser compatibility identity while preserving the completed Build 297/298/300 implementation layers unchanged underneath.

Completed Build 300 historical head:

```text
21b01cc34ef734f581da22a7f0d3c43ec10607c0
```

Real Production remains frozen at Build 280.

## Local activation

After pulling `dev`, run:

```bash
python scripts/apply_build301_packaging_compatibility_checkpoint.py
```

Expected:

```text
PASS: Packaging page now presents Build 301 as the single compatibility checkpoint
PASS: Build 301 compatibility status loads after stabilized native client and before mature editor
PASS: Build 297/298/300 proven implementation files remain unchanged
No server, schema, binding, R2, or Production resource was contacted.
```

Before commit, `git status --short` should show only:

```text
 M admin/packaging-studio/index.html
```

## Local regression

Run:

```bash
python scripts/build300_packaging_stabilization_test.py
python scripts/build301_packaging_compatibility_checkpoint_test.py
```

Expected Build 300 ending:

```text
BUILD 300 PACKAGING STABILIZATION HISTORICAL REGRESSION: PASS (21b01cc3)
No Cloudflare resource was contacted.
```

Expected Build 301 ending:

```text
BUILD 301 PACKAGING COMPATIBILITY CHECKPOINT: PASS
No Cloudflare resource was contacted.
```

## Activation commit

Only after both regressions pass:

```bash
git add admin/packaging-studio/index.html
git commit -m "Build 301 activate Packaging compatibility checkpoint"
git push origin dev
```

Then confirm Development deployment source with:

```bash
npx --yes wrangler@latest pages deployment list \
  --project-name devilndove-site-dev | head -n 20
```

The top Development deployment must use the Build 301 activation commit.

## Development browser proof

Hard-refresh `/admin/packaging-studio/` on Development and allow the project list/current project to load.

Run in Firefox Console:

```js
(() => {
  const s = window.DDPackagingCompatibility?.getStatus?.();
  const boundary = s?.lastWriteBoundary || {};
  const traffic = s?.legacyCompatibilityTraffic || {};

  console.table({
    compatibility_build: s?.build,
    compatibility_state: s?.state,
    compatibility_checkpoint: s?.compatibilityCheckpoint,
    single_conversation_build: s?.singleConversationBuild,

    startup_gate_ready: s?.startupGateReady,
    client_transport_ready: s?.clientTransportReady,
    native_client_ready: s?.nativeClientReady,
    save_verification_active: s?.saveVerificationActive,
    preview_stabilization_active: s?.previewStabilizationActive,

    native_read_count: s?.nativeReadCount,
    native_read_status: s?.nativeReadStatus,
    native_write_count: s?.nativeWriteCount,
    native_write_status: s?.nativeWriteStatus,

    verified_save_count: s?.verifiedSaveCount,
    failed_verification_count: s?.failedVerificationCount,
    preview_mode: s?.previewMode,
    forced_preview_refresh_count: s?.forcedPreviewRefreshCount,

    compatibility_delayed: traffic?.delayed,
    compatibility_replayed: traffic?.replayed,
    compatibility_blocked: traffic?.blocked,

    gateway_build: boundary?.gateway_build,
    write_service_build: boundary?.write_service_build,
    write_authority: boundary?.write_authority
  });
})();
```

Expected after initial load:

```text
compatibility_build          301
compatibility_state          active
compatibility_checkpoint     true
single_conversation_build    301
startup_gate_ready           true
client_transport_ready       true
native_client_ready          true
save_verification_active     true
preview_stabilization_active true
native_read_count            >= 1
native_read_status           200
failed_verification_count    0
preview_mode                 fit
forced_preview_refresh_count 0
compatibility_delayed        0
compatibility_replayed       0
compatibility_blocked        0
```

### Save proof

Make one harmless Development-only edit and click **Save project**.

Success must still include:

```text
Verified by fresh D1 read-back.
```

Run the same Build 301 console block again. Expected:

```text
native_write_count       >= 1
native_write_status      200
verified_save_count      >= 1
failed_verification_count 0
gateway_build            292
write_service_build      291
write_authority          packaging-domain-service
compatibility_replayed   0
compatibility_blocked    0
```

The Preview must remain fitted and reflect the saved claim/product state.

## Implementation provenance proof

Optional browser check:

```js
(() => {
  console.table(window.DDPackagingCompatibility?.getStatus?.()?.implementationProvenance || {});
})();
```

Expected provenance:

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

These are historical/proven implementation identities under the one current Build 301 compatibility checkpoint.

## Completion decision

Do not mark Build 301 complete until local regression, Development deployment source, native load/read, verified Save Project, fitted Preview, zero normal compatibility replay/block traffic, and the 292 -> 291 write boundary all pass.
