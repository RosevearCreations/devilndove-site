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
