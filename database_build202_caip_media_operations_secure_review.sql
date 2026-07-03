-- Devil n Dove Build 202 — CAIP media verification, derivative planning, and secure review.
-- Run after database_build201_creative_asset_intelligence_platform.sql.
-- Additive and safe to rerun. This migration records technical observations, immutable plans,
-- and short-lived review-grant metadata only. It never copies, transforms, publishes, moves,
-- reorders, deletes, or makes public any original product image, video, media asset, or R2 object.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS creative_asset_probe_jobs (
  creative_asset_probe_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  job_key TEXT NOT NULL UNIQUE,
  probe_mode TEXT NOT NULL DEFAULT 'metadata_r2_head',
  job_status TEXT NOT NULL DEFAULT 'queued',
  source_snapshot_fingerprint TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  input_summary_json TEXT NOT NULL DEFAULT '{}',
  output_summary_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT,
  requested_by_user_id INTEGER,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_technical_observations (
  creative_asset_technical_observation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  observation_key TEXT NOT NULL,
  creative_asset_probe_job_id INTEGER,
  source_snapshot_fingerprint TEXT,
  storage_provider TEXT,
  bucket_name TEXT,
  object_key TEXT,
  observed_public_url TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  etag TEXT,
  uploaded_at TEXT,
  width_px INTEGER,
  height_px INTEGER,
  orientation TEXT,
  duration_seconds REAL,
  codec TEXT,
  probe_status TEXT NOT NULL DEFAULT 'metadata_only',
  probe_scope TEXT NOT NULL DEFAULT 'catalog_metadata_only',
  evidence_json TEXT NOT NULL DEFAULT '{}',
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_asset_id, observation_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_probe_job_id) REFERENCES creative_asset_probe_jobs(creative_asset_probe_job_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_derivative_recipes (
  creative_derivative_recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  recipe_key TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  output_role TEXT NOT NULL,
  output_format TEXT NOT NULL,
  target_width_px INTEGER,
  target_height_px INTEGER,
  aspect_ratio TEXT,
  transformation_json TEXT NOT NULL DEFAULT '{}',
  source_policy_json TEXT NOT NULL DEFAULT '{}',
  recipe_hash TEXT NOT NULL,
  recipe_status TEXT NOT NULL DEFAULT 'draft',
  is_immutable INTEGER NOT NULL DEFAULT 1,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  retired_by_user_id INTEGER,
  retired_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, recipe_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_derivatives (
  creative_asset_derivative_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  creative_derivative_recipe_id INTEGER NOT NULL,
  derivative_key TEXT NOT NULL UNIQUE,
  derivative_status TEXT NOT NULL DEFAULT 'planned',
  source_snapshot_fingerprint TEXT,
  output_storage_provider TEXT,
  output_bucket_name TEXT,
  output_object_key TEXT,
  output_url TEXT,
  output_mime_type TEXT,
  output_file_size_bytes INTEGER,
  checksum_algorithm TEXT,
  output_checksum TEXT,
  verification_status TEXT NOT NULL DEFAULT 'not_created',
  verification_evidence_json TEXT NOT NULL DEFAULT '{}',
  verified_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_derivative_recipe_id) REFERENCES creative_derivative_recipes(creative_derivative_recipe_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_access_grants (
  creative_asset_access_grant_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER NOT NULL,
  grant_key TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  access_scope TEXT NOT NULL DEFAULT 'admin_authenticated_review_proxy',
  bound_user_id INTEGER,
  expires_at TEXT NOT NULL,
  max_access_count INTEGER NOT NULL DEFAULT 25,
  access_count INTEGER NOT NULL DEFAULT 0,
  revoked_at TEXT,
  revoked_by_user_id INTEGER,
  last_accessed_at TEXT,
  source_snapshot_fingerprint TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_access_audit (
  creative_asset_access_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_asset_access_grant_id INTEGER,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  outcome TEXT NOT NULL DEFAULT 'recorded',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_asset_access_grant_id) REFERENCES creative_asset_access_grants(creative_asset_access_grant_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_provider_profiles (
  creative_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  capability_key TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL DEFAULT 'disabled',
  endpoint_policy TEXT NOT NULL DEFAULT 'not_configured',
  config_redacted_json TEXT NOT NULL DEFAULT '{}',
  consent_required INTEGER NOT NULL DEFAULT 1,
  default_budget_cap_cents INTEGER NOT NULL DEFAULT 0,
  enabled_at TEXT,
  disabled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creative_execution_budget_controls (
  creative_execution_budget_control_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER,
  capability_key TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'CAD',
  per_run_cap_cents INTEGER NOT NULL DEFAULT 0,
  monthly_cap_cents INTEGER NOT NULL DEFAULT 0,
  policy_status TEXT NOT NULL DEFAULT 'disabled',
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, capability_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_probe_jobs_asset
  ON creative_asset_probe_jobs(creative_project_id, creative_asset_id, job_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_observations_asset
  ON creative_asset_technical_observations(creative_project_id, creative_asset_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_recipes_asset
  ON creative_derivative_recipes(creative_project_id, creative_asset_id, recipe_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_derivatives_asset
  ON creative_asset_derivatives(creative_project_id, creative_asset_id, derivative_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_access_grants_asset
  ON creative_asset_access_grants(creative_project_id, creative_asset_id, expires_at, revoked_at);
CREATE INDEX IF NOT EXISTS idx_creative_access_audit_grant
  ON creative_asset_access_audit(creative_asset_access_grant_id, created_at DESC);

INSERT INTO creative_provider_profiles (
  provider_key, display_name, capability_key, lifecycle_status, endpoint_policy,
  config_redacted_json, consent_required, default_budget_cap_cents, created_at, updated_at
) VALUES
  ('r2_metadata_probe', 'Bound R2 metadata probe', 'technical_probe', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('derivative_renderer', 'Derivative renderer adapter', 'render', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('thumbnail_builder', 'Thumbnail builder adapter', 'thumbnail', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('social_export_adapter', 'Social export adapter', 'export', 'disabled', 'not_configured', '{}', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(provider_key) DO NOTHING;

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_202_caip_media_operations_secure_review',
  'database_build202_caip_media_operations_secure_review.sql',
  CURRENT_TIMESTAMP,
  'Adds CAIP metadata-only/R2-head probe records, immutable derivative recipes/plans, disabled provider/budget controls, and same-origin authenticated secure-review grant/audit metadata. Does not transform, copy, publish, delete, or expose source media publicly.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
