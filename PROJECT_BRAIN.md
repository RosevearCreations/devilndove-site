# Project Brain

## Core mental model

This repo is now a combined:

- public brand site
- ecommerce storefront
- member account system
- admin operations panel
- analytics and growth data layer
- payment and webhook processing layer
- product media upload and asset layer
- public SEO and search-awareness layer

## Important current architecture

### Auth
Uses `users` and `sessions` with bearer token auth.

### Commerce
Uses `products`, `product_images`, `product_tags`, `orders`, `order_items`, `order_status_history`, and `payments`.

### Profiles and tiers
Uses `user_profiles`, `access_tiers`, and `user_access_tiers`.

### Growth, SEO, monitoring, and search
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
- `site_inventory_movements`

### Payments, webhook, and media additions
Uses:

- `webhook_events`
- `payment_refunds`
- `payment_disputes`
- `media_assets`

## Key newer additions

- admin webhook review and requeue endpoint and dashboard tooling
- admin refund and dispute endpoint and order-detail UI foundation
- admin media asset browser and delete tooling
- public search page for products, tools, supplies, creations, and key pages
- sitewide public SEO refresh with one-H1-per-page enforcement target
- inventory model now includes reserved, incoming, supplier, and cost fields
- inventory movement history foundation for stock changes
- import preview now validates duplicate slugs and media URL format

## Where we are now

The platform is still in an integration and hardening phase.

Most important next layers after this pass are:

- webhook worker retry and replay execution
- provider-confirmed refund and dispute status sync
- richer media library management around uploaded R2 assets
- direct media replace, thumbnail, and featured-image suggestion flow
- deeper inventory operations and movement history UX
- funnel dashboards and analytics polish
- ongoing crawl, metadata, and public search-awareness improvements each pass
