# Build 419 — Targeted Live Read-Only Structural Drift Evidence

## Status

**PASS — LIVE READ-ONLY EVIDENCE COMPLETE / PRODUCTION WRITES CLOSED**

Build 419 completed successfully against both live D1 databases. No migration, seed, data copy, DDL, provider call, or Production write was executed.

Recorded live classification:

```text
CREATE-SQL-different common tables inspected: 54
Exact core semantic match despite CREATE text: 14
Column-order/history-only candidates: 18
Actual structural candidates: 22
```

The successful run ended with:

```text
BUILD 419 TARGETED LIVE READ-ONLY STRUCTURAL DRIFT EVIDENCE: COMPLETE
No migration or data mutation was executed.
PRODUCTION PROMOTION: CLOSED
PRODUCTION DATA COPY: CLOSED
```

## Exact semantic matches — no migration for CREATE-text parity

The following 14 tables have matching column/FK/explicit-index semantics despite differing stored CREATE text:

- `accounting_journal_entries`
- `accounting_journal_lines`
- `blog_comments`
- `blog_posts`
- `marketplace_download_block_events`
- `member_sessions_legacy`
- `members_legacy`
- `payment_disputes`
- `payment_refunds`
- `seo_opportunity_actions`
- `seo_page_overrides`
- `sessions`
- `social_post_queue`
- `trust_block_items`

Do not rebuild these merely to make stored CREATE SQL text identical.

## Column-order/history-only candidates

Build 419 found 18 tables whose named column attributes, foreign keys and explicit indexes match after ordinal position is ignored:

- `access_tiers`
- `accounting_attachments`
- `caip_media_upload_files`
- `cart_activity`
- `catalog_items`
- `community_events`
- `custom_request_order_drafts`
- `custom_request_payment_request_drafts`
- `custom_request_quote_share_links`
- `custom_requests`
- `local_seo_landing_page_reviews`
- `media_assets`
- `orders`
- `product_story_public_notes`
- `runtime_incidents`
- `site_visitor_sessions`
- `social_post_attempts`
- `webhook_events`

These remain outside Production migration scope unless a later constraint/runtime review proves a material difference.

## Actual structural candidates from the successful live run

Build 419 reported 22 candidates:

- `accounting_expenses`
- `accounting_writeoffs`
- `creative_project_inventory_posts`
- `creative_project_inventory_reversals`
- `general_ledger_accounts`
- `gift_card_lookup_attempts`
- `membership_tier_policies`
- `movie_catalog`
- `notification_outbox`
- `packaging_project_ingredients`
- `product_costs`
- `product_image_annotations`
- `product_material_return_audit`
- `product_media_score_history`
- `product_resource_links`
- `product_review_actions`
- `products`
- `site_inventory_movements`
- `site_item_inventory`
- `site_page_views`
- `supplier_purchase_order_items`
- `tax_classes`

Build 420 subsequently classifies the `packaging_project_ingredients` explicit-index difference as formatting-only: the Development and Production definitions differ only by whitespace around commas. Build 420 adds conservative index normalization so formatting-only comma/parenthesis spacing and redundant ASC do not count as structural drift, while UNIQUE, DESC and indexed-column order remain material.

## Highest-confidence material findings

### Gift Card schema

Production lacks the current Gift Card lookup protection shape:

- `gift_card_lookup_attempts` is missing `lookup_email`, `code_suffix`, `ip_hash`, `user_agent`, and `result_status`.
- Production lacks the current lookup-attempt indexes.
- Production lacks `gift_card_lookup_lockouts` entirely.

`database_gift_card_runtime_parity.sql` is the current migration authority and the public Gift Card lookup readiness gate requires the current protection schema.

### Membership tier policies

Development is on the canonical Build 395 membership policy shape:

```text
policy_id
tier_code
title
short_description
benefits_json
badge_color
sort_order
is_visible
created_at
updated_at
```

Production still exposes the older naming shape including `membership_tier_policy_id`, `code`, `name`, and `display_title`. `database_membership_tier_policy_runtime_parity.sql` is the current authority. Build 410 already proved the data-preserving rebuild logic against Development; that helper remains Development-only and must never be pointed at Production.

### Notification outbox

Development contains `notification_outbox.metadata_json`; Production does not. Build 403 `database_notification_runtime_parity.sql` is the current shared notification authority and also carries the current outbox indexes.

### Fractional inventory

Production still has INTEGER affinities on several inventory/post/reversal quantity columns where Development uses REAL. Fractional inventory/usage is intentional current behaviour; do not regress Development to INTEGER merely for parity.

### Product / FK hardening

Production lacks current Development foreign keys on parts of Product media/review/capture, visitor-page-view and supplier-PO relationships. These require orphan prechecks and, where SQLite requires it, data-preserving table rebuilds rather than blind ALTER statements.

### CAIP metadata

Production contains 113 `caip_media_upload_files` rows:

```text
aborted    1 row     467.8 MiB
archived  66 rows    114.3 GiB
failed     1 row       3.8 GiB
uploaded  45 rows     91.9 GiB
```

All 45 uploaded rows are linked to Creative Assets. D1 contains metadata/state while binaries live in private R2. Do not copy these D1 rows alone into Development.

### One-sided tables

```text
__sql_test:                 Development MISSING / Production 0
search_query_terms:         Development MISSING / Production 5
gift_card_lookup_lockouts:  Development 0 / Production MISSING
```

`gift_card_lookup_lockouts` is current required schema. `__sql_test` is empty Production residue pending retirement review. Preserve the five `search_query_terms` rows until current authority is resolved.

## Safety boundary

Build 419 is an evidence build only. Production promotion remains closed.

The next authority is `BUILD420_PRODUCTION_PARITY_HARDENING.md`, which batches the release planning into twenty concrete hardening decisions and defines the next twenty ordered evidence/rollout tasks.
