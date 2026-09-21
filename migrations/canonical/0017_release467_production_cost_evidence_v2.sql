-- Release 467 Build 217 — Production Cost Evidence v2
-- Manufacturing source evidence only. Inventory remains material-usage authority; Finance/Accounting remains profitability/posting authority.
-- Nullable cost fields preserve unknown cost as unknown. This migration creates no business rows.

CREATE TABLE IF NOT EXISTS creative_project_production_cost_evidence (
  creative_project_production_cost_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_project_operation_id INTEGER,
  cost_evidence_state TEXT NOT NULL DEFAULT 'unknown'
    CHECK(cost_evidence_state IN ('unknown','partial','reviewed')),
  design_setup_minutes INTEGER CHECK(design_setup_minutes IS NULL OR design_setup_minutes >= 0),
  machine_minutes INTEGER CHECK(machine_minutes IS NULL OR machine_minutes >= 0),
  hands_on_labour_minutes INTEGER CHECK(hands_on_labour_minutes IS NULL OR hands_on_labour_minutes >= 0),
  rework_minutes INTEGER CHECK(rework_minutes IS NULL OR rework_minutes >= 0),
  consumables_cost_cents INTEGER CHECK(consumables_cost_cents IS NULL OR consumables_cost_cents >= 0),
  packaging_cost_cents INTEGER CHECK(packaging_cost_cents IS NULL OR packaging_cost_cents >= 0),
  prototype_waste_cost_cents INTEGER CHECK(prototype_waste_cost_cents IS NULL OR prototype_waste_cost_cents >= 0),
  rework_cost_cents INTEGER CHECK(rework_cost_cents IS NULL OR rework_cost_cents >= 0),
  finishing_cost_cents INTEGER CHECK(finishing_cost_cents IS NULL OR finishing_cost_cents >= 0),
  outside_service_cost_cents INTEGER CHECK(outside_service_cost_cents IS NULL OR outside_service_cost_cents >= 0),
  failed_prototype_count INTEGER CHECK(failed_prototype_count IS NULL OR failed_prototype_count >= 0),
  quantity_produced REAL CHECK(quantity_produced IS NULL OR quantity_produced >= 0),
  quantity_accepted REAL CHECK(quantity_accepted IS NULL OR quantity_accepted >= 0),
  notes TEXT,
  evidence_status TEXT NOT NULL DEFAULT 'active' CHECK(evidence_status IN ('active','void')),
  void_reason TEXT,
  voided_by_user_id INTEGER,
  voided_at TEXT,
  recorded_by_user_id INTEGER,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE SET NULL,
  CHECK(quantity_produced IS NULL OR quantity_accepted IS NULL OR quantity_accepted <= quantity_produced)
);

CREATE INDEX IF NOT EXISTS idx_creative_project_production_cost_project
  ON creative_project_production_cost_evidence(creative_work_project_id,evidence_status,recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_project_production_cost_operation
  ON creative_project_production_cost_evidence(creative_project_operation_id,evidence_status,recorded_at DESC);

SELECT COUNT(*) AS build217_production_cost_evidence_tables
FROM sqlite_master
WHERE type='table' AND name='creative_project_production_cost_evidence';
PRAGMA foreign_key_check;
