-- Release 467 Build 216 — Customer-Supplied Item Intake & Suitability Review
-- Extends the existing Custom Work, reference-upload, stage-photo and Build 211 triage authorities.
-- No media objects, triage decisions, orders, payments, Inventory movements or provider actions are created by this migration.

CREATE TABLE IF NOT EXISTS custom_request_supplied_items (
  custom_request_supplied_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL,
  item_key TEXT NOT NULL UNIQUE,
  item_label TEXT NOT NULL,
  item_description TEXT,
  ownership_status TEXT NOT NULL DEFAULT 'unconfirmed'
    CHECK(ownership_status IN ('unconfirmed','customer_owned','authorized_agent','unknown')),
  ownership_notes TEXT,
  material_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK(material_status IN ('unknown','customer_stated','staff_observed')),
  material_description TEXT,
  finish_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK(finish_status IN ('unknown','customer_stated','staff_observed')),
  finish_description TEXT,
  requested_modification TEXT,
  intake_condition_notes TEXT,
  workflow_status TEXT NOT NULL DEFAULT 'intake'
    CHECK(workflow_status IN ('intake','reviewing','accepted','limitations_pending','limitations_acknowledged','declined','work_complete','returned','closed')),
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_request_supplied_items_request
  ON custom_request_supplied_items(custom_request_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS custom_request_supplied_item_reviews (
  custom_request_supplied_item_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_supplied_item_id INTEGER NOT NULL,
  custom_request_id INTEGER NOT NULL,
  custom_request_manufacturing_triage_id INTEGER,
  decision TEXT NOT NULL DEFAULT 'needs_review'
    CHECK(decision IN ('needs_review','accepted','accepted_with_limitations','declined')),
  process_compatibility_notes TEXT,
  material_unknowns TEXT,
  safety_unknowns TEXT,
  limitations_text TEXT,
  review_note TEXT,
  supersedes_review_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_supplied_item_id) REFERENCES custom_request_supplied_items(custom_request_supplied_item_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_manufacturing_triage_id) REFERENCES custom_request_manufacturing_triage(custom_request_manufacturing_triage_id) ON DELETE SET NULL,
  FOREIGN KEY(supersedes_review_id) REFERENCES custom_request_supplied_item_reviews(custom_request_supplied_item_review_id) ON DELETE SET NULL,
  CHECK(decision <> 'accepted_with_limitations' OR length(trim(COALESCE(limitations_text,''))) > 0)
);

CREATE INDEX IF NOT EXISTS idx_custom_request_supplied_item_reviews_item
  ON custom_request_supplied_item_reviews(custom_request_supplied_item_id, reviewed_at DESC, custom_request_supplied_item_review_id DESC);
CREATE INDEX IF NOT EXISTS idx_custom_request_supplied_item_reviews_request
  ON custom_request_supplied_item_reviews(custom_request_id, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS custom_request_supplied_item_evidence (
  custom_request_supplied_item_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_supplied_item_id INTEGER NOT NULL,
  custom_request_id INTEGER NOT NULL,
  evidence_role TEXT NOT NULL
    CHECK(evidence_role IN ('intake_condition','post_work_condition','other')),
  custom_request_reference_upload_id INTEGER,
  custom_order_stage_photo_id INTEGER,
  evidence_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_supplied_item_id) REFERENCES custom_request_supplied_items(custom_request_supplied_item_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_reference_upload_id) REFERENCES custom_request_reference_uploads(custom_request_reference_upload_id) ON DELETE SET NULL,
  FOREIGN KEY(custom_order_stage_photo_id) REFERENCES custom_order_stage_photos(custom_order_stage_photo_id) ON DELETE SET NULL,
  CHECK(
    (custom_request_reference_upload_id IS NOT NULL AND custom_order_stage_photo_id IS NULL) OR
    (custom_request_reference_upload_id IS NULL AND custom_order_stage_photo_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_custom_request_supplied_item_evidence_item
  ON custom_request_supplied_item_evidence(custom_request_supplied_item_id, evidence_role, created_at DESC);

CREATE TABLE IF NOT EXISTS custom_request_supplied_item_acknowledgements (
  custom_request_supplied_item_acknowledgement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_supplied_item_id INTEGER NOT NULL,
  custom_request_supplied_item_review_id INTEGER NOT NULL,
  custom_request_id INTEGER NOT NULL,
  acknowledgement_token TEXT NOT NULL UNIQUE,
  acknowledgement_status TEXT NOT NULL DEFAULT 'active'
    CHECK(acknowledgement_status IN ('active','acknowledged','declined','superseded','expired')),
  customer_name TEXT,
  customer_email TEXT,
  ownership_snapshot TEXT,
  limitations_snapshot TEXT NOT NULL,
  expires_at TEXT,
  acknowledged_at TEXT,
  declined_at TEXT,
  customer_response_note TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(custom_request_supplied_item_id) REFERENCES custom_request_supplied_items(custom_request_supplied_item_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_supplied_item_review_id) REFERENCES custom_request_supplied_item_reviews(custom_request_supplied_item_review_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_custom_request_supplied_item_ack_token
  ON custom_request_supplied_item_acknowledgements(acknowledgement_token, acknowledgement_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_request_supplied_item_ack_active
  ON custom_request_supplied_item_acknowledgements(custom_request_supplied_item_id)
  WHERE acknowledgement_status='active';

-- Migration creates no supplied-item business rows or media.
SELECT COUNT(*) AS build216_supplied_item_tables
FROM sqlite_master
WHERE type='table'
  AND name IN (
    'custom_request_supplied_items',
    'custom_request_supplied_item_reviews',
    'custom_request_supplied_item_evidence',
    'custom_request_supplied_item_acknowledgements'
  );
PRAGMA foreign_key_check;
