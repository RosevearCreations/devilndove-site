# Devil n Dove AI Context — Development Build 288 Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`, `docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md`, `docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md`, `docs/architecture/BUILD285_PACKAGING_CONTRACT_CONSUMPTION.md`, `docs/architecture/BUILD286_PACKAGING_API_BOUNDARY_CLEANUP.md`, `docs/architecture/BUILD287_PACKAGING_CONTENT_ARTWORK_PICKER.md`, and `docs/architecture/BUILD288_PACKAGING_LEGACY_GET_RETIREMENT.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Builds 281–285 established the modular registry, locked ownership, activated Packaging, implemented owner-side read contracts, and moved those contracts into the real Packaging data path. Build 286 introduced the admin-protected `/api/admin/packaging-bootstrap` narrow read boundary and contractized Catalog, Inventory and Content collections. Build 287 composed the proven Build 286 data boundary with the Content-owned managed artwork picker.

Build 288 retires the legacy broad Packaging GET from the **active modular runtime**. A new retirement guard is armed before the Build 286 bridge activates. The Build 286 bridge can still translate the legacy-shaped UI GET into `/api/admin/packaging-bootstrap` and inject `catalog-read`, `inventory-read`, and `content-media`, but if that bridge ever attempts its old rollback GET, the guard returns an explicit `410 packaging_legacy_get_retired` response before any network request can reach the broad `/api/admin/packaging-studio` GET handler.

This creates a deliberate method boundary without rewriting the mature Packaging Function: GET is narrow Packaging bootstrap plus owner contracts; POST remains `/api/admin/packaging-studio` and continues through the existing write authority unchanged. Contract failures may use the Build 286 same-session contract cache or report contract-unavailable; they cannot recover by re-enumerating the old broad Catalog/Inventory payload.

Build 288 does **not** physically delete the dormant GET code inside `functions/api/admin/packaging-studio.js`. That file also owns mature POST actions and still appends broad `listData()` collections to successful write responses. Physical server-source cleanup is deferred until write responses are separated from that broad list dependency. Build 288 therefore proves runtime retirement first, avoiding a coupled read/write rewrite.

Build 287 artwork behavior remains intact: Content artwork is read through `content-media`, the manual Packaging artwork path remains available, no polling is introduced, and no Content/Inventory/Catalog records are mutated by the picker.

Build 288 introduces no D1 migration, SQL/schema change, Function change, Wrangler/binding change, R2 enumeration, or Production change. It also pins the Build 287 changed-file regression to final Build 287 commit `70902c5144e91964e42dbf113931bcd5edcde2f8` so historical validation remains reproducible after later Development builds.

Expected next work after Build 288 parity validation: split Packaging write responses from the broad `listData()` dependency, then physically remove the dormant broad GET queries from `functions/api/admin/packaging-studio.js` once POST no longer relies on them.
