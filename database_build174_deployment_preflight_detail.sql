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
