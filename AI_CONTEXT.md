# Devil n Dove AI Context — Development Build 285 Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the Development architecture introduced after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`, `docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md`, `docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md`, and `docs/architecture/BUILD285_PACKAGING_CONTRACT_CONSUMPTION.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Build 281 established the passive registry, Build 282 locked the module taxonomy, Build 283 made `PACKAGING` the first active runtime module, and Build 284 implemented bounded admin-protected `catalog-read`, `inventory-read`, and `content-media` services.

Build 285 moves those contracts into the real Packaging Studio data path without rewriting the large legacy UI. Once Packaging has verified-admin + route activation, its module wraps only the legacy **GET** `/api/admin/packaging-studio` bootstrap response. Catalog and Inventory arrays are replaced with their owner-contract rows before `admin-packaging-studio.js` receives the response. Content media is attached as a managed-media seam and exposed through `window.DDPackagingContracts` for the future artwork picker. Packaging POST/write calls are never intercepted.

The old Packaging bootstrap `products` and `inventory` arrays remain in the server response only as temporary fallback. If an owner contract fails, Build 285 keeps the corresponding legacy array and visibly reports `legacy-fallback`; it does not block existing Packaging work. A one-shot event-driven refresh handles the race where the legacy page started loading before module activation. There is no polling loop or recurring timer.

No Build 285 Function, D1 migration, SQL, binding, Wrangler, or Production change exists. Build 276 remains the latest Packaging schema boundary. Existing protected APIs remain the authorization boundary.

Expected next architectural work after Build 285 parity validation: Build 286 removes the duplicated Catalog/Inventory read queries from the Packaging server bootstrap, narrows the payload, and proves Packaging continues to function solely through declared read contracts.
