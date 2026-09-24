-- Release 467 Build 250 — exact Development read-only Seller Daily startup probe.
-- One SELECT statement mirrors the runtime summary read; no mutation/DDL.

SELECT
  (SELECT COUNT(*) FROM orders) AS orders_count,
  (SELECT COUNT(*) FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND (COALESCE(on_hand_quantity,0)+COALESCE(incoming_quantity,0))<=COALESCE(reorder_level,0)) AS low_stock_count,
  (SELECT COUNT(*) FROM webhook_events WHERE process_status='failed') AS failed_webhooks_count,
  (SELECT COUNT(*) FROM payment_disputes WHERE dispute_status IN ('open','under_review')) AS open_disputes_count,
  (SELECT COUNT(*) FROM site_search_events WHERE created_at>=datetime('now','-1 day')) AS recent_searches_count,
  (SELECT COUNT(*) FROM site_visitor_sessions WHERE last_seen_at>=datetime('now','-30 minutes')) AS active_visitor_sessions_count;
