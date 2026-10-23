-- Release 467 Build 449: append-only, human-reviewed CAD costing assumptions and optional pricing.
-- Real Inventory postings, Work Order time, production evidence and Finance remain source owners.
-- A review is NOT revenue, an accounting journal, payroll, stock movement or Product price.
CREATE TABLE IF NOT EXISTS maker_project_cost_reviews (
 maker_project_cost_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 scenario_kind TEXT NOT NULL CHECK(scenario_kind IN ('one_off','failed_batch','commission','private_learning')),
 review_label TEXT NOT NULL CHECK(length(trim(review_label)) BETWEEN 4 AND 120),
 labour_rate_cents_per_hour INTEGER CHECK(labour_rate_cents_per_hour IS NULL OR labour_rate_cents_per_hour BETWEEN 0 AND 10000000),
 machine_rate_cents_per_hour INTEGER CHECK(machine_rate_cents_per_hour IS NULL OR machine_rate_cents_per_hour BETWEEN 0 AND 10000000),
 machine_minutes INTEGER CHECK(machine_minutes IS NULL OR machine_minutes BETWEEN 0 AND 1000000),
 no_material_use_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(no_material_use_confirmed IN (0,1)),
 no_labour_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(no_labour_confirmed IN (0,1)),
 packaging_cents INTEGER CHECK(packaging_cents IS NULL OR packaging_cents BETWEEN 0 AND 1000000000),
 consumables_cents INTEGER CHECK(consumables_cents IS NULL OR consumables_cents BETWEEN 0 AND 1000000000),
 rework_cents INTEGER CHECK(rework_cents IS NULL OR rework_cents BETWEEN 0 AND 1000000000),
 finishing_cents INTEGER CHECK(finishing_cents IS NULL OR finishing_cents BETWEEN 0 AND 1000000000),
 outside_service_cents INTEGER CHECK(outside_service_cents IS NULL OR outside_service_cents BETWEEN 0 AND 1000000000),
 overhead_cents INTEGER CHECK(overhead_cents IS NULL OR overhead_cents BETWEEN 0 AND 1000000000),
 proposed_price_cents INTEGER CHECK(proposed_price_cents IS NULL OR proposed_price_cents BETWEEN 0 AND 1000000000),
 pricing_quantity INTEGER NOT NULL DEFAULT 1 CHECK(pricing_quantity BETWEEN 1 AND 1000000),
 review_note TEXT NOT NULL CHECK(length(trim(review_note)) BETWEEN 16 AND 1200),
 reviewed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 16 AND 80),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_cost_reviews_project ON maker_project_cost_reviews(creative_work_project_id,maker_project_cost_review_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_cost_review_source_guard BEFORE INSERT ON maker_project_cost_reviews BEGIN
 SELECT RAISE(ABORT,'cost_review_materials_have_actual_posts') WHERE NEW.no_material_use_confirmed=1 AND EXISTS(
  SELECT 1 FROM creative_project_inventory_posts p WHERE p.creative_work_project_id=NEW.creative_work_project_id
  AND COALESCE(p.posting_status,'posted')<>'reversed' AND NOT EXISTS (
   SELECT 1 FROM creative_project_inventory_reversals r WHERE r.creative_project_inventory_post_id=p.creative_project_inventory_post_id));
 SELECT RAISE(ABORT,'cost_review_labour_has_time') WHERE NEW.no_labour_confirmed=1 AND EXISTS(
  SELECT 1 FROM creative_work_order_events w WHERE w.creative_work_project_id=NEW.creative_work_project_id AND w.event_kind='time');
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_cost_review_immutable BEFORE UPDATE ON maker_project_cost_reviews BEGIN SELECT RAISE(ABORT,'maker_cost_review_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_cost_review_no_delete BEFORE DELETE ON maker_project_cost_reviews BEGIN SELECT RAISE(ABORT,'maker_cost_review_append_only'); END;
SELECT COUNT(*) AS build449_cost_review_tables FROM sqlite_master WHERE type='table' AND name='maker_project_cost_reviews';
PRAGMA foreign_key_check;
