-- Devil n Dove Release 461 — Development-only notification runtime schema authority.
-- Runtime notification traffic must never create/alter schema or seed policy rows.
-- This migration is additive only. Existing partial tables must be stopped by read-only
-- preflight and repaired by a deliberate later forward migration; historical replay is forbidden.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  related_order_id INTEGER,
  related_payment_id INTEGER,
  related_product_id INTEGER,
  payload_json TEXT,
  metadata_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','retry','sent','failed','cancelled','suppressed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_dispatch_log (
  notification_dispatch_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_outbox_id INTEGER,
  notification_kind TEXT,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_exclusions (
  notification_exclusion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  destination TEXT,
  product_id INTEGER,
  order_id INTEGER,
  reason TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_cooldown_rules (
  notification_cooldown_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL UNIQUE,
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_engagement_runs (
  customer_engagement_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT NOT NULL DEFAULT 'automation',
  actor_user_id INTEGER,
  summary_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_status
  ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind
  ON notification_outbox(notification_kind, destination, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_order_payment
  ON notification_outbox(related_order_id, related_payment_id);
CREATE INDEX IF NOT EXISTS idx_notification_dispatch_log_outbox
  ON notification_dispatch_log(notification_outbox_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_dispatch_log_status
  ON notification_dispatch_log(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_exclusions_lookup
  ON notification_exclusions(notification_kind, is_active, destination, product_id, order_id);
CREATE INDEX IF NOT EXISTS idx_customer_engagement_runs_created
  ON customer_engagement_runs(created_at DESC);

INSERT OR IGNORE INTO notification_cooldown_rules
  (notification_kind, cooldown_hours, is_enabled, created_at, updated_at)
VALUES
  ('checkout_recovery', 24, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('review_request', 72, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('back_in_stock', 24, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift_card_issued', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift_card_purchase_confirmation', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Read-only proof emitted by the migration runner after the additive statements above.
SELECT COUNT(*) AS release461_notification_outbox_columns
FROM pragma_table_info('notification_outbox')
WHERE name IN (
  'notification_outbox_id','notification_kind','channel','destination','related_order_id',
  'related_payment_id','related_product_id','payload_json','metadata_json','status',
  'attempt_count','last_attempt_at','next_attempt_at','provider_message_id','error_text',
  'created_at','updated_at'
);
SELECT COUNT(*) AS release461_notification_dispatch_columns
FROM pragma_table_info('notification_dispatch_log')
WHERE name IN ('notification_dispatch_log_id','notification_outbox_id','notification_kind','destination','status','provider_message_id','error_text','created_at');
SELECT COUNT(*) AS release461_notification_exclusion_columns
FROM pragma_table_info('notification_exclusions')
WHERE name IN ('notification_exclusion_id','notification_kind','destination','product_id','order_id','reason','is_active','created_at','updated_at');
SELECT COUNT(*) AS release461_notification_cooldown_columns
FROM pragma_table_info('notification_cooldown_rules')
WHERE name IN ('notification_cooldown_rule_id','notification_kind','cooldown_hours','is_enabled','created_at','updated_at');
SELECT COUNT(*) AS release461_customer_engagement_columns
FROM pragma_table_info('customer_engagement_runs')
WHERE name IN ('customer_engagement_run_id','run_type','actor_user_id','summary_json','created_at');
SELECT COUNT(*) AS release461_notification_named_indexes
FROM sqlite_master
WHERE type='index' AND name IN (
  'idx_notification_outbox_status','idx_notification_outbox_kind','idx_notification_outbox_order_payment',
  'idx_notification_dispatch_log_outbox','idx_notification_dispatch_log_status',
  'idx_notification_exclusions_lookup','idx_customer_engagement_runs_created'
);
SELECT COUNT(*) AS release461_notification_default_cooldowns
FROM notification_cooldown_rules
WHERE (notification_kind='checkout_recovery' AND cooldown_hours=24)
   OR (notification_kind='review_request' AND cooldown_hours=72)
   OR (notification_kind='back_in_stock' AND cooldown_hours=24)
   OR (notification_kind='gift_card_issued' AND cooldown_hours=1)
   OR (notification_kind='gift_card_purchase_confirmation' AND cooldown_hours=1);
PRAGMA foreign_key_check;
