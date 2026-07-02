-- Devil n Dove Build 201 — Creative Asset Intelligence Platform (CAIP) foundation.
-- Run after database_build199_content_automation_studio.sql and database_build200_content_publication_release_board.sql.
-- Additive and safe to rerun. CAIP is reference-only: this migration does not copy, move,
-- delete, overwrite, or make public any R2 object, product image, media asset, or content record.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS creative_projects (
  creative_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_key TEXT NOT NULL UNIQUE,
  content_project_id INTEGER UNIQUE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  product_id INTEGER,
  project_title TEXT NOT NULL,
  project_status TEXT NOT NULL DEFAULT 'intake',
  governance_status TEXT NOT NULL DEFAULT 'needs_review',
  lifecycle_stage TEXT NOT NULL DEFAULT 'intake',
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  policy_profile_json TEXT NOT NULL DEFAULT '{}',
  latest_manifest_version INTEGER NOT NULL DEFAULT 1,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_type, source_id),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_assets (
  creative_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  content_project_media_id INTEGER,
  media_asset_id INTEGER,
  product_image_id INTEGER,
  asset_key TEXT NOT NULL,
  source_url TEXT,
  source_fingerprint TEXT NOT NULL,
  logical_archive_path TEXT,
  source_safety_status TEXT NOT NULL DEFAULT 'needs_review',
  rights_status TEXT NOT NULL DEFAULT 'needs_review',
  asset_status TEXT NOT NULL DEFAULT 'active',
  media_type TEXT NOT NULL DEFAULT 'image',
  original_filename TEXT,
  mime_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_source_selected INTEGER NOT NULL DEFAULT 0,
  is_source_featured INTEGER NOT NULL DEFAULT 0,
  manual_tags_json TEXT NOT NULL DEFAULT '[]',
  manual_caption TEXT,
  source_metadata_json TEXT NOT NULL DEFAULT '{}',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_refreshed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, asset_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (content_project_media_id) REFERENCES content_project_media(content_project_media_id) ON DELETE SET NULL,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(media_asset_id) ON DELETE SET NULL,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_asset_analyses (
  creative_asset_analysis_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_asset_id INTEGER NOT NULL,
  analysis_key TEXT NOT NULL,
  analysis_provider TEXT NOT NULL DEFAULT 'metadata_heuristic',
  provider_version TEXT NOT NULL DEFAULT 'v1',
  analysis_status TEXT NOT NULL DEFAULT 'complete',
  technical_score INTEGER NOT NULL DEFAULT 0,
  story_score INTEGER NOT NULL DEFAULT 0,
  reuse_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0,
  requires_human_review INTEGER NOT NULL DEFAULT 1,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  source_snapshot_fingerprint TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_asset_id, analysis_key),
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_asset_recommendations (
  creative_asset_recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER,
  recommendation_key TEXT NOT NULL,
  destination_key TEXT NOT NULL,
  intended_role TEXT NOT NULL,
  fit_score INTEGER NOT NULL DEFAULT 0,
  rationale_json TEXT NOT NULL DEFAULT '{}',
  recommendation_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, recommendation_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_story_evidence (
  creative_story_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  creative_asset_id INTEGER,
  evidence_key TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT 'source_fact',
  source_reference TEXT,
  claim_text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal',
  verification_status TEXT NOT NULL DEFAULT 'source_record',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  evidence_json TEXT NOT NULL DEFAULT '{}',
  copy_locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, evidence_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_asset_id) REFERENCES creative_assets(creative_asset_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_story_segments (
  creative_story_segment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  segment_key TEXT NOT NULL,
  segment_type TEXT NOT NULL DEFAULT 'context',
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  narrative_text TEXT NOT NULL,
  evidence_keys_json TEXT NOT NULL DEFAULT '[]',
  segment_status TEXT NOT NULL DEFAULT 'draft',
  copy_locked INTEGER NOT NULL DEFAULT 0,
  reviewer_notes TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, segment_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_policy_decisions (
  creative_policy_decision_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  policy_key TEXT NOT NULL,
  decision_status TEXT NOT NULL DEFAULT 'needs_review',
  severity TEXT NOT NULL DEFAULT 'info',
  rationale TEXT,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  decided_by_user_id INTEGER,
  decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_project_id, policy_key),
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_intelligence_runs (
  creative_intelligence_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  run_key TEXT NOT NULL UNIQUE,
  run_type TEXT NOT NULL DEFAULT 'ingestion_sync',
  provider_key TEXT NOT NULL DEFAULT 'local_metadata_v1',
  run_status TEXT NOT NULL DEFAULT 'completed',
  input_summary_json TEXT NOT NULL DEFAULT '{}',
  output_summary_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT,
  requested_by_user_id INTEGER,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_project_events (
  creative_project_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_projects_content_project
  ON creative_projects(content_project_id, project_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_assets_project
  ON creative_assets(creative_project_id, rights_status, asset_status, sort_order, creative_asset_id);
CREATE INDEX IF NOT EXISTS idx_creative_asset_analyses_asset
  ON creative_asset_analyses(creative_asset_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_creative_recommendations_project
  ON creative_asset_recommendations(creative_project_id, destination_key, recommendation_status, fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_creative_evidence_project
  ON creative_story_evidence(creative_project_id, review_status, verification_status, creative_story_evidence_id);
CREATE INDEX IF NOT EXISTS idx_creative_segments_project
  ON creative_story_segments(creative_project_id, sort_order, creative_story_segment_id);
CREATE INDEX IF NOT EXISTS idx_creative_policy_project
  ON creative_policy_decisions(creative_project_id, decision_status, severity);
CREATE INDEX IF NOT EXISTS idx_creative_runs_project
  ON creative_intelligence_runs(creative_project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_events_project
  ON creative_project_events(creative_project_id, created_at DESC);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_201_creative_asset_intelligence_platform',
  'database_build201_creative_asset_intelligence_platform.sql',
  CURRENT_TIMESTAMP,
  'Adds CAIP foundation: canonical reference-only creative projects/assets, deterministic metadata analysis, rights-aware reuse recommendations, evidence-backed story segments, policy decisions, runs, manifests, and audit events. No AI provider, media copying, auto-publish, or source-media deletion.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
