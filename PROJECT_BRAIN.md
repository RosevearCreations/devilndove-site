# Project Brain

## Core mental model

This repo is now a combined:

- public brand site
- ecommerce storefront
- member account system
- admin operations panel
- analytics and growth data layer
- payment/webhook processing layer
- product media upload/asset layer

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

### Payments / webhook / media additions
Uses:

- `webhook_events`
- `payment_refunds`
- `payment_disputes`
- `media_assets`

## Key newer additions

- admin webhook review/requeue endpoint and dashboard tooling
- admin refund/dispute endpoint and order-detail UI
- admin media asset browser/delete tooling
- inventory model now includes reserved/incoming/supplier/cost fields
- import preview now validates duplicate slugs and media URL format

## Where we are now

The platform is still in an integration/hardening phase.

Most important next layers after this pass are:

- webhook worker retry and replay execution
- provider-confirmed refund/dispute status sync
- richer media library management around uploaded R2 assets
- deeper inventory operations and movement history
- funnel dashboards and analytics polish
