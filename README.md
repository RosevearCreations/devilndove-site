# Devil n Dove Website

Devil n Dove is a public website, storefront, member area, and admin management system for the workshop.

## Current state

The current build includes:

- public storefront and product detail pages
- member login, registration, account tools, orders, and downloads
- admin dashboard for users, products, orders, analytics, inventory, SEO, notifications, and media
- checkout and order creation
- PayPal handoff, PayPal return capture, and PayPal webhook reconciliation
- Stripe hosted checkout preparation and Stripe webhook reconciliation
- webhook event logging for provider idempotency / audit trail
- admin webhook review and safe replay queue controls
- live visitor/session analytics and historical website data by path and country
- product SEO fields, product image annotations, and product media workflow tools
- direct image upload endpoint for R2-backed product media
- uploaded asset browsing and delete actions in admin
- site inventory/reorder tracking for tools, supplies, and sellable products
- local refund/dispute workflow logging for orders and payments

## Main payment status

Implemented now:

- order creation
- payment preparation
- PayPal redirect handoff
- PayPal return capture
- PayPal webhook reconciliation endpoint
- Stripe Checkout session creation
- Stripe webhook reconciliation endpoint
- webhook event storage for duplicate-event safety
- admin manual payment recording
- admin webhook review/requeue controls
- refund/dispute local tracking tables and admin actions

Still to deepen later:

- actual provider-side refund execution + sync back confirmation
- provider dispute evidence upload/response workflow
- webhook worker retry scheduling beyond manual replay queueing
- optional Stripe customer portal / saved customer records later

## Main product/media status

Implemented now:

- create, edit, archive, delete products
- bulk update products
- import preview and import tools with duplicate slug checks
- product SEO editor
- product image annotation editor
- product image workflow editor for ordered images, alt text, captions, focal points, and featured image sync
- direct admin upload endpoint for product images to R2
- uploaded asset library browsing and delete actions in admin
- inventory tracking on products and site inventory records

## Database files

- `database_schema.sql`
- `database_store_schema.sql`
- `database_access_tiers.sql`
- `database_payments_extension.sql`
- `database_profiles_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`
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
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`
- `/api/paypal-return`
- `/api/paypal-webhook`
- `/api/stripe-webhook`

Admin operations added in this pass:
- `/api/admin/webhook-events`
- `/api/admin/payment-actions`
- `/api/admin/media-assets`
- `/api/admin/site-item-inventory`
- `/api/admin/import-products-preview`
