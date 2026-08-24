# Build 300 Validation — Packaging Save + Preview Stabilization

## Scope

Build 300 is a corrective stabilization pass. Forward Packaging modularization is paused.

The live page is restored to the proven Build 298 editor/native-client stack by unloading the Build 299 browser print-source controller. Build 300 then adds one verified-save + Preview stabilization wrapper before the mature editor.

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
  const s = window.DDPackagingSaveStabilizer?.getStatus?.();
  console.table({
    build: s?.build,
    state: s?.state,
    verified_save_count: s?.verifiedSaveCount,
    failed_verification_count: s?.failedVerificationCount,
    preview_mode: s?.previewMode,
    preview_audit_count: s?.previewAuditCount,
    forced_preview_refresh_count: s?.forcedPreviewRefreshCount,
    preview_fit_count: s?.previewFitCount,
    identity_is_derived: s?.identityIsDerived,
    preview_contains_identity: s?.previewContainsIdentity
  });
  console.log('SAVE VERIFICATION:', s?.lastVerification);
  console.log('PREVIEW AUDIT:', s?.lastPreviewAudit);
})();
```

Expected core values after a verified save:

```text
build                         300
state                         active
verified_save_count           >= 1
failed_verification_count     0
preview_mode                  fit
preview_audit_count           >= 1
preview_fit_count             >= 1
```

Expected `SAVE VERIFICATION` object:

```text
ok                    true
claims_match          true
core_match            true
mismatch_fields       []
```

Expected `PREVIEW AUDIT` object for a project with up to four printable claims:

```text
preview_svg_present       true
preview_mode              fit
preview_claims_match_dom  true
dom_matches_verified      true
rendered_claim_count      == preview_claim_target_count
```

The Preview tab should now show a small **Live preview** status strip with two controls:

- **Fit full label** — default; the entire soap ribbon including the far-right claims panel is visible inside the editor width;
- **Detail / scroll** — restores the former large horizontally scrolling inspection view.

The fitted view changes only the browser Preview presentation. The SVG's physical millimetre dimensions, exports and print output remain unchanged.

Then click the normal **Refresh** button or hard-refresh the page. The changed ordinary field and changed claim must still be present. Return to Preview: the full fitted ribbon must contain the refreshed claim text.

### Derived identity proof

If Product identity — English was still the default/derived value, Product / variant should keep it synchronized and Preview should display that verified identity.

Then explicitly customize Product identity — English to a different value and change Product / variant again. The explicit identity must remain unchanged; it is the renderer authority.

### Front tagline correction

The mature soap renderer does print `Front tagline`. Build 300 must leave its normal label and rendered behavior intact; the stabilizer must not describe it as non-printing metadata.

## Failure behavior

If D1 read-back does not match what was in the editor, Build 300 must **not** show success. The editor should display a verification error and retain its browser draft. `lastVerification` will identify whether claims or named core fields differ.

If the current claim editor rows are not found in the generated SVG text, the Preview audit triggers one mature-renderer input refresh and checks again. `forcedPreviewRefreshCount` records that recovery attempt.

## Safety

Build 300 does not modify the mature editor, Build 298 native client implementation, Build 293/286 read authority, Build 292/291 write authority, retired tombstone, SQL/schema, Cloudflare bindings/config, R2, or real Production.

No later Packaging retirement/modularization build should begin until all Build 300 Development browser gates pass.
