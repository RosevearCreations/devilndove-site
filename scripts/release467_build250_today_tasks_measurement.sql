
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

SELECT task_key, action_status, snooze_until, created_at FROM today_task_actions WHERE task_key='readiness' ORDER BY created_at DESC, today_task_action_id DESC LIMIT 1;
SELECT task_key, action_status, snooze_until, created_at FROM today_task_actions WHERE task_key='custom_requests' ORDER BY created_at DESC, today_task_action_id DESC LIMIT 1;
SELECT task_key, action_status, snooze_until, created_at FROM today_task_actions WHERE task_key='orders' ORDER BY created_at DESC, today_task_action_id DESC LIMIT 1;
SELECT task_key, action_status, snooze_until, created_at FROM today_task_actions WHERE task_key='inventory' ORDER BY created_at DESC, today_task_action_id DESC LIMIT 1;
SELECT task_key, action_status, snooze_until, created_at FROM today_task_actions WHERE task_key='accounting' ORDER BY created_at DESC, today_task_action_id DESC LIMIT 1;
SELECT task_key, action_status, snooze_until, created_at FROM today_task_actions WHERE task_key='failed_api' ORDER BY created_at DESC, today_task_action_id DESC LIMIT 1;
