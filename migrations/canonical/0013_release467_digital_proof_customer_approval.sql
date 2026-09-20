-- Release 467 Build 213 — Digital Proof & Customer Approval
-- Versioned customer-facing proof/approval evidence over existing Custom Work.
-- Packaging Studio retains layout/version ownership; CAIP private originals are never exposed here.

CREATE TABLE IF NOT EXISTS custom_request_proof_versions (
  custom_request_proof_version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL CHECK(version_number >= 1),
  proof_token TEXT NOT NULL UNIQUE,
  proof_title TEXT,
  customer_message TEXT,
  proof_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(proof_status IN ('draft','sent','viewed','changes_requested','approved','expired','superseded')),
  source_kind TEXT NOT NULL DEFAULT 'text_only'
    CHECK(source_kind IN ('text_only','customer_safe_url','stage_photo','packaging_version')),
  proof_preview_url TEXT,
  custom_order_stage_photo_id INTEGER,
  packaging_project_id INTEGER,
  packaging_project_version_id INTEGER,
  source_note TEXT,
  expires_at TEXT,
  sent_at TEXT,
  first_viewed_at TEXT,
  customer_response_note TEXT,
  customer_responded_at TEXT,
  approved_at TEXT,
  changes_requested_at TEXT,
  superseded_at TEXT,
  expired_at TEXT,
  internal_production_approval_required INTEGER NOT NULL DEFAULT 0 CHECK(internal_production_approval_required IN (0,1)),
  internal_production_approval_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK(internal_production_approval_status IN ('not_required','pending','approved','rejected')),
  internal_production_approval_note TEXT,
  internal_approved_by_user_id INTEGER,
  internal_approved_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_order_stage_photo_id) REFERENCES custom_order_stage_photos(custom_order_stage_photo_id) ON DELETE SET NULL,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE SET NULL,
  FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL,
  UNIQUE(custom_request_id, version_number)
);

CREATE TABLE IF NOT EXISTS custom_request_proof_events (
  custom_request_proof_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_proof_version_id INTEGER NOT NULL,
  custom_request_id INTEGER NOT NULL,
  event_type TEXT NOT NULL
    CHECK(event_type IN ('created','sent','viewed','changes_requested','approved','expired','superseded','internal_approved','internal_rejected','internal_reset')),
  actor_type TEXT NOT NULL DEFAULT 'admin'
    CHECK(actor_type IN ('admin','customer','system')),
  event_note TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_proof_version_id) REFERENCES custom_request_proof_versions(custom_request_proof_version_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_request_proof_versions_request
  ON custom_request_proof_versions(custom_request_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_custom_request_proof_versions_token
  ON custom_request_proof_versions(proof_token, proof_status);
CREATE INDEX IF NOT EXISTS idx_custom_request_proof_versions_status
  ON custom_request_proof_versions(proof_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_custom_request_proof_events_version
  ON custom_request_proof_events(custom_request_proof_version_id, created_at);
CREATE INDEX IF NOT EXISTS idx_custom_request_proof_events_request
  ON custom_request_proof_events(custom_request_id, created_at);

-- Migration creates no customer proof/version/event rows.
SELECT COUNT(*) AS build213_proof_tables
FROM sqlite_master
WHERE type='table'
  AND name IN ('custom_request_proof_versions','custom_request_proof_events');
PRAGMA foreign_key_check;
