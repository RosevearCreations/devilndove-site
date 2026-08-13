# Build 256 Changed Files

## Release goal

Build 256 adds three owner-facing capabilities without replacing existing authored storefront content automatically:

1. Amazon-assisted Purchased/Source Material template drafts in Packaging Studio.
2. A fixed five-zone soap ribbon layout based on the approved label reference.
3. The first production-safe Media & Content Management Studio for explicit public page image/background/text overrides.

## Packaging Studio

- `functions/api/admin/amazon-link-preview.js`
  - adds review-first Packaging Source Material drafts from Amazon product links;
  - infers soap base, essential-oil/fragrance blend, candle wax, colourant/mica and related source categories;
  - imports exposed title/brand/ASIN/image, candidate ingredient/allergen text and product-detail benefits;
  - bounds the remote HTML response size;
  - never auto-saves or marks marketplace text verified.
- `public/js/admin-packaging-studio.js`
  - adds **Create draft from Amazon link** workflow and clear review instructions;
  - keeps purchased-source Master INCI rows separate from the current finished label;
  - adds `soap_reference_v3` fixed-zone SVG renderer and alignment guide.
- `admin/packaging-studio/index.html`
  - Build 256 asset cache busting and direct Media/Artwork Studio navigation.
- `css/styles.css`
  - Amazon material import UI, soap preview alignment/overflow protection and Media Studio responsive UI.

## Media & Content Management Studio

- `admin/media-content-studio/index.html` — new protected owner workflow with four numbered steps.
- `public/js/admin-media-content-studio.js` — page inspection, media selection/upload, metadata, explicit assignments, content drafts/publication, safe archive/delete, same-key replacement and explicit R2 sync.
- `functions/api/admin/media-content-studio.js` — bounded D1 administration API and explicit admin-only R2 synchronization.
- `functions/api/admin/media-content-replace.js` — password-step-up same-key file replacement that preserves media identity/placements.
- `functions/api/public-media-content-manifest.js` — compact public per-path D1 manifest; no R2 enumeration.
- `public/js/media-content-runtime.js` — applies only explicit media assignments and explicitly published text overrides; otherwise leaves authored page content unchanged.
- `admin/index.html` — Media & Content Studio navigation card.
- Existing non-admin HTML entry points — load the Build 256 public media/content runtime.

## Database

- `database_build256_media_content_studio.sql`
- `database_upgrade_current_pass.sql` — byte-identical current migration.
- `database_schema.sql`
- `database_store_schema.sql`
- `database_full_schema.sql`

New D1 authorities:

- `managed_media_metadata`
- `media_content_slots`
- `media_content_assignments`
- `managed_content_blocks`
- `media_content_change_audit`

## Documentation and verification

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- `PACKAGING_STUDIO.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `docs/media-content/DEVIL_N_DOVE_MEDIA_CONTENT_MANAGEMENT_STUDIO.md` — preserved specialist implementation/acceptance specification supplied for this work.
- `scripts/build256_media_packaging_regression.py`
- `BUILD256_D1_VERIFICATION.sql`
- `BUILD256_VALIDATION.md`
- `BUILD256_CHANGED_FILES.md`

Historical Build release/validation duplicates were moved out of the repository root and preserved under `docs/archive/build-history/` so the root release evidence is current rather than ambiguous.

## Deliberately not claimed complete in Build 256

The attached Media Studio specification is broader than this first implementation. The canonical roadmap retains these later phases instead of falsely marking them complete:

- reusable managed galleries with drag/reorder and publication rules;
- before/after pair publishing rules and richer Process/Technique/Evidence collections;
- media version history and rollback;
- duplicate/near-duplicate and richer media-health scoring;
- direct managed Artwork picker embedded inside Packaging Studio instead of the current Studio link;
- deeper CAIP approved-media promotion workflows.
