# Project Brain

## Core mental model

This repo is now a combined:

- public brand site
- ecommerce storefront
- member account system
- admin operations panel
- analytics and growth data layer

## Important current architecture

### Auth
Uses `users` and `sessions` with bearer token auth.

### Commerce
Uses `products`, `product_images`, `product_tags`, `orders`, `order_items`, `order_status_history`, and `payments`.

### Profiles and tiers
Uses `user_profiles`, `access_tiers`, and `user_access_tiers`.

### Growth / SEO / monitoring
Uses:

- `site_visitors`
- `site_visitor_sessions`
- `site_page_views`
- `site_search_events`
- `cart_activity`
- `app_settings`
- `notification_jobs`
- `notification_dispatch_logs`
- `product_seo`
- `product_image_annotations`
- `site_item_inventory`

## Key newer additions

- PayPal return capture endpoint
- PayPal webhook reconciliation endpoint
- admin product media workflow endpoint
- storefront product detail now uses merged image + annotation data
- admin dashboard now includes product media workflow tooling

## Where we are now

The platform is in an integration/hardening phase.

Most important next layers after this pass are:

- webhook retry and replay tooling
- Stripe payment completion
- direct media upload pipeline to R2
- deeper inventory operations and reorder automation
