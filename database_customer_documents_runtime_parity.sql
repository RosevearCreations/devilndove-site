-- Devil n Dove Build 397
-- Customer Documents fresh-install/runtime schema authority.
-- Owned GET/read paths must not create or repair this schema at request time.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customer_document_sequences (
  document_type TEXT NOT NULL,
  sequence_year INTEGER NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(document_type, sequence_year)
);

CREATE TABLE IF NOT EXISTS customer_documents (
  customer_document_id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_number TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL,
  order_id INTEGER NOT NULL,
  refund_id INTEGER,
  document_status TEXT NOT NULL DEFAULT 'issued',
  currency TEXT NOT NULL DEFAULT 'CAD',
  document_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_adjustment_cents INTEGER NOT NULL DEFAULT 0,
  issue_reason TEXT,
  customer_email TEXT,
  business_name TEXT,
  business_registration_number TEXT,
  source_snapshot_json TEXT NOT NULL,
  issued_by_user_id INTEGER,
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided_by_user_id INTEGER,
  voided_at TEXT,
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
  FOREIGN KEY(refund_id) REFERENCES payment_refunds(refund_id) ON DELETE SET NULL,
  FOREIGN KEY(issued_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(voided_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_order
  ON customer_documents(order_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_documents_type_status
  ON customer_documents(document_type, document_status, issued_at DESC);
