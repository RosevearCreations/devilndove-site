# Build 223 Validation — Product Details Hotfix

## Purpose
Validate the correction for the public product-card **View** failure and prove that optional product-detail schema drift cannot take the entire page offline.

## Static/package checks
1. Run `node --check functions/api/product-detail.js`.
2. Run `node --check functions/api/products.js`.
3. Run `node --check public/js/product-detail.js`.
4. Confirm `product-detail.js` and `public/js/product-detail.js` are identical.
5. Confirm every exposed HTML page still has exactly one H1.
6. Confirm public pages still have title, description and canonical metadata.
7. Confirm CSS braces and all local references are valid.
8. Confirm the ZIP passes `unzip -t`.

## Database-shape resilience checks
1. Fresh aggregate schema: create `database_full_schema.sql`, insert an active product and product image, then call the Worker handler. Expect HTTP 200 and `ok:true`.
2. Minimal schema: create only a small `products` table with the public core fields, insert an active product, then call the Worker handler. Expect HTTP 200 and a featured-image fallback even though optional tables are absent.
3. Confirm the former exception `normalizeResults(...).catch is not a function` cannot be reproduced.

## Live Cloudflare verification
1. Deploy the full Build 223 package without running a new migration.
2. Purge cache for `/public/js/product-detail.js` when necessary.
3. Open `/shop/` in an incognito window.
4. Select **View** on at least three active product cards.
5. Confirm product name, price, image, description and inventory render.
6. Inspect `/api/product-detail?slug=<slug>` and confirm HTTP 200 JSON with `ok:true`.
7. Confirm quantity tiers, bundles, image annotations or resource stories may be empty without blocking the page.
8. Test an invalid slug and confirm a safe 404 JSON response.
9. Record all results in `/admin/post-deploy-smoke-tests/`.

## Rollback
If the deployed hotfix causes a regression, redeploy Build 222. No D1 rollback is needed because Build 223 changes no schema or data.
