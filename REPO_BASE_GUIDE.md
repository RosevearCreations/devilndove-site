# Repo Base Guide

## Purpose

This repo runs the Devil n Dove website as:

- brand and public site
- storefront
- member area
- admin dashboard
- payment and webhook layer
- analytics and operations layer
- SEO and crawl-awareness layer

## Important folders

- `functions/api/` — Cloudflare API endpoints
- `functions/` — Cloudflare Pages Functions such as the sitemap
- `public/js/` — browser-side logic for auth, admin, checkout, analytics, and search
- `admin/` — admin dashboard page
- `checkout/` — checkout and confirmation pages
- `shop/` — storefront pages
- `search/` — public site search page
- `data/` — catalog and site JSON content
- `assets/` and `css/` — static design assets and styling

## Key current API groups

### Auth
Session-based user login and account controls.

### Storefront and checkout
Order creation, payment preparation, PayPal return, and provider webhooks.

### Admin
Products, users, orders, SEO, inventory, notifications, analytics, media upload, media library browsing, webhook review, and refund and dispute logging.

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

## Cloudflare bindings and secrets expected now

### D1
- `DB`

### R2
- `PRODUCT_MEDIA_BUCKET`

### Variables and secrets
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

## Public SEO rule of thumb

When a public page is touched, review:

- exactly one H1
- title and meta description
- canonical URL
- Open Graph and Twitter tags
- robots intent
- sitemap impact
- whether the page should contribute to public search awareness


## Shared layout expectations

- `/js/main.js` owns shared nav and footer injection
- `/public/js/site-auth-ui.js` owns the floating account widget
- `/account-help/` provides logged-out recovery request entry points


## Shared layout and auth notes

- `/js/main.js` owns the shared nav and footer injection and now also ensures the standard auth/site scripts are present on normal pages.
- `/public/js/auth.js` is the shared client auth layer and now persists the session token with both localStorage and a sitewide cookie fallback.
- `/public/js/site-auth-ui.js` remains the shared account widget/nav visibility layer used by both the public site and protected areas.
- `/functions/api/admin/live-activity.js` provides the admin dashboard live feed using recent analytics, cart, order, and webhook data.
