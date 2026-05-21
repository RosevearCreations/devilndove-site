-- Devil n Dove / Rosevear Creations
-- Amazon purchase import staging schema
-- Generated: 2026-05-11
-- Source CSV: orders_from_20220601_to_20260416_20260416_0932.csv
--
-- Purpose:
-- Stage reviewed Amazon purchase rows before applying costs/ASINs/order references
-- to tools, supplies, inventory, accounting, or receipt tables.
--
-- Privacy note:
-- This staging layout intentionally excludes account user email and seller address.

CREATE TABLE IF NOT EXISTS amazon_purchase_import_staging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  import_batch_id TEXT NOT NULL,
  source_file TEXT NOT NULL,

  match_status TEXT NOT NULL DEFAULT 'unmatched',
  match_score REAL NOT NULL DEFAULT 0,
  token_coverage REAL NOT NULL DEFAULT 0,
  matched_token_count INTEGER NOT NULL DEFAULT 0,
  matched_tokens TEXT,

  safe_to_stage_after_review TEXT NOT NULL DEFAULT 'review',
  review_decision TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,

  inventory_type TEXT CHECK (inventory_type IN ('tool', 'supply') OR inventory_type IS NULL),
  inventory_key TEXT,
  inventory_key_loose TEXT,
  inventory_name TEXT,
  inventory_brand_guess TEXT,
  inventory_category_or_type TEXT,
  inventory_r2_object_key TEXT,

  order_date TEXT,
  payment_date TEXT,
  amazon_order_id TEXT,
  asin TEXT,
  amazon_title TEXT,
  amazon_brand TEXT,
  manufacturer TEXT,
  amazon_product_category TEXT,
  item_model_number TEXT,
  part_number TEXT,
  seller_name TEXT,

  currency TEXT NOT NULL DEFAULT 'CAD',
  item_quantity REAL,
  item_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  item_shipping_cents INTEGER NOT NULL DEFAULT 0,
  item_tax_cents INTEGER NOT NULL DEFAULT 0,
  item_net_total_cents INTEGER NOT NULL DEFAULT 0,
  unit_net_cost_cents INTEGER,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_batch
  ON amazon_purchase_import_staging(import_batch_id);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_inventory
  ON amazon_purchase_import_staging(inventory_type, inventory_key);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_asin
  ON amazon_purchase_import_staging(asin);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_order
  ON amazon_purchase_import_staging(amazon_order_id, asin);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_review
  ON amazon_purchase_import_staging(review_decision, match_status);

-- Recommended import workflow:
-- 1. Load amazon_inventory_high_confidence_stage_candidates.csv into this staging table.
-- 2. Review medium/review rows in the spreadsheet before changing review_decision.
-- 3. Only rows with review_decision = 'approved' should be applied to production inventory/accounting records.
-- 4. Use amazon_inventory_purchase_summary_by_item.csv to compare totals before posting journal lines.


-- Current build guardrail, 2026-05-14:
-- The admin site-item-inventory API now auto-creates/backfills these columns when missing,
-- then syncs catalog_items into site_item_inventory for searchable Tools/Supplies inventory.
-- Keep this reference here so the schema expectation is visible even when the API does the safe migration.
-- Required site_item_inventory columns include:
-- source_type, external_key, item_name, category, source_url, amazon_url, image_url,
-- on_hand_quantity, reserved_quantity, incoming_quantity, reorder_level, unit_cost_cents,
-- stock_unit_label, usage_unit_label, usage_units_per_stock_unit, supplier_name, supplier_sku,
-- supplier_contact, reorder_notes, preferred_reorder_quantity, is_on_reorder_list,
-- do_not_reorder, do_not_reuse, reuse_status, reservation_notes, last_reorder_requested_at,
-- last_counted_at, is_active, last_seen_at, created_at, updated_at.

-- Inventory sync correction, 2026-05-14:
-- Existing Tools/Supplies records are considered in stock once imported.
-- Build 125 applies this safely through /api/admin/site-item-inventory sync and runtime migrations
-- instead of relying on an UPDATE that can fail on older partial schemas.


-- Current pass, 2026-05-14: schema migration ledger for D1 SQL change tracking.
CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','skipped','failed','pending_review')),
  destructive INTEGER NOT NULL DEFAULT 0,
  applied_by_user_id INTEGER,
  applied_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_status ON schema_migration_ledger(status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_file ON schema_migration_ledger(file_name);

-- Record this pass as pending review unless the admin records it as applied from /admin/operations/.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build124',
  'database_upgrade_current_pass.sql',
  'pending_review',
  1,
  'Created by build 124. Mark as applied after this SQL is run in D1.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Current pass, 2026-05-14: saved statement-import provider profiles.
CREATE TABLE IF NOT EXISTS accounting_statement_provider_profiles (
  accounting_statement_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_scope TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  date_column TEXT,
  description_column TEXT,
  gross_column TEXT,
  fee_column TEXT,
  net_column TEXT,
  currency_column TEXT,
  reference_column TEXT,
  default_currency TEXT NOT NULL DEFAULT 'CAD',
  mapping_json TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_provider_profiles_active ON accounting_statement_provider_profiles(is_active, provider_scope);

-- Build 125 current pass: runtime-safe APIs now create/backfill these schema pieces when missing.
CREATE TABLE IF NOT EXISTS site_item_inventory_cost_history (
  site_item_inventory_cost_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER,
  source_type TEXT,
  external_key TEXT,
  item_name TEXT,
  previous_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  new_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  source_kind TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  source_reference TEXT,
  reason_note TEXT,
  changed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_item ON site_item_inventory_cost_history(site_item_inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_source ON site_item_inventory_cost_history(source_kind, source_id);
-- The reconciliation queue index is created by the runtime API after confirming columns exist.

-- Note: the Build 125 Functions add missing columns safely after checking PRAGMA table_info:
-- amazon_purchase_import_staging.applied_inventory_id / applied_cost_history_id / applied_at / reviewed_by_user_id
-- accounting_reconciliation_exceptions.assigned_to_user_id / accountant_review_flag / resolved_by_user_id / resolved_at / reopened_by_user_id / reopened_at
-- accounting_journal_entries.posted_by_user_id / posted_at / validation_message



-- Build 125 migration ledger marker.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build125',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 125. Adds Amazon purchase review/apply workflow, inventory cost history, reconciliation queue fields, journal validation/posting metadata, and local-intent SEO pages. Mark as applied after this SQL and the deployed Functions have been verified.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 126 current pass: runtime incident review workflow.
-- The runtime endpoint safely adds review_status/admin_note/reviewed_by_user_id/reviewed_at after PRAGMA table_info checks, then creates indexes once columns exist.
-- Do not place unconditional ALTER TABLE ADD COLUMN here because D1/SQLite has no portable ADD COLUMN IF NOT EXISTS.

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build126',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 126. Adds a visible Operations runtime-incident review panel, grouped incident endpoint responses, review status fields, and release-sanity filtering so resolved/ignored incidents do not keep warning forever.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 127 current pass: public products API schema-drift compatibility hotfix.
-- No destructive schema change is required. The endpoint now inspects optional products/tax/SEO columns before referencing them.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build127',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 127. Code-only compatibility fix for /api/products runtime incidents. The public products endpoint now avoids hard references to optional D1 columns such as tax_classes.rate_percent and uses a schema-adaptive fallback.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 128 current pass: public products/product-detail verified-column compatibility hotfix.
-- No destructive schema change is required. Code now verifies optional columns with direct SELECT column FROM table LIMIT 0 checks before referencing them.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build128',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 128. Code-only compatibility fix for /api/products and /api/product-detail after live D1 still rejected p.merchandise_origin. Endpoints now verify optional columns with direct no-row SELECT checks and use safe defaults on older product schemas.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 129 operations/import guardrails, 2026-05-15:
-- Adds private Amazon import batch tracking and keeps runtime incident cleanup reviewable.
CREATE TABLE IF NOT EXISTS amazon_purchase_import_batches (
  amazon_purchase_import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_id TEXT NOT NULL UNIQUE,
  source_file TEXT,
  imported_row_count INTEGER NOT NULL DEFAULT 0,
  skipped_row_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Runtime-safe staging backfills used by the admin Amazon CSV import/review flow.
-- The admin import/review Functions add missing columns after PRAGMA checks.
-- Do not place unconditional ALTER TABLE ADD COLUMN here because D1/SQLite has no portable ADD COLUMN IF NOT EXISTS.
-- Columns expected by Build 129 include amazon_url, applied_inventory_id, applied_cost_history_id, applied_at, reviewed_by_user_id, and updated_at.
CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_batches_batch
  ON amazon_purchase_import_batches(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_batch_129
  ON amazon_purchase_import_staging(import_batch_id);

-- Build 129 migration ledger marker.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build129',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 129. Adds D1 schema drift reporting, public API health checks, private Amazon CSV staging import, Amazon match confidence explanations, and runtime incident cleanup for old resolved/ignored rows.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 130 current pass: /api/products all-tiers compatibility hotfix, 2026-05-15.
-- No destructive schema change is required. This is a code-only storefront resilience pass.
-- The products endpoint now uses strict metadata/sample-row columns, does not add candidate
-- optional fields to SQL column sets, and falls through to SELECT * + JavaScript filtering
-- before logging a runtime incident.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build130',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 130. Code-only hotfix for recurring /api/products products_primary_query_failed and products_fallback_query_failed incidents. The endpoint now uses strict actual D1 columns and a SELECT-star final fallback before logging incidents.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 131 current pass: storefront schema repair and API health guardrails, 2026-05-15.
-- The /api/admin/storefront-schema-repair endpoint safely checks live D1 before adding missing
-- product/tax/product_seo compatibility columns. D1/SQLite cannot use portable ADD COLUMN IF NOT EXISTS,
-- so the runtime admin repair applies these non-destructive updates after PRAGMA checks instead of
-- placing unconditional ALTER TABLE statements here.
-- Full fresh schemas now include tax_classes.rate_percent and storefront indexes used by the repair flow.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build131',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 131. Adds admin Storefront Schema Repair, expanded Public API Health, release-sanity storefront repair readiness, and non-destructive D1 compatibility guardrails for products, tax_classes, and product_seo.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 132 current pass: compact expandable mobile navigation and phone layout hardening, 2026-05-16.
-- No D1 schema change is required. This marker records the code/CSS/docs pass in the migration ledger.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build132',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 132. Code-only pass that replaces the mobile main-menu long list with grouped expandable sections, hardens mobile nav CSS/focus behavior, keeps one-H1/local SEO checks, and expands local predeploy sanity to verify mobile navigation assets.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 133 current pass: structured-data health, live sitemap preview, and safe storefront value backfill, 2026-05-16.
-- These tables prepare for manual Search Console CSV imports. They do not require Google API credentials.
CREATE TABLE IF NOT EXISTS search_console_import_batches (
  search_console_import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_key TEXT NOT NULL UNIQUE,
  source_file TEXT,
  site_property TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_by_user_id INTEGER,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS search_console_page_queries (
  search_console_page_query_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_key TEXT,
  report_date TEXT,
  page_url TEXT NOT NULL,
  query_text TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  country TEXT,
  device TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_page
  ON search_console_page_queries(page_url, report_date);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_query
  ON search_console_page_queries(query_text, report_date);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_batch
  ON search_console_page_queries(import_batch_key);

-- Runtime-safe product value backfill is performed by /api/admin/storefront-value-backfill after it checks live columns.
-- D1/SQLite has no portable ALTER TABLE ADD COLUMN IF NOT EXISTS, so value backfills stay in the admin endpoint.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build133',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 133. Adds admin Structured Data Health, Live Sitemap Preview, safe Storefront Value Backfill, Release Sanity coverage, and Search Console CSV staging tables for future SEO performance imports.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 134 current pass: draft-first product editor, JSON-safe create-product errors, and inline image upload, 2026-05-17.
-- No structural D1 schema change is required. /api/admin/create-product now adapts to the live products/product_images/product_seo columns and returns JSON on failures.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build134',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 134. Code/admin UX pass: product editor draft mode now requires only product name/type, SEO/images/external links are publish-readiness items, inline media upload fills product image URL fields, and create-product failures return JSON with runtime incident logging instead of HTML 500 pages.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 135 current pass: media/R2 diagnostics, product image health, image library reuse, and draft checklist, 2026-05-17.
-- No destructive structural change is required. The new admin diagnostics use the existing media_assets,
-- product_images, and products tables and the existing R2 media bucket binding. Product editor updates are
-- code/CSS/admin UX changes with adaptive create/update endpoints.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build135',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 135. Adds Media/R2 Diagnostics, Product Image Health, product-editor draft checklist, reusable image library picker, edit-mode image upload attachment, update-product handmade/vintage fields, and Release Sanity checks for media/image health.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 136 current pass: Search Console CSV import UI, SEO opportunity review, and release-sanity coverage, 2026-05-18.
-- The Search Console tables were introduced in Build 133. This pass adds the admin import/review workflow
-- and repeats the safe table/index definitions so older D1 databases can self-heal when the current pass is applied.
CREATE TABLE IF NOT EXISTS search_console_import_batches (
  search_console_import_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_key TEXT NOT NULL UNIQUE,
  source_file TEXT,
  site_property TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_by_user_id INTEGER,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS search_console_page_queries (
  search_console_page_query_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_batch_key TEXT,
  report_date TEXT,
  page_url TEXT NOT NULL,
  query_text TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  country TEXT,
  device TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_page
  ON search_console_page_queries(page_url, report_date);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_query
  ON search_console_page_queries(query_text, report_date);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_batch
  ON search_console_page_queries(import_batch_key);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build136',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 136. Adds Operations > Search Console CSV Import, admin endpoint /api/admin/search-console-import, SEO opportunity summaries, mobile-safe import UI, and Release Sanity coverage for the Search Console staging workflow.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 137 current pass: Search Console filtering, safe batch revert, and private SEO action list, 2026-05-18.
CREATE TABLE IF NOT EXISTS seo_opportunity_actions (
  seo_opportunity_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_key TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'search_console',
  page_url TEXT NOT NULL,
  query_text TEXT,
  priority_score INTEGER NOT NULL DEFAULT 0,
  suggested_title TEXT,
  suggested_meta_description TEXT,
  suggested_internal_link_note TEXT,
  action_status TEXT NOT NULL DEFAULT 'open',
  created_from_batch_key TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_search_console_page_queries_filters
  ON search_console_page_queries(report_date, country, device, impressions, average_position);
CREATE INDEX IF NOT EXISTS idx_seo_opportunity_actions_status
  ON seo_opportunity_actions(action_status, priority_score);
CREATE INDEX IF NOT EXISTS idx_seo_opportunity_actions_page
  ON seo_opportunity_actions(page_url);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build137',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 137. Adds Search Console filters, delete/revert batch workflow, and private seo_opportunity_actions table for reviewable title/meta/internal-link tasks generated from imported Search Console opportunities.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 138 - Social posting queue for job/process photos and summaries.
CREATE TABLE IF NOT EXISTS social_platform_connections (
  social_platform_connection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  profile_url TEXT,
  connection_status TEXT NOT NULL DEFAULT 'manual_ready',
  api_ready INTEGER NOT NULL DEFAULT 0,
  requires_oauth INTEGER NOT NULL DEFAULT 1,
  required_scopes TEXT,
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_post_queue (
  social_post_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_key TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'job_update',
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  caption TEXT,
  hashtags TEXT,
  target_platforms_json TEXT NOT NULL DEFAULT '[]',
  image_urls_json TEXT NOT NULL DEFAULT '[]',
  video_url TEXT,
  link_url TEXT,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  post_status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TEXT,
  published_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  last_publish_attempt_at TEXT,
  api_publish_mode TEXT DEFAULT 'review_first',
  platform_caption_overrides_json TEXT DEFAULT '{}',
  media_quality_warnings_json TEXT DEFAULT '[]',
  duplicate_signature TEXT,
  do_not_repost INTEGER DEFAULT 0,
  schedule_timezone TEXT,
  dry_run_payload_json TEXT DEFAULT '{}',
  last_dry_run_at TEXT
);

CREATE TABLE IF NOT EXISTS social_post_attempts (
  social_post_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_queue_id INTEGER NOT NULL,
  platform_key TEXT NOT NULL,
  attempt_status TEXT NOT NULL DEFAULT 'manual_ready',
  external_post_url TEXT,
  external_post_id TEXT,
  platform_response_id TEXT,
  published_url TEXT,
  request_mode TEXT,
  http_status INTEGER,
  response_json TEXT,
  attempted_by_user_id INTEGER,
  attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (social_post_queue_id) REFERENCES social_post_queue(social_post_queue_id)
);

CREATE INDEX IF NOT EXISTS idx_social_post_queue_status ON social_post_queue(post_status, approval_status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_post_queue_source ON social_post_queue(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_social_post_queue_duplicate ON social_post_queue(duplicate_signature, do_not_repost);
CREATE INDEX IF NOT EXISTS idx_social_post_attempts_queue ON social_post_attempts(social_post_queue_id, platform_key);

INSERT INTO social_platform_connections (platform_key, display_name, connection_status, api_ready, requires_oauth, required_scopes, notes, updated_at) VALUES
('facebook','Facebook Page','manual_ready',0,1,'pages_manage_posts,pages_read_engagement,pages_show_list','Manual-ready now. API posting later requires Meta Page permissions and app review where applicable.',CURRENT_TIMESTAMP),
('instagram','Instagram Business/Creator','manual_ready',0,1,'instagram_business_content_publish,pages_show_list','Manual-ready now. API publishing later requires Instagram professional account + Meta Content Publishing API flow.',CURRENT_TIMESTAMP),
('tiktok','TikTok','manual_ready',0,1,'video.upload,video.publish','Manual-ready now. API posting later requires TikTok developer app approval and verified media URL/domain rules.',CURRENT_TIMESTAMP),
('x','X','manual_ready',0,1,'tweet.write,users.read,offline.access','Manual-ready now. API posting later requires X API access and OAuth tokens.',CURRENT_TIMESTAMP),
('youtube','YouTube Shorts/Community','manual_ready',0,1,'youtube.upload,youtube.force-ssl','Manual-ready now. API upload/posting later requires Google OAuth/app setup.',CURRENT_TIMESTAMP),
('pinterest','Pinterest','manual_ready',0,1,'pins:write,boards:read','Manual-ready now. Good fit for finished goods and workshop inspiration boards after OAuth setup.',CURRENT_TIMESTAMP)
ON CONFLICT(platform_key) DO UPDATE SET
  display_name = excluded.display_name,
  required_scopes = excluded.required_scopes,
  updated_at = CURRENT_TIMESTAMP;

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build138',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 138. Adds review-first social post queue and platform readiness for job/process photo summaries.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 139 - Social API publishing attempts for approved crafting/job process posts.
-- Existing D1 installs are self-healed by /api/admin/social-post-queue before publishing because SQLite/D1
-- cannot safely run ALTER TABLE ADD COLUMN repeatedly without a migration guard.
-- Latest schema columns added to the reference CREATE TABLE definitions above:
--   social_post_queue.last_publish_attempt_at
--   social_post_queue.api_publish_mode
--   social_post_attempts.platform_response_id
--   social_post_attempts.published_url
--   social_post_attempts.request_mode
--   social_post_attempts.http_status

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build139',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 139. Adds approved-post API publishing attempts for Facebook, Instagram, X, and Pinterest when credentials are configured in Cloudflare environment variables; TikTok and YouTube remain manual/review-first until upload flows are configured.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 140 - Social scheduling, dry-run previews, caption variants, and duplicate/repost guardrails.
-- Existing installs are self-healed by /api/admin/social-post-queue before use. Reference columns now include:
--   social_post_queue.platform_caption_overrides_json
--   social_post_queue.media_quality_warnings_json
--   social_post_queue.duplicate_signature
--   social_post_queue.do_not_repost
--   social_post_queue.schedule_timezone
--   social_post_queue.dry_run_payload_json
--   social_post_queue.last_dry_run_at

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build140',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 140. Adds social queue scheduling, dry-run platform payload previews, caption variants, duplicate/repost warnings, and media-quality guardrails for crafting-process posts.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
