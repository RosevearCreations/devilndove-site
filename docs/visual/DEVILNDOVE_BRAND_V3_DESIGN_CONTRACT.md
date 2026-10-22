# Devil n Dove — Brand V3 approved visual contract (19 October 2026)

**Status: canonical style reference for future storefront, workshop, and Admin changes.** The user-supplied asset boards, banner collections, homepage/shop/tools/supplies screenshots and Admin-dashboard screenshots are the standard for visual matching. Preserve the installed images and existing app functions; don't substitute a different flat or icon-only art direction.

## Locked colour palette

| Role | Hex |
| --- | --- |
| Deep Navy | `#1a1230` |
| Royal Purple | `#2e1b55` |
| Accent Purple | `#5a3a8c` |
| Soft Lavender | `#8b6aa9` |
| Antique Gold | `#d4af37` |
| Warm Ivory | `#f5e6d3` |
| Charcoal | `#0e0b14` |

Bright purple is permitted for interactive CTAs, gold for decorative accents, and green/amber/red only for *true* meaningful status indicators. Use accessible contrast and visible keyboard focus. Data-heavy Admin pages favor clear legible UI text over decorative scripted headings.

## UI references to reproduce faithfully

1. **Headers/nav:** dark full-width visual field, recognizable Devil n Dove emblem, compact navigation, elegant purple highlighted active item, rounded controls and legible search/cart. Admin screens may have top navigation + compact left-side task links.
2. **Hero art:** premium, photorealistic enhanced workshop still-life, laser-engraved timber, jewellery, purple crystals, tools, candles and gold light accents. Cinematic imagery stays decorative; it does not overwrite a customer's real product photograph.
3. **Product cards:** three columns on desktop where there is room; two on tablet and one on narrow phones. Consistent rounded images and dark navy card backgrounds, subtle lavender borders, accurate CAD prices, clear status, deep-purple full-width action controls and visible filters/sort.
4. **Supplies/tools cards:** informational workshop references with accurate owner-provided media, searchable and filterable cards and truthful operational context. Under the Build 434 public catalog boundary, Tools, Supplies and Toolshed are **not merchant checkout listings** and must never gain an accidental Add to Cart action. Product prices, stock and variations belong only to authorized Shop products; preserve the owner-approved spacing/typography without inventing merchandise.
5. **Admin:** command-centre hierarchy, high-contrast panels, source-owned live stats, dark navy panels, violet accents and meaningful colour-coded modules. Use illustrative engraver/artist imagery in page headers only. Preserve read-only boundaries, auth, budgets, approvals, data source truth, and functional control states.
6. **Cards/menus across routes:** subtle radius, consistent padding, purple hover/focus and antique-gold touches; never replace clickable controls with image-text buttons.

## Approved image kit and proposed extensions

- `assets/images/brand-v3/` Sets 1–5 **01–50**: approved drop-in customer artwork, keep names and existing mapping. *21–30 use their original unnumbered names.*
- Set 6 **51–60**: existing `-CONCEPT.webp` Admin design references; real forms and data should resemble their theme but never use sample metrics as live data.
- Set 7 **61–70**: current decorative icon/poster WebPs are **working drafts, not target artwork**. Do not let them redefine the design. Any replacements must match the rich photographic and realistic screenshot aesthetic above and be approved prior to public integration.
- Screenshots outside the ZIPs are **design references**. Do not upload screenshots as fake full-page UIs, nor replace the actual app with an unclickable bitmap.

## Implementation & safety

The shared style layer is `css/brand-v3-theme.css` and is included through `functions/_middleware.js`. It supports the existing build-293 canonical design-system layer without removing scripts, navigation, the real product catalog, WCAG focus outlines, stock checks, ordering and Admin authorization. This is a **styling foundation**, *not* a claim that every screen has been rebuilt to match the screenshots.

Do not automatically promote to `main`/Cloudflare until CI, manual responsive checks (desktop/tablet/mobile), key journey tests, and release health pass. Sample metrics in concepts must never become live dashboard data.


## Build 435 — Standard theme tokens & accessibility (22 October 2026)

The existing installed purple/gold/dark Brand V3 theme is officially called **Standard**, without adding a theme selector yet. Shared `css/brand-v3-theme.css` exposes `--dd-v3-standard-*` semantic aliases for colours, text, focus, action gradients, 12px radius and 44px common controls. The seven locked palette entries above remain unchanged. The contrast, focus-visible, touch targets, responsive wrapping, reduced-motion and forced-colour boundaries are enforced by `scripts/release467_build435_accessibility.test.mjs`. Acceptance and operator verification: [Build 435 guide](../operations/RELEASE_467_BUILD_435_STANDARD_THEME_ACCESSIBILITY.md).

Future themes must inherit this **functional accessibility rule set** and may vary visual tokens only with explicit owner approval; they must never change live product/media truth, checkout permissions, inventory-only publication controls, or Admin roles.
