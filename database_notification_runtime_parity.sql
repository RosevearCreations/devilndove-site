-- Devil n Dove Build 403
-- Shared notification schema/default authority.
-- Runtime queue/send/read paths must not create/alter these tables or seed defaults.

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
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (related_order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
  FOREIGN KEY (related_payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL,
  FOREIGN KEY (related_product_id) REFERENCES products(product_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_due
  ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_kind_destination
  ON notification_outbox(notification_kind, destination, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_order
  ON notification_outbox(related_order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_payment
  ON notification_outbox(related_payment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_product
  ON notification_outbox(related_product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_dispatch_log (
  notification_dispatch_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_outbox_id INTEGER,
  notification_kind TEXT,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_outbox_id) REFERENCES notification_outbox(notification_outbox_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_notification_dispatch_log_outbox
  ON notification_dispatch_log(notification_outbox_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_dispatch_log_kind_status
  ON notification_dispatch_log(notification_kind, status, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_exclusions (
  notification_exclusion_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  destination TEXT,
  product_id INTEGER,
  order_id INTEGER,
  reason TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_notification_exclusions_lookup
  ON notification_exclusions(notification_kind, is_active, destination, product_id, order_id);

CREATE TABLE IF NOT EXISTS notification_cooldown_rules (
  notification_cooldown_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL UNIQUE,
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notification_cooldown_rules (
  notification_kind, cooldown_hours, is_enabled, created_at, updated_at
) VALUES
  ('checkout_recovery', 24, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('review_request', 72, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('back_in_stock', 24, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift_card_issued', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift_card_purchase_confirmation', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(notification_kind) DO NOTHING;

CREATE TABLE IF NOT EXISTS customer_engagement_runs (
  customer_engagement_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT NOT NULL DEFAULT 'automation',
  actor_user_id INTEGER,
  summary_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_customer_engagement_runs_created
  ON customer_engagement_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS notification_automation_settings (
  notification_automation_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL UNIQUE,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  send_after_hours INTEGER NOT NULL DEFAULT 24,
  max_age_days INTEGER NOT NULL DEFAULT 30,
  order_statuses_json TEXT,
  payment_statuses_json TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notification_automation_settings (
  notification_kind, is_enabled, send_after_hours, max_age_days,
  order_statuses_json, payment_statuses_json, notes, created_at, updated_at
) VALUES
  ('checkout_recovery', 1, 1, 7, NULL, NULL, 'Queue first recovery email after the cart has been abandoned for at least this many hours.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('review_request', 1, 72, 45, '["paid","fulfilled","completed"]', '["paid","completed","captured","partially_refunded"]', 'Queue review-request emails only after the order has aged past this threshold.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('back_in_stock', 1, 1, 30, NULL, NULL, 'Queue back-in-stock notifications when matching inventory returns and the row is still open.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift_card_issued', 1, 1, 30, NULL, NULL, 'Gift card delivery stays near-instant but can still be disabled here if needed.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift_card_purchase_confirmation', 1, 1, 30, NULL, NULL, 'Purchaser confirmations stay near-instant but can still be disabled here if needed.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(notification_kind) DO NOTHING;

CREATE TABLE IF NOT EXISTS gift_card_delivery_audit (
  gift_card_delivery_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  audience TEXT NOT NULL DEFAULT 'recipient',
  notification_kind TEXT NOT NULL,
  destination TEXT,
  notification_outbox_id INTEGER,
  notification_dispatch_log_id INTEGER,
  actor_user_id INTEGER,
  action_type TEXT NOT NULL DEFAULT 'queued',
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(gift_card_id) ON DELETE SET NULL,
  FOREIGN KEY (notification_outbox_id) REFERENCES notification_outbox(notification_outbox_id) ON DELETE SET NULL,
  FOREIGN KEY (notification_dispatch_log_id) REFERENCES notification_dispatch_log(notification_dispatch_log_id) ON DELETE SET NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_card_delivery_audit_card
  ON gift_card_delivery_audit(gift_card_id, created_at DESC);
