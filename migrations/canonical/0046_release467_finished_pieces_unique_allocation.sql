-- Release 467 Build 450: serialised finished pieces and source-linked kit fulfillment.
-- Product.inventory_quantity, product_bundle_components, orders/order_items and the
-- Build 440 stock commitment view remain the ONLY stock/fulfillment authorities.
CREATE TABLE IF NOT EXISTS maker_finished_pieces (
 maker_finished_piece_id INTEGER PRIMARY KEY AUTOINCREMENT,
 serial_code TEXT NOT NULL UNIQUE CHECK(length(trim(serial_code)) BETWEEN 4 AND 90),
 maker_quality_attempt_id INTEGER NOT NULL REFERENCES maker_quality_attempts(maker_quality_attempt_id) ON DELETE RESTRICT,
 product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
 product_finished_inventory_lot_id INTEGER REFERENCES product_finished_inventory_lots(product_finished_inventory_lot_id) ON DELETE RESTRICT,
 variant_label TEXT NOT NULL DEFAULT 'Original' CHECK(length(trim(variant_label))>0),
 edition_label TEXT,
 piece_note TEXT NOT NULL CHECK(length(trim(piece_note))>=12),
 recorded_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_finished_product ON maker_finished_pieces(product_id,maker_finished_piece_id);
CREATE INDEX IF NOT EXISTS idx_maker_finished_attempt ON maker_finished_pieces(maker_quality_attempt_id);
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_piece_source BEFORE INSERT ON maker_finished_pieces BEGIN
 SELECT RAISE(ABORT,'piece_requires_linked_approved_quality') WHERE NOT EXISTS (
  SELECT 1 FROM maker_quality_product_links l JOIN maker_quality_attempts a ON a.maker_quality_attempt_id=l.maker_quality_attempt_id
  WHERE l.product_id=NEW.product_id AND a.maker_quality_attempt_id=NEW.maker_quality_attempt_id
   AND a.outcome IN ('first_quality','second_quality') AND a.safety_state='safe'
   AND (SELECT r.decision FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=a.maker_quality_attempt_id ORDER BY r.maker_quality_release_review_id DESC LIMIT 1)='approved_for_sale');
 SELECT RAISE(ABORT,'piece_requires_tracked_physical_product') WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.product_id=NEW.product_id AND p.product_type='physical'
   AND p.inventory_tracking=1 AND p.inventory_quantity>=1);
 SELECT RAISE(ABORT,'piece_quantity_exceeds_accepted_output') WHERE (
  SELECT COUNT(*) FROM maker_finished_pieces p WHERE p.maker_quality_attempt_id=NEW.maker_quality_attempt_id
 ) + 1 > (SELECT attempted_quantity FROM maker_quality_attempts a WHERE a.maker_quality_attempt_id=NEW.maker_quality_attempt_id);
 SELECT RAISE(ABORT,'piece_quantity_exceeds_canonical_stock') WHERE (
  SELECT COUNT(*) FROM maker_finished_pieces p WHERE p.product_id=NEW.product_id
 ) >= (SELECT inventory_quantity FROM products p WHERE p.product_id=NEW.product_id);
 SELECT RAISE(ABORT,'piece_lot_source_mismatch') WHERE NEW.product_finished_inventory_lot_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM product_finished_inventory_lots l WHERE l.product_finished_inventory_lot_id=NEW.product_finished_inventory_lot_id
   AND l.product_id=NEW.product_id AND l.lot_status='available');
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_pieces_immutable BEFORE UPDATE ON maker_finished_pieces BEGIN SELECT RAISE(ABORT,'finished_piece_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_pieces_no_delete BEFORE DELETE ON maker_finished_pieces BEGIN SELECT RAISE(ABORT,'finished_piece_append_only'); END;

-- Claims are append-only. Reserved = channel hold, released = cancellation, sold =
-- confirmed canonical paid/fulfilled order line. No external provider write exists.
CREATE TABLE IF NOT EXISTS maker_finished_piece_claims (
 maker_finished_piece_claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_finished_piece_id INTEGER NOT NULL REFERENCES maker_finished_pieces(maker_finished_piece_id) ON DELETE RESTRICT,
 action TEXT NOT NULL CHECK(action IN ('reserved','released','sold')),
 channel TEXT NOT NULL CHECK(channel IN ('storefront','etsy','local','other')),
 order_item_id INTEGER UNIQUE REFERENCES order_items(order_item_id) ON DELETE RESTRICT,
 channel_reference TEXT,
 claim_note TEXT NOT NULL CHECK(length(trim(claim_note))>=12),
 recorded_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((action='sold' AND order_item_id IS NOT NULL) OR (action<>'sold' AND order_item_id IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_maker_finished_piece_claims_latest ON maker_finished_piece_claims(maker_finished_piece_id,maker_finished_piece_claim_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_claim_guard BEFORE INSERT ON maker_finished_piece_claims BEGIN
 SELECT RAISE(ABORT,'piece_quality_review_no_longer_approved') WHERE NEW.action IN ('reserved','sold') AND NOT EXISTS (
  SELECT 1 FROM maker_finished_pieces p JOIN maker_quality_release_reviews r ON r.maker_quality_attempt_id=p.maker_quality_attempt_id
  WHERE p.maker_finished_piece_id=NEW.maker_finished_piece_id AND r.decision='approved_for_sale'
   AND r.maker_quality_release_review_id=(SELECT MAX(x.maker_quality_release_review_id) FROM maker_quality_release_reviews x WHERE x.maker_quality_attempt_id=p.maker_quality_attempt_id));
 SELECT RAISE(ABORT,'piece_already_reserved_or_sold') WHERE NEW.action='reserved' AND COALESCE((
  SELECT c.action FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=NEW.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1
 ),'released')<>'released';
 SELECT RAISE(ABORT,'piece_release_requires_reservation') WHERE NEW.action='released' AND COALESCE((
  SELECT c.action FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=NEW.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1
 ),'none')<>'reserved';
 SELECT RAISE(ABORT,'piece_sale_already_claimed') WHERE NEW.action='sold' AND COALESCE((
  SELECT c.action FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=NEW.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1
 ),'none')='sold';
 SELECT RAISE(ABORT,'piece_release_channel_mismatch') WHERE NEW.action='released' AND NEW.channel<>(
  SELECT c.channel FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=NEW.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1);
 SELECT RAISE(ABORT,'piece_sale_requires_matching_paid_order_item') WHERE NEW.action='sold' AND NOT EXISTS (
  SELECT 1 FROM maker_finished_pieces p JOIN order_items oi ON oi.product_id=p.product_id
   JOIN orders o ON o.order_id=oi.order_id
  WHERE p.maker_finished_piece_id=NEW.maker_finished_piece_id AND oi.order_item_id=NEW.order_item_id
   AND oi.quantity=1 AND LOWER(o.order_status) IN ('paid','fulfilled','refunded')
   AND LOWER(COALESCE(o.payment_status,'')) IN ('paid','succeeded','completed','refunded'));
 -- Reservations reserve existing canonical stock capacity but never change quantity.
 SELECT RAISE(ABORT,'piece_allocation_exceeds_stock') WHERE NEW.action='reserved' AND (
  (SELECT COUNT(*) FROM maker_finished_piece_claims c JOIN maker_finished_pieces p ON p.maker_finished_piece_id=c.maker_finished_piece_id
   WHERE p.product_id=(SELECT product_id FROM maker_finished_pieces WHERE maker_finished_piece_id=NEW.maker_finished_piece_id)
    AND c.maker_finished_piece_claim_id=(SELECT MAX(x.maker_finished_piece_claim_id) FROM maker_finished_piece_claims x WHERE x.maker_finished_piece_id=c.maker_finished_piece_id)
    AND c.action IN ('reserved','sold'))
   + COALESCE((SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=(SELECT product_id FROM maker_finished_pieces WHERE maker_finished_piece_id=NEW.maker_finished_piece_id)),0)
 ) >= (SELECT inventory_quantity FROM products WHERE product_id=(SELECT product_id FROM maker_finished_pieces WHERE maker_finished_piece_id=NEW.maker_finished_piece_id));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_claim_immutable BEFORE UPDATE ON maker_finished_piece_claims BEGIN SELECT RAISE(ABORT,'finished_claim_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_claim_no_delete BEFORE DELETE ON maker_finished_piece_claims BEGIN SELECT RAISE(ABORT,'finished_claim_append_only'); END;

-- Every checkout (including a second browser) must respect offsite holds.
-- Existing Build 440 order commitment triggers remain authoritative for other stock.
CREATE TRIGGER IF NOT EXISTS trg_maker_piece_checkout_reservation_guard BEFORE INSERT ON order_items
WHEN NEW.product_id IS NOT NULL AND EXISTS (SELECT 1 FROM maker_finished_pieces WHERE product_id=NEW.product_id)
 AND LOWER(COALESCE((SELECT order_status FROM orders WHERE order_id=NEW.order_id),'pending')) IN ('pending','paid','fulfilled','refunded')
BEGIN
 -- Keep the Build 440 fail-safe: cancel the parent order before rejecting the
 -- line, so a checkout with previously inserted lines is never left pending.
 UPDATE orders SET order_status='cancelled' WHERE order_id=NEW.order_id AND
  COALESCE((SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=NEW.product_id),0)
  + (SELECT COUNT(*) FROM maker_finished_piece_claims c JOIN maker_finished_pieces p ON p.maker_finished_piece_id=c.maker_finished_piece_id
     WHERE p.product_id=NEW.product_id
       AND c.maker_finished_piece_claim_id=(SELECT MAX(x.maker_finished_piece_claim_id) FROM maker_finished_piece_claims x WHERE x.maker_finished_piece_id=c.maker_finished_piece_id)
       AND c.action IN ('reserved','sold')) + NEW.quantity
  > (SELECT COUNT(*) FROM maker_finished_pieces WHERE product_id=NEW.product_id);
 INSERT INTO order_status_history(order_id,old_status,new_status,changed_by_user_id,note,created_at)
 SELECT NEW.order_id,NULL,'cancelled',NULL,'Build 450 cancelled checkout: one-of-one unavailable or reserved in another channel.',CURRENT_TIMESTAMP WHERE changes()=1;
 SELECT CASE WHEN changes()=1 THEN RAISE(FAIL,'piece_reserved_elsewhere_or_unserialized') END;
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_piece_quantity_guard BEFORE UPDATE OF inventory_quantity ON products
WHEN EXISTS(SELECT 1 FROM maker_finished_pieces WHERE product_id=NEW.product_id) BEGIN
 SELECT RAISE(ABORT,'piece_registered_quantity_exceeds_stock') WHERE NEW.inventory_quantity<(
  SELECT COUNT(*) FROM maker_finished_pieces WHERE product_id=NEW.product_id);
END;

-- A kit receipt references real component order lines already committed by checkout.
-- Neither inserting nor reviewing it changes Product, kit reservations or stock.
CREATE TABLE IF NOT EXISTS maker_finished_kit_component_links (
 maker_finished_kit_component_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
 kit_order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id) ON DELETE RESTRICT,
 component_order_item_id INTEGER NOT NULL UNIQUE REFERENCES order_items(order_item_id) ON DELETE RESTRICT,
 linked_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 link_note TEXT NOT NULL CHECK(length(trim(link_note))>=12),
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(kit_order_item_id,component_order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_maker_finished_kit_lines ON maker_finished_kit_component_links(kit_order_item_id);
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_kit_link_guard BEFORE INSERT ON maker_finished_kit_component_links BEGIN
 SELECT RAISE(ABORT,'kit_requires_real_component_order_line') WHERE NOT EXISTS (
  SELECT 1 FROM order_items kit JOIN order_items component ON component.order_id=kit.order_id
   JOIN product_bundle_components bc ON bc.bundle_product_id=kit.product_id AND bc.component_product_id=component.product_id
  WHERE kit.order_item_id=NEW.kit_order_item_id AND component.order_item_id=NEW.component_order_item_id
   AND kit.order_item_id<>component.order_item_id AND kit.quantity>0 AND component.quantity>0
   AND component.quantity<=bc.quantity_per_bundle*kit.quantity);
 SELECT RAISE(ABORT,'kit_component_quantity_exceeds_template') WHERE (
  SELECT COALESCE(SUM(component.quantity),0) FROM maker_finished_kit_component_links l JOIN order_items component ON component.order_item_id=l.component_order_item_id
  WHERE l.kit_order_item_id=NEW.kit_order_item_id AND component.product_id=(SELECT product_id FROM order_items WHERE order_item_id=NEW.component_order_item_id)
 ) + (SELECT quantity FROM order_items WHERE order_item_id=NEW.component_order_item_id) > (
  SELECT bc.quantity_per_bundle*kit.quantity FROM order_items kit JOIN product_bundle_components bc ON bc.bundle_product_id=kit.product_id
  WHERE kit.order_item_id=NEW.kit_order_item_id AND bc.component_product_id=(SELECT product_id FROM order_items WHERE order_item_id=NEW.component_order_item_id));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_kit_immutable BEFORE UPDATE ON maker_finished_kit_component_links BEGIN SELECT RAISE(ABORT,'kit_link_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_finished_kit_no_delete BEFORE DELETE ON maker_finished_kit_component_links BEGIN SELECT RAISE(ABORT,'kit_link_append_only'); END;

-- Optional serialised products show only available actual units. Conventional
-- catalogue Products remain governed by Build 440 without extra D1 mutations.
CREATE VIEW IF NOT EXISTS maker_finished_piece_sellability AS
SELECT p.product_id,
 COUNT(*) serialised_quantity,
 SUM(CASE WHEN COALESCE((SELECT c.action FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=u.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1),'released') IN ('reserved','sold')
  OR (SELECT r.decision FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=u.maker_quality_attempt_id ORDER BY r.maker_quality_release_review_id DESC LIMIT 1)<>'approved_for_sale'
  THEN 1 ELSE 0 END) unavailable_quantity,
 COALESCE((SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=p.product_id),0) canonical_order_committed_quantity,
 MAX(0,COUNT(*)-SUM(CASE WHEN COALESCE((SELECT c.action FROM maker_finished_piece_claims c WHERE c.maker_finished_piece_id=u.maker_finished_piece_id ORDER BY c.maker_finished_piece_claim_id DESC LIMIT 1),'released') IN ('reserved','sold')
  OR (SELECT r.decision FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=u.maker_quality_attempt_id ORDER BY r.maker_quality_release_review_id DESC LIMIT 1)<>'approved_for_sale'
  THEN 1 ELSE 0 END)-COALESCE((SELECT committed_quantity FROM product_inventory_active_commitments WHERE product_id=p.product_id),0)) available_quantity
FROM maker_finished_pieces u JOIN products p ON p.product_id=u.product_id
GROUP BY p.product_id;
SELECT COUNT(*) AS build450_finished_tables FROM sqlite_master WHERE type='table' AND name LIKE 'maker_finished_%';
PRAGMA foreign_key_check;
