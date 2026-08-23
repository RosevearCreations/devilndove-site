# Build 282 Changed Files

Build 282 is the **Architecture Lock & Admin Shell Module Resolution** build.

## Changed

- `AI_CONTEXT.md` — points current Development architecture to Build 282.
- `public/js/admin.js` — loads the compatibility-only module shadow resolver.
- `public/js/core/dd-module-definitions.mjs` — locks the taxonomy; adds `OPERATIONS` and internal `PLATFORM`; expands route ownership.

## Added

- `public/js/core/dd-module-contracts.mjs` — declarative cross-module contract catalog and validator.
- `public/js/core/dd-admin-module-shadow.mjs` — authenticated route resolution/link annotation without module activation.
- `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md` — locked module boundaries and compatibility rules.
- `scripts/build282_module_architecture_test.py` — local Build 282 validation.
- `scripts/build282_module_inventory.py` — improved ownership inventory using the locked taxonomy.
- `BUILD282_VALIDATION.md` — validation and acceptance instructions.
- `BUILD282_CHANGED_FILES.md` — this manifest.

## Explicitly unchanged

- D1 schema and migrations.
- Cloudflare Pages/Workers bindings/configuration.
- Functions/API routes.
- Existing Admin/public URLs.
- Existing business behavior.
- Production branch/environment.
