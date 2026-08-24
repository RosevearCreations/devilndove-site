# Build 298 Changed Files

Base: `525b5187cddcede69f8b10334951a56366885ebf` — completed Build 297 Development parity.

Build 298 is limited to:

- `AI_CONTEXT.md`
- `BUILD298_CHANGED_FILES.md`
- `BUILD298_VALIDATION.md`
- `admin/packaging-studio/index.html`
- `docs/architecture/BUILD298_PACKAGING_NATIVE_CLIENT_CUTOVER.md`
- `public/js/admin-packaging-native-client-v298.js`
- `public/js/admin-packaging-studio.js`
- `public/js/modules/packaging/native-client-v298.mjs`
- `scripts/apply_build298_packaging_native_client_cutover.py`
- `scripts/build297_packaging_legacy_get_fallback_removal_test.py`
- `scripts/build298_packaging_native_client_cutover_test.py`

Intentional behavior change: the mature Packaging editor stops naming or calling the retired compatibility endpoint and instead calls `DDPackagingClient.request()`. The Build 298 client physically reads `/api/admin/packaging-bootstrap`, composes Catalog/Inventory/Content owner contracts, and physically writes `/api/admin/packaging-write`.

Build 297 remains loaded as defense-in-depth but should be idle for normal mature-editor reads and writes after cutover.

No SQL/schema, D1 migration, Wrangler/binding, R2, server read/write authority, or Production change is part of Build 298.
