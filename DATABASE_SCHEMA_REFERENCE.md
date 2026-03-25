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
