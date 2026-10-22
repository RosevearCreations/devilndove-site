# Release 467 Build 433 — Brand V3 Remaining Customer Placeholder Replacement

## Audited scope and source-of-truth

The earlier full frontsite audit covers **70 customer routes** with **29 Media Studio editable placeholder hooks across 22 routes**. The exact P1/P2 catalog slots were already mapped to committed Brand V3 WebPs and remain *runtime-fallback recovery* slots, **not 29 absent image files**. The owner-selected Media Studio image always takes precedence. Build 433 deliberately does not overwrite these 29 editable hooks.

A separate grep of current customer HTML identified **five generic default SVG illustrations** outside that P1/P2 slot-replacement inventory, including three generated catalog-section illustrations and two authored-default Workshop-Made Gifts media slots. Build 433 replaces exactly these existing visible generic defaults with already committed Brand V3 WebPs.

| Customer page | Replaced generic slot | Existing Brand V3 WebP selected | Display / ownership |
| --- | --- | --- | --- |
| `/tools/` | tool proof default SVG | `44-workshop-tools.webp` | One illustrative card after all tool groups; actual inventory cards unchanged |
| `/supplies/` | materials placeholder SVG | `45-materials-supplies.webp` | One illustrative card after all supply groups; item facts unchanged |
| `/toolshed/` | tool-condition default SVG | `09-vintage-finds-category.webp` | One illustrative card after all groups; no fabricated condition proof |
| `/workshop-made-gifts-ontario/` | `workshop-made-gifts-ontario.hero.image` | `293-custom-gifts-southern-ontario-content-visual.webp` | Media Studio editable hero; recommended slot **1600 × 1000** |
| `/workshop-made-gifts-ontario/` | `workshop-made-gifts-ontario.image.1` | `286-home-workshop-process-visual.webp` | Media Studio editable process illustration; recommended slot **1600 × 1000** |

Both workshop gift images keep the exact original `data-media-slot` keys and can be replaced by the owner in Media & Content Studio. Customer copy no longer tells readers to replace a placeholder. The three catalog illustrations have truthful labels: artwork does not guarantee inventory, production capacity, product condition, or actual item photography.

**Image size policy:** The recommendation of 1600×1000 comes from `public/data/media-content-slot-catalog.json`. We reuse the existing WebPs with `object-fit: contain` and responsive mobile layout; **do not assume** the source binary pixel dimensions were verified by a text-only GitHub connector. No image was automatically rescaled, recompressed, or invented.

## Verification and regressions

- `scripts/release467_build433_regression.mjs`: scans all public HTML for leftover `/assets/visual-placeholders/*.svg`, requires five specifically mapped existing WebP files with RIFF/WEBP headers, checks once-per-page catalog placement, compiles the three inline dynamic catalog scripts, confirms workshop edit hooks and source catalog size guidance, and verifies owner-media safety.
- `scripts/brand_v3_frontsite_recovery.test.mjs`: retains the 29 existing managed placeholders and all 22 route-to-WebP mappings; checks new shared CSS cache version.
- `scripts/brand_v3_frontsite_audit.mjs`: reports `mediaStudioEditablePlaceholderHooks`, `genericArtworkSvgReferences` (must be zero), and `curatedBrandV3AuthoredDefaults` separately. 29 editable hooks are not treated as missing artwork.
- Both `Current Application Quality Proof` and the dedicated `Devil n Dove — Full Frontsite Brand V3 Audit` run the focused regression on `dev`.
- Shared public CSS is cache-busted to `?v=433` in both Cloudflare middleware injection paths; JS remains unchanged at `?v=295`.

## Boundaries and acceptance

No Product or Inventory data, owner photos, Media Studio assignments, checkout, prices, shipping, OAuth, provider publication, Admin business facts, or Production D1/R2 business assets are written. Optional P3 backgrounds (68 choices) are **not required missing-image fixes** and are deliberately not assigned generic decorative art. There is no invented screenshot or owner approval.

After a **successful exact-SHA Cloudflare Production deploy**, inspect `/tools/`, `/supplies/`, `/toolshed/`, `/workshop-made-gifts-ontario/`, plus Home/Shop/Collections/Journal and Media Studio owner overrides on desktop/mobile. Confirm live asset URLs, default artwork, contrast and all core forms. Production GREEN requires protected workflow and live source receipt, not `main` branch equality.

**Next queued:** Build 434 — Public Search & Workshop Catalog Boundaries.
