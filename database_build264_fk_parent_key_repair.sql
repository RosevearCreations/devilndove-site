-- Devil n Dove — payment_refunds parent-key repair for customer_documents.
-- Run this once if D1 reports:
--   foreign key mismatch - "customer_documents" referencing "payment_refunds"
-- Non-destructive: no rows are deleted or rewritten.

PRAGMA foreign_keys = ON;

-- Diagnostic: this should return zero rows. If it returns rows, stop and
-- inspect those duplicate refund_id values before creating the unique index.
SELECT refund_id, COUNT(*) AS duplicate_count
FROM payment_refunds
WHERE refund_id IS NOT NULL
GROUP BY refund_id
HAVING COUNT(*) > 1;

-- Current Devil n Dove schema defines refund_id as the refund primary key.
-- Older production D1 schema drift can leave the column without a UNIQUE
-- parent-key guarantee, which makes customer_documents' foreign key invalid.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_refunds_refund_id
ON payment_refunds(refund_id);

-- Confirm the required unique index now exists.
SELECT name, sql
FROM sqlite_master
WHERE type='index'
  AND name='uq_payment_refunds_refund_id';

-- Targeted orphan check without invoking database-wide pragma_foreign_key_check.
SELECT COUNT(*) AS orphaned_customer_document_refunds
FROM customer_documents cd
LEFT JOIN payment_refunds pr ON pr.refund_id=cd.refund_id
WHERE cd.refund_id IS NOT NULL
  AND pr.refund_id IS NULL;
