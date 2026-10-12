-- Build 379 canonical Development-first D1 apply on verified current authority; no prior 0031 migration apply succeeded.
-- Build 379. Additive append-only human work-order execution over existing project operations.
CREATE TABLE IF NOT EXISTS creative_work_order_events (
 creative_work_order_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL,
 creative_project_operation_id INTEGER NOT NULL,
 event_kind TEXT NOT NULL CHECK(event_kind IN ('transition','time','milestone')),
 from_status TEXT, to_status TEXT,
 minutes_worked INTEGER CHECK(minutes_worked IS NULL OR minutes_worked BETWEEN 1 AND 720),
 work_date TEXT, event_title TEXT NOT NULL, notes TEXT NOT NULL,
 creative_work_event_id INTEGER, actor_user_id INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((event_kind='transition' AND from_status IS NOT NULL AND to_status IS NOT NULL AND minutes_worked IS NULL AND creative_work_event_id IS NULL)
 OR (event_kind='time' AND from_status IS NULL AND to_status IS NULL AND minutes_worked IS NOT NULL AND work_date IS NOT NULL AND creative_work_event_id IS NULL)
 OR (event_kind='milestone' AND from_status IS NULL AND to_status IS NULL AND minutes_worked IS NULL AND creative_work_event_id IS NOT NULL)),
 FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 FOREIGN KEY(creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE RESTRICT,
 FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE RESTRICT,
 FOREIGN KEY(actor_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_work_order_events_project_op ON creative_work_order_events(creative_work_project_id,creative_project_operation_id,creative_work_order_event_id DESC);
CREATE INDEX IF NOT EXISTS idx_work_order_events_transition ON creative_work_order_events(creative_project_operation_id,event_kind,creative_work_order_event_id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_order_events_unique_milestone ON creative_work_order_events(creative_project_operation_id,creative_work_event_id) WHERE event_kind='milestone';
SELECT COUNT(*) AS build379_work_order_tables FROM sqlite_master WHERE type='table' AND name='creative_work_order_events';
PRAGMA foreign_key_check;
