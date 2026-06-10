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

-- Build 157 - custom commerce hardening, candle/soap specs, marketplace presets, and consent proof review
ALTER TABLE products ADD COLUMN scent_profile TEXT;
ALTER TABLE products ADD COLUMN wax_or_base TEXT;
ALTER TABLE products ADD COLUMN soap_base TEXT;
ALTER TABLE products ADD COLUMN colour_recipe TEXT;
ALTER TABLE products ADD COLUMN batch_number TEXT;
ALTER TABLE products ADD COLUMN ingredient_notes TEXT;
ALTER TABLE products ADD COLUMN allergen_safety_notes TEXT;
ALTER TABLE products ADD COLUMN cure_ready_date TEXT;

ALTER TABLE custom_requests ADD COLUMN upload_token TEXT;
ALTER TABLE custom_requests ADD COLUMN reference_upload_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_requests ADD COLUMN scent_profile TEXT;
ALTER TABLE custom_requests ADD COLUMN wax_or_base TEXT;
ALTER TABLE custom_requests ADD COLUMN colour_notes TEXT;
ALTER TABLE custom_requests ADD COLUMN batch_number TEXT;
ALTER TABLE custom_requests ADD COLUMN ingredient_notes TEXT;
ALTER TABLE custom_requests ADD COLUMN allergen_safety_notes TEXT;

ALTER TABLE custom_request_quote_share_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_quote_share_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_quote_share_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_quote_share_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_payment_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_payment_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_payment_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_order_status_links ADD COLUMN order_stage TEXT NOT NULL DEFAULT 'planning';
ALTER TABLE custom_request_order_status_links ADD COLUMN stage_notes TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN stage_updated_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_order_status_links ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_order_status_links ADD COLUMN lifecycle_note TEXT;

ALTER TABLE custom_request_marketplace_export_packs ADD COLUMN manual_csv_row_json TEXT DEFAULT '{}';
ALTER TABLE custom_request_marketplace_export_packs ADD COLUMN preset_summary_json TEXT DEFAULT '{}';

ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN voided_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN expired_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN resent_at TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN resend_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN lifecycle_note TEXT;
ALTER TABLE custom_request_fulfillment_prompts ADD COLUMN public_proof_candidate_id INTEGER;

CREATE TABLE IF NOT EXISTS marketplace_channel_presets (
  marketplace_channel_preset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  category_label TEXT,
  shipping_profile_label TEXT,
  default_tags_json TEXT DEFAULT '[]',
  default_fields_json TEXT DEFAULT '{}',
  preset_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_channel_presets_status ON marketplace_channel_presets(preset_status, channel);

CREATE TABLE IF NOT EXISTS custom_request_order_stage_events (
  custom_request_order_stage_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  order_id INTEGER,
  stage_key TEXT NOT NULL,
  stage_label TEXT NOT NULL,
  stage_status TEXT NOT NULL DEFAULT 'current',
  stage_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_order_stage_events_request ON custom_request_order_stage_events(custom_request_id, created_at);

CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
  custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  fulfillment_prompt_id INTEGER,
  candidate_key TEXT NOT NULL UNIQUE,
  candidate_type TEXT NOT NULL DEFAULT 'trust_block',
  candidate_status TEXT NOT NULL DEFAULT 'review_needed',
  public_use_scope TEXT,
  title TEXT,
  body_text TEXT,
  attribution_label TEXT,
  locality_label TEXT,
  source_review_text TEXT,
  customer_note TEXT,
  trust_block_item_id INTEGER,
  product_story_public_note_id INTEGER,
  review_notes TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_custom_public_proof_candidates_status ON custom_request_public_proof_candidates(candidate_status, updated_at);

CREATE TABLE IF NOT EXISTS custom_request_payment_provider_tests (
  custom_request_payment_provider_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  test_status TEXT NOT NULL DEFAULT 'not_configured',
  mode TEXT,
  result_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_payment_provider_tests_provider ON custom_request_payment_provider_tests(provider, checked_at);

CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
  custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  product_id INTEGER,
  product_draft_id INTEGER,
  product_family TEXT NOT NULL DEFAULT 'candle',
  scent_profile TEXT,
  wax_or_base TEXT,
  colour_notes TEXT,
  batch_number TEXT,
  ingredient_notes TEXT,
  allergen_safety_notes TEXT,
  cure_ready_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_candle_soap_specs_request ON custom_candle_soap_product_specs(custom_request_id, product_family);

-- Build 158 catalog/media repair note:
-- No destructive schema migration is required. Existing tables used/verified this pass:
-- products.featured_image_url, product_images, product_image_annotations,
-- product_review_actions, product_publish_overrides, site_item_inventory,
-- product_resource_links, product_seo. Runtime guards now ensure the review/media
-- support tables exist before admin catalog actions run.
-- Build 159: Catalog Product Editor visual image manager repair.
-- No D1 schema migration required; existing products.featured_image_url and product_images/image URL update handling are reused.

-- Build 160 catalog/editor repair note:
-- No new table is required. Product save now synchronizes the featured image and gallery URLs
-- into product_images in displayed order, preserving existing product_image rows where URLs match
-- so product_image_annotations and publish-readiness checks remain attached.
-- Canonical URL handling now accepts relative internal product paths in product_seo.canonical_url.

-- Build 161 note: no new D1 tables required. Public product APIs now enrich products with image arrays from existing product_images rows. Admin catalog work was split into /admin/catalog-media/ and /admin/inventory-operations/. Product detail now has a JSON error wrapper so late query failures do not return HTML to the browser.
-- Build 162: shop/creations CSS contrast, dedicated gift-card page, and inventory image preview/list URL polish. No D1 schema migration required.

-- Build 163 — product readiness preview, image health counters, and gift-card artwork
-- No required D1 migration is introduced in this pass.
-- New endpoint `/api/admin/product-readiness` reads existing tables: products, product_seo, product_images, and product_image_annotations.
-- Dashboard counters read the same existing product/image/SEO fields and degrade safely through safeCount wrappers.
-- The new `/admin/readiness/` page is admin-only and noindex/nofollow.
-- Recommended future schema work: optional persisted readiness snapshots if we want historical blocker trends instead of live reads only.



-- Build 164 additions: custom_order_stage_photos, product-publish QA endpoint, and candle/soap spec editing.
CREATE TABLE IF NOT EXISTS custom_order_stage_photos (
  custom_order_stage_photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  order_id INTEGER,
  stage_key TEXT NOT NULL DEFAULT 'planning',
  image_url TEXT,
  image_caption TEXT,
  public_use_status TEXT NOT NULL DEFAULT 'internal_review',
  uploaded_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS custom_candle_soap_product_specs (
  custom_candle_soap_product_spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  custom_request_id INTEGER,
  product_kind TEXT NOT NULL DEFAULT 'custom',
  scent_profile TEXT,
  wax_or_base TEXT,
  colour_notes TEXT,
  batch_number TEXT,
  ingredient_notes TEXT,
  allergen_safety_notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_candle_soap_product_specs_product ON custom_candle_soap_product_specs(product_id);

-- Build 165 notes:
-- Restores custom-requests.js deployment safety and adds admin workflow coverage for post-publish QA, marketplace preview, gift-card lookup, order-stage photos, candle/soap public specs, and accountant evidence URL checks.
-- New/confirmed runtime tables used by this pass include gift_cards, gift_card_redemptions, custom_order_stage_photos, custom_candle_soap_product_specs, trust_block_items, and accountant/HST evidence records.
-- No destructive migration is required; new endpoints create/ensure supporting tables where needed and rely on the existing current-pass schema notes.


-- Build 166 additions: gift-card lifecycle controls, public balance lookup, QA persistence, trust placements, local SEO queue, task queue, and moderated order-stage photos.
ALTER TABLE custom_order_stage_photos ADD COLUMN object_key TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN original_filename TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN mime_type TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE custom_order_stage_photos ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'needs_review';
ALTER TABLE custom_order_stage_photos ADD COLUMN proof_candidate_status TEXT NOT NULL DEFAULT 'not_requested';
ALTER TABLE custom_order_stage_photos ADD COLUMN approved_by_user_id INTEGER;
ALTER TABLE custom_order_stage_photos ADD COLUMN approved_at TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS product_publish_qa_results (
  product_publish_qa_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_slug TEXT,
  qa_status TEXT NOT NULL DEFAULT 'failed',
  passed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  checks_json TEXT,
  checked_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_publish_qa_results_product ON product_publish_qa_results(product_id, created_at);

CREATE TABLE IF NOT EXISTS gift_card_admin_events (
  gift_card_admin_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  source_gift_card_id INTEGER,
  action_key TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trust_block_placements (
  trust_block_placement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_context TEXT NOT NULL UNIQUE,
  placement_label TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  max_items INTEGER NOT NULL DEFAULT 3,
  item_kind_filter TEXT,
  locality_filter TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_landing_page_reviews (
  local_seo_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  page_label TEXT,
  target_keyword TEXT,
  target_locality TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  h1_status TEXT NOT NULL DEFAULT 'unchecked',
  title_meta_status TEXT NOT NULL DEFAULT 'unchecked',
  internal_link_status TEXT NOT NULL DEFAULT 'unchecked',
  notes TEXT,
  local_seo_score INTEGER NOT NULL DEFAULT 0,
  scoring_notes TEXT,
  scored_at TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Build 167: image derivatives, stage-photo moderation, gift-card redemption, marketplace CSV mapping, evidence attachments, Today task actions, local SEO scoring, and QA history.
CREATE TABLE IF NOT EXISTS product_image_derivatives (
  product_image_derivative_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_image_id INTEGER NOT NULL,
  product_id INTEGER,
  derivative_kind TEXT NOT NULL DEFAULT 'preview',
  target_width INTEGER NOT NULL DEFAULT 1200,
  target_height INTEGER NOT NULL DEFAULT 1200,
  crop_x REAL NOT NULL DEFAULT 0,
  crop_y REAL NOT NULL DEFAULT 0,
  crop_width REAL NOT NULL DEFAULT 1,
  crop_height REAL NOT NULL DEFAULT 1,
  source_image_url TEXT,
  derivative_url TEXT,
  derivative_status TEXT NOT NULL DEFAULT 'queued',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS stage_photo_moderation_events (
  stage_photo_moderation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_order_stage_photo_id INTEGER NOT NULL,
  action_key TEXT NOT NULL,
  moderation_status TEXT,
  public_use_status TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hint TEXT,
  email_hash TEXT,
  client_key TEXT,
  was_success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketplace_csv_mappings (
  marketplace_csv_mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL UNIQUE,
  mapping_json TEXT NOT NULL DEFAULT '[]',
  validation_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS accounting_evidence_attachments (
  accounting_evidence_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  evidence_kind TEXT,
  title TEXT,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  attachment_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS today_task_actions (
  today_task_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_key TEXT NOT NULL,
  task_label TEXT,
  action_status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS product_publish_qa_results (
  product_publish_qa_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  qa_status TEXT NOT NULL DEFAULT 'unchecked',
  qa_score INTEGER NOT NULL DEFAULT 0,
  qa_summary_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
-- local_seo_score, scoring_notes, and scored_at are included in the CREATE TABLE above.

-- Build 168 schema additions / compatibility notes
CREATE TABLE IF NOT EXISTS marketplace_export_image_selections (
  marketplace_export_image_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  selected_image_urls_json TEXT,
  selected_product_image_ids_json TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, product_id)
);
CREATE TABLE IF NOT EXISTS custom_request_public_proof_candidates (
  custom_request_public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER,
  order_id INTEGER,
  source_kind TEXT NOT NULL DEFAULT 'stage_photo',
  source_record_id INTEGER,
  image_url TEXT,
  candidate_title TEXT,
  candidate_body TEXT,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  trust_block_item_id INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lookup_email TEXT,
  code_suffix TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  result_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candle_soap_batch_recalls (
  candle_soap_batch_recall_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  product_kind TEXT,
  recall_status TEXT NOT NULL DEFAULT 'watch',
  reason TEXT,
  customer_notice TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS accounting_evidence_attachments (
  accounting_evidence_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  evidence_kind TEXT,
  title TEXT,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  attachment_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE product_image_derivatives ADD COLUMN derivative_object_key TEXT;
ALTER TABLE product_image_derivatives ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_image_derivatives ADD COLUMN generation_method TEXT;
ALTER TABLE custom_order_stage_photos ADD COLUMN consent_match_status TEXT NOT NULL DEFAULT 'not_checked';
ALTER TABLE today_task_actions ADD COLUMN snooze_until TEXT;


-- Build 169 schema additions: derivative output, proof candidates, gift delivery, local SEO, QA state, smoke tests.
CREATE TABLE IF NOT EXISTS gift_card_delivery_templates (
  gift_card_delivery_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT,
  body TEXT,
  template_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gift_card_delivery_queue (
  gift_card_delivery_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  recipient_email TEXT,
  delivery_kind TEXT NOT NULL DEFAULT 'activation',
  template_key TEXT,
  subject TEXT,
  body TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  queued_by_user_id INTEGER,
  queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS public_proof_candidates (
  public_proof_candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_kind TEXT NOT NULL DEFAULT 'stage_photo',
  source_id INTEGER,
  product_id INTEGER,
  custom_request_id INTEGER,
  proof_title TEXT,
  proof_body TEXT,
  image_url TEXT,
  consent_status TEXT NOT NULL DEFAULT 'needs_review',
  moderation_status TEXT NOT NULL DEFAULT 'needs_review',
  placement_context TEXT NOT NULL DEFAULT 'sitewide',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS marketplace_export_history (
  marketplace_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_format TEXT NOT NULL DEFAULT 'csv',
  product_count INTEGER NOT NULL DEFAULT 0,
  ready_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS product_qa_panel_states (
  product_qa_panel_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER,
  panel_key TEXT NOT NULL DEFAULT 'catalog_qa',
  panel_state TEXT NOT NULL DEFAULT 'collapsed',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id,user_id,panel_key)
);
CREATE TABLE IF NOT EXISTS local_seo_bake_actions (
  local_seo_bake_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  proposed_title TEXT,
  proposed_meta_description TEXT,
  internal_link_notes TEXT,
  action_status TEXT NOT NULL DEFAULT 'queued',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS local_seo_competitor_phrases (
  local_seo_competitor_phrase_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  phrase TEXT NOT NULL,
  phrase_kind TEXT NOT NULL DEFAULT 'competitor_phrase',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS candle_soap_recall_notification_queue (
  candle_soap_recall_notification_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recipient_email TEXT,
  notification_status TEXT NOT NULL DEFAULT 'draft',
  subject TEXT,
  body TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS post_deploy_smoke_test_results (
  post_deploy_smoke_test_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  page_url TEXT NOT NULL,
  check_kind TEXT NOT NULL DEFAULT 'manual',
  result_status TEXT NOT NULL DEFAULT 'pending',
  http_status INTEGER,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE product_image_derivatives ADD COLUMN before_image_url TEXT;
ALTER TABLE product_image_derivatives ADD COLUMN comparison_notes TEXT;

-- Build 170 deployment hardening and workflow schema notes
-- Added/extended by app code as defensive CREATE TABLE/ALTER TABLE calls:
-- product_image_derivatives: derivative URL worker fallback and featured-image promotion notes.
-- marketplace_export_history: snapshot_json, replayed_from_history_id, rollback_note.
-- marketplace_export_replay_events: channel replay/rollback audit.
-- public_proof_candidates: promoted_trust_block_item_id, promoted_at, source_label.
-- public_proof_candidate_events: promotion audit trail.
-- gift_card_delivery_queue: delivery sender/history bridge to notification_outbox.
-- gift_card_lookup_lockouts: admin lockout controls for public balance lookup abuse.
-- local_seo_competitor_phrases: last_page_score, phrase_count, last_scored_at.
-- product_qa_blocker_history: blocker resolution persistence.
-- candle_soap_recall_customer_matches and candle_soap_recall_notification_queue: recall matching and send-review drafts.
-- post_deploy_smoke_test_results: live URL smoke-test storage.
-- dark_theme_screenshot_evidence: dark-theme screenshot/review evidence rows.


-- Build 171 admin safety and release readiness schema additions.
CREATE TABLE IF NOT EXISTS dark_theme_screenshot_evidence (
  dark_theme_screenshot_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  evidence_url TEXT,
  object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  checklist_key TEXT,
  section_label TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  contrast_status TEXT NOT NULL DEFAULT 'unchecked',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dark_theme_evidence_review ON dark_theme_screenshot_evidence(page_path, review_status, contrast_status, updated_at);

CREATE TABLE IF NOT EXISTS gift_card_provider_send_logs (
  gift_card_provider_send_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_delivery_queue_id INTEGER,
  gift_card_id INTEGER,
  provider TEXT,
  recipient_email TEXT,
  provider_message_id TEXT,
  send_status TEXT NOT NULL DEFAULT 'attempted',
  request_summary_json TEXT,
  response_summary_json TEXT,
  error_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_card_provider_send_logs_queue ON gift_card_provider_send_logs(gift_card_delivery_queue_id, created_at);

CREATE TABLE IF NOT EXISTS r2_derivative_health_checks (
  r2_derivative_health_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_status TEXT NOT NULL DEFAULT 'unknown',
  bucket_binding_name TEXT,
  object_key TEXT,
  public_base_url TEXT,
  worker_route TEXT,
  message TEXT,
  details_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_competitor_phrase_score_history (
  local_seo_competitor_phrase_score_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_seo_competitor_phrase_id INTEGER,
  page_path TEXT,
  phrase TEXT,
  phrase_count INTEGER NOT NULL DEFAULT 0,
  page_score INTEGER NOT NULL DEFAULT 0,
  scoring_label TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_export_replay_events (
  marketplace_export_replay_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  source_history_id INTEGER,
  action_kind TEXT NOT NULL DEFAULT 'replay',
  affected_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE marketplace_export_history ADD COLUMN snapshot_json TEXT;
ALTER TABLE marketplace_export_history ADD COLUMN replayed_from_history_id INTEGER;
ALTER TABLE marketplace_export_history ADD COLUMN rollback_note TEXT;
ALTER TABLE public_proof_candidates ADD COLUMN consent_source_url TEXT;
ALTER TABLE public_proof_candidates ADD COLUMN promotion_contexts_json TEXT;
ALTER TABLE candle_soap_batch_recalls ADD COLUMN send_review_status TEXT NOT NULL DEFAULT 'draft';

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_171_admin_safety_release_readiness',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Admin evidence bundle, gift-card provider logs, marketplace rollback, local SEO history, recalls, and release readiness. Build 172 hotfix: file_name is included so the NOT NULL ledger constraint passes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_171_admin_safety_release_readiness');

-- Build 173 deployment preflight and release-run history.
CREATE TABLE IF NOT EXISTS deployment_preflight_runs (
  deployment_preflight_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  run_status TEXT NOT NULL DEFAULT 'warning',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_preflight_runs_status ON deployment_preflight_runs(run_status, created_at DESC);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_173_deployment_preflight_release_safety',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Deployment preflight run history, D1 rerun warnings, one-H1/local SEO checks, release-document health, and admin safe-deploy visibility.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_173_deployment_preflight_release_safety');

-- Build 174: deployment preflight detail, post-deploy confirmations, and release package manifest support.
-- Safe to run after Build 173; additive only.

CREATE TABLE IF NOT EXISTS deployment_post_deploy_confirmations (
  deployment_post_deploy_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  confirmation_key TEXT NOT NULL,
  confirmation_label TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  confirmed_by_user_id INTEGER,
  confirmed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, confirmation_key)
);

CREATE INDEX IF NOT EXISTS idx_deploy_confirmations_status
  ON deployment_post_deploy_confirmations(build_label, confirmation_status, updated_at DESC);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_174_preflight_detail_manifest',
  'database_build174_deployment_preflight_detail.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Deployment preflight detail drawers, schema diff, Markdown export, post-deploy confirmations, R2 visibility, and release package manifest support.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_174_preflight_detail_manifest');

-- Build 175: release control center, deeper preflight checks, provider webhooks, recall compliance, and local business schema.
-- Safe to run after Build 174; additive only.

CREATE TABLE IF NOT EXISTS deployment_history (
  deployment_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  deploy_url TEXT,
  build_zip_label TEXT,
  package_manifest_hash TEXT,
  deployment_status TEXT NOT NULL DEFAULT 'planned',
  promoted_by_user_id INTEGER,
  promoted_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON deployment_history(deployment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_history_build ON deployment_history(build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS deployment_manifest_comparisons (
  deployment_manifest_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  expected_manifest_path TEXT NOT NULL DEFAULT '/data/site/release-package-manifest.json',
  deployed_manifest_url TEXT,
  comparison_status TEXT NOT NULL DEFAULT 'not_run',
  expected_file_count INTEGER NOT NULL DEFAULT 0,
  deployed_file_count INTEGER NOT NULL DEFAULT 0,
  missing_file_count INTEGER NOT NULL DEFAULT 0,
  changed_file_count INTEGER NOT NULL DEFAULT 0,
  comparison_json TEXT NOT NULL DEFAULT '{}',
  compared_by_user_id INTEGER,
  compared_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_manifest_comparisons_build ON deployment_manifest_comparisons(build_label, comparison_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS deployment_screenshot_jobs (
  deployment_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  page_path TEXT NOT NULL,
  screenshot_kind TEXT NOT NULL DEFAULT 'dark_theme_regression',
  viewport_width INTEGER NOT NULL DEFAULT 390,
  viewport_height INTEGER NOT NULL DEFAULT 844,
  theme TEXT NOT NULL DEFAULT 'dark',
  capture_status TEXT NOT NULL DEFAULT 'queued',
  evidence_url TEXT,
  r2_object_key TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  captured_by_user_id INTEGER,
  captured_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_screenshot_jobs_status ON deployment_screenshot_jobs(capture_status, build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS preflight_response_keyword_checks (
  preflight_response_keyword_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  keyword TEXT NOT NULL,
  keyword_kind TEXT NOT NULL DEFAULT 'local_search',
  is_required INTEGER NOT NULL DEFAULT 1,
  last_status TEXT NOT NULL DEFAULT 'not_checked',
  last_count INTEGER NOT NULL DEFAULT 0,
  last_checked_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, keyword, keyword_kind)
);
CREATE INDEX IF NOT EXISTS idx_preflight_keywords_page ON preflight_response_keyword_checks(page_path, last_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_queue (
  product_qa_bulk_fix_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL,
  fix_type TEXT NOT NULL DEFAULT 'manual_review',
  product_ids_json TEXT NOT NULL DEFAULT '[]',
  product_count INTEGER NOT NULL DEFAULT 0,
  approval_status TEXT NOT NULL DEFAULT 'needs_approval',
  preview_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  applied_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_bulk_fix_queue_status ON product_qa_bulk_fix_queue(approval_status, blocker_code, updated_at DESC);

CREATE TABLE IF NOT EXISTS r2_private_health_tests (
  r2_private_health_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_kind TEXT NOT NULL DEFAULT 'signed_download',
  bucket_label TEXT,
  object_key TEXT,
  test_status TEXT NOT NULL DEFAULT 'not_run',
  http_status INTEGER,
  checksum_sha256 TEXT,
  bytes_tested INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_private_health_tests_status ON r2_private_health_tests(test_kind, test_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS accounting_evidence_bundle_checksums (
  accounting_evidence_bundle_checksum_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  export_label TEXT,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  zip_sha256 TEXT,
  manifest_json TEXT NOT NULL DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'not_verified',
  verified_by_user_id INTEGER,
  verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_bundle_checksums_period ON accounting_evidence_bundle_checksums(period_month, verification_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_provider_webhook_events (
  gift_card_provider_webhook_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_type TEXT,
  provider_event_id TEXT,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'received',
  gift_card_delivery_log_id INTEGER,
  payload_json TEXT NOT NULL DEFAULT '{}',
  received_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  notes TEXT,
  UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_gift_card_webhooks_provider ON gift_card_provider_webhook_events(provider, delivery_status, received_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_channel_validation_rules (
  marketplace_channel_validation_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  column_key TEXT NOT NULL,
  rule_kind TEXT NOT NULL DEFAULT 'required_column',
  is_required INTEGER NOT NULL DEFAULT 1,
  rule_status TEXT NOT NULL DEFAULT 'active',
  severity TEXT NOT NULL DEFAULT 'blocker',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, column_key, rule_kind)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_validation_rules_channel ON marketplace_channel_validation_rules(channel, rule_status, severity);

CREATE TABLE IF NOT EXISTS marketplace_export_snapshot_diffs (
  marketplace_export_snapshot_diff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  previous_history_id INTEGER,
  current_history_id INTEGER,
  diff_status TEXT NOT NULL DEFAULT 'not_run',
  changed_row_count INTEGER NOT NULL DEFAULT 0,
  changed_field_count INTEGER NOT NULL DEFAULT 0,
  diff_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_snapshot_diffs_channel ON marketplace_export_snapshot_diffs(channel, diff_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_compliance_reviews (
  recall_compliance_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  legal_note TEXT,
  compliance_note TEXT,
  approval_signature TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_compliance_reviews_batch ON recall_compliance_reviews(batch_number, review_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS recall_customer_previews (
  recall_customer_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  customer_id INTEGER,
  customer_email TEXT,
  product_summary TEXT,
  order_summary TEXT,
  preview_subject TEXT,
  preview_body TEXT,
  preview_status TEXT NOT NULL DEFAULT 'draft',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_customer_previews_batch ON recall_customer_previews(batch_number, preview_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS mobile_admin_saved_views (
  mobile_admin_saved_view_id INTEGER PRIMARY KEY AUTOINCREMENT,
  view_key TEXT NOT NULL UNIQUE,
  view_label TEXT NOT NULL,
  page_path TEXT NOT NULL,
  device_target TEXT NOT NULL DEFAULT 'phone',
  filter_json TEXT NOT NULL DEFAULT '{}',
  sort_json TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_admin_saved_views_target ON mobile_admin_saved_views(device_target, is_default, updated_at DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_settings (
  local_business_schema_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL DEFAULT 'Devil n Dove',
  canonical_url TEXT NOT NULL DEFAULT 'https://devilndove.com/',
  telephone TEXT,
  email TEXT,
  area_served_json TEXT NOT NULL DEFAULT '["Southern Ontario","Oxford County","Norfolk County"]',
  service_types_json TEXT NOT NULL DEFAULT '["handmade jewelry","custom gifts","laser engraving","custom candles","custom soap"]',
  same_as_json TEXT NOT NULL DEFAULT '[]',
  schema_status TEXT NOT NULL DEFAULT 'draft',
  schema_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_status ON local_business_schema_settings(schema_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS safe_deploy_export_records (
  safe_deploy_export_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  export_label TEXT,
  release_notes_path TEXT DEFAULT 'RELEASE_NOTES.md',
  preflight_markdown_path TEXT,
  manifest_path TEXT DEFAULT 'data/site/release-package-manifest.json',
  schema_paths_json TEXT NOT NULL DEFAULT '[]',
  smoke_results_json TEXT NOT NULL DEFAULT '{}',
  export_status TEXT NOT NULL DEFAULT 'planned',
  zip_sha256 TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_safe_deploy_exports_build ON safe_deploy_export_records(build_label, export_status, created_at DESC);

CREATE TABLE IF NOT EXISTS preflight_runtime_incident_links (
  preflight_runtime_incident_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_preflight_run_id INTEGER,
  runtime_incident_id INTEGER,
  check_code TEXT,
  page_path TEXT,
  link_status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_preflight_incident_links_run ON preflight_runtime_incident_links(deployment_preflight_run_id, link_status, created_at DESC);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_175_release_control_center',
  'database_build175_release_control.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Release control center, deployment history, manifest comparison, screenshot jobs, deeper URL keyword checks, QA bulk queues, R2 signed tests, gift-card webhooks, marketplace validation, recall compliance previews, mobile saved views, and local business schema output.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_175_release_control_center');

-- Build 176: release safety controls, downloadable safe deploy package, QA previews, recall locks, and richer local SEO schema.
-- Safe to run after Build 175; additive only.

CREATE TABLE IF NOT EXISTS safe_deploy_package_downloads (
  safe_deploy_package_download_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  package_kind TEXT NOT NULL DEFAULT 'safe_deploy_zip',
  included_files_json TEXT NOT NULL DEFAULT '[]',
  file_count INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  zip_sha256 TEXT,
  download_status TEXT NOT NULL DEFAULT 'prepared',
  prepared_by_user_id INTEGER,
  prepared_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_safe_deploy_package_downloads_build ON safe_deploy_package_downloads(build_label, download_status, prepared_at DESC);

CREATE TABLE IF NOT EXISTS release_manifest_live_diffs (
  release_manifest_live_diff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  expected_manifest_url TEXT,
  deployed_manifest_url TEXT,
  diff_status TEXT NOT NULL DEFAULT 'not_run',
  expected_file_count INTEGER NOT NULL DEFAULT 0,
  deployed_file_count INTEGER NOT NULL DEFAULT 0,
  missing_file_count INTEGER NOT NULL DEFAULT 0,
  changed_file_count INTEGER NOT NULL DEFAULT 0,
  extra_file_count INTEGER NOT NULL DEFAULT 0,
  diff_json TEXT NOT NULL DEFAULT '{}',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_release_manifest_live_diffs_build ON release_manifest_live_diffs(build_label, diff_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_export_validation_runs (
  marketplace_export_validation_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_history_id INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'not_run',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  checked_rows INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_export_validation_runs_channel ON marketplace_export_validation_runs(channel, validation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_preview_items (
  product_qa_bulk_fix_preview_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  product_id INTEGER NOT NULL,
  blocker_code TEXT NOT NULL,
  focus_field TEXT,
  current_value TEXT,
  suggested_value TEXT,
  fix_url TEXT,
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_preview_items_queue ON product_qa_bulk_fix_preview_items(product_qa_bulk_fix_queue_id, preview_status, blocker_code);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_events (
  product_qa_bulk_fix_apply_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  applied_field TEXT,
  applied_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  event_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  applied_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_apply_events_queue ON product_qa_bulk_fix_apply_events(product_qa_bulk_fix_queue_id, apply_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_checks (
  gift_card_webhook_signature_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_id INTEGER,
  signature_status TEXT NOT NULL DEFAULT 'not_checked',
  signature_header_present INTEGER NOT NULL DEFAULT 0,
  timestamp_header_present INTEGER NOT NULL DEFAULT 0,
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_gift_card_signature_checks_provider ON gift_card_webhook_signature_checks(provider, signature_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS recall_notification_locks (
  recall_notification_lock_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  lock_status TEXT NOT NULL DEFAULT 'locked_pending_review',
  required_review_status TEXT NOT NULL DEFAULT 'approved',
  matching_review_id INTEGER,
  last_checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  checked_by_user_id INTEGER,
  notes TEXT,
  UNIQUE(batch_number, recall_id)
);
CREATE INDEX IF NOT EXISTS idx_recall_notification_locks_status ON recall_notification_locks(lock_status, batch_number, last_checked_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_internal_link_suggestions (
  local_seo_internal_link_suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  suggested_anchor TEXT,
  reason TEXT,
  suggestion_status TEXT NOT NULL DEFAULT 'needs_review',
  score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_path, suggested_anchor)
);
CREATE INDEX IF NOT EXISTS idx_local_link_suggestions_status ON local_seo_internal_link_suggestions(suggestion_status, score DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_search_console_trends (
  local_seo_search_console_trend_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  query_text TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr REAL NOT NULL DEFAULT 0,
  average_position REAL NOT NULL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  trend_status TEXT NOT NULL DEFAULT 'imported',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_search_console_trends_page ON local_seo_search_console_trends(page_path, period_end DESC, impressions DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_bakes (
  local_business_schema_bake_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_setting_id INTEGER,
  bake_status TEXT NOT NULL DEFAULT 'draft',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  output_path TEXT DEFAULT 'data/site/local-business-schema.json',
  baked_by_user_id INTEGER,
  baked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_bakes_status ON local_business_schema_bakes(bake_status, baked_at DESC);

CREATE TABLE IF NOT EXISTS deployment_rollback_checklist_rows (
  deployment_rollback_checklist_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  checklist_status TEXT NOT NULL DEFAULT 'not_checked',
  required_before_rollback INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, checklist_key)
);
CREATE INDEX IF NOT EXISTS idx_deployment_rollback_checklist_status ON deployment_rollback_checklist_rows(build_label, checklist_status, required_before_rollback);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_import_runs (
  cloudflare_deployment_import_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_status TEXT NOT NULL DEFAULT 'not_configured',
  account_id_present INTEGER NOT NULL DEFAULT 0,
  project_name_present INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  response_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_cloudflare_import_runs_status ON cloudflare_deployment_import_runs(import_status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_notification_routes (
  admin_notification_route_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_key TEXT NOT NULL UNIQUE,
  route_label TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'preflight',
  destination_page TEXT NOT NULL DEFAULT '/admin/',
  min_severity TEXT NOT NULL DEFAULT 'warn',
  route_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_notification_routes_status ON admin_notification_routes(route_status, source_kind, min_severity);

CREATE TABLE IF NOT EXISTS local_business_schema_extended_fields (
  local_business_schema_extended_field_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_business_schema_setting_id INTEGER,
  opening_hours_json TEXT NOT NULL DEFAULT '[]',
  logo_url TEXT,
  image_url TEXT,
  payment_accepted_json TEXT NOT NULL DEFAULT '["Cash","Credit Card","Debit","E-transfer"]',
  price_range TEXT DEFAULT '$$',
  address_json TEXT NOT NULL DEFAULT '{}',
  geo_json TEXT NOT NULL DEFAULT '{}',
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(local_business_schema_setting_id)
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_extended_fields_setting ON local_business_schema_extended_fields(local_business_schema_setting_id, updated_at DESC);

INSERT OR IGNORE INTO admin_notification_routes (route_key, route_label, source_kind, destination_page, min_severity, route_status, created_at, updated_at)
VALUES
  ('preflight_blockers_dashboard', 'Preflight blockers to dashboard', 'preflight', '/admin/deployment-preflight/', 'fail', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('release_manifest_dashboard', 'Release manifest diffs to release control', 'release', '/admin/release-control/', 'warn', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recall_lock_dashboard', 'Recall locks to recall admin', 'recall', '/admin/release-control/#recall-locks', 'warn', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_176_release_safety_controls',
  'database_build176_release_safety_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds safe deploy package download tracking, live manifest diffs, marketplace validation previews, Product QA preview items, recall notification locks, gift-card webhook signature checks, local SEO link/trend rows, richer LocalBusiness bake tracking, rollback checklist rows, Cloudflare deployment import runs, and notification routes.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_176_release_safety_controls');



-- Build 177: deploy-readiness score, Cloudflare import, rollback controls, exact manifest diff rows, QA approvals, recall/customer previews, R2 private evidence test rows, and LocalBusiness JSON-LD injection targets.
-- Safe to run after Build 176; additive only.

CREATE TABLE IF NOT EXISTS release_manifest_diff_items (
  release_manifest_diff_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_manifest_live_diff_id INTEGER,
  build_label TEXT,
  file_path TEXT NOT NULL,
  diff_kind TEXT NOT NULL DEFAULT 'changed',
  expected_sha256 TEXT,
  deployed_sha256 TEXT,
  item_status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_release_manifest_diff_items_diff ON release_manifest_diff_items(release_manifest_live_diff_id, diff_kind, item_status);
CREATE INDEX IF NOT EXISTS idx_release_manifest_diff_items_file ON release_manifest_diff_items(file_path, diff_kind);

CREATE TABLE IF NOT EXISTS deployment_readiness_scores (
  deployment_readiness_score_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  score_status TEXT NOT NULL DEFAULT 'not_ready',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  manifest_blocker_count INTEGER NOT NULL DEFAULT 0,
  smoke_blocker_count INTEGER NOT NULL DEFAULT 0,
  rollback_blocker_count INTEGER NOT NULL DEFAULT 0,
  d1_marker_count INTEGER NOT NULL DEFAULT 0,
  score_json TEXT NOT NULL DEFAULT '{}',
  scored_by_user_id INTEGER,
  scored_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_scores_build ON deployment_readiness_scores(build_label, score_status, scored_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_approvals (
  product_qa_bulk_fix_approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'manual_only',
  approval_scope TEXT NOT NULL DEFAULT 'preview_group',
  approval_notes TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_bulk_fix_approvals_queue ON product_qa_bulk_fix_approvals(product_qa_bulk_fix_queue_id, approval_status, approved_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_channel_validation_rule_edits (
  marketplace_channel_validation_rule_edit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  column_key TEXT NOT NULL,
  rule_kind TEXT NOT NULL DEFAULT 'required_column',
  is_required INTEGER NOT NULL DEFAULT 1,
  severity TEXT NOT NULL DEFAULT 'blocker',
  rule_status TEXT NOT NULL DEFAULT 'active',
  edited_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, column_key, rule_kind)
);
CREATE INDEX IF NOT EXISTS idx_marketplace_rule_edits_channel ON marketplace_channel_validation_rule_edits(channel, rule_status, severity);

CREATE TABLE IF NOT EXISTS recall_customer_match_previews (
  recall_customer_match_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  product_id INTEGER,
  order_id INTEGER,
  customer_email TEXT,
  customer_name TEXT,
  match_source TEXT NOT NULL DEFAULT 'order_product_batch',
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  notification_subject TEXT,
  notification_body TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_customer_matches_batch ON recall_customer_match_previews(batch_number, preview_status, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_download_health_tests (
  r2_signed_download_health_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_kind TEXT NOT NULL DEFAULT 'create_get_delete',
  bucket_label TEXT,
  object_key TEXT,
  create_status TEXT NOT NULL DEFAULT 'not_run',
  get_status TEXT NOT NULL DEFAULT 'not_run',
  delete_status TEXT NOT NULL DEFAULT 'not_run',
  checksum_sha256 TEXT,
  bytes_tested INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_signed_download_tests_status ON r2_signed_download_health_tests(test_kind, create_status, get_status, delete_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS accounting_zip_checksum_links (
  accounting_zip_checksum_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  accounting_evidence_bundle_checksum_id INTEGER,
  safe_deploy_package_download_id INTEGER,
  period_month TEXT,
  zip_sha256 TEXT,
  link_status TEXT NOT NULL DEFAULT 'linked',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_accounting_zip_checksum_links_period ON accounting_zip_checksum_links(period_month, link_status, created_at DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_injection_targets (
  local_business_schema_injection_target_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL UNIQUE,
  injection_status TEXT NOT NULL DEFAULT 'queued',
  schema_source TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  last_baked_at TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_injection_targets_status ON local_business_schema_injection_targets(injection_status, page_path);

CREATE TABLE IF NOT EXISTS dashboard_notification_cards (
  dashboard_notification_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_kind TEXT NOT NULL,
  source_id INTEGER,
  card_title TEXT NOT NULL,
  card_body TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  destination_page TEXT NOT NULL DEFAULT '/admin/',
  card_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dashboard_notification_cards_status ON dashboard_notification_cards(card_status, severity, created_at DESC);

INSERT OR IGNORE INTO local_business_schema_injection_targets (page_path, injection_status, schema_source, notes, created_at, updated_at)
VALUES
  ('/', 'queued', 'data/site/local-business-schema.json', 'Homepage JSON-LD target for LocalBusiness bake.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/handmade-jewelry-ontario/', 'queued', 'data/site/local-business-schema.json', 'Local handmade jewelry landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/custom-gifts-southern-ontario/', 'queued', 'data/site/local-business-schema.json', 'Custom gifts local landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('/laser-engraving-ontario/', 'queued', 'data/site/local-business-schema.json', 'Laser engraving local landing page JSON-LD target.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_177_deploy_score_and_controls',
  'database_build177_deploy_score_and_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds deploy-readiness scores, real Cloudflare deployment import storage, exact manifest diff item rows, rollback status controls, Product QA preview approvals and safe image-alt apply logging, marketplace rule editor rows, recall customer preview rows, private R2 evidence test rows, accounting ZIP checksum links, LocalBusiness JSON-LD injection targets, and dashboard notification cards.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_177_deploy_score_and_controls');

-- Build 178: deploy-readiness page, promote-live guardrails, marketplace row validation, recall copy review, webhook/R2 verification rows, local SEO chart/map helpers, LocalBusiness edit drafts, and notification snooze controls.

CREATE TABLE IF NOT EXISTS deployment_promote_live_checklist (
  deployment_promote_live_checklist_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  checklist_key TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  checklist_status TEXT NOT NULL DEFAULT 'needs_review',
  required_to_promote INTEGER NOT NULL DEFAULT 1,
  source_kind TEXT,
  source_id INTEGER,
  blocking_reason TEXT,
  resolved_note TEXT,
  resolved_by_user_id INTEGER,
  resolved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(build_label, checklist_key)
);
CREATE INDEX IF NOT EXISTS idx_deployment_promote_live_checklist_status ON deployment_promote_live_checklist(build_label, checklist_status, required_to_promote);

CREATE TABLE IF NOT EXISTS deployment_readiness_drilldown_rows (
  deployment_readiness_drilldown_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_key TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  row_label TEXT NOT NULL,
  row_detail TEXT,
  destination_page TEXT,
  drilldown_status TEXT NOT NULL DEFAULT 'open',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deployment_readiness_drilldown_rows_status ON deployment_readiness_drilldown_rows(build_label, severity, drilldown_status, created_at DESC);

CREATE TABLE IF NOT EXISTS release_manifest_diff_view_filters (
  release_manifest_diff_view_filter_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL UNIQUE,
  filter_label TEXT NOT NULL,
  diff_kind TEXT,
  path_contains TEXT,
  item_status TEXT,
  sort_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_confirmations (
  product_qa_bulk_fix_apply_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER NOT NULL,
  confirmation_key TEXT NOT NULL DEFAULT 'apply_confirmed',
  confirmation_status TEXT NOT NULL DEFAULT 'pending',
  confirmed_by_user_id INTEGER,
  confirmed_at TEXT,
  confirmation_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_qa_bulk_fix_queue_id, confirmation_key)
);
CREATE INDEX IF NOT EXISTS idx_product_qa_apply_confirmations_status ON product_qa_bulk_fix_apply_confirmations(confirmation_status, confirmed_at DESC);

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_events (
  product_qa_safe_apply_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_qa_bulk_fix_queue_id INTEGER,
  apply_kind TEXT NOT NULL,
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  affected_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  before_after_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_safe_apply_events_kind ON product_qa_safe_apply_events(apply_kind, apply_status, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_export_row_validation_results (
  marketplace_export_row_validation_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  product_id INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  missing_fields_json TEXT NOT NULL DEFAULT '[]',
  row_payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_row_validation_channel ON marketplace_export_row_validation_results(channel, validation_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_customer_notification_copy_reviews (
  recall_customer_notification_copy_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  recall_customer_match_preview_id INTEGER,
  batch_number TEXT NOT NULL,
  customer_email TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  subject_preview TEXT,
  body_preview TEXT,
  compliance_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_copy_reviews_status ON recall_customer_notification_copy_reviews(batch_number, review_status, created_at DESC);

CREATE TABLE IF NOT EXISTS recall_compliance_signature_attachments (
  recall_compliance_signature_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candle_soap_batch_recall_id INTEGER,
  batch_number TEXT NOT NULL,
  attachment_kind TEXT NOT NULL DEFAULT 'signature_evidence',
  signer_name TEXT,
  evidence_url TEXT,
  r2_object_key TEXT,
  attachment_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recall_signature_attachments_batch ON recall_compliance_signature_attachments(batch_number, attachment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_verification_logs (
  gift_card_webhook_signature_verification_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  signature_status TEXT NOT NULL DEFAULT 'not_checked',
  algorithm TEXT,
  header_snapshot_json TEXT NOT NULL DEFAULT '{}',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  verification_notes TEXT,
  event_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_card_webhook_verification_provider ON gift_card_webhook_signature_verification_logs(provider, signature_status, created_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_url_verification_results (
  r2_signed_url_verification_result_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_label TEXT NOT NULL,
  object_key TEXT,
  signed_url_status TEXT NOT NULL DEFAULT 'not_configured',
  put_status TEXT NOT NULL DEFAULT 'not_run',
  get_status TEXT NOT NULL DEFAULT 'not_run',
  delete_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_r2_signed_url_verification_status ON r2_signed_url_verification_results(signed_url_status, checked_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_search_console_chart_points (
  local_seo_search_console_chart_point_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  query_text TEXT,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  metric_value REAL NOT NULL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_seo_chart_points_page ON local_seo_search_console_chart_points(page_path, metric_kind, period_end DESC);

CREATE TABLE IF NOT EXISTS internal_link_map_edges (
  internal_link_map_edge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  anchor_text TEXT,
  edge_status TEXT NOT NULL DEFAULT 'suggested',
  score INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_path, target_path, anchor_text)
);
CREATE INDEX IF NOT EXISTS idx_internal_link_map_edges_status ON internal_link_map_edges(edge_status, score DESC);

CREATE TABLE IF NOT EXISTS local_business_schema_edit_drafts (
  local_business_schema_edit_draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_status TEXT NOT NULL DEFAULT 'draft',
  business_name TEXT,
  canonical_url TEXT,
  telephone TEXT,
  email TEXT,
  area_served_json TEXT NOT NULL DEFAULT '[]',
  service_types_json TEXT NOT NULL DEFAULT '[]',
  same_as_json TEXT NOT NULL DEFAULT '[]',
  opening_hours_json TEXT NOT NULL DEFAULT '[]',
  address_json TEXT NOT NULL DEFAULT '{}',
  geo_json TEXT NOT NULL DEFAULT '{}',
  draft_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_business_schema_edit_drafts_status ON local_business_schema_edit_drafts(draft_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS structured_data_validation_hints (
  structured_data_validation_hint_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  hint_status TEXT NOT NULL DEFAULT 'needs_review',
  hint_severity TEXT NOT NULL DEFAULT 'info',
  hint_label TEXT NOT NULL,
  hint_detail TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_structured_data_validation_hints_page ON structured_data_validation_hints(page_path, schema_type, hint_status);

CREATE TABLE IF NOT EXISTS release_package_previous_zip_comparisons (
  release_package_previous_zip_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  current_build_label TEXT NOT NULL,
  previous_build_label TEXT,
  current_manifest_hash TEXT,
  previous_manifest_hash TEXT,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  comparison_json TEXT NOT NULL DEFAULT '{}',
  comparison_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_release_zip_comparisons_build ON release_package_previous_zip_comparisons(current_build_label, created_at DESC);

CREATE TABLE IF NOT EXISTS dashboard_notification_card_snoozes (
  dashboard_notification_card_snooze_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER NOT NULL,
  snooze_until TEXT,
  snooze_status TEXT NOT NULL DEFAULT 'active',
  snooze_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dashboard_card_snoozes_status ON dashboard_notification_card_snoozes(snooze_status, snooze_until);

CREATE TABLE IF NOT EXISTS mobile_release_control_cards (
  mobile_release_control_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_key TEXT NOT NULL UNIQUE,
  card_label TEXT NOT NULL,
  destination_page TEXT NOT NULL DEFAULT '/admin/release-control/',
  card_status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mobile_release_control_cards_status ON mobile_release_control_cards(card_status, sort_order);

INSERT OR IGNORE INTO release_manifest_diff_view_filters (filter_key, filter_label, diff_kind, path_contains, item_status, sort_json, created_at, updated_at)
VALUES
  ('changed_public_pages', 'Changed public pages', 'changed', '.html', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('missing_schema_or_data', 'Missing schema/data files', 'missing', 'data/', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('changed_functions', 'Changed API functions', 'changed', 'functions/', 'open', '{"sort":"file_path"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO mobile_release_control_cards (card_key, card_label, destination_page, card_status, sort_order, payload_json, created_at, updated_at)
VALUES
  ('deploy_score', 'Deploy score', '/admin/deploy-readiness/', 'active', 10, '{"view":"score"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manifest_diff', 'Manifest diff', '/admin/release-control/#manifest-diff', 'active', 20, '{"view":"manifest"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('recall_locks', 'Recall locks', '/admin/release-control/#recall-locks', 'active', 30, '{"view":"recall"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('safe_zip', 'Safe ZIP', '/admin/safe-deploy-package/', 'active', 40, '{"view":"zip"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('promote_live', 'Promote-live checklist', '/admin/deploy-readiness/#promote-live', 'active', 50, '{"view":"promote"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
)
SELECT
  'build_178_promote_live_controls',
  'database_build178_promote_live_controls.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Adds deploy-readiness page support, promote-live checklist rows, manifest filters, QA apply confirmations, marketplace row validation, recall copy review/signature evidence rows, webhook/R2 verification logs, local SEO charts/link maps, LocalBusiness edit drafts, structured-data hints, dashboard snooze controls, mobile release cards, and previous ZIP comparison rows.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migration_ledger')
  AND NOT EXISTS (SELECT 1 FROM schema_migration_ledger WHERE migration_key='build_178_promote_live_controls');



-- Build 179 promotion control additive migration.
-- Build 179 promotion control, local SEO visuals, provider verification, and go-live gates.
-- Safe additive migration. Run after database_build178_promote_live_controls.sql.

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_rules (
  product_qa_safe_apply_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL UNIQUE,
  apply_field TEXT NOT NULL,
  rule_status TEXT NOT NULL DEFAULT 'approval_required',
  requires_confirmation INTEGER NOT NULL DEFAULT 1,
  max_rows_per_run INTEGER NOT NULL DEFAULT 25,
  safety_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_seo_visual_chart_configs (
  local_seo_visual_chart_config_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  chart_key TEXT NOT NULL,
  chart_label TEXT NOT NULL,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  period_label TEXT,
  chart_status TEXT NOT NULL DEFAULT 'active',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, chart_key)
);

CREATE TABLE IF NOT EXISTS internal_link_graph_snapshots (
  internal_link_graph_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_label TEXT NOT NULL,
  node_count INTEGER NOT NULL DEFAULT 0,
  edge_count INTEGER NOT NULL DEFAULT 0,
  missing_link_count INTEGER NOT NULL DEFAULT 0,
  graph_json TEXT NOT NULL DEFAULT '{}',
  snapshot_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_business_schema_bake_approvals (
  local_business_schema_bake_approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_business_schema_edit_draft_id INTEGER,
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  bake_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_webhook_signature_secret_checks (
  provider_webhook_signature_secret_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  expected_secret_binding TEXT,
  signature_header_name TEXT,
  timestamp_header_name TEXT,
  secret_present INTEGER NOT NULL DEFAULT 0,
  signature_header_present INTEGER NOT NULL DEFAULT 0,
  timestamp_header_present INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'not_checked',
  verification_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS r2_signed_url_expiry_tests (
  r2_signed_url_expiry_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket_label TEXT NOT NULL,
  object_key TEXT,
  create_status TEXT NOT NULL DEFAULT 'not_run',
  signed_url_status TEXT NOT NULL DEFAULT 'not_run',
  expiry_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 60,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recall_signature_evidence_uploads (
  recall_signature_evidence_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_url TEXT,
  r2_object_key TEXT,
  upload_status TEXT NOT NULL DEFAULT 'metadata_only',
  uploaded_by_user_id INTEGER,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recall_notification_release_gates (
  recall_notification_release_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  copy_review_status TEXT NOT NULL DEFAULT 'needs_review',
  signature_status TEXT NOT NULL DEFAULT 'needs_review',
  customer_match_status TEXT NOT NULL DEFAULT 'needs_review',
  release_status TEXT NOT NULL DEFAULT 'blocked',
  gate_notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_number, recall_id)
);

CREATE TABLE IF NOT EXISTS accounting_zip_export_links (
  accounting_zip_export_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  accountant_export_id INTEGER,
  safe_deploy_package_download_id INTEGER,
  zip_sha256 TEXT,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_file_count INTEGER NOT NULL DEFAULT 0,
  link_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS previous_zip_manifest_imports (
  previous_zip_manifest_import_id INTEGER PRIMARY KEY AUTOINCREMENT,
  previous_build_label TEXT,
  current_build_label TEXT NOT NULL,
  previous_manifest_json TEXT NOT NULL DEFAULT '{}',
  current_manifest_json TEXT NOT NULL DEFAULT '{}',
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  import_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS dashboard_notification_card_actions (
  dashboard_notification_card_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER NOT NULL,
  action_kind TEXT NOT NULL DEFAULT 'snooze',
  action_status TEXT NOT NULL DEFAULT 'active',
  snooze_until TEXT,
  action_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mobile_release_control_render_preferences (
  mobile_release_control_render_preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  preference_key TEXT NOT NULL DEFAULT 'mobile_release_cards',
  compact_mode INTEGER NOT NULL DEFAULT 1,
  large_tap_targets INTEGER NOT NULL DEFAULT 1,
  visible_cards_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, preference_key)
);

CREATE TABLE IF NOT EXISTS structured_data_page_previews (
  structured_data_page_preview_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  preview_status TEXT NOT NULL DEFAULT 'needs_review',
  jsonld_excerpt TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  validation_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, schema_type)
);

CREATE TABLE IF NOT EXISTS marketplace_export_download_gates (
  marketplace_export_download_gate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  export_history_id INTEGER,
  validation_run_id INTEGER,
  gate_status TEXT NOT NULL DEFAULT 'blocked_pending_validation',
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  manual_override_required INTEGER NOT NULL DEFAULT 0,
  override_by_user_id INTEGER,
  override_at TEXT,
  gate_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel, export_history_id)
);

CREATE TABLE IF NOT EXISTS release_rollback_row_actions (
  release_rollback_row_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_rollback_checklist_row_id INTEGER NOT NULL,
  action_status TEXT NOT NULL DEFAULT 'not_checked',
  action_note TEXT,
  acted_by_user_id INTEGER,
  acted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS release_manifest_path_filter_runs (
  release_manifest_path_filter_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL,
  diff_kind TEXT,
  path_contains TEXT,
  matched_count INTEGER NOT NULL DEFAULT 0,
  run_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  result_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS deployment_readiness_markdown_exports (
  deployment_readiness_markdown_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  markdown_body TEXT NOT NULL,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_release_matches (
  cloudflare_deployment_release_match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  manifest_hash TEXT,
  match_status TEXT NOT NULL DEFAULT 'needs_review',
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_by_user_id INTEGER,
  matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS promote_live_attempts (
  promote_live_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  attempt_status TEXT NOT NULL DEFAULT 'blocked',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  checklist_blocker_count INTEGER NOT NULL DEFAULT 0,
  smoke_blocker_count INTEGER NOT NULL DEFAULT 0,
  manifest_blocker_count INTEGER NOT NULL DEFAULT 0,
  d1_marker_blocker_count INTEGER NOT NULL DEFAULT 0,
  attempted_by_user_id INTEGER,
  attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_incident_watch_runs (
  post_promotion_incident_watch_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  watch_status TEXT NOT NULL DEFAULT 'not_run',
  runtime_404_count INTEGER NOT NULL DEFAULT 0,
  runtime_500_count INTEGER NOT NULL DEFAULT 0,
  provider_failure_count INTEGER NOT NULL DEFAULT 0,
  incident_rows_created INTEGER NOT NULL DEFAULT 0,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT OR IGNORE INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_179_promotion_control', 'database_build179_promotion_control.sql', CURRENT_TIMESTAMP, 'Build 179 promotion control, LocalBusiness bake approvals, provider/R2 verification, recall gates, marketplace gates, release matching, and post-promotion incident watcher.');

-- Build 180: Go-live execution controls, direct endpoint gates, visual SEO helpers, and post-promotion scheduling.
-- Safe additive migration only. Run after database_build179_promotion_control.sql.

CREATE TABLE IF NOT EXISTS product_qa_safe_apply_runs (
  product_qa_safe_apply_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL DEFAULT 'Build 180',
  product_qa_bulk_fix_queue_id INTEGER,
  blocker_code TEXT NOT NULL,
  run_mode TEXT NOT NULL DEFAULT 'preview',
  apply_status TEXT NOT NULL DEFAULT 'preview_only',
  affected_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  run_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_qa_safe_apply_runs_queue ON product_qa_safe_apply_runs(product_qa_bulk_fix_queue_id, blocker_code, created_at DESC);

CREATE TABLE IF NOT EXISTS local_seo_chart_render_runs (
  local_seo_chart_render_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  metric_kind TEXT NOT NULL DEFAULT 'impressions',
  point_count INTEGER NOT NULL DEFAULT 0,
  min_value REAL NOT NULL DEFAULT 0,
  max_value REAL NOT NULL DEFAULT 0,
  svg_markup TEXT,
  render_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_local_seo_chart_render_runs_page ON local_seo_chart_render_runs(page_path, metric_kind, created_at DESC);

CREATE TABLE IF NOT EXISTS internal_link_graph_interactions (
  internal_link_graph_interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT,
  target_path TEXT,
  filter_kind TEXT NOT NULL DEFAULT 'click_through',
  interaction_status TEXT NOT NULL DEFAULT 'prepared',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_business_d1_export_bakes (
  local_business_d1_export_bake_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  target_paths_json TEXT NOT NULL DEFAULT '[]',
  schema_json TEXT NOT NULL DEFAULT '{}',
  bake_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_webhook_verification_runs (
  provider_webhook_verification_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  endpoint_path TEXT NOT NULL,
  signature_header TEXT,
  timestamp_header TEXT,
  verification_status TEXT NOT NULL DEFAULT 'setup_required',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_provider_webhook_verification_runs_provider ON provider_webhook_verification_runs(provider, checked_at DESC);

CREATE TABLE IF NOT EXISTS r2_signed_download_route_tests (
  r2_signed_download_route_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_path TEXT NOT NULL DEFAULT '/api/admin/private-evidence-download',
  object_key TEXT,
  token_status TEXT NOT NULL DEFAULT 'not_run',
  download_status TEXT NOT NULL DEFAULT 'not_run',
  expiry_status TEXT NOT NULL DEFAULT 'not_run',
  expires_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_evidence_ui_uploads (
  recall_evidence_ui_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  source_page TEXT NOT NULL DEFAULT '/admin/candle-soap-recalls/',
  upload_status TEXT NOT NULL DEFAULT 'needs_upload',
  evidence_url TEXT,
  r2_object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_endpoint_gate_checks (
  recall_endpoint_gate_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  endpoint_path TEXT NOT NULL DEFAULT '/api/admin/candle-soap-recall-notifications',
  legacy_lock_status TEXT,
  release_gate_status TEXT,
  endpoint_gate_status TEXT NOT NULL DEFAULT 'blocked',
  checked_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_recall_endpoint_gate_checks_batch ON recall_endpoint_gate_checks(batch_number, checked_at DESC);

CREATE TABLE IF NOT EXISTS accountant_zip_endpoint_logs (
  accountant_zip_endpoint_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT,
  endpoint_path TEXT NOT NULL DEFAULT '/api/admin/accounting-monthly-summary-export',
  zip_sha256 TEXT,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  evidence_file_count INTEGER NOT NULL DEFAULT 0,
  log_status TEXT NOT NULL DEFAULT 'prepared',
  safe_deploy_package_download_id INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS previous_zip_binary_comparisons (
  previous_zip_binary_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  previous_filename TEXT,
  current_filename TEXT,
  previous_sha256 TEXT,
  current_sha256 TEXT,
  added_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  removed_count INTEGER NOT NULL DEFAULT 0,
  comparison_status TEXT NOT NULL DEFAULT 'prepared',
  comparison_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_notification_visibility_states (
  dashboard_notification_visibility_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_notification_card_id INTEGER,
  visibility_status TEXT NOT NULL DEFAULT 'visible',
  snooze_until TEXT,
  dismissed_at TEXT,
  user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dashboard_notification_card_id, user_id)
);

CREATE TABLE IF NOT EXISTS mobile_release_control_layout_runs (
  mobile_release_control_layout_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  layout_key TEXT NOT NULL DEFAULT 'phone_release_cards',
  rendered_card_count INTEGER NOT NULL DEFAULT 0,
  large_tap_targets INTEGER NOT NULL DEFAULT 1,
  layout_status TEXT NOT NULL DEFAULT 'prepared',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_preflight_structured_data_excerpts (
  deployment_preflight_structured_data_excerpt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  excerpt_status TEXT NOT NULL DEFAULT 'needs_review',
  jsonld_excerpt TEXT,
  issue_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_path, schema_type)
);

CREATE TABLE IF NOT EXISTS marketplace_download_block_events (
  marketplace_download_block_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  gate_status TEXT NOT NULL,
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  blocked INTEGER NOT NULL DEFAULT 1,
  requested_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS release_control_row_status_actions (
  release_control_row_status_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  row_kind TEXT NOT NULL,
  source_row_id INTEGER,
  action_status TEXT NOT NULL DEFAULT 'not_checked',
  action_note TEXT,
  acted_by_user_id INTEGER,
  acted_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS release_manifest_filter_drawer_runs (
  release_manifest_filter_drawer_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_key TEXT NOT NULL,
  path_contains TEXT,
  diff_kind TEXT,
  matched_count INTEGER NOT NULL DEFAULT 0,
  drawer_status TEXT NOT NULL DEFAULT 'prepared',
  result_json TEXT NOT NULL DEFAULT '[]',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deploy_readiness_score_trend_exports (
  deploy_readiness_score_trend_export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  point_count INTEGER NOT NULL DEFAULT 0,
  latest_score INTEGER NOT NULL DEFAULT 0,
  markdown_body TEXT NOT NULL,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloudflare_deployment_auto_matches (
  cloudflare_deployment_auto_match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_history_id INTEGER,
  build_label TEXT,
  branch_name TEXT,
  commit_sha TEXT,
  manifest_hash TEXT,
  auto_match_status TEXT NOT NULL DEFAULT 'needs_review',
  match_score INTEGER NOT NULL DEFAULT 0,
  matched_by_user_id INTEGER,
  matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS promote_live_ui_gate_states (
  promote_live_ui_gate_state_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  promote_button_status TEXT NOT NULL DEFAULT 'disabled',
  readiness_score INTEGER NOT NULL DEFAULT 0,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  gate_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_watcher_schedule_runs (
  post_promotion_watcher_schedule_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_label TEXT NOT NULL,
  schedule_kind TEXT NOT NULL DEFAULT 'manual',
  watch_window_minutes INTEGER NOT NULL DEFAULT 60,
  run_status TEXT NOT NULL DEFAULT 'queued',
  triggered_from_path TEXT DEFAULT '/admin/post-deploy-smoke-tests/',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO schema_migration_ledger (migration_key, file_name, migration_label, applied_at, notes)
VALUES ('build_180_go_live_execution', 'database_build180_go_live_execution.sql', 'Build 180 go-live execution controls', CURRENT_TIMESTAMP, 'Safe additive Build 180 schema for direct gated apply/download/send/visibility controls.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, migration_label=excluded.migration_label, notes=excluded.notes;
