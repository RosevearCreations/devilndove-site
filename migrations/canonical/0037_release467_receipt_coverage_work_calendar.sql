-- Release 467 Build 386: additive source-bound receipts; preserve Build 385 history untouched.
-- Existing work-order history remains unchanged; only new keyed writes participate.
ALTER TABLE creative_work_order_events ADD COLUMN request_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_order_event_receipt_key ON creative_work_order_events(request_key) WHERE request_key IS NOT NULL;
CREATE TRIGGER IF NOT EXISTS trg_work_order_receipt_source_no_edit BEFORE UPDATE ON creative_work_order_events
 WHEN OLD.request_key IS NOT NULL BEGIN SELECT RAISE(ABORT,'work_order_receipt_source_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_work_order_receipt_source_no_delete BEFORE DELETE ON creative_work_order_events
 WHEN OLD.request_key IS NOT NULL BEGIN SELECT RAISE(ABORT,'work_order_receipt_source_immutable'); END;
CREATE TABLE IF NOT EXISTS admin_write_receipts_extended(
 admin_write_receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
 action_scope TEXT NOT NULL CHECK(action_scope IN ('work_order_event','calendar_schedule')),
 request_key TEXT NOT NULL CHECK(length(request_key) BETWEEN 16 AND 80),
 actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 target_type TEXT NOT NULL CHECK(target_type IN ('creative_work_project','site_item_inventory')),
 target_id INTEGER NOT NULL CHECK(target_id>0),
 source_record_id INTEGER NOT NULL CHECK(source_record_id>0),
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64 AND payload_sha256 NOT GLOB '*[^0-9a-f]*'),
 receipt_status TEXT NOT NULL DEFAULT 'committed' CHECK(receipt_status='committed'),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(action_scope,request_key)
);
CREATE INDEX IF NOT EXISTS idx_admin_write_receipts_extended_actor ON admin_write_receipts_extended(actor_user_id,admin_write_receipt_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_admin_write_receipts_extended_proof BEFORE INSERT ON admin_write_receipts_extended BEGIN
 SELECT RAISE(ABORT,'receipt_requires_work_order_source')
 WHERE NEW.action_scope='work_order_event' AND NOT EXISTS
 (SELECT 1 FROM creative_work_order_events e WHERE e.creative_work_order_event_id=NEW.source_record_id
 AND e.request_key=NEW.request_key AND e.actor_user_id=NEW.actor_user_id AND e.creative_work_project_id=NEW.target_id AND NEW.target_type='creative_work_project');
 SELECT RAISE(ABORT,'receipt_requires_calendar_source')
 WHERE NEW.action_scope='calendar_schedule' AND NOT EXISTS
 (SELECT 1 FROM creative_resource_calendar_entries e WHERE e.creative_resource_calendar_entry_id=NEW.source_record_id
 AND e.request_key=NEW.request_key AND e.created_by_user_id=NEW.actor_user_id AND
 ((NEW.target_type='creative_work_project' AND e.creative_work_project_id=NEW.target_id)
 OR (NEW.target_type='site_item_inventory' AND e.creative_work_project_id IS NULL AND e.resource_site_item_inventory_id=NEW.target_id)));
END;
CREATE TRIGGER IF NOT EXISTS trg_admin_write_receipts_extended_no_update BEFORE UPDATE ON admin_write_receipts_extended BEGIN
 SELECT RAISE(ABORT,'receipt_history_immutable');
END;
CREATE TRIGGER IF NOT EXISTS trg_admin_write_receipts_extended_no_delete BEFORE DELETE ON admin_write_receipts_extended BEGIN
 SELECT RAISE(ABORT,'receipt_history_immutable');
END;
SELECT COUNT(*) AS build386_extended_receipt_tables FROM sqlite_master WHERE type='table' AND name='admin_write_receipts_extended';
PRAGMA foreign_key_check;
