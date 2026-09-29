-- Release 467 Build 294 — CAIP Workshop Follies & Maker Story Foundation
-- Creative Process remains the source-of-truth for project/story facts.
-- CAIP remains private media/evidence/story-planning authority.
-- Content Studio remains review-first deliverable authority.
-- Inventory/process/workstation identities are referenced; never duplicated.
-- Build 294 canonical schema classification marker.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS creative_project_maker_story_profiles (
  creative_work_project_id INTEGER PRIMARY KEY,
  story_kind TEXT NOT NULL DEFAULT 'ordinary_project'
    CHECK(story_kind IN ('ordinary_project','workshop_folly','experiment','maker_story','research_learning')),
  what_we_are_trying TEXT,
  why_we_are_trying_it TEXT,
  primary_inventory_process_id INTEGER,
  expected_result TEXT,
  actual_result TEXT,
  outcome_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK(outcome_status IN ('unknown','win','partial_win','failure')),
  surprise_or_problem TEXT,
  lesson_learned TEXT,
  change_next_time TEXT,
  try_again_status TEXT NOT NULL DEFAULT 'undecided'
    CHECK(try_again_status IN ('undecided','yes','no','modified')),
  story_review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(story_review_status IN ('draft','needs_review','reviewed')),
  public_story_candidate INTEGER NOT NULL DEFAULT 0
    CHECK(public_story_candidate IN (0,1)),
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(primary_inventory_process_id) REFERENCES inventory_processes(inventory_process_id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_project_maker_story_workstations (
  creative_work_project_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(creative_work_project_id, site_item_inventory_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_maker_story_profiles_kind
  ON creative_project_maker_story_profiles(story_kind, story_review_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_maker_story_profiles_process
  ON creative_project_maker_story_profiles(primary_inventory_process_id, story_kind);
CREATE INDEX IF NOT EXISTS idx_maker_story_workstations_station
  ON creative_project_maker_story_workstations(site_item_inventory_id, creative_work_project_id);

-- Evidence only: this migration creates no Creative Project, CAIP, Content Studio,
-- Product, Inventory movement, social queue or publication row.
SELECT COUNT(*) AS build294_tables
FROM sqlite_master
WHERE type='table'
  AND name IN ('creative_project_maker_story_profiles','creative_project_maker_story_workstations');
PRAGMA foreign_key_check;
