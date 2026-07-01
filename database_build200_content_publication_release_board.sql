-- Devil n Dove Build 200 — Content Publication Release Board.
-- Run after database_build199_content_automation_studio.sql.
-- Additive and safe to rerun. It creates review-first public drafting/release records;
-- it never moves, deletes, overwrites, or duplicates original product/R2 media.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

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

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build_200_content_publication_release_board',
  'database_build200_content_publication_release_board.sql',
  CURRENT_TIMESTAMP,
  'Adds review-first Workshop Journal and website-gallery release drafts, public safety readiness checks, copy locks, publish/unpublish audit events, and explainable manual performance fields. No automatic publishing or media deletion.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name, notes=excluded.notes;
