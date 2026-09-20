-- Release 467 Build 211 — Manufacturing Triage & Route Proposal
-- Staff-reviewed extension of the existing custom_requests journey.
-- Candidate processes reference canonical inventory_processes; customer requirements never become an automatic feasibility promise.

CREATE TABLE IF NOT EXISTS custom_request_manufacturing_triage (
  custom_request_manufacturing_triage_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL UNIQUE,
  triage_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(triage_status IN ('draft','reviewed','clarification_required','on_hold')),
  feasibility_state TEXT NOT NULL DEFAULT 'needs_review'
    CHECK(feasibility_state IN ('needs_review','candidate_route','feasible_with_review','clarification_required','not_feasible','on_hold')),
  specialist_review_required INTEGER NOT NULL DEFAULT 0 CHECK(specialist_review_required IN (0,1)),
  specialist_review_notes TEXT,
  proof_sample_required INTEGER NOT NULL DEFAULT 0 CHECK(proof_sample_required IN (0,1)),
  proof_sample_notes TEXT,
  material_unknowns TEXT,
  supplied_item_review_state TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK(supplied_item_review_state IN ('not_applicable','needs_review','acceptable_for_assessment','limitations_required','declined')),
  supplied_item_review_notes TEXT,
  next_clarification_question TEXT,
  route_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_request_route_processes (
  custom_request_route_process_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  inventory_process_id INTEGER NOT NULL,
  route_order INTEGER NOT NULL CHECK(route_order >= 1),
  candidate_role TEXT NOT NULL DEFAULT 'primary'
    CHECK(candidate_role IN ('primary','secondary','finishing','support','alternate')),
  route_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_process_id) REFERENCES inventory_processes(inventory_process_id) ON DELETE RESTRICT,
  UNIQUE(custom_request_id, inventory_process_id),
  UNIQUE(custom_request_id, route_order)
);

CREATE INDEX IF NOT EXISTS idx_custom_request_triage_status_updated
  ON custom_request_manufacturing_triage(triage_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_request_triage_feasibility_updated
  ON custom_request_manufacturing_triage(feasibility_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_request_route_processes_request_order
  ON custom_request_route_processes(custom_request_id, route_order);
CREATE INDEX IF NOT EXISTS idx_custom_request_route_processes_process
  ON custom_request_route_processes(inventory_process_id, custom_request_id);

-- Evidence-only checks. No route rows are created by this migration.
SELECT COUNT(*) AS build211_triage_tables
FROM sqlite_master
WHERE type='table'
  AND name IN ('custom_request_manufacturing_triage','custom_request_route_processes');
PRAGMA foreign_key_check;
