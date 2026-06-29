# Post-Deploy Smoke Test — Build 197

Run after the Build 197 D1 migration and Pages deployment. Test on the deployed domain while signed in as an administrator.

## 1. Admin helper calls

Open `/admin/operations/` and browser developer tools. The following calls must return JSON, not a Cloudflare 503:

- `GET /api/admin/community-content`
- `POST /api/admin/live-readiness-playbook` with its normal `record_usage` action
- `GET /api/admin/custom-requests`
- `GET /api/admin/social-post-queue`

A 200 response containing `degraded: true` keeps the page usable and indicates optional data/schema needs review. A 401 while signed out is normal. Any 503 must be captured with timestamp, response body, and Cloudflare function logs.

## 2. Product edit and conflict handling

1. Open `/admin/catalog/` and load a known product. Confirm `/api/admin/product-detail?product_id=<id>` returns JSON.
2. Change Additional Colours to a simple value such as `Blue, Green`, save, reload, and verify it persists.
3. Try a duplicate SKU or slug on a disposable draft. Confirm the editor shows a conflict message and does not continuously retry or requeue it.
4. Restore the original value or delete/archive the test draft using normal safeguards.

## 3. Correction/delete state

1. Load an unused disposable product and open **Correct / return raw inventory**.
2. Close or complete the preview according to the normal test guide.
3. Load a second unused disposable product immediately afterward.
4. Confirm its preview and delete/review controls work. Do not delete a product that has orders/history; archive it instead.

## 4. Preserve media by default

1. Use a product with at least three image records and, where possible, a video/link.
2. Change the featured image or SEO/OG image only, save, reload, and confirm every existing image/video remains.
3. Open the dedicated product media editor, reorder an image, save, reload, and confirm the same media records remain.
4. Remove exactly one disposable image row and press **Save Images**. Reload and confirm only that row disappeared.
5. Confirm the corresponding original R2 file was not automatically deleted. Remove source assets only through the explicit asset-library decision path.

## 5. Categories, Shop cards, and phone nav

1. In `/admin/catalog/`, expand **Manage product categories**, add a temporary category, save, and confirm it appears in the product editor. Soap and Candles should already appear.
2. Open Shop at approximately 360 px, 768 px, 1024 px, and desktop width. Each product card should keep image first and details below it.
3. At phone width, open the menu. It should show a compact panel with closed accordion groups, not a long always-open screen list.

## 6. Public SEO sanity

For one real public product, confirm one visible H1, a useful title/meta description, canonical URL, visible price/availability, and meaningful lead-image alt text. Structured product facts must match the rendered page.

Record pass/fail, date, user, browser/device width, and any function error IDs in the release record.
