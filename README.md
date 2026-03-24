# Devil n Dove Website

Devil n Dove is a public website, storefront, member area, and admin management system for the workshop.

## Current state

The current build includes:

- public storefront and product detail pages
- member login, registration, account tools, orders, and downloads
- admin dashboard for users, products, orders, analytics, inventory, SEO, and notifications
- checkout and order creation
- PayPal handoff, PayPal return capture, and PayPal webhook reconciliation foundation
- live visitor/session analytics and historical website data by path and country
- product SEO fields, product image annotations, and product media workflow foundation
- site inventory/reorder tracking for tools, supplies, and sellable products

## Main payment status

Implemented now:

- order creation
- payment preparation
- PayPal redirect handoff
- PayPal return capture
- PayPal webhook reconciliation endpoint
- admin manual payment recording

Still to deepen later:

- Stripe hosted checkout or payment intent completion
- webhook retry workers / scheduled dispatch
- refund automation
- provider dispute handling

## Main product/media status

Implemented now:

- create, edit, archive, delete products
- bulk update products
- import preview and import tools
- product SEO editor
- product image annotation editor
- product image workflow editor for ordered images, alt text, captions, focal points, and featured image sync
- inventory tracking on products and site inventory records

## Database files

- `database_schema.sql`
- `database_store_schema.sql`
- `database_access_tiers.sql`
- `database_payments_extension.sql`
- `database_profiles_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_admin_seed_template.sql`

## Important endpoints

Auth:
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/logout-all`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/auth/session-info`
- `/api/auth/bootstrap-admin`
- `/api/auth/bootstrap-status`

Storefront and checkout:
- `/api/products`
- `/api/product-detail`
- `/api/payment-providers`
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`
- `/api/paypal-return`
- `/api/paypal-webhook`

Admin products/media:
- `/api/admin/products`
- `/api/admin/product-detail`
- `/api/admin/create-product`
- `/api/admin/update-product`
- `/api/admin/delete-product`
- `/api/admin/archive-product`
- `/api/admin/product-seo`
- `/api/admin/product-image-annotations`
- `/api/admin/product-images`
- `/api/admin/bulk-update-products`
- `/api/admin/import-products-preview`
- `/api/admin/import-products`
- `/api/admin/site-item-inventory`

Analytics:
- `/api/track/visit`
- `/api/track/cart`
- `/api/admin/visitor-analytics`

## Notes for deployment

Keep secrets in Cloudflare Variables and Secrets.

Important payment variables include:

- `PUBLIC_SITE_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_ENV`
- `PAYPAL_WEBHOOK_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Admin/media note

Images can be added to products now through the product media workflow using image URLs. The next deeper step later is direct upload handling to R2 from admin.
