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


## Build 169 D1 smoke-test result storage

The admin endpoint `/api/admin/post-deploy-smoke-tests` stores manual or automated smoke-test results in D1.

Recommended checks to store after deploy:

- `/` homepage returns 200 and dark-theme sections render correctly.
- `/shop/` returns 200 and product cards fetch JSON successfully.
- `/creations/` returns 200 and Browse Devil n Dove creations uses dark cards.
- `/gift-cards/` returns 200 and balance lookup form loads.
- `/admin/catalog/` loads without function syntax errors.
- `/api/products` returns JSON.
- `/api/product-detail?slug=<known-product-slug>` returns JSON, not HTML.
- `/api/trust-blocks?context=home` returns JSON.

Store results with `build_label`, `page_url`, `result_status`, `http_status`, and `notes`.
