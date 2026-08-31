-- Release 464 Update 2 — Operational Acceptance and Recovery
-- Forward-only canonical migration. Development first; exact same file to Production only during deliberate promotion.

CREATE TABLE IF NOT EXISTS operational_retention_reviews (
  operational_retention_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_type TEXT NOT NULL,
  older_than_days INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'archived_pending_approval',
  candidate_count INTEGER NOT NULL DEFAULT 0,
  archive_item_count INTEGER NOT NULL DEFAULT 0,
  archive_reference TEXT,
  requested_by_user_id INTEGER,
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by_user_id INTEGER,
  approved_at TEXT,
  consumed_by_user_id INTEGER,
  consumed_at TEXT,
  admin_note TEXT,
  CHECK (older_than_days BETWEEN 7 AND 365),
  CHECK (review_status IN ('archived_pending_approval','approved','rejected','consumed'))
);

CREATE INDEX IF NOT EXISTS idx_operational_retention_reviews_resource_status
  ON operational_retention_reviews(resource_type, review_status, requested_at DESC);

CREATE TABLE IF NOT EXISTS operational_retention_archive_items (
  operational_retention_archive_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  operational_retention_review_id INTEGER NOT NULL,
  resource_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operational_retention_review_id)
    REFERENCES operational_retention_reviews(operational_retention_review_id)
    ON DELETE RESTRICT,
  UNIQUE (operational_retention_review_id, resource_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_operational_retention_archive_review
  ON operational_retention_archive_items(operational_retention_review_id, source_id);

CREATE TABLE IF NOT EXISTS operational_recovery_events (
  operational_recovery_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  runtime_incident_id INTEGER,
  recovery_kind TEXT NOT NULL,
  recovery_status TEXT NOT NULL,
  probe_target TEXT,
  result_json TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (recovery_status IN ('verified','failed','unsupported'))
);

CREATE INDEX IF NOT EXISTS idx_operational_recovery_events_incident
  ON operational_recovery_events(runtime_incident_id, created_at DESC);
