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
