# Devil n Dove Brand V3 — Whole public site coverage, 70-page audit

The automated repository audit counts 70 public HTML pages, confirms global Brand V3 middleware CSS across normal and fast storefront paths, and reports default Media Studio slots.

This change adds **safe placeholder-only recovery** on 22 public routes. Before any illustration is displayed, the script checks that the slot still has `data-media-placeholder="1"` and an `/assets/placeholders/` URL. If Media Studio has supplied an owner-selected image, no replacement is performed. The approved brand-v3 art images are all stored in `assets/images/brand-v3/`.

| Page | Slot(s) | Approved decorative filename(s) |
|---|---|---|
| `/` | `home.section.visual.1`, `home.what.visual.2`, `home.what.visual.3` | `81-workshop-process-header.webp`, `99-home-resin-workshop-card.webp`, `98-home-creative-paths-card.webp` |
| `/about/` | `about.section.visual.1` | `97-about-what-we-do.webp` |
| `/collections/` | `collections.section.visual.1` | `31-collections-overview-promo.webp` |
| `/contact/` | `contact.section.visual.1` | `96-contact-where-to-find-us.webp` |
| `/creations/` | `creations.section.visual.1` | `41-featured-creations.webp` |
| `/custom-candle-making-ontario/` | `custom-candle-making-ontario.section.visual.1` | `74-candles-category.webp` |
| `/custom-gifts-southern-ontario/` | `custom-gifts-southern-ontario.section.visual.1` | `76-custom-gifts-category.webp` |
| `/custom-soap-making-ontario/` | `custom-soap-making-ontario.section.visual.1` | `40-creating-with-purpose-promo.webp` |
| `/events/` | `events.section.visual.1` | `50-community.webp` |
| `/gift-cards/` | `gift-cards.section.visual.1` | `19-gift-cards.webp` |
| `/handmade-jewelry-ontario/` | `handmade-jewelry-ontario.section.visual.1` | `71-jewellery-category.webp` |
| `/laser-engraving-ontario/` | `laser-engraving-ontario.section.visual.1` | `10-laser-engraved-category.webp` |
| `/marketplaces/` | `marketplaces.hero.image`, `marketplaces.section.visual.1` | `31-collections-overview-promo.webp`, `46-vintage-treasures.webp` |
| `/polymer-clay-earrings-ontario/` | `polymer-clay-earrings-ontario.section.visual.1` | `73-polymer-clay-category.webp` |
| `/socials/` | `socials.hero.image`, `socials.section.visual.1` | `50-community.webp`, `49-pets-nature.webp` |
| `/vintage-finds-ontario/` | `vintage-finds-ontario.section.visual.1` | `09-vintage-finds-category.webp` |
| `/workshop-journal/coin-and-spoon-ring-care/` | `workshop-journal-coin-and-spoon-ring-care.hero.image`, `workshop-journal-coin-and-spoon-ring-care.section.visual.1` | `78-coin-spoon-rings-category.webp`, `78-coin-spoon-rings-category.webp` |
| `/workshop-journal/handmade-vintage-sourced-guide/` | `workshop-journal-handmade-vintage-sourced-guide.hero.image`, `workshop-journal-handmade-vintage-sourced-guide.section.visual.1` | `09-vintage-finds-category.webp`, `46-vintage-treasures.webp` |
| `/workshop-journal/` | `workshop-journal.section.visual.1` | `95-workshop-journal-story-visual.webp` |
| `/workshop-journal/polymer-clay-earring-care/` | `workshop-journal-polymer-clay-earring-care.hero.image`, `workshop-journal-polymer-clay-earring-care.section.visual.1` | `73-polymer-clay-category.webp`, `73-polymer-clay-category.webp` |
| `/workshop-journal/story/` | `workshop-journal-story.section.visual.1` | `82-our-story-banner.webp` |
| `/workshop-made-gifts-ontario/` | `workshop-made-gifts-ontario.section.visual.1` | `76-custom-gifts-category.webp` |

The shared `css/brand-v3-frontsite-recovery.css` standardizes panels, responsiveness and complete image framing, and avoids changing product, stock or payment logic. It loads via Cloudflare middleware on every public HTML response (normal and fast Shop/Collections paths).

The detailed check is `scripts/brand_v3_frontsite_audit.mjs`, runnable by the "Devil n Dove — Full Frontsite Brand V3 Audit" workflow. Static inspection **does not equal browser visual verification** or `main`/Cloudflare Production deployment.
