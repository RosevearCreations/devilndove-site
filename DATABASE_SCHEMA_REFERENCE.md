# Database Schema Reference

This file is a practical reference for the current database model expected by the newer build.

## Core auth
- users
- sessions
- admin_logs

## Store
- tax_classes
- products
- product_images
- product_tags
- orders
- order_items
- order_status_history
- payments

## Access / profiles
- access_tiers
- user_access_tiers
- user_profiles

## Analytics / SEO / operations
- site_visitors
- site_visitor_sessions
- site_page_views
- site_search_events
- cart_activity
- app_settings
- notification_jobs
- notification_dispatch_logs
- product_seo
- product_image_annotations
- site_item_inventory

## Important note
If your database still has `members` and `member_sessions`, it is on the older schema and should be migrated before using the newer auth code.
