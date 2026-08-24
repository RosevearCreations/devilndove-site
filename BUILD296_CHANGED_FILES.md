# Build 296 Changed Files

Base: `afc50a80183ce30bc9c6182a4db3c4adc068f0ad` (final Build 295 candidate)

Build 296 changes only the Packaging client transport boundary and supporting documentation/regression files:

- `AI_CONTEXT.md`
- `BUILD296_CHANGED_FILES.md`
- `BUILD296_VALIDATION.md`
- `admin/packaging-studio/index.html`
- `docs/architecture/BUILD296_PACKAGING_EXPLICIT_CLIENT_TRANSPORT.md`
- `public/js/admin-packaging-startup-gate.js`
- `public/js/admin.js`
- `public/js/modules/packaging/index.mjs`
- `public/js/modules/packaging/runtime.mjs`
- `public/js/modules/packaging/write-response.mjs`
- `scripts/build295_packaging_startup_transport_gate_test.py`
- `scripts/build296_packaging_explicit_client_transport_test.py`

No SQL, D1 migration, Wrangler/binding, R2, mature Packaging editor, server read service, server write service, native read/write endpoint, or Production file is changed.

The Build 286 read implementation remains Build 286. Build 293 remains the native server read service/entry provenance. Build 289 remains the browser write-response bridge. Build 292 remains the native write gateway and Build 291 remains the domain write service. Build 294 remains the authenticated legacy GET tombstone and Build 292 remains the authenticated legacy POST tombstone.
