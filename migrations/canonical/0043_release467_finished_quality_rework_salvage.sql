-- Release 467 Build 447: maker attempts, QA disposition, repaired lineage and source-only material recovery.
-- This ledger NEVER creates Inventory movements, Products, provider listings or time entries.
CREATE TABLE IF NOT EXISTS maker_quality_attempts (
 maker_quality_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 attempt_key TEXT NOT NULL,
 maker_traveler_run_id INTEGER REFERENCES maker_traveler_runs(maker_traveler_run_id) ON DELETE RESTRICT,
 creative_project_production_run_id INTEGER REFERENCES creative_project_production_runs(creative_project_production_run_id) ON DELETE RESTRICT,
 parent_attempt_id INTEGER REFERENCES maker_quality_attempts(maker_quality_attempt_id) ON DELETE RESTRICT,
 outcome TEXT NOT NULL CHECK(outcome IN ('first_quality','second_quality','reject','scrap','salvage','abandoned','learning_only')),
 safety_state TEXT NOT NULL DEFAULT 'unreviewed' CHECK(safety_state IN ('unreviewed','safe','unsafe')),
 attempted_quantity REAL NOT NULL DEFAULT 1 CHECK(attempted_quantity>0),
 quantity_unit TEXT NOT NULL DEFAULT 'piece' CHECK(length(trim(quantity_unit))>0),
 failure_cause TEXT,
 repair_notes TEXT,
 lessons_learned TEXT NOT NULL CHECK(length(trim(lessons_learned))>=12),
 creative_work_event_id INTEGER REFERENCES creative_work_events(creative_work_event_id) ON DELETE RESTRICT,
 reviewed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(creative_work_project_id,attempt_key),
 CHECK(outcome NOT IN ('reject','scrap','salvage','abandoned') OR length(trim(COALESCE(failure_cause,'')))>=12),
 CHECK(parent_attempt_id IS NULL OR length(trim(COALESCE(repair_notes,'')))>=12),
 CHECK(outcome NOT IN ('reject','scrap','abandoned','learning_only') OR safety_state<>'safe')
);
CREATE INDEX IF NOT EXISTS idx_maker_quality_project ON maker_quality_attempts(creative_work_project_id,maker_quality_attempt_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_attempt_source BEFORE INSERT ON maker_quality_attempts BEGIN
 SELECT RAISE(ABORT,'quality_traveler_project_mismatch') WHERE NEW.maker_traveler_run_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM maker_traveler_runs t WHERE t.maker_traveler_run_id=NEW.maker_traveler_run_id AND t.creative_work_project_id=NEW.creative_work_project_id);
 SELECT RAISE(ABORT,'quality_historical_run_project_mismatch') WHERE NEW.creative_project_production_run_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM creative_project_production_runs r WHERE r.creative_project_production_run_id=NEW.creative_project_production_run_id
   AND r.creative_work_project_id=NEW.creative_work_project_id AND r.run_status='reviewed');
 SELECT RAISE(ABORT,'quality_photo_evidence_wrong_project_or_void') WHERE NEW.creative_work_event_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM creative_work_events e WHERE e.creative_work_event_id=NEW.creative_work_event_id AND e.creative_work_project_id=NEW.creative_work_project_id AND e.entry_status='active');
 SELECT RAISE(ABORT,'quality_repair_parent_invalid') WHERE NEW.parent_attempt_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM maker_quality_attempts p WHERE p.maker_quality_attempt_id=NEW.parent_attempt_id
   AND p.creative_work_project_id=NEW.creative_work_project_id AND p.outcome IN ('reject','scrap','salvage','second_quality'));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_attempt_immutable BEFORE UPDATE ON maker_quality_attempts BEGIN SELECT RAISE(ABORT,'quality_attempt_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_attempt_no_delete BEFORE DELETE ON maker_quality_attempts BEGIN SELECT RAISE(ABORT,'quality_attempt_append_only'); END;

-- Append-only human disposition. The latest decision controls sale eligibility; HOLD is always safe.
CREATE TABLE IF NOT EXISTS maker_quality_release_reviews (
 maker_quality_release_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_quality_attempt_id INTEGER NOT NULL REFERENCES maker_quality_attempts(maker_quality_attempt_id) ON DELETE RESTRICT,
 decision TEXT NOT NULL CHECK(decision IN ('hold','internal_only','approved_for_sale')),
 review_note TEXT NOT NULL CHECK(length(trim(review_note))>=12),
 reviewed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_quality_review_attempt ON maker_quality_release_reviews(maker_quality_attempt_id,maker_quality_release_review_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_release_guard BEFORE INSERT ON maker_quality_release_reviews WHEN NEW.decision='approved_for_sale' BEGIN
 SELECT RAISE(ABORT,'quality_unfit_for_sale') WHERE NOT EXISTS(
  SELECT 1 FROM maker_quality_attempts a WHERE a.maker_quality_attempt_id=NEW.maker_quality_attempt_id
   AND a.outcome IN ('first_quality','second_quality') AND a.safety_state='safe'
   AND a.creative_work_event_id IS NOT NULL
   AND EXISTS(SELECT 1 FROM creative_work_events e WHERE e.creative_work_event_id=a.creative_work_event_id AND e.entry_status='active' AND length(trim(COALESCE(e.media_url,'')))>0)
   AND (a.creative_project_production_run_id IS NULL OR EXISTS(
    SELECT 1 FROM creative_project_production_runs r WHERE r.creative_project_production_run_id=a.creative_project_production_run_id
     AND r.run_status='reviewed' AND r.accepted_quantity>0
     AND EXISTS (SELECT 1 FROM creative_project_production_run_qa_checks q WHERE q.creative_project_production_run_id=r.creative_project_production_run_id AND q.qa_status='pass')
     AND NOT EXISTS (SELECT 1 FROM creative_project_production_run_qa_checks q WHERE q.creative_project_production_run_id=r.creative_project_production_run_id AND q.qa_status IN ('rework','fail')))));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_withhold_active_guard BEFORE INSERT ON maker_quality_release_reviews WHEN NEW.decision IN ('hold','internal_only') BEGIN
 SELECT RAISE(ABORT,'quality_unpublish_product_before_hold') WHERE EXISTS(
  SELECT 1 FROM maker_quality_product_links l JOIN products p ON p.product_id=l.product_id
  WHERE l.maker_quality_attempt_id=NEW.maker_quality_attempt_id AND (p.status='active' OR p.review_status IN ('approved','published')));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_review_immutable BEFORE UPDATE ON maker_quality_release_reviews BEGIN SELECT RAISE(ABORT,'quality_review_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_review_no_delete BEFORE DELETE ON maker_quality_release_reviews BEGIN SELECT RAISE(ABORT,'quality_review_append_only'); END;

-- Identifies exact finished Product source. No Product, Inventory or Etsy write is performed.
CREATE TABLE IF NOT EXISTS maker_quality_product_links (
 maker_quality_product_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_quality_attempt_id INTEGER NOT NULL REFERENCES maker_quality_attempts(maker_quality_attempt_id) ON DELETE RESTRICT,
 product_id INTEGER NOT NULL UNIQUE REFERENCES products(product_id) ON DELETE RESTRICT,
 link_note TEXT NOT NULL CHECK(length(trim(link_note))>=12),
 linked_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_quality_product_attempt ON maker_quality_product_links(maker_quality_attempt_id);
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_product_link_guard BEFORE INSERT ON maker_quality_product_links BEGIN
 SELECT RAISE(ABORT,'quality_product_requires_safe_approved') WHERE NOT EXISTS(
  SELECT 1 FROM maker_quality_attempts a JOIN maker_quality_release_reviews r ON r.maker_quality_attempt_id=a.maker_quality_attempt_id
  WHERE a.maker_quality_attempt_id=NEW.maker_quality_attempt_id AND r.decision='approved_for_sale'
   AND r.maker_quality_release_review_id=(SELECT MAX(x.maker_quality_release_review_id) FROM maker_quality_release_reviews x WHERE x.maker_quality_attempt_id=a.maker_quality_attempt_id));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_product_link_immutable BEFORE UPDATE ON maker_quality_product_links BEGIN SELECT RAISE(ABORT,'quality_product_link_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_product_link_no_delete BEFORE DELETE ON maker_quality_product_links BEGIN SELECT RAISE(ABORT,'quality_product_link_append_only'); END;
-- On later owner HOLD, existing linked Products cannot be newly activated or approved without another QA review.
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_product_publication_guard BEFORE UPDATE OF status,review_status ON products
 WHEN (NEW.status='active' OR NEW.review_status IN ('approved','published'))
 BEGIN
 SELECT RAISE(ABORT,'quality_release_review_required') WHERE EXISTS(
  SELECT 1 FROM maker_quality_product_links l WHERE l.product_id=NEW.product_id AND NOT EXISTS(
   SELECT 1 FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=l.maker_quality_attempt_id
    AND r.decision='approved_for_sale' AND r.maker_quality_release_review_id=(SELECT MAX(x.maker_quality_release_review_id) FROM maker_quality_release_reviews x WHERE x.maker_quality_attempt_id=l.maker_quality_attempt_id)));
 END;
-- Fence the existing audited Etsy one-shot draft claim as well as the Product activation route.
-- Only Products explicitly linked to a reviewed quality attempt are constrained.
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_etsy_claim_guard BEFORE INSERT ON admin_action_audit
 WHEN NEW.action_type='etsy_product_editor_draft_claimed' AND NEW.target_type='product'
 BEGIN
 SELECT RAISE(ABORT,'quality_etsy_draft_held') WHERE EXISTS(
  SELECT 1 FROM maker_quality_product_links l WHERE l.product_id=CAST(NEW.target_key AS INTEGER) AND NOT EXISTS(
   SELECT 1 FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=l.maker_quality_attempt_id
    AND r.decision='approved_for_sale' AND r.maker_quality_release_review_id=(SELECT MAX(x.maker_quality_release_review_id) FROM maker_quality_release_reviews x WHERE x.maker_quality_attempt_id=l.maker_quality_attempt_id)));
 END;

-- Only link genuine, already-posted Inventory return/reversal receipts. No secondary stock adjustment.
CREATE TABLE IF NOT EXISTS maker_quality_recovery_links (
 maker_quality_recovery_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_quality_attempt_id INTEGER NOT NULL REFERENCES maker_quality_attempts(maker_quality_attempt_id) ON DELETE RESTRICT,
 creative_project_inventory_reversal_id INTEGER NOT NULL UNIQUE REFERENCES creative_project_inventory_reversals(creative_project_inventory_reversal_id) ON DELETE RESTRICT,
 recovery_note TEXT NOT NULL CHECK(length(trim(recovery_note))>=12),
 linked_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_recovery_source BEFORE INSERT ON maker_quality_recovery_links BEGIN
 SELECT RAISE(ABORT,'quality_recovery_wrong_project_or_unconfirmed') WHERE NOT EXISTS(
  SELECT 1 FROM maker_quality_attempts a JOIN creative_project_inventory_reversals v
   JOIN creative_project_inventory_posts p ON p.creative_project_inventory_post_id=v.creative_project_inventory_post_id
  WHERE a.maker_quality_attempt_id=NEW.maker_quality_attempt_id AND v.creative_project_inventory_reversal_id=NEW.creative_project_inventory_reversal_id
   AND p.creative_work_project_id=a.creative_work_project_id AND v.authorized_at IS NOT NULL AND v.stock_quantity_restored>0);
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_recovery_immutable BEFORE UPDATE ON maker_quality_recovery_links BEGIN SELECT RAISE(ABORT,'quality_recovery_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_quality_recovery_no_delete BEFORE DELETE ON maker_quality_recovery_links BEGIN SELECT RAISE(ABORT,'quality_recovery_append_only'); END;
SELECT COUNT(*) AS build447_quality_tables FROM sqlite_master WHERE type='table' AND name LIKE 'maker_quality_%';
PRAGMA foreign_key_check;
