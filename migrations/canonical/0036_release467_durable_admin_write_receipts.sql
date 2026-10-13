-- Build 385 canonical Development migration activation: 0036 must be applied and proved before Production promotion.
-- Release 467 Build 385: durable source-linked exactly-once-on-D1 commit receipts for selected admin writes.
-- The original business source row and this receipt MUST be committed in the SAME D1 atomic batch.
-- No standalone "started" row or unverified "success" receipt can be written by the API.
CREATE TABLE IF NOT EXISTS admin_write_receipts (
 admin_write_receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
 action_scope TEXT NOT NULL CHECK(action_scope IN
 ('commission_decision','finance_review','material_reserve','material_release')),
 request_key TEXT NOT NULL CHECK(length(request_key) BETWEEN 16 AND 80),
 actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 target_type TEXT NOT NULL CHECK(target_type IN ('custom_request','creative_work_project')),
 target_id INTEGER NOT NULL CHECK(target_id>0),
 source_record_id INTEGER NOT NULL CHECK(source_record_id>0),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64 AND payload_sha256 NOT GLOB '*[^0-9a-f]*'),
 receipt_status TEXT NOT NULL DEFAULT 'committed' CHECK(receipt_status='committed'),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(action_scope,request_key)
);
CREATE INDEX IF NOT EXISTS idx_admin_write_receipts_actor ON admin_write_receipts(actor_user_id,admin_write_receipt_id DESC);
CREATE INDEX IF NOT EXISTS idx_admin_write_receipts_target ON admin_write_receipts(target_type,target_id,admin_write_receipt_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_admin_write_receipts_insert_proof BEFORE INSERT ON admin_write_receipts BEGIN
 SELECT RAISE(ABORT,'receipt_requires_committed_commission_source')
 WHERE NEW.action_scope='commission_decision' AND NOT EXISTS
 (SELECT 1 FROM custom_request_commission_events e WHERE e.custom_request_commission_event_id=NEW.source_record_id
 AND e.request_key=NEW.request_key AND e.actor_user_id=NEW.actor_user_id AND e.custom_request_id=NEW.target_id AND NEW.target_type='custom_request');
 SELECT RAISE(ABORT,'receipt_requires_committed_finance_source')
 WHERE NEW.action_scope='finance_review' AND NOT EXISTS
 (SELECT 1 FROM creative_project_finance_review_events e WHERE e.creative_project_finance_review_event_id=NEW.source_record_id
 AND e.request_key=NEW.request_key AND e.actor_user_id=NEW.actor_user_id AND e.creative_work_project_id=NEW.target_id AND NEW.target_type='creative_work_project');
 SELECT RAISE(ABORT,'receipt_requires_committed_reservation_source')
 WHERE NEW.action_scope='material_reserve' AND NOT EXISTS
 (SELECT 1 FROM creative_project_material_reservations e WHERE e.creative_project_material_reservation_id=NEW.source_record_id
 AND e.request_key=NEW.request_key AND e.created_by_user_id=NEW.actor_user_id AND e.creative_work_project_id=NEW.target_id AND NEW.target_type='creative_work_project');
 SELECT RAISE(ABORT,'receipt_requires_committed_release_source')
 WHERE NEW.action_scope='material_release' AND NOT EXISTS
 (SELECT 1 FROM creative_project_material_reservations e WHERE e.creative_project_material_reservation_id=NEW.source_record_id
 AND e.creative_work_project_id=NEW.target_id AND e.updated_by_user_id=NEW.actor_user_id AND NEW.target_type='creative_work_project'
 AND e.release_note LIKE '@receipt:' || NEW.request_key || ':%');
END;
CREATE TRIGGER IF NOT EXISTS trg_admin_write_receipts_no_update BEFORE UPDATE ON admin_write_receipts BEGIN
 SELECT RAISE(ABORT,'receipt_history_immutable');
END;
CREATE TRIGGER IF NOT EXISTS trg_admin_write_receipts_no_delete BEFORE DELETE ON admin_write_receipts BEGIN
 SELECT RAISE(ABORT,'receipt_history_immutable');
END;
SELECT COUNT(*) AS build385_receipt_tables FROM sqlite_master WHERE type='table' AND name='admin_write_receipts';
PRAGMA foreign_key_check;
