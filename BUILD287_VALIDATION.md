# Build 287 Validation

Build 287 is accepted only when all of the following are true.

## Local regression gate

Run:

```bash
python scripts/build287_packaging_artwork_picker_test.py
```

Expected:

```text
PASS: Build 287 JavaScript syntax
PASS: Build 287 module imports resolve
PASS: Content artwork URL normalization/model behavior
PASS: Packaging runtime composes Build 286 without modifying it
PASS: artwork picker preserves manual path and explicit selection semantics
PASS: Build 287 routing/version markers
PASS: Build 286 historical regression boundary is pinned
PASS: exact Build 287 changed-file boundary
PASS: no Function, SQL/schema, Cloudflare binding/config, or legacy Packaging UI change
BUILD 287 PACKAGING CONTENT ARTWORK PICKER: PASS
No Cloudflare resource was contacted.
```

## Development runtime acceptance

After deploying Development only:

- `admin.js` loads `dd-admin-module-runtime.mjs?v=287`.
- runtime reports build `287`.
- Packaging definition loads `../modules/packaging/runtime.mjs?v=287`.
- authenticated Packaging route is active.
- `window.DDPackagingContracts.build === 287`.
- `window.DDPackagingContracts.getStatus().baseBuild === 286`.
- Build 286 bootstrap remains contractized and healthy.
- `getArtworkPickerStatus().started === true`.
- On the Artwork tab, `#ddPackagingArtworkPicker` mounts beside the existing artwork path field.

A zero artwork count is valid. With zero rows, the picker must show the truthful empty state and leave the existing manual path field usable.

## Managed-artwork behavior when rows exist

When at least one Content row has `media_type = artwork` and a public URL:

1. Refresh Content artwork.
2. Select the managed asset.
3. Verify its preview appears.
4. Press **Use selected artwork**.
5. Verify the existing `packagingArtworkAsset` field receives the stable public URL (cache-busting `v=` removed).
6. Verify no Packaging save occurs until the existing normal save action is used.

## Historical validation hygiene

Build 287 pins the Build 286 changed-file audit to the final Build 286 hotfix commit instead of future `HEAD`. This is test-only housekeeping and does not alter Build 286 runtime behavior.

## Safety boundary

No Production resource is contacted or changed by Build 287 validation.
