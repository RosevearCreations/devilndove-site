# Build 236 Validation

## Packaging / label system
- Updated the Labeling & Packaging page copy and asset version to Build 236.
- Tightened the soap-ribbon SVG renderer so the front oval uses a wider polished badge layout, the rose sits further left, the editable family/product text is more centered, and separators more closely follow the approved reference.
- Retained reusable template, export, preview and compliance logic.

## Visual asset replacement
- Created raster photo assets under `assets/real-media/` from existing repository media and approved packaging references.
- Replaced the most common public placeholder SVGs with photo-backed SVG wrappers so existing paths keep working without requiring route-by-route rewiring.
- Added missing compatibility placeholder assets for `assets/product-placeholder.svg`, `assets/visual-placeholders/events.svg`, `assets/visual-placeholders/pickup.svg`, and `assets/visual-placeholders/tools.svg`.

## Markdown sanity
- Kept `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` as the two canonical files.
- Updated release-trail files so a new chat can see the Build 236 pass without restoring many retired Markdown files to the root.

## Remaining manual/live checks
1. Open `/admin/packaging-studio/`, load or create a soap project, apply the Glacial Purple example, verify the preview/export alignment on desktop and phone.
2. Export SVG, PNG and PDF from Packaging Studio and confirm the embedded artwork remains self-contained.
3. Open the public pages that previously showed placeholder SVGs and verify the new photo-backed wrappers render and size correctly.
4. Confirm Cloudflare deploy/hard-refresh/service-worker behavior after upload.
5. Complete the outstanding live provider, physical packaging, item-specific product photography and production-evidence gates already tracked in `PROJECT_STATUS_AND_ROADMAP.md`.
