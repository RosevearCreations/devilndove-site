-- File: /database_payments_extension.sql
-- Brief description: Payments, webhook, and media-asset schema for the current Devil n Dove build.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS payments (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe', 'square', 'manual', 'other')),
  provider_payment_id TEXT,
  provider_order_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  payment_method_label TEXT,
  transaction_reference TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_events (
  webhook_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL CHECK (provider IN ('paypal', 'stripe', 'square', 'other')),
  provider_event_id TEXT NOT NULL,
  event_type TEXT,
  verification_status TEXT,
  process_status TEXT NOT NULL DEFAULT 'received'
    CHECK (process_status IN ('received', 'processed', 'ignored', 'duplicate', 'failed')),
  related_order_id INTEGER,
  related_payment_id INTEGER,
  payload_json TEXT,
  error_text TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_retry_at TEXT,
  replay_requested_at TEXT,
  replay_requested_by_user_id INTEGER,
  dispatch_notes TEXT,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (related_order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
  FOREIGN KEY (related_payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL,
  UNIQUE(provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS media_assets (
  media_asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  storage_provider TEXT NOT NULL DEFAULT 'r2',
  bucket_name TEXT,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  variant_role TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  annotation_notes TEXT,
  deleted_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status ON webhook_events(provider, process_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_product_id ON media_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_sort_order ON media_assets(product_id, sort_order);

CREATE TABLE IF NOT EXISTS payment_refunds (
  refund_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_refund_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  refund_status TEXT NOT NULL DEFAULT 'recorded' CHECK (refund_status IN ('recorded','requested','submitted','succeeded','failed','cancelled')),
  reason TEXT,
  note TEXT,
  provider_sync_status TEXT,
  provider_sync_note TEXT,
  provider_sync_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_disputes (
  dispute_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_dispute_id TEXT,
  dispute_status TEXT NOT NULL DEFAULT 'open' CHECK (dispute_status IN ('open','under_review','won','lost','closed')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  reason TEXT,
  evidence_due_at TEXT,
  note TEXT,
  provider_sync_status TEXT,
  provider_sync_note TEXT,
  provider_sync_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_order_id ON payment_disputes(order_id, dispute_status);


CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_outbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  destination TEXT,
  related_order_id INTEGER,
  related_payment_id INTEGER,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','retry','sent','failed','cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_order_payment ON notification_outbox(related_order_id, related_payment_id);


-- Current pass note: the initial D1 catalog migration completed successfully for Tools, Supplies, Movies, and Featured Creations.
-- The main Catalog admin page no longer exposes the day-to-day migration panel, while `/api/admin/catalog-sync` remains available for maintenance or reseed recovery only.
