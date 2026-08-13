# Build 252 Validation

Build 252 repairs the Inventory Operations startup runtime failure caused by `unitPresetOptions` being read by `render()` before it had ever been initialized.

Validation performed:
- JavaScript syntax check for `public/js/admin-site-item-inventory.js`.
- Build 252 runtime regression: **10/10 passed**.
  - unit presets initialized before first render use;
  - async bootstrap can still replace the defaults;
  - browser bootstrap cache key bumped to v252;
  - client defaults are non-empty and byte-for-byte ordered-equivalent to the server preset list;
  - Inventory Operations, Mobile Inventory and Products all request `admin-site-item-inventory.js?v=252`;
  - a minimal browser-like unauthenticated first render completes without a ReferenceError;
  - no obvious undeclared statement-assignment candidates remain in the inventory bundle.
- Build 251 Product Editor image runtime regression: **9/9 passed**.
- Build 250 product media/resource usage regression: **14/14 passed**.
- Build 249 kit/component inventory regression: **25/25 passed**.

No D1 migration is required for Build 252. The current D1 migration boundary remains Build 250.

Note: the older repository-wide `deployment_preflight_static_check.py` is still historically pinned to Build 246 assumptions and therefore reports unrelated stale-document/migration blockers. It was not used as the Build 252 release gate; the targeted current regressions above were used instead.
