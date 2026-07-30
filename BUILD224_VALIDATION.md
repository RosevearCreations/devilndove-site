# Build 224 Validation — Complete Product Gallery

Build 224 is a code-only hotfix. Do not apply a new D1 migration.

## Deployment
1. Confirm the Build 222 D1 migration is already installed.
2. Deploy the complete Build 224 package.
3. Open the public shop in a private/incognito window.
4. Hard-refresh the product page. The script URL should contain `/public/js/product-detail.js?v=224`.

## Seven-image product test
1. In Catalog Media, choose an active product known to have seven retained images.
2. Confirm none of the seven is marked `blocked` or `consent_needed`.
3. Open `/shop/product/?slug=<product-slug>`.
4. Confirm the main image and seven unique thumbnails are visible.
5. Confirm the indicator reads `Image 1 of 7`.
6. Select thumbnails 2 through 7.
7. Confirm each selection changes the main image, active outline, image counter, alt text, and caption when supplied.
8. Repeat on a narrow mobile viewport and confirm the thumbnails wrap without horizontal page overflow.

## API test
1. Open `/api/product-detail?slug=<product-slug>`.
2. Confirm HTTP 200 and `ok:true`.
3. Confirm `image_summary.storefront_count` is `7`.
4. Confirm `storefront_images` contains seven unique non-empty `image_url` values.
5. Confirm `warnings` does not contain `product_images_unavailable`.
6. A `media_asset_enrichment_unavailable` warning may be investigated, but it must not reduce the core product-image count.

## Intentional exclusions
An image should not be public when:
- `public_use_status` is `blocked` or `consent_needed`;
- linked consent does not allow public product-page use;
- the image URL is empty;
- it is a duplicate of another URL;
- it belongs to another product record.

## Regression checks
- Product details still show name, price, description, inventory, and purchase controls.
- A product with only one image still loads cleanly and says `Featured image`.
- Invalid slugs fail safely.
- Product-detail API responses include `Cache-Control: no-store`.
- All JavaScript syntax checks pass.
- Every exposed HTML page retains exactly one H1.
- Public indexable pages retain title, meta description, and canonical URL.
- CSS braces and local asset references pass.
- ZIP compression integrity passes.

## Automated package validation completed
- JavaScript syntax: 492 files passed.
- HTML H1 count: 104 pages passed with exactly one H1 each.
- Public indexable SEO scan: 40 pages passed title, description, and canonical checks.
- Local HTML references: 1,855 checked with no unresolved non-API local references.
- CSS brace balance: 2,215 opening and 2,215 closing braces.
- Predeploy sanity script: passed with zero issues.
- Legacy media schema simulation: HTTP 200 with seven unique `storefront_images` records.
- Root/public product-detail browser scripts: synchronized.
