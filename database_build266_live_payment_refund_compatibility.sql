-- Devil n Dove Build 266 — LIVE production refund-key compatibility repair.
-- TARGET ONLY: older production D1 where payment_refunds has payment_refund_id
-- but customer_documents/newer payment code expects payment_refunds.refund_id.
--
-- This migration preserves customer_documents in a temporary persistent backup,
-- repairs the parent key, recreates the FK-valid child table, restores its rows,
-- then removes the backup. It is intentionally specific to the live old schema.

CREATE TABLE customer_documents_build266_backup AS
SELECT * FROM customer_documents;

DROP TABLE customer_documents;

ALTER TABLE payment_refunds ADD COLUMN refund_id INTEGER;

UPDATE payment_refunds
SET refund_id = payment_refund_id
WHERE refund_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_refunds_refund_id
ON payment_refunds(refund_id);

DROP TRIGGER IF EXISTS trg_payment_refunds_sync_refund_id_after_insert;
CREATE TRIGGER trg_payment_refunds_sync_refund_id_after_insert
AFTER INSERT ON payment_refunds
FOR EACH ROW
WHEN NEW.refund_id IS NULL
BEGIN
  UPDATE payment_refunds
  SET refund_id = NEW.payment_refund_id
  WHERE payment_refund_id = NEW.payment_refund_id;
END;

DROP TRIGGER IF EXISTS trg_payment_refunds_protect_refund_id_after_update;
CREATE TRIGGER trg_payment_refunds_protect_refund_id_after_update
AFTER UPDATE OF payment_refund_id ON payment_refunds
FOR EACH ROW
WHEN NEW.refund_id IS NULL OR NEW.refund_id <> NEW.payment_refund_id
BEGIN
  UPDATE payment_refunds
  SET refund_id = NEW.payment_refund_id
  WHERE payment_refund_id = NEW.payment_refund_id;
END;

CREATE TABLE customer_documents (
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
  FOREIGN KEY(refund_id) REFERENCES payment_refunds(refund_id) ON DELETE SET NULL
);

INSERT INTO customer_documents (
  customer_document_id,document_number,document_type,order_id,refund_id,
  document_status,currency,document_amount_cents,tax_adjustment_cents,issue_reason,
  customer_email,business_name,business_registration_number,source_snapshot_json,
  issued_by_user_id,issued_at,voided_by_user_id,voided_at,void_reason,created_at,updated_at
)
SELECT
  customer_document_id,document_number,document_type,order_id,refund_id,
  document_status,currency,document_amount_cents,tax_adjustment_cents,issue_reason,
  customer_email,business_name,business_registration_number,source_snapshot_json,
  issued_by_user_id,issued_at,voided_by_user_id,voided_at,void_reason,created_at,updated_at
FROM customer_documents_build266_backup;

CREATE INDEX IF NOT EXISTS idx_customer_documents_order
ON customer_documents(order_id,issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type_status
ON customer_documents(document_type,document_status,issued_at DESC);

DROP TABLE customer_documents_build266_backup;
