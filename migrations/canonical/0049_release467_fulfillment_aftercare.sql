-- Build 454: private append-only evidence, never a replacement for canonical orders or provider tracking.
CREATE TABLE IF NOT EXISTS maker_order_fulfillment_evidence (
  evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT,
  event_kind TEXT NOT NULL CHECK(event_kind IN ('packing_review','shipping_receipt','pickup_receipt','damage_hold','return_hold','repair_followup','aftercare_followup')),
  package_instructions TEXT NOT NULL DEFAULT '' CHECK(length(package_instructions)<=1200),
  carrier TEXT NOT NULL DEFAULT '' CHECK(length(carrier)<=120),
  tracking_reference TEXT NOT NULL DEFAULT '' CHECK(length(tracking_reference)<=160),
  receipt_reference TEXT NOT NULL DEFAULT '' CHECK(length(receipt_reference)<=160),
  review_note TEXT NOT NULL CHECK(length(trim(review_note)) BETWEEN 16 AND 1200),
  actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 16 AND 80),
  payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(event_kind<>'shipping_receipt' OR (length(trim(carrier))>0 AND length(trim(tracking_reference))>0 AND length(trim(receipt_reference))>0)),
  CHECK(event_kind<>'pickup_receipt' OR length(trim(receipt_reference))>0)
);
CREATE INDEX IF NOT EXISTS idx_maker_fulfillment_order ON maker_order_fulfillment_evidence(order_id,evidence_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_fulfillment_country BEFORE INSERT ON maker_order_fulfillment_evidence
BEGIN
 SELECT RAISE(ABORT,'fulfillment_requires_canadian_order') WHERE NEW.event_kind IN ('packing_review','shipping_receipt','pickup_receipt')
 AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.order_id=NEW.order_id AND UPPER(COALESCE(o.currency,''))='CAD'
  AND (NEW.event_kind='pickup_receipt' AND LOWER(COALESCE(o.fulfillment_type,''))='pickup'
   OR NEW.event_kind IN ('packing_review','shipping_receipt') AND LOWER(COALESCE(o.fulfillment_type,''))='shipping' AND UPPER(COALESCE(o.shipping_country,''))='CA'));
 SELECT RAISE(ABORT,'fulfillment_order_cancelled') WHERE NEW.event_kind IN ('packing_review','shipping_receipt','pickup_receipt')
 AND EXISTS(SELECT 1 FROM orders o WHERE o.order_id=NEW.order_id AND LOWER(COALESCE(o.order_status,'')) IN ('cancelled','canceled','refunded'));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_fulfillment_immutable BEFORE UPDATE ON maker_order_fulfillment_evidence BEGIN SELECT RAISE(ABORT,'fulfillment_evidence_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_fulfillment_no_delete BEFORE DELETE ON maker_order_fulfillment_evidence BEGIN SELECT RAISE(ABORT,'fulfillment_evidence_append_only'); END;
PRAGMA foreign_key_check;
