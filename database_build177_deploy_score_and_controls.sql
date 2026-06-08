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
