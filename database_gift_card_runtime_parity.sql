-- Devil n Dove Build 384
-- Gift Card fresh-install/runtime parity.
-- Gift Card-owned schema only. Shared notification_outbox remains outside this migration.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS gift_cards (
  gift_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'CAD',
  initial_amount_cents INTEGER NOT NULL DEFAULT 0,
  remaining_amount_cents INTEGER NOT NULL DEFAULT 0,
  issued_to_email TEXT,
  issued_to_name TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  purchaser_email TEXT,
  purchaser_name TEXT,
  note TEXT,
  recipient_note TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT,
  last_redeemed_at TEXT,
  order_id INTEGER,
  purchase_source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON gift_cards(recipient_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser_email ON gift_cards(purchaser_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_cards_order ON gift_cards(order_id);

CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  gift_card_redemption_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER NOT NULL,
  order_id INTEGER,
  redeemed_amount_cents INTEGER NOT NULL DEFAULT 0,
  redeemed_by_email TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(gift_card_id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_card ON gift_card_redemptions(gift_card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_order ON gift_card_redemptions(order_id);

CREATE TABLE IF NOT EXISTS gift_card_admin_events (
  gift_card_admin_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  source_gift_card_id INTEGER,
  action_key TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(gift_card_id) ON DELETE SET NULL,
  FOREIGN KEY (source_gift_card_id) REFERENCES gift_cards(gift_card_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_card_admin_events_card ON gift_card_admin_events(gift_card_id, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_delivery_templates (
  gift_card_delivery_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT,
  body TEXT,
  template_status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS gift_card_delivery_queue (
  gift_card_delivery_queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_id INTEGER,
  recipient_email TEXT,
  delivery_kind TEXT NOT NULL DEFAULT 'activation',
  template_key TEXT,
  subject TEXT,
  body TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  queued_by_user_id INTEGER,
  queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  notes TEXT,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(gift_card_id) ON DELETE SET NULL,
  FOREIGN KEY (queued_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_card_delivery_queue_status ON gift_card_delivery_queue(delivery_status, queued_at);
CREATE INDEX IF NOT EXISTS idx_gift_card_delivery_queue_card ON gift_card_delivery_queue(gift_card_id, queued_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_provider_send_logs (
  gift_card_provider_send_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_card_delivery_queue_id INTEGER,
  gift_card_id INTEGER,
  provider TEXT,
  recipient_email TEXT,
  provider_message_id TEXT,
  send_status TEXT NOT NULL DEFAULT 'attempted',
  request_summary_json TEXT,
  response_summary_json TEXT,
  error_text TEXT,
  created_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gift_card_delivery_queue_id) REFERENCES gift_card_delivery_queue(gift_card_delivery_queue_id) ON DELETE SET NULL,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(gift_card_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_card_provider_send_logs_queue ON gift_card_provider_send_logs(gift_card_delivery_queue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_card_provider_send_logs_card ON gift_card_provider_send_logs(gift_card_id, created_at DESC);

-- Full current lookup-attempt shape. The Development release helper performs
-- idempotent ALTER alignment for older tables before indexes are applied.
CREATE TABLE IF NOT EXISTS gift_card_lookup_attempts (
  gift_card_lookup_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hint TEXT,
  email_hash TEXT,
  client_key TEXT,
  lookup_email TEXT,
  code_suffix TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  result_status TEXT,
  was_success INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_created ON gift_card_lookup_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_email ON gift_card_lookup_attempts(lookup_email, created_at DESC);

CREATE TABLE IF NOT EXISTS gift_card_lookup_lockouts (
  gift_card_lookup_lockout_id INTEGER PRIMARY KEY AUTOINCREMENT,
  lookup_email TEXT,
  code_suffix TEXT,
  ip_hash TEXT,
  lockout_status TEXT NOT NULL DEFAULT 'active',
  lockout_reason TEXT,
  locked_by_user_id INTEGER,
  locked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  released_at TEXT,
  notes TEXT,
  FOREIGN KEY (locked_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_lockouts_status ON gift_card_lookup_lockouts(lockout_status, locked_at DESC);

-- Default delivery templates are migration-owned seed data, never GET-owned side effects.
INSERT OR IGNORE INTO gift_card_delivery_templates
  (template_key, subject, body, created_at, updated_at)
VALUES
  ('activation', 'Your Devil n Dove gift card is ready', 'Hi {{recipient_name}},\n\nYour Devil n Dove gift card {{gift_card_code}} is ready. Balance: {{balance}}.\n\nThank you for supporting handmade work.\nDevil n Dove', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('reissue', 'Your Devil n Dove gift card was reissued', 'Hi {{recipient_name}},\n\nWe reissued your Devil n Dove gift card. New code: {{gift_card_code}}. Balance: {{balance}}.\n\nDevil n Dove', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
