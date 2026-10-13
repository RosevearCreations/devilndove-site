-- Release 467 Build 383 — human source-by-source project-to-accounting review only.
-- Not a journal, payment, tax return, revenue booking, depreciation or cost posting authority.
CREATE TABLE IF NOT EXISTS creative_project_finance_review_events (
 creative_project_finance_review_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 review_type TEXT NOT NULL CHECK(review_type IN ('revenue_source','material_consumption','labour_cost','production_cost','tax_source','payment_refund','variance_resolution','overall_readiness')),
 review_result TEXT NOT NULL CHECK(review_result IN ('evidence_missing','needs_reconciliation','reviewed_with_caveat','source_verified')),
 source_kind TEXT NOT NULL CHECK(source_kind IN ('creative_project_profitability','creative_work_events','creative_work_order_events','creative_project_inventory_posts','creative_project_production_cost_evidence','orders_payments_refunds','operator_review')),
 source_record_id INTEGER CHECK(source_record_id IS NULL OR source_record_id>0),
 currency TEXT NOT NULL DEFAULT 'CAD' CHECK(currency='CAD'),
 evidence_note TEXT NOT NULL CHECK(length(trim(evidence_note)) BETWEEN 16 AND 1200),
 actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_project_finance_reviews_project ON creative_project_finance_review_events(creative_work_project_id,creative_project_finance_review_event_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_finance_review_no_update BEFORE UPDATE ON creative_project_finance_review_events BEGIN SELECT RAISE(ABORT,'finance_review_history_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_finance_review_no_delete BEFORE DELETE ON creative_project_finance_review_events BEGIN SELECT RAISE(ABORT,'finance_review_history_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_finance_review_source_scope BEFORE INSERT ON creative_project_finance_review_events BEGIN
 SELECT RAISE(ABORT,'finance_review_bad_project') WHERE NOT EXISTS (SELECT 1 FROM creative_work_projects p WHERE p.creative_work_project_id=NEW.creative_work_project_id);
 SELECT RAISE(ABORT,'finance_review_bad_source') WHERE NEW.source_record_id IS NOT NULL AND (
 (NEW.source_kind='creative_project_profitability' AND NOT EXISTS (SELECT 1 FROM creative_project_profitability x WHERE x.creative_work_project_id=NEW.creative_work_project_id AND x.creative_work_project_id=NEW.source_record_id)) OR
 (NEW.source_kind='creative_work_events' AND NOT EXISTS (SELECT 1 FROM creative_work_events x WHERE x.creative_work_project_id=NEW.creative_work_project_id AND x.creative_work_event_id=NEW.source_record_id)) OR
 (NEW.source_kind='creative_work_order_events' AND NOT EXISTS (SELECT 1 FROM creative_work_order_events x WHERE x.creative_work_project_id=NEW.creative_work_project_id AND x.creative_work_order_event_id=NEW.source_record_id)) OR
 (NEW.source_kind='creative_project_inventory_posts' AND NOT EXISTS (SELECT 1 FROM creative_project_inventory_posts x WHERE x.creative_work_project_id=NEW.creative_work_project_id AND x.creative_project_inventory_post_id=NEW.source_record_id)) OR
 (NEW.source_kind='creative_project_production_cost_evidence' AND NOT EXISTS (SELECT 1 FROM creative_project_production_cost_evidence x WHERE x.creative_work_project_id=NEW.creative_work_project_id AND x.creative_project_production_cost_evidence_id=NEW.source_record_id)) OR
 (NEW.source_kind='orders_payments_refunds' AND NOT EXISTS (SELECT 1 FROM custom_request_order_status_links l JOIN creative_project_manufacturing_lifecycles ml ON ml.custom_request_id=l.custom_request_id WHERE ml.creative_work_project_id=NEW.creative_work_project_id AND l.order_id=NEW.source_record_id)) OR
 (NEW.source_kind='operator_review'));
 SELECT RAISE(ABORT,'finance_review_source_required') WHERE NEW.review_result='source_verified' AND NEW.source_kind='operator_review';
END;
SELECT COUNT(*) AS build383_review_tables FROM sqlite_master WHERE type='table' AND name='creative_project_finance_review_events';
PRAGMA foreign_key_check;
