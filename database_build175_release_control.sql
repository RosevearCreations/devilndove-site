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
