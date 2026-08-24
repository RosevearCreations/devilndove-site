# Build 300 Validation — Packaging Save + Preview Stabilization

## Scope

Build 300 is a corrective stabilization pass. Forward Packaging modularization is paused.

The live page is restored to the proven Build 298 editor/native-client stack by unloading the Build 299 browser print-source controller. Build 300 then adds one verified-save wrapper before the mature editor.

## Local gate

After pulling `dev`, run:

```bash
python scripts/build300_packaging_stabilization_test.py
```

Expected ending:

```text
BUILD 300 PACKAGING STABILIZATION: PASS
No Cloudflare resource was contacted.
```

## Development browser proof

Use one existing Packaging project and make two harmless, obvious edits:

1. change one ordinary field such as Product / variant;
2. change one English or French claim.

Click **Save project**.

A successful verified save message must contain:

```text
Verified by fresh D1 read-back.
```

Then run in Firefox Console:

```js
(() => {
  console.table(window.DDPackagingSaveStabilizer?.getStatus?.());
})();
```

Expected core values:

```text
build                    300
state                    active
verifiedSaveCount        >= 1
failedVerificationCount  0
lastVerification.ok      true
lastVerification.claims_match true
lastVerification.core_match   true
```

Because nested objects are not expanded well by `console.table`, also run:

```js
(() => {
  console.log('Build 300 verification', window.DDPackagingSaveStabilizer?.getStatus?.()?.lastVerification);
})();
```

Then click the normal **Refresh** button or hard-refresh the page. The changed ordinary field and changed claim must still be present.

### Preview proof

If Product identity — English was still the default/derived value, Product / variant should keep it synchronized and Preview should display that verified identity.

Run:

```js
(() => {
  const s = window.DDPackagingClient?.getStatus?.();
  console.table({
    stabilization_build: s?.stabilizationBuild,
    product_value: s?.productValue,
    identity_value: s?.identityValue,
    identity_is_derived: s?.identityIsDerived,
    preview_contains_identity: s?.previewContainsIdentity,
    verified_save_count: s?.verifiedSaveCount,
    failed_verification_count: s?.failedVerificationCount
  });
})();
```

Expected after a derived identity save:

```text
stabilization_build       300
identity_is_derived       true
preview_contains_identity true
verified_save_count       >= 1
failed_verification_count 0
```

Then explicitly customize Product identity — English to a different value and change Product / variant again. The explicit identity must remain unchanged; it is the renderer authority.

## Failure behavior

If D1 read-back does not match what was in the editor, Build 300 must **not** show success. The editor should display a verification error and retain its browser draft. `lastVerification` will identify whether claims or named core fields differ.

## Safety

Build 300 does not modify the mature editor, Build 298 native client implementation, Build 293/286 read authority, Build 292/291 write authority, retired tombstone, SQL/schema, Cloudflare bindings/config, R2, or real Production.

No later Packaging retirement/modularization build should begin until all Build 300 Development browser gates pass.
