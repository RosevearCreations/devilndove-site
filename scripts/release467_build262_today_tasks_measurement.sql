-- Release 467 Build 262 — Operations Today-Tasks Read Fan-Out Review.
-- Development-only provider probe. Eight read-only statements mirror the bounded runtime path.

SELECT COUNT(*) AS readiness_count
FROM products
WHERE COALESCE(status,'draft')!='archived'
  AND (COALESCE(featured_image_url,'')='' OR COALESCE(price_cents,0)<=0 OR COALESCE(short_description,'')='');

SELECT COUNT(*) AS custom_requests_count
FROM custom_requests
WHERE COALESCE(status,'new') IN ('new','reviewing','quote_needed');

SELECT COUNT(*) AS orders_count
FROM orders
WHERE COALESCE(order_status,'pending') IN ('pending','paid')
   OR COALESCE(payment_status,'pending')='pending';

SELECT COUNT(*) AS inventory_count
FROM site_item_inventory
WHERE COALESCE(is_active,1)=1
  AND COALESCE(do_not_reorder,0)=0
  AND (COALESCE(is_on_reorder_list,0)=1 OR (COALESCE(reorder_level,0)>0 AND COALESCE(on_hand_quantity,0)<=COALESCE(reorder_level,0)));

SELECT COUNT(*) AS accounting_count
FROM accounting_hst_gst_reviews
WHERE COALESCE(remittance_evidence_url,'')=''
  AND COALESCE(review_status,'draft')!='draft';

SELECT COUNT(*) AS failed_api_count
FROM runtime_incidents
WHERE COALESCE(review_status,'open') NOT IN ('resolved','ignored')
  AND datetime(created_at) >= datetime('now','-7 days');

SELECT runtime_incident_id AS incident_id, incident_code, incident_scope, severity, message, endpoint_path AS request_path, created_at
FROM runtime_incidents
WHERE COALESCE(review_status,'open') NOT IN ('resolved','ignored')
  AND datetime(created_at) >= datetime('now','-7 days')
ORDER BY datetime(created_at) DESC
LIMIT 8;

WITH task_keys(task_key) AS (
  VALUES ('readiness'), ('custom_requests'), ('orders'), ('inventory'), ('accounting'), ('failed_api')
)
SELECT a.task_key, a.action_status, a.snooze_until, a.created_at
FROM task_keys k
JOIN today_task_actions a
  ON a.today_task_action_id = (
    SELECT x.today_task_action_id
    FROM today_task_actions x
    WHERE x.task_key = k.task_key
    ORDER BY x.created_at DESC, x.today_task_action_id DESC
    LIMIT 1
  )
ORDER BY a.task_key;
