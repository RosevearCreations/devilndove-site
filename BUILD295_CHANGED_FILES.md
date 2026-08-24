# Build 295 Changed Files

Build 295 is intentionally limited to the Packaging startup transport race discovered during Build 294 Development validation.

## Changed files

- `AI_CONTEXT.md`
  - advances the modular Development pointer to Build 295 and records the live startup-race finding.
- `BUILD295_CHANGED_FILES.md`
  - records the exact Build 295 file boundary.
- `BUILD295_VALIDATION.md`
  - defines local and Development-only validation for the startup transport gate.
- `admin/packaging-studio/index.html`
  - loads the Build 295 Packaging startup transport gate immediately before the mature Packaging editor.
- `docs/architecture/BUILD295_PACKAGING_STARTUP_TRANSPORT_GATE.md`
  - documents the race, the compatibility-preserving gate, and the next native-client cutover boundary.
- `public/js/admin-packaging-startup-gate.js`
  - delays legacy-shaped Packaging GET/POST compatibility triggers until the modular Packaging read/write bridges are active; it never sends a legacy request itself when the runtime is unavailable.
- `scripts/build294_packaging_legacy_get_server_retirement_test.py`
  - pins the Build 294 historical regression boundary at the final Build 294 commit.
- `scripts/build295_packaging_startup_transport_gate_test.py`
  - proves the exact Build 295 boundary and protects Build 290-294 read/write/runtime authority.

## Explicitly unchanged

Build 295 does **not** change:

- D1 schema or migrations;
- Wrangler configuration or Cloudflare bindings;
- R2 access/enumeration;
- `public/js/admin-packaging-studio.js` mature editor behavior;
- Build 290 Packaging modular runtime composition;
- Build 293 Packaging read service/bootstrap authority;
- Build 291 Packaging write service;
- Build 292 native write gateway;
- Build 294 legacy GET/POST server tombstone behavior;
- Production.
