# Build 300 Validation — Packaging Live Preview Sync

## Scope

Build 300 corrects a live Preview mismatch discovered during Build 299 validation. Product / variant can save correctly while the soap SVG continues rendering an older `Product identity — English` value because the renderer intentionally gives English identity precedence.

Build 300 preserves explicit owner identity edits while keeping the default/derived identity synchronized with Product / variant.

## Activation

Run locally:

```bash
python scripts/apply_build300_packaging_live_preview_sync.py
python scripts/build300_packaging_live_preview_sync_test.py
```

The activation helper changes only `admin/packaging-studio/index.html` and inserts:

```html
<script src="/public/js/admin-packaging-preview-sync-v300.js?v=300"></script>
```

after the mature Build 298 editor and before the Build 299 print-source controller.

## Local completion gate

Expected regression ending:

```text
BUILD 300 PACKAGING LIVE PREVIEW SYNC: PASS
No Cloudflare resource was contacted.
```

## Development browser proof

Open a soap Packaging project. With English identity still equal to Product / variant, change Product / variant to an obvious temporary value.

Expected:

- Preview updates immediately;
- English identity follows the product value;
- Save Project returns success;
- after the save rerender Preview still contains that identity.

Run in Firefox Console:

```js
(() => {
  console.table(window.DDPackagingPreviewSync?.getStatus?.());
})();
```

Expected core values:

```text
build                  300
state                  active
identityIsDerived      true
previewContainsIdentity true
matureEditorPreserved  true
saveTransportPreserved true
```

Then deliberately edit Product identity — English to a different custom value and change Product / variant again. Expected: the custom identity does not get overwritten and `identityIsDerived` becomes false.

## Safety

No schema/SQL, Cloudflare binding/config, R2, or real Production change is authorized by Build 300.
