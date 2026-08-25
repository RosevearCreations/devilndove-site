-- Devil n Dove Build 393
-- Today Tasks action schema authority.
-- POST handlers must not create/alter this table at request time.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS today_task_actions (
  today_task_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_key TEXT NOT NULL,
  task_label TEXT,
  action_status TEXT NOT NULL DEFAULT 'completed' CHECK (action_status IN ('completed','ignored','snoozed')),
  notes TEXT,
  snooze_until TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_today_task_actions_task_key_created
  ON today_task_actions(task_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_today_task_actions_status_snooze
  ON today_task_actions(action_status, snooze_until, created_at DESC);
