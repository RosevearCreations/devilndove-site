# Build 299 Changed Files

Base: `3a19ebc263a206acd22e6490327ffa32567e4a8a` (completed Build 298 parity head)

Expected Build 299 boundary:

1. `AI_CONTEXT.md`
2. `BUILD299_CHANGED_FILES.md`
3. `BUILD299_VALIDATION.md`
4. `admin/packaging-studio/index.html` — activation-only page script cutover
5. `docs/architecture/BUILD299_PACKAGING_BROWSER_COMPATIBILITY_RETIREMENT.md`
6. `public/js/admin-packaging-native-client-v299.js`
7. `public/js/modules/packaging/native-client-v299.mjs`
8. `scripts/apply_build299_packaging_browser_compatibility_retirement.py`
9. `scripts/build298_packaging_native_client_cutover_test.py` — historical pin only
10. `scripts/build299_packaging_browser_compatibility_retirement_test.py`

## Explicitly unchanged

- mature editor `public/js/admin-packaging-studio.js`;
- Build 297 gate/overlay source files (retained as historical rollback artifacts);
- Build 298 native client source files;
- Build 290 Packaging runtime;
- Build 288 GET retirement guard;
- Build 289 write-response bridge;
- Build 293/286 native read authority;
- Build 292/291 native write authority;
- `functions/api/admin/packaging-studio.js` 410 tombstone;
- SQL/schema, Wrangler/bindings, R2, and real Production.

Build 299 **unloads** the two outer Build 297 browser compatibility scripts from the Packaging page. It does not physically delete their files and does not yet remove Build 288/289 internal compatibility guards.
