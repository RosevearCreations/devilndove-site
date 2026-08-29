-- Devil n Dove Release 448 — CAIP reviewed evidence -> Content Studio handoff authority.
-- Additive/reference-only: no media bytes, source mutation, provider execution, or publication.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS caip_content_handoffs (
  caip_content_handoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_id INTEGER NOT NULL,
  content_project_id INTEGER NOT NULL,
  handoff_status TEXT NOT NULL DEFAULT 'draft' CHECK (handoff_status IN ('draft','ready_for_review','reviewed','archived')),
  approved_marker_count INTEGER NOT NULL DEFAULT 0 CHECK (approved_marker_count >= 0),
  approved_story_evidence_count INTEGER NOT NULL DEFAULT 0 CHECK (approved_story_evidence_count >= 0),
  approved_segment_count INTEGER NOT NULL DEFAULT 0 CHECK (approved_segment_count >= 0),
  package_json TEXT NOT NULL DEFAULT '{}',
  prepared_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  prepared_at TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creative_project_id) REFERENCES creative_projects(creative_project_id) ON DELETE CASCADE,
  FOREIGN KEY (content_project_id) REFERENCES content_projects(content_project_id) ON DELETE CASCADE,
  FOREIGN KEY (prepared_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE(creative_project_id, content_project_id)
);

CREATE TABLE IF NOT EXISTS caip_content_handoff_evidence (
  caip_content_handoff_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  caip_content_handoff_id INTEGER NOT NULL,
  creative_media_evidence_range_id INTEGER NOT NULL,
  creative_story_evidence_id INTEGER NOT NULL,
  evidence_role TEXT NOT NULL DEFAULT 'supporting' CHECK (evidence_role IN ('primary','supporting','context')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caip_content_handoff_id) REFERENCES caip_content_handoffs(caip_content_handoff_id) ON DELETE CASCADE,
  FOREIGN KEY (creative_media_evidence_range_id) REFERENCES creative_media_evidence_ranges(creative_media_evidence_range_id) ON DELETE RESTRICT,
  FOREIGN KEY (creative_story_evidence_id) REFERENCES creative_story_evidence(creative_story_evidence_id) ON DELETE RESTRICT,
  UNIQUE(caip_content_handoff_id, creative_media_evidence_range_id)
);

CREATE INDEX IF NOT EXISTS idx_caip_content_handoffs_project ON caip_content_handoffs(creative_project_id,handoff_status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_caip_content_handoff_evidence_handoff ON caip_content_handoff_evidence(caip_content_handoff_id,sort_order,caip_content_handoff_evidence_id);

SELECT name FROM sqlite_master WHERE type='table' AND name IN ('caip_content_handoffs','caip_content_handoff_evidence') ORDER BY name;
PRAGMA foreign_key_check;
