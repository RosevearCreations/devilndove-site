# Database Schema Reference

## Core auth

### users
- user_id
- email
- password_hash
- display_name
- role
- is_active
- created_at
- updated_at
- last_login_at

### sessions
- session_id
- user_id
- session_token
- token
- created_at
- expires_at
- ip_address
- user_agent

Client auth now uses the existing sessions table with a browser cookie fallback for the token so regular pages can resolve the same active session more reliably.

### admin_logs
Admin security and action logging.

## Profiles and tiers

### user_profiles
Customer and employee profile fields including phone, preferences, address, employee info, and emergency contact.

### access_tiers
### user_access_tiers
Business, customer, supporter, and employee tier assignments.

## Commerce

### tax_classes
### products
### product_images
### product_tags
### orders
Includes `payment_status` and `payment_method` in the current schema.

### order_items
### order_status_history
### payments
### payment_refunds
Local refund audit table for admin and provider reconciliation.

### payment_disputes
Local dispute audit table for chargeback and admin follow-up.

## Growth, analytics, SEO, media, and inventory

### site_visitors
Unique visitor identity and country and device summary.

### site_visitor_sessions
Visitor session timeline, entry path, last path, checkout, and abandonment flags.

### site_page_views
Historical page view and event trail.

### site_search_events
Search terms and result counts.

### cart_activity
Cart add, update, checkout, and abandonment events.

### app_settings
App-wide saved settings.

### notification_jobs
### notification_dispatch_logs
Queued notification and dispatch tracking.

### product_seo
Meta title, description, keywords, H1, canonical, and Open Graph fields.

### product_image_annotations
Alt text, title, caption, focal points, and notes.

### media_assets
Uploaded R2-backed assets with product linkage, object key, sort order, optional variant role, and soft delete support.

### webhook_events
Provider event log with idempotency, status, replay request metadata, retry attempt fields, and dispatch notes.

### site_item_inventory
Operational inventory table for tools, supplies, and sellable items with on-hand, reserved, incoming, supplier, and cost fields.

### site_inventory_movements
Movement log for inventory creates, adjustments, reserves, releases, incoming changes, corrections, and deletes.
Fields include previous and new on-hand, reserved, and incoming quantities plus note and actor.


## auth_recovery_requests

Stores logged-out forgot-password and forgot-email requests for later admin review without revealing whether a matching account exists.


## catalog_items

Purpose: staged unified catalog storage for tools, supplies, and featured creations that were previously JSON-only. This supports cleaner public search, future analytics, and inventory automation.

Key columns:
- `item_kind` (`tool`, `supply`, `creation`, `other`)
- `source_key` (stable unique source identifier per kind)
- `slug`, `name`, `brand`, `category`, `subcategory`, `item_type`
- `short_description`, `notes`, `image_url`, `r2_object_key`, `amazon_url`
- `quantity_on_hand`, `reorder_point`, `storage_location`
- `source_record_json`, `source_json_path`

## Product CSV mass upload fields

Required fields:
- `name`
- `product_type` (`physical` or `digital`)
- `price_cents`

Optional fields:
- `slug` (auto-generated if omitted)
- `status`, `currency`, `sku`, `short_description`, `description`
- `compare_at_price_cents`, `taxable`, `tax_class_id`, `requires_shipping`, `weight_grams`
- `inventory_tracking`, `inventory_quantity`, `digital_file_url`, `featured_image_url`, `sort_order`

Images are optional during import and can be added during later review before activation.


## Current pass additions
- Session/auth now uses a stronger same-site continuity path: auth endpoints set a first-party `dd_auth_token` cookie in addition to returning the bearer token. Public pages can resolve the signed-in member/admin state more reliably.
- Added `movie_catalog` for staged migration of the legacy UPC-only movie JSON into D1. The public movies page now reads from `/api/movies`, which prefers D1 and falls back to `/data/catalog.json`.
- Catalog sync now supports movies in addition to tools, supplies, and featured creations.
- Public movie search UI now supports title, UPC, year, actor, and director fields when that data exists, while still working with legacy UPC-only data.
- Product CSV preview now renders as a structured validation table instead of loose JSON/text lines.
