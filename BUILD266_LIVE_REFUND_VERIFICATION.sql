-- Read-only verification for the Build 266 live payment-refund compatibility repair.
PRAGMA table_info(payment_refunds);
PRAGMA index_list(payment_refunds);

SELECT
  COUNT(*) AS total_refunds,
  SUM(CASE WHEN refund_id IS NULL THEN 1 ELSE 0 END) AS missing_refund_id,
  SUM(CASE WHEN refund_id <> payment_refund_id THEN 1 ELSE 0 END) AS mismatched_refund_id
FROM payment_refunds;

SELECT refund_id, COUNT(*) AS duplicate_count
FROM payment_refunds
GROUP BY refund_id
HAVING COUNT(*) > 1;

SELECT
  cd.customer_document_id,
  cd.refund_id AS document_refund_id
FROM customer_documents cd
LEFT JOIN payment_refunds pr ON pr.refund_id = cd.refund_id
WHERE cd.refund_id IS NOT NULL
  AND pr.refund_id IS NULL
LIMIT 100;
