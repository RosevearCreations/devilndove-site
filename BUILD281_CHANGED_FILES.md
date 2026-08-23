# Build 281 Changed Files — Modular Application Foundation

Build 281 is a Development-only architecture build created from the working Build 280 baseline. It does not use or install the abandoned pre-split Build 281 ZIP.

## Added

- `public/js/core/dd-module-registry.mjs`
  - passive module registry;
  - explicit lifecycle states;
  - identity-aware access check;
  - route resolution;
  - shared service registry;
  - explicit load/activate/deactivate hooks;
  - no automatic runtime work.

- `public/js/core/dd-module-definitions.mjs`
  - initial Devil n Dove module catalog;
  - all runtime `entry` values intentionally `null` for Build 281;
  - no existing page is connected to the loader yet.

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
  - one-platform modular direction;
  - App Core responsibilities;
  - two-gate identity/runtime rule;
  - domain ownership;
  - database/API/runtime rules;
  - staged extraction order.

- `docs/architecture/MODULE_OWNERSHIP_RULES.md`
  - ownership taxonomy and boundary rules.

- `scripts/build281_module_inventory.py`
  - local repository inventory/classifier;
  - optionally writes generated evidence under `.wrangler/build281/`;
  - does not contact Cloudflare.

- `scripts/build281_module_foundation_test.py`
  - validates Build 281 remains passive;
  - validates module IDs and JavaScript syntax;
  - rejects a Build 281 SQL migration;
  - checks protected schema/Cloudflare files were not changed in the Build 281 commit;
  - does not contact Cloudflare.

- `BUILD281_VALIDATION.md`
  - local acceptance procedure.

## Updated

- `AI_CONTEXT.md`
  - identifies Production Build 280 as the frozen baseline;
  - identifies Build 281 as the Development modular-foundation line;
  - points future AI work to the new architecture authority while preserving the existing domain/business authority documents.

## Explicitly unchanged

Build 281 does not change:

- `wrangler.toml`;
- D1 schema or migration boundary;
- R2 bindings/buckets;
- authentication/session behavior;
- existing API routes;
- existing Admin/public page imports;
- Production `main` branch;
- Production Build 280.
