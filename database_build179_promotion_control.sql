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
