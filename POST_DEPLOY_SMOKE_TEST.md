# Post-deploy live URL smoke-test checklist

Run this after each Cloudflare Pages deployment.

## Public pages

- `/` loads without console JSON/HTML parse errors.
- `/shop/` keeps the dark Devil n Dove theme and shows product cards with usable thumbnails.
- `/shop/product/?slug=<known-product-slug>` returns product JSON-backed content, not an `Unexpected token '<'` error.
- `/creations/` keeps dark cards with readable text.
- `/gift-cards/` loads the gift-card page and artwork.
- `/custom-candle-making-ontario/` and `/custom-soap-making-ontario/` each have one H1.

## Admin pages

- `/admin/catalog/` loads product rows, readiness badges, QA controls, and edit buttons.
- `/admin/catalog-media/` loads Product Media Workflow and derivative history.
- `/admin/marketplace-exports/` shows image selectors and CSV download.
- `/admin/trust-blocks/` shows placement counts and context preview.
- `/admin/mobile/` shows Today tasks, failed API details, and snooze buttons.
- `/admin/local-seo-review/` shows score badges and title/meta quick actions.

## Data/API checks

- `/api/products` returns JSON.
- `/api/product-detail?slug=<known-product-slug>` returns JSON.
- `/api/admin/today-tasks` returns JSON when signed in.
- `/api/admin/marketplace-export-preview?channel=etsy` returns JSON when signed in.
- `/api/admin/product-readiness` returns JSON when signed in.

## Visual checks

- No white card with white/light text in shop, creations, or Local maker trust sections.
- Product card images do not stretch vertically.
- Product media table/cards do not force long full-page scrolling for routine edits.
