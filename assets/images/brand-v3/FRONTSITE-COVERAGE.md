# Devil n Dove — Verified Brand V3 Media Slot Coverage

Audit source: `public/data/media-content-slot-catalog.json` and `public/js/brand-v3-frontsite-recovery.js`, checked on 2026-10-20. All paths relative to repository root. This is a source inventory, not a live browser/owner-media inspection.

## Replacement status

- **6 required replacement slots**: all mapped to dedicated WebPs, present in `assets/images/brand-v3/` on `main` at audit time.
- **23 recommended replacement slots**: all mapped to WebPs, present on `main` at audit time.
- **70 Admin banner files (121–190)**: all referenced by `public/js/admin-brand-v3-set13.js` through `set19.js` and present in `assets/images/brand-v3/` on `main` at audit time. These are established banner routes, not Media Studio catalog replacement slots.
- **2 additional authored-default generic SVGs**, not flagged for replacement by the catalog: `workshop-made-gifts-ontario.hero.image` and `workshop-made-gifts-ontario.image.1`, both using `/assets/visual-placeholders/product-process.svg`. For optional dedicated replacements, use **1600 × 1000 (8:5)** for each.
- **68 optional background enhancements** in the catalog are choices, not missing required images.

## Exact current public replacement mapping and recommended export sizes

| Page | Slot key | Catalog priority | Recommended export size | Existing mapped file |
|---|---|---|---|---|
| `/` | `home.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `286-home-workshop-process-visual.webp` |
| `/` | `home.what.visual.2` | recommended replacement | 1600 × 1000 (8:5) | `99-home-resin-workshop-card.webp` |
| `/` | `home.what.visual.3` | recommended replacement | 1600 × 1000 (8:5) | `98-home-creative-paths-card.webp` |
| `/about` | `about.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `284-about-what-we-do-visual.webp` |
| `/creations` | `creations.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `287-creations-featured-work-visual.webp` |
| `/workshop-journal` | `workshop-journal.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `288-workshop-journal-introduction-visual.webp` |
| `/collections` | `collections.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `289-collections-overview-visual.webp` |
| `/contact` | `contact.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `285-contact-where-to-find-us-visual.webp` |
| `/gift-cards` | `gift-cards.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `282-gift-cards-content-visual.webp` |
| `/events` | `events.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `283-events-content-visual.webp` |
| `/socials` | `socials.hero.image` | required replacement | 1600 × 1000 (8:5) | `276-social-hub-required-hero.webp` |
| `/socials` | `socials.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `290-social-hub-content-visual.webp` |
| `/custom-candle-making-ontario` | `custom-candle-making-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `291-custom-candle-making-ontario-content-visual.webp` |
| `/custom-soap-making-ontario` | `custom-soap-making-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `292-custom-soap-making-ontario-content-visual.webp` |
| `/custom-gifts-southern-ontario` | `custom-gifts-southern-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `293-custom-gifts-southern-ontario-content-visual.webp` |
| `/handmade-jewelry-ontario` | `handmade-jewelry-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `294-handmade-jewelry-ontario-content-visual.webp` |
| `/laser-engraving-ontario` | `laser-engraving-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `295-laser-engraving-ontario-content-visual.webp` |
| `/polymer-clay-earrings-ontario` | `polymer-clay-earrings-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `73-polymer-clay-category.webp` |
| `/vintage-finds-ontario` | `vintage-finds-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `09-vintage-finds-category.webp` |
| `/workshop-made-gifts-ontario` | `workshop-made-gifts-ontario.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `76-custom-gifts-category.webp` |
| `/workshop-journal/story` | `workshop-journal-story.hero.image` | required replacement | 1600 × 1000 (8:5) | `277-workshop-journal-story-required-hero.webp` |
| `/workshop-journal/coin-and-spoon-ring-care` | `workshop-journal-coin-and-spoon-ring-care.hero.image` | required replacement | 1600 × 1000 (8:5) | `278-coin-spoon-ring-care-required-hero.webp` |
| `/workshop-journal/coin-and-spoon-ring-care` | `workshop-journal-coin-and-spoon-ring-care.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `78-coin-spoon-rings-category.webp` |
| `/workshop-journal/polymer-clay-earring-care` | `workshop-journal-polymer-clay-earring-care.hero.image` | required replacement | 1600 × 1000 (8:5) | `279-polymer-clay-earring-care-required-hero.webp` |
| `/workshop-journal/polymer-clay-earring-care` | `workshop-journal-polymer-clay-earring-care.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `73-polymer-clay-category.webp` |
| `/workshop-journal/handmade-vintage-sourced-guide` | `workshop-journal-handmade-vintage-sourced-guide.hero.image` | required replacement | 1600 × 1000 (8:5) | `280-handmade-vintage-sourced-required-hero.webp` |
| `/workshop-journal/handmade-vintage-sourced-guide` | `workshop-journal-handmade-vintage-sourced-guide.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `46-vintage-treasures.webp` |
| `/marketplaces` | `marketplaces.hero.image` | required replacement | 1600 × 1000 (8:5) | `281-marketplaces-required-hero.webp` |
| `/marketplaces` | `marketplaces.section.visual.1` | recommended replacement | 1600 × 1000 (8:5) | `46-vintage-treasures.webp` |

## Implementation guidance

The current frontsite recovery script only substitutes images that are still explicit default Media Studio placeholders, preserving owner-selected media. Do not overwrite published product photographs, user content, records, prices, checkout, or authentication. The sizes above come from the actual catalog—not the original upload image dimensions. GitHub's text connector confirms binary paths exist but cannot inspect WebP dimensions, so pixel dimensions of the committed binaries were **not** verified in this audit.

For Admin sets 13–19, existing images are wide decorative banners, not slots in the Media Studio dimension catalog. Inspect CSS/container geometry for any replacement; **1712 × 324** has been used for prior banner batches but must not be generalized to inline cards or Admin workflows.

Earlier proposed alternate images 306–345 should not be counted as missing, or assumed activated, simply because ZIPs were prepared. The active Admin mappings currently use 121–190.

## Build 433 — authored-default customer placeholder closure

The pre-existing 29 mapped Media Studio P1/P2 slots remain owner-editable and already have committed Brand V3 fallback WebPs. Build 433 addressed a **different class**: five generic SVG illustrations still authored directly on Tools, Supplies, Toolshed, and Workshop-Made Gifts. These are now mapped to existing Brand V3 WebPs, with two Workshop gift slots preserving their original Media Studio keys. The catalog pages use one illustrative card **after** the grouped results, rather than one card per category.

| Page | Generic artwork removed | Curated fallback |
| --- | --- | --- |
| Tools | engraving-proof.svg | 44-workshop-tools.webp |
| Supplies | product-material.svg | 45-materials-supplies.webp |
| Toolshed | vintage-condition.svg | 09-vintage-finds-category.webp |
| Workshop-Made Gifts hero | product-process.svg | 293-custom-gifts-southern-ontario-content-visual.webp |
| Workshop-Made Gifts process | product-process.svg | 286-home-workshop-process-visual.webp |

The current source audit distinguishes `genericArtworkSvgReferences` (target **zero**) from `mediaStudioEditablePlaceholderHooks` (**29 intentional edit hooks**, using the existing runtime artwork mapper). A source-code gate cannot independently certify Cloudflare's active Production state or the exact pixel sizes of WebP binaries. See [Build 433 release handoff](../../docs/operations/RELEASE_467_BUILD_433_BRAND_V3_CUSTOMER_PLACEHOLDER_CLOSURE.md).
