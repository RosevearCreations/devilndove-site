-- File: /database_payments_extension.sql

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

CREATE INDEX IF NOT EXISTS idx_payments_order_id
ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider
ON payments(provider);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
ON payments(provider_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id
ON payments(provider_order_id);
