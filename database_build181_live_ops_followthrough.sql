-- Devil n Dove Build 181 — live ops follow-through, private evidence downloads, marketplace overrides, and SEO content refresh tracking
-- Safe additive D1 migration. Run after database_build180_go_live_execution.sql.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  migration_label TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS private_evidence_download_tokens (
  private_evidence_download_token_id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL,
  bucket_label TEXT NOT NULL DEFAULT 'accounting_evidence',
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  max_download_count INTEGER NOT NULL DEFAULT 1,
  download_count INTEGER NOT NULL DEFAULT 0,
  token_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_downloaded_at TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_private_evidence_tokens_object ON private_evidence_download_tokens(object_key, bucket_label, token_status);
CREATE INDEX IF NOT EXISTS idx_private_evidence_tokens_expiry ON private_evidence_download_tokens(expires_at, token_status);

CREATE TABLE IF NOT EXISTS private_evidence_download_audit_events (
  private_evidence_download_audit_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT,
  bucket_label TEXT,
  event_status TEXT NOT NULL DEFAULT 'attempted',
  http_status INTEGER,
  token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_private_evidence_download_audit_object ON private_evidence_download_audit_events(object_key, created_at);

CREATE TABLE IF NOT EXISTS product_qa_blocker_preview_counts (
  product_qa_blocker_preview_count_id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_code TEXT NOT NULL,
  affected_products INTEGER NOT NULL DEFAULT 0,
  preview_item_count INTEGER NOT NULL DEFAULT 0,
  safe_apply_candidate_count INTEGER NOT NULL DEFAULT 0,
  manual_only_count INTEGER NOT NULL DEFAULT 0,
  latest_queue_id INTEGER,
  count_status TEXT NOT NULL DEFAULT 'prepared',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_qa_blocker_preview_counts_code ON product_qa_blocker_preview_counts(blocker_code, created_at);

CREATE TABLE IF NOT EXISTS marketplace_export_gate_overrides (
  marketplace_export_gate_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  gate_key TEXT NOT NULL DEFAULT 'download_gate',
  override_status TEXT NOT NULL DEFAULT 'requested',
  reason TEXT,
  expires_at TEXT,
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_gate_overrides_channel ON marketplace_export_gate_overrides(channel, override_status, expires_at);

CREATE TABLE IF NOT EXISTS marketplace_gate_badge_snapshots (
  marketplace_gate_badge_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  badge_status TEXT NOT NULL DEFAULT 'unknown',
  hard_blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  badge_label TEXT,
  blocker_reason TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_gate_badges_channel ON marketplace_gate_badge_snapshots(channel, created_at);

CREATE TABLE IF NOT EXISTS recall_evidence_upload_requests (
  recall_evidence_upload_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  recall_id INTEGER,
  requested_file_kind TEXT NOT NULL DEFAULT 'signature_evidence',
  upload_widget_status TEXT NOT NULL DEFAULT 'needs_upload',
  r2_target_prefix TEXT,
  evidence_url TEXT,
  r2_object_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_recall_upload_requests_batch ON recall_evidence_upload_requests(batch_number, upload_widget_status);

CREATE TABLE IF NOT EXISTS local_business_admin_export_runs (
  local_business_admin_export_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings',
  output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json',
  row_count INTEGER NOT NULL DEFAULT 0,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  export_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public_page_content_refreshes (
  public_page_content_refresh_id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  target_phrase TEXT NOT NULL,
  placement_kind TEXT NOT NULL DEFAULT 'body_copy',
  refresh_status TEXT NOT NULL DEFAULT 'applied_static',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_public_content_refresh_page ON public_page_content_refreshes(page_path, target_phrase);

CREATE TABLE IF NOT EXISTS provider_webhook_crypto_test_vectors (
  provider_webhook_crypto_test_vector_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
  header_name TEXT,
  test_status TEXT NOT NULL DEFAULT 'documented',
  replay_window_seconds INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manifest_drawer_saved_filters (
  manifest_drawer_saved_filter_id INTEGER PRIMARY KEY AUTOINCREMENT,
  filter_label TEXT NOT NULL,
  path_prefix TEXT,
  diff_kind TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_notification_action_buttons (
  dashboard_notification_action_button_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_kind TEXT NOT NULL,
  source_row_id INTEGER,
  action_kind TEXT NOT NULL DEFAULT 'snooze',
  button_label TEXT,
  action_status TEXT NOT NULL DEFAULT 'available',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS post_promotion_watcher_execution_logs (
  post_promotion_watcher_execution_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_promotion_watcher_schedule_run_id INTEGER,
  build_label TEXT NOT NULL DEFAULT 'Build 181',
  execution_status TEXT NOT NULL DEFAULT 'queued',
  checked_url_count INTEGER NOT NULL DEFAULT 0,
  failed_url_count INTEGER NOT NULL DEFAULT 0,
  incident_count INTEGER NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Admin pages', 'admin/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Admin pages');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Functions', 'functions/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Functions');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Schema SQL', 'database_', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Schema SQL');
INSERT INTO manifest_drawer_saved_filters (filter_label, path_prefix, diff_kind, is_default, created_at)
SELECT 'Local SEO data', 'data/site/', 'changed', 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM manifest_drawer_saved_filters WHERE filter_label='Local SEO data');

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES ('build_181_live_ops_followthrough', 'database_build181_live_ops_followthrough.sql', CURRENT_TIMESTAMP, 'Safe additive Build 181 schema for private evidence signed downloads, recall upload requests, QA blocker counts, marketplace overrides, local SEO content refresh tracking, and live-ops follow-through rows.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
