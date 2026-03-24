# Repo Base Guide

## Purpose

This repo runs the Devil n Dove website as:

- brand/public site
- storefront
- member area
- admin dashboard
- payment/webhook layer
- analytics and operations layer

## Important folders

- `functions/api/` — Cloudflare API endpoints
- `public/js/` — browser-side logic for auth, admin, checkout, and analytics
- `admin/` — admin dashboard page
- `checkout/` — checkout and confirmation pages
- `shop/` — storefront pages
- `data/` — catalog/site JSON content
- `assets/` and `css/` — static design assets and styling

## Key current API groups

### Auth
Session-based user login and account controls.

### Storefront / checkout
Order creation, payment preparation, PayPal return, and provider webhooks.

### Admin
Products, users, orders, SEO, inventory, notifications, analytics, media upload, and product image workflow.

### Tracking
Visitor, cart, and search behavior logging.

## Database files to keep aligned

- `database_schema.sql`
- `database_store_schema.sql`
- `database_access_tiers.sql`
- `database_profiles_extension.sql`
- `database_payments_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`

## Cloudflare bindings/secrets expected now

### D1
- `DB`

### R2
- `PRODUCT_MEDIA_BUCKET`

### Variables / secrets
- `PUBLIC_SITE_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_ENV`
- `PAYPAL_WEBHOOK_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRODUCT_MEDIA_PUBLIC_BASE_URL`
- optional `PRODUCT_MEDIA_BUCKET_NAME`
