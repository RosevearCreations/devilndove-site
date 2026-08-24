# Build 300 — Packaging Live Preview Derived-Field Synchronization

## Problem

Build 298 proved native Packaging reads/writes, and Build 299 corrected the print-source selector. During Build 299 validation the active Project draft still appeared stale in Preview even though Save Project returned HTTP 200.

The mature soap renderer uses `packagingIdentityEn` before `packagingProductName` for the main product identity. The Product tab initializes English identity from the product name, but after that the two fields are independent. Therefore changing Product / variant can save correctly while the Preview continues to render the older English identity.

The Product tab also labels `packagingSubtitle` as Front tagline although the current soap-ribbon renderer does not print that field.

## Build 300 correction

Build 300 adds a small post-editor browser controller. It does not change the mature Build 298 editor, native transport, server read/write authorities, or schema.

For soap projects:

- Product / variant drives English identity while that identity is still blank/default/derived.
- Once the owner deliberately edits English identity to a different value, synchronization stops and the explicit identity remains authoritative.
- Rerenders after Save Project are rebound through a MutationObserver.
- The Front tagline label is clarified as saved metadata that is not currently printed by the soap-ribbon renderer.
- A diagnostic facade `DDPackagingPreviewSync` exposes current product/identity values and whether Preview contains them.

## Preserved boundaries

Build 300 does not change:

- `public/js/admin-packaging-studio.js` mature editor;
- Build 298 `DDPackagingClient` read/write transport;
- Build 299 print-source controller or saved-version artifact endpoint;
- Build 293/286 read authority;
- Build 292/291 write authority;
- retired Packaging tombstone endpoint;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Validation target

With a soap project open and English identity still derived from Product / variant:

1. change Product / variant;
2. Preview should immediately show the new value;
3. Save Project;
4. the saved rerender should still show the new value;
5. `DDPackagingPreviewSync.getStatus()` should report matching product/identity and `previewContainsIdentity: true`.

Then deliberately customize English identity and change Product / variant again. The explicit identity must remain unchanged.
