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

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_180_go_live_execution', 'database_build180_go_live_execution.sql', CURRENT_TIMESTAMP, 'Safe additive Build 180 schema for direct gated apply/download/send/visibility controls.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
