-- Release 461 — Content Automation Studio + publication schema authority
-- Development-only forward/additive migration.
--
-- Boundary:
--   * This file is migration authority only; request/runtime code must not execute DDL.
--   * No historical migration replay.
--   * Existing structurally stale tables are not silently repaired here; read-only
--     acceptance/preflight must surface drift for a deliberate forward repair.
--   * Provider publication/execution remains closed until separately accepted.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_projects (
  content_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_key TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'product',
  source_id TEXT NOT NULL,
  product_id INTEGER,
  project_title TEXT NOT NULL,
  project_status TEXT NOT NULL DEFAULT 'draft',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  public_release_status TEXT NOT NULL DEFAULT 'private',
  story_angle TEXT,
  factual_summary TEXT,
  internal_notes TEXT,
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  content_policy_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id INTEGER,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_type, source_id)
);

CREATE TABLE IF NOT EXISTS content_project_media (
  content_project_media_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_id INTEGER NOT NULL,
  media_asset_id INTEGER,
  product_image_id INTEGER,
  archive_key TEXT NOT NULL,
  archive_path TEXT NOT NULL,
  source_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  original_filename TEXT,
  mime_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  selection_score INTEGER NOT NULL DEFAULT 0,
  selection_reason TEXT,
  safety_status TEXT NOT NULL DEFAULT 'needs_review',
  consent_record_id INTEGER,
  is_selected INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  source_metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_project_id, archive_key),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_project_deliverables (
  content_project_deliverable_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_id INTEGER NOT NULL,
  deliverable_key TEXT NOT NULL,
  channel_key TEXT NOT NULL,
  deliverable_type TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT,
  script_text TEXT,
  body_content TEXT,
  asset_plan_json TEXT NOT NULL DEFAULT '{}',
  aspect_ratio TEXT,
  target_duration_seconds INTEGER NOT NULL DEFAULT 0,
  output_url TEXT,
  thumbnail_url TEXT,
  deliverable_status TEXT NOT NULL DEFAULT 'planned',
  approval_status TEXT NOT NULL DEFAULT 'needs_review',
  review_notes TEXT,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  published_at TEXT,
  social_post_queue_id INTEGER,
  copy_locked INTEGER NOT NULL DEFAULT 0,
  generated_by TEXT NOT NULL DEFAULT 'factual_template',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_project_id, deliverable_key),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_render_jobs (
  content_render_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_deliverable_id INTEGER NOT NULL,
  render_provider TEXT NOT NULL DEFAULT 'manual_export',
  render_status TEXT NOT NULL DEFAULT 'planned',
  render_payload_json TEXT NOT NULL DEFAULT '{}',
  output_url TEXT,
  error_text TEXT,
  requested_by_user_id INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_project_deliverable_id) REFERENCES content_project_deliverables(content_project_deliverable_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_project_events (
  content_project_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_project_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_projects_source
  ON content_projects(source_type, source_id, project_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_content_project_media_project
  ON content_project_media(content_project_id, is_selected, selection_score DESC, sort_order);
CREATE INDEX IF NOT EXISTS idx_content_deliverables_project
  ON content_project_deliverables(content_project_id, channel_key, deliverable_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_content_render_jobs_deliverable
  ON content_render_jobs(content_project_deliverable_id, render_status, created_at);
CREATE INDEX IF NOT EXISTS idx_content_project_events_project
  ON content_project_events(content_project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS content_publications (
  content_publication_id INTEGER PRIMARY KEY AUTOINCREMENT,
  publication_key TEXT NOT NULL UNIQUE,
  content_project_id INTEGER NOT NULL,
  content_project_deliverable_id INTEGER,
  destination TEXT NOT NULL DEFAULT 'workshop_journal',
  publication_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_content TEXT,
  hero_media_url TEXT,
  hero_alt_text TEXT,
  media_urls_json TEXT NOT NULL DEFAULT '[]',
  product_path TEXT,
  canonical_path TEXT,
  meta_title TEXT,
  meta_description TEXT,
  schema_json TEXT NOT NULL DEFAULT '{}',
  content_status TEXT NOT NULL DEFAULT 'draft',
  review_notes TEXT,
  copy_locked INTEGER NOT NULL DEFAULT 0,
  metrics_json TEXT NOT NULL DEFAULT '{}',
  approved_by_user_id INTEGER,
  approved_at TEXT,
  published_by_user_id INTEGER,
  published_at TEXT,
  unpublished_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(destination, publication_slug),
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE,
  FOREIGN KEY (content_project_deliverable_id) REFERENCES content_project_deliverables(content_project_deliverable_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS content_publication_events (
  content_publication_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_publication_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id INTEGER,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_publication_id) REFERENCES content_publications(content_publication_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_publications_project
  ON content_publications(content_project_id, destination, content_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_publications_public
  ON content_publications(destination, content_status, published_at DESC, content_publication_id DESC);
CREATE INDEX IF NOT EXISTS idx_content_publication_events_publication
  ON content_publication_events(content_publication_id, created_at DESC);

PRAGMA foreign_key_check;
