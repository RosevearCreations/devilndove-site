
# Build 237 Validation

## Missing image completion
- Added concrete `.webp` files for the previously missing `/assets/images/site/*` references used by `IMAGES_REQUIRED.md` and the seeded image-manifest paths.
- Added photo-backed SVG wrappers for `product-grid.svg`, `engraving-detail.svg`, and `material-detail.svg`.
- Preserved existing placeholder/visual asset paths so current page, schema and manifest references continue to resolve.

## Markdown sanity
- Kept `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` as the two primary start files.
- Updated the Build 237 release trail and pointer files without restoring archived build-history markdown to the repository root.

## Remaining manual/live checks
1. Open the public routes that consume the representative visual assets and confirm the new real-image fallbacks render cleanly on phone and desktop.
2. Replace representative fallback media with item-specific approved photos as they become available.
3. Continue the outstanding live-payment, auth, physical-packaging, and production-evidence checks already listed in `PROJECT_STATUS_AND_ROADMAP.md`.
