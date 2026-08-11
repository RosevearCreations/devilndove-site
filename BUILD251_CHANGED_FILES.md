# Build 251 Changed Files

- `public/js/admin-create-product.js` — restores the missing `normalizeImageKey()` helper used by the current-product image manager, preventing the Product Editor from crashing before saved product images render.
- `admin/products/index.html` — cache-busts the corrected product image manager as `v=251`.
- `admin/catalog/index.html` — cache-busts the same shared editor bundle as `v=251`.
- `scripts/build251_product_image_runtime_regression.py` — regression coverage for the runtime helper, render path, cache version, and product-detail media recovery contract.
- `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md` — records Build 251 as the current release and the corrected Product Editor image behavior.
