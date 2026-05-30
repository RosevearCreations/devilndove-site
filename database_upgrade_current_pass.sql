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
  notes TEXT,
  applied_override_id INTEGER,
  applied_at TEXT
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
  last_dry_run_at TEXT,
  caption_template_key TEXT,
  content_pillar TEXT,
  call_to_action TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_url TEXT
);

CREATE TABLE IF NOT EXISTS social_caption_templates (
  social_caption_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  content_pillar TEXT,
  default_platforms_json TEXT NOT NULL DEFAULT '[]',
  default_hashtags TEXT,
  body_template TEXT NOT NULL,
  call_to_action TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_caption_templates_active ON social_caption_templates(is_active, content_pillar);

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


-- Build 141 - Social content calendar, reusable caption templates, and UTM-tagged social links.
-- Existing installs are self-healed by /api/admin/social-post-queue before use. Reference columns now include:
--   social_post_queue.caption_template_key
--   social_post_queue.content_pillar
--   social_post_queue.call_to_action
--   social_post_queue.utm_source
--   social_post_queue.utm_medium
--   social_post_queue.utm_campaign
--   social_post_queue.utm_url
--   social_caption_templates

CREATE TABLE IF NOT EXISTS social_caption_templates (
  social_caption_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  content_pillar TEXT,
  default_platforms_json TEXT NOT NULL DEFAULT '[]',
  default_hashtags TEXT,
  body_template TEXT NOT NULL,
  call_to_action TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_caption_templates_active ON social_caption_templates(is_active, content_pillar);

INSERT INTO social_caption_templates (template_key, display_name, content_pillar, default_platforms_json, default_hashtags, body_template, call_to_action, is_active, notes, updated_at) VALUES
('making_story','Making story / in progress','behind_the_scenes','["facebook","instagram","tiktok","x"]','#DevilnDove #HandmadeOntario #WorkshopMade #SmallBusinessCanada','{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}','Follow along as we turn shop experiments into one-of-a-kind pieces.',1,'Use while a crafting job or workshop experiment is in progress.',CURRENT_TIMESTAMP),
('finished_product','Finished product / shop-ready','finished_goods','["facebook","instagram","pinterest","x"]','#DevilnDove #HandmadeGifts #OntarioMaker #ShopSmallCanada','{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}','See the finished piece, details, and availability here:',1,'Use for product launches, gallery items, vintage finds, and ready-to-sell pieces.',CURRENT_TIMESTAMP),
('shop_oops','Funny shop moment / oops','human_story','["facebook","instagram","tiktok","x"]','#DevilnDove #MakerLife #WorkshopOops #CreativeProcess','{title}\n\n{summary}\n\n{cta}\n\n{hashtags}','We are calling this one “learning with character.”',1,'Use for light, human, therapy-workshop moments that should not sound too polished.',CURRENT_TIMESTAMP),
('local_market','Local Ontario update / event','local_presence','["facebook","instagram","x"]','#DevilnDove #SouthernOntario #TillsonburgOntario #OntarioSmallBusiness','{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}','Local friends can message us with questions or pickup ideas.',1,'Use when relevance to Southern Ontario/Tillsonburg/local shoppers matters.',CURRENT_TIMESTAMP),
('laser_engraving','Laser engraving / personalized gift','custom_work','["facebook","instagram","pinterest","x"]','#DevilnDove #LaserEngravingOntario #CustomGiftsOntario #WorkshopMade','{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}','Ask us about making something similar with your own wording or idea.',1,'Use for engraving jobs, custom gift ideas, and personalized workshop updates.',CURRENT_TIMESTAMP),
('vintage_find','Vintage find / collected item','vintage_collectibles','["facebook","instagram","pinterest","x"]','#DevilnDove #VintageFindsOntario #CollectiblesCanada #ShopSmallCanada','{title}\n\n{summary}\n\n{cta}\n\n{link}\n\n{hashtags}','Condition, story, and availability details are listed here:',1,'Use for sourced vintage/collectible/antiquity items.',CURRENT_TIMESTAMP)
ON CONFLICT(template_key) DO UPDATE SET
  display_name = excluded.display_name,
  content_pillar = excluded.content_pillar,
  default_platforms_json = excluded.default_platforms_json,
  default_hashtags = excluded.default_hashtags,
  body_template = excluded.body_template,
  call_to_action = excluded.call_to_action,
  is_active = 1,
  notes = excluded.notes,
  updated_at = CURRENT_TIMESTAMP;

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build141',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 141. Adds reusable social caption templates, a social content calendar summary, content-pillar fields, and UTM-tagged social links for review-first crafting-process posts.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 142 competitive roadmap tracker
CREATE TABLE IF NOT EXISTS competitive_opportunities (
  competitive_opportunity_id INTEGER PRIMARY KEY AUTOINCREMENT,
  opportunity_key TEXT NOT NULL UNIQUE,
  area TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority_score INTEGER DEFAULT 50,
  impact_level TEXT DEFAULT 'medium',
  effort_level TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  owner_note TEXT,
  source_note TEXT,
  suggested_next_step TEXT,
  last_reviewed_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_competitive_opportunities_status ON competitive_opportunities(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_competitive_opportunities_area ON competitive_opportunities(area, priority_score DESC);

CREATE TABLE IF NOT EXISTS competitive_opportunity_events (
  competitive_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  competitive_opportunity_id INTEGER,
  event_type TEXT,
  old_status TEXT,
  new_status TEXT,
  note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);


INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_142_competitive_roadmap',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 142 adds competitive roadmap D1 tracker and completed COMPETITIVE.md direction.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 143 - Social media privacy guard before API/social publishing.
CREATE TABLE IF NOT EXISTS social_media_privacy_rules (
  social_media_privacy_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  applies_to TEXT,
  default_blocked INTEGER NOT NULL DEFAULT 1,
  public_post_allowed INTEGER NOT NULL DEFAULT 0,
  consent_status TEXT NOT NULL DEFAULT 'requires_review',
  checklist TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_media_privacy_rules_active ON social_media_privacy_rules(is_active, default_blocked);

CREATE TABLE IF NOT EXISTS social_post_privacy_reviews (
  social_post_privacy_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  social_post_queue_id INTEGER NOT NULL,
  privacy_status TEXT NOT NULL DEFAULT 'needs_review',
  customer_media_present INTEGER NOT NULL DEFAULT 0,
  media_consent_required INTEGER NOT NULL DEFAULT 1,
  approved_for_public_post INTEGER NOT NULL DEFAULT 0,
  reviewer_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_post_privacy_reviews_queue ON social_post_privacy_reviews(social_post_queue_id, privacy_status);

INSERT OR IGNORE INTO social_media_privacy_rules (rule_key, display_name, applies_to, default_blocked, public_post_allowed, consent_status, checklist, notes, is_active, updated_at) VALUES
('customer_faces_or_names','Customer faces, names, plates, addresses, or private identifiers','customer_or_job_media',1,0,'requires_explicit_consent','Do not post until the customer has clearly approved the exact photo/video/caption or identifiers are removed.','Blocks accidental sharing of customer/private details.',1,CURRENT_TIMESTAMP),
('workshop_background_private_info','Workshop background with receipts, screens, labels, or private paperwork','workshop_process_media',1,0,'requires_review','Check the image background for addresses, order IDs, customer notes, screens, payment info, or private documents.','Useful for bench/process shots where background clutter can leak private information.',1,CURRENT_TIMESTAMP),
('finished_product_only','Finished product only — no private/customer details visible','product_media',0,1,'safe_when_reviewed','Confirm the photo only shows the product, packaging, tools, or shop-safe background.','Safe default for product and gallery posts after visual review.',1,CURRENT_TIMESTAMP),
('therapy_or_health_context','Personal therapy/health context mentioned in caption','caption_copy',0,1,'review_wording','Keep wording human and honest without sharing more personal health detail than intended.','Allows process storytelling while avoiding oversharing.',1,CURRENT_TIMESTAMP),
('kids_or_visitors_visible','Children, visitors, or bystanders visible','people_in_media',1,0,'requires_explicit_consent','Do not post unless each visible person has consented, and avoid posting children without explicit guardian approval.','High-safety rule for public social sharing.',1,CURRENT_TIMESTAMP)
ON CONFLICT(rule_key) DO UPDATE SET
  display_name = excluded.display_name,
  applies_to = excluded.applies_to,
  default_blocked = excluded.default_blocked,
  public_post_allowed = excluded.public_post_allowed,
  consent_status = excluded.consent_status,
  checklist = excluded.checklist,
  notes = excluded.notes,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

-- Existing social_post_queue installs are self-healed by /api/admin/social-post-queue and /api/admin/social-media-privacy-guard:
--   privacy_status, privacy_notes, media_consent_required, customer_media_present, approved_for_public_post.


INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build143',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 143. Adds Social Media Privacy Guard tables/rules and blocks API publishing until queue media privacy is approved or marked product-only/safe.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 144: public product-story notes and product/social competitive execution.
CREATE TABLE IF NOT EXISTS product_story_public_notes (
  product_story_public_note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  story_heading TEXT,
  story_summary TEXT,
  story_body TEXT,
  process_notes TEXT,
  care_notes TEXT,
  local_pickup_note TEXT,
  display_status TEXT NOT NULL DEFAULT 'draft',
  story_source TEXT,
  privacy_status TEXT DEFAULT 'needs_review',
  review_notes TEXT,
  internal_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
CREATE INDEX IF NOT EXISTS idx_product_story_public_notes_product ON product_story_public_notes(product_id, display_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_product_story_public_notes_status ON product_story_public_notes(display_status, privacy_status, updated_at);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_144_product_story_local_trust_social_shortcut',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 144 adds product story note schema, reusable local trust assets, and product-to-social queue workflow notes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 146: product story editor, mobile-create JSON fix, and product capture readiness.
-- Optional story columns are included in the reference schema and are also added safely by the admin API when needed.
CREATE INDEX IF NOT EXISTS idx_product_story_public_notes_status ON product_story_public_notes(display_status, privacy_status, updated_at);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_146_product_story_editor_mobile_create_fix',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 146 adds admin product-story editing support, optional story review columns, product draft autosave/multi-image continuity, and mobile-create normalizeColorNames fallback fix.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 147: media consent registry for product/social media privacy checks.
CREATE TABLE IF NOT EXISTS media_consent_records (
  consent_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_key TEXT NOT NULL UNIQUE,
  subject_label TEXT,
  source_type TEXT DEFAULT 'general',
  source_id TEXT,
  media_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'unknown',
  consent_scope TEXT NOT NULL DEFAULT 'internal_only',
  public_use_allowed INTEGER NOT NULL DEFAULT 0,
  social_use_allowed INTEGER NOT NULL DEFAULT 0,
  privacy_notes TEXT,
  reviewed_by_user_id INTEGER,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_consent_records_status ON media_consent_records(consent_status, consent_scope, updated_at);
CREATE INDEX IF NOT EXISTS idx_media_consent_records_source ON media_consent_records(source_type, source_id, updated_at);


INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_147_story_snippets_image_roles_media_consent',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 147 adds public shop story snippets, Product editor duplicate-image/role/social helpers, and media consent records for public/social photo approval.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 148: product image role reference, drag/drop ordering support, and consent-linked public-use tracking.
-- Existing product_image_annotations installs are self-healed by /api/admin/product-images with:
--   image_role, public_use_status, consent_record_id, role_review_notes.
CREATE TABLE IF NOT EXISTS product_image_role_reference (
  image_role_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  storefront_hint TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO product_image_role_reference (image_role_key, display_name, sort_order, storefront_hint, is_active, updated_at) VALUES
('hero_front','Hero/front',0,'Primary product image for shop cards and product detail hero.',1,CURRENT_TIMESTAMP),
('detail_texture','Detail/texture',1,'Close-up texture, finish, material, maker detail, or engraving proof.',1,CURRENT_TIMESTAMP),
('scale_context','Scale/context',2,'Scale reference, hand/display/context image, or practical sizing view.',1,CURRENT_TIMESTAMP),
('back_side','Back/side',3,'Back, clasp, edge, underside, side profile, or condition detail.',1,CURRENT_TIMESTAMP),
('process_story','Process/story',4,'Bench/process image that supports the maker story after privacy review.',1,CURRENT_TIMESTAMP),
('packaging_pickup','Packaging/pickup',5,'Packaging, pickup, gift-ready, or delivery context.',1,CURRENT_TIMESTAMP),
('material_tool_proof','Material/tool proof',6,'Material, supply, tool, or making-proof image for transparency.',1,CURRENT_TIMESTAMP),
('gallery_support','Gallery/support',7,'Extra supporting image that does not fit a specific required role.',1,CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_148_image_order_roles_consent_search',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 148 adds drag/drop product image ordering, persisted image roles/public-use status, consent-record linking in media workflow, and story snippet search improvements. Existing annotation columns are self-healed by the product-images admin API.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 146: custom request intake + social caption template editing + media consent publish gates.
CREATE TABLE IF NOT EXISTS custom_requests (
  custom_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL,
  product_interest TEXT,
  deadline_date TEXT,
  budget_cents INTEGER,
  message TEXT NOT NULL,
  attachment_urls_json TEXT DEFAULT '[]',
  consent_to_contact INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email, created_at);

CREATE TABLE IF NOT EXISTS social_caption_templates (
  social_caption_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  content_pillar TEXT,
  default_platforms_json TEXT NOT NULL DEFAULT '[]',
  default_hashtags TEXT,
  body_template TEXT NOT NULL,
  call_to_action TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_caption_templates_active ON social_caption_templates(is_active, content_pillar);

-- Build 150: reviewed trust blocks, Search Console SEO override apply loop, and accounting close workflow.
CREATE TABLE IF NOT EXISTS trust_block_items (
  trust_block_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_review_id INTEGER,
  item_kind TEXT NOT NULL DEFAULT 'testimonial',
  display_context TEXT NOT NULL DEFAULT 'sitewide',
  title TEXT,
  body TEXT NOT NULL,
  attribution_label TEXT,
  rating_label TEXT,
  related_product_id INTEGER,
  related_product_slug TEXT,
  related_product_name TEXT,
  locality_label TEXT,
  block_status TEXT NOT NULL DEFAULT 'draft',
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 0,
  privacy_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewer_notes TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trust_block_items_public ON trust_block_items(block_status, is_public, display_context, sort_order);
CREATE INDEX IF NOT EXISTS idx_trust_block_items_product ON trust_block_items(related_product_id, related_product_slug);

CREATE TABLE IF NOT EXISTS seo_page_overrides (
  seo_page_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  source_action_id INTEGER,
  source_query_text TEXT,
  override_status TEXT NOT NULL DEFAULT 'draft',
  title_override TEXT,
  meta_description_override TEXT,
  internal_link_note TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_seo_page_overrides_status ON seo_page_overrides(override_status, page_path);

CREATE TABLE IF NOT EXISTS accounting_payment_applications (
  accounting_payment_application_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER,
  order_id INTEGER,
  period_month TEXT NOT NULL,
  application_status TEXT NOT NULL DEFAULT 'draft',
  applied_amount_cents INTEGER NOT NULL DEFAULT 0,
  fee_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_component_cents INTEGER NOT NULL DEFAULT 0,
  provider TEXT,
  transaction_reference TEXT,
  application_notes TEXT,
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_payment_applications_period ON accounting_payment_applications(period_month, application_status);

CREATE TABLE IF NOT EXISTS accounting_hst_gst_reviews (
  accounting_hst_gst_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL UNIQUE,
  review_status TEXT NOT NULL DEFAULT 'draft',
  sales_tax_collected_cents INTEGER NOT NULL DEFAULT 0,
  input_tax_credit_cents INTEGER NOT NULL DEFAULT 0,
  net_tax_payable_cents INTEGER NOT NULL DEFAULT 0,
  filing_reference TEXT,
  filing_due_date TEXT,
  remittance_status TEXT NOT NULL DEFAULT 'not_ready',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_hst_gst_reviews_period ON accounting_hst_gst_reviews(period_month, review_status);

CREATE TABLE IF NOT EXISTS accountant_export_packages (
  accountant_export_package_id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_key TEXT NOT NULL UNIQUE,
  period_month TEXT,
  tax_year TEXT,
  package_status TEXT NOT NULL DEFAULT 'draft',
  manifest_json TEXT,
  created_by_user_id INTEGER,
  finalized_by_user_id INTEGER,
  finalized_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_accountant_export_packages_period ON accountant_export_packages(period_month, tax_year, package_status);

-- Build 150 compatibility note: existing Build 137 seo_opportunity_actions tables need
-- applied_override_id INTEGER and applied_at TEXT. The admin Search Console endpoint
-- self-heals those columns safely at runtime, avoiding duplicate-column migration failures.

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_150_trust_seo_close_workflow',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 150 adds approved trust blocks, reviewed SEO override application from Search Console actions, payment application, HST/GST review, month-end close readiness, and accountant export manifest packaging.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


-- Build 151: custom request conversion drafts, UTM attribution joins, and accountant close CSV/evidence fields.
CREATE TABLE IF NOT EXISTS custom_request_quote_drafts (
  custom_request_quote_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  quote_key TEXT NOT NULL UNIQUE,
  quote_status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  request_type TEXT,
  requested_deadline TEXT,
  estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
  scope_notes TEXT,
  quote_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_drafts_status ON custom_request_quote_drafts(quote_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_job_drafts (
  custom_request_job_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  job_key TEXT NOT NULL UNIQUE,
  job_status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  source_quote_draft_id INTEGER,
  customer_name TEXT,
  customer_email TEXT,
  work_type TEXT,
  target_due_date TEXT,
  estimated_budget_cents INTEGER NOT NULL DEFAULT 0,
  work_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_job_drafts_status ON custom_request_job_drafts(job_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_product_drafts (
  custom_request_product_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  product_draft_key TEXT NOT NULL UNIQUE,
  product_draft_status TEXT NOT NULL DEFAULT 'draft',
  suggested_product_name TEXT NOT NULL,
  product_category TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  story_seed TEXT,
  seo_seed_title TEXT,
  seo_seed_description TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_product_drafts_status ON custom_request_product_drafts(product_draft_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_conversion_events (
  custom_request_conversion_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  conversion_type TEXT NOT NULL,
  target_key TEXT,
  target_table TEXT,
  target_id INTEGER,
  event_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_request_conversion_events_request ON custom_request_conversion_events(custom_request_id, created_at);

-- Runtime APIs self-heal these attribution/support columns when older D1 installs are missing them.
-- custom_requests: utm_source, utm_medium, utm_campaign, utm_content, utm_term, visitor_token, browser_session_token
-- site_visitor_sessions/site_page_views: utm_source, utm_medium, utm_campaign, utm_content, utm_term
-- accounting_hst_gst_reviews: remittance_evidence_url, reminder_date

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_151_custom_request_conversion_utm_close_export',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 151 mounts Custom Requests in Operations, adds quote/job/product draft conversion tables, captures UTM attribution for requests and visitor analytics, joins social UTM rollups to traffic/custom-request conversions, and adds accountant close CSV/remittance evidence support.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =========================================================
-- BUILD 152 — CUSTOM REQUEST REPLY/PAYMENT CANDIDATES + HST REMINDER QUEUE
-- =========================================================

CREATE TABLE IF NOT EXISTS custom_request_reply_templates (
  custom_request_reply_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  template_key TEXT NOT NULL UNIQUE,
  template_status TEXT NOT NULL DEFAULT 'draft',
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  copied_at TEXT,
  sent_manually_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_reply_templates_request ON custom_request_reply_templates(custom_request_id, template_status, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_reply_templates_unique_email ON custom_request_reply_templates(custom_request_id, channel);

CREATE TABLE IF NOT EXISTS custom_request_payment_candidates (
  custom_request_payment_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_type TEXT NOT NULL DEFAULT 'deposit',
  candidate_status TEXT NOT NULL DEFAULT 'draft',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  due_date TEXT,
  description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_candidates_request ON custom_request_payment_candidates(custom_request_id, candidate_type, candidate_status);

CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  related_order_id INTEGER,
  related_payment_id INTEGER,
  related_product_id INTEGER,
  payload_json TEXT,
  metadata_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind ON notification_outbox(notification_kind, destination, created_at);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_152_custom_request_reply_payment_candidates_hst_reminders',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 152 adds manual customer reply templates, deposit/invoice candidates for custom requests, and HST/GST reminder queue support through notification_outbox.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =========================================================
-- BUILD 153 — PRIVATE QUOTE PREVIEWS + CUSTOM REQUEST REFERENCE UPLOADS
-- =========================================================

CREATE TABLE IF NOT EXISTS custom_request_quote_share_links (
  custom_request_quote_share_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_token TEXT NOT NULL UNIQUE,
  share_status TEXT NOT NULL DEFAULT 'active',
  version_number INTEGER NOT NULL DEFAULT 1,
  supersedes_share_link_id INTEGER,
  resent_at TEXT,
  resend_note TEXT,
  customer_name TEXT,
  customer_email TEXT,
  title TEXT,
  quote_total_cents INTEGER NOT NULL DEFAULT 0,
  scope_summary TEXT,
  payment_summary_json TEXT DEFAULT '{}',
  expires_at TEXT,
  accepted_at TEXT,
  declined_at TEXT,
  customer_response_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_request ON custom_request_quote_share_links(custom_request_id, share_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_quote_share_links_token ON custom_request_quote_share_links(share_token, share_status);

CREATE TABLE IF NOT EXISTS custom_request_reference_uploads (
  custom_request_reference_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  request_key TEXT NOT NULL,
  public_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  reference_use_status TEXT NOT NULL DEFAULT 'private_review_only',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_request_reference_uploads_request ON custom_request_reference_uploads(custom_request_id, created_at);

-- Runtime APIs self-heal these optional request upload columns on older D1 installs:
-- custom_requests.upload_token
-- custom_requests.reference_upload_count

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'build_153_custom_quote_preview_reference_uploads',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Build 153 adds private custom quote preview links, customer accept/decline tracking, and request-bound private-review reference image uploads for custom requests.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Build 154 custom quote, consent, SEO bake, gallery filter, and accountant export extension
ALTER TABLE custom_request_quote_drafts ADD COLUMN material_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN labor_cost_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN pickup_shipping_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN tax_estimate_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_drafts ADD COLUMN quote_total_cents INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS custom_request_quote_line_items (
  custom_request_quote_line_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER NOT NULL,
  line_type TEXT NOT NULL DEFAULT 'custom',
  line_label TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_amount_cents INTEGER NOT NULL DEFAULT 0,
  line_amount_cents INTEGER NOT NULL DEFAULT 0,
  is_taxable INTEGER NOT NULL DEFAULT 1,
  line_status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_line_items_quote ON custom_request_quote_line_items(quote_draft_id, line_status, sort_order);

CREATE TABLE IF NOT EXISTS custom_request_quote_revisions (
  custom_request_quote_revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  revision_type TEXT NOT NULL DEFAULT 'changed',
  revision_status TEXT NOT NULL DEFAULT 'open',
  revision_notes TEXT,
  snapshot_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_quote_revisions_request ON custom_request_quote_revisions(custom_request_id, created_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_request_drafts (
  custom_request_payment_request_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_link_id INTEGER,
  payment_request_key TEXT NOT NULL UNIQUE,
  payment_request_status TEXT NOT NULL DEFAULT 'review_needed',
  request_type TEXT NOT NULL DEFAULT 'deposit',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  customer_name TEXT,
  customer_email TEXT,
  due_date TEXT,
  review_notes TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  approved_payment_link_id INTEGER,
  approved_payment_link_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_request_drafts_request ON custom_request_payment_request_drafts(custom_request_id, payment_request_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_order_drafts (
  custom_request_order_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  share_link_id INTEGER,
  order_draft_key TEXT NOT NULL UNIQUE,
  order_draft_status TEXT NOT NULL DEFAULT 'review_needed',
  customer_name TEXT,
  customer_email TEXT,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  fulfillment_notes TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  order_id INTEGER,
  converted_by_user_id INTEGER,
  converted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (share_link_id) REFERENCES custom_request_quote_share_links(custom_request_quote_share_link_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_order_drafts_request ON custom_request_order_drafts(custom_request_id, order_draft_status, updated_at);

-- Reference uploads now also create media_consent_records rows with source_type='custom_request_reference_upload', consent_status='requested', and consent_scope='internal_only'.
-- Approved SEO can now be baked from data/site/seo-page-overrides.json using scripts/bake_approved_seo_overrides.py.
-- Accounting close workflow now supports format=zip for a CSV bundle plus evidence-index.csv and manifest.json.

-- Build 155 - approved custom request payment links, real order conversion, marketplace packs, and post-fulfillment prompts.
CREATE TABLE IF NOT EXISTS custom_request_payment_links (
  custom_request_payment_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_request_draft_id INTEGER,
  quote_draft_id INTEGER,
  payment_link_key TEXT NOT NULL UNIQUE,
  link_token TEXT NOT NULL UNIQUE,
  link_status TEXT NOT NULL DEFAULT 'active',
  link_url_path TEXT,
  request_type TEXT NOT NULL DEFAULT 'deposit',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  customer_name TEXT,
  customer_email TEXT,
  provider TEXT NOT NULL DEFAULT 'manual_review',
  provider_reference TEXT,
  approval_notes TEXT,
  customer_viewed_at TEXT,
  customer_ready_at TEXT,
  customer_note TEXT,
  viewed_at TEXT,
  ready_to_pay_at TEXT,
  customer_ready_note TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (payment_request_draft_id) REFERENCES custom_request_payment_request_drafts(custom_request_payment_request_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_links_request ON custom_request_payment_links(custom_request_id, link_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_payment_links_token ON custom_request_payment_links(link_token, link_status);

CREATE TABLE IF NOT EXISTS custom_request_marketplace_export_packs (
  custom_request_marketplace_export_pack_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  quote_draft_id INTEGER,
  product_draft_id INTEGER,
  export_key TEXT NOT NULL UNIQUE,
  export_status TEXT NOT NULL DEFAULT 'draft',
  etsy_title TEXT,
  etsy_description TEXT,
  etsy_tags TEXT,
  facebook_title TEXT,
  facebook_description TEXT,
  pinterest_title TEXT,
  pinterest_description TEXT,
  manual_listing_title TEXT,
  manual_listing_description TEXT,
  suggested_local_keywords TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (quote_draft_id) REFERENCES custom_request_quote_drafts(custom_request_quote_draft_id) ON DELETE SET NULL,
  FOREIGN KEY (product_draft_id) REFERENCES custom_request_product_drafts(custom_request_product_draft_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_marketplace_export_request ON custom_request_marketplace_export_packs(custom_request_id, export_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_fulfillment_prompts (
  custom_request_fulfillment_prompt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_status TEXT NOT NULL DEFAULT 'draft',
  customer_name TEXT,
  customer_email TEXT,
  review_prompt_text TEXT,
  photo_prompt_text TEXT,
  consent_prompt_text TEXT,
  created_by_user_id INTEGER,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_custom_fulfillment_prompts_request ON custom_request_fulfillment_prompts(custom_request_id, prompt_status, updated_at);

-- Build 156 custom request payment/order/marketplace/consent upgrade
-- Runtime functions use PRAGMA table_info guarded ALTER TABLE ADD COLUMN for existing tables.
-- Keep this reference block with the current pass so D1, docs, and app expectations stay aligned.
CREATE TABLE IF NOT EXISTS custom_request_payment_link_approval_gates (
  custom_request_payment_link_approval_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_request_draft_id INTEGER,
  order_draft_id INTEGER,
  order_id INTEGER,
  gate_status TEXT NOT NULL DEFAULT 'pending',
  gate_notes TEXT,
  gate_snapshot_json TEXT DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_gates_request ON custom_request_payment_link_approval_gates(custom_request_id, gate_status, checked_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_checkout_records (
  custom_request_payment_checkout_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  payment_link_id INTEGER,
  order_id INTEGER,
  payment_id INTEGER,
  provider TEXT NOT NULL DEFAULT 'manual',
  checkout_status TEXT NOT NULL DEFAULT 'prepared',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  redirect_url TEXT,
  mode TEXT,
  source_payload_json TEXT DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_checkout_records_request ON custom_request_payment_checkout_records(custom_request_id, provider, checkout_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_order_status_links (
  custom_request_order_status_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  order_status_token TEXT NOT NULL UNIQUE,
  link_status TEXT NOT NULL DEFAULT 'active',
  customer_email TEXT,
  customer_name TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_request ON custom_request_order_status_links(custom_request_id, link_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_token ON custom_request_order_status_links(order_status_token, link_status);

-- Existing table column expectations added by guarded runtime migrations in Build 156:
-- custom_request_payment_links: order_id, payment_id, external_share_status, gate_status, gate_checked_at, gate_notes, preferred_provider, checkout_redirect_url.
-- custom_request_marketplace_export_packs: csv_status, etsy_csv_row_json, facebook_csv_row_json, pinterest_csv_row_json.
-- custom_request_fulfillment_prompts: prompt_token, public_response_status, public_use_scope, review_text, customer_response_note, responded_at.

