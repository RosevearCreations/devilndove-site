# Devil n Dove AI Context — Development Build 287 Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `docs/architecture/BUILD282_ARCHITECTURE_LOCK.md`, `docs/architecture/BUILD283_PACKAGING_MODULE_ACTIVATION.md`, `docs/architecture/BUILD284_PACKAGING_CONTRACT_INTEGRATION.md`, `docs/architecture/BUILD285_PACKAGING_CONTRACT_CONSUMPTION.md`, `docs/architecture/BUILD286_PACKAGING_API_BOUNDARY_CLEANUP.md`, and `docs/architecture/BUILD287_PACKAGING_CONTENT_ARTWORK_PICKER.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

Builds 281–285 established the modular registry, locked ownership, activated Packaging, implemented owner-side read contracts, and moved those contracts into the real Packaging data path. Build 286 then removed duplicate broad Catalog/Inventory reads from the healthy Packaging GET path with the admin-protected `/api/admin/packaging-bootstrap` boundary. Final Build 286 runtime proof showed `serverBootstrapSource: "packaging-bootstrap"`, Catalog 43 from contract, Inventory 630 from contract, Content media 0 from contract, and no healthy-path need for the legacy broad GET.

Build 287 keeps the proven Build 286 Packaging bridge and Functions unchanged and layers a thin Packaging runtime composition over it. The new Content artwork picker consumes only the existing `content-media` contract, mounts beside the existing `packagingArtworkAsset` draft field after verified Packaging activation, previews managed artwork, and copies the selected stable public URL into that existing field only when the administrator explicitly chooses **Use selected artwork**.

The picker does not create, edit, archive, or delete Content media. It does not change Inventory or Catalog data and does not intercept Packaging POST/write requests. The manual advanced artwork path remains available. **Refresh Content artwork** is an explicit active-module read, not polling. If there are no Content rows classified with `media_type = artwork`, the picker shows a truthful empty state and links to Media & Content Studio rather than inventing assets.

Build 287 introduces no D1 migration, SQL/schema change, Function change, Wrangler/binding change, R2 enumeration, or Production change. The selected Packaging value remains the existing artwork URL; persistent Content media-ID provenance is intentionally deferred to a later explicit contract/schema decision rather than being smuggled into this build.

Build 287 also performs test-only housekeeping: the Build 286 changed-file regression is pinned to final Build 286 commit `9a4dde6b974e0a4885b4fb91fa83e4cb6c666f20` instead of future `HEAD`, so Build 286 remains independently reproducible after later Development builds. No Build 286 runtime behavior changes.

Expected next work after Build 287 parity validation: populate/classify reusable Content artwork where appropriate, then decide whether Packaging should persist a Content media asset ID alongside the URL before expanding other Packaging UI surfaces behind the module runtime.
