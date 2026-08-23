# Devil n Dove AI Context — Development Build 284 Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the Development architecture introduced after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`, `docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md`, and `docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Build 281 established the passive module registry. Build 282 locked the taxonomy and shadow resolver. Build 283 made `PACKAGING` the first actively loadable business module after verified-admin + route gating.

Build 284 implements the first concrete cross-module services consumed by Packaging: `catalog-read`, `inventory-read`, and `content-media`. Each has a bounded, admin-protected, read-only owner-side endpoint under `/api/admin/contracts/`. The browser runtime registers lazy adapters for these contracts and blocks Packaging activation if a declared required runtime service is missing.

Packaging exposes `window.DDPackagingContracts` only as a module boundary. Its read methods require Packaging to be active, perform no writes, and make no request until explicitly called. Existing `admin-packaging-studio.js`, Packaging project APIs, D1 schema/tables, URLs and current owner workflows remain intact in Build 284; this build establishes the service seam before migrating individual legacy UI reads.

No Build 284 D1 migration or Cloudflare binding/configuration change exists. Build 276 remains the latest Packaging schema boundary, Build 274 Creative Process, Build 269 CAIP, and Build 279 runtime-efficiency rules remain in force. Server-side protected APIs remain the authorization boundary.

Expected next architectural work after Build 284 validation: migrate selected Packaging Studio catalog/inventory/media UI reads onto these services with measured fallback/removal of duplicated legacy bootstrap data, then continue physical Packaging extraction only after parity is proven.
