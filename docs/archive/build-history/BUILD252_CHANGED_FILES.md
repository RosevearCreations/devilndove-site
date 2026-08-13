# Build 252 Changed Files

- `public/js/admin-site-item-inventory.js` — initializes `unitPresetOptions` before first render, keeps the defaults aligned with the bootstrap API, and bumps the browser bootstrap cache key.
- `admin/inventory-operations/index.html` — loads the corrected inventory bundle as `v=252`.
- `admin/mobile-inventory/index.html` — loads the corrected inventory bundle as `v=252`.
- `admin/products/index.html` — loads the corrected shared inventory bundle as `v=252`.
- `scripts/build252_inventory_unit_preset_runtime_regression.py` — regression coverage for declaration ordering, client/server preset parity, first-render safety and cache busting.
- `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md` — record Build 252 as the current code release while retaining Build 250 as the current D1 migration boundary.
- `docs/archive/build-history/BUILD251_CHANGED_FILES.md`, `docs/archive/build-history/BUILD251_VALIDATION.md` — archives the superseded Build 251 release pair.
