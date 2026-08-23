# Build 287 Changed Files

1. `AI_CONTEXT.md`
2. `BUILD287_CHANGED_FILES.md`
3. `BUILD287_VALIDATION.md`
4. `docs/architecture/BUILD287_PACKAGING_CONTENT_ARTWORK_PICKER.md`
5. `public/js/admin.js`
6. `public/js/core/dd-admin-module-runtime.mjs`
7. `public/js/core/dd-module-definitions.mjs`
8. `public/js/modules/packaging/artwork-picker.mjs`
9. `public/js/modules/packaging/runtime.mjs`
10. `scripts/build286_packaging_boundary_test.py`
11. `scripts/build287_packaging_artwork_picker_test.py`

The Build 286 test-only change pins its historical changed-file comparison to final Build 286 commit `9a4dde6b974e0a4885b4fb91fa83e4cb6c666f20` so later builds do not make that historical regression fail spuriously.

Build 287 deliberately does **not** modify:

- `public/js/modules/packaging/index.mjs` (the proven Build 286 compatibility/data bridge)
- `public/js/admin-packaging-studio.js` (legacy Packaging UI)
- any `functions/` file
- any SQL or migration file
- `wrangler.toml`, bindings, secrets, D1, R2, or Production configuration
